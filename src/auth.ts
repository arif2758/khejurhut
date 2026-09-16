// src/auth.ts
import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import type { IUser } from "@/types/user";
import bcrypt from "bcryptjs";
import { z } from "zod";
import mongoose from "mongoose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase().trim() }).lean<
          IUser & { _id: mongoose.Types.ObjectId }
        >();

        if (!user) {
          throw new CredentialsSignin("InvalidCredentials");
        }

        if (!user.password) {
          throw new CredentialsSignin("SocialAccountNoPassword");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new CredentialsSignin("InvalidCredentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || "user",
          phone: user.phone,
          hasPassword: true,
        };
      },
    }),
  ],
  callbacks: {
    // ✅ 1. Google বা OAuth লগইনে Mongoose User কালেকশনে সিঙ্ক ও অটো-ক্রিয়েশন
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        await dbConnect();
        const email = user.email.toLowerCase().trim();
        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          // ✅ একক 'users' কালেকশনে Mongoose মডেল দিয়ে তৈরি — রোল ও সব ডিফল্ট পেয়ে যাবে
          dbUser = await User.create({
            name: user.name || profile?.name || "Google User",
            email,
            image: user.image || (profile as { picture?: string })?.picture,
            role: "user",
            emailVerified: new Date(),
            addresses: [],
            wishlist: [],
            lastLogin: new Date(),
            providers: ["google"],
          });
        } else {
          // বিদ্যমান ইউজার হলে মেটাডাটা আপডেট
          let hasUpdates = false;
          if (!dbUser.image && (user.image || (profile as { picture?: string })?.picture)) {
            dbUser.image = user.image || (profile as { picture?: string })?.picture;
            hasUpdates = true;
          }
          if (!dbUser.emailVerified) {
            dbUser.emailVerified = new Date();
            hasUpdates = true;
          }
          if (!dbUser.providers?.includes("google")) {
            dbUser.providers = [...(dbUser.providers || []), "google"];
            hasUpdates = true;
          }
          dbUser.lastLogin = new Date();
          hasUpdates = true;

          if (hasUpdates) {
            await dbUser.save();
          }
        }

        // টোকেনে পাঠানোর জন্য আইডি ও রোল সেট
        user.id = dbUser._id.toString();
        user.role = dbUser.role || "user";
      }

      return true;
    },

    // ✅ 2. JWT কলব্যাক: সবসময় DB থেকে নির্ভরযোগ্য ডাটা রিফ্রেশ
    async jwt({ token, user, trigger }) {
      await dbConnect();

      const searchEmail = (user?.email || token?.email)?.toLowerCase().trim();

      if (searchEmail) {
        const dbUser = await User.findOne({ email: searchEmail }).lean<
          IUser & { _id: mongoose.Types.ObjectId }
        >();

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role || "user";
          token.name = dbUser.name;
          token.image = dbUser.image;
          token.phone = dbUser.phone;
          token.hasPassword = Boolean(dbUser.password);
        } else if (user?.id) {
          token.id = user.id;
          token.role = (user as { role?: "user" | "admin" }).role || "user";
          token.name = user.name || token.name;
        }
      }

      return token;
    },

    // ✅ 3. সেশন অবজেক্টে ফিল্ডগুলো সংযুক্তকরণ
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "admin") || "user";
        session.user.name = token.name as string;
        if (token.image) session.user.image = token.image as string;
        if (token.phone) session.user.phone = token.phone as string;
        session.user.hasPassword = token.hasPassword as boolean;
      }
      return session;
    },
  },
  events: {
    // ✅ লগইন সম্পন্ন হলে গেস্ট কার্ট ও পূর্বের গেস্ট অর্ডার লিঙ্ক
    async signIn({ user }) {
      if (user?.id) {
        try {
          const { mergeGuestCartToUser } = await import("@/actions/cart");
          await mergeGuestCartToUser(user.id);
        } catch (err) {
          console.error("Failed to merge guest cart on signIn:", err);
        }

        try {
          const User = (await import("@/models/User")).default;
          const Order = (await import("@/models/Order")).default;
          const dbUser = await User.findById(user.id).select("phone").lean<{ phone?: string }>();
          if (dbUser?.phone) {
            await Order.updateMany(
              { user: { $exists: false }, customerPhone: dbUser.phone },
              { user: user.id }
            );
          }
        } catch (err) {
          console.error("Failed to link guest orders on signIn:", err);
        }
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});

