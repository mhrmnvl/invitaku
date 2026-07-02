import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, requireUserSession } from "./auth-server";

// Validation schemas
export const createGuestSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  party_size: z.number().int().positive().default(1),
  segment_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]), // Tag IDs or names
});

export const updateGuestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  party_size: z.number().int().positive().optional(),
  segment_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional(), // Draft, Invited, RSVP'd, Checked In, Completed
  tags: z.array(z.string()).optional(),
});

// Helper interfaces matching DB schema
export interface DbSegment {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

export interface DbTag {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

export interface DbInvitation {
  guest_id: string;
  invitation_code: string;
  slug: string;
  token: string;
  sent_at: string | null;
  opened_at: string | null;
  delivery_status: "Draft" | "Queued" | "Sending" | "Sent" | "Viewed" | "Failed";
  view_count: number;
  last_reminder_at: string | null;
}

export interface DbRsvp {
  guest_id: string;
  status: "Pending" | "Attending" | "Declined";
  party_size: number;
  response_message: string | null;
  responded_at: string | null;
}

export interface DbActivity {
  id: string;
  guest_id: string;
  timestamp: string;
  actor: string;
  description: string;
}

export interface DbNote {
  id: string;
  guest_id: string;
  note: string;
  created_at: string;
  created_by: string | null;
}

export interface DbGuest {
  id: string;
  event_id: string;
  segment_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  party_size: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relations
  guest_segments?: DbSegment | null;
  guest_invitations?: DbInvitation | null;
  guest_rsvps?: DbRsvp | null;
  guest_tag_junction?: Array<{ guest_tags: DbTag }> | null;
  guest_activities?: DbActivity[] | null;
  guest_notes?: DbNote[] | null;
}

// 1. Get Paginated and Filtered Guests
export const getGuests = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(
    async ({
      data,
    }: {
      data: {
        eventId: string;
        search?: string;
        rsvpStatus?: string; // All, Pending, Attending, Declined
        invitationStatus?: string; // All, Draft, Queued, Sending, Sent, Viewed, Failed
        attendance?: string; // All, Checked In, Not Checked In
        segmentId?: string; // All, or specific UUID
        sortBy?: string; // newest, oldest, name, rsvp_date, invitation_sent
        page?: number;
        limit?: number;
      };
    }) => {
      const user = await requireUserSession();
      const supabase = getSupabaseServerClient();

      const {
        eventId,
        search = "",
        rsvpStatus = "All",
        invitationStatus = "All",
        attendance = "All",
        segmentId = "All",
        sortBy = "newest",
        page = 1,
        limit = 10,
      } = data;

      // Verify event ownership first
      const { data: eventCheck, error: eventErr } = await supabase
        .from("events")
        .select("id")
        .eq("id", eventId)
        .eq("created_by", user.id)
        .single();

      if (eventErr || !eventCheck) {
        throw new Error("Akses ditolak atau acara tidak ditemukan.");
      }

      const offset = (page - 1) * limit;

      // We select guest columns along with join relations
      let query = supabase
        .from("guests")
        .select(
          "*, guest_segments(*), guest_invitations(*), guest_rsvps(*), guest_tag_junction(guest_tags(*))",
          { count: "exact" },
        )
        .eq("event_id", eventId)
        .is("deleted_at", null);

      // Apply Search
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply RSVP Status Filter
      if (rsvpStatus !== "All") {
        query = query.eq("guest_rsvps.status", rsvpStatus);
      }

      // Apply Invitation Delivery Status Filter
      if (invitationStatus !== "All") {
        query = query.eq("guest_invitations.delivery_status", invitationStatus);
      }

      // Apply Attendance Filter
      if (attendance !== "All") {
        if (attendance === "Checked In") {
          query = query.eq("status", "Checked In");
        } else {
          query = query.neq("status", "Checked In");
        }
      }

      // Apply Segment Filter
      if (segmentId !== "All") {
        query = query.eq("segment_id", segmentId);
      }

      // Apply Sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sortBy === "name") {
        query = query.order("name", { ascending: true });
      } else if (sortBy === "rsvp_date") {
        query = query.order("guest_rsvps(responded_at)", { ascending: false, nullsFirst: false });
      } else if (sortBy === "invitation_sent") {
        query = query.order("guest_invitations(sent_at)", { ascending: false, nullsFirst: false });
      }

      const { data: dbData, count, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error("Supabase error fetching guests:", error);
        throw new Error(error.message);
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      // Filter in-memory for cases where supabase doesn't filter nested relations correctly (e.g. guest_rsvps filters)
      let guestsData = (dbData as DbGuest[]) || [];
      if (rsvpStatus !== "All") {
        guestsData = guestsData.filter((g) => g.guest_rsvps && g.guest_rsvps.status === rsvpStatus);
      }
      if (invitationStatus !== "All") {
        guestsData = guestsData.filter(
          (g) => g.guest_invitations && g.guest_invitations.delivery_status === invitationStatus,
        );
      }

      return {
        data: guestsData,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      };
    },
  );

// 2. Fetch Detailed Guest By ID
export const getGuestById = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    const { data: guest, error } = await supabase
      .from("guests")
      .select(
        "*, guest_segments(*), guest_invitations(*), guest_rsvps(*), guest_tag_junction(guest_tags(*)), guest_activities(*), guest_notes(*)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Verify ownership via event check
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", guest.event_id)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    // Sort activities by timestamp descending
    if (guest?.guest_activities) {
      guest.guest_activities.sort(
        (a: DbActivity, b: DbActivity) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }

    // Sort notes by created_at descending
    if (guest?.guest_notes) {
      guest.guest_notes.sort(
        (a: DbNote, b: DbNote) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return guest as DbGuest;
  });

// Helper function to generate safe unique alphanumeric codes
function generateRandomCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to generate a unique invitation code
async function getUniqueInvitationCode(supabase: any): Promise<string> {
  let isUnique = false;
  let code = "";
  while (!isUnique) {
    code = `INV-${generateRandomCode(6)}`;
    const { data, error } = await supabase
      .from("guest_invitations")
      .select("invitation_code")
      .eq("invitation_code", code)
      .maybeSingle();
    if (!error && !data) {
      isUnique = true;
    }
  }
  return code;
}

// 3. Create Guest
export const createGuest = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: unknown }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const validated = createGuestSchema.parse(data);

    // Verify event ownership first
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", validated.event_id)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    // Start database operations in sequence
    const { data: guest, error: guestErr } = await supabase
      .from("guests")
      .insert({
        event_id: validated.event_id,
        segment_id: validated.segment_id,
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        party_size: validated.party_size,
        notes: validated.notes,
        status: "Draft",
      })
      .select()
      .single();

    if (guestErr) {
      throw new Error(guestErr.message);
    }

    // 1. Create default invitation record
    const inviteCode = await getUniqueInvitationCode(supabase);
    const slug = `${guest.id}`;
    const token = generateRandomCode(16);

    const { error: inviteErr } = await supabase.from("guest_invitations").insert({
      guest_id: guest.id,
      invitation_code: inviteCode,
      slug,
      token,
      delivery_status: "Draft",
      view_count: 0,
    });

    if (inviteErr) {
      // Cleanup created guest if invite fails
      await supabase.from("guests").delete().eq("id", guest.id);
      throw new Error(inviteErr.message);
    }

    // 2. Create default RSVP record
    await supabase.from("guest_rsvps").insert({
      guest_id: guest.id,
      status: "Pending",
      party_size: validated.party_size,
    });

    // 3. Create initial activity
    await supabase.from("guest_activities").insert({
      guest_id: guest.id,
      actor: "Admin",
      description: "Guest created and added to the invitation list.",
    });

    // 4. Map Tags
    if (validated.tags && validated.tags.length > 0) {
      const junctionInserts = validated.tags.map((tagId) => ({
        guest_id: guest.id,
        tag_id: tagId,
      }));
      await supabase.from("guest_tag_junction").insert(junctionInserts);
    }

    return guest;
  });

// 4. Update Guest
export const updateGuest = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: unknown }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const validated = updateGuestSchema.parse(data);

    const { data: currentGuest, error: fetchErr } = await supabase
      .from("guests")
      .select("status, event_id")
      .eq("id", validated.id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    // Verify ownership of the event
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", currentGuest.event_id)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    const updateFields: Record<string, any> = {};
    if (validated.name !== undefined) updateFields.name = validated.name;
    if (validated.phone !== undefined) updateFields.phone = validated.phone;
    if (validated.email !== undefined) updateFields.email = validated.email;
    if (validated.party_size !== undefined) updateFields.party_size = validated.party_size;
    if (validated.segment_id !== undefined) updateFields.segment_id = validated.segment_id;
    if (validated.notes !== undefined) updateFields.notes = validated.notes;
    if (validated.status !== undefined) updateFields.status = validated.status;
    updateFields.updated_at = new Date().toISOString();

    const { data: guest, error: updateErr } = await supabase
      .from("guests")
      .update(updateFields)
      .eq("id", validated.id)
      .select()
      .single();

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // Check-in state transition activity logging
    if (validated.status && validated.status !== currentGuest.status) {
      await supabase.from("guest_activities").insert({
        guest_id: validated.id,
        actor: "Admin",
        description: `Guest status updated to ${validated.status}.`,
      });

      // Sync RSVP status if status goes to Checked In or RSVP Submitted
      if (validated.status === "Checked In") {
        await supabase
          .from("guest_rsvps")
          .update({ status: "Attending", responded_at: new Date().toISOString() })
          .eq("guest_id", validated.id);
      }
    }

    // Sync Tags if provided
    if (validated.tags !== undefined) {
      // Remove old tags
      await supabase.from("guest_tag_junction").delete().eq("guest_id", validated.id);

      // Insert new tags
      if (validated.tags.length > 0) {
        const junctionInserts = validated.tags.map((tagId) => ({
          guest_id: validated.id,
          tag_id: tagId,
        }));
        await supabase.from("guest_tag_junction").insert(junctionInserts);
      }
    }

    return guest;
  });

// 5. Soft Delete Guest
export const deleteGuest = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: id }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Fetch guest to verify event ownership
    const { data: currentGuest, error: fetchErr } = await supabase
      .from("guests")
      .select("event_id")
      .eq("id", id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", currentGuest.event_id)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    const { data: deletedData, error } = await supabase
      .from("guests")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return deletedData;
  });

// 6. Bulk Actions APIs
export const bulkDeleteGuests = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: ids }: { data: string[] }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    if (!ids || ids.length === 0) return { success: true };

    // Fetch guests to verify event ownership
    const { data: guests, error: fetchErr } = await supabase
      .from("guests")
      .select("event_id")
      .in("id", ids);
    if (fetchErr || !guests || guests.length === 0) throw new Error("Tamu tidak ditemukan.");

    const eventIds = Array.from(new Set(guests.map((g) => g.event_id)));
    const { data: eventChecks, error: checkErr } = await supabase
      .from("events")
      .select("id")
      .in("id", eventIds)
      .eq("created_by", user.id);

    if (checkErr || !eventChecks || eventChecks.length !== eventIds.length) {
      throw new Error("Akses ditolak atau beberapa acara tidak ditemukan.");
    }

    const { error } = await supabase
      .from("guests")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

export const bulkAssignSegment = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: { ids: string[]; segmentId: string | null } }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    if (!data.ids || data.ids.length === 0) return { success: true };

    // Fetch guests to verify event ownership
    const { data: guests, error: fetchErr } = await supabase
      .from("guests")
      .select("event_id")
      .in("id", data.ids);
    if (fetchErr || !guests || guests.length === 0) throw new Error("Tamu tidak ditemukan.");

    const eventIds = Array.from(new Set(guests.map((g) => g.event_id)));
    const { data: eventChecks, error: checkErr } = await supabase
      .from("events")
      .select("id")
      .in("id", eventIds)
      .eq("created_by", user.id);

    if (checkErr || !eventChecks || eventChecks.length !== eventIds.length) {
      throw new Error("Akses ditolak atau beberapa acara tidak ditemukan.");
    }

    // Verify segment belongs to the same event if segmentId is not null
    if (data.segmentId) {
      const { data: segmentCheck } = await supabase
        .from("guest_segments")
        .select("event_id")
        .eq("id", data.segmentId)
        .single();
      if (!segmentCheck || !eventIds.includes(segmentCheck.event_id)) {
        throw new Error("Segmen tidak cocok dengan acara.");
      }
    }

    const { error } = await supabase
      .from("guests")
      .update({ segment_id: data.segmentId, updated_at: new Date().toISOString() })
      .in("id", data.ids);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

export const bulkSendInvitations = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data: ids }: { data: string[] }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    if (!ids || ids.length === 0) return { success: true };

    // Fetch guests to verify event ownership
    const { data: guests, error: fetchErr } = await supabase
      .from("guests")
      .select("event_id")
      .in("id", ids);
    if (fetchErr || !guests || guests.length === 0) throw new Error("Tamu tidak ditemukan.");

    const eventIds = Array.from(new Set(guests.map((g) => g.event_id)));
    const { data: eventChecks, error: checkErr } = await supabase
      .from("events")
      .select("id")
      .in("id", eventIds)
      .eq("created_by", user.id);

    if (checkErr || !eventChecks || eventChecks.length !== eventIds.length) {
      throw new Error("Akses ditolak atau beberapa acara tidak ditemukan.");
    }

    // 1. Update delivery status to Sent
    const { error } = await supabase
      .from("guest_invitations")
      .update({ delivery_status: "Sent", sent_at: new Date().toISOString() })
      .in("guest_id", ids);

    if (error) {
      throw new Error(error.message);
    }

    // 2. Log activity for each guest
    const activities = ids.map((id) => ({
      guest_id: id,
      actor: "Admin",
      description: "Invitation sent to guest.",
    }));
    await supabase.from("guest_activities").insert(activities);

    // 3. Update guest status to Invited
    await supabase.from("guests").update({ status: "Invited" }).in("id", ids);

    return { success: true };
  });

// 7. Segments CRUD
export const getSegments = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(async ({ data: eventId }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Verify event ownership
    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();
    if (!eventCheck) throw new Error("Akses ditolak atau acara tidak ditemukan.");

    const { data, error } = await supabase
      .from("guest_segments")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data as DbSegment[];
  });

export const createSegment = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: { event_id: string; name: string } }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Verify event ownership
    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", data.event_id)
      .eq("created_by", user.id)
      .single();
    if (!eventCheck) throw new Error("Akses ditolak atau acara tidak ditemukan.");

    const { data: segment, error } = await supabase
      .from("guest_segments")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return segment as DbSegment;
  });

// 8. Tags CRUD
export const getTags = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(async ({ data: eventId }: { data: string }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Verify event ownership
    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();
    if (!eventCheck) throw new Error("Akses ditolak atau acara tidak ditemukan.");

    const { data, error } = await supabase
      .from("guest_tags")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data as DbTag[];
  });

export const createTag = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: { event_id: string; name: string } }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Verify event ownership
    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", data.event_id)
      .eq("created_by", user.id)
      .single();
    if (!eventCheck) throw new Error("Akses ditolak atau acara tidak ditemukan.");

    const { data: tag, error } = await supabase.from("guest_tags").insert(data).select().single();

    if (error) {
      throw new Error(error.message);
    }

    return tag as DbTag;
  });

// 9. Add Guest Note Activity
export const addGuestNote = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }: { data: { guest_id: string; note: string; created_by: string } }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Verify guest belongs to event owned by user
    const { data: guest } = await supabase
      .from("guests")
      .select("event_id")
      .eq("id", data.guest_id)
      .single();

    if (!guest) throw new Error("Tamu tidak ditemukan.");

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", guest.event_id)
      .eq("created_by", user.id)
      .single();

    if (!eventCheck) throw new Error("Akses ditolak.");

    const { data: dbNote, error } = await supabase
      .from("guest_notes")
      .insert({
        ...data,
        created_by: user.email || "Admin",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return dbNote as DbNote;
  });

// 10. Bulk Import Guests
export const importGuests = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(
    async ({
      data,
    }: {
      data: {
        eventId: string;
        guests: Array<{
          name: string;
          phone?: string | null;
          email?: string | null;
          segment?: string | null;
          party_size?: number;
          notes?: string | null;
        }>;
      };
    }) => {
      const user = await requireUserSession();
      const supabase = getSupabaseServerClient();
      const { eventId, guests } = data;

      // Verify event ownership
      const { data: eventCheck } = await supabase
        .from("events")
        .select("id")
        .eq("id", eventId)
        .eq("created_by", user.id)
        .single();
      if (!eventCheck) throw new Error("Akses ditolak atau acara tidak ditemukan.");

      // Get existing segments to resolve IDs or create new ones
      const existingSegments = await getSegments({ data: eventId });
      const segmentMap = new Map<string, string>();
      existingSegments.forEach((s) => segmentMap.set(s.name.toLowerCase(), s.id));

      // Resolve or create segments in database
      const resolvedGuests = [];
      for (const g of guests) {
        let segmentId: string | null = null;
        if (g.segment?.trim()) {
          const segName = g.segment.trim();
          const existingId = segmentMap.get(segName.toLowerCase());
          if (existingId) {
            segmentId = existingId;
          } else {
            // Create new segment
            try {
              const newSeg = await createSegment({ data: { event_id: eventId, name: segName } });
              segmentMap.set(segName.toLowerCase(), newSeg.id);
              segmentId = newSeg.id;
            } catch (e) {
              console.error("Failed to auto-create segment:", segName, e);
            }
          }
        }

        resolvedGuests.push({
          event_id: eventId,
          segment_id: segmentId,
          name: g.name.trim(),
          phone: g.phone?.trim() || null,
          email: g.email?.trim() || null,
          party_size: g.party_size || 1,
          notes: g.notes?.trim() || null,
          status: "Draft",
        });
      }

      // Insert guests in bulk
      const { data: insertedGuests, error: bulkErr } = await supabase
        .from("guests")
        .insert(resolvedGuests)
        .select();

      if (bulkErr) {
        throw new Error(bulkErr.message);
      }

      // Create invitations, RSVPs, and activities for all inserted guests
      const inviteInserts = [];
      const rsvpInserts = [];
      const activityInserts = [];

      for (const g of insertedGuests) {
        const inviteCode = `INV-${generateRandomCode(6)}`; // Generates unique invite code
        inviteInserts.push({
          guest_id: g.id,
          invitation_code: inviteCode,
          slug: `${g.id}`,
          token: generateRandomCode(16),
          delivery_status: "Draft",
          view_count: 0,
        });

        rsvpInserts.push({
          guest_id: g.id,
          status: "Pending",
          party_size: g.party_size,
        });

        activityInserts.push({
          guest_id: g.id,
          actor: "Admin",
          description: "Guest imported from spreadsheet list.",
        });
      }

      // Insert invitations and RSVPs in bulk chunks
      if (inviteInserts.length > 0) {
        await supabase.from("guest_invitations").insert(inviteInserts);
        await supabase.from("guest_rsvps").insert(rsvpInserts);
        await supabase.from("guest_activities").insert(activityInserts);
      }

      return { count: insertedGuests.length };
    },
  );

// 11. Fetch recent activities for an event (top 5)
export const getRecentActivities = createServerFn({ method: "GET" })
  .validator((eventId: unknown) => z.string().uuid().parse(eventId))
  .handler(async ({ data: eventId }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // Verify event ownership
    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();
    if (!eventCheck) throw new Error("Akses ditolak.");

    const { data, error } = await supabase
      .from("guest_activities")
      .select("*, guests!inner(name)")
      .eq("guests.event_id", eventId)
      .order("timestamp", { ascending: false })
      .range(0, 4);

    if (error) {
      console.error("Supabase error fetching recent activities:", error);
      throw new Error(error.message);
    }

    return data as Array<DbActivity & { guests: { name: string } }>;
  });

// 12. Submit Guest RSVP from public page
export const submitGuestRsvp = createServerFn({ method: "POST" })
  .validator(
    z.object({
      guestId: z.string().uuid(),
      status: z.enum(["Attending", "Declined"]),
      partySize: z.number().int().positive(),
      message: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { guestId, status, partySize, message } = data;

    // 1. Update RSVP
    const { error: rsvpErr } = await supabase
      .from("guest_rsvps")
      .update({
        status,
        party_size: partySize,
        response_message: message || null,
        responded_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId);

    if (rsvpErr) {
      throw new Error(`Gagal menyimpan RSVP: ${rsvpErr.message}`);
    }

    // 2. Update guest status
    await supabase
      .from("guests")
      .update({
        status: "RSVP Submitted",
      })
      .eq("id", guestId);

    // 3. Log activity
    const statusIndo = status === "Attending" ? "Hadir" : "Tidak Hadir";
    const activityDesc = `Tamu mengisi RSVP: ${statusIndo} (${partySize} orang).${message ? ` Pesan: "${message}"` : ""}`;
    await supabase.from("guest_activities").insert({
      guest_id: guestId,
      actor: "Guest",
      description: activityDesc,
    });

    return { success: true };
  });

// 13. Get wishes list for a public event
export const getPublicEventComments = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: eventId }) => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("guest_rsvps")
      .select("response_message, responded_at, guest_id, guests!inner(name, event_id)")
      .eq("guests.event_id", eventId)
      .not("response_message", "is", null)
      .order("responded_at", { ascending: false });

    if (error) {
      throw new Error(`Gagal memuat pesan wishes: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      name: row.guests?.name || "Tamu",
      message: row.response_message,
      timestamp: row.responded_at,
    }));
  });

// 14. Log public invitation view
export const logPublicInvitationView = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: invitationSlug }) => {
    const supabase = getSupabaseServerClient();

    // 1. Get invitation
    const { data: invite } = await supabase
      .from("guest_invitations")
      .select("guest_id, view_count")
      .eq("slug", invitationSlug)
      .single();

    if (!invite) return { success: false };

    // 2. Increment view count
    await supabase
      .from("guest_invitations")
      .update({
        view_count: (invite.view_count || 0) + 1,
        delivery_status: "Viewed",
      })
      .eq("slug", invitationSlug);

    // 3. Update guest status
    const { data: guest } = await supabase
      .from("guests")
      .select("status")
      .eq("id", invite.guest_id)
      .single();

    if (guest && ["Draft", "Invited"].includes(guest.status)) {
      await supabase.from("guests").update({ status: "Opened" }).eq("id", invite.guest_id);
    }

    // 4. Log activity
    await supabase.from("guest_activities").insert({
      guest_id: invite.guest_id,
      actor: "Guest",
      description: "Undangan dibuka oleh tamu.",
    });

    return { success: true };
  });
