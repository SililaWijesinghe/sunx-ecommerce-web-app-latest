import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface CustomerRouteProps {
  children?: React.ReactNode;
}

export function CustomerRoute({ children }: CustomerRouteProps) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthorized' | 'customer' | 'super_admin'>('loading');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAuthStatus('unauthorized');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'super_admin') {
          setAuthStatus('super_admin');
        } else {
          // Treat everything else (including explicitly 'customer' or null) as customer access
          setAuthStatus('customer');
        }
      } catch (err) {
        console.error('Error checking customer authorization:', err);
        setAuthStatus('unauthorized');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthStatus('unauthorized');
      } else {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#E50914] mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Verifying Access...</p>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return <Navigate to="/auth" replace />;
  }

  if (authStatus === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
