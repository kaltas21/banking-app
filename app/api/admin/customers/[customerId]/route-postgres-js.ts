import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import postgres from 'postgres';

// Create a postgres.js connection
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require'
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

    // Get customer with all related data using postgres.js template literals
    const [customer] = await sql`
      SELECT 
        c.*,
        (
          SELECT COALESCE(SUM(a.balance::DECIMAL), 0)
          FROM accounts a
          WHERE a.customer_id = c.customer_id
        ) AS total_balance,
        (
          SELECT COUNT(*)::INT
          FROM accounts a
          WHERE a.customer_id = c.customer_id
        ) AS accounts_count,
        (
          SELECT COUNT(*)::INT
          FROM loans l
          WHERE l.customer_id = c.customer_id
        ) AS loans_count
      FROM customers c
      WHERE c.customer_id = ${customerId}
    `;
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get accounts for this customer
    const accounts = await sql`
      SELECT 
        account_id,
        customer_id,
        account_number,
        account_type,
        balance,
        status
      FROM accounts
      WHERE customer_id = ${customerId}
      ORDER BY account_id
    `;

    // Get loans for this customer
    const loans = await sql`
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
      WHERE customer_id = ${customerId}
      ORDER BY application_date DESC
    `;

    // Get monthly transaction activity
    const monthlyActivity = await sql`
      WITH monthly_data AS (
        SELECT 
          DATE_TRUNC('month', t.transaction_date) AS month,
          SUM(CASE 
            WHEN t.to_account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${customerId}) 
            THEN t.amount::DECIMAL 
            ELSE 0 
          END) AS total_in,
          SUM(CASE 
            WHEN t.from_account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${customerId}) 
            THEN t.amount::DECIMAL 
            ELSE 0 
          END) AS total_out
        FROM transactions t
        WHERE 
          t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          AND (
            t.from_account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${customerId})
            OR t.to_account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${customerId})
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

    // Get last transaction date
    const [lastTransaction] = await sql`
      SELECT MAX(transaction_date) AS last_transaction_date
      FROM transactions
      WHERE 
        from_account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${customerId})
        OR to_account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${customerId})
    `;

    // Calculate account age
    const [accountAge] = await sql`
      SELECT 
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, MIN(created_at))) * 12 + 
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, MIN(created_at))) AS account_age_months
      FROM accounts
      WHERE customer_id = ${customerId}
    `;

    // Prepare customer object with calculated fields
    const customerData = {
      ...customer,
      last_transaction_date: lastTransaction?.last_transaction_date || new Date().toISOString(),
      account_age_months: accountAge?.account_age_months || 0
    };

    return NextResponse.json({
      customer: customerData,
      accounts,
      loans,
      monthlyActivity: monthlyActivity.reverse()
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}