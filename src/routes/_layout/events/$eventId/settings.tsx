import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { updateEvent } from "@/lib/events-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Shield,
  Users,
  Calendar as CalendarIconNormal,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Link2,
  AlertTriangle,
  Check,
  CalendarIcon,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EventContextHeader } from "@/components/event-context-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { LocationSearch } from "@/components/location-search";
import { MapPicker } from "@/components/map-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_layout/events/$eventId/settings")({
  component: EventSettingsPage,
});

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Graduation",
  "Seminar",
  "Corporate",
  "Community",
  "School",
  "Government",
  "Other",
];

const TIMEZONES = [
  { label: "WIB — Asia/Jakarta", value: "Asia/Jakarta" },
  { label: "WITA — Asia/Makassar", value: "Asia/Makassar" },
  { label: "WIT — Asia/Jayapura", value: "Asia/Jayapura" },
];

const VISIBILITIES = [
  { label: "Public", value: "Public", icon: Eye, desc: "Siapa saja bisa mengakses" },
  { label: "Private", value: "Private", icon: EyeOff, desc: "Hanya tamu dengan link" },
  { label: "Password", value: "Password", icon: Lock, desc: "Dilindungi dengan kata sandi" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold">
      {children}
    </label>
  );
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-rule/45 p-6 bg-slate-50/40 space-y-5", className)}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-rule/30">
      <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
      <h4 className="font-sans font-semibold text-sm text-ink">{children}</h4>
    </div>
  );
}

function EventSettingsPage() {
  const { event: activeEvent } = useLoaderData({ from: "/_layout/events/$eventId" }) as any;
  const router = useRouter();

  // Basic Details States
  const [name, setName] = useState(activeEvent.name || "");
  const [type, setType] = useState(activeEvent.type || "Other");
  const [timezone, setTimezone] = useState(activeEvent.timezone || "Asia/Jakarta");
  const [description, setDescription] = useState(activeEvent.description || "");

  // Schedule States
  const [startDate, setStartDate] = useState<Date | undefined>(
    activeEvent.start_date ? new Date(activeEvent.start_date) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    activeEvent.end_date ? new Date(activeEvent.end_date) : undefined,
  );
  const [startTime, setStartTime] = useState(activeEvent.start_time || "");
  const [endTime, setEndTime] = useState(activeEvent.end_time || "");

  // Location States (parsed from JSON)
  let initialLocationData: any = null;
  try {
    if (activeEvent.location) {
      initialLocationData = JSON.parse(activeEvent.location);
    }
  } catch (e) {
    console.error("Failed to parse event location", e);
  }

  const [locationProvider, setLocationProvider] = useState<any>(
    initialLocationData?.country ? initialLocationData : null,
  );
  const [venueName, setVenueName] = useState(
    initialLocationData?.venueName || activeEvent.location || "",
  );
  const [addressDetail, setAddressDetail] = useState(initialLocationData?.addressDetail || "");
  const [mapsUrl, setMapsUrl] = useState(activeEvent.maps_url || "");
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Privacy & Access States
  const [visibility, setVisibility] = useState(activeEvent.visibility ?? "Public");
  const [password, setPassword] = useState(activeEvent.password || "");
  const [showPassword, setShowPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Collaborators States
  const [collaborators, setCollaborators] = useState<any[]>([
    {
      id: "1",
      name: "Amara Wibowo",
      email: "amara@kiranawedding.com",
      role: "Owner",
      permission: "Semua akses",
      initial: "A",
    },
  ]);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [newCollabName, setNewCollabName] = useState("");
  const [newCollabEmail, setNewCollabEmail] = useState("");
  const [newCollabRole, setNewCollabRole] = useState("Editor");
  const [newCollabPermission, setNewCollabPermission] = useState("Akses Edit");

  const statusColors: Record<string, string> = {
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Archived: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const handleSave = async (overrideStatus?: "Draft" | "Published" | "Archived") => {
    setIsSaving(true);
    try {
      const locationData = {
        country: locationProvider?.country || "",
        province: locationProvider?.province || "",
        city: locationProvider?.city || "",
        district: locationProvider?.district || "",
        latitude: locationProvider?.latitude || "",
        longitude: locationProvider?.longitude || "",
        timezone: locationProvider?.timezone || timezone || "Asia/Jakarta",
        venueName: venueName,
        addressDetail: addressDetail,
        village: locationProvider?.village || "",
        locationNote: locationProvider?.locationNote || "",
      };

      const payload = {
        id: activeEvent.id,
        name,
        type,
        timezone: locationData.timezone,
        description,
        start_date: startDate ? startDate.toISOString().split("T")[0] : "",
        end_date: endDate ? endDate.toISOString().split("T")[0] : null,
        start_time: startTime,
        end_time: endTime,
        location: JSON.stringify(locationData),
        maps_url: mapsUrl,
        visibility,
        password: visibility === "Password" ? password : null,
        status: overrideStatus || activeEvent.status || "Published",
      };

      await updateEvent({ data: payload });
      toast.success("Setelan acara berhasil disimpan!");
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan setelan";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCollaborator = () => {
    if (!newCollabName.trim() || !newCollabEmail.trim()) {
      toast.error("Nama dan Email wajib diisi!");
      return;
    }

    const newCollab = {
      id: Math.random().toString(),
      name: newCollabName,
      email: newCollabEmail,
      role: newCollabRole,
      permission: newCollabPermission,
      initial: newCollabName.charAt(0).toUpperCase(),
    };

    setCollaborators([...collaborators, newCollab]);
    toast.success("Kolaborator berhasil ditambahkan!");

    // Reset Form
    setNewCollabName("");
    setNewCollabEmail("");
    setNewCollabRole("Editor");
    setNewCollabPermission("Akses Edit");
    setIsCollabModalOpen(false);
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== id));
    toast.success("Kolaborator berhasil dihapus");
  };

  return (
    <div className="space-y-6">
      <EventContextHeader event={activeEvent} />

      <div className="bg-white rounded-2xl border border-rule/50 p-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/30 pb-4 mb-6">
          <div>
            <h4 className="text-sm font-semibold text-ink">Setelan Acara</h4>
            <p className="text-[11px] text-ink-soft">
              Atur detail, privasi, visibilitas, dan hak akses acara Anda.
            </p>
          </div>
          {activeEvent.status && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest font-bold",
                statusColors[activeEvent.status] ?? "bg-slate-100 text-slate-500 border-slate-200",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {activeEvent.status}
            </span>
          )}
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl mb-2 flex w-fit gap-1">
            <TabsTrigger
              value="general"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> Detail Acara
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> Privasi & Visibilitas
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> Hak Akses
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Detail Acara ────────────────────────────────────────── */}
          <TabsContent value="general" className="pt-6 space-y-5 max-w-2xl text-xs">
            {/* Identitas */}
            <Section>
              <SectionTitle icon={Settings}>Identitas Acara</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <FieldLabel>Nama Acara</FieldLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Tipe Acara</FieldLabel>
                  <Select onValueChange={setType} value={type}>
                    <SelectTrigger className="w-full bg-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Zona Waktu</FieldLabel>
                  <Select onValueChange={setTimezone} value={timezone}>
                    <SelectTrigger className="w-full bg-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <FieldLabel>Deskripsi (Opsional)</FieldLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Ceritakan sedikit tentang acara ini..."
                    className="bg-white rounded-xl resize-none"
                  />
                </div>
              </div>
            </Section>

            {/* Jadwal */}
            <Section>
              <SectionTitle icon={CalendarIconNormal}>Jadwal Acara</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Tanggal Mulai</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white rounded-xl h-9 border-input text-xs",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-ink-soft shrink-0" />
                        {startDate ? (
                          format(startDate, "dd MMMM yyyy")
                        ) : (
                          <span>Pilih tanggal mulai</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Tanggal Selesai (Opsional)</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white rounded-xl h-9 border-input text-xs",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-ink-soft shrink-0" />
                        {endDate ? (
                          format(endDate, "dd MMMM yyyy")
                        ) : (
                          <span>Pilih tanggal selesai</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Jam Mulai</FieldLabel>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-white rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Jam Selesai (Opsional)</FieldLabel>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-white rounded-xl"
                  />
                </div>
              </div>
            </Section>

            {/* Lokasi */}
            <Section>
              <SectionTitle icon={MapPin}>Lokasi</SectionTitle>
              <div className="grid gap-4">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Cari Wilayah (Sampai Kecamatan) *</FieldLabel>
                  <div className="space-y-4">
                    <LocationSearch
                      value={locationProvider}
                      onSelect={(loc) => {
                        setLocationProvider(loc);
                        if (loc.latitude && loc.longitude) {
                          setMapsUrl(
                            `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`,
                          );
                        }
                      }}
                      onClear={() => {
                        setLocationProvider(null);
                        setMapsUrl("");
                      }}
                    />
                    {locationProvider && (
                      <>
                        <div className="rounded-xl border border-rule bg-white p-3.5 flex items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                              <MapPin className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground">
                                Peta Lokasi Presisi
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                                {locationProvider.latitude && locationProvider.longitude
                                  ? "Pin koordinat telah disetel"
                                  : "Disarankan: atur pin koordinat peta"}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMapExpanded(true)}
                            className="shrink-0 text-xs h-8 px-3 rounded-xl"
                          >
                            Atur Pin Peta
                          </Button>
                        </div>

                        <Dialog open={isMapExpanded} onOpenChange={setIsMapExpanded}>
                          <DialogContent
                            className="max-w-2xl sm:rounded-2xl p-6"
                            onPointerDownOutside={(e) => e.preventDefault()}
                          >
                            <DialogHeader>
                              <DialogTitle className="text-sm font-semibold text-ink">
                                Tentukan Lokasi Presisi
                              </DialogTitle>
                              <DialogDescription className="text-xs text-ink-soft">
                                Geser marker merah atau klik di mana saja pada peta untuk menandai
                                titik lokasi event secara tepat.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <MapPicker
                                latitude={locationProvider.latitude}
                                longitude={locationProvider.longitude}
                                onChange={(newLat, newLon) => {
                                  setLocationProvider({
                                    ...locationProvider,
                                    latitude: newLat,
                                    longitude: newLon,
                                  });
                                  setMapsUrl(
                                    `https://www.google.com/maps/search/?api=1&query=${newLat},${newLon}`,
                                  );
                                }}
                              />
                            </div>
                            <div className="flex justify-end pt-2">
                              <Button
                                type="button"
                                onClick={() => setIsMapExpanded(false)}
                                className="text-xs h-9 px-4 rounded-xl"
                              >
                                Selesai
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Nama Tempat / Venue *</FieldLabel>
                  <Input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Gedung Bidakara, Rumah Mempelai, Ballroom Orchid"
                    className="bg-white rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Detail Alamat (Jalan, Kp., RT/RW, Desa, Patokan, dll) *</FieldLabel>
                  <Textarea
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="Contoh: Kp. Bojong, RT 01/RW 02, Desa Lengkong, Sebelah Alfamart"
                    className="bg-white rounded-xl min-h-[90px] resize-none"
                  />
                </div>

                <div className="rounded-xl border border-rule bg-white p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <MapPin className="h-4 w-4" />
                    <span>Pratinjau Alamat</span>
                  </div>
                  <div className="text-ink-soft leading-relaxed font-medium text-xs">
                    {venueName ? (
                      <span className="text-ink font-semibold">{venueName}</span>
                    ) : (
                      <span className="text-ink-soft/60 italic font-normal">
                        Nama tempat belum diisi
                      </span>
                    )}
                    {" - "}
                    {addressDetail ? (
                      <span>{addressDetail}</span>
                    ) : (
                      <span className="text-ink-soft/60 italic font-normal">
                        Detail alamat belum diisi
                      </span>
                    )}
                    {locationProvider && (
                      <>
                        {", "}
                        <span>
                          {[
                            locationProvider.district,
                            locationProvider.city,
                            locationProvider.province,
                            locationProvider.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {locationProvider && mapsUrl && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium pt-1">
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>Lokasi Terpilih</span>
                    <span className="text-ink-soft/30">•</span>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold flex items-center gap-1.5"
                    >
                      Buka di Google Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </Section>

            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2 font-medium text-xs"
            >
              <Check className="h-3.5 w-3.5" /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </TabsContent>

          {/* ── Tab 2: Privasi & Visibilitas ───────────────────────────────── */}
          <TabsContent value="privacy" className="pt-6 space-y-5 max-w-2xl text-xs">
            <Section>
              <SectionTitle icon={Eye}>Visibilitas Undangan</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-3">
                {VISIBILITIES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVisibility(v.value)}
                    className={cn(
                      "flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all",
                      visibility === v.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-rule/50 bg-white hover:border-rule text-ink",
                    )}
                  >
                    <v.icon className="h-4 w-4" strokeWidth={1.5} />
                    <span className="font-semibold text-xs">{v.label}</span>
                    <span className="text-[10px] text-ink-soft leading-snug">{v.desc}</span>
                  </button>
                ))}
              </div>

              {visibility === "Password" && (
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Kata Sandi Undangan</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="bg-white rounded-xl flex-1"
                    />
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Section>

            <Section className="border-red-100 bg-red-50/30">
              <div className="flex items-center gap-2 pb-1 border-b border-red-100">
                <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                <h4 className="font-sans font-semibold text-sm text-red-700">Danger Zone</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-ink">Arsipkan Acara</p>
                  <p className="text-[10px] text-ink-soft mt-0.5">
                    Acara tidak akan bisa diakses publik. Dapat dibatalkan kapan saja.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSave("Archived")}
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  {isSaving ? "Memproses..." : "Arsipkan"}
                </Button>
              </div>
            </Section>

            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2 font-medium text-xs"
            >
              <Check className="h-3.5 w-3.5" /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </TabsContent>

          {/* ── Tab 3: Hak Akses ─────────────────────────────────────────── */}
          <TabsContent value="security" className="pt-6 space-y-5 max-w-2xl text-xs">
            <Section>
              <div className="flex items-center justify-between">
                <SectionTitle icon={Users}>Kolaborator Acara</SectionTitle>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => setIsCollabModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-xl font-medium"
                >
                  + Tambah Kolaborator
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-rule/45 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="font-mono text-[9px] uppercase tracking-widest text-ink-soft bg-slate-50/65">
                      <TableHead>Nama</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Izin</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collaborators.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs shrink-0">
                              {c.initial}
                            </div>
                            <div>
                              <p className="font-semibold text-ink text-xs">{c.name}</p>
                              <p className="text-[10px] text-ink-soft">{c.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] text-primary font-semibold">
                            {c.role}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-ink-soft text-[10px]">
                          {c.permission}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.role === "Owner" ? (
                            <span className="text-[10px] text-ink-soft italic">Anda</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-[10px] text-ink-soft">
                Kolaborator dapat membantu mengelola tamu, membalas RSVP, dan mengedit konten
                undangan sesuai izin yang diberikan.
              </p>
            </Section>

            <Dialog open={isCollabModalOpen} onOpenChange={setIsCollabModalOpen}>
              <DialogContent
                className="max-w-md sm:rounded-2xl p-6"
                onPointerDownOutside={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold text-ink">
                    Tambah Kolaborator Acara
                  </DialogTitle>
                  <DialogDescription className="text-xs text-ink-soft">
                    Undang kolaborator untuk ikut membantu mengedit detail acara dan mengelola
                    daftar tamu.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Nama Kolaborator *</FieldLabel>
                    <Input
                      type="text"
                      value={newCollabName}
                      onChange={(e) => setNewCollabName(e.target.value)}
                      placeholder="Contoh: Hasan Basri"
                      className="bg-white rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Alamat Email *</FieldLabel>
                    <Input
                      type="email"
                      value={newCollabEmail}
                      onChange={(e) => setNewCollabEmail(e.target.value)}
                      placeholder="hasan@example.com"
                      className="bg-white rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Peran Acara</FieldLabel>
                      <Select onValueChange={setNewCollabRole} value={newCollabRole}>
                        <SelectTrigger className="w-full bg-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Owner">Owner</SelectItem>
                          <SelectItem value="Editor">Editor</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Izin Hak Akses</FieldLabel>
                      <Select onValueChange={setNewCollabPermission} value={newCollabPermission}>
                        <SelectTrigger className="w-full bg-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semua akses">Semua akses</SelectItem>
                          <SelectItem value="Akses Edit">Akses Edit</SelectItem>
                          <SelectItem value="Akses Baca">Akses Baca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCollabModalOpen(false)}
                    className="text-xs h-9 px-4 rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCollaborator}
                    className="text-xs h-9 px-4 rounded-xl"
                  >
                    Tambah Kolaborator
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
