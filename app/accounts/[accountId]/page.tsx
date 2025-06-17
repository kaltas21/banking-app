'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Filter, Building2, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Account {
  account_id: number;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
}

interface Transaction {
  transaction_id: number;
  from_account_id: number;
  to_account_id: number;
  from_account_number: string;
  to_account_number: string;
  amount: number;
  transaction_type: string;
  description: string;
  transaction_date: string;
}

export default function AccountDetailPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    dateFrom: '',
    dateTo: '',
    transactionType: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && accountId) {
      fetchAccountData();
    }
  }, [status, accountId, router]);

  const fetchAccountData = async () => {
    try {
      // Fetch account details
      const accountRes = await fetch(`/api/accounts/${accountId}`);
      if (!accountRes.ok) {
        router.push('/dashboard');
        return;
      }
      const accountData = await accountRes.json();
      setAccount(accountData);

      // Fetch transactions
      const transactionsRes = await fetch(`/api/transactions?accountId=${accountId}&limit=50`);
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching account data:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Description', 'From/To Account', 'Amount', 'Credit/Debit'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => {
        const isCredit = transaction.to_account_id === parseInt(accountId);
        const amount = parseFloat(transaction.amount.toString()).toFixed(2);
        const formattedAmount = isCredit ? `+${amount}` : `-${amount}`;
        const fromTo = isCredit 
          ? transaction.from_account_number || 'External' 
          : transaction.to_account_number || 'External';
        
        return [
          new Date(transaction.transaction_date).toLocaleDateString(),
          transaction.transaction_type,
          `"${transaction.description || '-'}"`,
          fromTo,
          formattedAmount,
          isCredit ? 'Credit' : 'Debit'
        ].join(',');
      })
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `account_${account?.account_number}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter.dateFrom && new Date(transaction.transaction_date) < new Date(filter.dateFrom)) {
      return false;
    }
    if (filter.dateTo && new Date(transaction.transaction_date) > new Date(filter.dateTo)) {
      return false;
    }
    if (filter.transactionType && transaction.transaction_type !== filter.transactionType) {
      return false;
    }
    return true;
  });

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

  if (!account) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div 
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-slate-400">Account not found</p>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Account Details */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Building2 className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {account.account_type} Account
                  </h1>
                  <p className="text-slate-400 font-mono text-lg">
                    Account Number: {account.account_number}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      account.status === 'Active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {account.status}
                    </span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="text-center lg:text-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="text-slate-400 text-sm mb-2">Current Balance</p>
                <p className="text-5xl font-bold text-white">
                  ${parseFloat(account.balance.toString()).toFixed(2)}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Transaction Filters */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <TrendingUp className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Transaction History</h2>
                  <p className="text-slate-400">Filter and export your transactions</p>
                </div>
              </motion.div>
              
              <motion.button 
                onClick={exportTransactions}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Download className="h-5 w-5" />
                <span>Export</span>
              </motion.button>
            </div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  From Date
                </label>
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  To Date
                </label>
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Transaction Type
                </label>
                <select
                  value={filter.transactionType}
                  onChange={(e) => setFilter({ ...filter, transactionType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-300"
                >
                  <option value="" className="bg-slate-800">All Types</option>
                  <option value="Transfer" className="bg-slate-800">Transfer</option>
                  <option value="Deposit" className="bg-slate-800">Deposit</option>
                  <option value="Withdrawal" className="bg-slate-800">Withdrawal</option>
                  <option value="Bill Payment" className="bg-slate-800">Bill Payment</option>
                </select>
              </div>
            </motion.div>
          </motion.div>

          {/* Transactions Table */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      From/To
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredTransactions.map((transaction, index) => {
                    const isCredit = transaction.to_account_id === parseInt(accountId);
                    return (
                      <motion.tr 
                        key={transaction.transaction_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.transaction_type === 'Transfer' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : transaction.transaction_type === 'Deposit'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : transaction.transaction_type === 'Withdrawal'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                          {isCredit 
                            ? transaction.from_account_number || 'External' 
                            : transaction.to_account_number || 'External'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                          <span className={isCredit ? 'text-green-400' : 'text-red-400'}>
                            {isCredit ? '+' : '-'}${parseFloat(transaction.amount.toString()).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">
                          -
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No transactions found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}