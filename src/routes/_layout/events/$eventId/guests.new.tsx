import { createFileRoute, Link, useNavigate, useLoaderData } from "@tanstack/react-router";
import * as React from "react";
import { EventContextHeader } from "@/components/event-context-header";
import { getSegments, importGuests } from "@/lib/guests-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Sparkles, ClipboardList, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_layout/events/$eventId/guests/new")({
  loader: async ({ params }) => {
    try {
      const segments = await getSegments({ data: params.eventId });
      return { segments };
    } catch (e) {
      console.error("Gagal memuat segmen:", e);
      return { segments: [] };
    }
  },
  component: AddMultipleGuestsPage,
});

interface GuestRow {
  name: string;
  phone: string;
  email: string;
  segment: string;
  party_size: number;
  notes: string;
}

function AddMultipleGuestsPage() {
  const { event } = useLoaderData({ from: "/_layout/events/$eventId" }) as any;
  const { segments } = useLoaderData({ from: "/_layout/events/$eventId/guests/new" }) as any;
  const navigate = useNavigate();

  const [rows, setRows] = React.useState<GuestRow[]>([
    { name: "", phone: "", email: "", segment: "", party_size: 1, notes: "" },
  ]);
  const [pasteText, setPasteText] = React.useState("");
  const [isPasteOpen, setIsPasteOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const addRow = () => {
    setRows([...rows, { name: "", phone: "", email: "", segment: "", party_size: 1, notes: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      setRows([{ name: "", phone: "", email: "", segment: "", party_size: 1, notes: "" }]);
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = <K extends keyof GuestRow>(index: number, key: K, val: GuestRow[K]) => {
    const updated = [...rows];
    updated[index][key] = val;
    setRows(updated);
  };

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    const names = pasteText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const newRows = names.map((name) => ({
      name,
      phone: "",
      email: "",
      segment: "",
      party_size: 1,
      notes: "",
    }));

    if (rows.length === 1 && !rows[0].name) {
      setRows(newRows);
    } else {
      setRows([...rows, ...newRows]);
    }
    setPasteText("");
    setIsPasteOpen(false);
    toast.success(`Berhasil menambahkan ${names.length} baris nama tamu!`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate rows
    const validGuests = rows.filter((r) => r.name.trim().length > 0);
    if (validGuests.length === 0) {
      toast.error("Wajib mengisi minimal satu nama tamu!");
      return;
    }

    setIsSaving(true);
    try {
      await importGuests({
        data: {
          eventId: event.id,
          guests: validGuests.map((g) => ({
            name: g.name.trim(),
            phone: g.phone.trim() || null,
            email: g.email.trim() || null,
            segment: g.segment.trim() || null,
            party_size: g.party_size,
            notes: g.notes.trim() || null,
          })),
        },
      });

      toast.success(`Berhasil menambahkan ${validGuests.length} tamu baru!`);
      navigate({ to: `/events/${event.id}/guests` });
    } catch (err) {
      console.error("Gagal menyimpan tamu:", err);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan data tamu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <EventContextHeader event={event} />

      <div className="bg-white border border-rule/50 rounded-2xl p-5 md:p-6 space-y-6 shadow-xs">
        {/* Top bar with back navigation and paste actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/35 pb-5">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted/10"
            >
              <Link to={`/events/${event.id}/guests`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h4 className="text-sm font-semibold text-ink">Tambah Tamu Baru</h4>
              <p className="text-[11px] text-ink-soft">
                Masukkan rincian data beberapa tamu secara instan menggunakan form di bawah.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPasteOpen(!isPasteOpen)}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <ClipboardList className="h-3.5 w-3.5 text-indigo-500" strokeWidth={1.5} />
            Quick Paste Nama Tamu
          </Button>
        </div>

        {/* Collapsible Quick Paste Section */}
        {isPasteOpen && (
          <div className="bg-paper/20 border border-rule/45 rounded-2xl p-4 md:p-5 space-y-3.5 transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <Sparkles className="h-4 w-4 text-indigo-600" strokeWidth={1.5} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-ink">Quick Paste Nama Tamu</Label>
                <p className="text-[10px] text-ink-soft mt-0.5 leading-relaxed">
                  Tempel/paste daftar nama tamu Anda dari spreadsheet, chat, atau notepad (tulis
                  satu nama per baris). Sistem akan otomatis membuat baris data tamu terpisah untuk
                  setiap nama.
                </p>
              </div>
            </div>
            <textarea
              rows={5}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Contoh:&#10;Aditya Ramadhan&#10;Budi Santoso&#10;Clarissa Siregar"
              className="w-full text-xs font-mono p-3 bg-white border border-rule/55 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-ink-muted/70"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPasteOpen(false);
                  setPasteText("");
                }}
                className="text-xs h-8"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyPaste}
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold h-8"
              >
                Generate Baris Tamu
              </Button>
            </div>
          </div>
        )}

        {/* Main Batch Form Table */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border border-rule/55 rounded-2xl overflow-hidden bg-transparent">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-rule/50 bg-paper/30">
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider text-center w-12">
                      No
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider min-w-[200px]">
                      Nama Tamu <span className="text-primary">*</span>
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider min-w-[140px]">
                      WhatsApp / Phone
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider min-w-[160px]">
                      Email
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider min-w-[140px]">
                      Segmen (VIP/Keluarga)
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider text-center w-24">
                      Party Size
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-semibold text-ink-muted font-mono uppercase tracking-wider min-w-[160px]">
                      Catatan
                    </th>
                    <th className="py-2.5 px-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/40 bg-white">
                  {rows.map((row, index) => (
                    <tr key={index} className="hover:bg-paper/10 transition-colors">
                      <td className="py-2 px-3 text-xs text-ink-soft text-center font-mono font-medium">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          value={row.name}
                          onChange={(e) => updateRow(index, "name", e.target.value)}
                          placeholder="Nama lengkap tamu"
                          className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none font-medium placeholder:text-ink-muted/50"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(e) => updateRow(index, "phone", e.target.value)}
                          placeholder="0812xxxxxxxx"
                          className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-ink-muted/50"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => updateRow(index, "email", e.target.value)}
                          placeholder="tamu@email.com"
                          className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-ink-muted/50"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          list={`segments-list-${index}`}
                          value={row.segment}
                          onChange={(e) => updateRow(index, "segment", e.target.value)}
                          placeholder="VIP, Teman, dll."
                          className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-ink-muted/50"
                        />
                        <datalist id={`segments-list-${index}`}>
                          {segments.map((s: any) => (
                            <option key={s.id} value={s.name} />
                          ))}
                        </datalist>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={row.party_size}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "party_size",
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="w-12 text-xs bg-transparent border-0 focus:ring-0 focus:outline-none text-center font-mono font-medium"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.notes}
                          onChange={(e) => updateRow(index, "notes", e.target.value)}
                          placeholder="Meja VIP, dll."
                          className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-ink-muted/50"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(index)}
                          className="h-7 w-7 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions to Add Rows */}
            <div className="p-3.5 bg-paper/20 border-t border-rule/50 flex justify-between items-center">
              <span className="text-[10px] text-ink-muted font-mono">
                Total: {rows.length} Baris Tamu
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="text-xs font-semibold gap-1.5 h-8 bg-white"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                Tambah Baris Baru
              </Button>
            </div>
          </div>

          {/* Form Submit & Cancel Row */}
          <div className="flex justify-end items-center gap-3 pt-2 border-t border-rule/35">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              asChild
              className="text-xs font-semibold h-9 px-4"
            >
              <Link to={`/events/${event.id}/guests`}>Batal</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold h-9 px-5 gap-1.5 shadow-none"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan Semua Tamu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
