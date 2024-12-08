import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://xnqchlzkjundhcjueycd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucWNobHpranVuZGhjanVleWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NjA3MjAsImV4cCI6MjA0ODIzNjcyMH0.z7jCUv6f28Fq5XML5P1iOCYwzg6EzWvp4nZnP_iTEQ0";
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
