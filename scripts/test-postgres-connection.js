const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

console.log('Testing PostgreSQL connection...');
console.log('Connection string:', connectionString?.replace(/:[^:@]+@/, ':****@')); // Hide password

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  connect_timeout: 10,
});

async function testConnection() {
  try {
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✓ Connected successfully!');
    console.log('  Server time:', result[0].current_time);

    // Test customers table
    const customers = await sql`SELECT COUNT(*) as count FROM customers`;
    console.log('✓ Customers table accessible');
    console.log('  Total customers:', customers[0].count);

    // Test a simple query
    const testCustomer = await sql`
      SELECT customer_id, email 
      FROM customers 
      LIMIT 1
    `;
    console.log('✓ Sample query successful');
    if (testCustomer.length > 0) {
      console.log('  Sample customer:', testCustomer[0]);
    }

    // Close the connection
    await sql.end();
    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('\n✗ Connection failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();