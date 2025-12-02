'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto remove setelah 3 detik
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Container Toast */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => removeNotification(notif.id)}
            className={`pointer-events-auto transform transition-all duration-300 animate-in slide-in-from-right fade-in p-4 rounded-xl shadow-2xl border backdrop-blur-md cursor-pointer flex items-center gap-3
              ${notif.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100' : ''}
              ${notif.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' : ''}
              ${notif.type === 'info' ? 'bg-blue-900/80 border-blue-500/50 text-blue-100' : ''}
            `}
          >
            {/* Icon */}
            <div className={`p-1 rounded-full ${
                notif.type === 'success' ? 'bg-green-500' : 
                notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
                {notif.type === 'success' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                {notif.type === 'error' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                {notif.type === 'info' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            </div>
            
            <p className="text-sm font-medium">{notif.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Hook Custom
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}