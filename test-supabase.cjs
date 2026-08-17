
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL || 'x', process.env.VITE_SUPABASE_ANON_KEY || 'x');
supabase.from('audit_logs').select('*').limit(1).then(console.log).catch(console.error);

