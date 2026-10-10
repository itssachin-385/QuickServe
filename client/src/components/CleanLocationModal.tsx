import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Check, X, Home, Building2, Landmark, RefreshCw } from 'lucide-react';
import { reverseGeocodeGoogle } from '../utils/googleMapsService';

interface CleanLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  onSelectZone: (zoneName: string, fullAddress?: string) => void;
}

const POPULAR_AREAS = [
  { name: 'Pari Chowk, Greater Noida', tag: 'Popular' },
  { name: 'Sector 18, Noida', tag: 'Commercial' },
  { name: 'Sector 62, Noida', tag: 'IT Hub' },
  { name: 'Alpha 1, Greater Noida', tag: 'Residential' },
  { name: 'Beta 2, Greater Noida', tag: 'Residential' },
  { name: 'Sector 137, Noida Expressway', tag: 'High-rise' },
  { name: 'Indirapuram, Ghaziabad', tag: 'NCR' },
  { name: 'South Delhi, New Delhi', tag: 'NCR' },
  { name: 'Connaught Place, Central Delhi', tag: 'NCR' },
];

export const CleanLocationModal: React.FC<CleanLocationModalProps> = ({
  isOpen,
  onClose,
  currentZone,
  onSelectZone
}) => {
  const [manualQuery, setManualQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(currentZone || 'Pari Chowk, Greater Noida');
  const [houseNo, setHouseNo] = useState('');
  const [streetBuilding, setStreetBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [step, setStep] = useState<'select' | 'doorstep'>('select');

  // Load existing doorstep details if present
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('quickserve_doorstep_details');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.houseNo) setHouseNo(parsed.houseNo);
          if (parsed.streetGali) setStreetBuilding(parsed.streetGali);
          if (parsed.landmark) setLandmark(parsed.landmark);
          if (parsed.addressTag) setAddressTag(parsed.addressTag);
        }
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please enter your location manually.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await reverseGeocodeGoogle(latitude, longitude);
          const detectedZone = result.areaCity || `${result.city}, ${result.state}`;
          setSelectedArea(detectedZone);
          if (result.houseNo && !houseNo) setHouseNo(result.houseNo);
          if (result.streetGali && !streetBuilding) setStreetBuilding(result.streetGali);
          if (result.landmark && !landmark) setLandmark(result.landmark);
          setStep('doorstep');
        } catch (err: any) {
          setGpsError('Could not resolve GPS location. Please choose from popular areas or enter manually.');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please enter your address or sector manually below.');
        } else {
          setGpsError('GPS signal weak. You can select your area manually.');
        }
      },
      { timeout: 9000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const handleSelectArea = (area: string) => {
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

  const filteredAreas = manualQuery.trim()
    ? POPULAR_AREAS.filter(a => a.name.toLowerCase().includes(manualQuery.toLowerCase()))
    : POPULAR_AREAS;

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
                className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-3 text-left transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  {isDetectingGps ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900">
                    {isDetectingGps ? 'Detecting current location...' : 'Use Current Location'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Using GPS (Requires permission)
                  </p>
                </div>
              </button>

              {gpsError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  {gpsError}
                </div>
              )}

              {/* Manual Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Or enter location manually
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Search sector, society, area or PIN code..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
                  />
                </div>
                {manualQuery.trim() && filteredAreas.length === 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectArea(manualQuery.trim())}
                    className="w-full mt-2 p-2.5 text-xs text-left text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 flex items-center justify-between"
                  >
                    <span>Use &quot;<strong>{manualQuery.trim()}</strong>&quot; as custom locality</span>
                    <span className="font-semibold text-emerald-600">Select &rarr;</span>
                  </button>
                )}
              </div>

              {/* Popular Localities */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Popular Service Localities
                </p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredAreas.map((item, idx) => {
                    const isSelected = selectedArea.toLowerCase() === item.name.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectArea(item.name)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-sm truncate">{item.name}</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                          {item.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: DOORSTEP DETAILS */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">Selected Locality</p>
                    <p className="text-sm text-emerald-800 font-medium">{selectedArea}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  House / Flat / Floor Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="e.g. Flat 402, Tower B"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment / Society / Street
                </label>
                <input
                  type="text"
                  value={streetBuilding}
                  onChange={(e) => setStreetBuilding(e.target.value)}
                  placeholder="e.g. ATS Greens / Golf Links / Main Street"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Mother Dairy / Gate No. 2"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Save Address As
                </label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddressTag(tag)}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                        addressTag === tag
                          ? 'bg-emerald-600 text-white border-emerald-600'
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
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step === 'doorstep' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Address</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-500">Current: {selectedArea.slice(0, 24)}...</span>
              <button
                type="button"
                onClick={() => setStep('doorstep')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
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
