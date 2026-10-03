import React, { useEffect, useState } from 'react';
import { sanitizeNoidaLocationStorage } from '../utils/locationHelper';
import { InteractiveMapPicker } from './InteractiveMapPicker';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  onSelectZone: (zoneName: string, fullAddress?: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentZone,
  onSelectZone
}) => {
  const [initialCoords, setInitialCoords] = useState<{ lat?: number; lon?: number }>({});

  useEffect(() => {
    sanitizeNoidaLocationStorage();
    try {
      const saved = localStorage.getItem('quickserve_doorstep_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        const full = `${parsed.fullCompleteAddress || ''} ${parsed.areaCity || ''} ${parsed.landmark || ''}`.toLowerCase();
        if (
          full.includes('aishani') || 
          full.includes('château') || 
          full.includes('chateau') || 
          full.includes('ifs villas') ||
          full.includes('ber sarai') ||
          full.includes('galileo')
        ) {
          setInitialCoords({});
        } else if (parsed.lat && parsed.lon) {
          setInitialCoords({ lat: parsed.lat, lon: parsed.lon });
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  if (!isOpen) return null;

  const handleConfirm = (locationData: {
    areaCity: string;
    fullAddress: string;
    streetGali?: string;
    houseNo?: string;
    landmark?: string;
    addressTag?: 'Home' | 'Work' | 'Other';
    lat: number;
    lon: number;
  }) => {
    const displayZone = locationData.areaCity || 'Ansal Golf Links 1, Greater Noida';
    const fullCompleteAddress = locationData.fullAddress || `${displayZone}, India`;

    localStorage.setItem(
      'quickserve_doorstep_details',
      JSON.stringify({
        houseNo: locationData.houseNo || '',
        streetGali: locationData.streetGali || '',
        landmark: locationData.landmark || '',
        areaCity: locationData.areaCity,
        addressTag: locationData.addressTag || 'Home',
        fullCompleteAddress,
        lat: locationData.lat,
        lon: locationData.lon
      })
    );
    localStorage.setItem('quickserve_active_zone', displayZone);
    localStorage.setItem('quickserve_user_address', fullCompleteAddress);

    onSelectZone(displayZone, fullCompleteAddress);
    onClose();
  };

  return (
    <InteractiveMapPicker
      initialLat={initialCoords.lat}
      initialLon={initialCoords.lon}
      currentZone={currentZone}
      onConfirm={handleConfirm}
      onBack={onClose}
    />
  );
};
