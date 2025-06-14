const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testAPILogic() {
  console.log('🔍 Testing API endpoint logic directly...');
  
  const certPath = path.join(__dirname, '..', 'certs', 'supabase-ca-2021.crt');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      ca: fs.readFileSync(certPath).toString()
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Simulate a customer session (using first customer from DB)
    const customerId = 1;
    
    // Test accounts query
    console.log('\n📊 Testing accounts query for customer ID:', customerId);
    const accountsQuery = 'SELECT * FROM accounts WHERE customer_id = $1 ORDER BY account_id';
    const accountsResult = await client.query(accountsQuery, [customerId]);
    
    console.log(`Found ${accountsResult.rows.length} accounts:`);
    accountsResult.rows.forEach(acc => {
      console.log(`  - ${acc.account_type} (${acc.account_number}): $${acc.balance} - Status: ${acc.status}`);
    });
    
    // Test transactions query
    console.log('\n📊 Testing transactions query...');
    const accountIds = accountsResult.rows.map(acc => acc.account_id);
    
    if (accountIds.length > 0) {
      const transactionsQuery = `
        SELECT 
          t.*,
          fa.account_number as from_account_number,
          ta.account_number as to_account_number
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
        LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
        WHERE t.from_account_id = ANY($1) OR t.to_account_id = ANY($1)
        ORDER BY t.transaction_date DESC
        LIMIT 5
      `;
      
      const transactionsResult = await client.query(transactionsQuery, [accountIds]);
      
      console.log(`Found ${transactionsResult.rows.length} recent transactions:`);
      transactionsResult.rows.forEach(tx => {
        console.log(`  - ${tx.transaction_type}: $${tx.amount} on ${tx.transaction_date}`);
      });
    } else {
      console.log('No accounts found, so no transactions to query');
    }
    
    // Check the actual error that might be happening
    console.log('\n🔍 Checking potential issues...');
    
    // Test if the SSL config might be the issue in the API routes
    const testClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await testClient.connect();
      console.log('✅ Connection with rejectUnauthorized: false also works');
      await testClient.end();
    } catch (err) {
      console.log('❌ Even rejectUnauthorized: false fails:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

testAPILogic();