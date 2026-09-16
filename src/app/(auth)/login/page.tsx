import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen py-12 px-4 flex items-center justify-center bg-gradient-to-br from-[#fdf2f2]/60 via-[#f8fafc] to-[#fff7ed]/50 relative overflow-hidden">
      {/* Soft ambient background glows */}
      <div className="absolute top-10 left-10 size-96 bg-[#9D1C20]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 size-96 bg-[#C59B27]/5 rounded-full blur-[140px] pointer-events-none" />

      <Suspense fallback={<div className="text-sm font-medium text-slate-400">Loading...</div>}>
         <LoginForm />
      </Suspense>
    </main>
  );
}
