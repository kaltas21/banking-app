import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.userType || session.user.userType !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = await params;

    // Get customer with all related data using raw SQL
    const customerQuery = `
      SELECT 
        c.*,
        (
          SELECT COALESCE(SUM(CAST(a.balance AS DECIMAL)), 0)
          FROM accounts a
          WHERE a.customer_id = c.customer_id
        ) AS total_balance,
        (
          SELECT COUNT(*)
          FROM accounts a
          WHERE a.customer_id = c.customer_id
        ) AS accounts_count,
        (
          SELECT COUNT(*)
          FROM loans l
          WHERE l.customer_id = c.customer_id
        ) AS loans_count
      FROM customers c
      WHERE c.customer_id = $1
    `;
    
    const customerResult = await pool.query(customerQuery, [customerId]);
    
    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    const customerData = customerResult.rows[0];

    // Get accounts for this customer using raw SQL
    const accountsQuery = `
      SELECT 
        account_id,
        customer_id,
        account_number,
        account_type,
        balance,
        status
      FROM accounts
      WHERE customer_id = $1
      ORDER BY account_id
    `;
    
    const accountsResult = await pool.query(accountsQuery, [customerId]);

    // Get loans for this customer using raw SQL
    const loansQuery = `
      SELECT 
        loan_id,
        customer_id,
        loan_amount,
        interest_rate,
        term_months,
        status,
        application_date,
        approved_by_employee_id
      FROM loans
      WHERE customer_id = $1
      ORDER BY application_date DESC
    `;
    
    const loansResult = await pool.query(loansQuery, [customerId]);

    // Get monthly transaction activity using raw SQL
    const monthlyActivityQuery = `
      WITH monthly_data AS (
        SELECT 
          DATE_TRUNC('month', t.transaction_date) AS month,
          SUM(CASE 
            WHEN t.to_account_id IN (SELECT account_id FROM accounts WHERE customer_id = $1) 
            THEN CAST(t.amount AS DECIMAL) 
            ELSE 0 
          END) AS total_in,
          SUM(CASE 
            WHEN t.from_account_id IN (SELECT account_id FROM accounts WHERE customer_id = $1) 
            THEN CAST(t.amount AS DECIMAL) 
            ELSE 0 
          END) AS total_out
        FROM transactions t
        WHERE 
          t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          AND (
            t.from_account_id IN (SELECT account_id FROM accounts WHERE customer_id = $1)
            OR t.to_account_id IN (SELECT account_id FROM accounts WHERE customer_id = $1)
          )
        GROUP BY DATE_TRUNC('month', t.transaction_date)
      )
      SELECT 
        TO_CHAR(month, 'Mon YYYY') AS month,
        COALESCE(total_in, 0) AS total_in,
        COALESCE(total_out, 0) AS total_out
      FROM monthly_data
      ORDER BY month DESC
      LIMIT 6
    `;
    
    const monthlyActivityResult = await pool.query(monthlyActivityQuery, [customerId]);

    // Get last transaction date using raw SQL
    const lastTransactionQuery = `
      SELECT MAX(transaction_date) AS last_transaction_date
      FROM transactions
      WHERE 
        from_account_id IN (SELECT account_id FROM accounts WHERE customer_id = $1)
        OR to_account_id IN (SELECT account_id FROM accounts WHERE customer_id = $1)
    `;
    
    const lastTransactionResult = await pool.query(lastTransactionQuery, [customerId]);

    // Calculate account age using raw SQL
    const accountAgeQuery = `
      SELECT 
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, MIN(created_at))) * 12 + 
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, MIN(created_at))) AS account_age_months
      FROM accounts
      WHERE customer_id = $1
    `;
    
    const accountAgeResult = await pool.query(accountAgeQuery, [customerId]);

    // Prepare customer object with calculated fields
    const customer = {
      ...customerData,
      last_transaction_date: lastTransactionResult.rows[0]?.last_transaction_date || new Date().toISOString(),
      account_age_months: accountAgeResult.rows[0]?.account_age_months || 0
    };

    return NextResponse.json({
      customer,
      accounts: accountsResult.rows,
      loans: loansResult.rows,
      monthlyActivity: monthlyActivityResult.rows.reverse()
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}