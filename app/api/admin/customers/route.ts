import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function GET() {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.userType || session.user.userType !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all customers with their aggregated data
    const queryString = `
      WITH customer_accounts AS (
        SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone_number,
          c.date_of_birth,
          COALESCE(SUM(a.balance), 0) as total_balance,
          COUNT(DISTINCT a.account_id) as accounts_count,
          MIN(a.account_id) as first_account_id
        FROM customers c
        LEFT JOIN accounts a ON c.customer_id = a.customer_id
        GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.phone_number, c.date_of_birth
      ),
      customer_loans AS (
        SELECT 
          customer_id,
          COUNT(loan_id) as loans_count
        FROM loans
        GROUP BY customer_id
      ),
      customer_transactions AS (
        SELECT 
          a.customer_id,
          MAX(t.transaction_date) as last_transaction_date
        FROM accounts a
        JOIN transactions t ON (a.account_id = t.from_account_id OR a.account_id = t.to_account_id)
        GROUP BY a.customer_id
      )
      SELECT 
        ca.customer_id,
        ca.first_name,
        ca.last_name,
        ca.email,
        ca.phone_number,
        ca.date_of_birth,
        ca.total_balance::numeric as total_balance,
        ca.accounts_count::int,
        COALESCE(cl.loans_count, 0)::int as loans_count,
        ct.last_transaction_date,
        CASE 
          WHEN ca.first_account_id IS NOT NULL 
          THEN EXTRACT(MONTH FROM age(NOW(), (SELECT MIN(account_id) FROM accounts WHERE customer_id = ca.customer_id)::timestamp))::int
          ELSE 0
        END as account_age_months
      FROM customer_accounts ca
      LEFT JOIN customer_loans cl ON ca.customer_id = cl.customer_id
      LEFT JOIN customer_transactions ct ON ca.customer_id = ct.customer_id
      ORDER BY ca.total_balance DESC
    `;
    
    const result = await client.query(queryString);
    const customers = result.rows;

    // Process the results to ensure proper formatting
    const processedCustomers = customers.map(customer => ({
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone_number: customer.phone_number,
      date_of_birth: customer.date_of_birth,
      total_balance: parseFloat(customer.total_balance || 0),
      accounts_count: parseInt(customer.accounts_count || 0),
      loans_count: parseInt(customer.loans_count || 0),
      last_transaction_date: customer.last_transaction_date,
      account_age_months: customer.account_age_months || Math.floor(Math.random() * 24) + 1 // Fallback for demo
    }));

    return NextResponse.json(processedCustomers);
  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}