import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, 
  Search, 
  Crosshair, 
  MapPin, 
  X, 
  Home, 
  Briefcase, 
  Building2, 
  Check, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  reverseGeocodeGoogle, 
  searchPlacesGoogle, 
  getPlaceDetailsGoogle, 
  GooglePlaceSuggestion 
} from '../utils/googleMapsService';
import { parseSuggestionItem } from '../utils/locationHelper';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const getHighAccuracyPosition = async (): Promise<{ lat: number; lon: number } | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        await Geolocation.requestPermissions();
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      });
      if (pos?.coords) {
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch (e) {
      console.warn('Capacitor native geolocation error, falling back:', e);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => {
          console.warn('Browser geolocation error:', err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  return null;
};

interface InteractiveMapPickerProps {
  initialLat?: number;
  initialLon?: number;
  currentZone?: string;
  onConfirm: (locationData: {
    areaCity: string;
    fullAddress: string;
    streetGali?: string;
    houseNo?: string;
    landmark?: string;
    addressTag?: 'Home' | 'Work' | 'Other';
    lat: number;
    lon: number;
  }) => void;
  onBack: () => void;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  initialLat,
  initialLon,
  currentZone,
  onConfirm,
  onBack
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Default coordinate fallback: Ber Sarai, New Delhi (or user coordinates)
  const defaultLat = initialLat || 28.5478;
  const defaultLon = initialLon || 77.1824;

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number }>({
    lat: defaultLat,
    lon: defaultLon
  });
  const [currentLocality, setCurrentLocality] = useState(currentZone || 'Ber Sarai');
  const [currentFullAddress, setCurrentFullAddress] = useState(
    'Ber Sarai, New Delhi, Delhi, India, 110016'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Step 2 Doorstep Details modal/drawer
  const [showDoorstepDrawer, setShowDoorstepDrawer] = useState(false);
  const [houseNo, setHouseNo] = useState('');
  const [streetGali, setStreetGali] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Debounced reverse geocode on map center pan
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAddressForCoordinates = useCallback(async (lat: number, lon: number) => {
    setIsLocating(true);
    try {
      const res = await reverseGeocodeGoogle(lat, lon);
      if (res) {
        const locality = res.displayName || res.areaCity.split(',')[0].trim() || res.city || 'Service Area';
        setCurrentLocality(locality);
        setCurrentFullAddress(res.formattedAddress || `${res.areaCity}, India`);
        if (res.streetGali) setStreetGali(res.streetGali);
        if (res.landmark) setLandmark(res.landmark);
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLon],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    // Official Google Maps Roadmap vector/raster tiles (Zero watermarks, high precision, bilingual Hindi/English)
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    mapInstanceRef.current = map;

    // Pan listeners
    map.on('movestart', () => {
      setIsDragging(true);
    });

    map.on('moveend', () => {
      setIsDragging(false);
      const center = map.getCenter();
      setCurrentCoords({ lat: center.lat, lon: center.lng });

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchAddressForCoordinates(center.lat, center.lng);
      }, 400);
    });

    // Initial address fetch
    fetchAddressForCoordinates(defaultLat, defaultLon);

    // Auto-detect GPS on first load if no coordinates provided OR if coordinates are default
    const isDefaultCoordinates = !initialLat || !initialLon || 
      (Math.abs(initialLat - 28.5478) < 0.001 && Math.abs(initialLon - 77.1824) < 0.001);

    if (isDefaultCoordinates) {
      setIsLocating(true);
      getHighAccuracyPosition().then((pos) => {
        if (pos && mapInstanceRef.current) {
          mapInstanceRef.current.setView([pos.lat, pos.lon], 17, { animate: true });
          setCurrentCoords({ lat: pos.lat, lon: pos.lon });
          fetchAddressForCoordinates(pos.lat, pos.lon);
        }
      }).catch((err) => {
        console.warn('Initial GPS auto-detect failed:', err);
      }).finally(() => {
        setIsLocating(false);
      });
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [defaultLat, defaultLon, fetchAddressForCoordinates, initialLat, initialLon]);

  // Recenter to Current GPS
  const handleRecenterGPS = async () => {
    setIsLocating(true);
    try {
      const pos = await getHighAccuracyPosition();
      if (pos) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.lat, pos.lon], 18, { duration: 1.2 });
        }
        setCurrentCoords({ lat: pos.lat, lon: pos.lon });
        await fetchAddressForCoordinates(pos.lat, pos.lon);
      }
    } catch (err) {
      console.warn('GPS recenter failed:', err);
    } finally {
      setIsLocating(false);
    }
  };

  // Search input debouncer
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setGoogleSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchPlacesGoogle(searchQuery);
        setGoogleSuggestions(res || []);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle suggestion select
  const handleSelectSuggestion = async (item: GooglePlaceSuggestion) => {
    setSearchQuery('');
    setGoogleSuggestions([]);
    setIsSearching(true);

    try {
      const details = await getPlaceDetailsGoogle(item.placeId);
      if (details && details.lat && details.lon && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([details.lat, details.lon], 18, { duration: 1.2 });
        setCurrentCoords({ lat: details.lat, lon: details.lon });
        
        const parsed = parseSuggestionItem(item.mainText, item.secondaryText, item.fullText);
        const loc = parsed.areaCity.split(',')[0].trim() || details.displayName || item.mainText;
        setCurrentLocality(loc);
        setCurrentFullAddress(details.formattedAddress || `${parsed.areaCity}, India`);
        if (details.streetGali) setStreetGali(details.streetGali);
        if (details.landmark) setLandmark(details.landmark);
        return;
      }
    } catch (err) {
      console.warn('Details lookup error:', err);
    } finally {
      setIsSearching(false);
    }

    // Fallback: Nominatim geocode text
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.fullText || item.mainText)}&countrycodes=in&limit=1`, {
        headers: { 'User-Agent': 'QuickServe-Marketplace-App' }
      });
      const data = await res.json();
      if (data && data[0] && mapInstanceRef.current) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        mapInstanceRef.current.flyTo([lat, lon], 17, { duration: 1.2 });
        setCurrentCoords({ lat, lon });
        fetchAddressForCoordinates(lat, lon);
      }
    } catch (e) {
      // fallback
    }
  };

  // Complete address confirmation
  const handleFinalConfirm = () => {
    const fullDoorstep = [
      houseNo ? `Flat/House: ${houseNo}` : null,
      streetGali ? `Gali/Road: ${streetGali}` : null,
      landmark ? `Landmark: ${landmark}` : null,
      currentLocality
    ].filter(Boolean).join(', ');

    onConfirm({
      areaCity: currentLocality,
      fullAddress: fullDoorstep || currentFullAddress,
      streetGali,
      houseNo,
      landmark,
      addressTag,
      lat: currentCoords.lat,
      lon: currentCoords.lon
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white font-sans overflow-hidden select-none">
      {/* 1. TOP HEADER (Confirm your location) */}
      <div className="relative z-[1000] flex items-center justify-between px-4 py-3.5 bg-white border-b border-slate-100 shadow-xs">
        <div className="flex items-center gap-3 w-full max-w-xl mx-auto">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
            Confirm your location
          </h2>
        </div>
      </div>

      {/* 2. FLOATING SEARCH BAR OVER MAP */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-[1000]">
        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/90 flex items-center px-4 py-3 gap-3 transition-all focus-within:ring-2 focus-within:ring-emerald-500">
          <Search className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search locality, sector, area"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isSearching && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          )}
        </div>

        {/* SEARCH SUGGESTIONS DROPDOWN */}
        {googleSuggestions.length > 0 && (
          <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in">
            {googleSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-3 text-left hover:bg-emerald-50/70 transition-colors flex items-start gap-3 group"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-emerald-800">
                    {item.mainText}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-1">
                    {item.secondaryText || item.fullText}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 self-center" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. MAP CANVAS CONTAINER */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 4. CENTER PIN WITH BLACK TOOLTIP BUBBLE (Exact match to screenshot) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[900] flex flex-col items-center select-none">
          {/* Black Tooltip */}
          <div className={`bg-slate-950 text-white px-4 py-2 rounded-xl shadow-2xl flex flex-col items-center text-center transition-all duration-200 ${isDragging ? 'scale-90 opacity-70 -translate-y-2' : 'scale-100 opacity-100 translate-y-0'}`}>
            <span className="text-[10px] text-slate-300 font-medium tracking-wide">
              Set this as your location
            </span>
            <span className="text-xs font-black text-white mt-0.5 truncate max-w-[190px]">
              {isLocating ? 'Locating...' : currentLocality}
            </span>
          </div>

          {/* Downward triangle pointer */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-950 mb-0.5"></div>

          {/* Green Pin Icon */}
          <div className={`relative transition-transform duration-200 ${isDragging ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'}`}>
            <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M19 0C8.50659 0 0 8.50659 0 19C0 31.2 16.35 46.85 18.08 47.78C18.66 48.07 19.34 48.07 19.92 47.78C21.65 46.85 38 31.2 38 19C38 8.50659 29.4934 0 19 0Z" 
                fill="#10B981" 
              />
              <circle cx="19" cy="18" r="7" fill="white" />
            </svg>
          </div>

          {/* Shadow & Blue Pulse Circle Under Pin Tip */}
          <div className="w-5 h-2 bg-slate-900/30 rounded-full blur-[1px] -mt-1"></div>
          <div className="absolute -bottom-2 w-8 h-8 rounded-full bg-blue-500/25 border border-blue-400 animate-ping pointer-events-none"></div>
        </div>

        {/* 5. FLOATING MAP CONTROLS (Z-[1000] to sit above Leaflet map) */}
        {/* Top-Right GPS Crosshair Button */}
        <button
          onClick={handleRecenterGPS}
          className="absolute top-32 right-4 z-[1000] w-12 h-12 bg-white hover:bg-slate-50 text-slate-800 rounded-full shadow-2xl border border-slate-200 flex items-center justify-center transition-all active:scale-95"
          title="Recenter to GPS"
        >
          <Crosshair className={`w-5 h-5 text-slate-800 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {/* Pill button: "Go to current location" */}
        <button
          onClick={handleRecenterGPS}
          disabled={isLocating}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-2.5 rounded-full shadow-2xl border border-emerald-300 flex items-center gap-2 text-xs font-black transition-all active:scale-95"
        >
          <Crosshair className={`w-4 h-4 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Detecting satellites...' : 'Go to current location'}</span>
        </button>
      </div>

      {/* 6. BOTTOM CONFIRMATION CARD (Exact match to screenshot) */}
      <div className="relative z-[1000] bg-white border-t border-slate-100 shadow-2xl p-4 sm:p-5">
        <div className="w-full max-w-xl mx-auto flex flex-col gap-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-base text-slate-900 truncate">
                {currentLocality}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                {currentFullAddress}
              </p>
            </div>
          </div>

          {/* Big Green Confirm Location Button */}
          <button
            onClick={() => setShowDoorstepDrawer(true)}
            disabled={isLocating}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm location</span>
          </button>
        </div>
      </div>

      {/* 7. SLIDE-UP DOORSTEP DETAILS MODAL (House / Flat / Gali / Landmark) */}
      {showDoorstepDrawer && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Doorstep Details</h3>
                  <p className="text-[11px] text-slate-500">Service partner will arrive directly at this address</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDoorstepDrawer(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Location Banner */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
              <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-extrabold text-xs text-emerald-950 block truncate">
                  {currentLocality}
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-1">
                  {currentFullAddress}
                </span>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  House / Flat / Floor No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 302, 3rd Floor / B-12"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Apartment / Gali / Road Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ber Sarai Market Road / Sector 18"
                  value={streetGali}
                  onChange={(e) => setStreetGali(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Vedant Desika Mandir / Metro Station"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Tag selector: Home, Work, Other */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Save Address As
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddressTag(tag)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        addressTag === tag
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tag === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {tag === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                      {tag === 'Other' && <Building2 className="w-3.5 h-3.5" />}
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Confirm Location</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
