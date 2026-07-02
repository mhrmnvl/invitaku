import { createFileRoute } from "@tanstack/react-router";
import {
  getPaymentConfig,
  savePaymentConfig,
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  PaymentConfig,
  PaymentMethod,
} from "@/lib/payment-api";
import * as React from "react";
import {
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Building,
  Smartphone,
  QrCode,
  Upload,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/admin/payments")({
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const [config, setConfig] = React.useState<PaymentConfig | null>(null);
  const [methods, setMethods] = React.useState<PaymentMethod[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Global Config Form States
  const [price, setPrice] = React.useState(99000);
  const [instructionsHeader, setInstructionsHeader] = React.useState("");
  const [confirmationNote, setConfirmationNote] = React.useState("");
  const [supportContact, setSupportContact] = React.useState("");
  const [savingConfig, setSavingConfig] = React.useState(false);

  // Method Dialog States
  const [isMethodModalOpen, setIsMethodModalOpen] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);
  const [type, setType] = React.useState("BANK");
  const [provider, setProvider] = React.useState("BCA");
  const [displayName, setDisplayName] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [merchantName, setMerchantName] = React.useState("");
  const [qrImageUrl, setQrImageUrl] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [status, setStatus] = React.useState("active");
  const [savingMethod, setSavingMethod] = React.useState(false);

  // Delete Confirm States
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [configData, methodsData] = await Promise.all([
        getPaymentConfig(),
        getPaymentMethods({ data: { adminOnly: true } }),
      ]);
      setConfig(configData);
      setPrice(configData.event_pass_price);
      setInstructionsHeader(configData.instructions_header);
      setConfirmationNote(configData.confirmation_note);
      setSupportContact(configData.support_contact || "");
      setMethods(methodsData);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await savePaymentConfig({
        data: {
          id: config?.id || undefined,
          eventPassPrice: price,
          instructionsHeader: instructionsHeader,
          confirmationNote: confirmationNote,
          supportContact: supportContact || null,
        },
      });
      toast.success("Konfigurasi global berhasil disimpan!");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan konfigurasi.");
    } finally {
      setSavingConfig(false);
    }
  }

  function handleOpenCreateModal() {
    setSelectedMethod(null);
    setType("BANK");
    setProvider("BCA");
    setDisplayName("Transfer BCA");
    setAccountName("");
    setAccountNumber("");
    setPhoneNumber("");
    setMerchantName("");
    setQrImageUrl("");
    setInstructions("");
    setDisplayOrder(methods.length);
    setStatus("active");
    setIsMethodModalOpen(true);
  }

  function handleOpenEditModal(method: PaymentMethod) {
    setSelectedMethod(method);
    setType(method.type);
    setProvider(method.provider);
    setDisplayName(method.display_name);
    setAccountName(method.account_name || "");
    setAccountNumber(method.account_number || "");
    setPhoneNumber(method.phone_number || "");
    setMerchantName(method.merchant_name || "");
    setQrImageUrl(method.qr_image_url || "");
    setInstructions(method.instructions || "");
    setDisplayOrder(method.display_order);
    setStatus(method.status);
    setIsMethodModalOpen(true);
  }

  function handleQrImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQrImageUrl(reader.result);
        toast.success("Gambar berhasil diproses ke format Base64!");
      }
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file gambar");
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveMethod(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display Name wajib diisi");
      return;
    }

    setSavingMethod(true);
    try {
      await savePaymentMethod({
        data: {
          id: selectedMethod?.id || undefined,
          type,
          provider,
          displayName: displayName.trim(),
          accountName: type !== "QRIS" ? accountName.trim() : null,
          accountNumber: type === "BANK" ? accountNumber.trim() : null,
          phoneNumber: type === "EWALLET" ? phoneNumber.trim() : null,
          merchantName: type === "QRIS" ? merchantName.trim() : null,
          qrImageUrl: type === "QRIS" ? qrImageUrl : null,
          instructions: instructions.trim() || null,
          displayOrder,
          status,
        },
      });

      toast.success(
        selectedMethod
          ? "Metode pembayaran berhasil diupdate!"
          : "Metode pembayaran baru berhasil ditambahkan!",
      );
      setIsMethodModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan metode pembayaran.");
    } finally {
      setSavingMethod(false);
    }
  }

  // Auto-saves status inline from the table row
  async function handleStatusChangeInline(m: PaymentMethod, newStatus: string) {
    try {
      await savePaymentMethod({
        data: {
          id: m.id,
          type: m.type,
          provider: m.provider,
          displayName: m.display_name,
          accountName: m.account_name,
          accountNumber: m.account_number,
          phoneNumber: m.phone_number,
          merchantName: m.merchant_name,
          qrImageUrl: m.qr_image_url,
          instructions: m.instructions,
          displayOrder: m.display_order,
          status: newStatus,
        },
      });
      toast.success(
        `Status ${m.display_name} diubah ke ${newStatus === "active" ? "Active" : "Inactive"}`,
      );
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status.");
    }
  }

  function handleOpenDelete(id: string) {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deletePaymentMethod({ data: { id: deleteTargetId } });
      toast.success("Metode pembayaran telah dihapus.");
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus metode.");
    } finally {
      setDeleting(false);
    }
  }

  React.useEffect(() => {
    if (selectedMethod) return;

    if (type === "BANK") {
      setDisplayName(`Transfer ${provider}`);
    } else if (type === "EWALLET") {
      setDisplayName(`${provider} E-Wallet`);
    } else if (type === "QRIS") {
      setDisplayName("Scan QRIS");
      setProvider("QRIS");
    }
  }, [type, provider, selectedMethod]);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight">Payment Configuration</h2>
        <p className="text-xs text-ink-soft mt-1">
          Kelola parameter harga, instruksi modal upgrade, dan daftar opsi rekening/e-wallet
          pembayaran SaaS secara dinamis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Side: Global Configuration Card */}
        <div className="space-y-6">
          <Card className="border-rule/35 shadow-none rounded-xl bg-white">
            <CardHeader className="border-b border-rule/35 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <CardTitle className="text-sm text-ink font-semibold">Pengaturan Global</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {loading ? (
                <div className="text-center py-4 text-xs text-ink-soft">Memuat konfigurasi...</div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                      Harga Event Pass (Rp)
                    </Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="h-9 text-xs border-rule"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                      Petunjuk Modal (Header)
                    </Label>
                    <Textarea
                      value={instructionsHeader}
                      onChange={(e) => setInstructionsHeader(e.target.value)}
                      className="min-h-[80px] text-xs border-rule focus-visible:ring-1 focus-visible:ring-primary leading-normal"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                      Catatan Konfirmasi (Footer)
                    </Label>
                    <Textarea
                      value={confirmationNote}
                      onChange={(e) => setConfirmationNote(e.target.value)}
                      className="min-h-[80px] text-xs border-rule focus-visible:ring-1 focus-visible:ring-primary leading-normal"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                      Kontak Bantuan (URL)
                    </Label>
                    <Input
                      type="text"
                      value={supportContact}
                      onChange={(e) => setSupportContact(e.target.value)}
                      placeholder="Contoh: https://wa.me/628..."
                      className="h-9 text-xs border-rule"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={savingConfig}
                    className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  >
                    {savingConfig ? "Menyimpan..." : "Simpan Pengaturan"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Payment Methods Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-ink font-semibold">Daftar Metode Pembayaran</h3>
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-mono uppercase tracking-widest h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Method
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-rule/35 bg-white shadow-none">
            {loading ? (
              <div className="text-center py-12 text-xs text-ink-soft animate-pulse">
                Memuat daftar metode pembayaran...
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-12 text-xs text-ink-soft">
                Belum ada metode pembayaran yang terdaftar. Klik "Add Method" untuk membuat.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-paper/40">
                  <TableRow className="hover:bg-transparent border-b border-rule/35">
                    <TableHead className="w-[80px] text-xs font-semibold text-ink pl-4">
                      Urutan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-ink">Tipe</TableHead>
                    <TableHead className="text-xs font-semibold text-ink">Provider</TableHead>
                    <TableHead className="text-xs font-semibold text-ink">Nama Tampilan</TableHead>
                    <TableHead className="text-xs font-semibold text-ink">
                      Detail Akun / Kode
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-ink text-center w-[120px]">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-ink text-right w-24 pr-4">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((m) => (
                    <TableRow
                      key={m.id}
                      className="border-b border-rule/35 hover:bg-muted/10 transition-colors duration-150"
                    >
                      <TableCell className="pl-4 font-sans text-xs text-ink-soft">
                        {m.display_order}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          {m.type === "BANK" && <Building className="h-3.5 w-3.5 text-slate-500" />}
                          {m.type === "EWALLET" && (
                            <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          {m.type === "QRIS" && <QrCode className="h-3.5 w-3.5 text-slate-500" />}
                          {m.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-sans text-ink">{m.provider}</TableCell>
                      <TableCell className="text-xs font-semibold text-ink">
                        {m.display_name}
                      </TableCell>
                      <TableCell className="text-xs text-ink-soft">
                        {m.type === "BANK" && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink">{m.account_number}</span>
                            <span className="text-[10px] text-ink-soft mt-0.5">
                              a.n. {m.account_name}
                            </span>
                          </div>
                        )}
                        {m.type === "EWALLET" && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink">{m.phone_number}</span>
                            <span className="text-[10px] text-ink-soft mt-0.5">
                              a.n. {m.account_name}
                            </span>
                          </div>
                        )}
                        {m.type === "QRIS" && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink">{m.merchant_name}</span>
                            <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              QRIS Image Loaded
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <Select
                          value={m.status}
                          onValueChange={(val) => {
                            if (val !== m.status) {
                              handleStatusChangeInline(m, val);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-8 text-xs border-rule bg-white cursor-pointer focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-rule font-sans">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => handleOpenEditModal(m)}
                            variant="ghost"
                            size="icon-xs"
                            className="text-ink-soft hover:text-ink cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleOpenDelete(m.id)}
                            variant="ghost"
                            size="icon-xs"
                            className="text-danger/80 hover:text-danger hover:bg-red-50/50 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Method Dialog */}
      <Dialog open={isMethodModalOpen} onOpenChange={setIsMethodModalOpen}>
        <DialogContent className="max-w-md bg-white border border-rule rounded-xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg text-ink font-bold">
              {selectedMethod ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-soft mt-1">
              Konfigurasi data rekening, e-wallet, atau merchant QRIS agar otomatis tampil di modal
              upgrade user.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMethod} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                  Tipe Metode
                </Label>
                <Select
                  value={type}
                  onValueChange={(val) => {
                    setType(val);
                    if (val === "QRIS") setProvider("QRIS");
                    else if (val === "BANK") setProvider("BCA");
                    else if (val === "EWALLET") setProvider("GOPAY");
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-xs border-rule">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-rule">
                    <SelectItem value="BANK">BANK (Transfer)</SelectItem>
                    <SelectItem value="EWALLET">EWALLET (GoPay/OVO)</SelectItem>
                    <SelectItem value="QRIS">QRIS (Scan Code)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                  Provider / Nama Bank
                </Label>
                {type === "QRIS" ? (
                  <Input
                    value="QRIS"
                    disabled
                    className="h-9 text-xs border-rule bg-slate-50 font-sans"
                  />
                ) : (
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger className="w-full h-9 text-xs border-rule">
                      <SelectValue placeholder="Pilih Provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-rule font-sans">
                      {type === "BANK" ? (
                        <>
                          <SelectItem value="BCA">BCA</SelectItem>
                          <SelectItem value="MANDIRI">Mandiri</SelectItem>
                          <SelectItem value="BNI">BNI</SelectItem>
                          <SelectItem value="BRI">BRI</SelectItem>
                          <SelectItem value="OTHER">Lainnya</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="GOPAY">GoPay</SelectItem>
                          <SelectItem value="OVO">OVO</SelectItem>
                          <SelectItem value="DANA">DANA</SelectItem>
                          <SelectItem value="LINKAJA">LinkAja</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                Nama Tampilan di UI
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: Transfer Bank BCA"
                className="h-9 text-xs border-rule font-sans"
                required
              />
            </div>

            {/* Conditional form fields based on payment type */}
            {type === "BANK" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                    Nomor Rekening
                  </Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="h-9 text-xs border-rule font-sans"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                    Nama Pemilik Rekening
                  </Label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: PT Invitaku Digital"
                    className="h-9 text-xs border-rule font-sans"
                    required
                  />
                </div>
              </div>
            )}

            {type === "EWALLET" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                    Nomor HP E-Wallet
                  </Label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="h-9 text-xs border-rule font-sans"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                    Nama Akun E-Wallet
                  </Label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: INVITAKU OFFICIAL"
                    className="h-9 text-xs border-rule font-sans"
                    required
                  />
                </div>
              </div>
            )}

            {type === "QRIS" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                    Nama Merchant QRIS
                  </Label>
                  <Input
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Contoh: Invitaku QRIS Merchant"
                    className="h-9 text-xs border-rule font-sans"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold block">
                    Gambar Kode QRIS
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={qrImageUrl}
                      onChange={(e) => setQrImageUrl(e.target.value)}
                      placeholder="Masukkan URL gambar atau Upload File..."
                      className="h-9 text-xs border-rule flex-1 font-sans"
                    />
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs border-rule flex gap-1 items-center cursor-pointer font-sans"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  </div>
                  {qrImageUrl && (
                    <div className="border border-rule rounded bg-slate-50 p-2 flex justify-center mt-1 select-none">
                      <img src={qrImageUrl} alt="QRIS Preview" className="h-28 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                Petunjuk Transfer Metode Ini (Opsional)
              </Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Contoh: Masukkan berita transfer 'Upgrade Event ID'"
                className="min-h-[50px] text-xs border-rule focus-visible:ring-1 focus-visible:ring-primary leading-normal font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                  Urutan Tampilan
                </Label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="h-9 text-xs border-rule font-sans"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono uppercase text-ink-soft tracking-wider font-semibold">
                  Status Keaktifan
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full h-9 text-xs border-rule">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-rule font-sans">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMethodModalOpen(false)}
                className="h-9 text-xs border-rule font-medium font-sans"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savingMethod}
                className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium font-sans"
              >
                {savingMethod ? "Menyimpan..." : "Simpan Metode"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsMethodModalOpen}>
        <DialogContent className="max-w-sm bg-white border border-rule rounded-xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base text-ink font-bold">
              Hapus Metode Pembayaran?
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-soft mt-1">
              Metode ini tidak akan tampil lagi di modal pilihan pembayaran user. Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="h-9 text-xs border-rule font-medium font-sans"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-medium font-sans"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
