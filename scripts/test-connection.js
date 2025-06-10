const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...\n');

    // First, let's check what tables exist
    const { data: tables, error: tableError } = await supabase
      .rpc('get_tables', {});
    
    if (!tableError && tables) {
      console.log('Available tables:', tables);
    }

    // Test customer with email kblase0@dyndns.org (try lowercase)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', 'kblase0@dyndns.org')
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      
      // Try with uppercase
      const { data: customerUpper, error: customerUpperError } = await supabase
        .from('Customers')
        .select('*')
        .eq('email', 'kblase0@dyndns.org')
        .single();
        
      if (!customerUpperError && customerUpper) {
        customer = customerUpper;
      }
    }
    
    if (customer) {
      console.log('Found customer:');
      console.log('Email:', customer.email);
      console.log('Name:', customer.first_name, customer.last_name);
      console.log('Password in DB:', customer.password);
      console.log('\nTo login as this customer:');
      console.log('Email: kblase0@dyndns.org');
      console.log('Password: dE6>GY*7Q\\r/=');
      console.log('User Type: Customer');
    }

    console.log('\n--- Testing Employee Login ---');
    
    // Get sample employees (try lowercase)
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('email, first_name, last_name, role, password')
      .limit(3);

    if (empError) {
      console.error('Error fetching employees:', empError);
    } else if (employees) {
      console.log('\nSample employee accounts:');
      employees.forEach(emp => {
        console.log(`\nEmail: ${emp.email}`);
        console.log(`Name: ${emp.first_name} ${emp.last_name}`);
        console.log(`Role: ${emp.role}`);
        console.log(`Password in DB: ${emp.password}`);
      });
    }

  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();