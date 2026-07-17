import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We use WebAuthn, not Supabase Auth
  },
});

/**
 * Upload receipt image to Supabase Storage
 */
export async function uploadReceiptImage(
  file: File,
  userId: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

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
