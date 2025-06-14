import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

// GET - Fetch loans for the current customer
export async function GET() {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id || session.user.userType !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loansQuery = `
      SELECT loan_id, loan_amount, interest_rate, term_months, status, application_date
      FROM loans
      WHERE customer_id = $1
      ORDER BY application_date DESC
    `;
    const loansResult = await client.query(loansQuery, [session.user.id]);
    const loans = loansResult.rows;

    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// POST - Create a new loan application
export async function POST(request: Request) {
  const client = getDbClient();

  try {
    await client.connect();
    
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
    const pendingLoansQuery = `
      SELECT loan_id
      FROM loans
      WHERE customer_id = $1
        AND status = 'Pending'
    `;
    const pendingLoansResult = await client.query(pendingLoansQuery, [session.user.id]);
    const pendingLoans = pendingLoansResult.rows;

    if (pendingLoans.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending loan application' },
        { status: 400 }
      );
    }

    // Standard interest rate (in a real app, this would be calculated based on credit score, etc.)
    const interestRate = 5.5;

    // Get the next loan_id
    const maxLoanIdQuery = `
      SELECT COALESCE(MAX(loan_id), 0) + 1 as next_loan_id
      FROM loans
    `;
    const maxLoanIdResult = await client.query(maxLoanIdQuery);
    const nextLoanId = maxLoanIdResult.rows[0].next_loan_id;

    // Insert new loan application
    const newLoanQuery = `
      INSERT INTO loans (
        loan_id, customer_id, loan_amount,
        interest_rate, term_months, status, application_date
      )
      VALUES (
        $1, $2, $3,
        $4, $5, 'Pending', $6
      )
      RETURNING loan_id
    `;
    const newLoanResult = await client.query(newLoanQuery, [
      nextLoanId, session.user.id, loanAmount,
      interestRate, termMonths, new Date().toISOString()
    ]);

    return NextResponse.json({
      message: 'Loan application submitted successfully',
      loanId: newLoanResult.rows[0].loan_id
    });
  } catch (error) {
    console.error('Error creating loan application:', error);
    return NextResponse.json(
      { error: 'Failed to submit loan application' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}