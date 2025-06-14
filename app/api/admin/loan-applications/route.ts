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

    // Get pending loan applications with customer details and financial metrics
    const loansWithMetricsQuery = `
      WITH customer_balances AS (
        SELECT 
          c.customer_id,
          COALESCE(SUM(a.balance), 0) as total_balance
        FROM customers c
        LEFT JOIN accounts a ON c.customer_id = a.customer_id
        GROUP BY c.customer_id
      ),
      customer_transactions AS (
        SELECT 
          a.customer_id,
          AVG(t.amount) as avg_transaction_amount,
          COUNT(t.transaction_id) as transaction_count
        FROM accounts a
        LEFT JOIN transactions t ON (a.account_id = t.from_account_id OR a.account_id = t.to_account_id)
        GROUP BY a.customer_id
      ),
      active_loans AS (
        SELECT 
          customer_id,
          COUNT(*) as active_loans_count
        FROM loans
        WHERE status = 'Approved'
        GROUP BY customer_id
      ),
      account_ages AS (
        SELECT 
          customer_id,
          EXTRACT(DAY FROM NOW() - MIN(account_id::timestamp)) as account_age_days
        FROM accounts
        GROUP BY customer_id
      )
      SELECT 
        l.loan_id,
        l.customer_id,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        l.loan_amount,
        l.interest_rate,
        l.term_months,
        l.status,
        l.application_date,
        cb.total_balance::numeric,
        COALESCE(aa.account_age_days, 90)::int as account_age_days,
        COALESCE(al.active_loans_count, 0)::int as active_loans_count,
        COALESCE(ct.avg_transaction_amount, 0)::numeric as average_transaction_amount
      FROM loans l
      INNER JOIN customers c ON l.customer_id = c.customer_id
      LEFT JOIN customer_balances cb ON l.customer_id = cb.customer_id
      LEFT JOIN customer_transactions ct ON l.customer_id = ct.customer_id
      LEFT JOIN active_loans al ON l.customer_id = al.customer_id
      LEFT JOIN account_ages aa ON l.customer_id = aa.customer_id
      WHERE l.status = 'Pending'
      ORDER BY l.application_date ASC
    `;
    const loansWithMetricsResult = await client.query(loansWithMetricsQuery);
    const loansWithMetrics = loansWithMetricsResult.rows;

    // Format the response
    const applicationsWithMetrics = loansWithMetrics.map(loan => ({
      loan_id: loan.loan_id,
      customer_id: loan.customer_id,
      customer_name: loan.customer_name,
      customer_email: loan.customer_email,
      loan_amount: loan.loan_amount,
      interest_rate: loan.interest_rate,
      term_months: loan.term_months,
      status: loan.status,
      application_date: loan.application_date,
      total_balance: parseFloat(loan.total_balance || 0),
      account_age_days: loan.account_age_days,
      active_loans_count: loan.active_loans_count,
      average_transaction_amount: parseFloat(loan.average_transaction_amount || 0)
    }));

    return NextResponse.json(applicationsWithMetrics);
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan applications' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}