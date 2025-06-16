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

    // Advanced Query 1: High-Value Customers (>$75k balance)
    const highValueCustomersQuery = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        SUM(a.balance) AS total_balance
      FROM customers c
      INNER JOIN accounts a ON c.customer_id = a.customer_id
      GROUP BY c.customer_id, c.first_name, c.last_name
      HAVING SUM(a.balance) > 75000
      ORDER BY total_balance DESC
      LIMIT 10
    `;
    const highValueCustomersResult = await client.query(highValueCustomersQuery);
    const highValueCustomers = highValueCustomersResult.rows;

    // Advanced Query 3: Inactive Customers (no transactions in last 6 months)
    const inactiveCustomersQuery = `
      WITH active_customers AS (
        SELECT DISTINCT a.customer_id
        FROM accounts a
        INNER JOIN transactions t ON (a.account_id = t.from_account_id OR a.account_id = t.to_account_id)
        WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      )
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        6 as months_inactive
      FROM customers c
      WHERE NOT EXISTS (
        SELECT 1 FROM active_customers ac WHERE ac.customer_id = c.customer_id
      )
      AND EXISTS (
        SELECT 1 FROM accounts a WHERE a.customer_id = c.customer_id
      )
      LIMIT 10
    `;
    const inactiveCustomersResult = await client.query(inactiveCustomersQuery);
    const inactiveCustomers = inactiveCustomersResult.rows;

    // Advanced Query 4: Loan Officer Performance
    const loanPerformanceQuery = `
      SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        COUNT(CASE WHEN l.status = 'Approved' THEN 1 END) AS approved_loans_count,
        COALESCE(SUM(CASE WHEN l.status = 'Approved' THEN l.loan_amount END), 0) AS total_approved_value
      FROM employees e
      LEFT JOIN loans l ON e.employee_id = l.approved_by_employee_id
      WHERE e.role IN ('Loan Officer', 'Admin')
      GROUP BY e.employee_id, e.first_name, e.last_name
      ORDER BY total_approved_value DESC
    `;
    const loanPerformanceResult = await client.query(loanPerformanceQuery);
    const loanPerformance = loanPerformanceResult.rows;

    // Advanced Query 5: Customer Account Types Distribution
    const customerAccountTypesQuery = `
      WITH customer_account_summary AS (
        SELECT 
          c.customer_id,
          BOOL_OR(a.account_type = 'Checking') AS has_checking,
          BOOL_OR(a.account_type = 'Savings') AS has_savings,
          COUNT(a.account_id) AS account_count
        FROM customers c
        LEFT JOIN accounts a ON c.customer_id = a.customer_id
        GROUP BY c.customer_id
      )
      SELECT 
        CASE 
          WHEN account_count = 0 THEN 'No Accounts'
          WHEN has_checking AND has_savings THEN 'Both Types'
          WHEN has_checking THEN 'Checking Only'
          WHEN has_savings THEN 'Savings Only'
          ELSE 'No Accounts'
        END AS type,
        COUNT(*) AS count
      FROM customer_account_summary
      GROUP BY type
      ORDER BY count DESC
    `;
    const customerAccountTypesResult = await client.query(customerAccountTypesQuery);
    const customerAccountTypes = customerAccountTypesResult.rows;

    // Monthly Transaction Volume
    const monthlyTransactionVolumeQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month
      ),
      monthly_data AS (
        SELECT 
          date_trunc('month', transaction_date) AS month,
          SUM(amount) AS total_volume,
          COUNT(*) AS transaction_count
        FROM transactions
        WHERE transaction_date >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
        GROUP BY date_trunc('month', transaction_date)
      )
      SELECT 
        TO_CHAR(m.month, 'Mon YYYY') AS month,
        COALESCE(md.total_volume, 0)::numeric AS total_volume,
        COALESCE(md.transaction_count, 0)::int AS transaction_count
      FROM months m
      LEFT JOIN monthly_data md ON m.month = md.month
      ORDER BY m.month
    `;
    const monthlyTransactionVolumeResult = await client.query(monthlyTransactionVolumeQuery);
    const monthlyTransactionVolume = monthlyTransactionVolumeResult.rows;

    // Additional Query: Customer Loan Distribution by Type
    const customerLoanDistributionQuery = `
      WITH customer_loan_stats AS (
        SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          COUNT(l.loan_id) as total_loans,
          COUNT(CASE WHEN l.status = 'Pending' THEN 1 END) as pending_loans,
          COUNT(CASE WHEN l.status = 'Approved' THEN 1 END) as approved_loans,
          COUNT(CASE WHEN l.status = 'Rejected' THEN 1 END) as rejected_loans,
          COUNT(CASE WHEN l.status = 'Paid Off' THEN 1 END) as paid_off_loans,
          COALESCE(SUM(CASE WHEN l.status = 'Approved' THEN l.loan_amount END), 0) as total_approved_amount,
          COALESCE(AVG(l.interest_rate), 0) as avg_interest_rate
        FROM customers c
        LEFT JOIN loans l ON c.customer_id = l.customer_id
        GROUP BY c.customer_id, c.first_name, c.last_name
        HAVING COUNT(l.loan_id) > 0
      )
      SELECT 
        customer_id,
        first_name,
        last_name,
        total_loans,
        pending_loans,
        approved_loans,
        rejected_loans,
        paid_off_loans,
        total_approved_amount::numeric,
        ROUND(avg_interest_rate::numeric, 2) as avg_interest_rate
      FROM customer_loan_stats
      ORDER BY total_loans DESC, total_approved_amount DESC
      LIMIT 20
    `;
    const customerLoanDistributionResult = await client.query(customerLoanDistributionQuery);
    const customerLoanDistribution = customerLoanDistributionResult.rows;

    // Format the response
    const formattedHighValueCustomers = highValueCustomers.map(customer => ({
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      total_balance: parseFloat(customer.total_balance)
    }));

    const formattedInactiveCustomers = inactiveCustomers.map(customer => ({
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email || '',
      months_inactive: customer.months_inactive
    }));

    const formattedLoanPerformance = loanPerformance.map(employee => ({
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      approved_loans_count: parseInt(employee.approved_loans_count),
      total_approved_value: parseFloat(employee.total_approved_value)
    }));

    const formattedCustomerAccountTypes = customerAccountTypes.map(type => ({
      type: type.type,
      count: parseInt(type.count)
    }));

    const formattedMonthlyTransactionVolume = monthlyTransactionVolume.map(month => ({
      month: month.month,
      total_volume: parseFloat(month.total_volume),
      transaction_count: parseInt(month.transaction_count)
    }));

    const formattedCustomerLoanDistribution = customerLoanDistribution.map(customer => ({
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      total_loans: parseInt(customer.total_loans),
      pending_loans: parseInt(customer.pending_loans),
      approved_loans: parseInt(customer.approved_loans),
      rejected_loans: parseInt(customer.rejected_loans),
      paid_off_loans: parseInt(customer.paid_off_loans),
      total_approved_amount: parseFloat(customer.total_approved_amount),
      avg_interest_rate: parseFloat(customer.avg_interest_rate)
    }));

    return NextResponse.json({
      highValueCustomers: formattedHighValueCustomers,
      inactiveCustomers: formattedInactiveCustomers,
      loanPerformance: formattedLoanPerformance,
      customerAccountTypes: formattedCustomerAccountTypes,
      monthlyTransactionVolume: formattedMonthlyTransactionVolume,
      customerLoanDistribution: formattedCustomerLoanDistribution
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}