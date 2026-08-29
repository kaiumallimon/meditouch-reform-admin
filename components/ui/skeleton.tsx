import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoaded?: boolean;
}

export function Skeleton({ className, isLoaded, children, ...props }: SkeletonProps) {
  if (isLoaded) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-stone-200/75 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Skeleton;
