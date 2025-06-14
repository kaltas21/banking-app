import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function GET() {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.userType !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = session.user.id!;

    // Query 1: Customer's accounts summary
    const customerAccountsQuery = `
      SELECT account_id, account_number, account_type, balance, status
      FROM accounts
      WHERE customer_id = $1
      ORDER BY balance DESC
    `;
    const customerAccountsResult = await client.query(customerAccountsQuery, [customerId]);
    const customerAccounts = customerAccountsResult.rows;

    // Query 2: Monthly transaction volume (GROUP BY month)
    const monthlyTransactionVolumeQuery = `
      WITH customer_accounts AS (
        SELECT account_id FROM accounts WHERE customer_id = $1
      ),
      monthly_stats AS (
        SELECT 
          TO_CHAR(t.transaction_date, 'YYYY-MM') as month,
          COUNT(CASE WHEN t.from_account_id = ca.account_id THEN 1 END) as sent_count,
          SUM(CASE WHEN t.from_account_id = ca.account_id THEN t.amount ELSE 0 END) as sent_amount,
          COUNT(CASE WHEN t.to_account_id = ca.account_id THEN 1 END) as received_count,
          SUM(CASE WHEN t.to_account_id = ca.account_id THEN t.amount ELSE 0 END) as received_amount,
          COUNT(*) as total_count,
          SUM(t.amount) as total_amount
        FROM transactions t
        INNER JOIN customer_accounts ca ON (t.from_account_id = ca.account_id OR t.to_account_id = ca.account_id)
        WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(t.transaction_date, 'YYYY-MM')
      )
      SELECT 
        month,
        sent_count::int,
        sent_amount::numeric,
        received_count::int,
        received_amount::numeric,
        total_count::int,
        total_amount::numeric
      FROM monthly_stats
      ORDER BY month DESC
    `;
    const monthlyTransactionVolumeResult = await client.query(monthlyTransactionVolumeQuery, [customerId]);
    const monthlyTransactionVolume = monthlyTransactionVolumeResult.rows;

    // Query 3: Bill payments by biller (GROUP BY biller_name)
    const billerSummaryQuery = `
      WITH customer_accounts AS (
        SELECT account_id FROM accounts WHERE customer_id = $1
      ),
      biller_aggregates AS (
        SELECT 
          bp.biller_name,
          bp.biller_account_number,
          COUNT(*) as payment_count,
          SUM(bp.amount) as total_paid,
          AVG(bp.amount) as average_payment,
          MAX(bp.payment_date) as last_payment_date
        FROM billpayments bp
        INNER JOIN customer_accounts ca ON bp.account_id = ca.account_id
        GROUP BY bp.biller_name, bp.biller_account_number
      ),
      biller_payments AS (
        SELECT 
          bp.biller_name,
          json_agg(
            json_build_object(
              'amount', bp.amount,
              'date', bp.payment_date
            ) ORDER BY bp.payment_date DESC
          ) as payments
        FROM billpayments bp
        INNER JOIN customer_accounts ca ON bp.account_id = ca.account_id
        GROUP BY bp.biller_name
      )
      SELECT 
        ba.biller_name,
        ba.biller_account_number,
        ba.payment_count::int,
        ba.total_paid::numeric,
        ba.average_payment::numeric,
        ba.last_payment_date,
        bp.payments
      FROM biller_aggregates ba
      INNER JOIN biller_payments bp ON ba.biller_name = bp.biller_name
      ORDER BY ba.total_paid DESC
    `;
    const billerSummaryResult = await client.query(billerSummaryQuery, [customerId]);
    const billerSummary = billerSummaryResult.rows;

    // Query 4: Loan summary
    const loanSummaryQuery = `
      WITH loan_groups AS (
        SELECT 
          status,
          COUNT(*) as loan_count,
          SUM(loan_amount) as total_amount,
          AVG(loan_amount) as average_amount,
          json_agg(
            json_build_object(
              'loan_id', loan_id,
              'loan_amount', loan_amount,
              'interest_rate', interest_rate,
              'term_months', term_months,
              'application_date', application_date
            ) ORDER BY application_date DESC
          ) as loans
        FROM loans
        WHERE customer_id = $1
        GROUP BY status
      )
      SELECT 
        status,
        loan_count::int,
        total_amount::numeric,
        average_amount::numeric,
        loans
      FROM loan_groups
    `;
    const loanSummaryResult = await client.query(loanSummaryQuery, [customerId]);
    const loanSummary = loanSummaryResult.rows;

    // Query 5: Recent transactions with details
    const recentTransactionsQuery = `
      WITH customer_accounts AS (
        SELECT account_id FROM accounts WHERE customer_id = $1
      ),
      recent_txs AS (
        SELECT 
          t.transaction_id,
          t.transaction_date,
          t.amount,
          t.transaction_type,
          t.description,
          t.from_account_id,
          t.to_account_id,
          fa.account_number as from_account_number,
          fa.account_type as from_account_type,
          ta.account_number as to_account_number,
          ta.account_type as to_account_type,
          CASE 
            WHEN t.from_account_id IN (SELECT account_id FROM customer_accounts) 
              AND t.to_account_id IN (SELECT account_id FROM customer_accounts) THEN 'Internal'
            WHEN t.from_account_id IN (SELECT account_id FROM customer_accounts) THEN 'Sent'
            WHEN t.to_account_id IN (SELECT account_id FROM customer_accounts) THEN 'Received'
          END as direction
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
        LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
        WHERE (t.from_account_id IN (SELECT account_id FROM customer_accounts) 
               OR t.to_account_id IN (SELECT account_id FROM customer_accounts))
          AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY t.transaction_date DESC
        LIMIT 50
      )
      SELECT 
        transaction_id,
        transaction_date as date,
        amount::numeric,
        transaction_type as type,
        COALESCE(description, '') as description,
        direction,
        CASE WHEN from_account_number IS NOT NULL THEN 
          json_build_object('account_number', from_account_number, 'account_type', from_account_type)
        ELSE NULL END as from_account,
        CASE WHEN to_account_number IS NOT NULL THEN 
          json_build_object('account_number', to_account_number, 'account_type', to_account_type)
        ELSE NULL END as to_account
      FROM recent_txs
    `;
    const recentTransactionsResult = await client.query(recentTransactionsQuery, [customerId]);
    const recentTransactions = recentTransactionsResult.rows;

    // Format the response
    const formattedAccounts = customerAccounts.map(acc => ({
      ...acc,
      balance: parseFloat(acc.balance || 0)
    }));

    const formattedMonthlyVolume = monthlyTransactionVolume.map(vol => ({
      month: vol.month,
      sent_count: parseInt(vol.sent_count),
      sent_amount: parseFloat(vol.sent_amount),
      received_count: parseInt(vol.received_count),
      received_amount: parseFloat(vol.received_amount),
      total_count: parseInt(vol.total_count),
      total_amount: parseFloat(vol.total_amount)
    }));

    const formattedBillerSummary = billerSummary.map(biller => ({
      biller_name: biller.biller_name,
      biller_account_number: biller.biller_account_number,
      payment_count: parseInt(biller.payment_count),
      total_paid: parseFloat(biller.total_paid),
      average_payment: parseFloat(biller.average_payment),
      last_payment_date: biller.last_payment_date,
      payments: biller.payments.map((p: any) => ({
        amount: parseFloat(p.amount),
        date: p.date
      }))
    }));

    const formattedLoanSummary = loanSummary.map(group => ({
      status: group.status,
      loan_count: parseInt(group.loan_count),
      total_amount: parseFloat(group.total_amount),
      average_amount: parseFloat(group.average_amount),
      loans: group.loans.map((l: any) => ({
        loan_id: l.loan_id,
        loan_amount: parseFloat(l.loan_amount),
        interest_rate: parseFloat(l.interest_rate),
        term_months: l.term_months,
        application_date: l.application_date
      }))
    }));

    const formattedRecentTransactions = recentTransactions.map(tx => ({
      transaction_id: tx.transaction_id,
      date: tx.date,
      amount: parseFloat(tx.amount),
      type: tx.type,
      description: tx.description,
      direction: tx.direction,
      from_account: tx.from_account,
      to_account: tx.to_account
    }));

    return NextResponse.json({
      accounts: formattedAccounts,
      monthlyTransactionVolume: formattedMonthlyVolume,
      billerSummary: formattedBillerSummary,
      loanSummary: formattedLoanSummary,
      recentTransactions: formattedRecentTransactions
    });
  } catch (error) {
    console.error('Error in customer analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}