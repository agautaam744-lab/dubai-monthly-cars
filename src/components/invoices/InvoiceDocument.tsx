import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#D4AF37",
    paddingBottom: 16,
    marginBottom: 20,
  },
  brand: { fontSize: 20, fontWeight: "bold", color: "#050505", letterSpacing: 0.5 },
  brandSub: { fontSize: 9, color: "#666", marginTop: 3 },
  invoiceTitle: { fontSize: 22, fontWeight: "bold", color: "#D4AF37", textAlign: "right" },
  invoiceMeta: { textAlign: "right", fontSize: 9, color: "#666", marginTop: 3 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    color: "#D4AF37",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 4,
    width: 240,
  },
  totalLabel: { flex: 1, color: "#555", textAlign: "right", paddingRight: 12 },
  totalValue: { width: 100, textAlign: "right" },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#D4AF37",
    marginTop: 6,
    width: 240,
  },
  grandLabel: { flex: 1, textAlign: "right", paddingRight: 12, fontSize: 12, fontWeight: "bold" },
  grandValue: { width: 100, textAlign: "right", fontSize: 12, fontWeight: "bold", color: "#D4AF37" },
  status: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#ecfdf5",
    color: "#059669",
    fontSize: 9,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 10,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
});

type VehicleInfo = {
  make: string;
  model: string;
  year: number | null;
};

type InvoiceData = {
  invoice_number: string;
  subtotal_aed: number | string;
  vat_aed: number | string;
  total_aed: number | string;
  vat_rate: number | string;
  status: string;
  issued_at: string;
  paid_at: string | null;
  line_items: { description: string; amount_aed: number | string }[];
  customer_snapshot: {
    full_name?: string;
    email?: string;
    phone?: string;
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings: any;
};

function extractVehicle(booking: unknown): VehicleInfo | null {
  if (!booking || typeof booking !== "object") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (booking as any).vehicles;
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] as VehicleInfo) ?? null;
  return v as VehicleInfo;
}

function extractBooking(bookings: unknown): { start_date?: string; duration_months?: number } | null {
  if (!bookings) return null;
  if (Array.isArray(bookings)) return bookings[0] ?? null;
  return bookings as { start_date?: string; duration_months?: number };
}

function formatAED(value: number | string) {
  return "AED " + new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(Number(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const bookingRaw = extractBooking(invoice.bookings);
  const vehicleRaw = extractVehicle(bookingRaw);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>DUBAI MONTHLY CARS</Text>
            <Text style={styles.brandSub}>Premium monthly car rental</Text>
            <Text style={styles.brandSub}>TRN: 100XXXXXXXXXXX</Text>
            <Text style={styles.brandSub}>Dubai, United Arab Emirates</Text>
            <Text style={styles.brandSub}>hello@dubaimonthlycars.ae</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceMeta}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Issued: {formatDate(invoice.issued_at)}</Text>
            {invoice.paid_at && (
              <Text style={styles.invoiceMeta}>Paid: {formatDate(invoice.paid_at)}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billed To</Text>
          <Text style={{ fontWeight: "bold", marginBottom: 2 }}>
            {invoice.customer_snapshot?.full_name || "Customer"}
          </Text>
          {invoice.customer_snapshot?.email && (
            <Text style={{ color: "#555" }}>{invoice.customer_snapshot.email}</Text>
          )}
          {invoice.customer_snapshot?.phone && (
            <Text style={{ color: "#555" }}>{invoice.customer_snapshot.phone}</Text>
          )}
        </View>

        {vehicleRaw && bookingRaw && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Details</Text>
            <Text>
              {vehicleRaw.make} {vehicleRaw.model}
              {vehicleRaw.year ? " (" + vehicleRaw.year + ")" : ""}
            </Text>
            <Text style={{ color: "#555", marginTop: 2 }}>
              Start: {formatDate(bookingRaw.start_date)} - Duration: {bookingRaw.duration_months ?? 0} month
              {(bookingRaw.duration_months ?? 0) > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, { fontWeight: "bold" }]}>Description</Text>
            <Text style={[styles.col2, { fontWeight: "bold" }]}>Amount</Text>
          </View>
          {invoice.line_items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.col1}>{String(item.description).replace(/_/g, " ")}</Text>
              <Text style={styles.col2}>{formatAED(item.amount_aed)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal (excl. VAT)</Text>
            <Text style={styles.totalValue}>{formatAED(invoice.subtotal_aed)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT ({invoice.vat_rate}%)</Text>
            <Text style={styles.totalValue}>{formatAED(invoice.vat_aed)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatAED(invoice.total_aed)}</Text>
          </View>
          {invoice.status === "paid" && <Text style={styles.status}>PAID</Text>}
        </View>

        <Text style={styles.footer}>
          This is a computer-generated invoice. For questions, contact hello@dubaimonthlycars.ae
        </Text>
      </Page>
    </Document>
  );
}