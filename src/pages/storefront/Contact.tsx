import React from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="min-h-[90vh] bg-[#F5F5F7] dark:bg-[#0B0B0E] pt-20 pb-20 md:py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
        
        {/* Contact Info */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4"
          >
            Get In Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 text-lg mb-10"
          >
            Have a question about a product, order, or just want to chat about hardware? We're here to help.
          </motion.p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-full flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#E50914]" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-1">Headquarters</h3>
                <p className="text-gray-600 dark:text-gray-400">123 Tech Boulevard, Silicon Valley, CA 94043</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-1">Email Us</h3>
                <p className="text-gray-600 dark:text-gray-400">support@sunx.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-full flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-1">Call Us</h3>
                <p className="text-gray-600 dark:text-gray-400">+1 (800) 123-4567</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm mt-8 md:mt-0"
        >
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-[#E50914]" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">Send a Message</h2>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Name</label>
                <input type="text" className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E50914] tap-target" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Email</label>
                <input type="email" className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E50914] tap-target" placeholder="john@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Subject</label>
              <input type="text" className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E50914] tap-target" placeholder="How can we help?" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Message</label>
              <textarea rows={4} className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E50914] tap-target" placeholder="Your message here..."></textarea>
            </div>
            <button className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm py-4 rounded-lg flex items-center justify-center gap-2 transition-colors tap-target mt-2">
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
