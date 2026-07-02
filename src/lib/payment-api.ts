import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, requireUserSession } from "./auth-server";

// Interface untuk order dari database
export interface EventOrder {
  id: string;
  event_id: string;
  user_id: string;
  status: "pending" | "submitted" | "paid" | "failed";
  payment_method: string | null;
  sender_name: string | null;
  notes: string | null;
  proof_url: string | null;
  amount: number;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// Interface untuk payment_configs
export interface PaymentConfig {
  id: string;
  event_pass_price: number;
  currency: string;
  instructions_header: string;
  confirmation_note: string;
  support_contact: string | null;
  created_at: string;
  updated_at: string;
}

// Interface untuk payment_methods
export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  display_name: string;
  account_name: string | null;
  account_number: string | null;
  phone_number: string | null;
  merchant_name: string | null;
  qr_image_url: string | null;
  instructions: string | null;
  display_order: number;
  status: string;
  visibility: string;
  workspace_id: string | null;
  config: any;
  created_at: string;
  updated_at: string;
}

/**
 * Server function: Ambil konfigurasi global pembayaran
 */
/**
 * Helper to validate admin authorization
 */
async function requireAdminSession() {
  const user = await requireUserSession();
  const isAdmin =
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.is_admin === true ||
    user.email?.endsWith("@invitaku.com") ||
    user.email === "amara@kiranawedding.com"; // Development whitelist
  if (!isAdmin) {
    throw new Error("Akses ditolak. Anda bukan Administrator.");
  }
  return user;
}

/**
 * Server function: Ambil konfigurasi global pembayaran
 */
export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: config, error } = await supabase
    .from("payment_configs")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil konfigurasi pembayaran: ${error.message}`);
  }

  // Fallback jika database kosong
  if (!config) {
    return {
      id: "",
      event_pass_price: 99000,
      currency: "IDR",
      instructions_header:
        "Silakan lakukan transfer ke salah satu rekening di bawah, lalu isi konfirmasi transfer.",
      confirmation_note:
        "Mohon tunggu verifikasi admin maksimal 1x24 jam setelah mengirimkan konfirmasi.",
      support_contact: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as PaymentConfig;
  }

  return config as PaymentConfig;
});

/**
 * Server function: Simpan/update konfigurasi global pembayaran (Admin Only)
 */
export const savePaymentConfig = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      eventPassPrice: z.number().int().positive(),
      instructionsHeader: z.string().min(1),
      confirmationNote: z.string().min(1),
      supportContact: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const supabase = getSupabaseServerClient();
    const { id, eventPassPrice, instructionsHeader, confirmationNote, supportContact } = data;

    let result;
    if (id) {
      const { data: updated, error } = await supabase
        .from("payment_configs")
        .update({
          event_pass_price: eventPassPrice,
          instructions_header: instructionsHeader,
          confirmation_note: confirmationNote,
          support_contact: supportContact || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(`Gagal mengupdate konfigurasi: ${error.message}`);
      result = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("payment_configs")
        .insert({
          event_pass_price: eventPassPrice,
          instructions_header: instructionsHeader,
          confirmation_note: confirmationNote,
          support_contact: supportContact || null,
        })
        .select()
        .single();

      if (error) throw new Error(`Gagal menyimpan konfigurasi: ${error.message}`);
      result = inserted;
    }

    return { success: true, config: result as PaymentConfig };
  });

/**
 * Server function: Ambil semua metode pembayaran
 */
export const getPaymentMethods = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        adminOnly: z.boolean().default(false),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const adminOnly = data?.adminOnly ?? false;

    if (adminOnly) {
      await requireAdminSession();
    }

    const supabase = getSupabaseServerClient();
    let query = supabase.from("payment_methods").select("*");

    if (!adminOnly) {
      // Jika bukan admin, hanya ambil yang aktif
      query = query.eq("status", "active");
    }

    const { data: methods, error } = await query.order("display_order", { ascending: true });

    if (error) {
      throw new Error(`Gagal mengambil metode pembayaran: ${error.message}`);
    }

    return methods as PaymentMethod[];
  });

/**
 * Server function: Simpan/update metode pembayaran (Admin Only)
 */
export const savePaymentMethod = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      type: z.string(),
      provider: z.string(),
      displayName: z.string(),
      accountName: z.string().optional().nullable(),
      accountNumber: z.string().optional().nullable(),
      phoneNumber: z.string().optional().nullable(),
      merchantName: z.string().optional().nullable(),
      qrImageUrl: z.string().optional().nullable(),
      instructions: z.string().optional().nullable(),
      displayOrder: z.number().int().default(0),
      status: z.string().default("active"),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const supabase = getSupabaseServerClient();
    const {
      id,
      type,
      provider,
      displayName,
      accountName,
      accountNumber,
      phoneNumber,
      merchantName,
      qrImageUrl,
      instructions,
      displayOrder,
      status,
    } = data;

    const payload = {
      type,
      provider,
      display_name: displayName,
      account_name: accountName || null,
      account_number: accountNumber || null,
      phone_number: phoneNumber || null,
      merchant_name: merchantName || null,
      qr_image_url: qrImageUrl || null,
      instructions: instructions || null,
      display_order: displayOrder,
      status,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      const { data: updated, error } = await supabase
        .from("payment_methods")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(`Gagal mengupdate metode pembayaran: ${error.message}`);
      result = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("payment_methods")
        .insert({
          ...payload,
          visibility: "public",
          config: {},
        })
        .select()
        .single();

      if (error) throw new Error(`Gagal menambahkan metode pembayaran: ${error.message}`);
      result = inserted;
    }

    return { success: true, method: result as PaymentMethod };
  });

/**
 * Server function: Hapus metode pembayaran (Admin Only)
 */
export const deletePaymentMethod = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const supabase = getSupabaseServerClient();
    const { id } = data;

    const { error } = await supabase.from("payment_methods").delete().eq("id", id);

    if (error) {
      throw new Error(`Gagal menghapus metode pembayaran: ${error.message}`);
    }

    return { success: true };
  });

/**
 * Server function: Buat order manual untuk upgrade event dengan membaca harga dinamis (Owner Only)
 */
export const createManualOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      eventId: z.string().uuid(),
      userId: z.string().uuid(),
      paymentMethod: z.string().min(1),
      senderName: z.string().min(1),
      notes: z.string().optional().nullable(),
      proofUrl: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const { eventId, paymentMethod, senderName, notes, proofUrl } = data;

    // Verify event ownership
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    // Ambil harga terkonfigurasi dinamis
    const { data: config } = await supabase
      .from("payment_configs")
      .select("event_pass_price")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const price = config?.event_pass_price ?? 99000;

    // Simpan order manual baru
    const { data: newOrder, error: insertError } = await supabase
      .from("event_orders")
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: "submitted",
        payment_method: paymentMethod,
        sender_name: senderName,
        notes: notes || null,
        proof_url: proofUrl || null,
        amount: price,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Gagal menyimpan konfirmasi pembayaran: ${insertError.message}`);
    }

    return { success: true, order: newOrder };
  });

/**
 * Server function: Ambil order aktif milik satu event (Owner Only)
 */
export const getEventOrder = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const { eventId } = data;

    // Verify event ownership
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    const { data: order, error } = await supabase
      .from("event_orders")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal mengambil data order: ${error.message}`);
    }

    return { order: order as EventOrder | null };
  });

/**
 * Server function: Simulasikan persetujuan admin (Hanya untuk mode DEVELOPMENT)
 */
export const simulateAdminApproval = createServerFn({ method: "POST" })
  .validator(
    z.object({
      eventId: z.string().uuid(),
      orderId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const isDev =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test" ||
      (import.meta as any).env?.DEV;
    if (!isDev) {
      throw new Error("Persetujuan simulasi hanya diizinkan pada mode Development/Testing.");
    }

    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const { eventId, orderId } = data;

    // Verify event ownership for this simulation
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak.");
    }

    const now = new Date().toISOString();

    // 1. Update status order jadi 'paid'
    const { error: orderError } = await supabase
      .from("event_orders")
      .update({
        status: "paid",
        paid_at: now,
        updated_at: now,
      })
      .eq("id", orderId);

    if (orderError) {
      throw new Error(`Gagal memperbarui status order: ${orderError.message}`);
    }

    // 2. Update status event jadi is_paid = true
    const { error: eventError } = await supabase
      .from("events")
      .update({
        is_paid: true,
        paid_at: now,
        updated_at: now,
      })
      .eq("id", eventId);

    if (eventError) {
      throw new Error(`Gagal mengaktifkan event: ${eventError.message}`);
    }

    return { success: true };
  });
