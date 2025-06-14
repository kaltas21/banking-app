import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function GET() {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query 1: Customers with above-average account balances
    const aboveAverageCustomersQuery = `
      WITH customer_totals AS (
        SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          c.email,
          COUNT(a.account_id) as account_count,
          SUM(a.balance) as total_balance
        FROM customers c
        INNER JOIN accounts a ON c.customer_id = a.customer_id
        WHERE a.status = 'Active'
        GROUP BY c.customer_id, c.first_name, c.last_name, c.email
      ),
      avg_balance AS (
        SELECT AVG(balance) * 1.5 as threshold
        FROM accounts
        WHERE status = 'Active'
      )
      SELECT 
        ct.customer_id,
        ct.first_name,
        ct.last_name,
        ct.email,
        ct.account_count::int,
        ct.total_balance::numeric
      FROM customer_totals ct, avg_balance ab
      WHERE ct.total_balance > ab.threshold
      ORDER BY ct.total_balance DESC
      LIMIT 10
    `;
    const aboveAverageCustomersResult = await client.query(aboveAverageCustomersQuery);
    const aboveAverageCustomers = aboveAverageCustomersResult.rows;

    // Query 2: Monthly transaction patterns with GROUP BY and HAVING
    const monthlyPatternsQuery = `
      SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        MAX(amount) as max_amount
      FROM transactions
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), transaction_type
      HAVING COUNT(*) > 5
      ORDER BY month DESC, total_amount DESC
    `;
    const monthlyPatternsResult = await client.query(monthlyPatternsQuery);
    const monthlyPatterns = monthlyPatternsResult.rows;

    // Query 3: Top performing accounts by transaction frequency
    const topAccountsQuery = `
      WITH account_metrics AS (
        SELECT 
          a.account_id,
          a.account_number,
          a.account_type,
          a.balance,
          c.first_name,
          c.last_name,
          COUNT(DISTINCT t.transaction_id) as transaction_count,
          COALESCE(SUM(CASE WHEN t.from_account_id = a.account_id THEN t.amount ELSE 0 END), 0) as total_sent,
          COALESCE(SUM(CASE WHEN t.to_account_id = a.account_id THEN t.amount ELSE 0 END), 0) as total_received
        FROM accounts a
        INNER JOIN customers c ON a.customer_id = c.customer_id
        LEFT JOIN transactions t ON (a.account_id = t.from_account_id OR a.account_id = t.to_account_id)
        WHERE a.status = 'Active'
        GROUP BY a.account_id, a.account_number, a.account_type, a.balance, c.first_name, c.last_name
      )
      SELECT 
        account_id,
        account_number,
        account_type,
        balance::numeric,
        first_name,
        last_name,
        transaction_count::int,
        total_sent::numeric,
        total_received::numeric,
        (total_received - total_sent)::numeric as net_flow
      FROM account_metrics
      WHERE transaction_count > 0
      ORDER BY transaction_count DESC, balance DESC
      LIMIT 20
    `;
    const topAccountsResult = await client.query(topAccountsQuery);
    const topAccounts = topAccountsResult.rows;

    // Query 4: Loan risk analysis with GROUP BY and complex aggregations
    const loanRiskAnalysisQuery = `
      SELECT 
        status as loan_status,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(*) as total_loans,
        SUM(loan_amount) as total_amount,
        AVG(loan_amount) as avg_loan_amount,
        AVG(interest_rate) as avg_interest_rate,
        MIN(loan_amount) as min_loan,
        MAX(loan_amount) as max_loan,
        CASE 
          WHEN AVG(interest_rate) > 5 THEN 'High Risk'
          WHEN AVG(interest_rate) > 3 THEN 'Medium Risk'
          ELSE 'Low Risk'
        END as risk_category
      FROM loans
      GROUP BY status
      HAVING COUNT(*) > 0
      ORDER BY total_amount DESC
    `;
    const loanRiskAnalysisResult = await client.query(loanRiskAnalysisQuery);
    const loanRiskAnalysis = loanRiskAnalysisResult.rows;

    // Query 5: Customer segmentation by transaction behavior
    const customerSegmentationQuery = `
      WITH customer_metrics AS (
        SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          COUNT(DISTINCT CASE WHEN a.status = 'Active' THEN a.account_id END) as account_count,
          COALESCE(SUM(CASE WHEN a.status = 'Active' THEN a.balance END), 0) as total_balance,
          COUNT(DISTINCT CASE WHEN l.status IN ('Approved', 'Pending') THEN l.loan_id END) as loan_count,
          COALESCE(SUM(CASE WHEN l.status IN ('Approved', 'Pending') THEN l.loan_amount END), 0) as total_loan_amount,
          COUNT(DISTINCT t.transaction_id) as recent_transactions
        FROM customers c
        LEFT JOIN accounts a ON c.customer_id = a.customer_id
        LEFT JOIN loans l ON c.customer_id = l.customer_id
        LEFT JOIN transactions t ON (a.account_id = t.from_account_id OR a.account_id = t.to_account_id)
          AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY c.customer_id, c.first_name, c.last_name
      ),
      customer_segments AS (
        SELECT 
          *,
          CASE 
            WHEN total_balance > 100000 AND recent_transactions > 10 THEN 'Premium Active'
            WHEN total_balance > 50000 AND recent_transactions > 5 THEN 'High Value'
            WHEN total_balance > 10000 AND recent_transactions > 2 THEN 'Regular Active'
            WHEN recent_transactions = 0 THEN 'Inactive'
            ELSE 'Low Activity'
          END as customer_segment
        FROM customer_metrics
      )
      SELECT 
        customer_segment,
        COUNT(*) as customer_count,
        AVG(total_balance) as avg_balance,
        AVG(account_count) as avg_accounts,
        AVG(loan_count) as avg_loans,
        SUM(total_loan_amount) as total_loans_value
      FROM customer_segments
      GROUP BY customer_segment
      HAVING COUNT(*) > 0
      ORDER BY avg_balance DESC
    `;
    const customerSegmentationResult = await client.query(customerSegmentationQuery);
    const customerSegmentation = customerSegmentationResult.rows;

    // Format the responses
    const formattedAboveAverageCustomers = aboveAverageCustomers.map(customer => ({
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      total_balance: parseFloat(customer.total_balance),
      account_count: parseInt(customer.account_count)
    }));

    const formattedMonthlyPatterns = monthlyPatterns.map(pattern => ({
      month: pattern.month,
      transaction_type: pattern.transaction_type,
      transaction_count: parseInt(pattern.transaction_count),
      total_amount: parseFloat(pattern.total_amount),
      avg_amount: parseFloat(pattern.avg_amount),
      max_amount: parseFloat(pattern.max_amount)
    }));

    const formattedTopAccounts = topAccounts.map(account => ({
      account_id: account.account_id,
      account_number: account.account_number,
      account_type: account.account_type,
      balance: parseFloat(account.balance),
      transaction_count: parseInt(account.transaction_count),
      total_sent: parseFloat(account.total_sent),
      total_received: parseFloat(account.total_received),
      net_flow: parseFloat(account.net_flow),
      first_name: account.first_name,
      last_name: account.last_name
    }));

    const formattedLoanRiskAnalysis = loanRiskAnalysis.map(analysis => ({
      loan_status: analysis.loan_status,
      unique_customers: parseInt(analysis.unique_customers),
      total_loans: parseInt(analysis.total_loans),
      total_amount: parseFloat(analysis.total_amount),
      avg_loan_amount: parseFloat(analysis.avg_loan_amount),
      avg_interest_rate: parseFloat(analysis.avg_interest_rate),
      min_loan: parseFloat(analysis.min_loan),
      max_loan: parseFloat(analysis.max_loan),
      risk_category: analysis.risk_category
    }));

    const formattedCustomerSegmentation = customerSegmentation.map(segment => ({
      customer_segment: segment.customer_segment,
      customer_count: parseInt(segment.customer_count),
      avg_balance: parseFloat(segment.avg_balance),
      avg_accounts: parseFloat(segment.avg_accounts),
      avg_loans: parseFloat(segment.avg_loans),
      total_loans_value: parseFloat(segment.total_loans_value)
    }));

    return NextResponse.json({
      aboveAverageCustomers: formattedAboveAverageCustomers,
      monthlyPatterns: formattedMonthlyPatterns,
      topAccounts: formattedTopAccounts,
      loanRiskAnalysis: formattedLoanRiskAnalysis,
      customerSegmentation: formattedCustomerSegmentation
    });
  } catch (error) {
    console.error('Error in advanced analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced analytics' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}