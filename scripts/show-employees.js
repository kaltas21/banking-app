const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function showEmployees() {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('email, first_name, last_name, role, password')
    .in('role', ['Admin', 'Loan Officer'])
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Employee Login Credentials:\n');
  employees.forEach(emp => {
    console.log(`Name: ${emp.first_name} ${emp.last_name}`);
    console.log(`Email: ${emp.email}`);
    console.log(`Role: ${emp.role}`);
    console.log(`Password: ${emp.password}`);
    console.log('---');
  });
}

showEmployees();