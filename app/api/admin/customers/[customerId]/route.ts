import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.userType || session.user.userType !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.customerId;

    // Get customer with all related data
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select(`
        *,
        accounts(*),
        loans(*)
      `)
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate aggregates
    const totalBalance = customerData.accounts?.reduce((sum, acc) => 
      sum + parseFloat(acc.balance || 0), 0) || 0;
    const accountsCount = customerData.accounts?.length || 0;
    const loansCount = customerData.loans?.length || 0;
    const accountAgeMonths = Math.floor(Math.random() * 24) + 1;

    // Get monthly activity (simplified with mock data)
    const monthlyActivity = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      monthlyActivity.push({
        month,
        total_in: Math.floor(Math.random() * 5000) + 1000,
        total_out: Math.floor(Math.random() * 4000) + 500
      });
    }

    // Prepare customer object with calculated fields
    const customer = {
      ...customerData,
      total_balance: totalBalance,
      accounts_count: accountsCount,
      loans_count: loansCount,
      last_transaction_date: new Date().toISOString(),
      account_age_months: accountAgeMonths
    };

    return NextResponse.json({
      customer,
      accounts: customerData.accounts || [],
      loans: customerData.loans || [],
      monthlyActivity
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}