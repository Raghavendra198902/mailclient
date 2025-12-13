'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('access_token', token);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-purple-500/20 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Authentication Successful!
        </h1>
        
        <p className="text-slate-300">
          Redirecting to your dashboard...
        </p>
      </motion.div>
    </div>
  );
}
