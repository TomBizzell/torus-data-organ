// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lecahcsrnyquowhmxwer.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlY2FoY3NybnlxdW93aG14d2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNDc2MTQsImV4cCI6MjA1NDYyMzYxNH0.idjB3qiJUjjWCS7AOI-qSK3YXwqppXArtlg6wm3K0Xo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);