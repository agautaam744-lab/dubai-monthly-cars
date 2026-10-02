"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({
  isTransparent = false,
  label,
  fullWidth = false,
}: {
  isTransparent?: boolean;
  label?: string;
  fullWidth?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Logout"
      title="Logout"
      className={[
        "flex min-h-[44px] items-center justify-center gap-2 rounded-lg transition-colors",
        fullWidth ? "w-full px-4" : "min-w-[44px] px-3",
        isTransparent
          ? "text-white hover:bg-white/10"
          : "text-[var(--foreground)] hover:bg-[var(--muted)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
      ].join(" ")}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-5 w-5" aria-hidden="true" />
      )}
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </button>
  );
}