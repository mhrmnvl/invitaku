import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Calendar,
  Users,
  LayoutGrid,
  List,
  MoreHorizontal,
  Copy,
  Trash2,
  Share2,
  Play,
  Archive,
  Lock,
  Globe,
  MapPin,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  getEvents,
  deleteEvent,
  publishEvent,
  archiveEvent,
  duplicateEvent,
  formatLocation,
} from "@/lib/events-api";

// Define search query validations
interface SearchParams {
  search?: string;
  status?: string;
  type?: string;
  visibility?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const Route = createFileRoute("/_layout/events/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      search: (search.search as string) || undefined,
      status: (search.status as string) || undefined,
      type: (search.type as string) || undefined,
      visibility: (search.visibility as string) || undefined,
      sort: (search.sort as string) || undefined,
      page: search.page ? Number(search.page) : undefined,
      limit: search.limit ? Number(search.limit) : undefined,
    };
  },
  loaderDeps: ({ search }) => ({
    search: search.search,
    status: search.status,
    type: search.type,
    visibility: search.visibility,
    sort: search.sort,
    page: search.page,
    limit: search.limit,
  }),
  loader: async ({ deps }) => {
    return await getEvents({
      data: {
        search: deps.search,
        statusFilter: deps.status,
        typeFilter: deps.type,
        visibilityFilter: deps.visibility,
        sortBy: deps.sort,
        page: deps.page || 1,
        limit: deps.limit || 10,
      },
    });
  },
  component: EventsPage,
});

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (err) {
    return dateStr;
  }
};

const formatHumanDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    return dateStr;
  }
};

const getCompactLocation = (locationStr: string | null | undefined): string => {
  if (!locationStr) return "";
  try {
    const data = JSON.parse(locationStr);
    if (typeof data !== "object" || data === null) {
      return locationStr;
    }
    const village = data.village || data.district || "";
    const city = data.city || "";
    if (village && city) return `${village}, ${city}`;
    return village || city || "";
  } catch {
    const parts = locationStr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      return parts.slice(-2).join(", ");
    }
    return locationStr;
  }
};

function EventsPage() {
  const router = useRouter();
  const searchParams = useSearch({ from: "/_layout/events/" });
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();

  const events = loaderData.data || [];
  const pagination = loaderData.pagination;
  const isLoading = router.state.status === "pending";

  // URL States synced locally
  const [searchVal, setSearchVal] = useState(searchParams.search || "");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sync search input value from URL on navigation
  useEffect(() => {
    setSearchVal(searchParams.search || "");
  }, [searchParams.search]);

  // Load view mode preference
  useEffect(() => {
    const saved = localStorage.getItem("events_view_mode");
    if (saved === "grid" || saved === "table") {
      setViewMode(saved);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== (searchParams.search || "")) {
        navigate({
          search: (prev) => ({
            ...prev,
            search: searchVal || undefined,
            page: undefined, // Reset to page 1 on new search
          }),
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchVal, navigate, searchParams.search]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent({ data: deleteId });
      toast.success("Event deleted successfully!");
      setDeleteId(null);
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete event";
      toast.error(message);
    }
  };

  // Generic status update helpers
  const handlePublish = async (id: string) => {
    try {
      await publishEvent({ data: id });
      toast.success("Event published successfully!");
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish event";
      toast.error(message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveEvent({ data: id });
      toast.success("Event archived!");
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to archive event";
      toast.error(message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateEvent({ data: id });
      toast.success("Event duplicated successfully!");
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to duplicate event";
      toast.error(message);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/invite/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Invitation link copied!");
  };

  const handleQuickFilter = (status: string) => {
    const activeStatus = searchParams.status === status ? undefined : status;
    navigate({
      search: (prev) => ({
        ...prev,
        status: activeStatus,
        page: undefined,
      }),
    });
  };

  const toggleViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("events_view_mode", mode);
  };

  const eventTypes = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl text-ink font-semibold">Events</h2>
          <p className="text-xs text-ink-soft mt-1">Manage all your events in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          >
            <Link to="/events/new">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Event
            </Link>
          </Button>
        </div>
      </div>
      {/* Content Card Wrapper */}
      <div className="bg-white rounded-2xl border border-rule/50 p-6 space-y-6 shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          {/* Left: View Toggle & Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* View Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(val) => {
                if (val) toggleViewMode(val as "grid" | "table");
              }}
              variant="outline"
              size="sm"
              spacing={0}
              className="shrink-0"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <List className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Status Filter */}
            <Select
              value={searchParams.status || "All"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    status: val === "All" ? undefined : val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[110px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={searchParams.type || "All"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    type: val === "All" ? undefined : val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[120px] text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All Types</SelectItem>
                {eventTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Visibility Filter */}
            <Select
              value={searchParams.visibility || "All"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    visibility: val === "All" ? undefined : val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[130px] text-xs">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="All">All Visibility</SelectItem>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Password">Password</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select
              value={searchParams.sort || "newest"}
              onValueChange={(val) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: val,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger size="sm" className="w-[130px] text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="event_date">Event Date</SelectItem>
                <SelectItem value="most_guests">Most Guests</SelectItem>
                <SelectItem value="most_views">Most Views</SelectItem>
                <SelectItem value="most_rsvp">Most RSVP</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right: Search Box */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-soft" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9 placeholder:text-ink-soft w-full text-xs"
            />
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <EventsSkeleton />
        ) : events.length === 0 ? (
          <div className="border border-dashed border-rule rounded-3xl py-16 text-center bg-paper">
            <Calendar className="mx-auto h-8 w-8 text-rule" strokeWidth={1} />
            <h4 className="mt-4 text-lg text-ink font-semibold">No events yet</h4>
            <p className="mt-1 text-xs text-ink-soft mb-4">
              Create your first event to start inviting guests.
            </p>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              <Link to="/events/new">
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Event
              </Link>
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const guestCount = e.event_statistics?.guest_count || 0;
              const rsvpCount = e.event_statistics?.rsvp_count || 0;
              const rsvpPercent = guestCount > 0 ? Math.round((rsvpCount / guestCount) * 100) : 0;

              return (
                <Card
                  key={e.id}
                  className="flex flex-col justify-between border border-rule/35 bg-white shadow-xs rounded-xl hover:border-rule-strong hover:shadow-sm transition-all duration-300 group"
                >
                  <CardHeader className="p-5 pb-3 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-medium text-ink-soft bg-paper/60 px-2 py-0.5 rounded-md">
                        {e.type}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {e.visibility === "Password" && (
                          <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-[10px] font-medium rounded-md px-2 py-0.5 flex items-center gap-1.5",
                            e.status === "Published"
                              ? "bg-emerald-50/50 text-emerald-700"
                              : e.status === "Archived"
                                ? "bg-amber-50/50 text-amber-700"
                                : "bg-paper text-ink-soft",
                          )}
                        >
                          {e.status === "Published" ? (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                          ) : e.status === "Archived" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                          )}
                          {e.status === "Published" ? "Live" : e.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <CardTitle className="text-base font-semibold text-ink line-clamp-2 leading-snug tracking-tight group-hover:text-primary transition-colors duration-300">
                        {e.name}
                      </CardTitle>
                      <div className="group/slug flex items-center gap-1 mt-1 text-[10px] text-ink-soft font-mono select-all w-fit">
                        <span>/{e.slug}</span>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleCopyLink(e.slug);
                          }}
                          className="opacity-0 group-hover/slug:opacity-100 transition-opacity duration-150 p-0.5 rounded hover:bg-muted text-ink-soft cursor-pointer shrink-0"
                          title="Copy invitation link"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 pt-0 space-y-4 text-xs">
                    {/* Time & Location Details */}
                    <div className="flex flex-col gap-1.5 text-[10px] text-ink-soft font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-ink-soft/75 shrink-0" />
                        <span>
                          {formatHumanDate(e.start_date)} · {e.start_time}
                        </span>
                      </div>
                      {e.location && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 truncate cursor-default">
                                <MapPin className="h-3.5 w-3.5 text-ink-soft/75 shrink-0" />
                                <span>{getCompactLocation(e.location)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              {formatLocation(e.location)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {/* RSVP Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-ink">
                            {rsvpCount} Responded
                          </span>
                          <span className="text-[10px] text-ink-soft">
                            {guestCount} Guests invited
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-ink">{rsvpPercent}%</span>
                      </div>
                      <Progress value={rsvpPercent} className="h-[3px] bg-rule/10 rounded-full" />
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center gap-2 p-5 pt-4">
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs font-semibold"
                    >
                      <Link to="/events/$eventId" params={{ eventId: e.id }}>
                        Manage Event
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="shrink-0 bg-white border-rule shadow-none hover:bg-muted"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-ink-soft" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/${e.slug}`, "_blank")}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(e.slug)}>
                          <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(e.id)}>
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicate Event
                        </DropdownMenuItem>
                        {e.status !== "Published" && (
                          <DropdownMenuItem onClick={() => handlePublish(e.id)}>
                            <Play className="h-3.5 w-3.5 mr-1.5" /> Publish
                          </DropdownMenuItem>
                        )}
                        {e.status !== "Archived" && (
                          <DropdownMenuItem onClick={() => handleArchive(e.id)}>
                            <Archive className="h-3.5 w-3.5 mr-1.5" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(e.id)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end items-center text-xs text-ink-soft">
              <div className="flex items-center gap-1.5 font-medium">
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
                    className="h-7 w-[65px] text-[11px] font-semibold bg-white border-rule shadow-none"
                  >
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="1000">All</SelectItem>
                  </SelectContent>
                </Select>
                <span>rows per page</span>
              </div>
            </div>
            <div className="rounded-xl border border-rule/80 bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-rule/60">
                    <TableHead className="pl-6 pr-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Slug
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Type
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Time
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      RSVP
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Visibility
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[10px] font-semibold text-ink-soft uppercase tracking-wider text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => {
                    const guestCount = e.event_statistics?.guest_count || 0;
                    const rsvpCount = e.event_statistics?.rsvp_count || 0;

                    return (
                      <TableRow key={e.id} className="hover:bg-muted/30 border-rule/50">
                        <TableCell className="pl-6 pr-3 py-3 font-semibold text-xs text-ink">
                          {e.name}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-[10px] font-mono text-ink-soft">
                          /{e.slug}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-medium h-4.5 px-1.5 border-rule bg-paper/80 text-ink-soft shrink-0"
                          >
                            {e.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-ink font-medium">
                          {formatDate(e.start_date)}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-ink-soft font-medium">
                          {e.start_time}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-ink font-medium">
                          {rsvpCount} / {guestCount}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                            {e.visibility === "Public" ? (
                              <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            )}
                            {e.visibility}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            {e.status === "Published" ? (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            ) : e.status === "Archived" ? (
                              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-ink">
                              {e.status === "Published" ? "Live" : e.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" id={`action-menu-${e.id}`}>
                                  <MoreHorizontal className="h-3.5 w-3.5 text-ink-soft" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center">
                                <DropdownMenuItem onClick={() => handleCopyLink(e.slug)}>
                                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(e.id)}>
                                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicate Event
                                </DropdownMenuItem>
                                {e.status !== "Published" && (
                                  <DropdownMenuItem onClick={() => handlePublish(e.id)}>
                                    <Play className="h-3.5 w-3.5 mr-1.5" /> Publish
                                  </DropdownMenuItem>
                                )}
                                {e.status !== "Archived" && (
                                  <DropdownMenuItem onClick={() => handleArchive(e.id)}>
                                    <Archive className="h-3.5 w-3.5 mr-1.5" /> Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(e.id)}
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination control */}
        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 text-xs text-ink-soft">
            {/* Left side: Range label */}
            <div className="font-medium text-ink-soft/90">
              Showing {events.length} of {pagination.total} events
            </div>

            {/* Right side: Shadcn UI Pagination */}
            <Pagination className="mx-0 w-auto justify-end">
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
                      (pagination.page <= 1 || pagination.pages <= 1) &&
                        "pointer-events-none opacity-40",
                    )}
                  />
                </PaginationItem>

                {/* Render page numbers */}
                {pagination.pages <= 1 ? (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={true}
                      onClick={(e) => e.preventDefault()}
                      className="h-8 w-8 text-xs rounded-lg pointer-events-none"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  Array.from({ length: pagination.pages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Limit number of shown pages for clean aesthetics (e.g. current page +/- 1)
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
                  })
                )}

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
          </div>
        )}
      </div>

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Event?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this event? This action uses soft delete and can be
              restored by workspace admins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 6 loading Skeletons Component
function EventsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col justify-between border-rule bg-white p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/4 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-1.5 w-full rounded-md" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-rule/50">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
          </div>
        </Card>
      ))}
    </div>
  );
}
