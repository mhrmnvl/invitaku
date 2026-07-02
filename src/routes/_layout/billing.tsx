import { createFileRoute, useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import {
  createManualOrder,
  simulateAdminApproval,
  getPaymentConfig,
  getPaymentMethods,
  PaymentConfig,
  PaymentMethod,
} from "@/lib/payment-api";
import * as React from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  CalendarDays,
  Users,
  QrCode,
  Send,
  Building,
  Smartphone,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/billing")({
  component: BillingPage,
});

interface EventWithOrder {
  id: string;
  name: string;
  type: string;
  start_date: string;
  is_paid: boolean;
  paid_at: string | null;
  event_statistics?: { guest_count: number } | null;
  latestOrder?: {
    id: string;
    status: "pending" | "submitted" | "paid" | "failed";
    payment_method: string | null;
    sender_name: string | null;
    amount: number;
    created_at: string;
  } | null;
}

function StatusBadge({ status }: { status: "free" | "paid" | "submitted" | "failed" }) {
  const variants = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    submitted: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-600 border-red-200",
    free: "bg-slate-50 text-slate-500 border-slate-200",
  };
  const labels = {
    paid: "Event Pass ✓",
    submitted: "Menunggu Verifikasi",
    failed: "Ditolak",
    free: "Gratis",
  };
  const icons = {
    paid: <CheckCircle2 className="h-3 w-3" />,
    submitted: <Clock className="h-3 w-3" />,
    failed: <AlertCircle className="h-3 w-3" />,
    free: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-medium leading-none ${variants[status]}`}
    >
      {icons[status]}
      {labels[status]}
    </span>
  );
}

function BillingPage() {
  const router = useRouter();
  const [events, setEvents] = React.useState<EventWithOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [upgradingEvent, setUpgradingEvent] = React.useState<EventWithOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [user, setUser] = React.useState<{ id: string; email: string; name: string } | null>(null);

  // Form states
  const [senderName, setSenderName] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("BCA");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Dynamic payment config & methods states
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig | null>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);

  // Dev helpers state
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDev(
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
      );
    }
  }, []);

  async function loadData() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const userEmail = session.user.email || "";
    const userName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      userEmail.split("@")[0];

    setUser({ id: userId, email: userEmail, name: userName });

    // Fetch events, global payment config, and active payment methods
    const [eventsRes, configRes, methodsRes] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, type, start_date, is_paid, paid_at, event_statistics(*)")
        .eq("created_by", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      getPaymentConfig(),
      getPaymentMethods({ data: { adminOnly: false } }),
    ]);

    const eventsData = eventsRes.data;
    setPaymentConfig(configRes);
    setPaymentMethods(methodsRes);

    if (!eventsData) {
      setLoading(false);
      return;
    }

    // Fetch latest orders
    const { data: ordersData } = await supabase
      .from("event_orders")
      .select("id, event_id, status, payment_method, sender_name, amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    interface RawEvent {
      id: string;
      name: string;
      type: string;
      start_date: string;
      is_paid: boolean;
      paid_at: string | null;
      event_statistics: unknown;
    }

    interface RawOrder {
      id: string;
      event_id: string;
      status: "pending" | "submitted" | "paid" | "failed";
      payment_method: string | null;
      sender_name: string | null;
      amount: number;
      created_at: string;
    }

    const merged: EventWithOrder[] = (eventsData as unknown as RawEvent[]).map((ev) => {
      const eventOrders = ((ordersData as unknown as RawOrder[]) || []).filter(
        (o) => o.event_id === ev.id,
      );
      const latestOrder = eventOrders[0] || null;
      return {
        ...ev,
        event_statistics: Array.isArray(ev.event_statistics)
          ? ev.event_statistics[0]
          : ev.event_statistics,
        latestOrder,
      };
    });

    setEvents(merged);
    setLoading(false);
  }

  React.useEffect(() => {
    loadData();
  }, []);

  function getEventStatus(ev: EventWithOrder): "free" | "paid" | "submitted" | "failed" {
    if (ev.is_paid) return "paid";
    if (ev.latestOrder?.status === "submitted") return "submitted";
    if (ev.latestOrder?.status === "failed") return "failed";
    return "free";
  }

  function handleOpenUpgradeModal(ev: EventWithOrder) {
    setUpgradingEvent(ev);
    setSenderName(user?.name || "");
    setPaymentMethod(paymentMethods[0]?.provider || "BCA");
    setNotes("");
    setIsModalOpen(true);
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!upgradingEvent || !user) return;

    if (!senderName.trim()) {
      toast.error("Nama pengirim wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualOrder({
        data: {
          eventId: upgradingEvent.id,
          userId: user.id,
          paymentMethod,
          senderName: senderName.trim(),
          notes: notes.trim() || null,
        },
      });

      toast.success("Konfirmasi pembayaran dikirim! Mohon tunggu verifikasi admin.");
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Gagal mengirim konfirmasi:", err);
      toast.error("Gagal mengirim konfirmasi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Developer simulated approval helper
  async function handleSimulateApproval(ev: EventWithOrder) {
    if (!ev.latestOrder) return;
    try {
      await simulateAdminApproval({
        data: {
          eventId: ev.id,
          orderId: ev.latestOrder.id,
        },
      });
      toast.success("Simulasi Admin: Pembayaran disetujui!");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan simulasi.");
    }
  }

  const paidEvents = events.filter((ev) => ev.is_paid);
  const freeEvents = events.filter((ev) => !ev.is_paid);

  const activeMethod =
    paymentMethods.find((m) => m.provider === paymentMethod) || paymentMethods[0] || null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight">Paket & Tagihan</h2>
        <p className="text-xs text-ink-soft mt-1">
          Kelola status Event Pass untuk setiap acara aktif Anda secara manual.
        </p>
      </div>

      {/* Plan Summary Banner */}
      <div className="rounded-xl border border-rule/35 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
              Ringkasan Akun
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-ink">
                {paidEvents.length}{" "}
                <span className="text-sm font-sans text-ink-soft font-normal">event berbayar</span>
              </span>
              <span className="text-ink-soft text-sm">·</span>
              <span className="text-xl font-bold text-ink">
                {freeEvents.length}{" "}
                <span className="text-sm font-sans text-ink-soft font-normal">event gratis</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink-soft mb-1">
              Harga Event Pass
            </div>
            <div className="font-mono text-lg font-bold text-ink">
              {paymentConfig
                ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: paymentConfig.currency,
                    maximumFractionDigits: 0,
                  }).format(paymentConfig.event_pass_price)
                : "Rp 99.000"}
            </div>
            <div className="text-[10px] text-ink-soft">per event · sekali bayar</div>
          </div>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="rounded-xl border border-rule/35 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-rule/35 bg-paper/40">
          <h3 className="text-sm font-bold text-ink">Perbandingan Paket</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-rule/35 hover:bg-transparent bg-paper/20">
              <TableHead className="text-left p-3 pr-4 text-xs font-bold text-ink">Fitur</TableHead>
              <TableHead className="text-center p-3 px-4 text-xs font-bold text-ink">
                Gratis
              </TableHead>
              <TableHead className="text-center p-3 px-4 bg-primary/5 text-xs font-bold text-primary">
                Event Pass
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Jumlah Tamu", "Maks. 50", "Unlimited"],
              ["AI Writer Assistant", "—", "✓"],
              ["QR Ticket Check-in", "—", "✓"],
              ["Watermark Invitaku", "Ada", "Tidak ada"],
              ["Support", "Community", "Email Priority"],
            ].map(([feature, free, paid]) => (
              <TableRow key={feature} className="border-b border-rule/20 hover:bg-transparent">
                <TableCell className="p-3 text-xs text-ink font-semibold">{feature}</TableCell>
                <TableCell className="p-3 text-center font-sans text-xs text-ink-soft">
                  {free}
                </TableCell>
                <TableCell className="p-3 text-center font-sans bg-primary/5 font-bold text-primary text-xs">
                  {paid}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-ink">Daftar Acara</h3>

        {loading ? (
          <div className="rounded-xl border border-rule/35 bg-white p-8 text-center shadow-xs">
            <div className="text-xs text-ink-soft animate-pulse">Memuat data acara...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-rule/35 bg-white p-8 text-center shadow-xs">
            <p className="text-xs text-ink-soft">Belum ada acara. Buat acara pertama Anda!</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-rule/35 bg-white divide-y divide-rule/30 shadow-xs">
            {events.map((ev) => {
              const status = getEventStatus(ev);
              const guestCount = ev.event_statistics?.guest_count || 0;

              return (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-paper/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink truncate">{ev.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold">
                          {ev.type}
                        </span>
                        <span className="text-ink-soft text-[9px]">·</span>
                        <span className="font-sans text-[10px] text-ink-soft flex items-center gap-1">
                          <Users className="h-3 w-3 text-ink-soft" />
                          {guestCount} tamu
                        </span>
                        {ev.paid_at && (
                          <>
                            <span className="text-ink-soft text-[9px]">·</span>
                            <span className="font-sans text-[10px] text-ink-soft">
                              Dibayar {new Date(ev.paid_at).toLocaleDateString("id-ID")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={status} />

                    {status === "free" && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenUpgradeModal(ev)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-bold flex items-center gap-1.5 h-8 rounded-xl text-xs cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Upgrade ·{" "}
                        {paymentConfig
                          ? `${Math.round(paymentConfig.event_pass_price / 1000)}K`
                          : "99K"}
                      </Button>
                    )}

                    {status === "submitted" && (
                      <div className="flex items-center gap-2">
                        {isDev && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSimulateApproval(ev)}
                            className="text-[10px] font-sans font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 h-8 rounded-xl transition-colors cursor-pointer"
                            title="Simulasikan persetujuan admin untuk testing lokal"
                          >
                            ✓ Approve (Dev)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-rule/35 rounded-xl p-6 shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink">Upgrade ke Event Pass</DialogTitle>
            <DialogDescription className="text-xs text-ink-soft mt-1">
              {paymentConfig?.instructions_header ||
                "Silakan lakukan transfer ke salah satu rekening di bawah, lalu isi konfirmasi transfer."}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleConfirmPayment} className="space-y-4 font-sans">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                Metode Pembayaran
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full h-9 text-xs border-rule/35 rounded-xl bg-white">
                  <SelectValue placeholder="Pilih Metode" />
                </SelectTrigger>
                <SelectContent className="bg-white border-rule/35 rounded-xl">
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.provider}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Transfer Instruction Box */}
            {activeMethod && (
              <div className="bg-slate-50/70 border border-dashed border-rule/50 rounded-xl p-3.5 space-y-2.5 my-2">
                <div className="flex items-start gap-2.5">
                  {activeMethod.type === "BANK" && (
                    <Building className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                  )}
                  {activeMethod.type === "EWALLET" && (
                    <Smartphone
                      className="h-4 w-4 text-primary shrink-0 mt-0.5"
                      strokeWidth={1.5}
                    />
                  )}
                  {activeMethod.type === "QRIS" && (
                    <QrCode className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono uppercase text-ink-soft tracking-wider font-bold">
                      Instruksi Pembayaran
                    </div>

                    {activeMethod.type === "BANK" && (
                      <div className="mt-1.5 space-y-1 text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">Bank:</span>
                          <span className="font-bold text-ink">{activeMethod.provider}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">No. Rekening:</span>
                          <span className="font-bold text-ink font-mono">
                            {activeMethod.account_number}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              navigator.clipboard.writeText(activeMethod.account_number || "");
                              toast.success("Nomor rekening disalin!");
                            }}
                            className="h-5 px-1.5 text-[10px] text-primary hover:underline font-bold rounded"
                          >
                            Salin
                          </Button>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">Atas Nama:</span>
                          <span className="font-semibold text-ink">
                            {activeMethod.account_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeMethod.type === "EWALLET" && (
                      <div className="mt-1.5 space-y-1 text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">Provider:</span>
                          <span className="font-bold text-ink">{activeMethod.provider}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">No. HP:</span>
                          <span className="font-bold text-ink font-mono">
                            {activeMethod.phone_number}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              navigator.clipboard.writeText(activeMethod.phone_number || "");
                              toast.success("Nomor HP disalin!");
                            }}
                            className="h-5 px-1.5 text-[10px] text-primary hover:underline font-bold rounded"
                          >
                            Salin
                          </Button>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">Atas Nama:</span>
                          <span className="font-semibold text-ink">
                            {activeMethod.account_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeMethod.type === "QRIS" && (
                      <div className="mt-1.5 space-y-2 text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-ink-soft w-16">Merchant:</span>
                          <span className="font-bold text-ink">{activeMethod.merchant_name}</span>
                        </div>
                        <div className="flex justify-center bg-white p-2 rounded-lg border border-rule/15 max-w-[120px] mx-auto shadow-xs">
                          {activeMethod.qr_image_url ? (
                            <img
                              src={activeMethod.qr_image_url}
                              alt="QRIS Merchant"
                              className="h-24 w-24 object-contain"
                            />
                          ) : (
                            <div className="h-24 w-24 flex flex-col items-center justify-center text-center p-1 bg-slate-50 rounded">
                              <QrCode className="h-6 w-6 text-slate-400" />
                              <span className="text-[7px] text-slate-500 font-mono mt-1 leading-tight uppercase">
                                QRIS Code
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeMethod.instructions && (
                      <p className="text-[9px] text-ink-soft mt-2 leading-relaxed italic border-t border-rule/10 pt-1.5">
                        {activeMethod.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                Nama Pengirim / Pemilik Rekening
              </Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: Amara Wibowo"
                className="h-9 text-xs border-rule/35 rounded-xl bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                Catatan Tambahan (Opsional)
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sudah ditransfer pukul 12.00 WIB"
                className="h-9 text-xs border-rule/35 rounded-xl bg-white"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs border-rule/35 font-semibold rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Konfirmasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Info callout */}
      <div className="rounded-[2px] border border-rule bg-paper p-4 flex items-start gap-3">
        <Info className="h-4 w-4 shrink-0 text-ink-soft mt-0.5" strokeWidth={1.5} />
        <div className="text-xs text-ink-soft leading-relaxed">
          {paymentConfig?.confirmation_note ||
            "Setelah mengirimkan konfirmasi pembayaran, admin kami akan memverifikasi transaksi Anda dalam waktu maksimal 1x24 jam."}{" "}
          {paymentConfig?.support_contact && (
            <a
              href={paymentConfig.support_contact}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Hubungi Bantuan Support →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
