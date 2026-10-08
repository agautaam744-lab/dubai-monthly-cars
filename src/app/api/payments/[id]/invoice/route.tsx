import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      customer_id,
      payment_id,
      invoice_number,
      subtotal_aed,
      vat_aed,
      total_aed,
      vat_rate,
      status,
      issued_at,
      paid_at,
      line_items,
      customer_snapshot,
      bookings (
        id,
        customer_id,
        start_date,
        duration_months,
        vehicles ( make, model, year )
      )
    `
    )
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Ownership check: owner or staff only (prevents IDOR via guessed UUID).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const staffRoles = ["super_admin", "admin", "finance", "support"];
  const isStaff = !!profile && staffRoles.includes(profile.role);
  const bookingCustomerId = Array.isArray(invoice.bookings)
    ? invoice.bookings[0]?.customer_id
    : (invoice.bookings as { customer_id?: string } | null)?.customer_id;

  if (
    invoice.customer_id !== user.id &&
    bookingCustomerId !== user.id &&
    !isStaff
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <InvoiceDocument invoice={invoice as any} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}