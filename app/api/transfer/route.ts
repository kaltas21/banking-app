import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function POST(request: Request) {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fromAccountId, toAccountNumber, amount, description } = body;

    // Validate input
    if (!fromAccountId || !toAccountNumber || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid transfer details' },
        { status: 400 }
      );
    }

    const customerId = session.user.id!; // We've already checked it exists

    // Use a transaction to ensure atomicity
    await client.query('BEGIN');
    
    try {
      // Check from account
      const fromAccountQuery = `
        SELECT account_id, balance, account_number
        FROM accounts
        WHERE account_id = $1
          AND customer_id = $2
          AND status = 'Active'
        FOR UPDATE
      `;
      const fromAccountResult = await client.query(fromAccountQuery, [fromAccountId, customerId]);
      const fromAccount = fromAccountResult.rows[0];

      if (!fromAccount) {
        throw new Error('Invalid source account');
      }

      if (parseFloat(fromAccount.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Find destination account
      const toAccountQuery = `
        SELECT account_id, customer_id
        FROM accounts
        WHERE account_number = $1
          AND status = 'Active'
        FOR UPDATE
      `;
      const toAccountResult = await client.query(toAccountQuery, [toAccountNumber]);
      const toAccount = toAccountResult.rows[0];

      if (!toAccount) {
        throw new Error('Recipient account not found');
      }

      // Prevent transferring to the same account
      if (fromAccount.account_id === toAccount.account_id) {
        throw new Error('Cannot transfer to the same account');
      }

      // Perform the transfer
      // Debit from account
      const debitQuery = `
        UPDATE accounts
        SET balance = balance - $1
        WHERE account_id = $2
      `;
      await client.query(debitQuery, [amount, fromAccountId]);

      // Credit to account
      const creditQuery = `
        UPDATE accounts
        SET balance = balance + $1
        WHERE account_id = $2
      `;
      await client.query(creditQuery, [amount, toAccount.account_id]);

      // Record transaction
      const transactionQuery = `
        INSERT INTO transactions (
          from_account_id,
          to_account_id,
          amount,
          transaction_type,
          description,
          transaction_date
        ) VALUES (
          $1,
          $2,
          $3,
          'Transfer',
          $4,
          $5
        )
        RETURNING transaction_id
      `;
      const transactionResult = await client.query(transactionQuery, [
        fromAccountId,
        toAccount.account_id,
        amount,
        description || `Transfer to ${toAccountNumber}`,
        new Date().toISOString()
      ]);
      const transaction = transactionResult.rows[0];

      await client.query('COMMIT');
      
      return NextResponse.json({
        message: 'Transfer successful',
        transactionId: transaction.transaction_id
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Transfer error:', error);
    
    // Handle specific error messages
    if (error.message && error.message.includes('Invalid source account')) {
      return NextResponse.json(
        { error: 'Invalid source account' },
        { status: 400 }
      );
    }
    if (error.message && error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }
    if (error.message && error.message.includes('Recipient account not found')) {
      return NextResponse.json(
        { error: 'Recipient account not found' },
        { status: 400 }
      );
    }
    if (error.message && error.message.includes('Cannot transfer to the same account')) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same account' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Transfer failed' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}