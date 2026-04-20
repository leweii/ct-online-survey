// import { createClient, SupabaseClient } from "@supabase/supabase-js";
// import type { Database } from "@/types/database";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// let supabaseInstance: SupabaseClient<Database> | null = null;

// To be replaced with AWS DynamoDB client
export const supabase = {
  from: (table: string) => {
    throw new Error("Supabase has been migrated to AWS DynamoDB. Please use the appropriate AWS client instead.");
  },
};
