const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking Supabase tables...\n');
  
  // Try to fetch from different table name variations
  const tableNames = [
    'customers', 'Customers', 'CUSTOMERS',
    'employees', 'Employees', 'EMPLOYEES',
    'accounts', 'Accounts', 'ACCOUNTS',
    'transactions', 'Transactions', 'TRANSACTIONS',
    'loans', 'Loans', 'LOANS'
  ];
  
  for (const tableName of tableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✓ Table '${tableName}' exists`);
        if (data && data.length > 0) {
          console.log(`  Sample data:`, Object.keys(data[0]).join(', '));
        }
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  // Now try to get a specific customer
  console.log('\n--- Checking for specific customer ---');
  
  const { data: customer, error: customerError } = await supabase
    .from('customers')  // Try lowercase first
    .select('*')
    .eq('email', 'kblase0@dyndns.org')
    .maybeSingle();
    
  if (customerError) {
    console.log('Error with lowercase "customers":', customerError.message);
    
    // Try uppercase
    const { data: customerUpper, error: customerUpperError } = await supabase
      .from('Customers')
      .select('*')
      .eq('email', 'kblase0@dyndns.org')
      .maybeSingle();
      
    if (!customerUpperError && customerUpper) {
      console.log('\nFound customer in "Customers" table:');
      console.log('Email:', customerUpper.email);
      console.log('Password in DB:', customerUpper.password);
    } else if (customerUpperError) {
      console.log('Error with uppercase "Customers":', customerUpperError.message);
    }
  } else if (customer) {
    console.log('\nFound customer in "customers" table:');
    console.log('Email:', customer.email);
    console.log('Password in DB:', customer.password);
  }
}

checkTables();