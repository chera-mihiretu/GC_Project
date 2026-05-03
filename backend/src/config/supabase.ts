import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export const VENDOR_DOCS_BUCKET = "vendor-documents";
export const VENDOR_PORTFOLIO_BUCKET = "vendor-portfolio";
