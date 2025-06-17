'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

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
        return <Clock className="h-5 w-5 text-amber-400" />;
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Approved':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Rejected':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Paid Off':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  // Standard interest rate (in real app, this would be calculated based on credit score, etc.)
  const STANDARD_INTEREST_RATE = 5.5;

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
            {!showApplicationForm && (
              <motion.button
                onClick={() => setShowApplicationForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-5 w-5" />
                <span>Apply for Loan</span>
              </motion.button>
            )}
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
          {error && (
            <motion.div 
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              className="bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}

          {showApplicationForm ? (
            /* Loan Application Form */
            <motion.div 
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl max-w-3xl mx-auto"
              variants={itemVariants}
            >
              <motion.div 
                className="flex items-center space-x-4 mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <FileText className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Loan Application</h2>
                  <p className="text-slate-400">Apply for a personal loan today</p>
                </div>
              </motion.div>

              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Loan Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        step="100"
                        min="1000"
                        max="50000"
                        value={formData.loanAmount}
                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all duration-300"
                        placeholder="10,000"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Minimum: $1,000 | Maximum: $50,000</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Loan Term
                    </label>
                    <select
                      value={formData.termMonths}
                      onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-300"
                      required
                    >
                      <option value="12" className="bg-slate-800">12 months</option>
                      <option value="24" className="bg-slate-800">24 months</option>
                      <option value="36" className="bg-slate-800">36 months</option>
                      <option value="48" className="bg-slate-800">48 months</option>
                      <option value="60" className="bg-slate-800">60 months</option>
                    </select>
                  </div>
                </div>

                {/* Loan Preview */}
                {formData.loanAmount && (
                  <motion.div 
                    className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Loan Preview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Interest Rate</p>
                        <p className="text-white font-semibold">{STANDARD_INTEREST_RATE}% APR</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Monthly Payment</p>
                        <p className="text-green-400 font-semibold">
                          ${calculateMonthlyPayment(
                            parseFloat(formData.loanAmount) || 0,
                            STANDARD_INTEREST_RATE,
                            parseInt(formData.termMonths)
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total Interest</p>
                        <p className="text-amber-400 font-semibold">
                          ${(calculateMonthlyPayment(
                            parseFloat(formData.loanAmount) || 0,
                            STANDARD_INTEREST_RATE,
                            parseInt(formData.termMonths)
                          ) * parseInt(formData.termMonths) - (parseFloat(formData.loanAmount) || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1 py-3 px-6 border border-slate-600 text-slate-300 rounded-xl hover:border-slate-500 hover:text-slate-200 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      'Submit Application'
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </motion.div>
          ) : (
            /* Loans List */
            <>
              <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-400" />
                  Your Loans
                </h1>
                <p className="text-slate-400">Manage your loan applications and payments</p>
              </motion.div>

              {loans.length === 0 ? (
                <motion.div 
                  className="text-center py-16"
                  variants={itemVariants}
                >
                  <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No loans found</h3>
                  <p className="text-slate-500 mb-6">You haven&apos;t applied for any loans yet.</p>
                  <motion.button
                    onClick={() => setShowApplicationForm(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Apply for Your First Loan
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                >
                  {loans.map((loan, index) => (
                    <motion.div
                      key={loan.loan_id}
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02, 
                        rotateY: 5,
                        boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
                      }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-500"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                          {getStatusIcon(loan.status)}
                          <span className="ml-2">{loan.status}</span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-400">Loan Amount</p>
                          <p className="text-2xl font-bold text-white">${parseFloat(loan.loan_amount.toString()).toFixed(2)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Interest Rate</p>
                            <p className="text-amber-400 font-semibold">{loan.interest_rate}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Term</p>
                            <p className="text-slate-300 font-semibold">{loan.term_months} months</p>
                          </div>
                        </div>

                        {loan.monthly_payment && (
                          <div>
                            <p className="text-sm text-slate-400">Monthly Payment</p>
                            <p className="text-green-400 font-semibold">${parseFloat(loan.monthly_payment.toString()).toFixed(2)}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-slate-400">Applied On</p>
                          <p className="text-slate-300">{new Date(loan.application_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}