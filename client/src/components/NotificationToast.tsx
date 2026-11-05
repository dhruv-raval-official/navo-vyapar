import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Bell, X } from './Icons';

export default function NotificationToast() {
  const notification = useGameStore((s) => s.notification);
  const setNotification = useGameStore((s) => s.setNotification);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 350 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92vw]"
        >
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-emerald-900 border border-gold-500/50 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3">
            <Bell className="w-4 h-4 text-gold-400 shrink-0" />
            <p className="text-white text-xs md:text-sm font-medium flex-1 leading-snug">
              {notification}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="text-white/60 hover:text-white p-1 leading-none shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
