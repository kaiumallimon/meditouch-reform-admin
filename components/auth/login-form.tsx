"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.login(identifier, password);
      
      if (data.role !== "ADMIN") {
        throw new Error("Access Denied: This portal is restricted to platform administrators only.");
      }

      saveSession(
        {
          id: data.user_id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          role: data.role,
        },
        data.access_token,
        data.refresh_token
      );

      toast.success("Welcome back!", {
        description: `Signed in as ${data.name}`,
        icon: <CheckCircle2 className="size-4 text-emerald-600" />,
      });

      router.push("/admin");
    } catch (err: any) {
      const msg = err.message || "Failed to sign in. Please verify your credentials.";
      setError(msg);
      toast.error("Sign In Failed", {
        description: msg,
        icon: <ShieldAlert className="size-4 text-rose-600" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border-[1.5px] border-rose-900 bg-rose-50 p-2.5 text-xs font-medium text-rose-900 shadow-[2px_2px_0px_0px_#881337]">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-wider text-stone-800">
          Admin Email or Phone
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="admin@meditouch.com"
          required
          className="w-full h-10 rounded-xl px-3.5 text-xs text-stone-900 placeholder:text-stone-400 neo-input outline-hidden"
        />
        <p className="text-[10px] text-stone-500 font-medium">Use your registered admin identifier</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-stone-800">
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            className="w-full h-10 rounded-xl pl-3.5 pr-10 text-xs text-stone-900 placeholder:text-stone-400 neo-input outline-hidden"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 transition-colors p-1"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10.5 rounded-xl bg-[#5b15fc] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 neo-button cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4d0ee0]"
        >
          {loading ? (
            <Spinner className="size-4 text-white" />
          ) : (
            <>
              <span>Sign In to Admin Portal</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
