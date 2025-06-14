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

    // Get all statistics in parallel
    const customerCountQuery = 'SELECT COUNT(*) as count FROM customers';
    const accountCountQuery = 'SELECT COUNT(*) as count FROM accounts';
    const depositSumQuery = 'SELECT COALESCE(SUM(balance), 0) as total FROM accounts';
    const pendingLoanCountQuery = 'SELECT COUNT(*) as count FROM loans WHERE status = $1';

    const [customerCountResult, accountCountResult, depositSumResult, pendingLoanCountResult] = await Promise.all([
      client.query(customerCountQuery),
      client.query(accountCountQuery),
      client.query(depositSumQuery),
      client.query(pendingLoanCountQuery, ['Pending'])
    ]);

    const customerCount = customerCountResult.rows;
    const accountCount = accountCountResult.rows;
    const depositSum = depositSumResult.rows;
    const pendingLoanCount = pendingLoanCountResult.rows;

    const totalCustomers = parseInt(customerCount[0].count);
    const totalAccounts = parseInt(accountCount[0].count);
    const totalDeposits = parseFloat(depositSum[0].total);
    const pendingLoans = parseInt(pendingLoanCount[0].count);

    // Get monthly transaction volume (last 12 months)
    const monthlyTransactionQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month
      ),
      monthly_volumes AS (
        SELECT 
          date_trunc('month', transaction_date) AS month,
          SUM(amount) AS volume
        FROM transactions
        WHERE transaction_date >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
        GROUP BY date_trunc('month', transaction_date)
      )
      SELECT 
        TO_CHAR(m.month, 'Mon YYYY') AS month,
        COALESCE(ROUND(mv.volume::numeric, 2), 0) AS volume
      FROM months m
      LEFT JOIN monthly_volumes mv ON m.month = mv.month
      ORDER BY m.month
    `;
    const monthlyTransactionResult = await client.query(monthlyTransactionQuery);
    const monthlyTransactionData = monthlyTransactionResult.rows;

    // Advanced Query 1: High-Value Customers with Approved Loans
    const highValueCustomersQuery = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        SUM(a.balance) AS total_balance
      FROM customers c
      INNER JOIN accounts a ON c.customer_id = a.customer_id
      WHERE EXISTS (
        SELECT 1 
        FROM loans l 
        WHERE l.customer_id = c.customer_id 
          AND l.status = 'Approved'
      )
      GROUP BY c.customer_id, c.first_name, c.last_name
      HAVING SUM(a.balance) > 75000
      ORDER BY total_balance DESC
      LIMIT 5
    `;
    const highValueCustomersResult = await client.query(highValueCustomersQuery);
    const highValueCustomers = highValueCustomersResult.rows;

    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      totalAccounts: totalAccounts || 0,
      totalDeposits: totalDeposits || 0,
      pendingLoans: pendingLoans || 0,
      monthlyTransactions: monthlyTransactionData,
      highValueCustomers: highValueCustomers.map(customer => ({
        ...customer,
        total_balance: parseFloat(customer.total_balance)
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}