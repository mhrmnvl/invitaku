import { createFileRoute, Link, useLoaderData, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateEvent, formatLocation } from "@/lib/events-api";
import { EventContextHeader } from "@/components/event-context-header";
import {
  Settings,
  Music,
  Image as ImageIcon,
  Type,
  MapPin,
  Calendar as CalendarIcon,
  Check,
  MessageSquare,
  BookOpen,
  Mail,
  Play,
  Pause,
  Volume2,
  Laptop,
  Tablet as TabletIcon,
  Smartphone,
  Maximize2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Heart,
  Music2,
  Compass,
  Sliders,
  Sparkles,
  Plus,
  Minus,
  X,
  Gift,
  QrCode,
  Share2,
  Copy,
  ChevronUp,
  ChevronDown,
  Building,
  Wallet,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_layout/events/$eventId/invitations")({
  component: BuilderPage,
});

// Curated Preset Palette Systems
export const COLOR_PALETTES = [
  { id: "rose", name: "Rose Garden", primary: "#9F1239", accent: "#FDA4AF", bg: "#FFF1F2" },
  { id: "sky", name: "Ocean Breeze", primary: "#0284C7", accent: "#7DD3FC", bg: "#F0F9FF" },
  { id: "emerald", name: "Botanical Forest", primary: "#047857", accent: "#6EE7B7", bg: "#ECFDF5" },
  { id: "gold", name: "Gold Elegance", primary: "#D97706", accent: "#FCD34D", bg: "#FFFBEB" },
  { id: "obsidian", name: "Dark Luxury", primary: "#1E1B18", accent: "#A8A29E", bg: "#F5F5F4" },
  { id: "indigo", name: "Royal Indigo", primary: "#4F46E5", accent: "#A5B4FC", bg: "#EEF2FF" },
];

export const TYPOGRAPHY_PAIRS = [
  { id: "elegant", name: "Elegant Serif", fontClass: "font-serif" },
  { id: "modern", name: "Clean Sans", fontClass: "font-sans" },
  { id: "luxury", name: "Cormorant Luxury", fontClass: "font-serif italic tracking-wide" },
  { id: "minimal", name: "Minimal Mono", fontClass: "font-mono" },
];

const HERO_LAYOUTS = [
  { id: "classic", name: "Classic", desc: "Gambar sampul penuh dengan teks" },
  { id: "centered", name: "Centered", desc: "Sampul lingkaran dengan teks tengah" },
  { id: "split", name: "Split Screen", desc: "Gambar dan teks berdampingan" },
  { id: "minimal", name: "Minimalist", desc: "Teks judul murni tanpa gambar" },
];

const GALLERY_LAYOUTS = [
  { id: "grid", name: "Grid Column", desc: "Format grid baris seimbang" },
  { id: "carousel", name: "Carousel Deck", desc: "Format geser horizontal" },
  { id: "masonry", name: "Masonry Flow", desc: "Format Pinterest staggered" },
];

const SECTION_STYLES = [
  { id: "rounded", name: "Soft Rounded", desc: "Sudut bulat halus dan bayangan tipis" },
  { id: "floating", name: "Floating Card", desc: "Efek kartu melayang dengan bayangan tebal" },
  { id: "card", name: "Crisp Flat", desc: "Garis hitam tebal tanpa efek bayangan" },
  { id: "minimal", name: "Clean Minimal", desc: "Tanpa kartu kotak, dibatasi garis tipis" },
];

const DIVIDER_STYLES = [
  { id: "ornament", name: "Flourish Heart", desc: "Ornamen ikon cinta romantis" },
  { id: "line", name: "Gradient Line", desc: "Garis tipis transisi memudar" },
  { id: "dots", name: "Minimal Dots", desc: "Tiga titik elegan minimalis" },
  { id: "none", name: "No Line Divider", desc: "Tanpa batas garis pemisah" },
];

const DEFAULT_STORY_TIMELINE = [
  {
    year: "2020",
    title: "Pertama Bertemu",
    desc: "Kami dipertemukan di sebuah kedai kopi kecil di sudut kota saat masa awal kuliah.",
  },
  {
    year: "2022",
    title: "Menjalin Kasih",
    desc: "Setelah berteman akrab, kami sepakat memulai komitmen serius sebagai sepasang kekasih.",
  },
  {
    year: "2024",
    title: "Lamaran Resmi",
    desc: "Di hadapan seluruh keluarga besar, kami mengikat janji suci untuk melangkah ke pernikahan.",
  },
];

const DEFAULT_GIFT_METHODS = [
  {
    id: "default-bank-1",
    type: "bank",
    providerName: "Bank Central Asia (BCA)",
    accountName: "Budi Santoso",
    accountNumber: "8040291039",
    isActive: true,
    isPrimary: true,
    displayOrder: 1,
  },
  {
    id: "default-bank-2",
    type: "bank",
    providerName: "Bank Mandiri",
    accountName: "Rania Wulandari",
    accountNumber: "1310029302192",
    isActive: true,
    isPrimary: false,
    displayOrder: 2,
  },
  {
    id: "default-address",
    type: "address",
    providerName: "Alamat Pengiriman",
    accountName: "Rumah Budi & Rania",
    accountNumber: "081234567890",
    address: "Perumahan Permata Hijau Blok C3 No. 12, Kebayoran Lama, Jakarta Selatan, 12240",
    isActive: true,
    isPrimary: false,
    displayOrder: 3,
  },
];

const PRESET_COVERS = [
  {
    id: "botanical",
    name: "Botanical Forest",
    url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&q=80&w=600",
    themeColor: "#1B4D3E",
  },
  {
    id: "terracotta",
    name: "Terracotta Minimalist",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    themeColor: "#A85A42",
  },
  {
    id: "obsidian",
    name: "Obsidian Marble",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
    themeColor: "#0F0D0B",
  },
  {
    id: "gold-minimal",
    name: "Warm Gold",
    url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600",
    themeColor: "#D4AF37",
  },
  {
    id: "indigo-abstract",
    name: "Indigo Paint",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
    themeColor: "#3F51B5",
  },
];

const MOCK_GALLERY = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
];

function BuilderPage() {
  const router = useRouter();
  const { event: activeEvent } = useLoaderData({ from: "/_layout/events/$eventId" }) as any;

  // DB-backed fields (Read-Only on UI, but kept in state for live preview rendering)
  const name = activeEvent.name || "";
  const description = activeEvent.description || "";
  const startDate = activeEvent.start_date || "";
  const startTime = activeEvent.start_time || "";
  const location = formatLocation(activeEvent.location) || "";
  const mapsUrl = activeEvent.maps_url || "";

  // Design builder active fields
  const [themeColor, setThemeColor] = useState(activeEvent.theme_color || "#1B4D3E");
  const [coverImage, setCoverImage] = useState(activeEvent.cover_image || PRESET_COVERS[0].url);

  // Settings states
  const [allowRsvp, setAllowRsvp] = useState(activeEvent.event_settings?.allow_rsvp ?? true);
  const [allowGuestBook, setAllowGuestBook] = useState(
    activeEvent.event_settings?.allow_guest_book ?? true,
  );
  const [allowGallery, setAllowGallery] = useState(
    activeEvent.event_settings?.allow_gallery ?? true,
  );
  const [allowMusic, setAllowMusic] = useState(activeEvent.event_settings?.allow_music ?? true);
  const [allowComments, setAllowComments] = useState(
    activeEvent.event_settings?.allow_comments ?? true,
  );
  const [allowCountdown, setAllowCountdown] = useState(
    activeEvent.event_settings?.allow_countdown ?? true,
  );
  const [allowGift, setAllowGift] = useState(activeEvent.event_settings?.allow_gift ?? true);
  const [allowStory, setAllowStory] = useState(activeEvent.event_settings?.allow_story ?? true);
  const [allowQrCode, setAllowQrCode] = useState(activeEvent.event_settings?.allow_qr_code ?? true);

  // Canva-style Visual Preset States
  const [colorPalette, setColorPalette] = useState(
    activeEvent.event_settings?.color_palette || "emerald",
  );
  const [typoPair, setTypoPair] = useState(activeEvent.event_settings?.typo_pair || "elegant");
  const [heroLayout, setHeroLayout] = useState(
    activeEvent.event_settings?.hero_layout || "classic",
  );
  const [galleryLayout, setGalleryLayout] = useState(
    activeEvent.event_settings?.gallery_layout || "grid",
  );
  const [sectionStyle, setSectionStyle] = useState(
    activeEvent.event_settings?.section_style || "rounded",
  );
  const [dividerStyle, setDividerStyle] = useState(
    activeEvent.event_settings?.divider_style || "ornament",
  );

  // User-editable Content States
  const [storyTimeline, setStoryTimeline] = useState<any[]>(
    activeEvent.event_settings?.story_timeline || DEFAULT_STORY_TIMELINE,
  );
  const [giftMethods, setGiftMethods] = useState<any[]>(
    activeEvent.event_settings?.gift_methods || DEFAULT_GIFT_METHODS,
  );

  // Client visual states
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [activeTab, setActiveTab] = useState<"appearance" | "features">("appearance");
  const [previewPhotos, setPreviewPhotos] = useState(MOCK_GALLERY);
  const [zoom, setZoom] = useState(1);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // File upload states
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");

  // Saving states
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [secondsAgoText, setSecondsAgoText] = useState("baru saja");
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle automatic saving (Debounced)
  const triggerSave = useCallback(
    async (currentSettings: any) => {
      setSaveStatus("saving");
      try {
        await updateEvent({
          data: {
            id: activeEvent.id,
            theme_color: currentSettings.themeColor,
            cover_image: currentSettings.coverImage,
            settings: {
              allow_rsvp: currentSettings.allowRsvp,
              allow_guest_book: currentSettings.allowGuestBook,
              allow_gallery: currentSettings.allowGallery,
              allow_music: currentSettings.allowMusic,
              allow_comments: currentSettings.allowComments,
              allow_countdown: currentSettings.allowCountdown,
              allow_gift: currentSettings.allowGift,
              allow_story: currentSettings.allowStory,
              allow_qr_code: currentSettings.allowQrCode,
              color_palette: currentSettings.colorPalette,
              typo_pair: currentSettings.typoPair,
              hero_layout: currentSettings.heroLayout,
              gallery_layout: currentSettings.galleryLayout,
              section_style: currentSettings.sectionStyle,
              divider_style: currentSettings.dividerStyle,
              story_timeline: currentSettings.storyTimeline,
              gift_methods: currentSettings.giftMethods,
            },
          },
        });
        setSaveStatus("saved");
        setLastSavedTime(new Date());
        setSecondsAgoText("baru saja");
        router.invalidate();
      } catch (e) {
        console.error(e);
        setSaveStatus("error");
      }
    },
    [activeEvent.id, router],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave({
        themeColor,
        coverImage,
        allowRsvp,
        allowGuestBook,
        allowGallery,
        allowMusic,
        allowComments,
        allowCountdown,
        allowGift,
        allowStory,
        allowQrCode,
        colorPalette,
        typoPair,
        heroLayout,
        galleryLayout,
        sectionStyle,
        dividerStyle,
        storyTimeline,
        giftMethods,
      });
    }, 1200); // 1.2s debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    themeColor,
    coverImage,
    allowRsvp,
    allowGuestBook,
    allowGallery,
    allowMusic,
    allowComments,
    allowCountdown,
    allowGift,
    allowStory,
    allowQrCode,
    colorPalette,
    typoPair,
    heroLayout,
    galleryLayout,
    sectionStyle,
    dividerStyle,
    storyTimeline,
    giftMethods,
    triggerSave,
  ]);

  // Relative timer for saving state
  useEffect(() => {
    if (!lastSavedTime) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - lastSavedTime.getTime()) / 1000);
      if (diff < 5) {
        setSecondsAgoText("baru saja");
      } else if (diff < 60) {
        setSecondsAgoText(`${diff} detik lalu`);
      } else {
        const mins = Math.floor(diff / 60);
        setSecondsAgoText(`${mins} menit lalu`);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [lastSavedTime]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File terlalu besar. Maksimal 5MB.");
      return;
    }

    setUploadState("uploading");
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");

    try {
      const fileExt = file.name.split(".").pop();
      const path = `${activeEvent.id}/cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("invitations").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("invitations").getPublicUrl(path);
      setCoverImage(data.publicUrl);
      setUploadState("done");
      toast.success("Foto sampul berhasil diunggah!");
    } catch (error) {
      console.error(error);
      setUploadState("error");
      toast.error("Gagal mengunggah foto. Silakan coba lagi.");
    }
  };

  const handleSelectPreset = (preset: (typeof PRESET_COVERS)[0]) => {
    setCoverImage(preset.url);
    setThemeColor(preset.themeColor);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Tanggal Belum Diatur";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Preview Interactive States
  const [rsvpState, setRsvpState] = useState<"idle" | "submitting" | "success">("idle");
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttendance, setRsvpAttendance] = useState("hadir");
  const [mockComments, setMockComments] = useState([
    {
      name: "Budi Santoso",
      message:
        "Selamat menempuh hidup baru untuk kedua mempelai! Semoga sakinah mawaddah warahmah.",
      date: "2 jam yang lalu",
    },
    {
      name: "Rania Wulandari",
      message: "Cantik sekali undangannya! Selamat yaa, insya Allah kami sekeluarga hadir.",
      date: "5 jam yang lalu",
    },
  ]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentMsg, setNewCommentMsg] = useState("");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentMsg.trim()) return;

    setMockComments([
      {
        name: newCommentName,
        message: newCommentMsg,
        date: "Baru saja",
      },
      ...mockComments,
    ]);
    setNewCommentName("");
    setNewCommentMsg("");
    toast.success("Ucapan berhasil ditambahkan ke pratinjau!");
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpState("submitting");
    setTimeout(() => {
      setRsvpState("success");
      toast.success("Konfirmasi RSVP terkirim (Pratinjau)!");
    }, 1000);
  };

  // Contextual Selection click handler (Silent)
  const handleSectionSelect = (tab: "appearance" | "features", sectionId: string) => {
    setActiveTab(tab);
    setSelectedSection(sectionId);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Event Context Header */}
      <div className="shrink-0">
        <EventContextHeader event={activeEvent} showStats={false} />
      </div>

      {/* Primary Builder Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[780px]">
        {/* Left Column: Design Inspector Sidebar */}
        <div className="flex flex-col h-full bg-white border border-rule/55 rounded-2xl p-5 overflow-y-auto shadow-xs shrink-0 select-none">
          {/* Managed Banner Header */}
          <div className="bg-slate-50 border border-rule/40 rounded-xl p-3 mb-5 flex items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <span className="font-mono text-[8px] uppercase tracking-widest text-ink-soft font-bold block">
                Informasi Acara
              </span>
              <span className="text-[11px] text-ink-soft leading-tight block">
                Nama, tanggal, dan lokasi dikelola dari Pengaturan.
              </span>
            </div>
            <Link to={`/events/${activeEvent.id}/settings`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-semibold border-rule/55 text-ink hover:bg-slate-50 bg-white gap-1 shrink-0 shadow-none rounded-lg"
              >
                Ubah <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {/* Design Inspector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            {[
              { id: "appearance", label: "Appearance", icon: Sliders },
              { id: "features", label: "Features", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-white text-ink shadow-xs"
                      : "text-ink-soft hover:text-ink hover:bg-white/40",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 space-y-6 text-left">
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in-40 duration-200">
                {/* 1. Color Palette Swatches */}
                <div className="flex flex-col gap-2.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                    Palet Warna Pilihan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_PALETTES.map((palette) => {
                      const isSelected = colorPalette === palette.id;
                      return (
                        <button
                          type="button"
                          key={palette.id}
                          onClick={() => {
                            setColorPalette(palette.id);
                            setThemeColor(palette.primary);
                          }}
                          className={cn(
                            "flex flex-col gap-2 p-2.5 rounded-xl border-2 text-left transition-all hover:bg-slate-50 cursor-pointer relative",
                            isSelected
                              ? "border-primary bg-primary/[0.01] shadow-xs"
                              : "border-rule/55 bg-white",
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ backgroundColor: palette.primary }}
                              className="h-3.5 w-3.5 rounded-full border border-black/5 shrink-0"
                            />
                            <span className="text-[10px] font-bold text-ink truncate">
                              {palette.name}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <div
                              className="h-2 flex-1 rounded-sm"
                              style={{ backgroundColor: palette.primary }}
                            />
                            <div
                              className="h-2 flex-1 rounded-sm"
                              style={{ backgroundColor: palette.accent }}
                            />
                            <div
                              className="h-2 flex-1 rounded-sm border border-rule/35"
                              style={{ backgroundColor: palette.bg }}
                            />
                          </div>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary text-white rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Typography Pair Swatches */}
                <div className="flex flex-col gap-2.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                    Kombinasi Huruf (Typography)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPOGRAPHY_PAIRS.map((typo) => {
                      const isSelected = typoPair === typo.id;
                      return (
                        <button
                          type="button"
                          key={typo.id}
                          onClick={() => setTypoPair(typo.id)}
                          className={cn(
                            "flex flex-col justify-between p-2.5 rounded-xl border-2 text-left transition-all hover:bg-slate-50 cursor-pointer relative h-[68px]",
                            isSelected
                              ? "border-primary bg-primary/[0.01] shadow-xs"
                              : "border-rule/55 bg-white",
                          )}
                        >
                          <span className="font-mono text-[8px] tracking-wider text-ink-soft font-bold block">
                            {typo.name}
                          </span>
                          <span
                            className={cn(
                              "text-base leading-none text-ink block mt-1",
                              typo.fontClass,
                            )}
                          >
                            Aa Bb Cc
                          </span>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary text-white rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Hero Section Layouts */}
                <div className="flex flex-col gap-2.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                    Desain Header (Hero Layout)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {HERO_LAYOUTS.map((layout) => {
                      const isSelected = heroLayout === layout.id;
                      return (
                        <button
                          type="button"
                          key={layout.id}
                          onClick={() => setHeroLayout(layout.id)}
                          className={cn(
                            "flex flex-col justify-between p-2.5 rounded-xl border-2 text-left transition-all hover:bg-slate-50 cursor-pointer relative h-[78px]",
                            isSelected
                              ? "border-primary bg-primary/[0.01] shadow-xs"
                              : "border-rule/55 bg-white",
                          )}
                        >
                          <div>
                            <span className="text-[10px] font-bold text-ink block leading-tight">
                              {layout.name}
                            </span>
                            <span className="text-[8px] text-ink-soft leading-tight block mt-0.5 max-w-[130px]">
                              {layout.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary text-white rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Section Styles */}
                <div className="flex flex-col gap-2.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                    Desain Kartu (Section Style)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_STYLES.map((style) => {
                      const isSelected = sectionStyle === style.id;
                      return (
                        <button
                          type="button"
                          key={style.id}
                          onClick={() => setSectionStyle(style.id)}
                          className={cn(
                            "flex flex-col justify-between p-2.5 rounded-xl border-2 text-left transition-all hover:bg-slate-50 cursor-pointer relative h-[78px]",
                            isSelected
                              ? "border-primary bg-primary/[0.01] shadow-xs"
                              : "border-rule/55 bg-white",
                          )}
                        >
                          <div>
                            <span className="text-[10px] font-bold text-ink block leading-tight">
                              {style.name}
                            </span>
                            <span className="text-[8px] text-ink-soft leading-tight block mt-0.5 max-w-[130px]">
                              {style.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary text-white rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Divider Styles */}
                <div className="flex flex-col gap-2.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                    Gaya Pembatas (Divider Style)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIVIDER_STYLES.map((style) => {
                      const isSelected = dividerStyle === style.id;
                      return (
                        <button
                          type="button"
                          key={style.id}
                          onClick={() => setDividerStyle(style.id)}
                          className={cn(
                            "flex flex-col justify-between p-2.5 rounded-xl border-2 text-left transition-all hover:bg-slate-50 cursor-pointer relative h-[78px]",
                            isSelected
                              ? "border-primary bg-primary/[0.01] shadow-xs"
                              : "border-rule/55 bg-white",
                          )}
                        >
                          <div>
                            <span className="text-[10px] font-bold text-ink block leading-tight">
                              {style.name}
                            </span>
                            <span className="text-[8px] text-ink-soft leading-tight block mt-0.5 max-w-[130px]">
                              {style.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary text-white rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Inlined Cover Preset Picker */}
                <div className="flex flex-col gap-2.5 border-t border-rule/35 pt-4">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                    Foto Sampul Undangan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_COVERS.map((preset) => {
                      const isSelected = coverImage === preset.url;
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={cn(
                            "group relative rounded-xl overflow-hidden border transition-all text-left h-14 relative cursor-pointer",
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-rule/80 hover:scale-105",
                          )}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1">
                            <span className="text-[7.5px] text-white font-medium block truncate">
                              {preset.name}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full">
                              <Check className="h-2 w-2" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Upload custom Cover photo directly inline */}
                  <div className="relative border border-dashed border-rule/75 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <ImageIcon className="h-4.5 w-4.5 text-ink-soft" />
                    <span className="text-[9.5px] font-semibold text-ink">Unggah Foto Kustom</span>
                  </div>

                  {uploadState !== "idle" && (
                    <Attachment
                      state={
                        uploadState === "uploading"
                          ? "uploading"
                          : uploadState === "done"
                            ? "done"
                            : "error"
                      }
                      className="w-full mt-2"
                    >
                      {coverImage && (uploadState === "done" || uploadState === "uploading") && (
                        <AttachmentMedia variant="image">
                          <img src={coverImage} alt="Cover Preview" />
                        </AttachmentMedia>
                      )}
                      <AttachmentContent>
                        <AttachmentTitle>{fileName || "Mengunggah foto..."}</AttachmentTitle>
                        <AttachmentDescription>
                          {uploadState === "uploading"
                            ? "Sedang memproses..."
                            : uploadState === "done"
                              ? `Selesai (${fileSize})`
                              : "Gagal mengunggah"}
                        </AttachmentDescription>
                      </AttachmentContent>
                    </Attachment>
                  )}
                </div>

                {/* Advanced Collapsible details */}
                <details className="group border-t border-rule/35 pt-4">
                  <summary className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold cursor-pointer list-none flex items-center justify-between">
                    <span>Pengaturan Lanjutan (Advanced)</span>
                    <ChevronRight className="h-3.5 w-3.5 text-ink-soft transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-1">
                    {/* Custom Hex Color Picker */}
                    <div className="flex flex-col gap-2 text-left">
                      <span className="text-[10px] text-ink-soft font-semibold">
                        Custom Hex Color
                      </span>
                      <div className="flex gap-2 items-center">
                        <div className="relative h-9 w-9 rounded-xl border border-rule/65 overflow-hidden shrink-0 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer">
                          <div
                            style={{ backgroundColor: themeColor }}
                            className="absolute inset-0"
                          />
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => {
                              setThemeColor(e.target.value);
                              setColorPalette("custom");
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <Input
                          type="text"
                          value={themeColor}
                          onChange={(e) => {
                            setThemeColor(e.target.value);
                            setColorPalette("custom");
                          }}
                          className="text-xs bg-white font-mono uppercase h-9 rounded-xl border-rule/50 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {activeTab === "features" && (
              <div className="space-y-4 animate-in fade-in-40 duration-200">
                {/* Visual Gallery Layout Preset Grid */}
                {allowGallery && (
                  <div className="flex flex-col gap-2.5 border-b border-rule/35 pb-4">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold">
                      Desain Album (Gallery Layout)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {GALLERY_LAYOUTS.map((layout) => {
                        const isSelected = galleryLayout === layout.id;
                        return (
                          <button
                            type="button"
                            key={layout.id}
                            onClick={() => setGalleryLayout(layout.id)}
                            className={cn(
                              "flex flex-col justify-between p-2 rounded-xl border-2 text-left transition-all hover:bg-slate-50 cursor-pointer relative h-[68px]",
                              isSelected
                                ? "border-primary bg-primary/[0.01] shadow-xs"
                                : "border-rule/55 bg-white",
                            )}
                          >
                            <span className="text-[10px] font-bold text-ink block leading-tight">
                              {layout.name}
                            </span>
                            <span className="text-[7.5px] text-ink-soft leading-tight block mt-0.5">
                              {layout.desc}
                            </span>
                            {isSelected && (
                              <span className="absolute top-1 right-1 h-3 w-3 bg-primary text-white rounded-full flex items-center justify-center">
                                <Check className="h-2 w-2" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold block mb-1">
                  Fitur Undangan Aktif
                </label>

                {/* Countdown Timer Switch Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Hitung Mundur (Countdown)</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Tampilkan jam hitung mundur real-time menuju pelaksanaan acara.
                      </p>
                    </div>
                    <Switch checked={allowCountdown} onCheckedChange={setAllowCountdown} />
                  </div>
                </div>

                {/* Love Story Timeline Switch Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Cerita Cinta (Love Story)</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Rangkai cerita awal pertemuan hingga momen pernikahan dalam timeline.
                      </p>
                    </div>
                    <Switch checked={allowStory} onCheckedChange={setAllowStory} />
                  </div>
                  {allowStory && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 self-start cursor-pointer">
                          Atur Cerita Cinta <ChevronRight className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[460px] max-h-[85vh] overflow-y-auto">
                        <div className="space-y-4 p-1 text-left">
                          <div>
                            <h4 className="text-sm font-bold text-ink">Perjalanan Kisah Cinta</h4>
                            <p className="text-[11px] text-ink-soft mt-0.5">
                              Rangkai momen penting perjalanan hubungan Anda secara kronologis.
                            </p>
                          </div>

                          <div className="space-y-3.5">
                            {storyTimeline.map((story, i) => (
                              <div
                                key={i}
                                className="p-3 bg-slate-50 border border-rule/50 rounded-xl space-y-2.5 relative"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[9px] uppercase tracking-wider text-ink-soft font-bold">
                                    Milestone #{i + 1}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={i === 0}
                                      onClick={() => {
                                        const next = [...storyTimeline];
                                        const temp = next[i];
                                        next[i] = next[i - 1];
                                        next[i - 1] = temp;
                                        setStoryTimeline(next);
                                      }}
                                      className="h-6 w-6 rounded-md hover:bg-slate-200 flex items-center justify-center"
                                    >
                                      <ChevronUp className="h-3.5 w-3.5 text-ink-soft" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={i === storyTimeline.length - 1}
                                      onClick={() => {
                                        const next = [...storyTimeline];
                                        const temp = next[i];
                                        next[i] = next[i + 1];
                                        next[i + 1] = temp;
                                        setStoryTimeline(next);
                                      }}
                                      className="h-6 w-6 rounded-md hover:bg-slate-200 flex items-center justify-center"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setStoryTimeline(
                                          storyTimeline.filter((_, idx) => idx !== i),
                                        );
                                        toast.success("Milestone berhasil dihapus!");
                                      }}
                                      className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-1 space-y-1">
                                    <label className="text-[9px] font-semibold text-ink-soft">
                                      Tahun
                                    </label>
                                    <Input
                                      type="text"
                                      value={story.year}
                                      onChange={(e) => {
                                        const next = [...storyTimeline];
                                        next[i] = { ...next[i], year: e.target.value };
                                        setStoryTimeline(next);
                                      }}
                                      placeholder="Contoh: 2020"
                                      className="text-xs h-8 bg-white"
                                    />
                                  </div>
                                  <div className="col-span-2 space-y-1">
                                    <label className="text-[9px] font-semibold text-ink-soft">
                                      Judul
                                    </label>
                                    <Input
                                      type="text"
                                      value={story.title}
                                      onChange={(e) => {
                                        const next = [...storyTimeline];
                                        next[i] = { ...next[i], title: e.target.value };
                                        setStoryTimeline(next);
                                      }}
                                      placeholder="Contoh: Pertama Bertemu"
                                      className="text-xs h-8 bg-white"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-semibold text-ink-soft">
                                    Deskripsi Cerita
                                  </label>
                                  <Textarea
                                    value={story.desc}
                                    onChange={(e) => {
                                      const next = [...storyTimeline];
                                      next[i] = { ...next[i], desc: e.target.value };
                                      setStoryTimeline(next);
                                    }}
                                    placeholder="Tulis kisah singkat milestone ini..."
                                    className="text-xs min-h-[50px] bg-white rounded-lg"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (storyTimeline.length >= 6) {
                                toast.error("Maksimal 6 milestone demi kerapian layout!");
                                return;
                              }
                              setStoryTimeline([
                                ...storyTimeline,
                                { year: "", title: "", desc: "" },
                              ]);
                            }}
                            className="w-full text-xs font-semibold h-8 rounded-xl border-dashed border-rule"
                          >
                            + Tambah Milestone Baru
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* RSVP Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Form RSVP Digital</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Konfirmasi pendaftaran kehadiran tamu secara digital.
                      </p>
                    </div>
                    <Switch checked={allowRsvp} onCheckedChange={setAllowRsvp} />
                  </div>
                </div>

                {/* Guest Book Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Buku Tamu / Doa</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Izinkan tamu mengirimkan doa restu yang langsung tayang.
                      </p>
                    </div>
                    <Switch checked={allowGuestBook} onCheckedChange={setAllowGuestBook} />
                  </div>
                  {allowGuestBook && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 self-start cursor-pointer">
                          Atur Ucapan Buku Tamu <ChevronRight className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[400px]">
                        <div className="space-y-3 p-1 text-left">
                          <div>
                            <h4 className="text-sm font-bold text-ink">Buku Tamu Undangan</h4>
                            <p className="text-[11px] text-ink-soft mt-0.5">
                              Kelola atau hapus salam ucapan dari tamu yang tampil di halaman.
                            </p>
                          </div>
                          <div className="text-xs font-mono bg-slate-50 border border-rule/50 rounded-xl p-3 max-h-[220px] overflow-y-auto space-y-2">
                            {mockComments.map((c, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-start gap-2 border-b border-rule/30 pb-2 last:border-0 last:pb-0"
                              >
                                <div className="text-left">
                                  <span className="font-bold block text-[10px] text-ink">
                                    {c.name}
                                  </span>
                                  <span className="text-[9px] text-ink-soft block mt-0.5">
                                    {c.message}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setMockComments(mockComments.filter((_, idx) => idx !== i));
                                    toast.success("Ucapan berhasil dihapus dari pratinjau!");
                                  }}
                                  className="h-5 w-5 text-rose-500 hover:text-rose-700 shrink-0 flex items-center justify-center"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Discussion Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Kolom Diskusi</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Sediakan kolom komentar publik bagi seluruh tamu.
                      </p>
                    </div>
                    <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                  </div>
                </div>

                {/* Gallery Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Galeri Momen</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Tampilkan album dokumentasi foto pra-acara.
                      </p>
                    </div>
                    <Switch checked={allowGallery} onCheckedChange={setAllowGallery} />
                  </div>
                  {allowGallery && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 self-start cursor-pointer">
                          Atur Album Galeri <ChevronRight className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[420px]">
                        <div className="space-y-4 p-1 text-left">
                          <div>
                            <h4 className="text-sm font-bold text-ink font-serif">
                              Galeri Foto Acara
                            </h4>
                            <p className="text-[11px] text-ink-soft mt-0.5">
                              Kelola foto album momen indah Anda pada pratinjau halaman.
                            </p>
                          </div>

                          {/* Image Grid */}
                          <div className="grid grid-cols-4 gap-2">
                            {previewPhotos.map((src, i) => (
                              <div
                                key={i}
                                className="relative aspect-square rounded-lg overflow-hidden border group"
                              >
                                <img src={src} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewPhotos(previewPhotos.filter((_, idx) => idx !== i));
                                    toast.success("Foto dihapus dari album!");
                                  }}
                                  className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full h-5.5 w-5.5 flex items-center justify-center shadow-md border border-white/20 transition-all cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Upload Area */}
                          <div className="relative border-2 border-dashed border-rule/70 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                toast.loading("Mengunggah foto...", { id: "gal-upload" });
                                try {
                                  const path = `${activeEvent.id}/gallery-${Date.now()}.${file.name.split(".").pop()}`;
                                  const { error } = await supabase.storage
                                    .from("invitations")
                                    .upload(path, file);
                                  if (error) throw error;
                                  const { data } = supabase.storage
                                    .from("invitations")
                                    .getPublicUrl(path);
                                  setPreviewPhotos([...previewPhotos, data.publicUrl]);
                                  toast.success("Foto ditambahkan ke album!", {
                                    id: "gal-upload",
                                  });
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Gagal mengunggah foto.", { id: "gal-upload" });
                                }
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <ImageIcon className="h-5 w-5 text-ink-soft" />
                            <span className="text-[10px] font-semibold text-ink">
                              Unggah Foto Baru
                            </span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Gift / Digital Transfer Switch Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Kado Digital & Hadiah</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Bagikan nomor rekening bank, e-wallet, QRIS, atau alamat pengiriman kado
                        fisik.
                      </p>
                    </div>
                    <Switch checked={allowGift} onCheckedChange={setAllowGift} />
                  </div>
                  {allowGift && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 self-start cursor-pointer">
                          Atur Metode Hadiah <ChevronRight className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto">
                        <GiftMethodManager
                          giftMethods={giftMethods}
                          setGiftMethods={setGiftMethods}
                          activeEventId={activeEvent.id}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* QR Code Check-In Switch Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Tiket Masuk QR Code</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Tampilkan tiket kode QR untuk registrasi kehadiran di venue.
                      </p>
                    </div>
                    <Switch checked={allowQrCode} onCheckedChange={setAllowQrCode} />
                  </div>
                </div>

                {/* Music Card */}
                <div className="p-4 bg-slate-50/60 border border-rule/50 rounded-2xl flex flex-col gap-2.5 text-left transition-all hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-ink">Musik Latar</h5>
                      <p className="text-[10px] text-ink-soft leading-relaxed max-w-[200px] mt-0.5">
                        Mainkan musik latar bernada tenang ketika undangan dibuka.
                      </p>
                    </div>
                    <Switch checked={allowMusic} onCheckedChange={setAllowMusic} />
                  </div>
                  {allowMusic && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 self-start cursor-pointer">
                          Atur Lagu Latar <ChevronRight className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[380px]">
                        <div className="space-y-4 p-1 text-left">
                          <div>
                            <h4 className="text-sm font-bold text-ink">Lagu Latar Undangan</h4>
                            <p className="text-[11px] text-ink-soft mt-0.5">
                              Unggah berkas MP3 kustom Anda atau gunakan track bawaan.
                            </p>
                          </div>

                          <div className="relative border border-dashed border-rule/75 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                            <input
                              type="file"
                              accept="audio/mp3,audio/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                toast.success(`Berkas musik "${file.name}" terpilih!`);
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <Music className="h-5 w-5 text-ink-soft" />
                            <span className="text-[10px] font-semibold text-ink">
                              Unggah MP3 Baru
                            </span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Canvas Area */}
        <div className="flex flex-col h-full bg-[#f8fafc] border border-rule/55 rounded-2xl overflow-hidden shadow-xs relative">
          {/* Top Canvas Toolbar */}
          <div className="h-[52px] border-b border-rule/35 flex items-center justify-between px-4 bg-white shrink-0">
            {/* Device selector with Tooltips */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-rule/30">
              {[
                { id: "mobile", icon: Smartphone, label: "Tampilan Ponsel" },
                { id: "tablet", icon: TabletIcon, label: "Tampilan Tablet" },
                { id: "desktop", icon: Laptop, label: "Tampilan Desktop" },
              ].map((dev) => {
                const Icon = dev.icon;
                return (
                  <Tooltip key={dev.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setDevice(dev.id as any)}
                        className={cn(
                          "p-1.5 rounded-md transition-all cursor-pointer",
                          device === dev.id
                            ? "bg-white text-primary shadow-xs"
                            : "text-ink-soft hover:text-ink",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white p-2">
                      {dev.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Zoom & Canvas controls in Toolbar */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-rule/30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    className="h-7 w-7 rounded text-ink-soft hover:text-ink cursor-pointer flex items-center justify-center"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white p-2">
                  Zoom Out
                </TooltipContent>
              </Tooltip>

              <span className="text-[10px] font-mono font-bold px-1.5 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                    className="h-7 w-7 rounded text-ink-soft hover:text-ink cursor-pointer flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white p-2">
                  Zoom In
                </TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setZoom(1)}
                className="h-7 px-1.5 text-[9px] font-semibold text-ink-soft hover:text-ink cursor-pointer"
              >
                Reset
              </Button>
            </div>

            {/* Auto-Saving status indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1.5 text-[11px] text-ink-soft/80 font-medium">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Menyimpan...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold transition-all">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Disimpan {secondsAgoText}
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    Gagal menyimpan
                  </span>
                )}
              </div>

              {/* Fullscreen Preview dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] font-semibold gap-1.5 bg-white border-rule/50 shadow-none rounded-lg"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Pratinjau Penuh</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] w-[1000px] h-[85vh] p-0 overflow-hidden flex flex-col bg-slate-50">
                  <div className="h-10 border-b border-rule/35 bg-white flex items-center justify-between px-4 shrink-0">
                    <span className="text-xs font-semibold text-ink">Pratinjau Undangan</span>
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <span className="sr-only">Close</span>
                      </Button>
                    </DialogClose>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
                    <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-md overflow-hidden">
                      <InvitationTemplateContent
                        name={name}
                        coverImage={coverImage}
                        themeColor={themeColor}
                        font={typoPair}
                        startDate={startDate}
                        startTime={startTime}
                        location={location}
                        mapsUrl={mapsUrl}
                        description={description}
                        allowRsvp={allowRsvp}
                        allowGuestBook={allowGuestBook}
                        allowGallery={allowGallery}
                        allowMusic={allowMusic}
                        allowComments={allowComments}
                        allowCountdown={allowCountdown}
                        allowGift={allowGift}
                        allowStory={allowStory}
                        allowQrCode={allowQrCode}
                        storyTimeline={storyTimeline}
                        giftMethods={giftMethods}
                        rsvpName={rsvpName}
                        setRsvpName={setRsvpName}
                        rsvpAttendance={rsvpAttendance}
                        setRsvpAttendance={setRsvpAttendance}
                        rsvpState={rsvpState}
                        handleRsvpSubmit={handleRsvpSubmit}
                        mockComments={mockComments}
                        newCommentName={newCommentName}
                        setNewCommentName={setNewCommentName}
                        newCommentMsg={newCommentMsg}
                        setNewCommentMsg={setNewCommentMsg}
                        handleAddComment={handleAddComment}
                        isPlayingMusic={isPlayingMusic}
                        setIsPlayingMusic={setIsPlayingMusic}
                        galleryImages={previewPhotos}
                        setLightboxImage={setLightboxImage}
                        formatDate={formatDate}
                        selectedSection={selectedSection}
                        onSectionClick={handleSectionSelect}
                        colorPalette={colorPalette}
                        heroLayout={heroLayout}
                        galleryLayout={galleryLayout}
                        sectionStyle={sectionStyle}
                        dividerStyle={dividerStyle}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Neutral Clean Workspace Canvas */}
          <div className="flex-1 w-full overflow-auto p-6 flex items-start justify-center">
            {/* Center preview iframe-like viewport */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
              className={cn(
                "bg-white shadow-lg relative transition-all duration-300 overflow-y-auto flex flex-col justify-between scrollbar-none shrink-0",
                device === "mobile" &&
                  "w-[360px] h-[640px] border-8 border-slate-900 rounded-[40px]",
                device === "tablet" &&
                  "w-[768px] h-[640px] border-8 border-slate-900 rounded-[28px]",
                device === "desktop" &&
                  "w-full max-w-[100%] h-full rounded-2xl border border-rule/35",
              )}
            >
              {device === "mobile" && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-slate-800" />
                </div>
              )}

              <InvitationTemplateContent
                name={name}
                coverImage={coverImage}
                themeColor={themeColor}
                font={typoPair}
                startDate={startDate}
                startTime={startTime}
                location={location}
                mapsUrl={mapsUrl}
                description={description}
                allowRsvp={allowRsvp}
                allowGuestBook={allowGuestBook}
                allowGallery={allowGallery}
                allowMusic={allowMusic}
                allowComments={allowComments}
                allowCountdown={allowCountdown}
                allowGift={allowGift}
                allowStory={allowStory}
                allowQrCode={allowQrCode}
                storyTimeline={storyTimeline}
                giftMethods={giftMethods}
                rsvpName={rsvpName}
                setRsvpName={setRsvpName}
                rsvpAttendance={rsvpAttendance}
                setRsvpAttendance={setRsvpAttendance}
                rsvpState={rsvpState}
                handleRsvpSubmit={handleRsvpSubmit}
                mockComments={mockComments}
                newCommentName={newCommentName}
                setNewCommentName={setNewCommentName}
                newCommentMsg={newCommentMsg}
                setNewCommentMsg={setNewCommentMsg}
                handleAddComment={handleAddComment}
                isPlayingMusic={isPlayingMusic}
                setIsPlayingMusic={setIsPlayingMusic}
                galleryImages={previewPhotos}
                setLightboxImage={setLightboxImage}
                formatDate={formatDate}
                selectedSection={selectedSection}
                onSectionClick={handleSectionSelect}
                colorPalette={colorPalette}
                heroLayout={heroLayout}
                galleryLayout={galleryLayout}
                sectionStyle={sectionStyle}
                dividerStyle={dividerStyle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for Gallery Preview */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <img
            src={lightboxImage}
            alt="Gallery Large"
            className="max-w-full max-h-[90vh] rounded-lg shadow-xl"
          />
        </div>
      )}
    </div>
  );
}

// Helper: Get section style class name
export function getSectionStyleClass(sectionStyle: string) {
  switch (sectionStyle) {
    case "floating":
      return "bg-white border border-rule/40 rounded-[24px] p-6 shadow-md hover:-translate-y-0.5 transition-all text-left space-y-4";
    case "card":
      return "bg-white border-2 border-slate-900 rounded-none p-5 md:p-6 shadow-none text-left space-y-4";
    case "minimal":
      return "bg-transparent border-0 border-b border-rule/45 rounded-none p-0 pb-8 last:border-b-0 shadow-none text-left space-y-4";
    case "rounded":
    default:
      return "bg-white border border-rule/55 rounded-2xl p-5 md:p-6 shadow-sm text-left space-y-4";
  }
}

// Helper: Real-time Live Countdown Component
export function CountdownTimer({
  targetDate,
  themeColor,
}: {
  targetDate: string;
  themeColor: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        ended: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.ended) {
    return (
      <div className="text-center py-2 text-xs font-bold text-slate-800 animate-pulse">
        🎉 Acara Telah Dimulai!
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-2.5 py-1">
      {[
        { val: timeLeft.days, unit: "Hari" },
        { val: timeLeft.hours, unit: "Jam" },
        { val: timeLeft.minutes, unit: "Menit" },
        { val: timeLeft.seconds, unit: "Detik" },
      ].map((block, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center w-14 py-2 rounded-xl text-white shadow-xs"
          style={{ backgroundColor: themeColor }}
        >
          <span className="text-base font-bold font-mono">
            {String(block.val).padStart(2, "0")}
          </span>
          <span className="text-[7.5px] uppercase tracking-wider font-semibold opacity-90">
            {block.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// Helper: Custom Divider Component
export function SectionDivider({ style, themeColor }: { style: string; themeColor: string }) {
  switch (style) {
    case "ornament":
      return (
        <div
          className="flex items-center justify-center py-4 my-1 opacity-70"
          style={{ color: themeColor }}
        >
          <div className="h-[1px] w-12 bg-current opacity-30 mr-3" />
          <Heart className="h-3.5 w-3.5 fill-current animate-pulse" />
          <div className="h-[1px] w-12 bg-current opacity-30 ml-3" />
        </div>
      );
    case "line":
      return (
        <div className="my-6 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      );
    case "dots":
      return (
        <div className="flex items-center justify-center gap-2 py-4 my-1 text-slate-400 opacity-60">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </div>
      );
    case "none":
    default:
      return <div className="h-3" />;
  }
}

// ----------------------------------------------------------------------
// RENDERABLE INVITATION PREVIEW TEMPLATE CONTENT
// ----------------------------------------------------------------------
export function InvitationTemplateContent({
  name,
  coverImage,
  themeColor,
  font,
  startDate,
  startTime,
  location,
  mapsUrl,
  description,
  allowRsvp,
  allowGuestBook,
  allowGallery,
  allowMusic,
  allowComments,
  allowCountdown,
  allowGift,
  allowStory,
  allowQrCode,
  storyTimeline,
  giftMethods,
  rsvpName,
  setRsvpName,
  rsvpAttendance,
  setRsvpAttendance,
  rsvpState,
  handleRsvpSubmit,
  mockComments,
  newCommentName,
  setNewCommentName,
  newCommentMsg,
  setNewCommentMsg,
  handleAddComment,
  isPlayingMusic,
  setIsPlayingMusic,
  galleryImages,
  setLightboxImage,
  formatDate,
  selectedSection,
  onSectionClick,
  colorPalette,
  heroLayout,
  galleryLayout,
  sectionStyle,
  dividerStyle,
}: any) {
  const triggerClick = (tab: "appearance" | "features", section: string) => {
    if (onSectionClick) {
      onSectionClick(tab, section);
    }
  };

  // Find active Palette background color context
  const activePalette = COLOR_PALETTES.find((p) => p.id === colorPalette) || COLOR_PALETTES[2];
  const activeTypo = TYPOGRAPHY_PAIRS.find((t) => t.id === font) || TYPOGRAPHY_PAIRS[0];

  const timelineData = storyTimeline || [];
  const methodsData = giftMethods || [];

  return (
    <div
      style={{
        backgroundColor: activePalette.bg,
      }}
      className={cn(
        "flex-1 w-full flex flex-col justify-start relative text-ink selection:bg-primary/20 pb-8 transition-colors duration-300",
        activeTypo.fontClass,
      )}
    >
      {/* Cover / Header Hero - Contextual Selection */}
      {heroLayout === "classic" && (
        <div
          onClick={() => triggerClick("appearance", "cover")}
          className={cn(
            "relative h-64 w-full overflow-hidden shrink-0 cursor-pointer border-2 transition-all rounded-t-2xl",
            selectedSection === "cover"
              ? "border-primary bg-primary/[0.01]"
              : "border-transparent hover:border-primary/20",
          )}
        >
          <img src={coverImage} alt="Event Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-6 text-center text-white gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-medium opacity-90">
              Dear Guest, You Are Invited
            </span>
            <h1 className="text-3xl md:text-4xl font-normal leading-tight font-serif drop-shadow-sm truncate max-w-full">
              {name || "Nama Acara"}
            </h1>
            <div className="h-[1.5px] w-8 bg-white/60 my-1" />
            <div className="flex items-center gap-1.5 text-xs font-mono tracking-wide opacity-95">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{formatDate(startDate)}</span>
            </div>
          </div>
          {selectedSection === "cover" && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
              Hero
            </div>
          )}
        </div>
      )}

      {heroLayout === "centered" && (
        <div
          onClick={() => triggerClick("appearance", "cover")}
          className={cn(
            "flex flex-col items-center justify-center pt-10 pb-7 px-6 text-center gap-4 border-b border-rule/35 cursor-pointer relative",
            selectedSection === "cover"
              ? "border-primary bg-primary/[0.01]"
              : "border-transparent hover:border-primary/20",
          )}
        >
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md">
            <img src={coverImage} alt="Event Cover" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-ink-soft">
              Special Invitation
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              {name || "Nama Acara"}
            </h1>
            <div className="flex items-center justify-center gap-1 text-[10px] text-ink-soft font-mono pt-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatDate(startDate)}</span>
            </div>
          </div>
          {selectedSection === "cover" && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
              Hero
            </div>
          )}
        </div>
      )}

      {heroLayout === "split" && (
        <div
          onClick={() => triggerClick("appearance", "cover")}
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 min-h-[220px] bg-white border-b border-rule/35 overflow-hidden cursor-pointer relative",
            selectedSection === "cover"
              ? "border-primary bg-primary/[0.01]"
              : "border-transparent hover:border-primary/20",
          )}
        >
          <div className="h-44 sm:h-full relative">
            <img src={coverImage} alt="Event Cover" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 flex flex-col justify-center gap-2.5 text-left bg-white/40">
            <span className="font-mono text-[8px] uppercase tracking-wider text-ink-soft">
              Event Invitation
            </span>
            <h1 className="text-xl font-bold leading-tight text-slate-800">
              {name || "Nama Acara"}
            </h1>
            <div className="flex items-center gap-1.5 text-[10.5px] text-ink-soft font-mono">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatDate(startDate)}</span>
            </div>
          </div>
          {selectedSection === "cover" && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
              Hero
            </div>
          )}
        </div>
      )}

      {heroLayout === "minimal" && (
        <div
          onClick={() => triggerClick("appearance", "cover")}
          className={cn(
            "py-12 px-6 text-center border-b border-rule/35 space-y-3 cursor-pointer relative",
            selectedSection === "cover"
              ? "border-primary bg-primary/[0.01]"
              : "border-transparent hover:border-primary/20",
          )}
        >
          <div className="inline-block px-3 py-0.5 border border-rule/55 rounded-full text-[8px] font-mono uppercase tracking-wider text-ink-soft">
            Special Invitation
          </div>
          <h1 className="text-3xl font-light tracking-wide text-slate-800">
            {name || "Nama Acara"}
          </h1>
          <div className="h-[2px] w-8 mx-auto" style={{ backgroundColor: themeColor }} />
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-mono text-ink-soft">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatDate(startDate)}</span>
          </div>
          {selectedSection === "cover" && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
              Hero
            </div>
          )}
        </div>
      )}

      {/* Main Core Body */}
      <div className="max-w-[640px] mx-auto w-full px-6 pt-8 space-y-6">
        {/* Intro Text Section */}
        <div className="text-center space-y-3.5">
          <Heart className="h-5 w-5 mx-auto animate-pulse" style={{ color: themeColor }} />
          <p className="text-xs text-ink-soft leading-relaxed max-w-[400px] mx-auto italic">
            {description ||
              "Menyambut hari bahagia kami bersama keluarga tercinta. Kehadiran dan doa restu Anda adalah anugerah terindah."}
          </p>
        </div>

        {/* 1. Countdown Timer Section */}
        {allowCountdown && startDate && (
          <div
            onClick={() => triggerClick("features", "countdown")}
            className={cn(
              "relative border-2 transition-all cursor-pointer",
              selectedSection === "countdown" ? "border-primary" : "border-transparent",
            )}
          >
            <div className={getSectionStyleClass(sectionStyle)}>
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold text-center block">
                Hitung Mundur Acara
              </span>
              <CountdownTimer
                targetDate={`${startDate}T${startTime || "00:00:00"}`}
                themeColor={themeColor}
              />
            </div>
            {selectedSection === "countdown" && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                Countdown
              </div>
            )}
          </div>
        )}

        <SectionDivider style={dividerStyle} themeColor={themeColor} />

        {/* Date Time Location Card */}
        <div className={getSectionStyleClass(sectionStyle)}>
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold text-center block">
            Detail Pelaksanaan
          </span>
          <div className="h-px bg-rule/35 w-8 mx-auto" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50/60 rounded-xl space-y-1 text-center flex flex-col items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-ink-soft mb-1" style={{ color: themeColor }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Waktu Acara
              </span>
              <p className="text-xs text-ink font-semibold mt-0.5">
                {startTime ? `Pukul ${startTime} WIB` : "Waktu Belum Diatur"}
              </p>
            </div>
            <div className="p-3 bg-slate-50/60 rounded-xl space-y-1 text-center flex flex-col items-center justify-center">
              <MapPin className="h-4.5 w-4.5 text-ink-soft mb-1" style={{ color: themeColor }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Lokasi Fisik
              </span>
              <p className="text-xs text-ink font-semibold truncate max-w-full mt-0.5">
                {location || "Lokasi Belum Diatur"}
              </p>
            </div>
          </div>

          {mapsUrl && (
            <div className="text-center pt-1">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-95 shadow-sm"
                style={{ backgroundColor: themeColor }}
              >
                <Compass className="h-3.5 w-3.5" />
                Buka Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* 2. Love Story Timeline Section */}
        {allowStory && timelineData.length > 0 && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "story")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "story" ? "border-primary" : "border-transparent",
              )}
            >
              <div className={getSectionStyleClass(sectionStyle)}>
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold text-center block">
                  Kisah Perjalanan Kami
                </span>
                <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 text-left my-4">
                  {timelineData.map((story: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span
                        className="absolute -left-[30px] top-0.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Heart className="h-2 w-2 text-white fill-current" />
                      </span>
                      <span
                        className="font-mono text-[9.5px] font-bold block"
                        style={{ color: themeColor }}
                      >
                        {story.year}
                      </span>
                      <h4 className="text-xs font-bold text-ink mt-0.5">{story.title}</h4>
                      <p className="text-[10px] text-ink-soft leading-relaxed mt-1">{story.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {selectedSection === "story" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  Love Story
                </div>
              )}
            </div>
          </>
        )}

        {/* Music Player Bar (Interactive & Contextual Selection) */}
        {allowMusic && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "music")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "music" ? "border-primary" : "border-transparent",
              )}
            >
              <div
                className={cn(
                  getSectionStyleClass(sectionStyle),
                  "flex-row items-center justify-between p-4 space-y-0",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center",
                      isPlayingMusic ? "bg-primary/10" : "bg-slate-100",
                    )}
                    style={{
                      backgroundColor: isPlayingMusic ? `${themeColor}12` : undefined,
                      color: isPlayingMusic ? themeColor : undefined,
                    }}
                  >
                    <Music2 className={cn("h-5 w-5", isPlayingMusic && "animate-spin")} />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft block font-mono">
                      Lagu Latar Undangan
                    </span>
                    <span className="text-xs font-semibold text-ink mt-0.5 block leading-tight">
                      {isPlayingMusic ? "Playing: Instrumental Love" : "Musik Latar Berhenti"}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayingMusic(!isPlayingMusic);
                  }}
                  className="h-9 w-9 rounded-xl shrink-0 cursor-pointer relative z-30"
                >
                  {isPlayingMusic ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
              {selectedSection === "music" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  Music
                </div>
              )}
            </div>
          </>
        )}

        {/* Photo Gallery Grid (Interactive & Contextual Selection) */}
        {allowGallery && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "gallery")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "gallery" ? "border-primary" : "border-transparent",
              )}
            >
              <div className={cn(getSectionStyleClass(sectionStyle), "p-4")}>
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold block text-center">
                  Galeri Dokumentasi
                </span>

                {galleryLayout === "grid" && (
                  <div className="grid grid-cols-2 gap-3">
                    {galleryImages.map((src: string, index: number) => (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(src);
                        }}
                        className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-rule/50 shadow-xs cursor-zoom-in"
                      >
                        <img
                          src={src}
                          alt={`Gallery ${index}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {galleryLayout === "carousel" && (
                  <div className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory">
                    {galleryImages.map((src: string, index: number) => (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(src);
                        }}
                        className="flex-shrink-0 w-44 aspect-[4/3] rounded-xl overflow-hidden border border-rule/50 shadow-xs cursor-zoom-in snap-center relative group"
                      >
                        <img
                          src={src}
                          alt={`Gallery ${index}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {galleryLayout === "masonry" && (
                  <div className="columns-2 gap-3 space-y-3">
                    {galleryImages.map((src: string, index: number) => (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(src);
                        }}
                        className="break-inside-avoid rounded-xl overflow-hidden border border-rule/50 shadow-xs cursor-zoom-in relative group"
                      >
                        <img
                          src={src}
                          alt={`Gallery ${index}`}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedSection === "gallery" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  Gallery
                </div>
              )}
            </div>
          </>
        )}

        {/* RSVP Form (Interactive & Contextual Selection) */}
        {allowRsvp && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "rsvp")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "rsvp" ? "border-primary" : "border-transparent",
              )}
            >
              <div className={getSectionStyleClass(sectionStyle)}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider pb-2 border-b border-rule/35">
                  <Mail className="h-4 w-4" style={{ color: themeColor }} /> Konfirmasi Kehadiran
                  (RSVP)
                </div>

                {rsvpState === "success" ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-semibold">RSVP Anda Berhasil Terkirim!</p>
                    <p className="text-[10px] text-emerald-700">
                      Terima kasih banyak atas konfirmasi Anda. Sampai jumpa di acara!
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRsvpState("idle");
                      }}
                      className="h-7 text-[10px] mt-2 rounded-lg bg-white relative z-30"
                    >
                      Reset RSVP
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.stopPropagation();
                      handleRsvpSubmit(e);
                    }}
                    className="space-y-3.5"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                        Nama Tamu
                      </label>
                      <Input
                        type="text"
                        required
                        value={rsvpName}
                        onChange={(e) => setRsvpName(e.target.value)}
                        placeholder="Nama Lengkap Anda"
                        className="text-xs bg-slate-50 rounded-xl"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                        Status Kehadiran
                      </label>
                      <Select value={rsvpAttendance} onValueChange={setRsvpAttendance}>
                        <SelectTrigger className="w-full text-xs bg-slate-50 h-9 rounded-xl">
                          <SelectValue placeholder="Pilih Kehadiran" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hadir">Ya, Saya Akan Hadir</SelectItem>
                          <SelectItem value="tidak_hadir">Maaf, Tidak Bisa Hadir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      disabled={rsvpState === "submitting"}
                      className="w-full text-xs font-semibold h-9 rounded-xl text-white shadow-none mt-1 cursor-pointer transition-all hover:opacity-95 relative z-30"
                      style={{ backgroundColor: themeColor }}
                    >
                      {rsvpState === "submitting" ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengirim...
                        </span>
                      ) : (
                        "Kirim Konfirmasi"
                      )}
                    </Button>
                  </form>
                )}
              </div>
              {selectedSection === "rsvp" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  RSVP
                </div>
              )}
            </div>
          </>
        )}

        {/* Guest Book / Comments Feed (Interactive & Contextual Selection) */}
        {(allowGuestBook || allowComments) && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "comments")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "comments" ? "border-primary" : "border-transparent",
              )}
            >
              <div className={getSectionStyleClass(sectionStyle)}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider pb-2 border-b border-rule/35">
                  <MessageSquare className="h-4 w-4" style={{ color: themeColor }} /> Doa Restu &
                  Ucapan
                </div>

                {/* Comment Form */}
                <form
                  onSubmit={(e) => {
                    e.stopPropagation();
                    handleAddComment(e);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="text"
                      required
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      placeholder="Nama Pengirim"
                      className="text-xs bg-slate-50 rounded-xl"
                    />
                    <Button
                      type="submit"
                      className="text-xs font-semibold h-9 rounded-xl text-white shadow-none transition-all hover:opacity-95 cursor-pointer relative z-30"
                      style={{ backgroundColor: themeColor }}
                    >
                      Kirim Ucapan
                    </Button>
                  </div>
                  <Textarea
                    required
                    value={newCommentMsg}
                    onChange={(e) => setNewCommentMsg(e.target.value)}
                    placeholder="Tuliskan ucapan & doa restu Anda..."
                    className="text-xs bg-slate-50 rounded-xl min-h-[60px]"
                  />
                </form>

                {/* Comments List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {mockComments.map((comment: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50/60 border border-rule/35 rounded-xl space-y-1.5 text-left animate-in slide-in-from-top-2 duration-150"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-ink">{comment.name}</span>
                        <span className="text-[9px] font-mono text-ink-soft">{comment.date}</span>
                      </div>
                      <p className="text-xs text-ink-soft leading-normal">{comment.message}</p>
                    </div>
                  ))}
                </div>
              </div>
              {selectedSection === "comments" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  Guestbook
                </div>
              )}
            </div>
          </>
        )}

        {/* 3. Gift / Digital Transfer Section */}
        {allowGift && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "gift")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "gift" ? "border-primary" : "border-transparent",
              )}
            >
              <div className={getSectionStyleClass(sectionStyle)}>
                {/* Section Header */}
                <div className="flex flex-col items-center gap-2 pb-1">
                  <div
                    className="p-2.5 rounded-xl inline-flex"
                    style={{ backgroundColor: themeColor + "18" }}
                  >
                    <Gift className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <span
                    className="font-mono text-[9px] uppercase tracking-widest font-bold text-center block"
                    style={{ color: themeColor }}
                  >
                    Kado &amp; Hadiah
                  </span>
                  <p className="text-[10px] text-ink-soft text-center leading-relaxed max-w-[320px] mx-auto">
                    Doa restu Anda adalah hadiah terbesar kami. Namun jika ingin memberikan tanda
                    kasih, berikut pilihan yang tersedia:
                  </p>
                </div>

                {/* Method Cards */}
                <div className="space-y-3 pt-1">
                  {methodsData
                    .filter((m: any) => m.isActive)
                    .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map((method: any) => {
                      const isPrimary = method.isPrimary;

                      // ── QRIS Card ──────────────────────────────────────
                      if (method.type === "qris") {
                        return (
                          <div
                            key={method.id}
                            className={cn(
                              "rounded-2xl overflow-hidden border transition-all",
                              isPrimary ? "border-2 shadow-sm" : "border-rule/40",
                            )}
                            style={isPrimary ? { borderColor: themeColor } : undefined}
                          >
                            <div
                              className="px-4 py-2.5 flex items-center justify-between"
                              style={{ backgroundColor: themeColor + "14" }}
                            >
                              <div className="flex items-center gap-2">
                                <QrCode className="h-3.5 w-3.5" style={{ color: themeColor }} />
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                  style={{ color: themeColor }}
                                >
                                  {method.providerName || "QRIS"}
                                </span>
                              </div>
                              {isPrimary && (
                                <span
                                  className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white uppercase tracking-wider"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  Utama
                                </span>
                              )}
                            </div>
                            <div className="bg-white px-4 py-4 flex flex-col items-center gap-3">
                              {method.imageUrl ? (
                                <>
                                  <div className="border-[3px] border-slate-100 p-2 bg-white rounded-xl shadow-xs max-w-[180px] w-full mx-auto">
                                    <img
                                      src={method.imageUrl}
                                      alt="QRIS Code"
                                      className="w-full h-auto rounded-lg"
                                    />
                                  </div>
                                  <p className="text-[9px] text-ink-soft text-center leading-normal">
                                    Pindai menggunakan mobile banking atau e-wallet favorit Anda.
                                  </p>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        className="h-8 text-[10px] font-bold gap-1.5 bg-white border-rule/50 shadow-none rounded-xl w-full max-w-[200px] relative z-30 cursor-pointer"
                                      >
                                        <Maximize2 className="h-3 w-3" /> Perbesar QRIS
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[340px] flex items-center justify-center p-6">
                                      <div className="text-center space-y-4 w-full">
                                        <h4
                                          className="text-xs font-bold uppercase tracking-wider"
                                          style={{ color: themeColor }}
                                        >
                                          {method.providerName}
                                        </h4>
                                        <div className="border-4 border-slate-100 p-2 bg-white rounded-xl shadow-xs">
                                          <img
                                            src={method.imageUrl}
                                            alt="QRIS Enlarge"
                                            className="w-full max-h-[380px] object-contain rounded-lg"
                                          />
                                        </div>
                                        <p className="text-[9px] text-ink-soft leading-normal">
                                          Pindai kode QRIS di atas untuk melakukan transfer digital.
                                        </p>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              ) : (
                                <div className="py-4 text-center">
                                  <QrCode className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                  <span className="text-[10px] text-ink-soft italic block">
                                    QRIS belum diunggah
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // ── Address Card ───────────────────────────────────
                      if (method.type === "address") {
                        return (
                          <div
                            key={method.id}
                            className={cn(
                              "rounded-2xl overflow-hidden border transition-all",
                              isPrimary ? "border-2 shadow-sm" : "border-rule/40",
                            )}
                            style={isPrimary ? { borderColor: themeColor } : undefined}
                          >
                            <div
                              className="px-4 py-2.5 flex items-center justify-between"
                              style={{ backgroundColor: themeColor + "14" }}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" style={{ color: themeColor }} />
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                  style={{ color: themeColor }}
                                >
                                  {method.providerName || "Alamat Pengiriman"}
                                </span>
                              </div>
                              {isPrimary && (
                                <span
                                  className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white uppercase tracking-wider"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  Utama
                                </span>
                              )}
                            </div>
                            <div className="bg-white px-4 py-3.5 space-y-2.5">
                              <div>
                                <span className="text-[10.5px] font-bold text-ink block">
                                  {method.accountName}
                                </span>
                                {method.accountNumber && (
                                  <span className="text-[9.5px] text-ink-soft font-mono block mt-0.5">
                                    {method.accountNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-ink-soft leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-rule/30">
                                {method.address}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    `${method.accountName}\n${method.accountNumber || ""}\n${method.address}`,
                                  );
                                  toast.success("Alamat pengiriman berhasil disalin!");
                                }}
                                className="h-8 text-[10px] font-bold gap-1.5 bg-white border-rule/50 shadow-none rounded-xl w-full relative z-30 cursor-pointer"
                              >
                                <Copy className="h-3 w-3" /> Salin Alamat Kirim
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      // ── Bank / E-Wallet Card ───────────────────────────
                      const TypeIcon = method.type === "bank" ? Building : Wallet;
                      const typeLabel = method.type === "bank" ? "Transfer Bank" : "E-Wallet";
                      return (
                        <div
                          key={method.id}
                          className={cn(
                            "rounded-2xl overflow-hidden border transition-all",
                            isPrimary ? "border-2 shadow-sm" : "border-rule/40",
                          )}
                          style={isPrimary ? { borderColor: themeColor } : undefined}
                        >
                          {/* Themed header strip */}
                          <div
                            className="px-4 py-2.5 flex items-center justify-between"
                            style={{ backgroundColor: themeColor + "14" }}
                          >
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-3.5 w-3.5" style={{ color: themeColor }} />
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: themeColor }}
                              >
                                {typeLabel}
                              </span>
                            </div>
                            {isPrimary && (
                              <span
                                className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white uppercase tracking-wider"
                                style={{ backgroundColor: themeColor }}
                              >
                                Utama
                              </span>
                            )}
                          </div>

                          {/* Card body: info left + copy button right */}
                          <div className="bg-white px-4 py-3.5 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide block mb-1">
                                {method.providerName}
                              </span>
                              <span className="text-sm font-mono font-bold text-ink block leading-tight tracking-wide">
                                {method.accountNumber || "—"}
                              </span>
                              <span className="text-[9.5px] text-ink-soft block mt-0.5">
                                a/n{" "}
                                <span className="font-semibold text-ink">{method.accountName}</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(method.accountNumber || "");
                                toast.success(
                                  method.type === "bank"
                                    ? `Rekening ${method.providerName} berhasil disalin!`
                                    : `Nomor ${method.providerName} berhasil disalin!`,
                                );
                              }}
                              className="shrink-0 flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl transition-all hover:opacity-80 active:scale-95 relative z-30 cursor-pointer"
                              style={{ backgroundColor: themeColor + "15" }}
                            >
                              <Copy className="h-4 w-4" style={{ color: themeColor }} />
                              <span
                                className="text-[7.5px] font-bold uppercase tracking-wider"
                                style={{ color: themeColor }}
                              >
                                Salin
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {methodsData.filter((m: any) => m.isActive).length === 0 && (
                    <div className="text-center py-8 text-xs text-ink-soft italic flex flex-col items-center gap-2">
                      <Gift className="h-8 w-8 text-slate-200" />
                      Belum ada metode kado digital/hadiah fisik yang aktif.
                    </div>
                  )}
                </div>
              </div>
              {selectedSection === "gift" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  Gift Section
                </div>
              )}
            </div>
          </>
        )}

        {/* 4. QR Code Badge Section */}
        {allowQrCode && (
          <>
            <SectionDivider style={dividerStyle} themeColor={themeColor} />
            <div
              onClick={() => triggerClick("features", "qrcode")}
              className={cn(
                "relative border-2 transition-all cursor-pointer",
                selectedSection === "qrcode" ? "border-primary" : "border-transparent",
              )}
            >
              <div className={getSectionStyleClass(sectionStyle)}>
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-bold text-center block">
                  Tiket Masuk Tamu (QR Code Check-In)
                </span>
                <div className="p-5 bg-white border border-rule/45 rounded-2xl max-w-[280px] mx-auto text-center space-y-4 shadow-xs">
                  <div className="relative w-28 h-28 mx-auto border-2 border-slate-100 p-2 rounded-xl flex items-center justify-center bg-slate-50">
                    <QrCode className="h-20 w-20 text-slate-800" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold text-ink block">Kode Tiket Tamu</span>
                    <span className="text-[9px] font-mono text-ink-soft block uppercase">
                      INV-BUDI-HADIR
                    </span>
                  </div>
                  <p className="text-[9px] text-ink-soft leading-relaxed">
                    Simpan tangkapan layar (screenshot) kode QR ini untuk ditunjukkan kepada petugas
                    resepsionis di venue acara.
                  </p>
                </div>
              </div>
              {selectedSection === "qrcode" && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs z-30 uppercase tracking-wider animate-in fade-in duration-100">
                  QR Check-in
                </div>
              )}
            </div>
          </>
        )}

        {/* 5. Branded Footer */}
        <div className="pt-12 pb-6 text-center space-y-6 border-t border-rule/35 mt-12 bg-white/20 -mx-6 px-6 rounded-b-2xl">
          <div className="space-y-1.5">
            <span className="font-serif italic text-base leading-none text-ink block">
              {name || "Nama Acara"}
            </span>
            <span className="text-[10px] text-ink-soft block font-mono">
              {formatDate(startDate)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(window.location.href);
                toast.success("Tautan undangan berhasil disalin!");
              }}
              className="h-8 text-[10px] font-bold gap-1 bg-white border-rule/50 shadow-none rounded-lg relative z-30 cursor-pointer"
            >
              <Share2 className="h-3 w-3" /> Bagikan Undangan
            </Button>
          </div>

          <div className="h-px bg-rule/35 w-16 mx-auto" />

          <div className="flex flex-col items-center gap-1">
            <span className="text-[8.5px] text-ink-soft font-mono uppercase tracking-wider block">
              Powered by
            </span>
            <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1 select-none">
              <Heart className="h-3 w-3 text-rose-500 fill-current" /> Invitaku
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MODULAR SIDEBAR GIFT METHODS MANAGER COMPONENT
// ----------------------------------------------------------------------
function GiftMethodManager({ giftMethods, setGiftMethods, activeEventId }: any) {
  const [mode, setMode] = useState<"list" | "select-type" | "add" | "edit">("list");
  const [editingMethod, setEditingMethod] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [customProvider, setCustomProvider] = useState("");

  const handleOpenAdd = () => {
    setMode("select-type");
    setEditingMethod({
      id: "gift-" + Date.now(),
      type: "bank",
      providerName: "",
      accountName: "",
      accountNumber: "",
      imageUrl: "",
      address: "",
      isActive: true,
      isPrimary: false,
      displayOrder: giftMethods.length + 1,
    });
    setCustomProvider("");
  };

  const handleSelectType = (type: "bank" | "ewallet" | "qris" | "address") => {
    setEditingMethod((prev: any) => ({
      ...prev,
      type,
      providerName: type === "qris" ? "QRIS" : type === "address" ? "Alamat Pengiriman" : "",
    }));
    setMode("add");
  };

  const handleOpenEdit = (method: any) => {
    setEditingMethod({ ...method });
    const isCommonPreset = [
      "Bank Central Asia (BCA)",
      "Bank Mandiri",
      "Bank Negara Indonesia (BNI)",
      "Bank Rakyat Indonesia (BRI)",
      "Bank CIMB Niaga",
      "Bank Syariah Indonesia (BSI)",
      "GoPay",
      "OVO",
      "DANA",
      "ShopeePay",
      "LinkAja",
    ].includes(method.providerName);

    if (!isCommonPreset && method.type !== "qris" && method.type !== "address") {
      setCustomProvider(method.providerName);
      setEditingMethod((prev: any) => ({ ...prev, providerName: "Custom" }));
    } else {
      setCustomProvider("");
    }
    setMode("edit");
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("QRIS maksimal 3MB.");
      return;
    }

    setIsUploading(true);
    toast.loading("Mengunggah berkas QRIS...", { id: "qris-up" });

    try {
      const path = `${activeEventId}/qris-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("invitations").upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from("invitations").getPublicUrl(path);
      setEditingMethod((prev: any) => ({ ...prev, imageUrl: data.publicUrl }));
      toast.success("QRIS berhasil diunggah!", { id: "qris-up" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah QRIS.", { id: "qris-up" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    let finalProvider = editingMethod.providerName;
    if (editingMethod.providerName === "Custom") {
      if (!customProvider.trim()) {
        toast.error("Mohon isi nama provider kustom!");
        return;
      }
      finalProvider = customProvider;
    }

    const payload = {
      ...editingMethod,
      providerName: finalProvider,
    };

    let updatedMethods = [...giftMethods];

    // Primary rule: if this is primary, clear primary on other methods
    if (payload.isPrimary) {
      updatedMethods = updatedMethods.map((m) => ({ ...m, isPrimary: false }));
    }

    if (mode === "add") {
      updatedMethods.push(payload);
    } else {
      updatedMethods = updatedMethods.map((m) => (m.id === payload.id ? payload : m));
    }

    setGiftMethods(updatedMethods);
    toast.success("Metode hadiah berhasil disimpan!");
    setMode("list");
  };

  const handleDelete = (id: string) => {
    const next = giftMethods.filter((m: any) => m.id !== id);
    setGiftMethods(next);
    toast.success("Metode kado telah dihapus!");
  };

  const handleToggleActive = (id: string, active: boolean) => {
    const next = giftMethods.map((m: any) => (m.id === id ? { ...m, isActive: active } : m));
    setGiftMethods(next);
  };

  return (
    <div className="space-y-4 p-1 text-left text-xs">
      {mode === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-ink">Metode Kado & Pembayaran</h4>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Kelola rekening, dompet digital, QRIS, dan kado fisik Anda.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="h-8 text-[10px] font-bold bg-primary hover:bg-primary/95 text-white"
            >
              + Add Gift Method
            </Button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {giftMethods
              .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
              .map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 border border-rule/45 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-white rounded-lg border border-rule/35 shrink-0 flex items-center justify-center">
                      {m.type === "bank" && <Building className="h-4.5 w-4.5 text-ink-soft" />}
                      {m.type === "ewallet" && <Wallet className="h-4.5 w-4.5 text-ink-soft" />}
                      {m.type === "qris" && <QrCode className="h-4.5 w-4.5 text-ink-soft" />}
                      {m.type === "address" && <MapPin className="h-4.5 w-4.5 text-ink-soft" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink text-[11.5px] truncate">
                          {m.providerName}
                        </span>
                        {m.isPrimary && (
                          <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 font-mono scale-90 uppercase">
                            Utama
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-soft block truncate mt-0.5">
                        {m.type === "address" ? m.accountName : m.accountNumber || "No Account"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Switch
                      checked={m.isActive}
                      onCheckedChange={(val) => handleToggleActive(m.id, val)}
                      className="scale-90"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(m)}
                      className="h-7 w-7 text-ink hover:bg-slate-200 rounded-lg"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(m.id)}
                      className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            {giftMethods.length === 0 && (
              <div className="text-center py-8 text-ink-soft italic">
                Belum ada metode kado digital/hadiah fisik yang diatur.
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "select-type" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-ink">Pilih Tipe Metode Kado</h4>
            <p className="text-[11px] text-ink-soft mt-0.5">
              Pilih jenis metode penerimaan hadiah kado untuk tamu undangan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {[
              { id: "bank", name: "Transfer Bank", icon: Building, desc: "BCA, Mandiri, BNI, dll" },
              {
                id: "ewallet",
                name: "E-Wallet",
                icon: Wallet,
                desc: "GoPay, OVO, DANA, dll",
              },
              { id: "qris", name: "QRIS Scanner", icon: QrCode, desc: "Pindai QR Kode digital" },
              { id: "address", name: "Kirim Kado Fisik", icon: MapPin, desc: "Alamat rumah kirim" },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSelectType(t.id as any)}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-rule/55 rounded-xl text-left transition-all hover:scale-102 flex flex-col gap-2 cursor-pointer shadow-xs"
                >
                  <div className="p-2 bg-white rounded-lg border border-rule/35 shrink-0 w-8 h-8 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-800" />
                  </div>
                  <div>
                    <span className="font-bold text-ink text-[11.5px] block">{t.name}</span>
                    <span className="text-[9px] text-ink-soft block mt-0.5 leading-normal">
                      {t.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setMode("list")}
            className="w-full text-xs font-semibold h-9 rounded-xl mt-3"
          >
            Batal
          </Button>
        </div>
      )}

      {(mode === "add" || mode === "edit") && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-ink">
              {mode === "add" ? "Tambah Detail Kado" : "Edit Detail Kado"}
            </h4>
            <p className="text-[11px] text-ink-soft mt-0.5">
              Isi parameter metode penerimaan hadiah kado digital/hadiah fisik.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {editingMethod.type === "bank" && (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Pilih Bank
                  </label>
                  <Select
                    value={editingMethod.providerName || ""}
                    onValueChange={(val) =>
                      setEditingMethod((prev: any) => ({ ...prev, providerName: val }))
                    }
                  >
                    <SelectTrigger className="w-full text-xs bg-slate-50 h-9 rounded-xl">
                      <SelectValue placeholder="Pilih Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Central Asia (BCA)">
                        Bank Central Asia (BCA)
                      </SelectItem>
                      <SelectItem value="Bank Mandiri">Bank Mandiri</SelectItem>
                      <SelectItem value="Bank Negara Indonesia (BNI)">
                        Bank Negara Indonesia (BNI)
                      </SelectItem>
                      <SelectItem value="Bank Rakyat Indonesia (BRI)">
                        Bank Rakyat Indonesia (BRI)
                      </SelectItem>
                      <SelectItem value="Bank CIMB Niaga">Bank CIMB Niaga</SelectItem>
                      <SelectItem value="Bank Syariah Indonesia (BSI)">
                        Bank Syariah Indonesia (BSI)
                      </SelectItem>
                      <SelectItem value="Custom">Bank Kustom / Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingMethod.providerName === "Custom" && (
                  <div className="space-y-1.5 text-left animate-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                      Nama Bank Kustom
                    </label>
                    <Input
                      type="text"
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      placeholder="Masukkan nama bank"
                      className="text-xs bg-slate-50 h-9 rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Nomor Rekening
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.accountNumber || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, accountNumber: e.target.value }))
                    }
                    placeholder="Masukkan nomor rekening bank"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Atas Nama Pemilik
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.accountName || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, accountName: e.target.value }))
                    }
                    placeholder="Contoh: Budi Santoso"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>
              </>
            )}

            {editingMethod.type === "ewallet" && (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Pilih E-Wallet
                  </label>
                  <Select
                    value={editingMethod.providerName || ""}
                    onValueChange={(val) =>
                      setEditingMethod((prev: any) => ({ ...prev, providerName: val }))
                    }
                  >
                    <SelectTrigger className="w-full text-xs bg-slate-50 h-9 rounded-xl">
                      <SelectValue placeholder="Pilih E-Wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GoPay">GoPay</SelectItem>
                      <SelectItem value="OVO">OVO</SelectItem>
                      <SelectItem value="DANA">DANA</SelectItem>
                      <SelectItem value="ShopeePay">ShopeePay</SelectItem>
                      <SelectItem value="LinkAja">LinkAja</SelectItem>
                      <SelectItem value="Custom">E-Wallet Kustom / Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingMethod.providerName === "Custom" && (
                  <div className="space-y-1.5 text-left animate-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                      Nama E-Wallet Kustom
                    </label>
                    <Input
                      type="text"
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      placeholder="Masukkan nama dompet digital"
                      className="text-xs bg-slate-50 h-9 rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Nomor HP / Nomor Akun
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.accountNumber || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, accountNumber: e.target.value }))
                    }
                    placeholder="Contoh: 081234567890"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Nama Pemilik Akun
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.accountName || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, accountName: e.target.value }))
                    }
                    placeholder="Contoh: Budi Santoso"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>
              </>
            )}

            {editingMethod.type === "qris" && (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Nama Provider QRIS
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.providerName || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, providerName: e.target.value }))
                    }
                    placeholder="Contoh: QRIS GoPay, QRIS BNI"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block">
                    Upload Berkas QRIS (MVP)
                  </label>
                  <div className="relative border-2 border-dashed border-rule/70 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <QrCode className="h-6 w-6 text-slate-800" />
                    <span className="text-[10.5px] font-semibold text-ink">
                      {isUploading ? "Mengunggah..." : "Pilih File QRIS"}
                    </span>
                  </div>

                  {editingMethod.imageUrl && (
                    <div className="mt-2.5 border p-1 bg-white rounded-lg max-w-[100px] mx-auto relative animate-in zoom-in-95">
                      <img
                        src={editingMethod.imageUrl}
                        alt="QRIS Preview"
                        className="w-full h-auto rounded"
                      />
                    </div>
                  )}

                  {/* Payment Gateway Future integration notice points */}
                  <div className="bg-slate-50 border border-rule/45 rounded-xl p-3 flex items-start gap-2.5 mt-2 text-ink-soft">
                    <Info className="h-4.5 w-4.5 text-ink-soft shrink-0 mt-0.5" />
                    <p className="text-[9px] leading-relaxed">
                      <strong>Info Gateway:</strong> Arsitektur sistem kado siap dikembangkan untuk
                      gateway otomatis seperti <strong>Dynamic QRIS</strong>,{" "}
                      <strong>Midtrans</strong>, <strong>Xendit</strong>, atau{" "}
                      <strong>Tripay</strong> tanpa perlu refaktor ulang skema database.
                    </p>
                  </div>
                </div>
              </>
            )}

            {editingMethod.type === "address" && (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Nama Penerima Kado Fisik
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.accountName || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, accountName: e.target.value }))
                    }
                    placeholder="Contoh: Budi Santoso"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Nomor Telepon Penerima
                  </label>
                  <Input
                    type="text"
                    value={editingMethod.accountNumber || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, accountNumber: e.target.value }))
                    }
                    placeholder="Contoh: 081234567890"
                    className="text-xs bg-slate-50 h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                    Alamat Pengiriman Lengkap
                  </label>
                  <Textarea
                    value={editingMethod.address || ""}
                    onChange={(e) =>
                      setEditingMethod((prev: any) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kota, kode pos..."
                    className="text-xs min-h-[70px] bg-slate-50 rounded-xl"
                  />
                </div>
              </>
            )}

            {/* Common Settings Fields */}
            <div className="pt-3 border-t border-rule/35 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold text-ink block">Metode Utama</span>
                  <span className="text-[9px] text-ink-soft block">
                    Jadikan sebagai pilihan utama hadiah
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingMethod.isPrimary || false}
                  onChange={(e) =>
                    setEditingMethod((prev: any) => ({ ...prev, isPrimary: e.target.checked }))
                  }
                  className="h-4.5 w-4.5 accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold text-ink block">Tampilkan Metode</span>
                  <span className="text-[9px] text-ink-soft block">
                    Aktifkan di halaman undangan
                  </span>
                </div>
                <Switch
                  checked={editingMethod.isActive ?? true}
                  onCheckedChange={(val) =>
                    setEditingMethod((prev: any) => ({ ...prev, isActive: val }))
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="col-span-2">
                  <span className="text-[10.5px] font-bold text-ink block">Urutan Tampilan</span>
                  <span className="text-[9px] text-ink-soft block">
                    Urutan prioritas letak dari atas
                  </span>
                </div>
                <Input
                  type="number"
                  value={editingMethod.displayOrder || 1}
                  onChange={(e) =>
                    setEditingMethod((prev: any) => ({
                      ...prev,
                      displayOrder: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="text-xs h-8 bg-slate-50 text-center"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("list")}
              className="h-9 text-xs font-semibold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 text-xs font-semibold rounded-xl bg-primary text-white"
            >
              Simpan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
