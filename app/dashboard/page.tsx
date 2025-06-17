'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Send, FileText, LogOut, BarChart3, Building2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
  amount: number;
  transaction_type: string;
  description: string;
  transaction_date: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch accounts
      const accountsRes = await fetch('/api/accounts');
      const accountsData = await accountsRes.json();
      
      // Check if accountsData is an array, if not (error case), set empty array
      if (Array.isArray(accountsData)) {
        setAccounts(accountsData);
      } else {
        console.error('Invalid accounts data:', accountsData);
        setAccounts([]);
      }

      // Fetch recent transactions
      const transactionsRes = await fetch('/api/transactions?limit=5');
      const transactionsData = await transactionsRes.json();
      
      // Check if transactionsData is an array
      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData);
      } else {
        console.error('Invalid transactions data:', transactionsData);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = Array.isArray(accounts) 
    ? accounts.reduce((sum, account) => sum + parseFloat(account.balance?.toString() || '0'), 0)
    : 0;

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
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="MK Bank Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 text-sm">Your Financial Overview</p>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span className="text-slate-300">Welcome, {session?.user?.name}</span>
              <motion.button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-red-500 hover:text-red-400 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </motion.button>
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
          {/* Account Summary */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-amber-400" />
              Account Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.length === 0 ? (
                <motion.div 
                  className="col-span-3 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 text-center"
                  whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.3)' }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-slate-400">No accounts found. Please contact support.</p>
                </motion.div>
              ) : (
                accounts.map((account, index) => (
                <motion.div
                  key={account.account_id}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    href={`/accounts/${account.account_id}`}
                    className="block bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 h-full group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {account.account_type} Account
                      </h3>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        account.status === 'Active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 font-mono">{account.account_number}</p>
                    <p className="text-3xl font-bold text-white">
                      ${parseFloat(account.balance.toString()).toFixed(2)}
                    </p>
                  </Link>
                </motion.div>
              )))}
              
              {/* Total Balance Card */}
              {accounts.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl shadow-xl border border-blue-500/30"
                >
                  <h3 className="font-semibold text-blue-100 mb-2">Total Balance</h3>
                  <p className="text-4xl font-bold text-white">${totalBalance.toFixed(2)}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  href: "/transfer",
                  icon: Send,
                  title: "Transfer Money",
                  description: "Send money between accounts",
                  color: "blue",
                  gradient: "from-blue-500 to-blue-600"
                },
                {
                  href: "/transfer?type=bill",
                  icon: CreditCard,
                  title: "Pay Bills",
                  description: "Pay your bills online",
                  color: "green",
                  gradient: "from-green-500 to-green-600"
                },
                {
                  href: "/loans",
                  icon: FileText,
                  title: "Apply for Loan",
                  description: "Request a personal loan",
                  color: "purple",
                  gradient: "from-purple-500 to-purple-600"
                }
              ].map((action, index) => (
                <motion.div
                  key={action.href}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    href={action.href}
                    className="block bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 h-full group"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className={`bg-gradient-to-r ${action.gradient} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-slate-400">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Analytics Section */}
          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href="/dashboard/analytics"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-slate-700/50 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 transition-all duration-300 group"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="font-semibold">View Detailed Analytics</span>
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
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
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {transactions.map((transaction, index) => (
                      <motion.tr 
                        key={transaction.transaction_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {transaction.transaction_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          <span className={transaction.to_account_id === accounts[0]?.account_id ? 'text-green-400' : 'text-red-400'}>
                            {transaction.to_account_id === accounts[0]?.account_id ? '+' : '-'}
                            ${parseFloat(transaction.amount.toString()).toFixed(2)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          No transactions yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}