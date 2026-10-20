import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Check, X, Home, Building2, Landmark, RefreshCw } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { reverseGeocodeGoogle, searchPlacesGoogle, getPlaceDetailsGoogle } from '../utils/googleMapsService';

interface CleanLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  onSelectZone: (zoneName: string, fullAddress?: string) => void;
}

interface LocalityItem {
  name: string;
  sub: string;
  tag: string;
  pincode?: string;
  placeId?: string;
}

const CURATED_LOCALITIES: LocalityItem[] = [
  // --- BEGUSARAI & BIHAR LOCALITIES ---
  { name: 'Harrakh, Begusarai', sub: 'Harrakh Chowk, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Barauni, Begusarai', sub: 'Barauni Junction & Industrial Hub, Bihar', tag: 'Bihar', pincode: '851112' },
  { name: 'IOCL Township, Barauni', sub: 'Refinery Township, Begusarai, Bihar', tag: 'Bihar', pincode: '851114' },
  { name: 'GD College Road, Begusarai', sub: 'Near G.D. College Campus, Begusarai', tag: 'Bihar', pincode: '851101' },
  { name: 'Patel Nagar, Begusarai', sub: 'Patel Chowk, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Traffic Chowk, Begusarai', sub: 'Main Market & Chowk, Begusarai', tag: 'Bihar', pincode: '851101' },
  { name: 'Zero Mile, Begusarai', sub: 'NH-31 Junction, Begusarai, Bihar', tag: 'Bihar', pincode: '851112' },
  { name: 'Bishanpur, Begusarai', sub: 'Bishanpur locality, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Mirganj, Begusarai', sub: 'Mirganj, Begusarai City, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Kali Sthan, Begusarai', sub: 'Near Kali Temple, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Mohanpur, Begusarai', sub: 'Mohanpur, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Ratanpur, Begusarai', sub: 'Ratanpur Road, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Begusarai Railway Station', sub: 'Station Road, Begusarai, Bihar', tag: 'Bihar', pincode: '851101' },
  { name: 'Boring Road, Patna', sub: 'Boring Canal Road, Patna, Bihar', tag: 'Bihar', pincode: '800001' },
  { name: 'Kankarbagh, Patna', sub: 'Main Colony, Patna, Bihar', tag: 'Bihar', pincode: '800020' },
  { name: 'Bailey Road, Patna', sub: 'Jawaharlal Nehru Marg, Patna, Bihar', tag: 'Bihar', pincode: '800014' },
  { name: 'Raja Bazar, Patna', sub: 'Near Paras HMRI, Patna, Bihar', tag: 'Bihar', pincode: '800014' },
  { name: 'Gandhi Maidan, Patna', sub: 'Central Patna, Bihar', tag: 'Bihar', pincode: '800001' },
  { name: 'Danapur Cantt, Patna', sub: 'Danapur, Patna, Bihar', tag: 'Bihar', pincode: '801503' },
  { name: 'Patliputra Colony, Patna', sub: 'Patna, Bihar', tag: 'Bihar', pincode: '800013' },
  { name: 'Ashiana Nagar, Patna', sub: 'Ashiana Digha Road, Patna, Bihar', tag: 'Bihar', pincode: '800025' },
  { name: 'Fraser Road, Patna', sub: 'Dak Bunglow Chowk, Patna, Bihar', tag: 'Bihar', pincode: '800001' },
  { name: 'Muzaffarpur, Bihar', sub: 'Motijheel & Station Road, Muzaffarpur', tag: 'Bihar', pincode: '842001' },
  { name: 'Gaya Junction, Gaya', sub: 'Civil Lines, Gaya, Bihar', tag: 'Bihar', pincode: '823001' },
  { name: 'Bhagalpur, Bihar', sub: 'Tilkamanjhi, Bhagalpur, Bihar', tag: 'Bihar', pincode: '812001' },

  // --- GREATER NOIDA & NOIDA & NCR ---
  { name: 'Pari Chowk, Greater Noida', sub: 'Central Hub, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Alpha 1, Greater Noida', sub: 'Residential Sector, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Alpha 2, Greater Noida', sub: 'Residential Sector, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Beta 1, Greater Noida', sub: 'Beta Commercial & Residential, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Beta 2, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Gamma 1, Greater Noida', sub: 'Near City Park, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Gamma 2, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Delta 1, Greater Noida', sub: 'Delta Sector, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Delta 2, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Knowledge Park 1, Greater Noida', sub: 'Institutional Area, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Knowledge Park 2, Greater Noida', sub: 'Colleges & Hub, Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Knowledge Park 3, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Omega 1, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Chi 1, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Sector Pi 1, Greater Noida', sub: 'Greater Noida, UP', tag: 'Greater Noida', pincode: '201310' },
  { name: 'Surajpur, Greater Noida', sub: 'Surajpur Industrial & Court Area, UP', tag: 'Greater Noida', pincode: '201306' },
  { name: 'Gaur City 1, Greater Noida West', sub: 'Char Murti, Noida Extension, UP', tag: 'Noida Ext', pincode: '201318' },
  { name: 'Gaur City 2, Greater Noida West', sub: 'Noida Extension, UP', tag: 'Noida Ext', pincode: '201318' },
  { name: 'Sector 62, Noida', sub: 'Electronic City & IT Parks, Noida, UP', tag: 'Noida', pincode: '201309' },
  { name: 'Sector 18, Noida', sub: 'Atta Market, Mall of India, Noida, UP', tag: 'Noida', pincode: '201301' },
  { name: 'Sector 15, Noida', sub: 'Near Metro Station, Noida, UP', tag: 'Noida', pincode: '201301' },
  { name: 'Sector 50, Noida', sub: 'Central Noida Residential, UP', tag: 'Noida', pincode: '201301' },
  { name: 'Sector 76, Noida', sub: '7x Sectors, Noida, UP', tag: 'Noida', pincode: '201301' },
  { name: 'Sector 137, Noida', sub: 'Noida-Greater Noida Expressway, UP', tag: 'Noida', pincode: '201305' },
  { name: 'Connaught Place, New Delhi', sub: 'Inner & Outer Circle, Central Delhi', tag: 'Delhi', pincode: '110001' },
  { name: 'JNU Campus, New Delhi', sub: 'Jawaharlal Nehru University, South West Delhi', tag: 'Delhi', pincode: '110067' },
  { name: 'Munirka, New Delhi', sub: 'Munirka Village & DDA Flats, South Delhi', tag: 'Delhi', pincode: '110067' },
  { name: 'Ber Sarai, New Delhi', sub: 'Near IIT & JNU, South Delhi', tag: 'Delhi', pincode: '110016' },
  { name: 'Katwaria Sarai, New Delhi', sub: 'Near Qutab Institutional Area, South Delhi', tag: 'Delhi', pincode: '110016' },
  { name: 'IIT Delhi, New Delhi', sub: 'Hauz Khas, South Delhi', tag: 'Delhi', pincode: '110016' },
  { name: 'Vasant Kunj, New Delhi', sub: 'Sectors A, B, C & Malls, South Delhi', tag: 'Delhi', pincode: '110070' },
  { name: 'South Extension, New Delhi', sub: 'Part 1 & 2, South Delhi', tag: 'Delhi', pincode: '110049' },
  { name: 'Lajpat Nagar, New Delhi', sub: 'Central Market, South Delhi', tag: 'Delhi', pincode: '110024' },
  { name: 'Saket, New Delhi', sub: 'Select Citywalk, South Delhi', tag: 'Delhi', pincode: '110017' },
  { name: 'Dwarka Sector 12, New Delhi', sub: 'Dwarka, South West Delhi', tag: 'Delhi', pincode: '110075' },
  { name: 'Cyber City, Gurugram', sub: 'DLF Phase 2, Gurugram, Haryana', tag: 'Gurugram', pincode: '122002' },
  { name: 'Golf Course Road, Gurugram', sub: 'Sector 54, Gurugram, Haryana', tag: 'Gurugram', pincode: '122002' },
  { name: 'Indirapuram, Ghaziabad', sub: 'Shipra Sun City / Nyay Khand, Ghaziabad', tag: 'Ghaziabad', pincode: '201014' },
  { name: 'Vaishali, Ghaziabad', sub: 'Sector 4 Metro, Ghaziabad, UP', tag: 'Ghaziabad', pincode: '201010' },

  // --- OTHER MAJOR HUBS ---
  { name: 'Hazratganj, Lucknow', sub: 'Central Lucknow, Uttar Pradesh', tag: 'Lucknow', pincode: '226001' },
  { name: 'Gomti Nagar, Lucknow', sub: 'Vibhuti Khand, Lucknow, UP', tag: 'Lucknow', pincode: '226010' },
  { name: 'Koramangala, Bengaluru', sub: '5th Block & 7th Block, Bengaluru', tag: 'Bengaluru', pincode: '560034' },
  { name: 'Indiranagar, Bengaluru', sub: '100 Feet Road, Bengaluru, Karnataka', tag: 'Bengaluru', pincode: '560038' },
  { name: 'Bandra West, Mumbai', sub: 'Hill Road / Linking Road, Mumbai', tag: 'Mumbai', pincode: '400050' },
  { name: 'Andheri West, Mumbai', sub: 'Lokhandwala, Mumbai, Maharashtra', tag: 'Mumbai', pincode: '400058' }
];

export const CleanLocationModal: React.FC<CleanLocationModalProps> = ({
  isOpen,
  onClose,
  currentZone,
  onSelectZone
}) => {
  const [manualQuery, setManualQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(() => {
    if (currentZone && !currentZone.includes('Pari Chowk') && !currentZone.includes('Ansal Golf')) {
      return currentZone;
    }
    return '';
  });
  const [houseNo, setHouseNo] = useState('');
  const [streetBuilding, setStreetBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [step, setStep] = useState<'select' | 'doorstep'>('select');

  // Live Rapido-style suggestions state
  const [liveSuggestions, setLiveSuggestions] = useState<LocalityItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  // Debounced live geocoding API lookup: Parallel Google Places Autocomplete + OSM Nominatim
  useEffect(() => {
    const q = manualQuery.trim();
    if (q.length < 2) {
      setLiveSuggestions([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    const timeout = setTimeout(async () => {
      try {
        const [googleRes, osmRes] = await Promise.allSettled([
          searchPlacesGoogle(q),
          fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=8`,
            { headers: { 'Accept-Language': 'en' } }
          ).then(r => r.ok ? r.json() : [])
        ]);

        const items: LocalityItem[] = [];

        // 1. Add Google Places Autocomplete Suggestions (High Precision POIs, Galis, Chowks)
        if (googleRes.status === 'fulfilled' && Array.isArray(googleRes.value)) {
          googleRes.value.forEach((s) => {
            items.push({
              name: s.mainText,
              sub: s.secondaryText || s.fullText,
              tag: 'Google Verified',
              placeId: s.placeId
            });
          });
        }

        // 2. Add OpenStreetMap Nominatim Suggestions (Gaon, Dehat, Hamlets, Wards)
        if (osmRes.status === 'fulfilled' && Array.isArray(osmRes.value)) {
          osmRes.value.forEach((item: any) => {
            const addr = item.address || {};
            const villageName = addr.village || addr.hamlet || '';
            const mohallaName = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || '';
            const roadName = addr.road || '';
            const mainName = villageName || mohallaName || roadName || addr.city_district || addr.town || addr.city || item.display_name.split(',')[0];
            const city = addr.city || addr.town || addr.district || addr.state_district || '';
            const state = addr.state || '';
            const postcode = addr.postcode || '';
            const sub = [city, state, postcode].filter(Boolean).join(', ') || item.display_name;
            const tag = villageName ? 'Gaon / Village' : (mohallaName ? 'Mohalla' : (state ? state.slice(0, 10) : 'India'));

            const formattedTitle = mainName ? `${mainName}, ${city || state}` : item.display_name.split(',').slice(0, 2).join(', ');

            // Avoid exact duplicates from Google
            if (!items.some(i => i.name.toLowerCase() === formattedTitle.toLowerCase() || i.sub.toLowerCase() === sub.toLowerCase())) {
              items.push({
                name: formattedTitle,
                sub: sub,
                tag: tag,
                pincode: postcode
              });
            }
          });
        }

        setLiveSuggestions(items);
      } catch (e) {
        // Fallback to local curated results
      } finally {
        setIsSearchingLive(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [manualQuery]);

  // Load existing doorstep details if present and sync selected zone
  useEffect(() => {
    if (isOpen) {
      if (currentZone && !currentZone.includes('Pari Chowk') && !currentZone.includes('Ansal Golf')) {
        setSelectedArea(currentZone);
      } else {
        setSelectedArea('');
      }
      try {
        const saved = localStorage.getItem('quickserve_doorstep_details');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fullCompleteAddress?.includes('Ansal Golf') || parsed.fullCompleteAddress?.includes('Pari Chowk')) {
            localStorage.removeItem('quickserve_doorstep_details');
          } else {
            if (parsed.houseNo) setHouseNo(parsed.houseNo);
            if (parsed.streetGali) setStreetBuilding(parsed.streetGali);
            if (parsed.landmark) setLandmark(parsed.landmark);
            if (parsed.addressTag) setAddressTag(parsed.addressTag);
          }
        }
      } catch (e) {}
    }
  }, [isOpen, currentZone]);

  if (!isOpen) return null;

  // Hyperlocal Pinpoint GPS Geolocation with Native Android Capacitor support
  const handleUseCurrentLocation = async () => {
    setGpsError('');
    setIsDetectingGps(true);

    try {
      let lat: number | null = null;
      let lon: number | null = null;

      // Stage 1: Try Native Hardware GPS on Android/iOS via Capacitor Geolocation
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 9000,
            maximumAge: 10000
          });
          if (pos?.coords) {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          }
        } catch (capErr) {
          console.warn('Capacitor native GPS attempt warning, using fallback:', capErr);
        }
      }

      // Stage 2: Browser Navigator Geolocation (Desktop & Mobile Web fallback)
      if (lat === null || lon === null) {
        if (!navigator.geolocation) {
          setGpsError('Geolocation is not supported by your device. Please select or search your area.');
          setIsDetectingGps(false);
          return;
        }

        const browserCoords = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => {
              console.warn('Browser GPS error:', err);
              resolve(null);
            },
            { timeout: 9000, maximumAge: 30000, enableHighAccuracy: true }
          );
        });

        if (browserCoords) {
          lat = browserCoords.lat;
          lon = browserCoords.lon;
        }
      }

      if (lat === null || lon === null) {
        setGpsError('GPS signal weak or location permission not granted. Please search your village, street or area.');
        setIsDetectingGps(false);
        return;
      }

      // Stage 3: Universal Reverse Geocode (Google Places + OSM Cadastral Hierarchy)
      const result = await reverseGeocodeGoogle(lat, lon);
      const detectedZone = result.areaCity || `${result.city}, ${result.state}`;
      setSelectedArea(detectedZone);
      if (result.houseNo) setHouseNo(result.houseNo);
      if (result.streetGali) setStreetBuilding(result.streetGali);
      if (result.landmark) setLandmark(result.landmark);
      setStep('doorstep');
    } catch (err: any) {
      setGpsError('Could not resolve GPS location. Please select from popular areas or enter manually.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSelectArea = async (area: string, item?: LocalityItem) => {
    // If clicked item has Google Place ID, resolve full place details instantly
    if (item?.placeId) {
      try {
        const details = await getPlaceDetailsGoogle(item.placeId);
        if (details) {
          setSelectedArea(details.areaCity);
          if (details.houseNo) setHouseNo(details.houseNo);
          if (details.streetGali) setStreetBuilding(details.streetGali);
          if (details.landmark) setLandmark(details.landmark);
          setStep('doorstep');
          return;
        }
      } catch (err) {
        console.warn('Place details error, using plain area:', err);
      }
    }

    setSelectedArea(area);
    setStep('doorstep');
  };

  const handleConfirmAndSave = () => {
    const fullComplete = [
      houseNo ? `Flat/House ${houseNo}` : '',
      streetBuilding,
      landmark ? `Near ${landmark}` : '',
      selectedArea
    ].filter(Boolean).join(', ');

    localStorage.setItem('quickserve_active_zone', selectedArea);
    localStorage.setItem('quickserve_doorstep_details', JSON.stringify({
      houseNo,
      streetGali: streetBuilding,
      landmark,
      areaCity: selectedArea,
      addressTag,
      fullCompleteAddress: fullComplete
    }));
    localStorage.setItem('quickserve_user_address', fullComplete);

    onSelectZone(selectedArea, fullComplete);
    onClose();
  };

  // Filter local curated database
  const qClean = manualQuery.trim().toLowerCase();
  const localMatches = qClean
    ? CURATED_LOCALITIES.filter(
        a =>
          a.name.toLowerCase().includes(qClean) ||
          a.sub.toLowerCase().includes(qClean) ||
          a.tag.toLowerCase().includes(qClean) ||
          (a.pincode && a.pincode.includes(qClean))
      )
    : CURATED_LOCALITIES.slice(0, 10);

  // Combine local matches + live API suggestions (deduped by name)
  const combinedSuggestions: LocalityItem[] = [...localMatches];
  liveSuggestions.forEach(live => {
    const exists = combinedSuggestions.some(
      c => c.name.toLowerCase() === live.name.toLowerCase() || c.sub.toLowerCase() === live.sub.toLowerCase()
    );
    if (!exists) {
      combinedSuggestions.push(live);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {step === 'select' ? 'Select Your Location' : 'Confirm Doorstep Address'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'select' ? 'Find available services near you' : 'Ensures partner arrives at the exact door'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {step === 'select' ? (
            <>
              {/* GPS Option */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingGps}
                className="w-full p-3.5 bg-pink-50/70 hover:bg-pink-100/80 border border-pink-200 rounded-xl flex items-center gap-3 text-left transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isDetectingGps ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1F121C]">
                    {isDetectingGps ? 'Detecting current location...' : 'Use Current Location'}
                  </p>
                  <p className="text-xs text-pink-600 mt-0.5 font-medium">
                    Using GPS (Requires browser permission)
                  </p>
                </div>
              </button>

              {gpsError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  {gpsError}
                </div>
              )}

              {/* Manual Search Input with Rapido-style Suggestions */}
              <div>
                <label className="block text-xs font-bold text-[#1F121C] uppercase tracking-wider mb-2">
                  Or enter location manually
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualQuery.trim()) {
                        e.preventDefault();
                        handleSelectArea(manualQuery.trim());
                      }
                    }}
                    placeholder="Type city or sector (e.g. Begusarai, Harrakh, Pari Chowk, Sector 62)..."
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-pink-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-[#1F121C] placeholder-slate-400 transition-all shadow-2xs"
                  />
                  {manualQuery && (
                    <button
                      type="button"
                      onClick={() => setManualQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Instant "Deliver to typed address" Button */}
                {manualQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelectArea(manualQuery.trim())}
                    className="w-full mt-2.5 p-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-[0.98] text-white rounded-xl flex items-center justify-between shadow-md shadow-pink-500/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-pink-100 font-bold">Deliver to this custom address</p>
                        <p className="text-sm font-extrabold text-white truncate">&quot;{manualQuery.trim()}&quot;</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold text-white shrink-0 transition-colors">
                      Select &rarr;
                    </span>
                  </button>
                )}
              </div>

              {/* Suggestions / Popular Localities List - Rapido Style */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {manualQuery.trim() ? `Search Suggestions (${combinedSuggestions.length})` : 'Popular Service Localities'}
                  </p>
                  {isSearchingLive && (
                    <span className="text-[11px] font-semibold text-pink-600 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Finding exact places...</span>
                    </span>
                  )}
                </div>

                {combinedSuggestions.length === 0 && !isSearchingLive ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">No matching place found in index</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      You can still select &quot;{manualQuery}&quot; using the pink button above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {combinedSuggestions.map((item, idx) => {
                      const isSelected = selectedArea.toLowerCase() === item.name.toLowerCase();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectArea(item.name, item)}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-pink-50 border-pink-300 text-pink-900 shadow-2xs font-medium'
                              : 'bg-white border-slate-200 hover:border-pink-300 hover:bg-pink-50/30 text-slate-800 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 group-hover:bg-pink-100'
                            }`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {item.sub}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md block mb-0.5 border ${
                              item.tag.includes('Google')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.tag.includes('Gaon') || item.tag.includes('Village')
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : item.tag.includes('Mohalla')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {item.tag}
                            </span>
                            {item.pincode && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                PIN {item.pincode}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* STEP 2: DOORSTEP DETAILS */
            <div className="space-y-4">
              <div className="p-3 bg-pink-50/80 border border-pink-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-pink-900">Selected Locality</p>
                    <p className="text-sm text-pink-800 font-medium">{selectedArea}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="text-xs font-semibold text-pink-600 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F121C] mb-1">
                  House / Flat / Floor Number <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="e.g. Flat 402, Tower B"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-[#1F121C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F121C] mb-1">
                  Apartment / Society / Street
                </label>
                <input
                  type="text"
                  value={streetBuilding}
                  onChange={(e) => setStreetBuilding(e.target.value)}
                  placeholder="e.g. ATS Greens / Golf Links / Main Street"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-[#1F121C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F121C] mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Mother Dairy / Gate No. 2"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-[#1F121C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F121C] mb-1.5">
                  Save Address As
                </label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddressTag(tag)}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        addressTag === tag
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {tag === 'Work' && <Building2 className="w-3.5 h-3.5" />}
                      {tag === 'Other' && <Landmark className="w-3.5 h-3.5" />}
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pink-100 bg-slate-50 flex items-center justify-between">
          {step === 'doorstep' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 text-xs font-semibold text-[#705869] hover:text-[#1F121C] cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Address</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-[#705869] uppercase font-bold tracking-wider block">Target Location</span>
                <span className="text-xs font-bold text-[#1F121C] truncate block">
                  {manualQuery.trim() || selectedArea || 'Select your city/locality'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = manualQuery.trim() || selectedArea;
                  if (!target) {
                    setGpsError('Please type your city/locality or choose from the list below.');
                    return;
                  }
                  handleSelectArea(target);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-pink-500/20 hover:shadow-lg transition-all cursor-pointer shrink-0"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
