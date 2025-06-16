'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, XCircle, DollarSign, Calendar, User } from 'lucide-react';

interface LoanApplication {
  loan_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  application_date: string;
  total_balance: number;
  account_age_days: number;
  active_loans_count: number;
  average_transaction_amount: number;
}

export default function LoanApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.userType !== 'employee')) {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLoanApplications();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchLoanApplications, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  const fetchLoanApplications = async () => {
    try {
      const response = await fetch('/api/admin/loan-applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching loan applications:', error);
      setError('Failed to load loan applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanDecision = async (loanId: number, decision: 'approve' | 'reject') => {
    setProcessingId(loanId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to ${decision} loan`);
      } else {
        setSuccess(`Loan ${decision}d successfully!`);
        // Refresh the applications list
        fetchLoanApplications();
      }
    } catch (error) {
      setError(`An error occurred while ${decision}ing the loan`);
    } finally {
      setProcessingId(null);
    }
  };

  const calculateMonthlyPayment = (amount: number, rate: number, months: number) => {
    const monthlyRate = rate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  const getRiskLevel = (app: LoanApplication) => {
    const loanToBalanceRatio = app.total_balance > 0 ? app.loan_amount / app.total_balance : Infinity;
    const hasMultipleLoans = app.active_loans_count > 0;
    
    if (loanToBalanceRatio > 5 || hasMultipleLoans) return { level: 'High', color: 'text-red-600 bg-red-100' };
    if (loanToBalanceRatio > 2) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'Low', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
            </div>
            <div className="text-sm text-gray-600">
              {session?.user?.role === 'Loan Officer' && 'Loan Officer View'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
            <p className="text-gray-600">There are no loan applications requiring review at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => {
              const risk = getRiskLevel(application);
              const monthlyPayment = calculateMonthlyPayment(
                parseFloat(application.loan_amount.toString()),
                parseFloat(application.interest_rate.toString()),
                application.term_months
              );

              return (
                <div key={application.loan_id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    {/* Application Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <User className="h-5 w-5 mr-2 text-gray-500" />
                          {application.customer_name}
                        </h3>
                        <p className="text-sm text-gray-600">{application.customer_email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Applied on {new Date(application.application_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${risk.color}`}>
                        {risk.level} Risk
                      </span>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Loan Amount
                        </div>
                        <p className="text-xl font-semibold text-gray-900">
                          ${parseFloat(application.loan_amount.toString()).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Term & Rate
                        </div>
                        <p className="text-xl font-semibold text-gray-900">
                          {application.term_months} months @ {application.interest_rate}%
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm text-gray-600 mb-1">Monthly Payment</div>
                        <p className="text-xl font-semibold text-gray-900">
                          ${monthlyPayment.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Customer Financial Health */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Customer Financial Health</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Balance</p>
                          <p className="font-medium text-gray-900">
                            ${parseFloat(application.total_balance.toString()).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Account Age</p>
                          <p className="font-medium text-gray-900">
                            {Math.floor(application.account_age_days / 30)} months
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Active Loans</p>
                          <p className="font-medium text-gray-900">{application.active_loans_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Transaction</p>
                          <p className="font-medium text-gray-900">
                            ${parseFloat(application.average_transaction_amount.toString()).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={() => handleLoanDecision(application.loan_id, 'reject')}
                        disabled={processingId === application.loan_id}
                        className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleLoanDecision(application.loan_id, 'approve')}
                        disabled={processingId === application.loan_id}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}