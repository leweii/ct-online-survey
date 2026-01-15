import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabaseInstance: SupabaseClient<Database> | null = null;

export const supabase = {
  from: (table: string) => {
    if (!supabaseInstance) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
      }
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance.from(table);
  },
};
