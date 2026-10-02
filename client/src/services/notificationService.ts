import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface BookingNotificationPayload {
  id: string;
  bookingReference?: string;
  serviceTitle?: string;
  partnerName?: string;
  partnerRating?: number;
  startOtp?: string;
  amount?: number;
  paymentMethod?: string;
  etaMinutes?: number;
}

export interface InAppToast {
  id: string;
  type: 'order_confirmed' | 'partner_arriving' | 'service_started' | 'service_completed' | 'welcome';
  title: string;
  body: string;
  startOtp?: string;
  bookingId?: string;
  timestamp: number;
}

export interface AppNotificationItem {
  id: string;
  type: 'order_confirmed' | 'partner_arriving' | 'service_started' | 'service_completed' | 'welcome';
  title: string;
  body: string;
  startOtp?: string;
  bookingId?: string;
  timestamp: number;
  read: boolean;
}

type NotificationListener = (toast: InAppToast) => void;
type HistoryListener = (history: AppNotificationItem[]) => void;

class NotificationService {
  private isInitialized = false;
  private listeners: Set<NotificationListener> = new Set();
  private historyListeners: Set<HistoryListener> = new Set();
  private notificationCounter = 1000;

  constructor() {
    this.initNotifications();
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeHistory(listener: HistoryListener): () => void {
    this.historyListeners.add(listener);
    return () => this.historyListeners.delete(listener);
  }

  public getHistory(): AppNotificationItem[] {
    try {
      const stored = localStorage.getItem('quickserve_notifications_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }

    // Default seed welcome notification
    const seed: AppNotificationItem[] = [
      {
        id: 'notif-welcome',
        type: 'welcome',
        title: '🎉 Welcome to QuickServe!',
        body: '₹250 welcome bonus credited to your wallet. 15-minute doorstep domestic help active in your area.',
        timestamp: Date.now() - 3600000,
        read: false,
      }
    ];
    try {
      localStorage.setItem('quickserve_notifications_history', JSON.stringify(seed));
    } catch {}
    return seed;
  }

  public addNotificationItem(item: Omit<AppNotificationItem, 'id' | 'timestamp' | 'read'>) {
    const history = this.getHistory();
    const newItem: AppNotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      read: false,
    };
    const updated = [newItem, ...history.filter(h => h.id !== newItem.id)].slice(0, 30);
    try {
      localStorage.setItem('quickserve_notifications_history', JSON.stringify(updated));
    } catch {}
    this.historyListeners.forEach(fn => fn(updated));
  }

  public markAllAsRead() {
    const history = this.getHistory().map(h => ({ ...h, read: true }));
    try {
      localStorage.setItem('quickserve_notifications_history', JSON.stringify(history));
    } catch {}
    this.historyListeners.forEach(fn => fn(history));
  }

  public markAsRead(id: string) {
    const history = this.getHistory().map(h => h.id === id ? { ...h, read: true } : h);
    try {
      localStorage.setItem('quickserve_notifications_history', JSON.stringify(history));
    } catch {}
    this.historyListeners.forEach(fn => fn(history));
  }

  public clearHistory() {
    try {
      localStorage.setItem('quickserve_notifications_history', JSON.stringify([]));
    } catch {}
    this.historyListeners.forEach(fn => fn([]));
  }

  public getUnreadCount(): number {
    return this.getHistory().filter(h => !h.read).length;
  }

  private dispatchInApp(toast: InAppToast) {
    this.listeners.forEach((listener) => {
      try {
        listener(toast);
      } catch (e) {
        console.error('Error in notification listener:', e);
      }
    });
  }

  public async initNotifications(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (Capacitor.isNativePlatform()) {
        // Create high-priority notification channel for Android
        await LocalNotifications.createChannel({
          id: 'quickserve_orders',
          name: 'QuickServe Booking Updates',
          description: 'Instant alerts for booking confirmation, partner arrival, and start OTP.',
          importance: 5,
          visibility: 1,
          vibration: true,
          lights: true,
          lightColor: '#059669',
        });

        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          this.isInitialized = req.display === 'granted';
        } else {
          this.isInitialized = true;
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch {
            // Ignore web permission rejection
          }
        }
        this.isInitialized = Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('Notification initialization notice:', err);
    }

    return this.isInitialized;
  }

  private getNextId(): number {
    this.notificationCounter += 1;
    return this.notificationCounter;
  }

  private async triggerSystemNotification(title: string, body: string, extra?: Record<string, unknown>) {
    // 1. Native Mobile Notification
    if (Capacitor.isNativePlatform()) {
      try {
        const id = this.getNextId();
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              channelId: 'quickserve_orders',
              smallIcon: 'ic_launcher_foreground',
              schedule: { at: new Date(Date.now() + 200) },
              extra: extra || {},
            },
          ],
        });
      } catch (err) {
        console.warn('LocalNotifications schedule fallback:', err);
      }
    }

    // 2. Web Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/images/quickserve_app_icon.png',
          badge: '/images/quickserve_app_icon.png',
        });
      } catch {
        // Browser notification error fallback
      }
    }
  }

  // 1. Booking Confirmed Instant Notification
  public async notifyBookingConfirmed(booking: BookingNotificationPayload) {
    await this.initNotifications();

    const title = `⚡ Booking Confirmed! #${booking.bookingReference || booking.id}`;
    const otpText = booking.startOtp ? ` Start OTP: ${booking.startOtp}.` : '';
    const proText = booking.partnerName ? ` Partner: ${booking.partnerName}.` : ' Partner assigned.';
    const payText = booking.paymentMethod === 'pay_after_work' ? ' [Payment After Work]' : '';
    const body = `${booking.serviceTitle || 'Service'}${proText}${otpText}${payText}`;

    // Add to Persistent In-App Notification Center History
    this.addNotificationItem({
      type: 'order_confirmed',
      title,
      body,
      startOtp: booking.startOtp,
      bookingId: booking.id,
    });

    // Dispatch In-App Banner
    this.dispatchInApp({
      id: `toast-${Date.now()}`,
      type: 'order_confirmed',
      title,
      body,
      startOtp: booking.startOtp,
      bookingId: booking.id,
      timestamp: Date.now(),
    });

    // Dispatch Native / Push Notification
    await this.triggerSystemNotification(title, body, {
      type: 'order_confirmed',
      bookingId: booking.id,
      startOtp: booking.startOtp,
    });
  }

  // 2. Partner Arriving Notification (Scheduled or simulated)
  public async notifyPartnerArriving(booking: BookingNotificationPayload) {
    await this.initNotifications();

    const title = `🚀 Partner Reaching Soon!`;
    const proName = booking.partnerName || 'QuickServe Partner';
    const body = `${proName} is reaching your location in ~5 mins. Please keep Start OTP [${booking.startOtp || '****'}] ready!`;

    this.addNotificationItem({
      type: 'partner_arriving',
      title,
      body,
      startOtp: booking.startOtp,
      bookingId: booking.id,
    });

    this.dispatchInApp({
      id: `toast-arr-${Date.now()}`,
      type: 'partner_arriving',
      title,
      body,
      startOtp: booking.startOtp,
      bookingId: booking.id,
      timestamp: Date.now(),
    });

    await this.triggerSystemNotification(title, body, {
      type: 'partner_arriving',
      bookingId: booking.id,
    });
  }

  // 3. Service Started
  public async notifyServiceStarted(booking: BookingNotificationPayload) {
    await this.initNotifications();

    const title = `🛠 Service Started!`;
    const body = `Start OTP verified by ${booking.partnerName || 'Partner'}. Your ${booking.serviceTitle || 'service'} is in progress.`;

    this.addNotificationItem({
      type: 'service_started',
      title,
      body,
      bookingId: booking.id,
    });

    this.dispatchInApp({
      id: `toast-start-${Date.now()}`,
      type: 'service_started',
      title,
      body,
      bookingId: booking.id,
      timestamp: Date.now(),
    });

    await this.triggerSystemNotification(title, body, {
      type: 'service_started',
      bookingId: booking.id,
    });
  }

  // 4. Service Completed
  public async notifyServiceCompleted(booking: BookingNotificationPayload) {
    await this.initNotifications();

    const title = `✅ Service Completed!`;
    const amount = booking.amount ? `₹${booking.amount}` : '';
    const body = `Service finished. Please verify work and complete payment ${amount} to partner.`;

    this.addNotificationItem({
      type: 'service_completed',
      title,
      body,
      bookingId: booking.id,
    });

    this.dispatchInApp({
      id: `toast-comp-${Date.now()}`,
      type: 'service_completed',
      title,
      body,
      bookingId: booking.id,
      timestamp: Date.now(),
    });

    await this.triggerSystemNotification(title, body, {
      type: 'service_completed',
      bookingId: booking.id,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
