import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://hsevayegssdpymelkybh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZXZheWVnc3NkcHltZWxreWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTk5MDMsImV4cCI6MjA4OTU5NTkwM30.pXn_7sTRN-X0bwhrQlMbF8pGG6Jl9-oBrNrNicKutGw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
