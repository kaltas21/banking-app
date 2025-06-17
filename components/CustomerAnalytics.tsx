'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, CreditCard, FileText, DollarSign } from 'lucide-react';

interface Analytics {
  accounts: Array<{
    account_id: number;
    account_number: string;
    account_type: string;
    balance: number;
    status: string;
  }>;
  monthlyTransactionVolume: Array<{
    month: string;
    sent_count: number;
    sent_amount: number;
    received_count: number;
    received_amount: number;
    total_count: number;
    total_amount: number;
  }>;
  billerSummary: Array<{
    biller_name: string;
    biller_account_number: string;
    payment_count: number;
    total_paid: number;
    average_payment: number;
    last_payment_date: string | null;
  }>;
  loanSummary: Array<{
    status: string;
    loan_count: number;
    total_amount: number;
    average_amount: number;
    loans: Array<{
      loan_id: number;
      loan_amount: number;
      interest_rate: number;
      term_months: number;
      application_date: string;
    }>;
  }>;
  recentTransactions: Array<{
    transaction_id: number;
    date: string;
    amount: number;
    type: string;
    description: string;
    direction: string;
    from_account: { account_number: string; account_type: string } | null;
    to_account: { account_number: string; account_type: string } | null;
  }>;
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

export default function CustomerAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/customer-analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.div>
    );
  }
  
  if (!analytics) return null;

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Account Summary */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Account Summary</h2>
              <p className="text-slate-400">Your active accounts and balances</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {analytics.accounts.map((account, index) => (
              <motion.div 
                key={account.account_id} 
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-white">{account.account_type}</p>
                    <p className="text-sm text-slate-500 font-mono">{account.account_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    account.status === 'Active' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}>
                    {account.status}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">${account.balance.toFixed(2)}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              <p className="text-lg font-semibold text-blue-400">Total Balance</p>
            </div>
            <p className="text-3xl font-bold text-white">
              ${analytics.accounts.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Monthly Transaction Volume */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-green-500 to-green-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Monthly Transaction Volume</h2>
              <p className="text-slate-400">Transaction activity over the last 6 months</p>
            </div>
          </div>
          
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyTransactionVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#94a3b8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent_amount" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Sent" 
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="received_amount" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Received" 
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.monthlyTransactionVolume.slice(0, 3).map((month, index) => (
              <motion.div 
                key={month.month} 
                className="text-center bg-slate-800/40 rounded-xl p-4 border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <p className="text-sm text-slate-400 mb-1">{month.month}</p>
                <p className="font-semibold text-white text-lg">{month.total_count} transactions</p>
                <p className="text-sm text-green-400 font-semibold">${month.total_amount.toFixed(2)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bill Payments Summary */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <CreditCard className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Bill Payment Summary</h2>
              <p className="text-slate-400">Your recurring bill payments</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {analytics.billerSummary.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No bill payments yet</p>
              </div>
            ) : (
              analytics.billerSummary.map((biller, index) => (
                <motion.div 
                  key={biller.biller_name} 
                  className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-white text-lg">{biller.biller_name}</h4>
                      <p className="text-sm text-slate-500 font-mono">Account: {biller.biller_account_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl text-white">${biller.total_paid.toFixed(2)}</p>
                      <p className="text-sm text-slate-400">{biller.payment_count} payments</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Average payment</p>
                      <p className="text-amber-400 font-semibold">${biller.average_payment.toFixed(2)}</p>
                    </div>
                    {biller.last_payment_date && (
                      <div>
                        <p className="text-slate-400">Last payment</p>
                        <p className="text-slate-300">{new Date(biller.last_payment_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Loan Summary */}
      {analytics.loanSummary.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                className="bg-gradient-to-r from-amber-500 to-amber-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FileText className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white">Loan Summary</h2>
                <p className="text-slate-400">Your loan applications and status</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {analytics.loanSummary.map((group, index) => (
                <motion.div 
                  key={group.status} 
                  className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-white text-lg">{group.status} Loans</h4>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {group.loan_count} loans
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                           <div>
                         <p className="text-slate-400 text-sm">Total Amount</p>
                         <p className="text-2xl font-bold text-white">${parseFloat(group.total_amount.toString()).toFixed(2)}</p>
                       </div>
                       <div>
                         <p className="text-slate-400 text-sm">Average Amount</p>
                         <p className="text-lg font-semibold text-slate-300">${parseFloat(group.average_amount.toString()).toFixed(2)}</p>
                       </div>
                  </div>
                  <div className="space-y-2">
                    {group.loans.map((loan) => (
                      <div key={loan.loan_id} className="text-sm bg-slate-900/40 rounded-lg p-3 border border-slate-700/30">
                        <div className="flex justify-between items-center">
                                                     <span className="text-slate-300">
                             ${parseFloat(loan.loan_amount.toString()).toFixed(2)} at {loan.interest_rate}% for {loan.term_months} months
                           </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(loan.application_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
              <p className="text-slate-400">Your latest financial activity</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {analytics.recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No recent transactions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentTransactions.map((transaction, index) => (
                    <motion.div 
                      key={transaction.transaction_id} 
                      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              transaction.direction === 'incoming' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {transaction.type}
                            </span>
                            <span className="text-slate-400 text-sm">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white font-medium">
                            {transaction.description || 'Transaction'}
                          </p>
                          {transaction.from_account && transaction.to_account && (
                            <p className="text-slate-500 text-sm">
                              {transaction.from_account.account_type} → {transaction.to_account.account_type}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.direction === 'incoming' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.direction === 'incoming' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}