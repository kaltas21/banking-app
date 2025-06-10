'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Loan {
  loan_id: number;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  application_date: string;
  monthly_payment?: number;
}

export default function LoansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    loanAmount: '',
    termMonths: '12'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLoans();
    }
  }, [status, router]);

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setLoans(data);
      } else {
        console.error('Invalid loans data:', data);
        setLoans([]);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans([]);
      setError('Failed to load loans. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyPayment = (amount: number, rate: number, months: number) => {
    const monthlyRate = rate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loanAmount: parseFloat(formData.loanAmount),
          termMonths: parseInt(formData.termMonths)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit loan application');
      } else {
        setSuccess('Loan application submitted successfully!');
        setShowApplicationForm(false);
        setFormData({ loanAmount: '', termMonths: '12' });
        fetchLoans(); // Refresh loans list
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Paid Off':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Standard interest rate (in real app, this would be calculated based on credit score, etc.)
  const STANDARD_INTEREST_RATE = 5.5;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Link>
            {!showApplicationForm && (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                <span>Apply for Loan</span>
              </button>
            )}
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

        {showApplicationForm ? (
          /* Loan Application Form */
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <FileText className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Loan Application</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    max="100000"
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter loan amount"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Minimum: $1,000 | Maximum: $100,000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term
                </label>
                <select
                  value={formData.termMonths}
                  onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Loan Details</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Interest Rate:</dt>
                    <dd className="font-medium">{STANDARD_INTEREST_RATE}% APR</dd>
                  </div>
                  {formData.loanAmount && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Monthly Payment:</dt>
                        <dd className="font-medium">
                          ${calculateMonthlyPayment(
                            parseFloat(formData.loanAmount),
                            STANDARD_INTEREST_RATE,
                            parseInt(formData.termMonths)
                          ).toFixed(2)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Total Payment:</dt>
                        <dd className="font-medium">
                          ${(calculateMonthlyPayment(
                            parseFloat(formData.loanAmount),
                            STANDARD_INTEREST_RATE,
                            parseInt(formData.termMonths)
                          ) * parseInt(formData.termMonths)).toFixed(2)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.loanAmount}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Loans List */
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Loans</h1>
            
            {loans.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No loans yet</h3>
                <p className="text-gray-600 mb-4">
                  Apply for a personal loan to get started
                </p>
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  <span>Apply for Loan</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Term
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loans.map((loan) => (
                      <tr key={loan.loan_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(loan.application_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${parseFloat(loan.loan_amount.toString()).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loan.term_months} months
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loan.interest_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${loan.monthly_payment ? loan.monthly_payment.toFixed(2) : 
                            calculateMonthlyPayment(
                              parseFloat(loan.loan_amount.toString()),
                              parseFloat(loan.interest_rate.toString()),
                              loan.term_months
                            ).toFixed(2)
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(loan.status)}
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(loan.status)}`}>
                              {loan.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}