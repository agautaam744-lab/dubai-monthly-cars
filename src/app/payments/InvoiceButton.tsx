"use client";

import { FileText } from "lucide-react";

export default function InvoiceButton({ paymentId }: { paymentId: string }) {
  return (
    <a
      href={`/api/payments/${paymentId}/invoice`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
    >
      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
      Invoice
    </a>
  );
}