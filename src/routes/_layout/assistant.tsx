import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Copy,
  FileText,
  Send,
  RefreshCw,
  Check,
  HelpCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  Info,
  Languages,
  AlertTriangle,
  Trash2,
  Star,
  Maximize2,
  Minimize2,
  PenTool,
  Globe,
  Heart,
  Mail,
  Feather,
  Briefcase,
  SpellCheck,
  ChevronRight,
  ChevronDown,
  ListChecks,
  Settings2,
  CalendarDays,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getEvents, getEventById, updateEvent, DbEvent, formatLocation } from "@/lib/events-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GenerateInput {
  eventId?: string;
  actionId: string;
  tone: string;
  prompt: string;
  history?: { role: "user" | "model"; content: string }[];
}

// Server Function untuk memanggil Gemini API secara aman di backend
const generateInvitationText = createServerFn({ method: "POST" })
  .validator((data: GenerateInput) => data)
  .handler(
    async ({ data: { eventId, actionId, tone, prompt, history } }: { data: GenerateInput }) => {
      let cloudflareEnv: any = {};
      try {
        const cf = await import("cloudflare:workers");
        cloudflareEnv = cf.env || {};
      } catch (e) {}

      const apiKey =
        cloudflareEnv.GEMINI_API_KEY ||
        cloudflareEnv.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY tidak dikonfigurasi di server. Silakan tambahkan kunci API ke file .env.",
        );
      }

      // Load active event data from DB as context
      let eventContext = "";
      if (eventId) {
        const { data: event } = await supabase
          .from("events")
          .select("*, event_settings(*)")
          .eq("id", eventId)
          .is("deleted_at", null)
          .single();

        if (event) {
          eventContext = `Konteks detail acara saat ini dari database:
- Nama Acara: ${event.name}
- Tipe Acara: ${event.type}
- Deskripsi Acara: ${event.description || "Belum diatur"}
- Tanggal & Waktu: Hari ${event.start_date} pukul ${event.start_time || "10:00"} s/d ${event.end_time || "selesai"} (${event.timezone})
- Lokasi Acara: ${formatLocation(event.location) || "Belum diatur"}
- Pengaturan Fitur Undangan:
  - Konfirmasi RSVP: ${event.event_settings?.allow_rsvp ? "Aktif" : "Nonaktif"}
  - Buku Tamu digital: ${event.event_settings?.allow_guest_book ? "Aktif" : "Nonaktif"}
  - Galeri Album Foto: ${event.event_settings?.allow_gallery ? "Aktif" : "Nonaktif"}
  - Musik Latar Belakang: ${event.event_settings?.allow_music ? "Aktif" : "Nonaktif"}
  - Hitung Mundur: ${event.event_settings?.allow_countdown ? "Aktif" : "Nonaktif"}
  - Kado Amplop Digital: ${event.event_settings?.allow_gift ? "Aktif" : "Nonaktif"}
  - Cerita/Timeline Perjalanan: ${event.event_settings?.allow_story ? "Aktif" : "Nonaktif"}
`;
        }
      }

      const actionInstructions: Record<string, string> = {
        invitation:
          "Tulis draf lengkap teks redaksi utama untuk dipajang di halaman undangan digital. Teks harus mencakup salam pembuka, nama penyelenggara/mempelai, tanggal, jam, lokasi/venue acara, rincian RSVP, serta kalimat penutup yang sopan.",
        story:
          "Tulis cerita pendek mengenai kisah kasih (love story) pasangan mempelai atau latar belakang bermakna diselenggarakannya acara ini secara hangat, menyentuh, dan romantis.",
        whatsapp:
          "Tulis pesan broadcast singkat dan menarik untuk disebarkan melalui WhatsApp. Sertakan detail nama acara, tanggal, dan diakhiri dengan placeholder link digital: '[Link Undangan]'. Tambahkan emoji yang ramah.",
        email:
          "Tulis surat undangan resmi/formal versi email untuk dikirim ke kolega atau tamu penting. Cantumkan rincian acara secara sopan dan terstruktur.",
        thank_you:
          "Tulis pesan ucapan terima kasih yang tulus dan hangat kepada para tamu yang telah hadir dan mendoakan kelancaran acara.",
        timeline:
          "Buat draf susunan acara (rundown/timeline) lengkap dari pembukaan hingga penutupan acara berdasarkan waktu mulai yang logis.",
        faq: "Buat daftar tanya jawab (FAQ) penting untuk tamu mengenai dress code, lokasi parkir, kado digital, dan akomodasi.",
        mc_script:
          "Tulis naskah ringkas pemandu acara (MC) semi-formal untuk mengawal jalannya acara ini.",
        rewrite:
          "Tulis ulang teks berikut agar terdengar lebih mengalir, indah, menyentuh, dan menarik bagi pembaca.",
        translate:
          "Terjemahkan teks berikut ke bahasa target dengan tetap mempertahankan struktur keindahan penulisan undangan.",
        improve:
          "Tingkatkan tata bahasa dan ejaan teks berikut agar terdengar lebih profesional dan estetik.",
      };

      const targetInstruction =
        actionInstructions[actionId] || "Bantu buatkan teks terkait acara sesuai prompt pengguna.";

      const systemInstruction = `Anda adalah asisten kecerdasan buatan "AI Assistant" profesional di platform Invitaku.
Tugas Anda adalah memproses instruksi dan mengembalikan respons terstruktur dalam format JSON yang valid.

INFORMASI ACARA PENGGUNA:
${eventContext || "Pengguna belum memilih acara aktif. Buatkan teks dengan detail generik/contoh yang relevan."}

TUGAS KHUSUS ANDA:
${targetInstruction}

FORMAT RESPONS WAJIB (JSON):
Anda harus mengembalikan respons yang HANYA berupa objek JSON valid dengan struktur persis seperti di bawah:
{
  "thinking": "Analisis singkat (2-3 kalimat) tentang bagaimana Anda menyusun teks ini berdasarkan data acara dan tone yang diminta.",
  "versions": {
    "A": "Hasil generasi Versi A (Gaya bahasa sesuai request utama, indah, rapi, siap pakai). Tanpa penjelasan pembuka/penutup tambahan dari Anda.",
    "B": "Hasil generasi Versi B (Gaya bahasa alternatif, lebih emosional/hangat/menyentuh). Tanpa penjelasan pembuka/penutup tambahan dari Anda.",
    "C": "Hasil generasi Versi C (Gaya bahasa alternatif kedua, lebih minimalis, modern, dan ringkas). Tanpa penjelasan pembuka/penutup tambahan dari Anda."
  }
}

Pastikan respons Anda HANYA berupa JSON valid, tanpa teks markdown pembungkus di luar JSON.`;

      const userMessage = `Tone gaya bahasa yang diminta: ${tone}
Petunjuk khusus/deskripsi tambahan dari pengguna: ${prompt}`;

      const chatContents = [];
      if (history && history.length > 0) {
        for (const msg of history) {
          chatContents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        }
      }
      chatContents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      let response;
      let tryCount = 0;
      let modelName = "gemini-2.5-flash";

      while (tryCount < 2) {
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: chatContents,
                systemInstruction: {
                  parts: [{ text: systemInstruction }],
                },
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 4000,
                  responseMimeType: "application/json",
                },
              }),
            },
          );

          if (response.ok) {
            break;
          }

          const errJson = await response
            .clone()
            .json()
            .catch(() => ({}));
          const errMsg = errJson?.error?.message || "";
          const errCode = errJson?.error?.code;

          if (
            modelName === "gemini-2.5-flash" &&
            (errCode === 503 || errCode === 429 || errMsg.includes("demand"))
          ) {
            console.warn(
              "Gemini 2.5 Flash overload/rate-limited, falling back to Gemini 1.5 Flash...",
            );
            modelName = "gemini-1.5-flash";
            tryCount++;
            continue;
          }

          throw new Error(errMsg || `Gagal memanggil API Gemini (${response.status})`);
        } catch (err: any) {
          if (tryCount >= 1 || modelName !== "gemini-2.5-flash") {
            throw err;
          }
          modelName = "gemini-1.5-flash";
          tryCount++;
        }
      }

      if (!response || !response.ok) {
        throw new Error("Gagal mendapatkan respons valid dari Gemini API");
      }

      const resData = await response.json();
      const outputRaw = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!outputRaw) {
        throw new Error("Respons kosong dari Gemini");
      }

      try {
        const parsed = JSON.parse(outputRaw);
        return {
          thinking: parsed.thinking || "",
          versions: {
            A: parsed.versions?.A || parsed.versions?.a || "",
            B: parsed.versions?.B || parsed.versions?.b || "",
            C: parsed.versions?.C || parsed.versions?.c || "",
          },
        };
      } catch (e) {
        let cleaned = outputRaw.trim();

        // Jika respons dikelilingi markdown ```json ... ```
        if (cleaned.includes("```json")) {
          const match = cleaned.match(/```json([\s\S]*?)```/);
          if (match && match[1]) {
            cleaned = match[1].trim();
          }
        } else if (cleaned.includes("```")) {
          const match = cleaned.match(/```([\s\S]*?)```/);
          if (match && match[1]) {
            cleaned = match[1].trim();
          }
        }

        // Jika masih gagal karena ada kata pengantar/penutup, cari karakter { pertama dan } terakhir
        const startIdx = cleaned.indexOf("{");
        const endIdx = cleaned.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleaned = cleaned.substring(startIdx, endIdx + 1);
        }

        try {
          const parsed = JSON.parse(cleaned);
          return {
            thinking: parsed.thinking || "",
            versions: {
              A: parsed.versions?.A || parsed.versions?.a || "",
              B: parsed.versions?.B || parsed.versions?.b || "",
              C: parsed.versions?.C || parsed.versions?.c || "",
            },
          };
        } catch (err) {
          return {
            thinking: "Gagal memproses struktur respons AI. Teks ditampilkan secara utuh.",
            versions: {
              A: outputRaw,
              B: "Gunakan versi A di atas untuk melihat output asli.",
              C: "Gunakan versi A di atas untuk melihat output asli.",
            },
          };
        }
      }
    },
  );

export const Route = createFileRoute("/_layout/assistant")({
  component: AssistantPage,
});

// Grouped AI Capabilities (Capabilities Group)
const CAPABILITY_GROUPS = [
  {
    id: "writing",
    label: "Writing",
    icon: PenTool,
    items: [
      {
        id: "invitation",
        label: "Teks Undangan Utama",
        desc: "Redaksi halaman undangan digital utama",
        icon: FileText,
      },
      {
        id: "story",
        label: "Kisah Kasih (Story)",
        desc: "Cerita perjalanan cinta pengantin",
        icon: Heart,
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: Send,
    items: [
      {
        id: "whatsapp",
        label: "Broadcast WhatsApp",
        desc: "Pesan pengantar sebar undangan digital",
        icon: Send,
      },
      {
        id: "email",
        label: "Undangan Email Resmi",
        desc: "Surat elektronik formal untuk kolega",
        icon: Mail,
      },
      {
        id: "thank_you",
        label: "Ucapan Terima Kasih",
        desc: "Apresiasi atas kehadiran para tamu",
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: "planning",
    label: "Event Planning",
    icon: Clock,
    items: [
      {
        id: "timeline",
        label: "Rundown / Timeline",
        desc: "Susunan susunan jadwal rangkaian acara",
        icon: Clock,
      },
      {
        id: "faq",
        label: "FAQ Tanya Jawab",
        desc: "Daftar tanya jawab seputar lokasi & dress code",
        icon: HelpCircle,
      },
      {
        id: "mc_script",
        label: "Naskah MC Panduan",
        desc: "Skrip pembawa acara formal/semi-formal",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "optimization",
    label: "Optimization",
    icon: Sparkles,
    items: [
      {
        id: "rewrite",
        label: "Tulis Ulang (Rewrite)",
        desc: "Ubah penulisan teks yang sudah ada",
        icon: RefreshCw,
      },
      {
        id: "improve",
        label: "Tingkatkan Ejaan (Improve)",
        desc: "Sempurnakan tata bahasa & keindahan diksi",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "translation",
    label: "Translation",
    icon: Globe,
    items: [
      {
        id: "translate",
        label: "Terjemahkan Bahasa",
        desc: "Alihkan bahasa teks ke bahasa asing",
        icon: Languages,
      },
    ],
  },
];

const QUICK_MODIFIERS = [
  {
    label: "Shorter",
    prompt: "Perpendek tulisan di atas agar lebih padat dan to-the-point.",
    icon: Minimize2,
  },
  {
    label: "Longer",
    prompt: "Perpanjang tulisan di atas dengan menambahkan detail yang indah dan sopan.",
    icon: Maximize2,
  },
  {
    label: "Elegant",
    prompt: "Ubah gaya bahasa di atas menjadi sangat anggun, berkelas, dan puitis.",
    icon: Feather,
  },
  {
    label: "Formal",
    prompt: "Ubah gaya bahasa di atas menjadi resmi, sopan santun tinggi, dan sangat profesional.",
    icon: Briefcase,
  },
  {
    label: "Emotional",
    prompt: "Ubah gaya bahasa di atas menjadi penuh kehangatan, akrab, dan menyentuh hati.",
    icon: Heart,
  },
  {
    label: "Improve Grammar",
    prompt: "Perbaiki tata bahasa, tanda baca, dan ejaan teks di atas agar rapi.",
    icon: SpellCheck,
  },
];

const TONES = [
  { id: "Elegant", label: "Elegant" },
  { id: "Formal", label: "Formal" },
  { id: "Warm", label: "Warm" },
  { id: "Islamic", label: "Islamic" },
  { id: "Minimal", label: "Minimalist" },
  { id: "Friendly", label: "Friendly" },
];

const LANGUAGES = [
  { id: "id", label: "Bahasa Indonesia" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية (Arabic)" },
  { id: "ja", label: "日本語 (Japanese)" },
  { id: "zh", label: "中文 (Chinese)" },
];

interface SavedDraft {
  id: string;
  eventName: string;
  actionId: string;
  actionLabel: string;
  text: string;
  tone: string;
  timestamp: string;
  isFavorite: boolean;
}

const getActionGenerateLabel = (actionId: string) => {
  switch (actionId) {
    case "invitation":
      return "Buat Teks Undangan";
    case "story":
      return "Buat Cerita Cinta";
    case "whatsapp":
      return "Buat Broadcast WhatsApp";
    case "email":
      return "Buat Undangan Email";
    case "thank_you":
      return "Buat Ucapan Terima Kasih";
    case "timeline":
      return "Buat Rundown Acara";
    case "faq":
      return "Buat FAQ Undangan";
    case "mc_script":
      return "Buat Naskah MC";
    case "rewrite":
      return "Tulis Ulang Teks";
    case "improve":
      return "Sempurnakan Ejaan";
    case "translate":
      return "Terjemahkan Teks";
    default:
      return "Buat Redaksi AI";
  }
};

function AssistantPage() {
  const location = useLocation();
  const queryEventId = new URLSearchParams(location.search).get("eventId") || "";

  // State Management
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId);
  const [activeEvent, setActiveEvent] = useState<DbEvent | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingActiveEvent, setLoadingActiveEvent] = useState(false);

  const [activeActionId, setActiveActionId] = useState("invitation");
  const [tone, setTone] = useState("Elegant");
  const [language, setLanguage] = useState("id");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // Output workspace states
  const [outputs, setOutputs] = useState<
    Record<string, { A: string; B: string; C: string; thinking?: string }>
  >({});
  const [activeVersion, setActiveVersion] = useState<"A" | "B" | "C">("A");

  // Streaming visual states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [copied, setCopied] = useState(false);
  // Chat Memory
  const [conversations, setConversations] = useState<
    Record<string, { role: "user" | "model"; content: string }[]>
  >({});

  // Riwayat Draf Lokal (localStorage)
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "fav" | string>("all");
  const filteredDrafts = drafts.filter((d) => {
    if (historyFilter === "fav") return d.isFavorite;
    if (historyFilter !== "all") return d.actionId === historyFilter;
    return true;
  });

  // Draft Apply & Dialog
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  // Compare Mode Modal
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // 1. Ambil semua Event saat load
  useEffect(() => {
    getEvents({ data: {} })
      .then((res) => {
        setEvents(res.data || []);
        if (res.data && res.data.length > 0 && !selectedEventId) {
          setSelectedEventId(res.data[0].id);
        }
      })
      .catch((err) => toast.error("Gagal memuat daftar acara: " + err.message))
      .finally(() => setLoadingEvents(false));

    // Load drafts dari localStorage
    try {
      const saved = localStorage.getItem("invitaku_ai_drafts_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // 2. Ambil detail event aktif ketika ID event berubah
  useEffect(() => {
    if (!selectedEventId) {
      setActiveEvent(null);
      return;
    }
    setLoadingActiveEvent(true);
    getEventById({ data: selectedEventId })
      .then((res) => {
        setActiveEvent(res);
      })
      .catch((err) => console.error("Gagal mengambil detail acara:", err))
      .finally(() => setLoadingActiveEvent(false));
  }, [selectedEventId]);

  // 4. Jalankan AI Generator
  const handleGenerate = async (customPrompt?: string, actionIdOverride?: string) => {
    const targetActionId = actionIdOverride || activeActionId;
    const finalPrompt = customPrompt || prompt;

    setLoading(true);
    setStreamedText("");
    setIsStreaming(false);

    const actionHistory = conversations[targetActionId] || [];

    try {
      const result = await generateInvitationText({
        data: {
          eventId: selectedEventId || undefined,
          actionId: targetActionId,
          tone,
          prompt: language !== "id" ? `${finalPrompt} (Tulis dalam ${language})` : finalPrompt,
          history: actionHistory,
        },
      });

      // Update local outputs state
      const updatedOutputs = {
        ...outputs,
        [targetActionId]: {
          A: result.versions.A,
          B: result.versions.B,
          C: result.versions.C,
          thinking: result.thinking,
        },
      };
      setOutputs(updatedOutputs);

      // Mulai simulasi streaming teks
      const textToStream = result.versions[activeVersion] || result.versions.A;
      simulateTextStreaming(textToStream);

      // Simpan percakapan ke memory
      const updatedHistory = [
        ...actionHistory,
        { role: "user" as const, content: `Tone: ${tone}. Prompt: ${finalPrompt}` },
        { role: "model" as const, content: JSON.stringify(result.versions) },
      ];
      setConversations({
        ...conversations,
        [targetActionId]: updatedHistory,
      });

      // Simpan ke riwayat draf lokal
      saveDraftToHistory(targetActionId, result.versions.A, tone);
      toast.success("AI Assistant berhasil menyusun teks! Draf disimpan ke riwayat.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menyusun teks: ${err.message || "Terjadi kesalahan server"}`);
    } finally {
      setLoading(false);
    }
  };

  // Simulasi streaming teks alami
  const simulateTextStreaming = (text: string) => {
    setIsStreaming(true);
    let index = 0;
    setStreamedText("");

    const interval = setInterval(() => {
      index += Math.min(6, text.length - index);
      setStreamedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 12);
  };

  // Pemicu pergantian versi (A/B/C)
  const handleVersionChange = (ver: "A" | "B" | "C") => {
    setActiveVersion(ver);
  };

  // Pemicu pergantian tab format
  const handleActionChange = (actionId: string) => {
    setActiveActionId(actionId);
  };

  // Salin teks ke Clipboard
  const handleCopy = () => {
    const text = isStreaming
      ? streamedText
      : outputs[activeActionId] && outputs[activeActionId][activeVersion];
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Tandai Favorit Versi Aktif
  const toggleFavoriteVersion = () => {
    const currentText = isStreaming
      ? streamedText
      : outputs[activeActionId] && outputs[activeActionId][activeVersion];
    if (!currentText) return;

    const isFav = drafts.some((d) => d.text === currentText && d.isFavorite);

    let nextDrafts;
    if (isFav) {
      nextDrafts = drafts.map((d) => (d.text === currentText ? { ...d, isFavorite: false } : d));
      toast.info("Draf dihapus dari favorit.");
    } else {
      const exists = drafts.some((d) => d.text === currentText);
      if (exists) {
        nextDrafts = drafts.map((d) => (d.text === currentText ? { ...d, isFavorite: true } : d));
      } else {
        let label = "AI Text";
        for (const g of CAPABILITY_GROUPS) {
          const match = g.items.find((item) => item.id === activeActionId);
          if (match) {
            label = match.label;
            break;
          }
        }
        const newDraft: SavedDraft = {
          id: Math.random().toString(36).substr(2, 9),
          eventName: activeEvent ? activeEvent.name : "Tanpa Acara",
          actionId: activeActionId,
          actionLabel: label,
          text: currentText,
          tone: tone,
          timestamp:
            new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }) +
            " " +
            new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          isFavorite: true,
        };
        nextDrafts = [newDraft, ...drafts].slice(0, 30);
      }
      toast.success("Draf ditambahkan ke favorit!");
    }

    setDrafts(nextDrafts);
    try {
      localStorage.setItem("invitaku_ai_drafts_v2", JSON.stringify(nextDrafts));
    } catch (e) {}
  };

  // Simpan Draf ke Local History
  const saveDraftToHistory = (
    actionId: string,
    text: string,
    currentTone: string,
    isFav = false,
  ) => {
    if (!text.trim()) return;

    // Cari label aksi
    let label = "AI Text";
    for (const g of CAPABILITY_GROUPS) {
      const match = g.items.find((item) => item.id === actionId);
      if (match) {
        label = match.label;
        break;
      }
    }

    const newDraft: SavedDraft = {
      id: Math.random().toString(36).substr(2, 9),
      eventName: activeEvent ? activeEvent.name : "Tanpa Acara",
      actionId: actionId,
      actionLabel: label,
      text: text,
      tone: currentTone,
      timestamp:
        new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }) +
        " " +
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      isFavorite: isFav,
    };

    const nextDrafts = [newDraft, ...drafts].slice(0, 30); // Simpan maks 30 riwayat
    setDrafts(nextDrafts);
    try {
      localStorage.setItem("invitaku_ai_drafts_v2", JSON.stringify(nextDrafts));
    } catch (e) {}
  };

  // Toggle Favorite pada riwayat draf
  const toggleHistoryFavorite = (id: string) => {
    const nextDrafts = drafts.map((d) => {
      if (d.id === id) {
        const nextFav = !d.isFavorite;
        if (nextFav) toast.success("Draf riwayat ditandai sebagai favorit.");
        return { ...d, isFavorite: nextFav };
      }
      return d;
    });
    setDrafts(nextDrafts);
    try {
      localStorage.setItem("invitaku_ai_drafts_v2", JSON.stringify(nextDrafts));
    } catch (e) {}
  };

  // Hapus draf riwayat
  const handleDeleteDraft = (id: string) => {
    const nextDrafts = drafts.filter((d) => d.id !== id);
    setDrafts(nextDrafts);
    try {
      localStorage.setItem("invitaku_ai_drafts_v2", JSON.stringify(nextDrafts));
    } catch (e) {}
    toast.success("Draf riwayat berhasil dihapus.");
  };

  // Terapkan ke database Event
  const handleApplyToBuilder = async () => {
    if (!selectedEventId) return;
    const textToApply = isStreaming
      ? streamedText
      : outputs[activeActionId] && outputs[activeActionId][activeVersion];
    if (!textToApply) return;

    setApplying(true);
    try {
      if (activeActionId === "invitation") {
        await updateEvent({
          data: {
            id: selectedEventId,
            description: textToApply,
          },
        });
        toast.success("Teks undangan berhasil diterapkan langsung ke deskripsi acara Anda!");
      } else {
        toast.info(
          "Fitur auto-apply langsung ke builder saat ini diprioritaskan untuk 'Teks Undangan'. Teks disalin ke clipboard Anda.",
        );
        navigator.clipboard.writeText(textToApply);
      }
      setIsApplyOpen(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan ke database: " + err.message);
    } finally {
      setApplying(false);
    }
  };

  // Restore history draft to current canvas workspace
  const handleRestoreDraft = (draft: SavedDraft) => {
    setActiveActionId(draft.actionId);
    setOutputs({
      ...outputs,
      [draft.actionId]: {
        A: draft.text,
        B: draft.text,
        C: draft.text,
        thinking: "Draf riwayat berhasil dipulihkan ke workspace.",
      },
    });
    simulateTextStreaming(draft.text);
    toast.success(`Draf "${draft.actionLabel}" berhasil dipulihkan ke workspace canvas!`);
  };

  const isCurrentFav = drafts.some((d) => d.text === streamedText && d.isFavorite);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 py-4">
      {/* Header & Workspace Context Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">
                AI Assistant Workspace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rancang tulisan, rundown, dan komunikasi tamu acara Anda secara terpadu.
              </p>
            </div>
          </div>

          {/* Selector & History Trigger */}
          <div className="flex items-center gap-2">
            {loadingEvents ? (
              <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Acara Aktif
                  </span>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="w-[220px] bg-white border-slate-200 rounded-xl text-xs font-semibold h-10 shadow-2xs">
                      <SelectValue placeholder="Pilih acara aktif..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id} className="text-xs rounded-lg">
                          {ev.name} ({ev.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block opacity-0 select-none">
                    Riwayat
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setIsHistoryOpen(true)}
                    className="h-10 px-3.5 hover:border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs bg-white cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-slate-500" />
                    Riwayat ({drafts.length})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Context Bar */}
        {activeEvent && (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 backdrop-blur-xs p-4 rounded-2xl border border-slate-100 shadow-3xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-[10px] uppercase font-mono text-slate-400">Tipe:</span>
                <Badge
                  variant="secondary"
                  className="bg-slate-200/50 text-slate-800 text-[10px] rounded-md font-bold px-2 py-0.5"
                >
                  {activeEvent.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-[10px] uppercase font-mono text-slate-400">Tanggal:</span>
                <span className="font-semibold text-slate-800">{activeEvent.start_date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-[10px] uppercase font-mono text-slate-400">Tema:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {activeEvent.theme_color || "Default"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-[10px] uppercase font-mono text-slate-400">Bahasa:</span>
                <span className="font-semibold text-slate-800">Indonesia</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: left inputs, right canvas */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
        {/* KOLOM KIRI: DRAFTER & UTILITY */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col h-[600px] justify-between overflow-hidden">
          <Tabs defaultValue="tasks" className="flex flex-col flex-1">
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl mb-4 shrink-0 h-9">
              <TabsTrigger
                value="tasks"
                className="text-[11px] font-bold h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Tugas
              </TabsTrigger>
              <TabsTrigger
                value="options"
                className="text-[11px] font-bold h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Opsi
              </TabsTrigger>
              <TabsTrigger
                value="context"
                className="text-[11px] font-bold h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Konteks
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 space-y-4">
              <TabsContent value="tasks" className="mt-0 focus-visible:ring-0">
                <ScrollArea className="h-[400px] pr-2">
                  {/* Grouped AI Capabilities */}
                  <div className="space-y-3 pr-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                      AI Capabilities Group
                    </span>
                    <div className="space-y-4">
                      {CAPABILITY_GROUPS.map((group) => {
                        const GroupIcon = group.icon;
                        return (
                          <div
                            key={group.id}
                            className="space-y-2 bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100/50"
                          >
                            <div className="flex items-center gap-1.5 text-slate-800 pb-1.5 border-b border-slate-100">
                              <GroupIcon className="h-3.5 w-3.5 text-indigo-650" />
                              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                                {group.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {group.items.map((item) => {
                                const isSelected = activeActionId === item.id;
                                const ItemIcon = item.icon;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleActionChange(item.id)}
                                    className={cn(
                                      "flex flex-col text-left p-3 rounded-xl border transition-all h-[72px] justify-between relative cursor-pointer",
                                      isSelected
                                        ? "bg-white border-indigo-600 shadow-sm"
                                        : "bg-white/80 border-slate-200/60 hover:bg-white hover:border-slate-300",
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <ItemIcon
                                        className={cn(
                                          "h-3.5 w-3.5",
                                          isSelected ? "text-indigo-600" : "text-slate-400",
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "text-[10.5px] font-bold block",
                                          isSelected ? "text-indigo-600" : "text-slate-850",
                                        )}
                                      >
                                        {item.label}
                                      </span>
                                    </div>
                                    <span className="text-[8.5px] text-slate-500 leading-tight block mt-1 line-clamp-1">
                                      {item.desc}
                                    </span>
                                    {isSelected && (
                                      <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                        <Check className="h-2 w-2" />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="options" className="mt-0 focus-visible:ring-0 space-y-4">
                {/* Tone selector as visual pills */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                    Tone Gaya Bahasa
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TONES.map((t) => {
                      const isSelected = tone === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={cn(
                            "px-2 py-1.5 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer truncate",
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:border-slate-300",
                          )}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language Selector */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                    Bahasa Target
                  </span>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full bg-white border-slate-200 rounded-lg text-[10.5px] font-semibold h-8 shadow-3xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="text-[10px] rounded-md">
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="context" className="mt-0 focus-visible:ring-0">
                <div className="space-y-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                    Detail Acara Aktif
                  </span>
                  {activeEvent ? (
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Nama Acara
                        </span>
                        <span className="text-xs font-bold text-slate-800">{activeEvent.name}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Tipe Acara
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-slate-200/50 text-slate-800 text-[10px] rounded-md font-bold px-2 py-0.5"
                        >
                          {activeEvent.type}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Tanggal Mulai
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {activeEvent.start_date}
                        </span>
                      </div>
                      {activeEvent.location && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Lokasi / Venue
                          </span>
                          <span className="text-xs text-slate-700 font-medium block leading-normal line-clamp-2">
                            {formatLocation(activeEvent.location)}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Tema Undangan
                        </span>
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {activeEvent.theme_color || "Default"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                      <CalendarDays className="h-6 w-6 text-slate-350" />
                      <span className="text-xs font-bold text-slate-500 mt-2">
                        Tidak Ada Acara Terpilih
                      </span>
                      <span className="text-[9px] text-slate-400 leading-normal max-w-xs mt-1">
                        Silakan pilih acara aktif di bagian atas untuk melihat konteks acara.
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Generate Button (Statis di bawah tab content) */}
          <div className="pt-4 border-t border-slate-100 shrink-0 mt-4">
            <Button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm h-10 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-indigo-400" />
              )}
              {getActionGenerateLabel(activeActionId)}
            </Button>
          </div>
        </div>

        {/* KOLOM KANAN: WORKSPACE CANVAS */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between h-[600px] overflow-hidden">
          <div className="space-y-4 flex-1">
            {/* Canvas Header & Versions */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-sm font-bold text-slate-850 font-sans tracking-tight">
                    {activeActionId ? (
                      <>
                        Canvas:{" "}
                        {
                          CAPABILITY_GROUPS.flatMap((g) => g.items).find(
                            (i) => i.id === activeActionId,
                          )?.label
                        }
                      </>
                    ) : (
                      <>Workspace Canvas</>
                    )}
                  </span>
                </div>

                {/* Sub-tabs Version A/B/C + Compare Mode */}
                {outputs[activeActionId] && (
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                      {(["A", "B", "C"] as const).map((ver) => (
                        <button
                          key={ver}
                          onClick={() => handleVersionChange(ver)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            activeVersion === ver
                              ? "bg-white text-slate-800 shadow-3xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Version {ver}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCompareOpen(true)}
                      className="h-7 px-2 hover:border-slate-350 rounded-lg text-[9.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="h-3 w-3 text-slate-500" />
                      Compare
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerate()}
                      disabled={loading}
                      className="h-7 px-2 hover:border-slate-350 rounded-lg text-[9.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw
                        className={cn("h-3 w-3 text-slate-500", loading ? "animate-spin" : "")}
                      />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>

              {/* Status */}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold animate-pulse pt-1">
                  <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
                  <span>AI Assistant sedang merumuskan draf terbaik...</span>
                </div>
              )}
            </div>

            {/* Display Canvas Text */}
            <ScrollArea className="relative h-[310px] bg-slate-50/30 border border-slate-100 p-5 rounded-2xl font-sans text-xs text-slate-850 leading-relaxed shadow-3xs">
              <div className="whitespace-pre-line pr-1.5">
                {loading ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 w-3/4 bg-slate-100 animate-pulse rounded-md" />
                    <div className="h-4 w-full bg-slate-100 animate-pulse rounded-md" />
                    <div className="h-4 w-5/6 bg-slate-100 animate-pulse rounded-md" />
                    <div className="h-4 w-2/3 bg-slate-100 animate-pulse rounded-md" />
                  </div>
                ) : isStreaming ? (
                  <div className="after:content-['|'] after:animate-pulse after:ml-0.5 after:text-indigo-600 font-medium">
                    {streamedText}
                  </div>
                ) : outputs[activeActionId] ? (
                  <div className="font-medium">{outputs[activeActionId][activeVersion]}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <div className="p-4 bg-indigo-50/50 rounded-full border border-indigo-100 shadow-2xs">
                      <Sparkles className="h-8 w-8 text-indigo-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight">
                        {activeEvent
                          ? `Siap mendesain acara ${activeEvent.name}?`
                          : "Mulai Asisten AI Workspace"}
                      </h3>
                      <p className="text-[10.5px] text-slate-500 max-w-xs mt-1 leading-normal">
                        {activeEvent
                          ? "Pilih salah satu tugas cepat di bawah untuk mulai membuat redaksi tulisan acara Anda secara otomatis."
                          : "Silakan pilih acara aktif terlebih dahulu untuk menyinkronkan data dengan Asisten AI."}
                      </p>
                    </div>

                    {activeEvent && (
                      <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleActionChange("invitation");
                            handleGenerate("", "invitation");
                          }}
                          className="text-[10.5px] font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl h-8.5 cursor-pointer shadow-3xs flex justify-between px-3 w-full items-center"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-indigo-650" />
                            Buat Redaksi Utama Undangan
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleActionChange("whatsapp");
                            handleGenerate("", "whatsapp");
                          }}
                          className="text-[10.5px] font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl h-8.5 cursor-pointer shadow-3xs flex justify-between px-3 w-full items-center"
                        >
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-indigo-650" />
                            Buat Broadcast WhatsApp
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const action = activeEvent.type === "Wedding" ? "story" : "timeline";
                            handleActionChange(action);
                            handleGenerate("", action);
                          }}
                          className="text-[10.5px] font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl h-8.5 cursor-pointer shadow-3xs flex justify-between px-3 w-full items-center"
                        >
                          <span className="flex items-center gap-1.5">
                            {activeEvent.type === "Wedding" ? (
                              <>
                                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                                Buat Kisah Kasih
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 text-indigo-650" />
                                Buat Rundown Acara
                              </>
                            )}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Edit Modifiers Toolbars */}
            {outputs[activeActionId] && !loading && (
              <div className="space-y-1.5">
                <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400 font-bold block">
                  Quick Modifiers Toolbars
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_MODIFIERS.filter((mod) => {
                    const isPlanning = ["timeline", "faq", "mc_script"].includes(activeActionId);
                    if (isPlanning && ["Elegant", "Emotional"].includes(mod.label)) {
                      return false;
                    }
                    return true;
                  }).map((mod) => {
                    const ModIcon = mod.icon;
                    return (
                      <Button
                        key={mod.label}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerate(mod.prompt)}
                        className="text-[9.5px] h-7 px-2.5 font-semibold text-slate-600 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-3xs inline-flex items-center gap-1"
                      >
                        <ModIcon className="h-3 w-3 text-slate-400" />
                        {mod.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Canvas Footer (Always Visible Prompt Input + Action Toolbar) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 mt-auto">
            {/* Toolbar (Only visible when output exists) */}
            {outputs[activeActionId] && !loading && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-[10.5px] rounded-xl hover:border-slate-350 cursor-pointer h-8.5 font-bold shadow-3xs"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-500" />
                    )}
                    {copied ? "Tersalin" : "Salin Teks"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFavoriteVersion}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10.5px] rounded-xl hover:border-slate-350 cursor-pointer h-8.5 font-bold shadow-3xs",
                      isCurrentFav ? "bg-amber-50 text-amber-600 border-amber-250" : "",
                    )}
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        isCurrentFav ? "fill-amber-500 text-amber-500" : "text-slate-500",
                      )}
                    />
                    {isCurrentFav ? "Favorited" : "Save Favorite"}
                  </Button>

                  {selectedEventId && (
                    <Button
                      onClick={() => setIsApplyOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[10.5px] rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer h-8.5 font-bold shadow-2xs"
                    >
                      Apply to Builder
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Unified Prompt Input (Always Visible) */}
            <div className="flex gap-2 items-end bg-slate-50 border border-slate-200/60 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-3xs">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeActionId === "invitation"
                    ? "Tulis detail tambahan... (cth: 'tambahkan kutipan ayat suci', 'nama orang tua mempelai')"
                    : activeActionId === "whatsapp"
                      ? "Tulis petunjuk khusus... (cth: 'buat versi santai', 'sertakan link rsvp')"
                      : "Tulis instruksi tambahan untuk asisten AI..."
                }
                rows={2}
                className="resize-none text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1.5 min-h-[48px] shadow-none w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) handleGenerate();
                  }
                }}
              />
              <Button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white h-9 w-9 p-0 rounded-xl cursor-pointer shrink-0 shadow-2xs flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-indigo-400" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Version Modal (Grid View) */}
      {outputs[activeActionId] && (
        <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
          <DialogContent className="rounded-2xl max-w-5xl w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900">
                Perbandingan Versi Teks (A/B/C)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-normal">
                Bandingkan hasil draf AI di bawah ini dan pilih versi terbaik untuk diterapkan di
                workspace utama.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {(["A", "B", "C"] as const).map((ver) => {
                const text = outputs[activeActionId][ver];
                return (
                  <div
                    key={ver}
                    className="flex flex-col justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                        <span className="font-bold text-xs text-slate-800 font-mono">
                          Versi {ver}
                        </span>
                        {drafts.some((d) => d.text === text && d.isFavorite) && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <ScrollArea className="h-[220px] text-[11.5px] leading-relaxed text-slate-700 whitespace-pre-line pr-1.5 pt-2">
                        {text}
                      </ScrollArea>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          toast.success(`Versi ${ver} disalin ke clipboard!`);
                        }}
                        className="w-full text-[10px] h-8 font-semibold rounded-lg cursor-pointer"
                      >
                        Salin
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveVersion(ver);
                          simulateTextStreaming(text);
                          setIsCompareOpen(false);
                          toast.success(`Workspace utama beralih ke Versi ${ver}.`);
                        }}
                        className="w-full text-[10px] h-8 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                      >
                        Gunakan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCompareOpen(false)}
                className="text-xs h-9 rounded-xl font-semibold cursor-pointer"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Apply to Builder Confirmation Dialog */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Terapkan ke Builder
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Anda akan menerapkan draf hasil AI ini ke data acara Anda secara langsung di database.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs leading-normal">
            <span className="font-bold text-slate-800 block mb-1.5">Lokasi Penerapan:</span>
            {activeActionId === "invitation" ? (
              <span className="text-[11px] text-slate-600">
                Akan mengganti teks <strong>Deskripsi Utama Undangan</strong> pada website undangan
                Anda.
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Format "
                {
                  CAPABILITY_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeActionId)
                    ?.label
                }
                " akan disalin ke clipboard untuk ditempel secara manual di halaman editor.
              </span>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsApplyOpen(false)}
              className="text-xs h-9 rounded-xl font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleApplyToBuilder}
              disabled={applying}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 rounded-xl font-semibold cursor-pointer"
            >
              {applying ? "Menerapkan..." : "Terapkan Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="rounded-2xl max-w-2xl w-[90vw] max-h-[85vh] flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Riwayat Workspace & Draf Favorit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-normal">
              Akses kembali hasil draf yang telah digenerasi sebelumnya untuk dipulihkan ke
              workspace.
            </DialogDescription>
          </DialogHeader>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 py-2 border-b border-slate-100">
            <button
              onClick={() => setHistoryFilter("all")}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all",
                historyFilter === "all"
                  ? "bg-slate-900 border-slate-900 text-white shadow-3xs"
                  : "bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100",
              )}
            >
              Semua ({drafts.length})
            </button>
            <button
              onClick={() => setHistoryFilter("fav")}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all inline-flex items-center gap-1",
                historyFilter === "fav"
                  ? "bg-amber-500 border-amber-500 text-white shadow-3xs"
                  : "bg-slate-50 border-slate-200/60 text-slate-550 hover:bg-slate-100",
              )}
            >
              <Star className="h-3 w-3 fill-current" />
              Favorit ({drafts.filter((d) => d.isFavorite).length})
            </button>

            {Array.from(new Set(drafts.map((d) => d.actionId))).map((actionId) => {
              const label = drafts.find((d) => d.actionId === actionId)?.actionLabel || actionId;
              const count = drafts.filter((d) => d.actionId === actionId).length;
              const isSelected = historyFilter === actionId;
              return (
                <button
                  key={actionId}
                  onClick={() => setHistoryFilter(actionId)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "bg-indigo-600 border-indigo-650 text-white shadow-3xs"
                      : "bg-slate-50 border-slate-200/60 text-slate-550 hover:bg-slate-100",
                  )}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <ScrollArea className="flex-1 my-3 pr-2 h-[350px]">
            {filteredDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-1.5">
                <Clock className="h-6 w-6 text-slate-200" />
                <span className="text-[10.5px] font-bold text-slate-500">
                  Tidak ada riwayat draf
                </span>
                <span className="text-[9px] text-slate-400 leading-normal max-w-xs">
                  Belum ada draf yang cocok dengan filter aktif saat ini.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDrafts.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs hover:border-slate-200 transition-colors shadow-3xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[8.5px] py-0 px-1 text-indigo-650 border-indigo-100 bg-indigo-50/20 rounded font-mono font-bold"
                        >
                          {d.actionLabel}
                        </Badge>
                        <span className="text-[10px] text-slate-505 font-bold">{d.eventName}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{d.timestamp}</span>
                        {d.isFavorite && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 line-clamp-1 italic leading-normal">
                        "{d.text.substring(0, 150)}..."
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleHistoryFavorite(d.id)}
                        className="text-[10px] h-7 w-7 p-0 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            d.isFavorite ? "fill-amber-500 text-amber-500" : "text-slate-400",
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleRestoreDraft(d);
                          setIsHistoryOpen(false);
                        }}
                        className="text-[10px] h-7 px-2 font-bold text-indigo-600 hover:bg-indigo-50/50 rounded-lg cursor-pointer"
                      >
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDraft(d.id)}
                        className="text-[10px] h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryOpen(false)}
              className="text-xs h-9 rounded-xl font-semibold cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
