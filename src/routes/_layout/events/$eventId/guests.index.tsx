import { createFileRoute, Link, useRouter, useSearch, useLoaderData } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { EventContextHeader } from "@/components/event-context-header";
import {
  Search,
  Plus,
  Upload,
  Download,
  Tag,
  Send,
  MoreHorizontal,
  Trash2,
  Share2,
  Play,
  Archive,
  Lock,
  Globe,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  User,
  Users,
  PlusCircle,
  FolderOpen,
  Filter,
  CheckSquare,
  Square,
  QrCode,
  FileText,
  FileSpreadsheet,
  Mail,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Copy,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getEvents } from "@/lib/events-api";
import {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkDeleteGuests,
  bulkAssignSegment,
  bulkSendInvitations,
  getSegments,
  createSegment,
  getTags,
  createTag,
  addGuestNote,
  importGuests,
  DbGuest,
  DbSegment,
  DbTag,
} from "@/lib/guests-api";

// TanStack Router Search Schema
const guestsSearchSchema = z.object({
  eventId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional(),
  rsvpStatus: z.string().optional(),
  invitationStatus: z.string().optional(),
  attendance: z.string().optional(),
  segmentId: z.string().optional(),
  sortBy: z.string().optional(),
});

export const Route = createFileRoute("/_layout/events/$eventId/guests/")({
  validateSearch: (search) => guestsSearchSchema.parse(search),
  component: GuestsPage,
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

function GuestsPage() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const searchParams = useSearch({ from: "/_layout/events/$eventId/guests/" });

  const { eventId } = Route.useParams();
  const activeEventId = eventId;

  // -------------------------------------------------------------
  // STATES
  // -------------------------------------------------------------
  const [events, setEvents] = useState<any[]>([]);
  const [guestsData, setGuestsData] = useState<DbGuest[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filter lists loaded from DB
  const [segments, setSegments] = useState<DbSegment[]>([]);
  const [tags, setTags] = useState<DbTag[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog / Drawer states
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkSegmentOpen, setIsBulkSegmentOpen] = useState(false);
  const [bulkSegmentId, setBulkSegmentId] = useState<string>("none");

  // Drawer Detail states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailGuest, setDetailGuest] = useState<DbGuest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"guest" | "invite" | "rsvp" | "activity" | "notes">(
    "guest",
  );

  // Note adding state
  const [newNoteText, setNewNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Form states for Add Guest
  const [addFormName, setAddFormName] = useState("");
  const [addFormPhone, setAddFormPhone] = useState("");
  const [addFormEmail, setAddFormEmail] = useState("");
  const [addFormPartySize, setAddFormPartySize] = useState(1);
  const [addFormSegmentId, setAddFormSegmentId] = useState("");
  const [addFormNotes, setAddFormNotes] = useState("");
  const [addFormTags, setAddFormTags] = useState<string[]>([]);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  // Form states for Edit Guest (Inside Drawer)
  const [editFormName, setEditFormName] = useState("");
  const [editFormPhone, setEditFormPhone] = useState("");
  const [editFormEmail, setEditFormEmail] = useState("");
  const [editFormPartySize, setEditFormPartySize] = useState(1);
  const [editFormSegmentId, setEditFormSegmentId] = useState("");
  const [editFormNotes, setEditFormNotes] = useState("");
  const [editFormStatus, setEditFormStatus] = useState("Draft");
  const [editFormTags, setEditFormTags] = useState<string[]>([]);
  const [isUpdatingGuest, setIsUpdatingGuest] = useState(false);

  // Import states
  const [importFileText, setImportFileText] = useState("");
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced search term
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "");
  const searchTimeoutRef = useRef<any>(null);

  // -------------------------------------------------------------
  // INITIAL LOAD: EVENTS LIST
  // -------------------------------------------------------------
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await getEvents({ data: { limit: 100 } });
        setEvents(res.data || []);
      } catch (err) {
        toast.error("Gagal memuat daftar acara");
      }
    }
    loadEvents();
  }, []);

  // -------------------------------------------------------------
  // LOAD SEGMENTS & TAGS FOR ACTIVE EVENT
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeEventId) return;
    async function loadMetadata() {
      try {
        const [segRes, tagRes] = await Promise.all([
          getSegments({ data: activeEventId }),
          getTags({ data: activeEventId }),
        ]);
        setSegments(segRes);
        setTags(tagRes);
      } catch (err) {
        console.error("Gagal memuat metadata:", err);
      }
    }
    loadMetadata();
  }, [activeEventId]);

  // -------------------------------------------------------------
  // LOAD GUESTS DATA (DEPENDS ON SEARCH PARAMS & ACTIVE EVENT)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeEventId) return;
    setIsLoading(true);
    async function loadGuests() {
      try {
        const res = await getGuests({
          data: {
            eventId: activeEventId,
            search: searchParams.search || "",
            rsvpStatus: searchParams.rsvpStatus || "All",
            invitationStatus: searchParams.invitationStatus || "All",
            attendance: searchParams.attendance || "All",
            segmentId: searchParams.segmentId || "All",
            sortBy: searchParams.sortBy || "newest",
            page: searchParams.page || 1,
            limit: searchParams.limit || 10,
          },
        });
        setGuestsData(res.data);
        setPagination(res.pagination);
        setSelectedIds([]); // reset selection
      } catch (err) {
        toast.error("Gagal memuat data tamu");
      } finally {
        setIsLoading(false);
      }
    }
    loadGuests();
  }, [activeEventId, searchParams]);

  // -------------------------------------------------------------
  // SEARCH DEBOUNCING
  // -------------------------------------------------------------
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          search: val.trim() || undefined,
          page: undefined, // reset to page 1
        }),
      });
    }, 400);
  };

  // -------------------------------------------------------------
  // EXPORT GUESTS
  // -------------------------------------------------------------
  const handleExportGuests = () => {
    if (guestsData.length === 0) {
      toast.error("Tidak ada data tamu untuk diekspor");
      return;
    }

    const headers = [
      "Name",
      "Phone",
      "Email",
      "Segment",
      "Party Size",
      "RSVP Status",
      "Invitation Status",
      "Attendance",
    ];
    const csvRows = [headers.join(",")];

    guestsData.forEach((g) => {
      const row = [
        `"${g.name.replace(/"/g, '""')}"`,
        `"${(g.phone || "").replace(/"/g, '""')}"`,
        `"${(g.email || "").replace(/"/g, '""')}"`,
        `"${(g.guest_segments?.name || "").replace(/"/g, '""')}"`,
        g.party_size,
        `"${g.guest_rsvps?.status || "Pending"}"`,
        `"${g.guest_invitations?.delivery_status || "Draft"}"`,
        `"${g.status}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invitaku_guests_export.csv`);
    link.click();
    toast.success("Data tamu berhasil diekspor!");
  };

  // -------------------------------------------------------------
  // TEMPLATE DOWNLOAD
  // -------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const csvContent =
      "Name,Phone,Email,Segment,Party Size,Notes\nJohn Doe,+628123456789,john@example.com,VIP,2,Sangat penting\nJane Smith,+628987654321,jane@example.com,Family,1,Keluarga dekat";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "invitaku_guest_template.csv");
    link.click();
    toast.success("Template CSV berhasil diunduh!");
  };

  // -------------------------------------------------------------
  // CSV PARSING & VALIDATION
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportFileText(text);

      // Parse lines
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length <= 1) {
        setImportErrors(["File CSV kosong atau tidak memiliki baris data."]);
        return;
      }

      const headers = lines[0].split(",").map((h) =>
        h
          .trim()
          .replace(/^["']|["']$/g, "")
          .toLowerCase(),
      );
      const expected = ["name", "phone", "email", "segment", "party size", "notes"];

      // Simple validation of headers
      if (!headers.includes("name")) {
        setImportErrors(["Kolom 'Name' wajib ada di baris pertama CSV."]);
        return;
      }

      const rows: any[] = [];
      const errorsList: string[] = [];
      const phoneSet = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const rowObj: any = {};

        headers.forEach((header, index) => {
          rowObj[header] = values[index] || "";
        });

        // Validation
        const nameVal = rowObj["name"] || rowObj["nama"];
        const phoneVal = rowObj["phone"] || rowObj["telepon"] || rowObj["no hp"];
        const emailVal = rowObj["email"];
        const segmentVal = rowObj["segment"] || rowObj["kategori"];
        const partySizeVal = parseInt(rowObj["party size"] || rowObj["party_size"] || "1", 10) || 1;
        const notesVal = rowObj["notes"] || rowObj["catatan"];

        if (!nameVal) {
          errorsList.push(`Baris ${i + 1}: Nama wajib diisi.`);
          continue;
        }

        if (phoneVal) {
          if (phoneSet.has(phoneVal)) {
            errorsList.push(`Baris ${i + 1}: Duplikasi nomor telepon '${phoneVal}' dalam file.`);
          } else {
            phoneSet.add(phoneVal);
          }
        }

        rows.push({
          name: nameVal,
          phone: phoneVal || null,
          email: emailVal || null,
          segment: segmentVal || null,
          party_size: partySizeVal,
          notes: notesVal || null,
        });
      }

      setImportPreviewRows(rows);
      setImportErrors(errorsList);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (importPreviewRows.length === 0) {
      toast.error("Tidak ada data tamu valid untuk diimport");
      return;
    }
    setIsImporting(true);
    try {
      await importGuests({
        data: {
          eventId: activeEventId,
          guests: importPreviewRows,
        },
      });
      toast.success(`Berhasil mengimport ${importPreviewRows.length} tamu!`);
      setIsImportOpen(false);
      setImportPreviewRows([]);
      setImportErrors([]);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengimport data tamu");
    } finally {
      setIsImporting(false);
    }
  };

  // -------------------------------------------------------------
  // ADD GUEST SUBMIT
  // -------------------------------------------------------------
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormName.trim()) {
      toast.error("Nama tamu wajib diisi");
      return;
    }

    setIsCreatingGuest(true);
    try {
      await createGuest({
        data: {
          event_id: activeEventId,
          name: addFormName.trim(),
          phone: addFormPhone.trim() || null,
          email: addFormEmail.trim() || null,
          party_size: addFormPartySize,
          segment_id: addFormSegmentId || null,
          notes: addFormNotes.trim() || null,
          tags: addFormTags,
        },
      });

      toast.success("Tamu berhasil ditambahkan!");
      setIsAddGuestOpen(false);
      // Reset form
      setAddFormName("");
      setAddFormPhone("");
      setAddFormEmail("");
      setAddFormPartySize(1);
      setAddFormSegmentId("");
      setAddFormNotes("");
      setAddFormTags([]);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan tamu");
    } finally {
      setIsCreatingGuest(false);
    }
  };

  // -------------------------------------------------------------
  // OPEN DETAIL DRAWER
  // -------------------------------------------------------------
  const handleRowClick = async (guestId: string) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailTab("guest");
    try {
      const data = await getGuestById({ data: guestId });
      setDetailGuest(data);

      // Populate edit states
      setEditFormName(data.name);
      setEditFormPhone(data.phone || "");
      setEditFormEmail(data.email || "");
      setEditFormPartySize(data.party_size);
      setEditFormSegmentId(data.segment_id || "");
      setEditFormNotes(data.notes || "");
      setEditFormStatus(data.status);
      setEditFormTags(data.guest_tag_junction?.map((tj) => tj.guest_tags.id) || []);
    } catch (err) {
      toast.error("Gagal mengambil rincian tamu");
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // -------------------------------------------------------------
  // UPDATE GUEST SUBMIT (FROM DRAWER)
  // -------------------------------------------------------------
  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailGuest) return;

    setIsUpdatingGuest(true);
    try {
      await updateGuest({
        data: {
          id: detailGuest.id,
          name: editFormName.trim(),
          phone: editFormPhone.trim() || null,
          email: editFormEmail.trim() || null,
          party_size: editFormPartySize,
          segment_id: editFormSegmentId || null,
          notes: editFormNotes.trim() || null,
          status: editFormStatus,
          tags: editFormTags,
        },
      });

      toast.success("Data tamu berhasil diperbarui!");
      // Reload drawer detail
      const refreshed = await getGuestById({ data: detailGuest.id });
      setDetailGuest(refreshed);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui data tamu");
    } finally {
      setIsUpdatingGuest(false);
    }
  };

  // -------------------------------------------------------------
  // ADD INTERNAL NOTE
  // -------------------------------------------------------------
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !detailGuest) return;

    setIsAddingNote(true);
    try {
      await addGuestNote({
        data: {
          guest_id: detailGuest.id,
          note: newNoteText.trim(),
          created_by: "Admin",
        },
      });
      toast.success("Catatan berhasil ditambahkan!");
      setNewNoteText("");
      // Reload detail
      const refreshed = await getGuestById({ data: detailGuest.id });
      setDetailGuest(refreshed);
    } catch (err) {
      toast.error("Gagal menambahkan catatan");
    } finally {
      setIsAddingNote(false);
    }
  };

  // -------------------------------------------------------------
  // BULK ACTIONS HANDLERS
  // -------------------------------------------------------------
  const handleBulkDelete = async () => {
    try {
      await bulkDeleteGuests({ data: selectedIds });
      toast.success(`Berhasil menghapus ${selectedIds.length} tamu!`);
      setSelectedIds([]);
      setIsBulkDeleteConfirmOpen(false);
      router.invalidate();
    } catch (err) {
      toast.error("Gagal menghapus tamu secara massal");
    }
  };

  const handleBulkAssignSegment = async () => {
    try {
      const segId = bulkSegmentId === "none" ? null : bulkSegmentId;
      await bulkAssignSegment({
        data: {
          ids: selectedIds,
          segmentId: segId,
        },
      });
      toast.success("Segmen berhasil diperbarui!");
      setSelectedIds([]);
      setIsBulkSegmentOpen(false);
      router.invalidate();
    } catch (err) {
      toast.error("Gagal mengubah segmen secara massal");
    }
  };

  const handleBulkSend = async () => {
    try {
      await bulkSendInvitations({ data: selectedIds });
      toast.success(`Undangan untuk ${selectedIds.length} tamu dikirim!`);
      setSelectedIds([]);
      router.invalidate();
    } catch (err) {
      toast.error("Gagal mengirim undangan secara massal");
    }
  };

  const handleSingleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteGuest({ data: deleteTargetId });
      toast.success("Tamu berhasil dihapus");
      setIsDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      if (detailGuest?.id === deleteTargetId) {
        setIsDetailOpen(false);
      }
      router.invalidate();
    } catch (err) {
      toast.error("Gagal menghapus tamu");
    }
  };

  // Selection toggles
  const handleToggleAll = () => {
    if (selectedIds.length === guestsData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(guestsData.map((g) => g.id));
    }
  };

  const handleToggleRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Helper values for metrik cepat
  const attendingCount = guestsData.filter((g) => g.guest_rsvps?.status === "Attending").length;
  const declinedCount = guestsData.filter((g) => g.guest_rsvps?.status === "Declined").length;
  const pendingCount = guestsData.filter((g) => g.guest_rsvps?.status === "Pending").length;
  const sentCount = guestsData.filter(
    (g) =>
      g.guest_invitations?.delivery_status === "Sent" ||
      g.guest_invitations?.delivery_status === "Viewed",
  ).length;
  const checkedInCount = guestsData.filter((g) => g.status === "Checked In").length;

  const { event: activeEvent } = useLoaderData({ from: "/_layout/events/$eventId" }) as any;

  // Feature gating: Free plan max 50 guests
  const FREE_GUEST_LIMIT = 50;
  const isEventFree = !activeEvent?.is_paid;
  const totalGuests = pagination.total;
  const isAtGuestLimit = isEventFree && totalGuests >= FREE_GUEST_LIMIT;

  return (
    <div className="space-y-6">
      {/* 1. Event Context Header */}
      <EventContextHeader event={activeEvent} />

      {/* Guest Limit Upgrade Banner (Free plan only) */}
      {isAtGuestLimit && (
        <div className="flex items-start gap-3 rounded-[2px] border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] uppercase tracking-widest text-amber-700 font-semibold">
              Batas Tamu Tercapai
            </div>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Acara gratis hanya mendukung hingga <strong>{FREE_GUEST_LIMIT} tamu</strong>. Upgrade
              ke <strong>Event Pass (Rp 99.000)</strong> untuk menambah tamu tanpa batas.
            </p>
          </div>
          <Link
            to="/billing"
            className="inline-flex items-center gap-1.5 rounded-[2px] bg-amber-600 text-white px-3 py-1.5 text-xs font-mono uppercase tracking-widest hover:bg-amber-700 transition-colors shrink-0"
          >
            <Zap className="h-3 w-3" /> Upgrade
          </Link>
        </div>
      )}

      {/* 2. Summary & Metric Quick Filters */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Total Guests", val: pagination.total, filter: "All", param: "rsvpStatus" },
          { label: "Sent", val: sentCount, filter: "Sent", param: "invitationStatus" },
          {
            label: "RSVP Received",
            val: attendingCount + declinedCount,
            filter: "Attending",
            param: "rsvpStatus",
          },
          { label: "Attending", val: attendingCount, filter: "Attending", param: "rsvpStatus" },
          { label: "Declined", val: declinedCount, filter: "Declined", param: "rsvpStatus" },
          { label: "Pending", val: pendingCount, filter: "Pending", param: "rsvpStatus" },
          { label: "Checked In", val: checkedInCount, filter: "Checked In", param: "attendance" },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  [item.param]: item.filter,
                  page: undefined,
                }),
              });
            }}
            className="bg-white border border-rule/50 rounded-xl p-4 text-left hover:border-rule-strong hover:shadow-xs transition-all text-ink cursor-pointer focus:outline-none"
          >
            <span className="text-[10px] text-ink-soft font-medium uppercase tracking-wider">
              {item.label}
            </span>
            <div className="text-xl font-bold tracking-tight mt-1">{item.val}</div>
          </button>
        ))}
      </div>

      {/* 3. Main Workspace Container */}
      <div className="bg-white rounded-2xl border border-rule/50 p-6 space-y-6 shadow-xs">
        {/* Title and Guest Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/30 pb-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Daftar Tamu Undangan</h4>
            <p className="text-[11px] text-ink-soft">
              Kelola data kehadiran dan pengiriman undangan tamu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="text-xs font-semibold h-8"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Import / Export
            </Button>
            {isAtGuestLimit ? (
              <Button
                size="sm"
                disabled
                className="bg-amber-100 text-amber-500 border border-amber-200 text-xs font-semibold h-8 cursor-not-allowed opacity-80"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Tamu
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-8"
              >
                <Link to={`/events/${activeEvent.id}/guests/new`}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Tamu
                </Link>
              </Button>
            )}
          </div>
        </div>
        {/* Toolbar Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Rows Per Page */}
            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span>Show</span>
              <Select
                value={String(searchParams.limit || 10)}
                onValueChange={(val) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      limit: Number(val),
                      page: undefined,
                    }),
                  })
                }
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 w-[65px] text-xs bg-white border-rule shadow-none"
                >
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RSVP Status */}
            <Select
              value={searchParams.rsvpStatus || "All"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    rsvpStatus: val === "All" ? undefined : val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[120px] text-xs">
                <SelectValue placeholder="RSVP Status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All RSVP</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Attending">Attending</SelectItem>
                <SelectItem value="Declined">Declined</SelectItem>
              </SelectContent>
            </Select>

            {/* Invitation Status */}
            <Select
              value={searchParams.invitationStatus || "All"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    invitationStatus: val === "All" ? undefined : val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[130px] text-xs">
                <SelectValue placeholder="Undangan" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All Delivery</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Queued">Queued</SelectItem>
                <SelectItem value="Sending">Sending</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Viewed">Viewed</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Segment Selector */}
            <Select
              value={searchParams.segmentId || "All"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    segmentId: val === "All" ? undefined : val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[120px] text-xs">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All Segments</SelectItem>
                {segments.map((seg) => (
                  <SelectItem key={seg.id} value={seg.id}>
                    {seg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select
              value={searchParams.sortBy || "newest"}
              onValueChange={(val) =>
                navigate({ search: (prev) => ({ ...prev, sortBy: val, page: undefined }) })
              }
            >
              <SelectTrigger size="sm" className="w-[130px] text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rsvp_date">RSVP Date</SelectItem>
                <SelectItem value="invitation_sent">Sent Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search box right */}
          <div className="relative w-full sm:max-w-xs shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-soft z-10" />
            <Input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 text-xs placeholder:text-ink-soft"
            />
          </div>
        </div>

        {/* 4. Guest List Data Table */}
        <div className="overflow-hidden rounded-xl border border-rule/35 bg-white shadow-none">
          <Table>
            <TableHeader className="bg-paper/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={guestsData.length > 0 && selectedIds.length === guestsData.length}
                    onClick={handleToggleAll}
                    id="checkbox-all"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold text-ink pl-4">Guest</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Segment</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Invitation</TableHead>
                <TableHead className="text-xs font-semibold text-ink">RSVP</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Attendance</TableHead>
                <TableHead className="text-xs font-semibold text-ink text-center w-24">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-4 mx-auto rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-12 mx-auto rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : guestsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center">
                    <User className="mx-auto h-12 w-12 text-rule/60 stroke-[1.2]" />
                    <h4 className="mt-4 text-base text-ink font-semibold">No guests found</h4>
                    <p className="mt-1 text-xs text-ink-soft max-w-xs mx-auto">
                      Belum ada tamu yang sesuai dengan filter Anda. Tambah tamu baru atau ubah
                      filter untuk mencari.
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                    >
                      <Link to={`/events/${activeEvent.id}/guests/new`}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Tamu
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                guestsData.map((g) => {
                  const isSelected = selectedIds.includes(g.id);
                  const initials = g.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <TableRow
                      key={g.id}
                      className={cn(
                        "cursor-pointer group hover:bg-muted/10 transition-colors duration-150",
                        isSelected && "bg-muted/15",
                      )}
                      onClick={() => handleRowClick(g.id)}
                    >
                      {/* Checkbox column */}
                      <TableCell
                        className="text-center"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleToggleRow(g.id);
                        }}
                      >
                        <Checkbox checked={isSelected} id={`checkbox-${g.id}`} />
                      </TableCell>

                      {/* Guest main details */}
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 border border-primary/20">
                            {initials}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="font-semibold text-ink text-xs sm:text-sm">
                              {g.name}
                            </span>
                            <span className="text-[10px] text-ink-soft mt-0.5">
                              {g.phone || g.email || "No contact"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Segment */}
                      <TableCell>
                        {g.guest_segments ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-paper/60 border-rule/70 px-2 py-0.5 text-ink-soft"
                          >
                            {g.guest_segments.name}
                          </Badge>
                        ) : (
                          <span className="text-ink-soft text-[10px]">—</span>
                        )}
                      </TableCell>

                      {/* Invitation Delivery Status */}
                      <TableCell>
                        {g.guest_invitations ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              g.guest_invitations.delivery_status === "Sent" ||
                                g.guest_invitations.delivery_status === "Viewed"
                                ? "bg-emerald-50 text-emerald-700"
                                : g.guest_invitations.delivery_status === "Draft"
                                  ? "bg-slate-50 text-slate-600"
                                  : "bg-amber-50 text-amber-700",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                g.guest_invitations.delivery_status === "Sent" ||
                                  g.guest_invitations.delivery_status === "Viewed"
                                  ? "bg-emerald-500"
                                  : g.guest_invitations.delivery_status === "Draft"
                                    ? "bg-slate-400"
                                    : "bg-amber-500",
                              )}
                            />
                            {g.guest_invitations.delivery_status}
                          </span>
                        ) : (
                          <span className="text-ink-soft text-[10px]">Draft</span>
                        )}
                      </TableCell>

                      {/* RSVP Status */}
                      <TableCell>
                        {g.guest_rsvps ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={cn(
                                "text-[10px] font-semibold",
                                g.guest_rsvps.status === "Attending"
                                  ? "text-emerald-600"
                                  : g.guest_rsvps.status === "Declined"
                                    ? "text-destructive"
                                    : "text-ink-soft",
                              )}
                            >
                              {g.guest_rsvps.status}
                            </span>
                            <span className="text-[9px] text-ink-soft font-normal">
                              {g.guest_rsvps.party_size} Pax
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-soft text-[10px]">Pending</span>
                        )}
                      </TableCell>

                      {/* Attendance status */}
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            g.status === "Checked In"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-paper text-ink-soft",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              g.status === "Checked In" ? "bg-emerald-500" : "bg-slate-400",
                            )}
                          />
                          {g.status === "Checked In" ? "Checked In" : "Not Checked In"}
                        </span>
                      </TableCell>

                      {/* Row actions */}
                      <TableCell onClick={(ev) => ev.stopPropagation()} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              window.open(`/invite/${g.guest_invitations?.slug}`, "_blank")
                            }
                            title="Preview Invitation"
                            className="text-ink-soft hover:text-ink"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-ink-soft hover:text-ink"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRowClick(g.id)}>
                                <User className="h-3.5 w-3.5 mr-1.5" /> Detail & Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    await bulkSendInvitations({ data: [g.id] });
                                    toast.success("Undangan terkirim!");
                                    router.invalidate();
                                  } catch (err) {
                                    toast.error("Gagal mengirim undangan");
                                  }
                                }}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" /> Send Invitation
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteTargetId(g.id);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Guest
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 5. Pagination controls */}
        {!isLoading && pagination.pages > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-rule/30">
            <div className="text-xs text-ink-soft font-medium">
              Show {guestsData.length} of {pagination.total} guests
            </div>

            {pagination.pages > 1 && (
              <Pagination className="w-auto mx-0 justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page > 1) {
                          navigate({
                            search: (prev) => ({ ...prev, page: pagination.page - 1 }),
                          });
                        }
                      }}
                      className={cn(
                        "h-8 text-xs",
                        pagination.page <= 1 && "pointer-events-none opacity-40",
                      )}
                    />
                  </PaginationItem>

                  {/* Render page numbers */}
                  {Array.from({ length: pagination.pages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      Math.abs(pageNum - pagination.page) <= 1
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={pageNum === pagination.page}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate({
                                search: (prev) => ({ ...prev, page: pageNum }),
                              });
                            }}
                            className="h-8 w-8 text-xs rounded-lg"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (
                      (pageNum === 2 && pagination.page > 3) ||
                      (pageNum === pagination.pages - 1 && pagination.pages - pagination.page > 2)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis className="h-8 w-8" />
                        </PaginationItem>
                      );
                    }

                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.page < pagination.pages) {
                          navigate({
                            search: (prev) => ({ ...prev, page: pagination.page + 1 }),
                          });
                        }
                      }}
                      className={cn(
                        "h-8 text-xs",
                        (pagination.page >= pagination.pages || pagination.pages <= 1) &&
                          "pointer-events-none opacity-40",
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          FLOATING BULK ACTIONS TOOLBAR
      ------------------------------------------------------------- */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white rounded-full py-3 px-6 shadow-2xl flex items-center gap-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold tracking-tight">
              {selectedIds.length} Terpilih
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkSend}
              className="text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 h-8 rounded-full px-3"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Send Link
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBulkSegmentOpen(true)}
              className="text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 h-8 rounded-full px-3"
            >
              <Tag className="h-3.5 w-3.5 mr-1.5" /> Assign Segment
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 rounded-full px-3"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODALS / DIALOGS
      ------------------------------------------------------------- */}

      {/* ADD GUEST DIALOG */}
      <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
            <DialogDescription>
              Tambahkan tamu baru secara manual ke dalam list undangan acara Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGuest} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-xs">
                Nama Tamu *
              </Label>
              <Input
                id="add-name"
                value={addFormName}
                onChange={(e) => setAddFormName(e.target.value)}
                placeholder="Contoh: Rania Aditya"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-phone" className="text-xs">
                  No HP / WhatsApp
                </Label>
                <Input
                  id="add-phone"
                  value={addFormPhone}
                  onChange={(e) => setAddFormPhone(e.target.value)}
                  placeholder="+62 812-..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  value={addFormEmail}
                  onChange={(e) => setAddFormEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-partysize" className="text-xs">
                  Party Size (Pax)
                </Label>
                <Input
                  id="add-partysize"
                  type="number"
                  min={1}
                  value={addFormPartySize}
                  onChange={(e) => setAddFormPartySize(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-segment" className="text-xs">
                  Segmen Tamu
                </Label>
                <Select value={addFormSegmentId} onValueChange={setAddFormSegmentId}>
                  <SelectTrigger id="add-segment" className="text-xs">
                    <SelectValue placeholder="Pilih Segmen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Segment</SelectItem>
                    {segments.map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>
                        {seg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-notes" className="text-xs">
                Catatan Internal
              </Label>
              <Input
                id="add-notes"
                value={addFormNotes}
                onChange={(e) => setAddFormNotes(e.target.value)}
                placeholder="Catatan rombongan, diet khusus, dll."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddGuestOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingGuest}
                className="bg-primary text-primary-foreground text-xs font-semibold"
              >
                {isCreatingGuest ? "Saving..." : "Save Guest"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMPORT / EXPORT CSV DIALOG */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tamu Import & Export</DialogTitle>
            <DialogDescription>
              Kelola data tamu Anda menggunakan file spreadsheet. Unggah data tamu baru, unduh
              template awal, atau ekspor data tamu saat ini.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="import" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="import"
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" /> Import Tamu
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" /> Export Data
              </TabsTrigger>
            </TabsList>

            {/* IMPORT CONTENT */}
            <TabsContent value="import" className="space-y-4 outline-none">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-ink">File CSV Tamu</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-rule hover:border-ink-soft bg-paper/20 hover:bg-paper/40 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group relative"
                >
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="p-2.5 bg-white border border-rule/50 rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                      <Upload className="h-4 w-4 text-ink-soft" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        Seret & lepas file CSV di sini
                      </p>
                      <p className="text-[10px] text-ink-muted mt-0.5">
                        atau klik untuk memilih file dari komputer Anda
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CSV Template & Guide */}
              <div className="bg-paper/25 border border-rule/45 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Format & Template CSV
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleDownloadTemplate}
                    className="text-[10px] h-7 px-2.5 bg-white hover:bg-muted/10 font-semibold gap-1.5"
                  >
                    <Download className="h-3 w-3" /> Unduh Template CSV
                  </Button>
                </div>
                <p className="text-[10px] text-ink-soft leading-relaxed">
                  Susun kolom file CSV Anda dengan header berikut:{" "}
                  <strong className="text-ink font-mono font-normal">Name</strong> (wajib),{" "}
                  <strong className="text-ink font-mono font-normal">Phone</strong>,{" "}
                  <strong className="text-ink font-mono font-normal">Email</strong>,{" "}
                  <strong className="text-ink font-mono font-normal">Segment</strong>, dan{" "}
                  <strong className="text-ink font-mono font-normal">Party Size</strong>.
                </p>
              </div>

              {/* Error alerts during parsing */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 text-red-800 rounded-xl p-3 border border-red-200 max-h-36 overflow-y-auto space-y-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" /> Ada beberapa
                    kesalahan dalam file:
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview row summary before saving */}
              {importPreviewRows.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {importPreviewRows.length} tamu valid siap untuk diimport
                  </span>
                  <div className="border border-rule/50 rounded-xl max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-paper/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[10px] font-semibold text-ink pl-3">
                            Name
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold text-ink">
                            Phone
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold text-ink">
                            Segment
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold text-ink text-center">
                            Party
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreviewRows.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-[11px] text-ink font-medium pl-3">
                              {row.name}
                            </TableCell>
                            <TableCell className="text-[11px] text-ink-soft">
                              {row.phone || "—"}
                            </TableCell>
                            <TableCell className="text-[11px] text-ink-soft">
                              {row.segment || "—"}
                            </TableCell>
                            <TableCell className="text-[11px] text-ink text-center">
                              {row.party_size}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {importPreviewRows.length > 5 && (
                      <div className="p-2 bg-paper/20 text-center text-[10px] text-ink-soft border-t border-rule/30">
                        Dan {importPreviewRows.length - 5} data tamu lainnya...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-rule/30">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsImportOpen(false);
                    setImportPreviewRows([]);
                    setImportErrors([]);
                  }}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={
                    isImporting || importPreviewRows.length === 0 || importErrors.length > 0
                  }
                  onClick={executeImport}
                  className="bg-primary text-primary-foreground text-xs font-semibold"
                >
                  {isImporting ? "Mengimpor..." : `Import ${importPreviewRows.length} Tamu`}
                </Button>
              </div>
            </TabsContent>

            {/* EXPORT CONTENT */}
            <TabsContent value="export" className="space-y-4 outline-none">
              <div className="rounded-xl border border-rule/50 bg-paper/30 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-ink">Ekspor Daftar Tamu Saat Ini</h4>
                <p className="text-[11px] text-ink-soft leading-relaxed">
                  Ekspor seluruh daftar tamu acara ini ke dalam format file spreadsheet (.csv). Data
                  yang diekspor meliputi Nama, Kontak, Segmen, Ukuran Undangan (Party Size), dan
                  Status Kehadiran (RSVP & Invitation).
                </p>
                <div className="flex items-center justify-between text-[11px] border-t border-rule/30 pt-3 mt-1">
                  <span className="text-ink-soft">
                    Jumlah Tamu Terdaftar:{" "}
                    <strong className="text-ink">{guestsData.length} Tamu</strong>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleExportGuests}
                    disabled={guestsData.length === 0}
                    className="text-xs font-semibold"
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1.5" /> Ekspor ke CSV
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-rule/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportOpen(false)}
                  className="text-xs"
                >
                  Tutup
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* BULK SEGMENT ASSIGN DIALOG */}
      <Dialog open={isBulkSegmentOpen} onOpenChange={setIsBulkSegmentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Segmen Tamu</DialogTitle>
            <DialogDescription>
              Tentukan segmen baru untuk {selectedIds.length} tamu terpilih secara massal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Pilih Segmen Baru</Label>
              <Select value={bulkSegmentId} onValueChange={setBulkSegmentId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih Segmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Segmen</SelectItem>
                  {segments.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      {seg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBulkSegmentOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkAssignSegment}
              className="bg-primary text-primary-foreground text-xs font-semibold"
            >
              Update Segmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SINGLE DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tamu Undangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tamu ini? Seluruh data riwayat aktivitas, rincian
              undangan, dan tanggapan RSVP tamu bersangkutan juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleDelete}
              className="bg-destructive hover:bg-destructive/95 text-xs text-white"
            >
              Hapus Tamu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BULK DELETE CONFIRMATION */}
      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.length} Tamu Terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus {selectedIds.length} tamu undangan yang dipilih secara
              permanen dari basis data acara Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/95 text-xs text-white"
            >
              Hapus Massal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------------------------------------------------
          GUEST WORKSPACE DETAIL DRAWER (SHEET)
      ------------------------------------------------------------- */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white">
          <SheetHeader className="p-5 border-b border-rule/40 bg-paper/10 shrink-0">
            <SheetTitle className="text-sm font-semibold tracking-tight text-ink flex items-center gap-2">
              <User className="h-4 w-4 text-ink-soft shrink-0" />
              Rincian Tamu Undangan
            </SheetTitle>
            <SheetDescription className="text-[11px] text-ink-soft mt-0.5">
              Pantau siklus aktivitas tamu dan perbarui rincian RSVP/Undangan mereka.
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex-1 p-5 space-y-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-[2px] w-full" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : detailGuest ? (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              {/* Tab Navigation buttons */}
              <div className="flex border-b border-rule/45 bg-paper/20 p-1 shrink-0 gap-1 text-[11px] font-medium text-ink-soft">
                {[
                  { id: "guest", label: "Tamu" },
                  { id: "invite", label: "Undangan" },
                  { id: "rsvp", label: "RSVP" },
                  { id: "activity", label: "Log Audit" },
                  { id: "notes", label: "Catatan" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-center transition-colors cursor-pointer",
                      detailTab === tab.id
                        ? "bg-white text-ink font-semibold shadow-xs border border-rule/20"
                        : "hover:bg-muted/40",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* 1. GUEST DETAILS TAB */}
                {detailTab === "guest" && (
                  <form onSubmit={handleUpdateGuest} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-name" className="text-xs">
                        Nama Lengkap
                      </Label>
                      <Input
                        id="edit-name"
                        value={editFormName}
                        onChange={(e) => setEditFormName(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-phone" className="text-xs">
                        No HP / WhatsApp
                      </Label>
                      <Input
                        id="edit-phone"
                        value={editFormPhone}
                        onChange={(e) => setEditFormPhone(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormEmail}
                        onChange={(e) => setEditFormEmail(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-partysize" className="text-xs">
                          Rombongan (Pax)
                        </Label>
                        <Input
                          id="edit-partysize"
                          type="number"
                          min={1}
                          value={editFormPartySize}
                          onChange={(e) => setEditFormPartySize(parseInt(e.target.value, 10) || 1)}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-segment" className="text-xs">
                          Segmen
                        </Label>
                        <Select value={editFormSegmentId} onValueChange={setEditFormSegmentId}>
                          <SelectTrigger id="edit-segment" className="text-xs">
                            <SelectValue placeholder="Pilih Segmen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Segment</SelectItem>
                            {segments.map((seg) => (
                              <SelectItem key={seg.id} value={seg.id}>
                                {seg.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-status" className="text-xs">
                        Status Kehadiran
                      </Label>
                      <Select value={editFormStatus} onValueChange={setEditFormStatus}>
                        <SelectTrigger id="edit-status" className="text-xs">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Invited">Invited</SelectItem>
                          <SelectItem value="RSVP'd">RSVP Submitted</SelectItem>
                          <SelectItem value="Checked In">Checked In</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-notes" className="text-xs">
                        Catatan Ringkas
                      </Label>
                      <Input
                        id="edit-notes"
                        value={editFormNotes}
                        onChange={(e) => setEditFormNotes(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isUpdatingGuest}
                      className="w-full bg-primary text-primary-foreground text-xs font-semibold mt-4"
                    >
                      {isUpdatingGuest ? "Menyimpan..." : "Perbarui Data"}
                    </Button>
                  </form>
                )}

                {/* 2. INVITATION LIFECYCLE TAB */}
                {detailTab === "invite" && (
                  <div className="space-y-4 text-xs text-ink">
                    <div className="bg-paper/40 p-4 rounded-xl border border-rule/30 space-y-3">
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Invitation Code
                        </span>
                        <div className="font-mono text-sm font-semibold mt-0.5">
                          {detailGuest.guest_invitations?.invitation_code || "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Delivery Status
                        </span>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border-0",
                              detailGuest.guest_invitations?.delivery_status === "Sent" ||
                                detailGuest.guest_invitations?.delivery_status === "Viewed"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            )}
                          >
                            {detailGuest.guest_invitations?.delivery_status || "Draft"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          View / Opened Count
                        </span>
                        <div className="text-xs font-semibold mt-0.5">
                          {detailGuest.guest_invitations?.view_count || 0} Kali dibuka
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Invitation Link
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Input
                            readOnly
                            value={`${window.location.origin}/invite/${detailGuest.guest_invitations?.slug}`}
                            className="text-[10px] font-mono select-all h-8 bg-muted/20"
                          />
                          <Button
                            size="icon-xs"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/invite/${detailGuest.guest_invitations?.slug}`,
                              );
                              toast.success("Link berhasil disalin!");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(`/invite/${detailGuest.guest_invitations?.slug}`, "_blank")
                        }
                        className="flex-1 text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview Link
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            await bulkSendInvitations({ data: [detailGuest.id] });
                            toast.success("Simulasi Undangan Terkirim!");
                            const refreshed = await getGuestById({ data: detailGuest.id });
                            setDetailGuest(refreshed);
                            router.invalidate();
                          } catch (err) {
                            toast.error("Gagal mengirim simulasi");
                          }
                        }}
                        className="flex-1 bg-primary text-primary-foreground text-xs"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Send Invitation
                      </Button>
                    </div>
                  </div>
                )}

                {/* 3. RSVP STATUS TAB */}
                {detailTab === "rsvp" && (
                  <div className="space-y-4 text-xs text-ink">
                    <div className="bg-paper/40 p-4 rounded-xl border border-rule/30 space-y-3">
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Tanggapan RSVP
                        </span>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border-0",
                              detailGuest.guest_rsvps?.status === "Attending"
                                ? "bg-emerald-50 text-emerald-700"
                                : detailGuest.guest_rsvps?.status === "Declined"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-100 text-slate-700",
                            )}
                          >
                            {detailGuest.guest_rsvps?.status || "Pending"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Rencana Jumlah Orang (Pax)
                        </span>
                        <div className="text-xs font-semibold mt-0.5">
                          {detailGuest.guest_rsvps?.party_size || 1} Pax
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Tanggal Respons
                        </span>
                        <div className="text-xs mt-0.5 text-ink-soft">
                          {detailGuest.guest_rsvps?.responded_at
                            ? new Date(detailGuest.guest_rsvps.responded_at).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "Belum menanggapi"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase font-medium">
                          Pesan respons
                        </span>
                        <p className="text-xs italic bg-white p-3 rounded-lg border border-rule/30 mt-1">
                          {detailGuest.guest_rsvps?.response_message ||
                            "— Tidak meninggalkan pesan —"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ACTIVITY TIMELINE LOG TAB */}
                {detailTab === "activity" && (
                  <div className="space-y-4">
                    {detailGuest.guest_activities && detailGuest.guest_activities.length > 0 ? (
                      <div className="relative border-l border-rule/60 pl-4 space-y-4 ml-1 pt-1">
                        {detailGuest.guest_activities.map((act) => (
                          <div key={act.id} className="relative text-xs">
                            <span className="absolute -left-[20.5px] top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white border border-primary shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </span>
                            <div className="flex justify-between items-baseline gap-2">
                              <span className="font-semibold text-ink">{act.description}</span>
                              <span className="text-[9px] text-ink-soft font-mono shrink-0">
                                {new Date(act.timestamp).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="text-[10px] text-ink-soft mt-0.5 flex items-center gap-1.5">
                              <span>Actor: {act.actor}</span>
                              <span>•</span>
                              <span>
                                {new Date(act.timestamp).toLocaleDateString("id-ID", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-ink-soft text-xs">
                        Belum ada aktivitas tercatat untuk tamu ini.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. NOTES TAB */}
                {detailTab === "notes" && (
                  <div className="space-y-4 text-xs">
                    {/* Add note form */}
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <Input
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Tulis catatan internal baru..."
                        className="text-xs"
                      />
                      <Button
                        type="submit"
                        disabled={isAddingNote || !newNoteText.trim()}
                        size="xs"
                        className="w-full bg-primary text-primary-foreground text-[10px] font-semibold"
                      >
                        {isAddingNote ? "Adding Note..." : "Add Note"}
                      </Button>
                    </form>

                    <DropdownMenuSeparator className="my-3 bg-rule/30" />

                    {/* Notes List */}
                    {detailGuest.guest_notes && detailGuest.guest_notes.length > 0 ? (
                      <div className="space-y-2">
                        {detailGuest.guest_notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 bg-paper/30 border border-rule/20 rounded-xl space-y-1.5"
                          >
                            <p className="text-ink font-medium leading-relaxed">{note.note}</p>
                            <div className="text-[9px] text-ink-soft flex items-center justify-between font-mono">
                              <span>Oleh: {note.created_by || "System"}</span>
                              <span>
                                {new Date(note.created_at).toLocaleDateString("id-ID", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-ink-soft text-xs">
                        Belum ada catatan internal tersimpan.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer footer (actions) */}
              <SheetFooter className="p-5 border-t border-rule/40 bg-paper/10 shrink-0 flex flex-row items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteTargetId(detailGuest.id);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus Tamu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1 text-xs bg-white"
                >
                  Close Drawer
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
