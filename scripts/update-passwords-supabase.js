const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test passwords for demo purposes
const testPasswords = {
  customers: 'password123', // Simple password for all customers
  employees: 'admin123'     // Simple password for all employees
};

async function updatePasswords() {
  try {
    // Hash passwords
    const customerHash = await bcrypt.hash(testPasswords.customers, 10);
    const employeeHash = await bcrypt.hash(testPasswords.employees, 10);

    // Update all customer passwords
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .update({ password: customerHash })
      .select();
    
    if (customerError) throw customerError;
    console.log(`Updated ${customerData.length} customer passwords`);

    // Update all employee passwords
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .update({ password: employeeHash })
      .select();
    
    if (employeeError) throw employeeError;
    console.log(`Updated ${employeeData.length} employee passwords`);

    // Show some sample users
    console.log('\n--- Sample Customer Logins ---');
    const { data: sampleCustomers, error: customersError } = await supabase
      .from('customers')
      .select('email')
      .limit(3);
    
    if (customersError) throw customersError;
    
    sampleCustomers.forEach(customer => {
      console.log(`Email: ${customer.email}`);
      console.log(`Password: ${testPasswords.customers}`);
      console.log('---');
    });

    console.log('\n--- Sample Employee Logins ---');
    const { data: sampleEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('email, role')
      .limit(3);
    
    if (employeesError) throw employeesError;
    
    sampleEmployees.forEach(employee => {
      console.log(`Email: ${employee.email}`);
      console.log(`Role: ${employee.role}`);
      console.log(`Password: ${testPasswords.employees}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error updating passwords:', error);
  }
}

updatePasswords();