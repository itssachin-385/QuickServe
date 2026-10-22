import React, { useState, useEffect } from 'react';
import { CleanAuthScreen } from './components/CleanAuthScreen';
import { CleanCustomerApp } from './components/CleanCustomerApp';
import { CleanPartnerPortal } from './components/CleanPartnerPortal';
import { AppSplashScreen } from './components/AppSplashScreen';
import { InAppUpdateBanner } from './components/InAppUpdateBanner';
import { OfflineScreen } from './components/OfflineScreen';
import { CustomerUser, Booking, ServiceCategory } from './types';
import { fetchCategories, fetchBookings, API_BASE } from './api';
import { App as CapacitorApp } from '@capacitor/app';

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { reverseGeocodeGoogle } from './utils/googleMapsService';

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
        if (
          !parsed ||
          parsed.id === 'cust-ananya' ||
          parsed.name === 'Ananya Sharma' ||
          parsed.name === 'QuickServe Customer' ||
          (parsed.phone && parsed.phone.includes('9570151834')) ||
          (parsed.phone && parsed.phone.includes('95701 51834')) ||
          (parsed.id && typeof parsed.id === 'string' && parsed.id.startsWith('guest'))
        ) {
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

  // Online / Offline Real-time State (Strictly Online-Only like Pronto/Rapido)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
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

  // Real-time Network Connectivity Monitoring (Strictly Online-Only)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial ping check
    const verifyConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const base = API_BASE.replace(/\/api\/?$/, '');
        const res = await fetch(`${base}/api/ping`, {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(3500)
        }).catch(() => null);

        if (!res) {
          const googleTest = await fetch('https://www.google.com/favicon.ico', {
            mode: 'no-cors',
            cache: 'no-store',
            signal: AbortSignal.timeout(3000)
          }).catch(() => null);

          if (!googleTest && !navigator.onLine) {
            setIsOnline(false);
          }
        }
      } catch (e) {
        if (!navigator.onLine) setIsOnline(false);
      }
    };
    verifyConnectivity();

    let resumeListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          if (!navigator.onLine) {
            setIsOnline(false);
          } else {
            setIsOnline(true);
            loadData();
          }
        }
      }).then(handle => {
        resumeListener = handle;
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (resumeListener && typeof resumeListener.remove === 'function') {
        resumeListener.remove();
      }
    };
  }, []);

  // Automatic Live GPS Detection on App Launch & Resume
  useEffect(() => {
    let isCancelled = false;

    const detectLiveLocationOnStart = async () => {
      try {
        let lat: number | null = null;
        let lon: number | null = null;

        // Stage 1: Try Native Hardware GPS with Fast Network Fallback
        if (Capacitor.isNativePlatform()) {
          try {
            const perm = await Geolocation.checkPermissions();
            if (perm.location === 'granted') {
              const pos = await Promise.race([
                Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
              ]).catch(() => {
                return Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000, maximumAge: 0 });
              });

              if (pos?.coords) {
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
              }
            }
          } catch (e) {}
        }

        // Stage 2: Browser Navigator Geolocation Fallback
        if (lat === null || lon === null) {
          if (navigator.geolocation) {
            const browserPos = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
                () => {
                  navigator.geolocation.getCurrentPosition(
                    (p2) => resolve({ lat: p2.coords.latitude, lon: p2.coords.longitude }),
                    () => resolve(null),
                    { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
                  );
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
              );
            });

            if (browserPos) {
              lat = browserPos.lat;
              lon = browserPos.lon;
            }
          }
        }

        if (!isCancelled && lat !== null && lon !== null) {
          const res = await reverseGeocodeGoogle(lat, lon);
          if (res && res.areaCity) {
            setActiveCityZone(res.areaCity);
            localStorage.setItem('quickserve_active_zone', res.areaCity);
            const fullAddr = [
              res.houseNo ? `House ${res.houseNo}` : '',
              res.streetGali,
              res.landmark ? `Near ${res.landmark}` : '',
              res.areaCity
            ].filter(Boolean).join(', ');
            localStorage.setItem('quickserve_user_address', fullAddr);
          }
        }
      } catch (err) {
        console.warn('Auto live location detection notice:', err);
      }
    };

    detectLiveLocationOnStart();

    // Auto re-detect when user brings app back to foreground (e.g. travelled somewhere outdoors)
    let resumeListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive && !isCancelled) {
          detectLiveLocationOnStart();
        }
      }).then(handle => {
        resumeListener = handle;
      }).catch(() => {});
    }

    return () => {
      isCancelled = true;
      if (resumeListener && typeof resumeListener.remove === 'function') {
        resumeListener.remove();
      }
    };
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
        return;
      }

      // Dispatch custom back event so active views/modals can handle it hierarchically
      const backEvt = new CustomEvent('quickserve:back', { cancelable: true });
      const handled = !window.dispatchEvent(backEvt);
      if (handled) {
        return; // Handled by modal, filter, or sub-tab
      }

      try {
        CapacitorApp.minimizeApp();
      } catch (e) {}
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

  // Strict Online Enforcement (Like Pronto/Rapido/Swiggy)
  if (!isOnline) {
    return (
      <OfflineScreen
        onRetry={async () => {
          setIsOnline(true);
          await loadData();
        }}
      />
    );
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
