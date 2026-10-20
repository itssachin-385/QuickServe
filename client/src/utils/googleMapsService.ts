/**
 * QuickServe Google Maps Platform Service
 * 
 * Hyperlocal Location Engine using Google Places API (New) & Geocoding
 * Powered by User's Google Maps API Key with fallback to High-Precision Local Geocoder.
 */

import { resolveNoidaOrGreaterNoida, ResolvedLocation, cleanIndianCityName, INDIAN_STATES } from './locationHelper';

export const GOOGLE_MAPS_API_KEY = 
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAcBeOixtPCJZXMOozn6n3MD8YM_gTOKCY';

export interface GoogleResolvedLocation {
  displayName: string;
  formattedAddress: string;
  houseNo: string;
  streetGali: string;
  landmark: string;
  areaCity: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lon?: number;
  isGoogleVerified: boolean;
}

export interface GooglePlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

/**
 * Parse Google Places API (New) Place response into QuickServe location format
 */
export function parseGooglePlace(place: any, fallbackLat?: number, fallbackLon?: number): GoogleResolvedLocation {
  if (!place) {
    throw new Error('Empty place response');
  }

  const comps = place.addressComponents || [];
  const getComp = (type: string) => comps.find((c: any) => c.types && c.types.includes(type))?.longText || '';

  const premise = getComp('premise') || getComp('subpremise') || getComp('street_number');
  const route = getComp('route');
  const sublocality2 = getComp('sublocality_level_2');
  const sublocality1 = getComp('sublocality_level_1');
  const neighborhood = getComp('neighborhood');
  const locality = getComp('locality') || getComp('administrative_area_level_3') || getComp('administrative_area_level_2');
  const state = getComp('administrative_area_level_1');
  const pincode = getComp('postal_code');
  const landmarkComp = comps.find((c: any) => c.types && c.types.includes('landmark'))?.longText || '';
  const displayName = place.displayName?.text || '';
  const fullAddress = place.formattedAddress || '';
  const combinedText = `${displayName} ${fullAddress} ${route} ${sublocality1} ${sublocality2} ${neighborhood}`.toLowerCase();

  // 1. Specific Indian Locality Disambiguation (e.g. Ber Sarai vs Munirka)
  let sectorOrArea = '';
  let city = '';

  if (
    combinedText.includes('jnu') || 
    combinedText.includes('jawaharlal nehru') || 
    combinedText.includes('jnu ring') || 
    combinedText.includes('ganga dhabha') ||
    combinedText.includes('110067')
  ) {
    if (combinedText.includes('munirka village') || combinedText.includes('munirka dda')) {
      sectorOrArea = 'Munirka';
      city = 'New Delhi';
    } else {
      sectorOrArea = 'JNU Campus';
      city = 'New Delhi';
    }
  } else if (combinedText.includes('iit delhi') || combinedText.includes('iit campus')) {
    sectorOrArea = 'IIT Delhi Campus';
    city = 'New Delhi';
  } else if (combinedText.includes('ber sarai') || combinedText.includes('bersarai')) {
    sectorOrArea = 'Ber Sarai';
    city = 'New Delhi';
  } else if (combinedText.includes('katwaria sarai')) {
    sectorOrArea = 'Katwaria Sarai';
    city = 'New Delhi';
  } else if (combinedText.includes('jia sarai')) {
    sectorOrArea = 'Jia Sarai';
    city = 'New Delhi';
  } else if (combinedText.includes('munirka')) {
    sectorOrArea = 'Munirka';
    city = 'New Delhi';
  } else if (combinedText.includes('hauz khas')) {
    sectorOrArea = 'Hauz Khas';
    city = 'New Delhi';
  } else if (combinedText.includes('green park')) {
    sectorOrArea = 'Green Park';
    city = 'New Delhi';
  } else if (combinedText.includes('safdarjung enclave') || combinedText.includes('safdarjung')) {
    sectorOrArea = 'Safdarjung Enclave';
    city = 'New Delhi';
  } else if (combinedText.includes('malviya nagar')) {
    sectorOrArea = 'Malviya Nagar';
    city = 'New Delhi';
  } else if (combinedText.includes('vasant kunj')) {
    sectorOrArea = 'Vasant Kunj';
    city = 'New Delhi';
  } else if (combinedText.includes('vasant vihar')) {
    sectorOrArea = 'Vasant Vihar';
    city = 'New Delhi';
  } else if (combinedText.includes('saket')) {
    sectorOrArea = 'Saket';
    city = 'New Delhi';
  } else if (combinedText.includes('r.k. puram') || combinedText.includes('rk puram')) {
    sectorOrArea = 'R.K. Puram';
    city = 'New Delhi';
  } else if (
    combinedText.includes('ansal golf') || 
    combinedText.includes('golf link') || 
    combinedText.includes('golf links') || 
    combinedText.includes('om proptech') || 
    combinedText.includes('shreeniwasm') || 
    combinedText.includes('wayfarer') ||
    combinedText.includes('ifs villas') || 
    combinedText.includes('aishani') || 
    combinedText.includes('château') || 
    combinedText.includes('chateau')
  ) {
    sectorOrArea = 'Ansal Golf Links 1';
    city = 'Greater Noida';
  } else if (combinedText.includes('omega 1') || combinedText.includes('shafipur') || combinedText.includes('psi i')) {
    sectorOrArea = 'Ansal Golf Links 1';
    city = 'Greater Noida';
  } else if (combinedText.includes('pari chowk')) {
    sectorOrArea = 'Pari Chowk';
    city = 'Greater Noida';
  } else if (combinedText.includes('sector 18') || combinedText.includes('atta')) {
    sectorOrArea = 'Sector 18';
    city = 'Noida';
  } else if (combinedText.includes('sector 62')) {
    sectorOrArea = 'Sector 62';
    city = 'Noida';
  } else if (combinedText.includes('sector 135') || combinedText.includes('bajidpur')) {
    sectorOrArea = 'Sector 135';
    city = 'Noida';
  } else if (combinedText.includes('gaur city')) {
    sectorOrArea = 'Gaur City (Gr. Noida West)';
    city = 'Greater Noida';
  }

  // 2. UNIVERSAL DYNAMIC PAN-INDIA RESOLUTION (VILLAGES, GALIS, MOHALLAS & CITIES)
  const rawLocality = getComp('locality');
  const admin3 = cleanIndianCityName(getComp('administrative_area_level_3'));
  const admin2 = cleanIndianCityName(getComp('administrative_area_level_2'));
  const rawLocalityClean = cleanIndianCityName(rawLocality);

  if (!sectorOrArea) {
    // Case A: Urban Mohalla / Colony / Sector / Layout
    if (sublocality1 || sublocality2 || neighborhood) {
      if (sublocality2 && sublocality1 && !sublocality1.toLowerCase().includes(sublocality2.toLowerCase())) {
        sectorOrArea = `${sublocality2}, ${sublocality1}`;
      } else {
        sectorOrArea = sublocality1 || sublocality2 || neighborhood;
      }
      city = cleanIndianCityName(rawLocality || admin3 || admin2 || state);
    }
    // Case B: Rural Village (Gaon / Gram) or Small Town (locality is the village, admin3/admin2 is district)
    else if (rawLocalityClean) {
      sectorOrArea = rawLocalityClean;
      city = (admin3 && admin3.toLowerCase() !== rawLocalityClean.toLowerCase())
        ? admin3
        : (admin2 && admin2.toLowerCase() !== rawLocalityClean.toLowerCase() ? admin2 : cleanIndianCityName(state));
    }
    // Case C: Gali / Road / Marg
    else if (route) {
      sectorOrArea = route;
      city = admin3 || admin2 || cleanIndianCityName(state);
    }
    // Case D: Verified Landmark / Chowk / Temple / Dhabha
    else if (displayName) {
      sectorOrArea = displayName;
      city = admin3 || admin2 || cleanIndianCityName(state);
    } else {
      sectorOrArea = 'Main Area';
      city = admin3 || admin2 || cleanIndianCityName(state);
    }
  }

  // 3. Ensure valid City (never bare "India")
  if (!city || city.toLowerCase() === 'india') {
    city = admin3 || admin2 || cleanIndianCityName(state) || 'New Delhi';
  }

  // Deduplication: sectorOrArea and city MUST NOT be identical word
  if (sectorOrArea.toLowerCase() === city.toLowerCase()) {
    if (admin2 && admin2.toLowerCase() !== city.toLowerCase()) {
      city = admin2;
    } else if (route && route.toLowerCase() !== city.toLowerCase()) {
      sectorOrArea = route;
    } else if (displayName && displayName.toLowerCase() !== city.toLowerCase()) {
      sectorOrArea = displayName;
    } else if (state && cleanIndianCityName(state).toLowerCase() !== city.toLowerCase()) {
      city = cleanIndianCityName(state);
    }
  }

  // 4. Construct street/gali (Premise, Route, Society/Apartment building name)
  // CRITICAL: NEVER inject sublocality1 or sublocality2 (e.g. Munirka, Hauz Khas) into streetGali.
  // In India, sublocalities are municipal wards/areas, NOT street addresses or societies!
  const streetParts = [
    premise,
    route
  ].filter(Boolean);

  let streetGali = streetParts.join(', ');
  if (!streetGali && displayName) {
    const isGenericOrLocality = 
      displayName.toLowerCase() === sectorOrArea.toLowerCase() ||
      displayName.toLowerCase() === city.toLowerCase() ||
      displayName.toLowerCase().includes('new delhi') ||
      displayName.toLowerCase().includes('noida') ||
      displayName.toLowerCase().includes('greater noida');
      
    if (!isGenericOrLocality) {
      streetGali = displayName;
    }
  }

  // Filter out any neighboring locality names that might have leaked into streetGali
  if (streetGali) {
    const knownConflictingLocs = [
      'munirka', 'ber sarai', 'jia sarai', 'katwaria sarai', 'hauz khas', 
      'green park', 'safdarjung', 'malviya nagar', 'vasant kunj', 'saket', 
      'ansal golf', 'pari chowk', 'surajpur', 'omega'
    ];
    for (const loc of knownConflictingLocs) {
      if (streetGali.toLowerCase() === loc && !sectorOrArea.toLowerCase().includes(loc)) {
        streetGali = '';
        break;
      }
    }
  }

  // Resolved display title (like Google Maps)
  let resolvedDisplayTitle = displayName || sectorOrArea;
  if (!resolvedDisplayTitle || resolvedDisplayTitle.toLowerCase() === city.toLowerCase()) {
    resolvedDisplayTitle = sectorOrArea;
  }

  // Construct landmark: store POIs in landmark so they don't overwrite locality name
  let landmark = landmarkComp;
  if (!landmark && displayName && displayName !== sectorOrArea) {
    landmark = `Near ${displayName}`;
  } else if (!landmark && sectorOrArea) {
    landmark = `Near ${sectorOrArea} Main Chowk`;
  }

  // Formatted Area / City (e.g. "Khajurahat, Ayodhya" or "Tripura Bhairwi, Varanasi" or "JNU Campus, New Delhi")
  let areaCity = `${sectorOrArea}, ${city}`;
  if (sectorOrArea.toLowerCase() === city.toLowerCase()) {
    const specificChunk = sublocality2 || sublocality1 || neighborhood || route || displayName || 'Main Area';
    areaCity = `${specificChunk}, ${city}`;
  }

  return {
    displayName: resolvedDisplayTitle,
    formattedAddress: place.formattedAddress || areaCity,
    houseNo: premise,
    streetGali: streetGali,
    landmark: landmark,
    areaCity: areaCity,
    city: city,
    state: state,
    pincode: pincode,
    lat: place.location?.latitude ?? fallbackLat,
    lon: place.location?.longitude ?? fallbackLon,
    isGoogleVerified: true
  };
}

/**
 * Reverse Geocode via Google Places API (New) `searchNearby` + Precision Local Geocoder + OSM fallback
 */
export async function reverseGeocodeGoogle(lat: number, lon: number): Promise<GoogleResolvedLocation> {
  // 1. High-precision Ground Truth Bounding Box check ONLY for Delhi & NCR
  const isNCR = lat >= 28.30 && lat <= 28.88 && lon >= 76.85 && lon <= 77.55;
  let localExact: any = null;
  if (isNCR) {
    localExact = resolveNoidaOrGreaterNoida({}, '', lat, lon);
  }

  // 2. Query Google Places API searchNearby FIRST (fast Google edge CDN in <150ms)
  try {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types'
      },
      body: JSON.stringify({
        maxResultCount: 8,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: 1000.0
          }
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.places && data.places.length > 0) {
        // Consensus sublocality across nearby places (e.g. "Ansal Golf Links 1")
        const sublocCounts: Record<string, number> = {};
        for (const p of data.places) {
          const s1 = p.addressComponents?.find((c: any) => c.types && c.types.includes('sublocality_level_1'))?.longText;
          if (s1 && !/district|division|gautam/i.test(s1)) {
            sublocCounts[s1] = (sublocCounts[s1] || 0) + 1;
          }
        }
        let topSubloc = '';
        let topCount = 0;
        for (const [sub, cnt] of Object.entries(sublocCounts)) {
          if (cnt > topCount) {
            topSubloc = sub;
            topCount = cnt;
          }
        }

        // Sort places by true Euclidean distance to (lat, lon)
        const sortedPlaces = [...data.places].sort((a, b) => {
          const distA = Math.hypot((a.location?.latitude ?? lat) - lat, (a.location?.longitude ?? lon) - lon);
          const distB = Math.hypot((b.location?.latitude ?? lat) - lat, (b.location?.longitude ?? lon) - lon);
          return distA - distB;
        });

        // Parse nearest place
        const nearest = sortedPlaces[0];
        const parsed = parseGooglePlace(nearest, lat, lon);

        // If strong consensus sublocality found (e.g. "Ansal Golf Links 1")
        if (topSubloc && topCount >= 2) {
          if (/ansal golf/i.test(topSubloc)) {
            parsed.displayName = 'Ansal Golf Links 1';
            parsed.areaCity = 'Ansal Golf Links 1, Greater Noida';
          } else if (!parsed.displayName.toLowerCase().includes(topSubloc.toLowerCase())) {
            parsed.displayName = topSubloc;
            parsed.areaCity = `${topSubloc}, ${parsed.city}`;
          }
        }

        // If local ground-truth bounding box (e.g. Ber Sarai) matched, ensure areaCity is exact:
        if (localExact && localExact.locality && localExact.locality !== 'Central' && localExact.locality !== 'Sector 18') {
          parsed.areaCity = localExact.formattedArea;
          parsed.city = localExact.city;

          // Check if parsed.streetGali contains any conflicting neighboring locality (e.g. Munirka in Ber Sarai)
          const conflictsWithLocality = [
            'munirka', 'ber sarai', 'jia sarai', 'katwaria sarai', 'hauz khas', 
            'green park', 'safdarjung', 'malviya nagar', 'vasant kunj', 'saket'
          ].some(loc => parsed.streetGali.toLowerCase().includes(loc) && !localExact.locality.toLowerCase().includes(loc));

          if (!parsed.streetGali || parsed.streetGali.includes('Main Gali') || conflictsWithLocality) {
            parsed.streetGali = localExact.suggestedGali || '';
          }
          if (localExact.suggestedLandmark && (!parsed.landmark || conflictsWithLocality || (parsed.landmark.toLowerCase().includes('munirka') && !localExact.locality.toLowerCase().includes('munirka')))) {
            parsed.landmark = localExact.suggestedLandmark;
          }
        }

        return parsed;
      }
    }
  } catch (err) {
    console.warn('Google Places reverse geocode warning, using OSM fallback:', err);
  }

  // 3. EMERGENCY FALLBACK: OSM Nominatim reverse geocode (only called if Google Places failed)
  let addr: any = {};
  let fullDisplayName = '';
  let osmLocality = '';
  let osmCity = '';
  let osmRoad = '';
  let osmState = '';
  let osmPincode = '';

  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'QuickServe-Marketplace-App/1.0' } }
    );
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      addr = osmData.address || {};
      fullDisplayName = osmData.display_name || '';
      osmState = addr.state || '';
      osmPincode = addr.postcode || '';
      osmRoad = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || '';
    }
  } catch (e) {
    console.warn('OSM reverse geocode error:', e);
  }

  // 4. FULL INDIAN CADASTRAL HIERARCHY EXTRACTION (Gaon, Gali, Mohalla, Zila)
  const village = addr.village || addr.hamlet || addr.isolated_dwelling || '';
  const mohalla = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.subdivision || '';
  const landmarkPoi = addr.amenity || addr.building || addr.tourism || addr.historic || addr.leisure || addr.shop || '';

  const rawCityDist = 
    addr.city || 
    addr.town || 
    addr.municipality || 
    addr.state_district || 
    addr.county || 
    addr.district || 
    '';

  let finalCity = cleanIndianCityName(rawCityDist);
  let finalLocality = '';

  // Case A: Rural Village (Gaon / Dehat / Tola / Gram Panchayat)
  if (village) {
    finalLocality = (addr.hamlet && addr.village && addr.hamlet.toLowerCase() !== addr.village.toLowerCase())
      ? `${addr.hamlet}, ${addr.village}`
      : village;
    if (addr.state_district && cleanIndianCityName(addr.state_district).toLowerCase() !== finalLocality.toLowerCase()) {
      finalCity = cleanIndianCityName(addr.state_district);
    }
  }
  // Case B: Urban Mohalla / Ward / Colony / Nagar
  else if (mohalla) {
    finalLocality = mohalla;
  }
  // Case C: Gali / Road / Marg / Path
  else if (osmRoad) {
    finalLocality = osmRoad;
  }
  // Case D: Landmark (Mandir, College, Hospital, Dhabha)
  else if (landmarkPoi) {
    finalLocality = landmarkPoi;
  }
  // Case E: Extract from display_name tokens
  else if (fullDisplayName) {
    const parts = fullDisplayName.split(',').map((s: string) => s.trim()).filter(Boolean);
    const nonIndia = parts.filter((p: string) => !/^india$/i.test(p));
    if (nonIndia.length > 0) {
      finalLocality = nonIndia[0];
    }
  }

  // City Fallback
  if (!finalCity || finalCity.toLowerCase() === 'india') {
    finalCity = cleanIndianCityName(addr.state_district || addr.county || osmState || (isNCR ? 'New Delhi' : 'Service Location'));
  }

  // If local NCR bounding box matched (e.g. JNU Campus / Ber Sarai / Munirka / Pari Chowk / Omega 1), prioritize it:
  if (localExact && localExact.locality && localExact.locality !== 'Central' && localExact.locality !== 'New Delhi') {
    finalLocality = localExact.locality;
    finalCity = localExact.city;
  }

  // JNU & South Delhi Precision override from display_name or postcode
  const fullLower = fullDisplayName.toLowerCase();
  if (
    (osmPincode === '110067' || fullLower.includes('jnu') || fullLower.includes('jawaharlal nehru')) &&
    !fullLower.includes('munirka')
  ) {
    finalLocality = 'JNU Campus';
    finalCity = 'New Delhi';
  }

  // Deduplication: Locality and City MUST NOT be the same word
  if (finalLocality.toLowerCase() === finalCity.toLowerCase()) {
    if (osmRoad && osmRoad.toLowerCase() !== finalCity.toLowerCase()) {
      finalLocality = osmRoad;
    } else if (landmarkPoi) {
      finalLocality = landmarkPoi;
    } else if (addr.state_district && cleanIndianCityName(addr.state_district).toLowerCase() !== finalCity.toLowerCase()) {
      finalCity = cleanIndianCityName(addr.state_district);
    } else if (addr.county && cleanIndianCityName(addr.county).toLowerCase() !== finalLocality.toLowerCase()) {
      finalCity = cleanIndianCityName(addr.county);
    }
  }

  // Formatted Area: ALWAYS guaranteed "<Locality / Village / Mohalla>, <City / District>"
  let areaCity = `${finalLocality}, ${finalCity}`;
  if (finalLocality.toLowerCase() === finalCity.toLowerCase()) {
    areaCity = `${village ? village + ' Village' : (osmRoad || 'Main Sector')}, ${finalCity}`;
  }

  // Accurate Gali / Rasta
  let streetGali = '';
  if (localExact && localExact.suggestedGali) {
    streetGali = localExact.suggestedGali;
  } else if (osmRoad) {
    streetGali = mohalla && !osmRoad.toLowerCase().includes(mohalla.toLowerCase())
      ? `${osmRoad}, ${mohalla}`
      : osmRoad;
  } else if (mohalla) {
    streetGali = `${mohalla} Main Gali / Road`;
  } else if (village) {
    streetGali = `${village} Main Rasta / Ward No.`;
  } else {
    streetGali = `${finalLocality} Road`;
  }

  // Accurate Landmark
  let landmark = '';
  if (localExact && localExact.suggestedLandmark) {
    landmark = localExact.suggestedLandmark;
  } else if (landmarkPoi) {
    landmark = `Near ${landmarkPoi}`;
  } else if (village) {
    landmark = `Near ${village} Panchayat Bhavan / Main Chowk`;
  } else if (finalLocality) {
    landmark = `Near ${finalLocality} Main Chowk`;
  } else {
    landmark = `Near ${finalCity}`;
  }

  return {
    displayName: landmarkPoi || finalLocality,
    formattedAddress: fullDisplayName || areaCity,
    houseNo: addr.house_number || '',
    streetGali: streetGali,
    landmark: landmark,
    areaCity: areaCity,
    city: finalCity,
    state: osmState,
    pincode: osmPincode,
    lat,
    lon,
    isGoogleVerified: false
  };
}

/**
 * Search Places Autocomplete using Google Places API (New)
 */
export async function searchPlacesGoogle(query: string): Promise<GooglePlaceSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY
      },
      body: JSON.stringify({
        input: query.trim(),
        includedRegionCodes: ['in']
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        return data.suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => {
            const p = s.placePrediction;
            return {
              placeId: p.placeId || (p.place ? p.place.replace('places/', '') : ''),
              mainText: p.structuredFormat?.mainText?.text || p.text?.text || '',
              secondaryText: p.structuredFormat?.secondaryText?.text || '',
              fullText: p.text?.text || ''
            };
          });
      }
    }
  } catch (err) {
    console.warn('Google Places Autocomplete error:', err);
  }

  return [];
}

/**
 * Fetch Place Details by Google Place ID
 */
export async function getPlaceDetailsGoogle(placeId: string): Promise<GoogleResolvedLocation | null> {
  if (!placeId) return null;
  const cleanId = placeId.startsWith('places/') ? placeId.replace('places/', '') : placeId;

  try {
    const url = `https://places.googleapis.com/v1/places/${cleanId}?fields=id,displayName,formattedAddress,location,addressComponents&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return parseGooglePlace(data);
    }
  } catch (err) {
    console.warn('Google Place Details error:', err);
  }

  return null;
}
