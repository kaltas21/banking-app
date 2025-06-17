'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, XCircle, DollarSign, Calendar, User, Shield, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
    
    if (loanToBalanceRatio > 5 || hasMultipleLoans) return { 
      level: 'High', 
      color: 'bg-red-500/20 text-red-400 border border-red-500/30',
      icon: AlertTriangle
    };
    if (loanToBalanceRatio > 2) return { 
      level: 'Medium', 
      color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      icon: Clock
    };
    return { 
      level: 'Low', 
      color: 'bg-green-500/20 text-green-400 border border-green-500/30',
      icon: Shield
    };
  };

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/admin"
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-blue-300 border border-slate-600 hover:border-blue-500/50 rounded-lg transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
              </motion.div>
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <FileText className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Loan Applications</h1>
                  <p className="text-slate-400">Review and manage loan applications</p>
                </div>
              </motion.div>
            </div>
            <div className="text-sm text-slate-400 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-600/50">
              {session?.user?.role === 'Loan Officer' && 'Loan Officer View'}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Status Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            </motion.div>
          )}

          {applications.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center"
            >
              <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No Pending Applications</h3>
              <p className="text-slate-500">There are no loan applications requiring review at this time.</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {applications.map((application, index) => {
                const risk = getRiskLevel(application);
                const monthlyPayment = calculateMonthlyPayment(
                  parseFloat(application.loan_amount.toString()),
                  parseFloat(application.interest_rate.toString()),
                  application.term_months
                );
                const RiskIcon = risk.icon;

                return (
                  <motion.div 
                    key={application.loan_id} 
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
                    }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-500"
                  >
                    <div className="p-8">
                      {/* Application Header */}
                      <div className="flex items-start justify-between mb-8">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{application.customer_name}</h3>
                              <p className="text-slate-400">{application.customer_email}</p>
                              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                Applied on {new Date(application.application_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                        >
                          <span className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${risk.color}`}>
                            <RiskIcon className="h-4 w-4" />
                            {risk.level} Risk
                          </span>
                        </motion.div>
                      </div>

                      {/* Loan Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div 
                          className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/30"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center text-slate-400 mb-2">
                            <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                            Loan Amount
                          </div>
                          <p className="text-2xl font-bold text-white">
                            ${parseFloat(application.loan_amount.toString()).toLocaleString()}
                          </p>
                        </motion.div>

                        <motion.div 
                          className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/30"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center text-slate-400 mb-2">
                            <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                            Term & Rate
                          </div>
                          <p className="text-2xl font-bold text-white">
                            {application.term_months} months
                          </p>
                          <p className="text-sm text-slate-400">@ {application.interest_rate}%</p>
                        </motion.div>

                        <motion.div 
                          className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/30"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center text-slate-400 mb-2">
                            <DollarSign className="h-5 w-5 mr-2 text-purple-400" />
                            Monthly Payment
                          </div>
                          <p className="text-2xl font-bold text-white">
                            ${monthlyPayment.toFixed(2)}
                          </p>
                        </motion.div>

                        <motion.div 
                          className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/30"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center text-slate-400 mb-2">
                            <User className="h-5 w-5 mr-2 text-amber-400" />
                            Customer Balance
                          </div>
                          <p className="text-2xl font-bold text-white">
                            ${parseFloat(application.total_balance.toString()).toLocaleString()}
                          </p>
                        </motion.div>
                      </div>

                      {/* Risk Analysis */}
                      <motion.div 
                        className="bg-slate-700/20 p-6 rounded-2xl border border-slate-600/20 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                      >
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-400" />
                          Risk Assessment
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Account Age</p>
                            <p className="text-white font-semibold">{Math.floor(application.account_age_days / 30)} months</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Active Loans</p>
                            <p className="text-white font-semibold">{application.active_loans_count}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Avg Transaction</p>
                            <p className="text-white font-semibold">
                              ${parseFloat(application.average_transaction_amount.toString()).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                          onClick={() => handleLoanDecision(application.loan_id, 'approve')}
                          disabled={processingId === application.loan_id}
                          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={processingId !== application.loan_id ? { scale: 1.02 } : {}}
                          whileTap={processingId !== application.loan_id ? { scale: 0.98 } : {}}
                        >
                          {processingId === application.loan_id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )}
                          {processingId === application.loan_id ? 'Processing...' : 'Approve Loan'}
                        </motion.button>

                        <motion.button
                          onClick={() => handleLoanDecision(application.loan_id, 'reject')}
                          disabled={processingId === application.loan_id}
                          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={processingId !== application.loan_id ? { scale: 1.02 } : {}}
                          whileTap={processingId !== application.loan_id ? { scale: 0.98 } : {}}
                        >
                          {processingId === application.loan_id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                          {processingId === application.loan_id ? 'Processing...' : 'Reject Loan'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}