'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Send,
  Loader2,
  MessageSquare,
  User,
  Headphones,
} from 'lucide-react'
import { sendMessage } from '../actions'

type Message = {
  id: string
  message: string
  sender_id: string
  created_at: string
}

type Ticket = {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
}

export default function TicketChat({
  ticket,
  messages: initialMessages,
  currentUserId,
}: {
  ticket: Ticket
  messages: Message[]
  currentUserId: string
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const text = input.trim()
    setInput('')
    setSending(true)

    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      message: text,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const result = await sendMessage({ ticketId: ticket.id, message: text })

    if (!result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    }

    setSending(false)
  }

  const statusStyles: Record<string, string> = {
    open: 'bg-blue-500/10 text-blue-500',
    in_progress: 'bg-yellow-500/10 text-yellow-500',
    resolved: 'bg-green-500/10 text-green-500',
    closed: 'bg-gray-500/10 text-gray-500',
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-6 sm:px-6 lg:px-8" style={{ minHeight: '100vh' }}>
      <div className="mb-4">
        <Link
          href="/support"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Support
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
              Ticket #{ticket.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              statusStyles[ticket.status] ?? statusStyles.open
            }`}
          >
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="h-[calc(100vh-340px)] min-h-[300px] space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageSquare className="h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                No messages yet
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === currentUserId
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${
                    isMine ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isMine
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {isMine ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Headphones className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'bg-[var(--muted)] text-[var(--foreground)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{m.message}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isMine ? 'text-[var(--accent-foreground)]/70' : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {new Date(m.created_at).toLocaleTimeString('en-AE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {ticket.status !== 'closed' && (
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-[var(--border)] p-3 sm:p-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
              aria-label="Send"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}