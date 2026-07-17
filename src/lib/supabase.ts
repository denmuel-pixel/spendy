import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment."
      );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Upload receipt image using direct fetch (bypasses supabase-js auth issues)
 */
export async function uploadReceiptImageDirect(
  file: File,
  userId: string
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/receipts/${fileName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: buffer,
      }
    );

    if (!res.ok) {
      console.error("Upload failed:", await res.text());
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/receipts/${fileName}`;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

/**
 * Upload receipt image to Supabase Storage
 */
export async function uploadReceiptImage(
  file: File,
  userId: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(fileName, file);

  if (error) {
    console.error("Supabase upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(data.path);

  return publicUrl;
}
