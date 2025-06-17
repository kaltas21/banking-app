'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

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
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-blue-400 hover:text-blue-300 border border-slate-600 hover:border-blue-500/50 rounded-lg transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="flex items-center space-x-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {transferType === 'bill' ? (
              <>
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <CreditCard className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Pay Bills</h1>
                  <p className="text-slate-400">Manage your bill payments securely</p>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Send className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Transfer Money</h1>
                  <p className="text-slate-400">Send money between your accounts</p>
                </div>
              </>
            )}
          </motion.div>

          {error && (
            <motion.div 
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* From Account */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                From Account
              </label>
              <select
                value={formData.fromAccountId}
                onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-300"
                required
              >
                {accounts.map((account) => (
                  <option key={account.account_id} value={account.account_id} className="bg-slate-800">
                    {account.account_type} - {account.account_number} (${parseFloat(account.balance.toString()).toFixed(2)})
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <motion.p 
                  className="mt-2 text-sm text-slate-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Available Balance: <span className="text-green-400 font-semibold">${parseFloat(selectedAccount.balance.toString()).toFixed(2)}</span>
                </motion.p>
              )}
            </div>

            {transferType === 'bill' ? (
              <>
                {/* Biller Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Biller Name
                  </label>
                  <input
                    type="text"
                    value={formData.billerName}
                    onChange={(e) => setFormData({ ...formData, billerName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-300"
                    placeholder="Enter biller name (e.g., Electric Company)"
                    required
                  />
                </div>

                {/* Biller Account Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Biller Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.billerAccountNumber}
                    onChange={(e) => setFormData({ ...formData, billerAccountNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-300"
                    placeholder="Enter biller account number"
                    required
                  />
                </div>
              </>
            ) : (
              /* To Account Number */
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  To Account Number
                </label>
                <input
                  type="text"
                  value={formData.toAccountNumber}
                  onChange={(e) => setFormData({ ...formData, toAccountNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-300"
                  placeholder="Enter recipient account number"
                  required
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-300"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-300 resize-none"
                placeholder="Add a note for this transaction..."
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                transferType === 'bill'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/25'
              } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                  />
                  Processing...
                </div>
              ) : (
                transferType === 'bill' ? 'Pay Bill' : 'Transfer Money'
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </main>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}