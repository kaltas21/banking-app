import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch loans for the current customer
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id || session.user.userType !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('loans')
      .select('loan_id, loan_amount, interest_rate, term_months, status, application_date')
      .eq('customer_id', session.user.id)
      .order('application_date', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

// POST - Create a new loan application
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id || session.user.userType !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { loanAmount, termMonths } = body;

    // Validate input
    if (!loanAmount || loanAmount < 1000 || loanAmount > 100000) {
      return NextResponse.json(
        { error: 'Invalid loan amount. Must be between $1,000 and $100,000' },
        { status: 400 }
      );
    }

    if (!termMonths || ![12, 24, 36, 48, 60].includes(termMonths)) {
      return NextResponse.json(
        { error: 'Invalid loan term' },
        { status: 400 }
      );
    }

    // Check if customer has any pending loans
    const { data: pendingLoans } = await supabaseAdmin
      .from('loans')
      .select('loan_id')
      .eq('customer_id', session.user.id)
      .eq('status', 'Pending');

    if (pendingLoans && pendingLoans.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending loan application' },
        { status: 400 }
      );
    }

    // Standard interest rate (in a real app, this would be calculated based on credit score, etc.)
    const interestRate = 5.5;

    // Get the next loan_id
    const { data: maxLoanId } = await supabaseAdmin
      .from('loans')
      .select('loan_id')
      .order('loan_id', { ascending: false })
      .limit(1)
      .single();

    const nextLoanId = (maxLoanId?.loan_id || 0) + 1;

    // Insert new loan application
    const { data: newLoan, error: insertError } = await supabaseAdmin
      .from('loans')
      .insert({
        loan_id: nextLoanId,
        customer_id: session.user.id,
        loan_amount: loanAmount,
        interest_rate: interestRate,
        term_months: termMonths,
        status: 'Pending',
        application_date: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating loan:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      message: 'Loan application submitted successfully',
      loanId: newLoan.loan_id
    });
  } catch (error) {
    console.error('Error creating loan application:', error);
    return NextResponse.json(
      { error: 'Failed to submit loan application' },
      { status: 500 }
    );
  }
}