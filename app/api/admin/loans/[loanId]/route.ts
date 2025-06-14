import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const client = getDbClient();

  try {
    await client.connect();
    
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

    const { loanId } = await params;

    // Get loan details
    const loanQuery = `
      SELECT *
      FROM loans
      WHERE loan_id = $1
        AND status = 'Pending'
    `;
    const loanResult = await client.query(loanQuery, [loanId]);
    const loans = loanResult.rows;

    if (loans.length === 0) {
      return NextResponse.json(
        { error: 'Loan not found or already processed' },
        { status: 404 }
      );
    }

    const loan = loans[0];

    const newStatus = decision === 'approve' ? 'Approved' : 'Rejected';
    const employeeId = session.user.id!; // We've already checked it exists

    // Use a transaction for atomicity
    await client.query('BEGIN');
    
    try {
      // Update loan status
      const updateLoanQuery = `
        UPDATE loans
        SET status = $1,
            approved_by_employee_id = $2
        WHERE loan_id = $3
      `;
      await client.query(updateLoanQuery, [newStatus, employeeId, loanId]);

      // If approved, deposit the loan amount into customer's primary checking account
      if (decision === 'approve') {
        // Find customer's primary checking account
        const findAccountQuery = `
          SELECT account_id, balance
          FROM accounts
          WHERE customer_id = $1
            AND account_type = 'Checking'
            AND status = 'Active'
          ORDER BY account_id
          LIMIT 1
        `;
        const accountResult = await client.query(findAccountQuery, [loan.customer_id]);
        const accounts = accountResult.rows;

        if (accounts.length === 0) {
          throw new Error('Customer has no active checking account');
        }

        const account = accounts[0];

        // Deposit loan amount
        const depositQuery = `
          UPDATE accounts
          SET balance = balance + $1
          WHERE account_id = $2
        `;
        await client.query(depositQuery, [parseFloat(loan.loan_amount), account.account_id]);

        // Get the next transaction_id
        const maxTransactionIdQuery = `
          SELECT COALESCE(MAX(transaction_id), 0) + 1 as next_transaction_id
          FROM transactions
        `;
        const maxTransactionIdResult = await client.query(maxTransactionIdQuery);
        const nextTransactionId = maxTransactionIdResult.rows[0].next_transaction_id;

        // Record the deposit transaction
        const insertTransactionQuery = `
          INSERT INTO transactions (
            transaction_id, from_account_id, to_account_id,
            amount, transaction_type, description, transaction_date
          )
          VALUES (
            $1, NULL, $2,
            $3, 'Deposit', 'Loan disbursement', $4
          )
        `;
        await client.query(insertTransactionQuery, [
          nextTransactionId, 
          account.account_id,
          loan.loan_amount, 
          new Date().toISOString()
        ]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
  } finally {
    await client.end();
  }
}