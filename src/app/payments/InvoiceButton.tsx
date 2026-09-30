'use client'

import { Printer } from 'lucide-react'

export default function InvoiceButton({ paymentId }: { paymentId: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      title={`Invoice ${paymentId.slice(0, 8).toUpperCase()}`}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold transition hover:bg-[var(--muted)] print:hidden"
    >
      <Printer className="h-3.5 w-3.5" />
      Invoice
    </button>
  )
}
