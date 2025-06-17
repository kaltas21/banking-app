'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  Target,
  AlertCircle,
  Activity,
  Award,
  Building2,
  CreditCard
} from 'lucide-react';

interface AdvancedAnalyticsData {
  aboveAverageCustomers: any[];
  monthlyPatterns: any[];
  topAccounts: any[];
  loanRiskAnalysis: any[];
  customerSegmentation: any[];
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/advanced-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <motion.div 
            key={i} 
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 animate-pulse"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <div className="h-6 bg-slate-700/50 rounded-lg mb-4"></div>
            <div className="h-32 bg-slate-700/30 rounded-lg"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-16 w-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-400 mb-2">Failed to load analytics</h3>
        <p className="text-slate-500">Please try refreshing the page</p>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    if (!risk) return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    switch (risk) {
      case 'Low Risk': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Medium Risk': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'High Risk': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getSegmentIcon = (segment: string) => {
    if (!segment) return <Activity className="h-5 w-5 text-slate-400" />;
    if (segment.includes('Premium')) return <Award className="h-5 w-5 text-purple-400" />;
    if (segment.includes('High')) return <DollarSign className="h-5 w-5 text-green-400" />;
    if (segment.includes('Regular')) return <Users className="h-5 w-5 text-blue-400" />;
    if (segment.includes('Inactive')) return <AlertCircle className="h-5 w-5 text-red-400" />;
    return <Activity className="h-5 w-5 text-slate-400" />;
  };

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <motion.div
            className="bg-gradient-to-r from-amber-500 to-amber-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </motion.div>
          Advanced Banking Analytics
        </h2>
        <p className="text-slate-400">Comprehensive insights into customer behavior and banking operations</p>
      </motion.div>

      {/* Above Average Customers */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-green-600 w-8 h-8 rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <TrendingUp className="h-4 w-4 text-white" />
          </motion.div>
          High-Value Customers (Above Average Balance)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/30 border-b border-slate-600/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Customer</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Total Balance</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {analytics.aboveAverageCustomers.slice(0, 10).map((customer, idx) => (
                <motion.tr 
                  key={idx} 
                  className="hover:bg-slate-700/20 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{customer.first_name} {customer.last_name}</p>
                        <p className="text-slate-400 text-sm">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="text-green-400 font-bold text-lg">
                      ${parseFloat(customer.total_balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="text-white font-medium">{customer.account_count}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Monthly Transaction Patterns */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-blue-600 w-8 h-8 rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Activity className="h-4 w-4 text-white" />
          </motion.div>
          Monthly Transaction Patterns
        </h3>
        <div className="space-y-6">
          {Object.entries(
            analytics.monthlyPatterns.reduce((acc: any, item: any) => {
              if (!acc[item.month]) acc[item.month] = [];
              acc[item.month].push(item);
              return acc;
            }, {})
          ).slice(0, 6).map(([month, patterns]: [string, any], monthIdx) => (
            <motion.div 
              key={month} 
              className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: monthIdx * 0.1 }}
            >
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                {month}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {patterns.map((pattern: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    className="bg-slate-600/30 p-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-slate-400 text-sm">{pattern.transaction_type}</p>
                    <p className="text-white font-semibold">{pattern.transaction_count} txns</p>
                    <p className="text-blue-400 text-sm font-medium">
                      ${parseFloat(pattern.total_amount).toFixed(0)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top Active Accounts */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Target className="h-4 w-4 text-white" />
          </motion.div>
          Most Active Accounts
        </h3>
        <div className="space-y-4">
          {analytics.topAccounts.slice(0, 5).map((account, idx) => (
            <motion.div 
              key={idx} 
              className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30 hover:border-purple-500/30 transition-all duration-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">
                      {account.first_name?.charAt(0)}{account.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{account.first_name} {account.last_name}</p>
                    <p className="text-slate-400 text-sm font-mono">{account.account_number}</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {account.account_type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">${parseFloat(account.balance).toFixed(2)}</p>
                  <p className="text-slate-400 text-sm">{account.transaction_count} transactions</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-600/30">
                <span className="text-slate-400 text-sm">Net Flow:</span>
                <span className={`font-bold ${parseFloat(account.net_flow) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${parseFloat(account.net_flow).toFixed(2)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loan Risk Analysis */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <motion.div
            className="bg-gradient-to-r from-red-500 to-red-600 w-8 h-8 rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <AlertCircle className="h-4 w-4 text-white" />
          </motion.div>
          Loan Risk Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.loanRiskAnalysis.slice(0, 6).map((loanGroup, idx) => (
            <motion.div 
              key={idx}
              className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{loanGroup.loan_status}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(loanGroup.risk_category)}`}>
                    {loanGroup.risk_category}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Total Loans:</span>
                  <span className="text-white font-medium">{loanGroup.total_loans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Customers:</span>
                  <span className="text-white font-medium">{loanGroup.unique_customers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Total Amount:</span>
                  <span className="text-green-400 font-medium">${parseFloat(loanGroup.total_amount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Avg Amount:</span>
                  <span className="text-blue-400 font-medium">${parseFloat(loanGroup.avg_loan_amount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Avg Rate:</span>
                  <span className="text-amber-400 font-medium">{parseFloat(loanGroup.avg_interest_rate || '0').toFixed(2)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Customer Segmentation */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <motion.div
            className="bg-gradient-to-r from-amber-500 to-amber-600 w-8 h-8 rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Users className="h-4 w-4 text-white" />
          </motion.div>
          Customer Segmentation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.customerSegmentation.map((segment, idx) => (
            <motion.div 
              key={idx}
              className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
                             <div className="flex justify-center mb-3">
                 <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center">
                   {getSegmentIcon(segment.segment || segment.customer_segment || '')}
                 </div>
               </div>
               <h4 className="text-white font-semibold mb-2">{segment.segment || segment.customer_segment || 'Unknown'}</h4>
               <p className="text-3xl font-bold text-amber-400 mb-1">{segment.customer_count || 0}</p>
               <p className="text-slate-400 text-sm">customers</p>
               <div className="mt-3 pt-3 border-t border-slate-600/30">
                 <p className="text-slate-400 text-xs">Avg Balance</p>
                 <p className="text-white font-medium">${parseFloat(segment.avg_balance || '0').toLocaleString()}</p>
               </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}