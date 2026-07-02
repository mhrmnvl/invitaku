"use client";

import * as React from "react";
import { useNavigate, useRouter, useLocation, Link } from "@tanstack/react-router";
import { getEvents } from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  Calendar,
  Globe,
  Lock,
  Users,
  Eye,
  Plus,
  Compass,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface DbEvent {
  id: string;
  name: string;
  type: string;
  slug?: string;
  start_date: string;
  status: string;
  visibility: string;
  event_statistics?: {
    guest_count: number;
    rsvp_count: number;
    attendance_count: number;
  };
}

interface EventContextHeaderProps {
  event: DbEvent;
  showStats?: boolean;
  showActions?: boolean;
  variant?: "default" | "minimal";
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export function EventContextHeader({
  event,
  showStats = true,
  showActions = true,
  variant = "default",
}: EventContextHeaderProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (to: string) => {
    if (to === `/events/${event.id}`) {
      return currentPath === to || currentPath === `${to}/`;
    }
    return currentPath.startsWith(to);
  };

  const navItems = [
    { label: "Overview", to: `/events/${event.id}` },
    { label: "Guests", to: `/events/${event.id}/guests` },
    { label: "Builder Desain", to: `/events/${event.id}/invitations` },
    { label: "Analytics", to: `/events/${event.id}/analytics` },
    { label: "Settings", to: `/events/${event.id}/settings` },
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const [eventsList, setEventsList] = React.useState<DbEvent[]>([]);
  const [recentEventIds, setRecentEventIds] = React.useState<string[]>([]);

  // Track recent events using localStorage
  React.useEffect(() => {
    if (event?.id) {
      const stored = localStorage.getItem("invitaku_recent_events");
      let recents: string[] = stored ? JSON.parse(stored) : [];
      // Remove current id if exists, then prepend to top
      recents = recents.filter((id) => id !== event.id);
      recents.unshift(event.id);
      // Keep only top 3 recent events
      recents = recents.slice(0, 3);
      localStorage.setItem("invitaku_recent_events", JSON.stringify(recents));
      setRecentEventIds(recents);
    }
  }, [event?.id]);

  // Load all events for switcher
  const handleOpenSwitcher = async () => {
    setIsOpen(true);
    try {
      const res = await getEvents({ data: { limit: 100 } });
      setEventsList((res.data as DbEvent[]) || []);
    } catch (err) {
      console.error("Gagal memuat daftar acara untuk switcher:", err);
    }
  };

  const handleSwitchEvent = (targetEventId: string) => {
    setIsOpen(false);
    const pathname = router.state.location.pathname;

    // Detect sub-route suffix after eventId (e.g. /events/uuid-1/guests -> /guests)
    let subRoute = "";
    const eventMatch = pathname.match(/\/events\/[^/]+(\/.*)?/);
    if (eventMatch && eventMatch[1]) {
      subRoute = eventMatch[1];
    }

    // Navigate to new event route
    navigate({
      to: `/events/${targetEventId}${subRoute}`,
    });
  };

  const handlePreview = () => {
    const url = `${window.location.origin}/invite/${event.slug || event.id}`;
    window.open(url, "_blank");
  };

  const handleShare = () => {
    const url = `${window.location.origin}/invite/${event.slug || event.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Tautan undangan berhasil disalin ke papan klip!");
  };

  const guestCount = event.event_statistics?.guest_count ?? 0;

  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-between border-b border-rule/50 pb-3 mb-6 bg-transparent">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-ink">{event.name}</span>
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 h-4.5 bg-paper/60 text-ink-soft"
          >
            {event.type}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleOpenSwitcher}
          className="text-xs h-7 gap-1 font-medium"
        >
          Switch <ChevronsUpDown className="h-3 w-3 opacity-60" />
        </Button>

        <SwitcherDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          eventsList={eventsList}
          recentEventIds={recentEventIds}
          activeEventId={event.id}
          onSwitch={handleSwitchEvent}
        />
      </div>
    );
  }

  return (
    <div className="bg-paper/30 border border-rule/50 rounded-2xl p-5 md:p-6 mb-6 shadow-xs relative overflow-hidden">
      <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
        <div className="space-y-1.5 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">
              Active Workspace
            </span>
            <span className="h-1 w-1 rounded-full bg-rule/70" />
            <span className="text-[9px] text-primary font-mono uppercase tracking-wider">
              {event.type}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl text-ink tracking-tight font-semibold leading-tight break-words max-w-2xl">
            {event.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-ink-soft pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 opacity-65" strokeWidth={1.5} />
              {formatDate(event.start_date)}
            </span>
            <span className="h-1 w-1 rounded-full bg-rule/50" />
            <span className="inline-flex items-center gap-1.5">
              {event.visibility === "Public" ? (
                <Globe className="h-3.5 w-3.5 text-emerald-600 opacity-80" strokeWidth={1.5} />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-600 opacity-80" strokeWidth={1.5} />
              )}
              {event.visibility}
            </span>
            <span className="h-1 w-1 rounded-full bg-rule/50" />
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  event.status === "Published" ? "bg-emerald-500 animate-pulse" : "bg-slate-400",
                )}
              />
              {event.status === "Published" ? "Live" : event.status}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSwitcher}
              className="text-xs h-9 px-3 border-rule bg-white text-ink-soft hover:bg-muted/10 gap-1.5 shadow-none"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-65" strokeWidth={1.5} />
              Switch Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs h-9 px-3 border-rule bg-white text-ink-soft hover:bg-muted/10 gap-1.5 shadow-none"
            >
              <Share2 className="h-3.5 w-3.5 opacity-65" strokeWidth={1.5} />
              Share Link
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePreview}
              className="text-xs h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-none font-medium"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Invitation
            </Button>
          </div>
        )}
      </div>

      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-rule/35 pt-5 mt-4">
          <div className="space-y-1">
            <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider block">
              Guests Invited
            </span>
            <span className="text-3xl text-ink font-semibold tracking-tight block">
              {guestCount}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider block">
              RSVPs Received
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl text-ink font-semibold tracking-tight">
                {event.event_statistics?.rsvp_count ?? 0}
              </span>
              <span className="text-xs text-ink-soft font-mono">/ {guestCount}</span>
            </div>
            {guestCount > 0 && (
              <div className="h-1 w-24 bg-paper rounded-full overflow-hidden border border-rule/40 mt-1.5">
                <div
                  style={{
                    width: `${Math.min(100, Math.round(((event.event_statistics?.rsvp_count ?? 0) / guestCount) * 100))}%`,
                  }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider block">
              Attending Guests
            </span>
            <span className="text-3xl text-ink font-semibold tracking-tight block">
              {event.event_statistics?.attendance_count ?? 0}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider block">
              Delivery Rate
            </span>
            <span className="text-3xl text-ink font-semibold tracking-tight block">
              {guestCount > 0
                ? `${Math.min(100, Math.round(((event.event_statistics?.rsvp_count ?? 0) / guestCount) * 100))}%`
                : "0%"}
            </span>
            {guestCount > 0 && (
              <div className="h-1 w-24 bg-paper rounded-full overflow-hidden border border-rule/40 mt-1.5">
                <div
                  style={{
                    width: `${Math.min(100, Math.round(((event.event_statistics?.rsvp_count ?? 0) / guestCount) * 100))}%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
      {variant === "default" && (
        <div className="border-b border-rule/45 -mx-5 px-5 md:-mx-6 md:px-6 mt-5 flex items-center gap-6 overflow-x-auto scrollbar-none shrink-0 relative z-10">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "text-xs pb-3 border-b-2 font-medium transition-all duration-150 relative -mb-[1px] whitespace-nowrap cursor-pointer",
                  active
                    ? "border-primary border-b-primary text-primary font-semibold"
                    : "border-transparent text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
      <SwitcherDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        eventsList={eventsList}
        recentEventIds={recentEventIds}
        activeEventId={event.id}
        onSwitch={handleSwitchEvent}
      />
    </div>
  );
}

// Inner Component for Searchable Command Switcher Dialog
function SwitcherDialog({
  isOpen,
  setIsOpen,
  eventsList,
  recentEventIds,
  activeEventId,
  onSwitch,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  eventsList: DbEvent[];
  recentEventIds: string[];
  activeEventId: string;
  onSwitch: (id: string) => void;
}) {
  const navigate = useNavigate();
  const recentEvents = eventsList.filter(
    (e) => recentEventIds.includes(e.id) && e.id !== activeEventId,
  );
  const otherEvents = eventsList.filter(
    (e) => e.id !== activeEventId && !recentEventIds.includes(e.id),
  );

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Switch Event Context"
      description="Cari dan pilih acara lain untuk beralih konteks workspace"
    >
      <CommandInput placeholder="Cari acara..." />
      <CommandList className="py-2">
        <CommandEmpty>Acara tidak ditemukan.</CommandEmpty>

        {/* Create Event Quick Action */}
        <CommandGroup heading="Aksi Cepat">
          <CommandItem
            onSelect={() => {
              setIsOpen(false);
              navigate({ to: "/events/new" });
            }}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-semibold text-xs text-primary">Buat Acara Baru</span>
          </CommandItem>
        </CommandGroup>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <CommandGroup heading="Baru-baru ini diakses">
            {recentEvents.map((ev) => (
              <CommandItem key={ev.id} onSelect={() => onSwitch(ev.id)} className="cursor-pointer">
                <Compass className="h-4 w-4 mr-2 text-ink-soft" />
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-ink">{ev.name}</span>
                  <span className="text-[10px] text-ink-soft">
                    {ev.type} &bull; {formatDate(ev.start_date)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* All / Other Events */}
        <CommandGroup heading="Semua Acara">
          {eventsList
            .filter((e) => e.id === activeEventId)
            .map((ev) => (
              <CommandItem key={ev.id} disabled className="opacity-60 bg-muted/20">
                <Compass className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-primary">{ev.name} (Aktif)</span>
                  <span className="text-[10px] text-primary/70">
                    {ev.type} &bull; {formatDate(ev.start_date)}
                  </span>
                </div>
              </CommandItem>
            ))}
          {otherEvents.map((ev) => (
            <CommandItem key={ev.id} onSelect={() => onSwitch(ev.id)} className="cursor-pointer">
              <Compass className="h-4 w-4 mr-2 text-ink-soft" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-ink">{ev.name}</span>
                <span className="text-[10px] text-ink-soft">
                  {ev.type} &bull; {formatDate(ev.start_date)}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
