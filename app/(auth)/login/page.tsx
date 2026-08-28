import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { Stethoscope, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm rounded-4xl">
      <CardHeader className="items-center justify-items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-4xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </div>
          <span className="font-heading text-xl font-semibold tracking-tight">MediTouch</span>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to the Admin Portal to continue
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          <LoginForm />
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>Restricted to authorized MediTouch personnel</span>
        </div>
      </CardContent>
    </Card>
  );
}

