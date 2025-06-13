
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ldcipixxhnrepgkyzmno.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkY2lwaXh4aG5yZXBna3l6bW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODc5ODAsImV4cCI6MjA2NTA2Mzk4MH0.DI6yuJwesNPoXTnB5aMDLNOVjPnMbN69kD7nCxFmiTI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
