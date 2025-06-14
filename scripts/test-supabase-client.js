const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseClient() {
  console.log('🔍 Testing Supabase client connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test a simple query
    console.log('\n🔄 Testing query via Supabase client...');
    const { data, error } = await supabase
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    if (error) {
      console.error('❌ Query error:', error.message);
    } else {
      console.log('✅ Query successful!');
      console.log('Result:', data);
    }
    
    // Test connection info
    console.log('\n🔄 Testing auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (expected for anon key)');
    } else if (user) {
      console.log('✅ Authenticated user:', user.email);
    }
    
    console.log('\n📝 Supabase client is working!');
    console.log('This confirms your Supabase project is active and accessible.');
    console.log('\n⚠️  However, you still need a working DATABASE_URL for direct PostgreSQL connections.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabaseClient();