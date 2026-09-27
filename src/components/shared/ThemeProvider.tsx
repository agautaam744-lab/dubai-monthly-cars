'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// next-themes renders an inline <script> to prevent a flash of the wrong
// theme before hydration. React 19 warns whenever a <script> tag is
// rendered inside a component — the script still runs correctly during
// SSR, so this warning is a known false positive for next-themes
// (see https://github.com/shadcn-ui/ui/issues/10104). Silencing just this
// one message in development so it doesn't trigger the Next.js error overlay.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return
    orig.apply(console, args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}