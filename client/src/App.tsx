import React, { useState, useEffect } from 'react';
import { CleanAuthScreen } from './components/CleanAuthScreen';
import { CleanCustomerApp } from './components/CleanCustomerApp';
import { CleanPartnerPortal } from './components/CleanPartnerPortal';
import { AppSplashScreen } from './components/AppSplashScreen';
import { InAppUpdateBanner } from './components/InAppUpdateBanner';
import { CustomerUser, Booking, ServiceCategory } from './types';
import { fetchCategories, fetchBookings } from './api';
import { App as CapacitorApp } from '@capacitor/app';

import { StatusBar, Style } from '@capacitor/status-bar';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appMode, setAppMode] = useState<'customer' | 'partner'>('customer');
  const [openAdminDirect, setOpenAdminDirect] = useState(false);

  // Native StatusBar & Inset Configuration
  useEffect(() => {
    const initNativeUI = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        // Fallback for web browser
      }
    };
    initNativeUI();
  }, []);

  // Customer Authentication State (Clean mobile + OTP)
  // Returning users stay logged in automatically
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem('quickserve_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'cust-ananya' || parsed.name === 'Ananya Sharma') {
          localStorage.removeItem('quickserve_user');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Selected Service Location (Empty by default for new users, user chooses or GPS detects)
  const [activeCityZone, setActiveCityZone] = useState(() => {
    const saved = localStorage.getItem('quickserve_active_zone');
    // If it was the old dummy default from previous testing versions, purge it immediately
    if (!saved || saved.includes('Pari Chowk') || saved.includes('Ansal Golf')) {
      localStorage.removeItem('quickserve_active_zone');
      return '';
    }
    return saved;
  });

  // Global Data State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load backend categories and bookings
  const loadData = async () => {
    try {
      const [catsRes, bkRes] = await Promise.all([
        fetchCategories(true),
        fetchBookings()
      ]);
      setCategories(catsRes.categories || []);
      setBookings(bkRes || []);
    } catch (err) {
      console.warn('Data fetch notice:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auth Handlers
  const handleAuthSuccess = (user: CustomerUser) => {
    setCurrentUser(user);
    localStorage.setItem('quickserve_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('quickserve_user');
  };

  const handleSelectZone = (zone: string, fullAddress?: string) => {
    setActiveCityZone(zone);
    localStorage.setItem('quickserve_active_zone', zone);
    if (fullAddress) {
      localStorage.setItem('quickserve_user_address', fullAddress);
    }
  };

  // Capacitor Android Hardware Back Button Listener (Supports 3-button navigation < back)
  useEffect(() => {
    let backListener: any;
    const handleBackAction = () => {
      if (appMode === 'partner') {
        setAppMode('customer');
        setOpenAdminDirect(false);
      } else {
        try {
          CapacitorApp.minimizeApp();
        } catch (e) {}
      }
    };

    const initBackButton = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', handleBackAction);
      } catch (err) {
        // Not native platform
      }
    };
    initBackButton();

    window.addEventListener('hardwareBackButton', handleBackAction);

    return () => {
      if (backListener?.remove) backListener.remove();
      window.removeEventListener('hardwareBackButton', handleBackAction);
    };
  }, [appMode]);

  // Splash Screen
  if (showSplash) {
    return <AppSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 1. LOGIN / SIGN UP GATE
  // If user is not logged in, show clean Login / Sign Up screen
  if (!currentUser) {
    return (
      <CleanAuthScreen
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // 2. SEPARATE PARTNER PORTAL / ADMIN DESK ROUTE
  if (appMode === 'partner') {
    return (
      <div className="flex flex-col min-h-screen">
        <InAppUpdateBanner />
        <CleanPartnerPortal
          categories={categories}
          onBackToCustomer={() => {
            setOpenAdminDirect(false);
            setAppMode('customer');
          }}
          initialShowAdminDesk={openAdminDirect}
        />
      </div>
    );
  }

  // 3. CLEAN CUSTOMER APP (Default Experience)
  return (
    <div className="flex flex-col min-h-screen">
      <InAppUpdateBanner />
      <CleanCustomerApp
        currentUser={currentUser}
        categories={categories}
        bookings={bookings}
        onRefreshBookings={loadData}
        onLogout={handleLogout}
        activeCityZone={activeCityZone}
        onSelectZone={handleSelectZone}
        onSwitchToPartnerPortal={(directAdmin) => {
          setOpenAdminDirect(Boolean(directAdmin));
          setAppMode('partner');
        }}
      />
    </div>
  );
}

export default App;
