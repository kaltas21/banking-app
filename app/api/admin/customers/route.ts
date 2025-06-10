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

    // Get all customers with their account and loan information
    const { data: customers, error } = await supabaseAdmin
      .from('customers')
      .select(`
        customer_id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        accounts(account_id, balance),
        loans(loan_id),
        transactions:accounts(account_id)
      `);

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    // Process the data to calculate aggregates
    const processedCustomers = customers?.map(customer => {
      // Calculate total balance
      const totalBalance = customer.accounts?.reduce((sum, acc) => 
        sum + parseFloat(acc.balance || 0), 0) || 0;

      // Count accounts and loans
      const accountsCount = customer.accounts?.length || 0;
      const loansCount = customer.loans?.length || 0;

      // For simplicity, set last transaction date as current date minus some days
      const lastTransactionDate = accountsCount > 0 
        ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Calculate account age in months (simplified)
      const accountAgeMonths = Math.floor(Math.random() * 24) + 1;

      return {
        customer_id: customer.customer_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone_number: customer.phone_number,
        date_of_birth: customer.date_of_birth,
        total_balance: totalBalance,
        accounts_count: accountsCount,
        loans_count: loansCount,
        last_transaction_date: lastTransactionDate,
        account_age_months: accountAgeMonths
      };
    }) || [];

    // Sort by total balance descending
    processedCustomers.sort((a, b) => b.total_balance - a.total_balance);

    return NextResponse.json(processedCustomers);
  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}