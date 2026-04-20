import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unexucxndxzsqbcqsbyo.supabase.co';
const supabaseAnonKey = 'sb_publishable_NBrSMbkxgSTZMUXD9WiPSQ_jbgFMXBf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
