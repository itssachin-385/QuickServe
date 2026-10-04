import React, { useState, useEffect } from 'react';
import { Navbar, ActiveModule } from './components/Navbar';
import { CustomerWebsite } from './components/CustomerWebsite';
import { CustomerApp } from './components/CustomerApp';
import { ProfessionalApp } from './components/ProfessionalApp';
import { ProfessionalRegister } from './components/ProfessionalRegister';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { MarketplaceSimulator } from './components/MarketplaceSimulator';
import { AuthModal } from './components/AuthModal';
import { RazorpayModal } from './components/RazorpayModal';
import { LocationModal } from './components/LocationModal';
import { ServiceCategory, ServiceZone, Professional, Booking, CustomerUser } from './types';
import { fetchCategories, fetchZones, fetchProfessionals, fetchBookings } from './api';
import { resolveNoidaOrGreaterNoida, sanitizeNoidaLocationStorage } from './utils/locationHelper';
import { reverseGeocodeGoogle } from './utils/googleMapsService';
import { OnboardingLoginScreen } from './components/OnboardingLoginScreen';
import { AppSplashScreen } from './components/AppSplashScreen';
import { App as CapacitorApp } from '@capacitor/app';

export function App() {
  const isMobileOrNative = typeof window !== 'undefined' && Boolean(
    (window as any).Capacitor?.isNativePlatform?.() || 
    window.innerWidth < 768 ||
    window.location.search.includes('app')
  );

  const [showSplash, setShowSplash] = useState(true);
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    return isMobileOrNative ? 'customer_app' : 'website';
  });
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState(false);
  const [activeCityZone, setActiveCityZone] = useState(() => {
    return localStorage.getItem('quickserve_active_zone') || 'Ansal Golf Links 1, Greater Noida';
  });
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Onboarding screen state (QuickServe first screen if not logged in)
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState<boolean>(() => {
    return sessionStorage.getItem('quickserve_skipped_onboarding') === 'true';
  });

  // Customer Authentication State (Clean phone + OTP authentication)
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem('quickserve_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically purge old hardcoded Ananya demo user if present in device storage
        if (parsed.id === 'cust-ananya' || parsed.name === 'Ananya Sharma' || parsed.phone === '+91 98450 11223') {
          localStorage.removeItem('quickserve_user');
          return null;
        }
        if (parsed.phone) {
          const cleanDigits = parsed.phone.replace(/\D/g, '').slice(-10);
          if (cleanDigits) {
            parsed.phone = `+91 ${cleanDigits}`;
          }
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    // Clean default: No hardcoded user, starts logged out
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = (user: CustomerUser) => {
    setCurrentUser(user);
    localStorage.setItem('quickserve_user', JSON.stringify(user));
    setIsAuthModalOpen(false);
    setHasSkippedOnboarding(true);
    sessionStorage.setItem('quickserve_skipped_onboarding', 'true');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('quickserve_user');
    sessionStorage.removeItem('quickserve_skipped_onboarding');
    setHasSkippedOnboarding(false);
  };

  // Global State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Load
  const loadData = async () => {
    try {
      const [catsRes, zonesRes, prosRes, bkRes] = await Promise.all([
        fetchCategories(true),
        fetchZones(),
        fetchProfessionals({ all: true }),
        fetchBookings()
      ]);
      setCategories(catsRes.categories || []);
      setZones(zonesRes.zones || []);
      setProfessionals(prosRes || []);
      setBookings(bkRes || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Sanitize any existing cached storage from old runs
    sanitizeNoidaLocationStorage();
    try {
      localStorage.removeItem('quickserve_guest_booking_ids');
      localStorage.removeItem('quickserve_active_tracking_id');
      const activeZ = localStorage.getItem('quickserve_active_zone');
      if (activeZ && /ber sarai|galileo|indiranagar|shafipur|aishani|ifs villas/i.test(activeZ)) {
        localStorage.setItem('quickserve_active_zone', 'Ansal Golf Links 1, Greater Noida');
        setActiveCityZone('Ansal Golf Links 1, Greater Noida');
      }
    } catch {}

    // Check saved location or attempt auto-detect via GPS / IP
    const fetchIpLocation = async () => {
      try {
        const ipRes = await fetch('https://ipwho.is/');
        const ipData = await ipRes.json();
        if (ipData && ipData.success) {
          const rawCity = ipData.city || '';
          const resolved = resolveNoidaOrGreaterNoida({}, `${rawCity} ${ipData.region || ''} ${ipData.postal || ''}`);
          const ipLabel = resolved.formattedArea;
          setActiveCityZone(ipLabel);
          localStorage.setItem('quickserve_active_zone', ipLabel);
        }
      } catch (e) {
        // keep fallback
      }
    };

    const savedZone = localStorage.getItem('quickserve_active_zone');
    // If previously saved zone exists and is clean, load it; otherwise detect fresh via GPS
    if (savedZone && !savedZone.toLowerCase().includes('dadri') && !savedZone.toLowerCase().includes('shafipur') && !savedZone.toLowerCase().includes('indiranagar')) {
      setActiveCityZone(savedZone);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            // Google Maps Platform reverse geocoding
            const googleRes = await reverseGeocodeGoogle(latitude, longitude);
            const fullZone = googleRes.areaCity;
            setActiveCityZone(fullZone);
            localStorage.setItem('quickserve_active_zone', fullZone);

            // Pre-seed doorstep details if not present yet
            if (!localStorage.getItem('quickserve_doorstep_details') && (googleRes.streetGali || googleRes.houseNo)) {
              localStorage.setItem('quickserve_doorstep_details', JSON.stringify({
                houseNo: googleRes.houseNo || '',
                streetGali: googleRes.streetGali || '',
                landmark: googleRes.landmark || '',
                areaCity: googleRes.areaCity,
                addressTag: 'Home',
                fullCompleteAddress: [googleRes.houseNo, googleRes.streetGali, googleRes.landmark ? `(${googleRes.landmark})` : '', googleRes.areaCity].filter(Boolean).join(', ')
              }));
            }
          } catch (e) {
            fetchIpLocation();
          }
        },
        () => {
          fetchIpLocation();
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      fetchIpLocation();
    }
  }, []);

  // Capacitor Android Hardware Back Button (<) Listener
  useEffect(() => {
    let backListener: any;
    let lastBackPress = 0;

    const initBackButton = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', () => {
          // 1. Check if App-level modals are open
          if (isLocationModalOpen) {
            setIsLocationModalOpen(false);
            return;
          }
          if (isAuthModalOpen) {
            setIsAuthModalOpen(false);
            return;
          }
          if (isGatewayModalOpen) {
            setIsGatewayModalOpen(false);
            return;
          }

          // 2. Dispatch custom event so child screens (CustomerApp, CustomerProfileScreen) can intercept
          const customEvent = new CustomEvent('quickserve:hardwareback', { cancelable: true });
          const handled = !window.dispatchEvent(customEvent);
          if (handled) {
            return;
          }

          // 3. If in a different module and on mobile, navigate back to customer_app
          if (activeModule !== 'customer_app' && isMobileOrNative) {
            setActiveModule('customer_app');
            return;
          }

          // 4. Double tap to exit when at root Home screen
          const now = Date.now();
          if (now - lastBackPress < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPress = now;
            const toast = document.createElement('div');
            toast.id = 'quickserve-exit-toast';
            toast.innerText = lang === 'en' ? 'Press back again to exit QuickServe' : 'बाहर निकलने के लिए एक बार और बैक दबाएं';
            toast.style.cssText = 'position:fixed;bottom:85px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.92);color:#fff;padding:8px 18px;border-radius:24px;font-size:12px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.25);pointer-events:none;transition:opacity 0.25s;';
            document.body.appendChild(toast);
            setTimeout(() => {
              toast.style.opacity = '0';
              setTimeout(() => toast.remove(), 250);
            }, 1800);
          }
        });
      } catch (err) {
        console.warn('Capacitor App backButton listener not initialized:', err);
      }
    };

    initBackButton();

    return () => {
      if (backListener?.remove) backListener.remove();
    };
  }, [isLocationModalOpen, isAuthModalOpen, isGatewayModalOpen, activeModule, isMobileOrNative, lang]);


  const handleToggleLang = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleToggleMobileFrame = () => {
    setIsMobileDeviceFrame(prev => !prev);
  };

  const handleSelectCategoryFromWebsite = (cat: ServiceCategory) => {
    setActiveModule('customer_app');
  };

  if (showSplash || isLoading) {
    return <AppSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Universal Product Navigation & Switcher Header */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        lang={lang}
        onToggleLang={handleToggleLang}
        isMobileDeviceFrame={isMobileDeviceFrame}
        onToggleMobileFrame={handleToggleMobileFrame}
        activeCityZone={activeCityZone}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onChangeCityZone={setActiveCityZone}
        onOpenGateways={() => setIsGatewayModalOpen(true)}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {/* MODULE 1: CUSTOMER MARKETING & BOOKING WEBSITE */}
        {activeModule === 'website' && (
          <CustomerWebsite
            categories={categories}
            onSelectCategory={handleSelectCategoryFromWebsite}
            onNavigateToApp={() => setActiveModule('customer_app')}
            onNavigateToProRegister={() => setActiveModule('pro_register')}
            onNavigateToProApp={() => setActiveModule('pro_app')}
            onNavigateToAdmin={() => setActiveModule('admin')}
            onNavigateToSimulator={() => setActiveModule('simulator')}
            lang={lang}
            featuredPros={professionals}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            activeBookings={bookings}
            onRefreshBookings={loadData}
            activeCityZone={activeCityZone}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onLogout={handleLogout}
          />

        )}

        {/* MODULE 2: CUSTOMER MOBILE APP */}
        {activeModule === 'customer_app' && (
          <div className={isMobileDeviceFrame ? "py-8 px-4 flex justify-center bg-slate-200/70 min-h-[calc(100vh-4rem)]" : "flex justify-center bg-slate-100 min-h-screen md:min-h-[calc(100vh-4rem)] md:py-8 md:px-4"}>
            <div className={isMobileDeviceFrame ? "w-full max-w-[390px] rounded-[48px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700" : "w-full max-w-md"}>
              <CustomerApp
                categories={categories}
                professionals={professionals}
                activeBookings={bookings}
                onRefreshBookings={loadData}
                lang={lang}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
                activeCityZone={activeCityZone}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                onNavigateToWebsite={() => setActiveModule('website')}
                onUpdateUser={(updated) => setCurrentUser(updated)}
                onSwitchToPartnerApp={() => setActiveModule('pro_app')}
              />
            </div>
          </div>
        )}

        {/* MODULE 3: PROFESSIONAL / PARTNER APP */}
        {activeModule === 'pro_app' && (
          <div className={isMobileDeviceFrame ? "py-8 px-4 flex justify-center bg-slate-950 min-h-[calc(100vh-4rem)]" : "flex justify-center bg-slate-950 min-h-screen md:min-h-[calc(100vh-4rem)] md:py-8 md:px-4"}>
            <div className={isMobileDeviceFrame ? "w-full max-w-[390px] rounded-[48px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-800" : "w-full max-w-md"}>
              <ProfessionalApp
                professionals={professionals}
                activeBookings={bookings}
                onRefreshBookings={loadData}
                lang={lang}
                onBackToCustomerApp={() => setActiveModule('customer_app')}
              />
            </div>
          </div>
        )}

        {/* MODULE 4: BECOME A PROFESSIONAL REGISTRATION PORTAL */}
        {activeModule === 'pro_register' && (
          <ProfessionalRegister
            categories={categories}
            zones={zones}
            onComplete={() => setActiveModule('website')}
            lang={lang}
          />
        )}

        {/* MODULE 5: ADMIN WEB DASHBOARD */}
        {activeModule === 'admin' && (
          <AdminDashboard
            categories={categories}
            zones={zones}
            professionals={professionals}
            bookings={bookings}
            onRefreshAll={loadData}
            lang={lang}
          />
        )}

        {/* MODULE 6: LIVE MARKETPLACE SPLIT-SCREEN SIMULATOR */}
        {activeModule === 'simulator' && (
          <MarketplaceSimulator
            categories={categories}
            professionals={professionals}
            onRefreshData={loadData}
            lang={lang}
          />
        )}

        {/* MODULE 7: ARCHITECTURE & POSTGRESQL SPECIFICATION */}
        {activeModule === 'architecture' && (
          <ArchitectureViewer />
        )}
      </main>

      {/* Global Swiggy/Zomato-style Phone + OTP Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Gateways & Fast2SMS / Razorpay Modal */}
      {isGatewayModalOpen && (
        <RazorpayModal
          amount={299}
          serviceTitle="Fast2SMS & Razorpay Gateway Setup"
          customerName={currentUser?.name || 'Customer'}
          customerPhone={currentUser?.phone || ''}
          onClose={() => setIsGatewayModalOpen(false)}
          onSuccess={(_pid) => setIsGatewayModalOpen(false)}
        />
      )}
      {/* Swiggy/Zepto-style Location Picker & GPS Auto-Detector */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentZone={activeCityZone}
        onSelectZone={(zoneName) => {
          setActiveCityZone(zoneName);
          localStorage.setItem('quickserve_active_zone', zoneName);
        }}
      />
    </div>
  );
}

export default App;
