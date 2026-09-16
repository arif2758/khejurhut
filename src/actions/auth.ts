"use server";

import { z } from "zod";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signOut } from "@/auth";

const RegisterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUp(formData: z.infer<typeof RegisterSchema>) {
  try {
    const validated = RegisterSchema.safeParse(formData);
    if (!validated.success) {
      return { error: "তথ্য যাচাইকরণে ত্রুটি হয়েছে", details: validated.error.flatten() };
    }

    const { name, email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // ✅ যদি আগে গুগল দিয়ে লগইন করার কারণে পাসওয়ার্ড না থাকে, তবে পাসওয়ার্ড যুক্ত করে অ্যাকাউন্ট মার্জ করো
      if (!existingUser.password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        existingUser.password = hashedPassword;
        if (!existingUser.name && name) existingUser.name = name;
        if (!existingUser.providers?.includes("credentials")) {
          existingUser.providers = [...(existingUser.providers || []), "credentials"];
        }
        await existingUser.save();

        return {
          success: true,
          message: "আপনার অ্যাকাউন্টের সাথে পাসওয়ার্ড সফলভাবে যুক্ত হয়েছে!",
        };
      }

      return { error: "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে লগইন করুন।" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      providers: ["credentials"],
    });

    await newUser.save();

    return {
      success: true,
      message: "রেজিস্ট্রেশন সফল হয়েছে! লগইন হচ্ছে...",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "সার্ভার এরর। অনুগ্রহ করে আবার চেষ্টা করুন।" };
  }
}

export async function checkUserStatus(email: string) {
  try {
    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("password");
    if (!user) return { exists: false };
    if (!user.password) return { exists: true, socialOnly: true };
    return { exists: true, socialOnly: false };
  } catch (error) {
    return { error: `Error checking user ${error}` };
  }
}

export async function changeOrSetPassword(data: {
  currentPassword?: string;
  newPassword: string;
}) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "অননুমোদিত এক্সেস। অনুগ্রহ করে লগইন করুন।" };
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      return { error: "নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" };
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "ইউজার খুঁজে পাওয়া যায়নি।" };
    }

    // যদি ব্যবহারকারীর পূর্বেই পাসওয়ার্ড থাকে, তবে বর্তমান পাসওয়ার্ড যাচাই আবশ্যক
    if (user.password) {
      if (!data.currentPassword) {
        return { error: "বর্তমান পাসওয়ার্ড প্রদান করুন।" };
      }
      const isMatch = await bcrypt.compare(data.currentPassword, user.password);
      if (!isMatch) {
        return { error: "বর্তমান পাসওয়ার্ডটি সঠিক নয়।" };
      }
    }

    // নতুন পাসওয়ার্ড হ্যাশ করে সংরক্ষণ
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    user.password = hashedPassword;
    if (!user.providers?.includes("credentials")) {
      user.providers = [...(user.providers || []), "credentials"];
    }
    await user.save();

    return {
      success: true,
      message: user.password
        ? "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!"
        : "নতুন পাসওয়ার্ড সফলভাবে সেট করা হয়েছে!",
    };
  } catch (error) {
    console.error("Password update error:", error);
    return { error: "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

