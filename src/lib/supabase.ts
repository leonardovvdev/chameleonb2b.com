import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

const signOutOriginal = supabase.auth.signOut.bind(supabase.auth);
supabase.auth.signOut = async (...args) => {
  console.trace("signOut llamado desde:");
  return signOutOriginal(...args);
};