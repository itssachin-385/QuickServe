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

  if (combinedText.includes('ber sarai') || combinedText.includes('bersarai')) {
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
  } else if (combinedText.includes('ansal golf') || combinedText.includes('golf link') || combinedText.includes('golf links') || combinedText.includes('om proptech') || combinedText.includes('shreeniwasm') || combinedText.includes('wayfarer')) {
    sectorOrArea = 'Ansal Golf Links 1';
    city = 'Greater Noida';
  } else if (combinedText.includes('omega 1') || combinedText.includes('shafipur') || combinedText.includes('psi i')) {
    sectorOrArea = 'Ansal Golf Links 1';
    city = 'Greater Noida';
  } else if (combinedText.includes('ifs villas') || combinedText.includes('aishani') || combinedText.includes('château') || combinedText.includes('chateau')) {
    sectorOrArea = 'IFS Villas';
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

  // 2. Hierarchical fallback if not matched in specific dictionary
  if (!sectorOrArea) {
    if (route && /sector|block|phase|pocket|colony|enclave/i.test(route)) {
      sectorOrArea = route;
    } else if (neighborhood) {
      sectorOrArea = neighborhood;
    } else if (sublocality2 && !/district|division/i.test(sublocality2)) {
      sectorOrArea = sublocality2;
    } else if (sublocality1 && !/district|division/i.test(sublocality1)) {
      sectorOrArea = sublocality1;
    } else if (route) {
      sectorOrArea = route;
    } else {
      sectorOrArea = locality || 'Central Area';
    }
  }

  // 3. City resolution - NEVER "India"
  if (!city) {
    if (/greater noida/i.test(fullAddress) || /greater noida/i.test(locality)) {
      city = 'Greater Noida';
    } else if (/noida/i.test(fullAddress) || /noida/i.test(locality)) {
      city = 'Noida';
    } else if (/delhi/i.test(fullAddress) || /delhi/i.test(locality) || /delhi/i.test(state)) {
      city = 'New Delhi';
    } else if (/gurugram|gurgaon/i.test(fullAddress) || /gurugram|gurgaon/i.test(locality)) {
      city = 'Gurugram';
    } else if (/ghaziabad/i.test(fullAddress) || /ghaziabad/i.test(locality)) {
      city = 'Ghaziabad';
    } else if (/faridabad/i.test(fullAddress) || /faridabad/i.test(locality)) {
      city = 'Faridabad';
    } else if (/bengaluru|bangalore/i.test(fullAddress) || /bengaluru|bangalore/i.test(locality)) {
      city = 'Bengaluru';
    } else if (/mumbai/i.test(fullAddress) || /mumbai/i.test(locality)) {
      city = 'Mumbai';
    } else if (/pune/i.test(fullAddress) || /pune/i.test(locality)) {
      city = 'Pune';
    } else if (/hyderabad/i.test(fullAddress) || /hyderabad/i.test(locality)) {
      city = 'Hyderabad';
    } else if (/kolkata/i.test(fullAddress) || /kolkata/i.test(locality)) {
      city = 'Kolkata';
    } else if (/chennai/i.test(fullAddress) || /chennai/i.test(locality)) {
      city = 'Chennai';
    } else if (/patna/i.test(fullAddress) || /patna/i.test(locality)) {
      city = 'Patna';
    } else if (/lucknow/i.test(fullAddress) || /lucknow/i.test(locality)) {
      city = 'Lucknow';
    } else if (/jaipur/i.test(fullAddress) || /jaipur/i.test(locality)) {
      city = 'Jaipur';
    } else if (/ahmedabad/i.test(fullAddress) || /ahmedabad/i.test(locality)) {
      city = 'Ahmedabad';
    } else if (/chandigarh/i.test(fullAddress) || /chandigarh/i.test(locality)) {
      city = 'Chandigarh';
    } else {
      const candidates = [locality, getComp('administrative_area_level_2'), getComp('administrative_area_level_3'), state];
      for (const cand of candidates) {
        const cleaned = cleanIndianCityName(cand);
        if (cleaned && cleaned.toLowerCase() !== 'india') {
          city = cleaned;
          break;
        }
      }
      if (!city || city.toLowerCase() === 'india') city = 'New Delhi';
    }
  }

  // 4. Construct street/gali
  const streetParts = [
    sublocality2 && sublocality2 !== sectorOrArea ? sublocality2 : '',
    sublocality1 && sublocality1 !== sectorOrArea ? sublocality1 : '',
    route && route !== sectorOrArea ? route : ''
  ].filter(Boolean);

  let streetGali = streetParts.join(', ');
  if (!streetGali && displayName) {
    streetGali = displayName;
  }

  const placeTypes = place.types || [];
  const isHousing = placeTypes.includes('housing_complex') || placeTypes.includes('residential');
  const isCommercialOrPrivate = 
    placeTypes.includes('liquor_store') || placeTypes.includes('store') || 
    placeTypes.includes('restaurant') || placeTypes.includes('food') || 
    placeTypes.includes('health') || placeTypes.includes('doctor') || 
    placeTypes.includes('dentist') || placeTypes.includes('bank') || 
    placeTypes.includes('finance') || placeTypes.includes('school');

  // Resolved display title (like Google Maps)
  let resolvedDisplayTitle = '';
  if (sectorOrArea) {
    if (sublocality2 && !sectorOrArea.toLowerCase().includes(sublocality2.toLowerCase())) {
      resolvedDisplayTitle = `${sublocality2}, ${sectorOrArea}`;
    } else {
      resolvedDisplayTitle = sectorOrArea;
    }
  } else if (sublocality1) {
    resolvedDisplayTitle = sublocality2 ? `${sublocality2}, ${sublocality1}` : sublocality1;
  } else if (isHousing && displayName) {
    resolvedDisplayTitle = displayName;
  } else if (neighborhood) {
    resolvedDisplayTitle = neighborhood;
  } else if (displayName && !isCommercialOrPrivate) {
    resolvedDisplayTitle = displayName;
  } else {
    resolvedDisplayTitle = city || 'Service Area';
  }

  // Construct landmark: store POIs in landmark so they don't overwrite locality name
  let landmark = landmarkComp;
  if (!landmark && displayName && displayName !== resolvedDisplayTitle) {
    landmark = `Near ${displayName}`;
  } else if (!landmark && sectorOrArea) {
    landmark = `Near ${sectorOrArea} Market`;
  }

  // Formatted Area / City (e.g. "Ansal Golf Links 1, Greater Noida" or "Ber Sarai, New Delhi")
  let areaCity = `${sectorOrArea || resolvedDisplayTitle}, ${city}`;
  if (sectorOrArea && sectorOrArea.toLowerCase() === city.toLowerCase()) {
    areaCity = city;
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

  // 2. Query OSM Nominatim reverse geocode at zoom=18 (ultra-high boundary resolution for Indian towns & cities)
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
      osmRoad = addr.road || addr.pedestrian || addr.footway || '';

      // Direct locality extraction from OSM address object
      osmLocality = 
        addr.neighbourhood || 
        addr.suburb || 
        addr.residential || 
        addr.village || 
        addr.hamlet || 
        addr.quarter || 
        addr.subdistrict || 
        '';

      // Raw city extraction
      const rawCity = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || '';
      osmCity = cleanIndianCityName(rawCity);
    }
  } catch (e) {
    console.warn('OSM reverse geocode error:', e);
  }

  // 3. Query Google Places API searchNearby with distance-sorted selection
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
            radius: 200.0
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
          if (!parsed.streetGali) parsed.streetGali = localExact.suggestedGali || '';
        } else if (osmLocality && osmLocality.toLowerCase() !== parsed.city.toLowerCase()) {
          if (/ber sarai/i.test(osmLocality)) {
            parsed.areaCity = 'Ber Sarai, New Delhi';
            parsed.city = 'New Delhi';
          }
        }

        return parsed;
      }
    }
  } catch (err) {
    console.warn('Google Places reverse geocode warning:', err);
  }

  // 4. PAN-INDIA CITY & LOCALITY RESOLUTION FROM NOMINATIM DISPLAY_NAME
  let finalCity = osmCity;
  let finalLocality = osmLocality;

  // If city or locality is missing, extract accurately from fullDisplayName
  if ((!finalCity || !finalLocality) && fullDisplayName) {
    const parts = fullDisplayName.split(',').map((s: string) => s.trim()).filter(Boolean);
    const nonIndia = parts.filter((p: string) => !/^india$/i.test(p));

    // Pop state from right if present
    if (nonIndia.length > 0) {
      const last = nonIndia[nonIndia.length - 1].replace(/\b\d{6}\b/g, '').trim().toLowerCase();
      if (INDIAN_STATES.has(last)) {
        nonIndia.pop();
      }
    }

    // Next from right is the city
    if (!finalCity && nonIndia.length > 0) {
      finalCity = cleanIndianCityName(nonIndia.pop() || '');
    }

    // Remaining right-most element is the locality (e.g. Mithapur, Koramangala, etc.)
    if (!finalLocality && nonIndia.length > 0) {
      const cand = nonIndia[nonIndia.length - 1];
      if (!cand.toLowerCase().includes(finalCity.toLowerCase())) {
        finalLocality = cand;
      }
    }
  }

  // If local NCR bounding box matched (e.g. Ber Sarai / Munirka / Pari Chowk / Omega 1), prioritize it:
  if (localExact && localExact.locality && localExact.locality !== 'Central' && localExact.locality !== 'New Delhi') {
    finalLocality = localExact.locality;
    finalCity = localExact.city;
  }

  // Absolute safety fallbacks: NEVER return "New Delhi" unless actually in NCR!
  if (!finalCity || finalCity.toLowerCase() === 'india') {
    if (isNCR) {
      finalCity = 'New Delhi';
    } else if (osmState) {
      finalCity = cleanIndianCityName(osmState);
    } else {
      finalCity = 'Service Location';
    }
  }

  if (!finalLocality || finalLocality.toLowerCase() === 'india') {
    finalLocality = finalCity;
  }

  let areaCity = `${finalLocality}, ${finalCity}`;
  if (finalLocality.toLowerCase() === finalCity.toLowerCase()) {
    areaCity = finalCity;
  }

  return {
    displayName: finalLocality,
    formattedAddress: fullDisplayName || areaCity,
    houseNo: addr.house_number || '',
    streetGali: osmRoad || `${finalLocality} Main Road`,
    landmark: addr.amenity || addr.building || `Near ${finalLocality}`,
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
