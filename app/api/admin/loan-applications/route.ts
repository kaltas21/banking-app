import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.userType || session.user.userType !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending loan applications with customer details
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select(`
        loan_id,
        customer_id,
        loan_amount,
        interest_rate,
        term_months,
        status,
        application_date,
        customers!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'Pending')
      .order('application_date', { ascending: true });

    if (error) {
      console.error('Error fetching loan applications:', error);
      throw error;
    }

    // Transform the data and add financial metrics
    const applicationsWithMetrics = [];
    
    for (const loan of loans || []) {
      // Get customer's total balance
      const { data: accounts } = await supabaseAdmin
        .from('accounts')
        .select('balance')
        .eq('customer_id', loan.customer_id);
      
      const totalBalance = accounts?.reduce((sum, acc) => 
        sum + parseFloat(acc.balance || 0), 0) || 0;

      // Get customer's transaction metrics
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .or(`from_account_id.in.(${accounts?.map(a => a.account_id).join(',')}),to_account_id.in.(${accounts?.map(a => a.account_id).join(',')})`);
      
      const avgTransactionAmount = transactions && transactions.length > 0
        ? transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / transactions.length
        : 0;

      // Get active loans count
      const { count: activeLoansCount } = await supabaseAdmin
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', loan.customer_id)
        .eq('status', 'Approved');

      // Calculate account age (simplified)
      const accountAgeDays = 90; // Default 90 days for demo

      applicationsWithMetrics.push({
        loan_id: loan.loan_id,
        customer_id: loan.customer_id,
        customer_name: `${loan.customers.first_name} ${loan.customers.last_name}`,
        customer_email: loan.customers.email,
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        term_months: loan.term_months,
        status: loan.status,
        application_date: loan.application_date,
        total_balance: totalBalance,
        account_age_days: accountAgeDays,
        active_loans_count: activeLoansCount || 0,
        average_transaction_amount: avgTransactionAmount
      });
    }

    return NextResponse.json(applicationsWithMetrics);
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan applications' },
      { status: 500 }
    );
  }
}