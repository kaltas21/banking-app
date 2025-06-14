const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function listUsers() {
  console.log('🔍 Listing users in database...');
  
  const certPath = path.join(__dirname, '..', 'certs', 'supabase-ca-2021.crt');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      ca: fs.readFileSync(certPath).toString()
    }
  });

  try {
    await client.connect();
    
    // List customers
    console.log('\n📊 Customers:');
    const customersResult = await client.query(`
      SELECT customer_id, email, first_name, last_name, password 
      FROM customers 
      ORDER BY customer_id 
      LIMIT 10
    `);
    
    if (customersResult.rows.length === 0) {
      console.log('  No customers found');
    } else {
      customersResult.rows.forEach(customer => {
        console.log(`  ID: ${customer.customer_id}, Email: ${customer.email}, Name: ${customer.first_name} ${customer.last_name}`);
        console.log(`    Password: ${customer.password}`);
      });
    }
    
    // List employees
    console.log('\n👥 Employees:');
    const employeesResult = await client.query(`
      SELECT employee_id, email, first_name, last_name, role, password 
      FROM employees 
      ORDER BY employee_id 
      LIMIT 10
    `);
    
    if (employeesResult.rows.length === 0) {
      console.log('  No employees found');
    } else {
      employeesResult.rows.forEach(employee => {
        console.log(`  ID: ${employee.employee_id}, Email: ${employee.email}, Name: ${employee.first_name} ${employee.last_name}, Role: ${employee.role}`);
        console.log(`    Password: ${employee.password}`);
      });
    }
    
    console.log('\n📝 Use one of these credentials to test authentication');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listUsers();