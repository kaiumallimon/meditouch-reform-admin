import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { ShieldCheck, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm neo-card rounded-[22px] p-7 transition-all">
      {/* Top Brand & Status Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#FF6B4A] ring-2 ring-[#FF6B4A]/20 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800">Admin Workspace</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500">
          <Lock className="size-3 text-stone-600" />
          <span>v1.0</span>
        </div>
      </div>

      {/* Centered Logo & Header */}
      <div className="pt-5 pb-3 text-center space-y-3">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="MediTouch"
            width={170}
            height={55}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-normal text-stone-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Sign in to access your administrative controls
          </p>
        </div>
      </div>

      {/* Login Form */}
      <div className="mt-3">
        <LoginForm />
      </div>

      {/* Footer Note */}
      <div className="mt-5 pt-3 border-t border-stone-200/80 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
          <ShieldCheck className="size-3.5 text-stone-700" />
          <span>Restricted to authorized MediTouch personnel</span>
        </div>
      </div>
    </div>
  );
}
