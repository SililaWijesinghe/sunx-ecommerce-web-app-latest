import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface IdentityGuardProps {
  children?: React.ReactNode;
  allowedRole: 'super_admin' | 'customer';
}

export function IdentityGuard({ children, allowedRole }: IdentityGuardProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [authStatus, setAuthStatus] = useState<'unauthorized' | 'super_admin' | 'customer' | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkIdentity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) {
            setAuthStatus('unauthorized');
            setIsVerifying(false);
          }
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (isMounted) {
          if (profile?.role === 'super_admin') {
            setAuthStatus('super_admin');
          } else {
            setAuthStatus('customer');
          }
        }
      } catch (err) {
        console.error('Error checking identity clearance:', err);
        if (isMounted) setAuthStatus('unauthorized');
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    checkIdentity();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthStatus('unauthorized');
      } else {
        // Re-verify on auth change
        setIsVerifying(true);
        checkIdentity();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isVerifying && authStatus !== null && authStatus !== 'unauthorized') {
      if (authStatus !== allowedRole) {
        if (allowedRole === 'super_admin' && authStatus === 'customer') {
          toast.error('Unauthorized Access');
        }
      }
    }
  }, [isVerifying, authStatus, allowedRole]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-gray-900 border border-gray-800 flex items-center justify-center rounded-sm shadow-inner mb-6">
            <ShieldCheck className="w-10 h-10 text-[#E50914]" />
          </div>
          <p className="text-white font-bold uppercase tracking-[0.3em] text-sm mb-2">Authenticating</p>
          <p className="text-gray-500 font-medium tracking-widest text-xs uppercase">Identity Clearance...</p>
        </motion.div>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return <Navigate to="/auth" replace />;
  }

  if (authStatus !== allowedRole) {
    if (authStatus === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    if (authStatus === 'customer') {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
