import React from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Car
} from 'lucide-react';
import { AppNotificationItem, notificationService } from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotificationItem[];
  onTrackBooking?: (bookingId: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onTrackBooking,
  onMarkAllRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimestamp = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: AppNotificationItem['type']) => {
    switch (type) {
      case 'order_confirmed':
        return <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">⚡</div>;
      case 'partner_arriving':
        return <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shrink-0">🚗</div>;
      case 'service_started':
        return <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">🛠</div>;
      case 'service_completed':
        return <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base shrink-0">✅</div>;
      default:
        return <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0">🎉</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bell className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Order updates, OTPs & system alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100/80">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 text-xs">No notifications yet</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You're all caught up! Order updates and arrival alerts will appear here.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`pt-3 first:pt-0 transition-all ${!item.read ? 'bg-emerald-50/30 -mx-2 px-2 py-2 rounded-2xl' : ''}`}
                onClick={() => notificationService.markAsRead(item.id)}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(item.type)}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {item.body}
                    </p>

                    {/* Prominent Start OTP Callout if available */}
                    {item.startOtp && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 text-white shadow-xs">
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Start OTP:</span>
                        <span className="font-mono font-black text-sm text-white tracking-widest">{item.startOtp}</span>
                      </div>
                    )}

                    {/* Action button if tied to a booking */}
                    {item.bookingId && onTrackBooking && (
                      <div className="pt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notificationService.markAsRead(item.id);
                            onClose();
                            onTrackBooking(item.bookingId!);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-xs active:scale-95 transition-all"
                        >
                          <span>Track Live Status</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400">
              {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'} stored locally
            </span>
            <button
              onClick={onClearAll}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
