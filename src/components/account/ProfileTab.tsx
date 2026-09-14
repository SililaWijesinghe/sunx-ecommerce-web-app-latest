import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Loader2, MapPin, Camera, User, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export function ProfileTab({ profile, setProfile }: { profile: any; setProfile?: (p: any) => void }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line_1: profile?.address_line_1 || '',
    city: profile?.city || '',
    postal_code: profile?.postal_code || '',
    country: profile?.country || '',
  });

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (data && !error) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address_line_1: data.address_line_1 || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          country: data.country || '',
        });
        setAvatarUrl(data.avatar_url || '');
        if (setProfile) setProfile(data);
      }
    }
    loadProfile();
  }, []); // Run on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Immediate local preview
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      setIsUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;
      
      if (setProfile) {
        setProfile((prev: any) => ({
          ...prev,
          avatar_url: publicUrl
        }));
      }
      
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      if (setProfile) {
        setProfile((prev: any) => ({
          ...prev,
          ...formData,
        }));
      }

      setSaveSuccess(true);
      toast.success('Profile updated successfully!');
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
          Profile & Addresses
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Card 1: Personal Details */}
        <div className="bg-white dark:bg-[#0a0a0c] rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800/50 shadow-sm">
          <h3 className="text-lg font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-6">Personal Details</h3>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Uploader */}
            <div className="flex flex-col items-center shrink-0">
              <div 
                onClick={handleAvatarClick}
                className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 group cursor-pointer shadow-sm"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <motion.div 
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-8 h-8 text-white" />
                </motion.div>

                <AnimatePresence>
                  {isUploading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    >
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-4">Profile Photo</span>
            </div>

            {/* Basic Info Inputs */}
            <div className="flex-1 w-full space-y-6">
              <div className="space-y-1 relative group">
                <input 
                  type="text" 
                  name="full_name"
                  id="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                />
                <label htmlFor="full_name" className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                  Full Name
                </label>
              </div>
              
              <div className="space-y-1 relative group">
                <input 
                  type="text" 
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                />
                <label htmlFor="phone" className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                  Contact Number
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Shipping Details */}
        <div className="bg-white dark:bg-[#0a0a0c] rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800/50 shadow-sm">
           <h3 className="text-lg font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-6">Shipping Details</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1 relative group md:col-span-2">
                <input 
                  type="text" 
                  name="address_line_1"
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                />
                <label htmlFor="address_line_1" className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                  Address Line 1
                </label>
              </div>

              <div className="space-y-1 relative group">
                <input 
                  type="text" 
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                />
                <label htmlFor="city" className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                  City
                </label>
              </div>

              <div className="space-y-1 relative group">
                <input 
                  type="text" 
                  name="postal_code"
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                />
                <label htmlFor="postal_code" className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                  Postal Code
                </label>
              </div>

              <div className="space-y-1 relative group md:col-span-2">
                <input 
                  type="text" 
                  name="country"
                  id="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder=" "
                  className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                />
                <label htmlFor="country" className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                  Country
                </label>
              </div>
           </div>
        </div>

        <div className="pt-4">
          <motion.button 
            type="submit" 
            disabled={isSaving || saveSuccess}
            whileTap={!isSaving && !saveSuccess ? { scale: 0.98 } : {}}
            className={`w-full md:w-auto min-w-[200px] font-bold py-4 px-8 rounded-xl transition-all uppercase tracking-widest inline-flex justify-center items-center gap-2 shadow-lg ${
              saveSuccess 
                ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                : 'bg-[#E50914] hover:bg-red-700 text-white shadow-red-900/20 hover:shadow-red-900/40'
            } disabled:opacity-80`}
          >
            <AnimatePresence mode="wait">
              {saveSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Saved
                </motion.div>
              ) : isSaving ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Save className="w-5 h-5" /> Save Changes
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
