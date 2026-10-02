"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}