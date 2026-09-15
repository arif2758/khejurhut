import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen py-20 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Background ambient glows for depth */}
      <div className="absolute top-1/4 left-1/4 size-96 bg-[#1A0101]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-96 bg-[#C59B27]/10 rounded-full blur-[140px] pointer-events-none" />

      <Suspense fallback={<div className="text-sm font-bold opacity-20">Loading...</div>}>
         <LoginForm />
      </Suspense>
    </main>
  );
}
