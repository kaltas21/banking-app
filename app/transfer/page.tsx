'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, CreditCard } from 'lucide-react';

interface Account {
  account_id: number;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
}

function TransferContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transferType = searchParams.get('type') || 'transfer';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountNumber: '',
    amount: '',
    description: '',
    billerName: '',
    billerAccountNumber: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAccounts();
    }
  }, [status, router]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAccounts(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, fromAccountId: data[0].account_id.toString() }));
        }
      } else {
        console.error('Invalid accounts data:', data);
        setAccounts([]);
        setError('Failed to load accounts. Please try refreshing the page.');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
      setError('Failed to load accounts. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const endpoint = transferType === 'bill' ? '/api/bill-payment' : '/api/transfer';
      const payload = transferType === 'bill' 
        ? {
            accountId: formData.fromAccountId,
            billerName: formData.billerName,
            billerAccountNumber: formData.billerAccountNumber,
            amount: parseFloat(formData.amount),
            description: formData.description
          }
        : {
            fromAccountId: formData.fromAccountId,
            toAccountNumber: formData.toAccountNumber,
            amount: parseFloat(formData.amount),
            description: formData.description
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Transaction failed');
      } else {
        setSuccess(transferType === 'bill' ? 'Bill payment successful!' : 'Transfer successful!');
        // Reset form
        setFormData({
          fromAccountId: accounts[0]?.account_id.toString() || '',
          toAccountNumber: '',
          amount: '',
          description: '',
          billerName: '',
          billerAccountNumber: ''
        });
        // Refresh accounts to show updated balance
        fetchAccounts();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = Array.isArray(accounts) 
    ? accounts.find(a => a.account_id?.toString() === formData.fromAccountId)
    : undefined;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            {transferType === 'bill' ? (
              <>
                <CreditCard className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">Pay Bills</h1>
              </>
            ) : (
              <>
                <Send className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Transfer Money</h1>
              </>
            )}
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Account
              </label>
              <select
                value={formData.fromAccountId}
                onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              >
                {accounts.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.account_type} - {account.account_number} (${parseFloat(account.balance.toString()).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {transferType === 'bill' ? (
              <>
                {/* Biller Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biller Name
                  </label>
                  <input
                    type="text"
                    value={formData.billerName}
                    onChange={(e) => setFormData({ ...formData, billerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="e.g., Electric Company"
                    required
                  />
                </div>

                {/* Biller Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biller Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.billerAccountNumber}
                    onChange={(e) => setFormData({ ...formData, billerAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter biller account number"
                    required
                  />
                </div>
              </>
            ) : (
              /* To Account Number */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account Number
                </label>
                <input
                  type="text"
                  value={formData.toAccountNumber}
                  onChange={(e) => setFormData({ ...formData, toAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter recipient account number"
                  required
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedAccount?.balance || 0}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="0.00"
                  required
                />
              </div>
              {selectedAccount && (
                <p className="mt-1 text-sm text-gray-500">
                  Available balance: ${parseFloat(selectedAccount.balance.toString()).toFixed(2)}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder={transferType === 'bill' ? 'e.g., Monthly electricity bill' : 'e.g., Rent payment'}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !formData.amount || parseFloat(formData.amount) <= 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : transferType === 'bill' ? 'Pay Bill' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <TransferContent />
    </Suspense>
  );
}