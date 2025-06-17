'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Building2, Shield, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.userType === 'employee') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
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
        delayChildren: 0.3,
        staggerChildren: 0.2
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

      {/* Header with Logo */}
      <motion.header 
        className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="MK Bank Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  MK Bank
                </h1>
                <p className="text-slate-400 text-sm">Your Trusted Financial Partner</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex space-x-4"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                href="/login"
                className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
              >
                Open Account
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.div 
        className="relative py-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block"
              >
                <Building2 className="h-16 w-16 text-amber-400 mx-auto mb-6" />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-white"
            >
              Trusted Banking
              <br />
              <span className="text-slate-300">
                Since 1995
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl mb-12 text-slate-400 max-w-3xl mx-auto leading-relaxed"
            >
              Experience secure, reliable banking services with over 25 years of excellence. 
              Your financial security and peace of mind are our highest priorities.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="group inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  Access Your Account
                  <motion.div
                    className="ml-3"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className="inline-flex items-center bg-slate-800/50 backdrop-blur-sm text-white px-12 py-4 rounded-xl font-semibold text-lg border border-slate-600/50 hover:border-amber-500/50 hover:bg-slate-700/50 transition-all duration-300"
                >
                  Start Your Journey
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="text-blue-400">MK Bank?</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Built on a foundation of trust, security, and personalized service for every customer
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Shield,
                title: "Secure & Protected",
                description: "FDIC insured deposits with advanced security measures to protect your funds",
                gradient: "from-blue-500 to-blue-600"
              },
              {
                icon: Clock,
                title: "Always Available",
                description: "24/7 online banking access with reliable customer support when you need it",
                gradient: "from-slate-500 to-slate-600"
              },
              {
                icon: TrendingUp,
                title: "Financial Growth",
                description: "Competitive rates and personalized financial guidance to help you succeed",
                gradient: "from-blue-600 to-slate-600"
              },
              {
                icon: Building2,
                title: "Established Trust",
                description: "Over 25 years of serving our community with integrity and excellence",
                gradient: "from-slate-600 to-blue-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
                }}
                className="group relative"
              >
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 h-full">
                  <motion.div
                    className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div 
        className="bg-gradient-to-r from-blue-900/30 via-slate-800/50 to-slate-900/30 backdrop-blur-sm py-20 border-y border-slate-700/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Bank with <span className="text-blue-400">Confidence?</span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have trusted MK Bank with their financial needs since 1995
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/register"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-12 py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
              >
                Open Your Account Today
                <motion.div
                  className="ml-3"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowRight className="h-6 w-6" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-slate-900/90 backdrop-blur-sm text-white py-12 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/logo.png"
                alt="MK Bank Logo"
                width={48}
                height={48}
                className="mr-4 opacity-90"
              />
              <div className="text-left">
                <span className="text-2xl font-bold text-white">
                  MK Bank
                </span>
                <p className="text-slate-400 text-sm">Your Trusted Financial Partner</p>
              </div>
            </div>
            <p className="text-slate-500">
              &copy; 2025 MK Bank. All rights reserved. | FDIC Insured | Equal Housing Lender
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}