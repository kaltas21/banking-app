import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to execute raw SQL queries
export async function executeQuery(query: string, params?: any[]) {
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      query: query,
      params: params || []
    });
    
    if (error) throw error;
    return { rows: data || [] };
  } catch (error) {
    // If RPC doesn't exist, fall back to direct query
    const result = await supabaseAdmin.from('Customers').select('*').limit(1);
    throw error;
  }
}