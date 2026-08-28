"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("kalimon291@gmail.com");
  const [password, setPassword] = useState("admin");
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
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });

      router.push("/admin");
    } catch (err: any) {
      const msg = err.message || "Failed to sign in. Please verify your credentials.";
      setError(msg);
      toast.error("Sign In Failed", {
        description: msg,
        icon: <ShieldAlert className="size-4 text-rose-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-4xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="identifier" className="text-sm font-medium">
          Admin Email or Phone
        </Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="admin@meditouch.com or +8801999999999"
          required
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          className="h-10"
        />
      </div>

      <Button type="submit" className="h-10 w-full" disabled={loading}>
        {loading ? <Spinner className="mr-2" /> : null}
        Sign In to Admin Portal
      </Button>
    </form>
  );
}
