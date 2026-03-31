import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbmglbnxkchwekatkrlr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wdc8NjEgJqfmH52FCRnWsw_qBVYTpbC'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
