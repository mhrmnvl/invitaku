import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, requireUserSession } from "./auth-server";

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  type: z.enum([
    "Wedding",
    "Birthday",
    "Graduation",
    "Seminar",
    "Corporate",
    "Community",
    "School",
    "Government",
    "Other",
  ]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  timezone: z.string().default("Asia/Jakarta"),
  location: z.string().optional().nullable(),
  maps_url: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
  visibility: z.enum(["Public", "Private", "Password"]).default("Public"),
  password: z.string().optional().nullable(),
});

export const updateEventSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  type: z
    .enum([
      "Wedding",
      "Birthday",
      "Graduation",
      "Seminar",
      "Corporate",
      "Community",
      "School",
      "Government",
      "Other",
    ])
    .optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  timezone: z.string().optional(),
  location: z.string().optional().nullable(),
  maps_url: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
  visibility: z.enum(["Public", "Private", "Password"]).optional(),
  password: z.string().optional().nullable(),
  status: z.enum(["Draft", "Published", "Archived"]).optional(),
  settings: z
    .object({
      allow_rsvp: z.boolean().optional(),
      allow_guest_book: z.boolean().optional(),
      allow_gallery: z.boolean().optional(),
      allow_music: z.boolean().optional(),
      allow_countdown: z.boolean().optional(),
      allow_gift: z.boolean().optional(),
      allow_qr_code: z.boolean().optional(),
      allow_story: z.boolean().optional(),
      allow_comments: z.boolean().optional(),
      color_palette: z.string().optional(),
      typo_pair: z.string().optional(),
      hero_layout: z.string().optional(),
      gallery_layout: z.string().optional(),
      section_style: z.string().optional(),
      divider_style: z.string().optional(),
      story_timeline: z.any().optional(),
      gift_accounts: z.any().optional(),
      gift_address: z.string().optional(),
      gift_methods: z.any().optional(),
    })
    .optional(),
});

// Helper type matching public.events DB schema
export interface DbEvent {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  status: "Draft" | "Published" | "Archived";
  visibility: "Public" | "Private" | "Password";
  password?: string | null;
  timezone: string;
  location: string | null;
  maps_url: string | null;
  cover_image: string | null;
  theme_color: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_paid: boolean;
  paid_at: string | null;
  event_settings?: {
    allow_rsvp: boolean;
    allow_guest_book: boolean;
    allow_gallery: boolean;
    allow_music: boolean;
    allow_countdown: boolean;
    allow_gift: boolean;
    allow_qr_code: boolean;
    allow_story: boolean;
    allow_comments: boolean;
    color_palette?: string;
    typo_pair?: string;
    hero_layout?: string;
    gallery_layout?: string;
    section_style?: string;
    divider_style?: string;
    story_timeline?: any;
    gift_accounts?: any;
    gift_address?: string;
    gift_methods?: any[];
  };
  event_statistics?: {
    views: number;
    unique_visitors: number;
    guest_count: number;
    rsvp_count: number;
    attendance_count: number;
    share_count: number;
    bookmark_count: number;
  };
}

// 1. Fetch paginated, filtered, and sorted events (only those created by current user)
export const getEvents = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(
    async ({
      data,
    }: {
      data: {
        search?: string;
        statusFilter?: string;
        typeFilter?: string;
        visibilityFilter?: string;
        sortBy?: string;
        page?: number;
        limit?: number;
      };
    }) => {
      const user = await requireUserSession();
      const supabase = getSupabaseServerClient();

      const {
        search = "",
        statusFilter = "All",
        typeFilter = "All",
        visibilityFilter = "All",
        sortBy = "newest",
        page = 1,
        limit = 10,
      } = data;

      const offset = (page - 1) * limit;

      let query = supabase
        .from("events")
        .select("*, event_settings(*), event_statistics(*)", { count: "exact" })
        .eq("created_by", user.id)
        .is("deleted_at", null);

      // Apply Search
      if (search.trim()) {
        query = query.or(
          `name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`,
        );
      }

      // Apply Status Filter
      if (statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }

      // Apply Type Filter
      if (typeFilter !== "All") {
        query = query.eq("type", typeFilter);
      }

      // Apply Visibility Filter
      if (visibilityFilter !== "All") {
        query = query.eq("visibility", visibilityFilter);
      }

      // Apply Sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sortBy === "event_date") {
        query = query.order("start_date", { ascending: true });
      } else if (sortBy === "alphabetical") {
        query = query.order("name", { ascending: true });
      }

      const { data: dbData, count, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error("Supabase error fetching events:", error);
        throw new Error(error.message);
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      // Perform sorting in memory for relation-based sorts which supabase doesn't support nested ordering natively easily
      const sortedData = (dbData as DbEvent[]) || [];
      if (sortBy === "most_guests") {
        sortedData.sort(
          (a, b) => (b.event_statistics?.guest_count || 0) - (a.event_statistics?.guest_count || 0),
        );
      } else if (sortBy === "most_views") {
        sortedData.sort(
          (a, b) => (b.event_statistics?.views || 0) - (a.event_statistics?.views || 0),
        );
      } else if (sortBy === "most_rsvp") {
        sortedData.sort(
          (a, b) => (b.event_statistics?.rsvp_count || 0) - (a.event_statistics?.rsvp_count || 0),
        );
      }

      return {
        data: sortedData,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      };
    },
  );

// 2. Fetch Detailed Event by ID (validated ownership)
export const getEventById = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("*, event_settings(*), event_statistics(*)")
      .eq("id", id)
      .eq("created_by", user.id)
      .is("deleted_at", null)
      .single();

    if (eventErr) {
      throw new Error(eventErr.message);
    }

    return event as DbEvent;
  });

// 3. Create Event (Auto triggers settings & stats table creation, assigns created_by)
export const createEvent = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: unknown }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const validated = createEventSchema.parse(data);

    const { data: dbData, error } = await supabase
      .from("events")
      .insert([
        {
          ...validated,
          created_by: user.id,
          status: "Draft", // Draft by default
          published_at: null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: dbData as DbEvent };
  });

// 4. Update Event and Event Settings
export const updateEvent = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: unknown }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const validated = updateEventSchema.parse(data);
    const { id, settings, ...eventUpdates } = validated;

    // Verify ownership first
    const { data: eventCheck, error: checkErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (checkErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    // 1. Update events table if there are changes
    if (Object.keys(eventUpdates).length > 0) {
      const { error: eventErr } = await supabase
        .from("events")
        .update(eventUpdates)
        .eq("id", id)
        .eq("created_by", user.id);
      if (eventErr) throw new Error(eventErr.message);
    }

    // 2. Update event_settings table if settings are provided
    if (settings && Object.keys(settings).length > 0) {
      const { error: settingsErr } = await supabase
        .from("event_settings")
        .update(settings)
        .eq("event_id", id);
      if (settingsErr) throw new Error(settingsErr.message);
    }

    return { success: true };
  });

// 5. Soft Delete Event
export const deleteEvent = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// 6. Publish Event
export const publishEvent = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("events")
      .update({
        status: "Published",
        published_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// 7. Archive Event
export const archiveEvent = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("events")
      .update({ status: "Archived" })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// 8. Duplicate Event (Duplicates Event + settings)
export const duplicateEvent = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Fetch original event
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();
    if (eventErr) throw new Error(eventErr.message);

    // Fetch original settings
    const { data: settings, error: settingsErr } = await supabase
      .from("event_settings")
      .select("*")
      .eq("event_id", id)
      .single();
    if (settingsErr) throw new Error(settingsErr.message);

    const randSuffix = Math.floor(Math.random() * 10000);
    const newSlug = `${event.slug}-copy-${randSuffix}`;
    const newName = `${event.name} (Copy)`;

    // Insert duplicated event (trigger automatically creates blank settings & statistics)
    const { data: duplicated, error: dupErr } = await supabase
      .from("events")
      .insert([
        {
          name: newName,
          slug: newSlug,
          description: event.description,
          type: event.type,
          status: "Draft", // New duplicate starts as draft
          visibility: event.visibility,
          password: event.password,
          timezone: event.timezone,
          location: event.location,
          maps_url: event.maps_url,
          cover_image: event.cover_image,
          theme_color: event.theme_color,
          start_date: event.start_date,
          end_date: event.end_date,
          start_time: event.start_time,
          end_time: event.end_time,
          published_at: null,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (dupErr) throw new Error(dupErr.message);

    // Copy settings over to newly created setting row
    if (settings) {
      const { error: settingsCopyErr } = await supabase
        .from("event_settings")
        .update({
          allow_rsvp: settings.allow_rsvp,
          allow_guest_book: settings.allow_guest_book,
          allow_gallery: settings.allow_gallery,
          allow_music: settings.allow_music,
          allow_countdown: settings.allow_countdown,
          allow_gift: settings.allow_gift,
          allow_qr_code: settings.allow_qr_code,
          allow_story: settings.allow_story,
          allow_comments: settings.allow_comments,
          color_palette: settings.color_palette,
          typo_pair: settings.typo_pair,
          hero_layout: settings.hero_layout,
          gallery_layout: settings.gallery_layout,
          section_style: settings.section_style,
          divider_style: settings.divider_style,
          story_timeline: settings.story_timeline,
          gift_accounts: settings.gift_accounts,
          gift_address: settings.gift_address,
          gift_methods: settings.gift_methods,
        })
        .eq("event_id", duplicated.id);
      if (settingsCopyErr) throw new Error(settingsCopyErr.message);
    }

    return { success: true, data: duplicated as DbEvent };
  });

export function formatLocation(locationStr: string | null | undefined): string {
  if (!locationStr) return "";
  try {
    const data = JSON.parse(locationStr);
    if (typeof data !== "object" || data === null) {
      return locationStr;
    }

    const venue = data.venueName || data.venue_name || "";
    const addr = data.addressDetail || data.address_detail || "";
    const vil = data.village || "";

    // Older manual fields for backward compatibility
    const rtRw = data.rt_rw || data.rtRw ? `RT/RW ${data.rt_rw || data.rtRw}` : null;
    const bld = data.building || "";
    const hNo =
      data.house_number || data.houseNumber ? `No. ${data.house_number || data.houseNumber}` : null;
    const apt = data.apartment ? `Apt ${data.apartment}` : null;
    const cplx = data.complex || "";

    const details = [venue, addr, rtRw, bld, hNo, apt, cplx, vil ? `Kel. ${vil}` : null]
      .filter(Boolean)
      .join(" ");

    const region = [data.district, data.city, data.province, data.country]
      .filter(Boolean)
      .join(", ");

    if (!details && !region) return locationStr;
    if (!details) return region;
    if (!region) return details;
    return `${details}, ${region}`;
  } catch {
    return locationStr;
  }
}

// 9. Fetch Published Event & Guest context by invitation slug
export const getPublicEventByInvitationSlug = createServerFn({ method: "GET" })
  .validator(z.string())
  .handler(async ({ data: invitationSlug }) => {
    const supabase = getSupabaseServerClient();

    // Fetch invitation row by slug
    const { data: invite, error: inviteErr } = await supabase
      .from("guest_invitations")
      .select("guest_id")
      .eq("slug", invitationSlug)
      .single();

    if (inviteErr || !invite) {
      throw new Error("Undangan tidak ditemukan.");
    }

    // Fetch guest details
    const { data: guest, error: guestErr } = await supabase
      .from("guests")
      .select("id, event_id, name, party_size, email, phone")
      .eq("id", invite.guest_id)
      .is("deleted_at", null)
      .single();

    if (guestErr || !guest) {
      throw new Error("Tamu tidak terdaftar.");
    }

    // Fetch published event & settings
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("*, event_settings(*)")
      .eq("id", guest.event_id)
      .eq("status", "Published")
      .is("deleted_at", null)
      .single();

    if (eventErr || !event) {
      throw new Error("Acara belum dipublikasikan atau tidak aktif.");
    }

    return {
      event: event as DbEvent,
      guest,
    };
  });
