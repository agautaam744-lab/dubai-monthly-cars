'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({
  text,
  label = 'Copy',
  variant = 'default',
}: {
  text: string
  label?: string
  variant?: 'default' | 'icon'
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard failures silently
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  )
}