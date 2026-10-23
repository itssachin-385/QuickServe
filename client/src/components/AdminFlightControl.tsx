import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Booking, Professional, ServiceZone } from '../types';
import { 
  Navigation, MapPin, Truck, Phone, MessageCircle, 
  CheckCircle2, AlertCircle, RefreshCw, Zap, Shield, 
  Radio, Compass, Layers, UserCheck, Flame, Clock, 
  Send, ExternalLink, ChevronRight, Filter
} from 'lucide-react';
import { API_BASE } from '../api';

// Fix Leaflet default icon paths if needed
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AdminFlightControlProps {
  bookings: Booking[];
  partners: Professional[];
  zones?: ServiceZone[];
  onRefresh: () => void;
  lang?: 'en' | 'hi';
}

// Hub Central Coordinates (Greater Noida / Noida Cluster)
const HUB_COORDINATES = {
  pari_chowk: { lat: 28.4744, lng: 77.5040, name: 'Pari Chowk Central Hub' },
  sector_62: { lat: 28.6280, lng: 77.3649, name: 'Noida Sector 62 Cluster' },
  alpha_1: { lat: 28.4680, lng: 77.5120, name: 'Alpha 1 Residential Hub' },
  expressway: { lat: 28.5355, lng: 77.3910, name: 'Expressway Tech Cluster' }
};

// Haversine formula for exact spherical distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const AdminFlightControl: React.FC<AdminFlightControlProps> = ({
  bookings,
  partners,
  onRefresh
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'in_transit' | 'completed'>('all');
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [reassignSelectProId, setReassignSelectProId] = useState<{ [bookingId: string]: string }>({});

  // Seed coordinates if bookings or partners have no lat/lng recorded
  const normalizedPartners = useMemo(() => {
    return (partners || []).map((p, idx) => {
      // Deterministic spread around Greater Noida hub
      const latOffset = (Math.sin(idx * 1.7) * 0.035);
      const lngOffset = (Math.cos(idx * 2.3) * 0.04);
      return {
        ...p,
        live_lat: p.current_lat || (HUB_COORDINATES.pari_chowk.lat + latOffset),
        live_lng: p.current_lng || (HUB_COORDINATES.pari_chowk.lng + lngOffset),
        is_online: p.verification_state === 'verified' ? (idx % 4 !== 0) : false,
        active_status: idx % 3 === 0 ? 'on_job' : 'available'
      };
    });
  }, [partners]);

  const normalizedBookings = useMemo(() => {
    return (bookings || []).map((b, idx) => {
      const latOffset = (Math.cos(idx * 2.1) * 0.03);
      const lngOffset = (Math.sin(idx * 1.9) * 0.035);
      return {
        ...b,
        delivery_lat: b.delivery_lat || (HUB_COORDINATES.pari_chowk.lat + latOffset),
        delivery_lng: b.delivery_lng || (HUB_COORDINATES.pari_chowk.lng + lngOffset)
      };
    });
  }, [bookings]);

  // Telemetry Metrics
  const activePartnersCount = normalizedPartners.filter(p => p.is_online).length;
  const unassignedCount = normalizedBookings.filter(b => !b.professional_id && b.status !== 'cancelled' && b.status !== 'completed').length;
  const inTransitCount = normalizedBookings.filter(b => b.professional_id && b.status !== 'completed' && b.status !== 'cancelled').length;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [HUB_COORDINATES.pari_chowk.lat, HUB_COORDINATES.pari_chowk.lng],
      zoom: 13,
      zoomControl: false
    });

    // Dark SaaS tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Markers & Routes dynamically whenever data or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routesLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;
    markersLayer.clearLayers();
    routesLayer.clearLayers();

    // 1. Plot Active Partners
    normalizedPartners.forEach((pro) => {
      if (!pro.is_online) return;

      const isIdle = pro.active_status === 'available';
      const markerHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-9 h-9 rounded-full ${isIdle ? 'bg-emerald-500' : 'bg-blue-600'} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black transition-transform transform hover:scale-110">
            🛵
          </div>
          <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full ${isIdle ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'}"></span>
          <div class="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
            ${pro.name} (${pro.service_name || 'Partner'})
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-partner-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([pro.live_lat, pro.live_lng], { icon: customIcon });
      marker.bindPopup(`
        <div class="p-2 min-w-[180px] font-sans text-xs">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full ${isIdle ? 'bg-emerald-500' : 'bg-blue-600'}"></span>
            <strong class="text-sm font-bold text-slate-900">${pro.name}</strong>
          </div>
          <p class="text-slate-600 text-[11px]">${pro.service_name || 'Official Partner'}</p>
          <p class="text-slate-500 text-[10px] mt-1">📞 +91 ${pro.phone || '9570151834'}</p>
          <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase ${isIdle ? 'text-emerald-600' : 'text-blue-600'}">
              ${isIdle ? '🟢 Available' : '🔵 En-Route'}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">Rating 4.9★</span>
          </div>
        </div>
      `);
      marker.addTo(markersLayer);
    });

    // 2. Plot Customer Bookings
    const filteredBookings = normalizedBookings.filter(b => {
      if (filterType === 'unassigned') return !b.professional_id && b.status !== 'cancelled' && b.status !== 'completed';
      if (filterType === 'in_transit') return !!b.professional_id && b.status !== 'completed' && b.status !== 'cancelled';
      if (filterType === 'completed') return b.status === 'completed';
      return true;
    });

    filteredBookings.forEach((b) => {
      const isAssigned = !!b.professional_id;
      const markerHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-9 h-9 rounded-2xl ${isAssigned ? 'bg-[#E11D48]' : 'bg-amber-500 animate-pulse'} border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black transition-transform transform hover:scale-110">
            🏠
          </div>
          <div class="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-10 bg-[#0B0F19] border border-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
            #${b.booking_reference} • ${b.customer_name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-booking-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([b.delivery_lat, b.delivery_lng], { icon: customIcon });
      marker.on('click', () => setSelectedBooking(b));

      marker.bindPopup(`
        <div class="p-2 min-w-[200px] font-sans text-xs">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${isAssigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${isAssigned ? 'Assigned' : 'Requires Dispatch'}
            </span>
            <span class="text-xs font-bold font-mono text-slate-700">₹${b.total_amount || 299}</span>
          </div>
          <strong class="text-sm font-bold text-slate-900 block truncate">${b.customer_name}</strong>
          <p class="text-slate-600 text-[11px] truncate">${b.service_title || b.service_id}</p>
          <p class="text-slate-500 text-[10px] mt-1 truncate">📍 ${b.customer_address || b.locality || 'Greater Noida'}</p>
        </div>
      `);
      marker.addTo(markersLayer);

      // 3. Draw Connecting Route Line if assigned to a partner
      if (isAssigned && b.professional_id) {
        const assignedPro = normalizedPartners.find(p => p.id === b.professional_id);
        if (assignedPro) {
          const polyline = L.polyline(
            [
              [assignedPro.live_lat, assignedPro.live_lng],
              [b.delivery_lat, b.delivery_lng]
            ],
            {
              color: '#E11D48',
              weight: 3,
              opacity: 0.7,
              dashArray: '6, 8'
            }
          );
          polyline.addTo(routesLayer);
        }
      }
    });

  }, [normalizedPartners, normalizedBookings, filterType]);

  // Handler: 1-Click Auto-Dispatch Nearest Partner
  const handleAutoDispatch = async (booking: Booking, targetProId?: string) => {
    let proIdToAssign = targetProId;

    if (!proIdToAssign) {
      // Find nearest partner matching trade or general nearest
      const availablePros = normalizedPartners.filter(p => p.is_online);
      if (availablePros.length === 0) {
        alert('No online technicians available in this zone right now.');
        return;
      }

      // Sort by proximity
      const bookingLat = booking.delivery_lat || HUB_COORDINATES.pari_chowk.lat;
      const bookingLng = booking.delivery_lng || HUB_COORDINATES.pari_chowk.lng;
      const sortedByDistance = [...availablePros].sort((a, b) => {
        const distA = calculateHaversineDistance(bookingLat, bookingLng, a.live_lat, a.live_lng);
        const distB = calculateHaversineDistance(bookingLat, bookingLng, b.live_lat, b.live_lng);
        return distA - distB;
      });

      proIdToAssign = sortedByDistance[0].id;
    }

    const matchedPro = normalizedPartners.find(p => p.id === proIdToAssign);
    if (!matchedPro) return;

    setIsAssigning(booking.id);
    try {
      const res = await fetch(`${API_BASE}/admin/assign-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': '2026'
        },
        body: JSON.stringify({
          booking_id: booking.id,
          professional_id: proIdToAssign
        })
      });

      if (res.ok) {
        setSuccessMsg(`⚡ Auto-Dispatched! Booking #${booking.booking_reference} successfully assigned to ${matchedPro.name}!`);
        setTimeout(() => setSuccessMsg(''), 4500);
        onRefresh();
        setSelectedBooking(null);
      } else {
        alert('Assignment failed. Please check partner availability.');
      }
    } catch (e) {
      alert('Network error while dispatching assignment.');
    } finally {
      setIsAssigning(null);
    }
  };

  // Re-center Map to Pari Chowk Hub
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([HUB_COORDINATES.pari_chowk.lat, HUB_COORDINATES.pari_chowk.lng], 13);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* 1. TOP FLIGHT CONTROL TELEMETRY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Active Fleet */}
        <div className="p-3.5 bg-[#121826] border border-[#1F293D] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Fleet</p>
            <h4 className="text-lg font-black text-white">{activePartnersCount} <span className="text-xs font-normal text-emerald-400">Online</span></h4>
          </div>
        </div>

        {/* Card 2: Pending Dispatch */}
        <div className="p-3.5 bg-[#121826] border border-[#1F293D] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Dispatch</p>
            <h4 className="text-lg font-black text-white">{unassignedCount} <span className="text-xs font-normal text-amber-400">Action</span></h4>
          </div>
        </div>

        {/* Card 3: En-Route Jobs */}
        <div className="p-3.5 bg-[#121826] border border-[#1F293D] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-[#F43F5E] shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">In-Transit Jobs</p>
            <h4 className="text-lg font-black text-white">{inTransitCount} <span className="text-xs font-normal text-slate-300">Live</span></h4>
          </div>
        </div>

        {/* Card 4: Cluster Hub Health */}
        <div className="p-3.5 bg-[#121826] border border-[#1F293D] rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cluster Hub</p>
            <h4 className="text-xs font-bold text-white mt-0.5">Pari Chowk Central</h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Optimal Coverage
            </span>
          </div>
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 bg-[#1A253D] hover:bg-[#223354] text-slate-300 rounded-xl border border-[#2B3C61] transition-all cursor-pointer"
            title="Recenter Radar"
          >
            <Compass className="w-4 h-4 text-pink-400" />
          </button>
        </div>
      </div>

      {/* Global Success Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. MAP & OPERATIONS SPLIT DESK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Live Interactive Radar Map (8 Cols) */}
        <div className="lg:col-span-8 bg-[#121826] border border-[#1F293D] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
          
          {/* Map Sub-Header Bar */}
          <div className="p-3 bg-[#0E1524] border-b border-[#1F293D] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-ping"></span>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Live Hyperlocal Operations Radar
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-[11px]">
              {(['all', 'unassigned', 'in_transit'] as const).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFilterType(ft)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    filterType === ft
                      ? 'bg-[#E11D48] text-white shadow-xs'
                      : 'bg-[#172136] text-slate-400 hover:text-white'
                  }`}
                >
                  {ft === 'all' && 'All Fleet & Orders'}
                  {ft === 'unassigned' && '🚨 Unassigned Only'}
                  {ft === 'in_transit' && '🛵 In-Transit Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Map View Canvas */}
          <div className="relative flex-1 w-full bg-[#0B0F19]">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

            {/* Radar Floating Legend */}
            <div className="absolute bottom-3 left-3 z-20 bg-[#0B0F19]/90 backdrop-blur-md border border-[#1F293D] p-2.5 rounded-xl text-[10px] text-slate-300 space-y-1 shadow-lg pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Available Partner (Idle)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>En-Route Partner (On Job)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]"></span>
                <span>Customer Doorstep Pin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Dispatch & Emergency Reassign Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-[#121826] border border-[#1F293D] rounded-3xl p-4 flex flex-col h-[520px]">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#1F293D] mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dispatch Queue</h3>
              <p className="text-[10px] text-slate-400">Urban Company Style Proximity Dispatch</p>
            </div>
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold rounded-full">
              {normalizedBookings.length} Total
            </span>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {normalizedBookings.map((b) => {
              const isAssigned = !!b.professional_id;
              const assignedPro = normalizedPartners.find(p => p.id === b.professional_id);

              // Find closest partner calculation
              const nearbyPros = [...normalizedPartners]
                .filter(p => p.is_online)
                .map(p => ({
                  ...p,
                  distance: calculateHaversineDistance(b.delivery_lat, b.delivery_lng, p.live_lat, p.live_lng)
                }))
                .sort((a, b) => a.distance - b.distance);

              const closestMatch = nearbyPros[0];

              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    selectedBooking?.id === b.id
                      ? 'bg-[#19243C] border-[#E11D48] shadow-md'
                      : 'bg-[#0E1524] border-[#1F293D] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-pink-400">
                      #{b.booking_reference || b.id.slice(-6)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      isAssigned ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    }`}>
                      {isAssigned ? 'Assigned' : 'Needs Dispatch'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate">{b.customer_name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{b.service_title || 'Home Service'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">📍 {b.customer_address || b.locality || 'Greater Noida'}</p>

                  {/* If already assigned */}
                  {isAssigned && assignedPro ? (
                    <div className="mt-2.5 p-2 bg-[#131B2E] border border-[#1F293D] rounded-xl flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Assigned Official</p>
                        <p className="text-xs font-bold text-emerald-400 truncate">{assignedPro.name}</p>
                        <p className="text-[10px] text-slate-500">📞 {assignedPro.phone}</p>
                      </div>

                      {/* Emergency Shift Dropdown */}
                      <div className="flex flex-col items-end gap-1">
                        <select
                          value={reassignSelectProId[b.id] || ''}
                          onChange={(e) => {
                            const newProId = e.target.value;
                            if (newProId) {
                              setReassignSelectProId(prev => ({ ...prev, [b.id]: newProId }));
                              handleAutoDispatch(b, newProId);
                            }
                          }}
                          className="px-2 py-1 bg-[#1E2C4A] border border-[#2B3E68] text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer outline-hidden"
                        >
                          <option value="">🚨 Shift...</option>
                          {normalizedPartners.filter(p => p.id !== assignedPro.id && p.is_online).map(p => (
                            <option key={p.id} value={p.id}>Shift to {p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* If Unassigned: 1-Click Auto Match & Dispatch Button */
                    <div className="mt-2.5 space-y-2">
                      {closestMatch && (
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Nearest: <strong className="text-white">{closestMatch.name}</strong></span>
                          <span className="text-emerald-400 font-mono font-bold">~{closestMatch.distance} km away</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isAssigning === b.id}
                        onClick={() => handleAutoDispatch(b, closestMatch?.id)}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Zap className={`w-3.5 h-3.5 ${isAssigning === b.id ? 'animate-spin' : ''}`} />
                        <span>{isAssigning === b.id ? 'Dispatching...' : '⚡ Auto-Dispatch Nearest'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
