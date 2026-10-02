import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'finance', 'fleet_manager']
  if (!profile || !adminRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('invoices')
    .select(`
      invoice_number,
      issued_at,
      paid_at,
      subtotal_aed,
      vat_aed,
      total_aed,
      vat_rate,
      status,
      customer_snapshot,
      bookings (
        id,
        start_date,
        duration_months,
        vehicles ( make, model, plate_number )
      )
    `)
    .eq('status', 'paid')
    .order('issued_at', { ascending: false })

  if (from) query = query.gte('issued_at', from)
  if (to) query = query.lte('issued_at', to)

  const { data: invoices, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const headers = [
    'Invoice Number',
    'Issue Date',
    'Paid Date',
    'Customer Name',
    'Customer Email',
    'Vehicle',
    'Plate',
    'Rental Start',
    'Duration (Months)',
    'Subtotal (AED)',
    'VAT Rate (%)',
    'VAT Amount (AED)',
    'Total (AED)',
    'Status',
  ]

  const rows = (invoices ?? []).map((inv) => {
    const bookingRaw = Array.isArray(inv.bookings) ? inv.bookings[0] : inv.bookings
    const vehicleRaw = firstOrSelf(bookingRaw?.vehicles)
    const customer = inv.customer_snapshot as {
      full_name?: string
      email?: string
    } | null

    return [
      inv.invoice_number,
      inv.issued_at ? new Date(inv.issued_at).toISOString().slice(0, 10) : '',
      inv.paid_at ? new Date(inv.paid_at).toISOString().slice(0, 10) : '',
      customer?.full_name ?? '',
      customer?.email ?? '',
      vehicleRaw ? `${vehicleRaw.make} ${vehicleRaw.model}` : '',
      vehicleRaw?.plate_number ?? '',
      bookingRaw?.start_date ?? '',
      bookingRaw?.duration_months ?? '',
      Number(inv.subtotal_aed).toFixed(2),
      Number(inv.vat_rate).toFixed(2),
      Number(inv.vat_aed).toFixed(2),
      Number(inv.total_aed).toFixed(2),
      inv.status,
    ]
  })

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const filename = `vat-export-${from ?? 'all'}-to-${to ?? 'now'}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}