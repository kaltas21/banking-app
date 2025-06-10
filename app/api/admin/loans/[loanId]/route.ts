import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: { loanId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.userType || session.user.userType !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if employee has loan approval permissions
    if (session.user.role !== 'Loan Officer' && session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'You do not have permission to approve loans' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { decision } = body;

    if (!['approve', 'reject'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision' },
        { status: 400 }
      );
    }

    const loanId = params.loanId;

    // Get loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('loan_id', loanId)
      .eq('status', 'Pending')
      .single();

    if (loanError || !loan) {
      return NextResponse.json(
        { error: 'Loan not found or already processed' },
        { status: 404 }
      );
    }

    const newStatus = decision === 'approve' ? 'Approved' : 'Rejected';

    // Update loan status
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({ 
        status: newStatus,
        approved_by_employee_id: session.user.id
      })
      .eq('loan_id', loanId);

    if (updateError) {
      throw updateError;
    }

    // If approved, deposit the loan amount into customer's primary checking account
    if (decision === 'approve') {
      // Find customer's primary checking account
      const { data: accounts } = await supabaseAdmin
        .from('accounts')
        .select('account_id, balance')
        .eq('customer_id', loan.customer_id)
        .eq('account_type', 'Checking')
        .eq('status', 'Active')
        .order('account_id')
        .limit(1);

      if (!accounts || accounts.length === 0) {
        // Rollback loan approval
        await supabaseAdmin
          .from('loans')
          .update({ status: 'Pending', approved_by_employee_id: null })
          .eq('loan_id', loanId);

        return NextResponse.json(
          { error: 'Customer has no active checking account' },
          { status: 400 }
        );
      }

      const account = accounts[0];

      // Deposit loan amount
      const { error: depositError } = await supabaseAdmin
        .from('accounts')
        .update({ balance: parseFloat(account.balance) + parseFloat(loan.loan_amount) })
        .eq('account_id', account.account_id);

      if (depositError) {
        // Rollback loan approval
        await supabaseAdmin
          .from('loans')
          .update({ status: 'Pending', approved_by_employee_id: null })
          .eq('loan_id', loanId);
        throw depositError;
      }

      // Get the next transaction_id
      const { data: maxTransactionId } = await supabaseAdmin
        .from('transactions')
        .select('transaction_id')
        .order('transaction_id', { ascending: false })
        .limit(1)
        .single();

      const nextTransactionId = (maxTransactionId?.transaction_id || 0) + 1;

      // Record the deposit transaction
      await supabaseAdmin
        .from('transactions')
        .insert({
          transaction_id: nextTransactionId,
          from_account_id: null,
          to_account_id: account.account_id,
          amount: loan.loan_amount,
          transaction_type: 'Deposit',
          description: 'Loan disbursement',
          transaction_date: new Date().toISOString()
        });
    }

    return NextResponse.json({
      message: `Loan ${decision}d successfully`,
      loanId: loanId,
      status: newStatus
    });

  } catch (error) {
    console.error('Error processing loan decision:', error);
    return NextResponse.json(
      { error: 'Failed to process loan decision' },
      { status: 500 }
    );
  }
}