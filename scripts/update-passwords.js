const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

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
    const customerResult = await pool.query(
      'UPDATE Customers SET password = $1',
      [customerHash]
    );
    console.log(`Updated ${customerResult.rowCount} customer passwords`);

    // Update all employee passwords
    const employeeResult = await pool.query(
      'UPDATE Employees SET password = $1',
      [employeeHash]
    );
    console.log(`Updated ${employeeResult.rowCount} employee passwords`);

    // Show some sample users
    console.log('\n--- Sample Customer Logins ---');
    const sampleCustomers = await pool.query(
      'SELECT email FROM Customers LIMIT 3'
    );
    sampleCustomers.rows.forEach(customer => {
      console.log(`Email: ${customer.email}`);
      console.log(`Password: ${testPasswords.customers}`);
      console.log('---');
    });

    console.log('\n--- Sample Employee Logins ---');
    const sampleEmployees = await pool.query(
      'SELECT email, role FROM Employees LIMIT 3'
    );
    sampleEmployees.rows.forEach(employee => {
      console.log(`Email: ${employee.email}`);
      console.log(`Role: ${employee.role}`);
      console.log(`Password: ${testPasswords.employees}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords();