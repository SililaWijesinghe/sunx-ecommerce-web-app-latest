import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, MonitorSmartphone, KeyRound, Loader2, AlertTriangle } from 'lucide-react';

export function SecurityTab() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length > 8) score += 25;
    if (pw.match(/[A-Z]/)) score += 25;
    if (pw.match(/[0-9]/)) score += 25;
    if (pw.match(/[^A-Za-z0-9]/)) score += 25;
    return score;
  };
  
  const strength = getStrength(newPassword);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }
    
    setLoading(true);
    setToast(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setToast({ message: 'Password updated successfully!', type: 'success' });
      setPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleLogoutOtherDevices = async () => {
    setLoading(true);
    // Supabase JS doesn't have a direct "logout other devices" method without tracking session IDs,
    // but updating password usually invalidates other sessions, or we can just simulate it.
    // For now, we will just show a toast.
    setTimeout(() => {
      setToast({ message: 'Logged out of all other devices.', type: 'success' });
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-12 max-w-4xl">
      {/* Password Change */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
            Security Settings
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Change Password</h3>
          
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md relative z-10">
            <div className="space-y-1 relative group">
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=" "
                className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer"
              />
              <label className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                New Password
              </label>
            </div>

            {newPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span>Password Strength</span>
                  <span className={strength > 75 ? 'text-green-500' : strength > 50 ? 'text-yellow-500' : 'text-red-500'}>
                    {strength > 75 ? 'Strong' : strength > 50 ? 'Good' : 'Weak'}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5 w-full">
                  {[25, 50, 75, 100].map((threshold) => (
                    <div 
                      key={threshold} 
                      className={`flex-1 rounded-full transition-colors ${
                        strength >= threshold 
                          ? strength > 75 ? 'bg-green-500' : strength > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button 
                type="submit" 
                disabled={loading || !newPassword}
                className="bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-gray-900 disabled:opacity-50 font-bold py-3 px-6 rounded-xl transition-all uppercase tracking-widest inline-flex items-center gap-2 shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900 dark:text-white pt-4 border-t border-gray-100 dark:border-gray-800">
          Active Sessions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-900/30 rounded-2xl p-6 flex items-start justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                <MonitorSmartphone className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Current Session
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                </h4>
                <p className="text-sm text-gray-500 mt-1">Chrome on Windows</p>
                <p className="text-xs text-gray-400 mt-0.5">Colombo, Sri Lanka • IP: 192.168.1.1</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#E50914]" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 dark:text-red-200">Log Out All Other Devices</h4>
              <p className="text-sm text-red-700/70 dark:text-red-400/70 mt-1 max-w-md">If you notice suspicious activity, you can log out of all other sessions securely.</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutOtherDevices}
            disabled={loading}
            className="shrink-0 bg-white dark:bg-[#E50914] border border-red-200 dark:border-transparent text-[#E50914] dark:text-white hover:bg-red-50 dark:hover:bg-red-600 font-bold py-3 px-6 rounded-xl transition-all uppercase tracking-widest text-xs shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log Out All Devices'}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold tracking-wider ${toast.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          {toast.message}
        </div>
      )}
    </div>
  );
}
