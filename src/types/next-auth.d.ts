// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      name: string;
      phone?: string;
      hasPassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "user" | "admin";
    phone?: string;
    hasPassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin";
    name: string;
    phone?: string;
    hasPassword?: boolean;
  }
}