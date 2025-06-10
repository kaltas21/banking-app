const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAPI() {
  console.log('Testing API queries...\n');
  
  // Test getting accounts for customer_id = 1
  console.log('1. Testing accounts query for customer_id = 1:');
  const { data: accounts, error: accountError } = await supabase
    .from('accounts')
    .select('account_id, account_number, account_type, balance, status')
    .eq('customer_id', 1)
    .order('account_type');
    
  if (accountError) {
    console.error('Account error:', accountError);
  } else {
    console.log('Accounts found:', accounts);
  }
  
  // Test transactions query
  console.log('\n2. Testing transactions query:');
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('*')
    .limit(5);
    
  if (transError) {
    console.error('Transaction error:', transError);
  } else {
    console.log('Transactions found:', transactions?.length || 0, 'records');
  }
  
  // Check if customer exists
  console.log('\n3. Checking if customer exists:');
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('customer_id, email')
    .eq('email', 'kblase0@dyndns.org')
    .single();
    
  if (customerError) {
    console.error('Customer error:', customerError);
  } else {
    console.log('Customer found:', customer);
  }
}

testAPI();