import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Booking } from '../types';
import { 
  X, Phone, MessageCircle, ShieldCheck, MapPin, 
  Navigation, Clock, CheckCircle2, ChevronRight, 
  AlertCircle, Sparkles, Volume2 
} from 'lucide-react';
import { playDoorbellChime } from '../utils/sound';

interface LiveTrackingModalProps {
  booking: Booking;
  onClose: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  booking,
  onClose
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const partnerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Customer Coordinates (Default Pari Chowk / Greater Noida if not set)
  const customerLat = 28.4744;
  const customerLng = 77.5040;

  // Staging Hub (Dispatch origin: Pari Chowk Hub ~2.8 km away)
  const hubLat = 28.4550;
  const hubLng = 77.4850;

  // Tracking State (animated movement along route)
  const [progressFraction, setProgressFraction] = useState(0.35); // starts 35% on the way
  const [etaMinutes, setEtaMinutes] = useState(11);
  const [distanceKm, setDistanceKm] = useState(2.3);
  const [hasArrived, setHasArrived] = useState(false);
  const [activeView, setActiveView] = useState<'partner' | 'customer'>('partner');

  const partnerName = booking.professional_name || 'Rahul Kumar';
  const partnerPhone = (booking.professional_phone || '9570151834').replace(/\D/g, '').slice(-10);
  const startOtp = booking.service_start_otp || (booking.booking_reference ? booking.booking_reference.slice(-4) : '4821');

  // Waypoints along road network
  const waypoints: [number, number][] = [
    [hubLat, hubLng],
    [28.4590, 77.4910],
    [28.4635, 77.4960],
    [28.4680, 77.4995],
    [28.4715, 77.5020],
    [customerLat, customerLng]
  ];

  // Helper to interpolate position along polyline
  const getInterpolatedPos = (frac: number): [number, number] => {
    const clamped = Math.max(0, Math.min(1, frac));
    const totalSegments = waypoints.length - 1;
    const segIndex = Math.min(Math.floor(clamped * totalSegments), totalSegments - 1);
    const subFrac = (clamped * totalSegments) - segIndex;

    const p1 = waypoints[segIndex];
    const p2 = waypoints[segIndex + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * subFrac;
    const lng = p1[1] + (p2[1] - p1[1]) * subFrac;
    return [lat, lng];
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.4650, 77.4950],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Clean Google Maps Roadmap tiles
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    // Route Polyline
    const route = L.polyline(waypoints, {
      color: '#DB2777',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(map);
    routeLineRef.current = route;

    // Customer Marker (Doorstep Pin)
    const customerIcon = L.divIcon({
      className: 'custom-customer-icon',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background:#0F172A; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.3); white-space:nowrap; margin-bottom:4px;">
            🏠 Your Doorstep
          </div>
          <div style="width:36px; height:36px; background:#E11D48; border:3px solid #fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(225,29,72,0.5);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [120, 60],
      iconAnchor: [60, 54]
    });

    L.marker([customerLat, customerLng], { icon: customerIcon }).addTo(map);

    // Partner Marker (Moving Motorbike / Technician)
    const initialPos = getInterpolatedPos(progressFraction);
    const partnerIcon = L.divIcon({
      className: 'custom-partner-icon',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background:#DB2777; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; box-shadow:0 2px 8px rgba(219,39,119,0.4); white-space:nowrap; margin-bottom:4px;">
            🛵 ${partnerName}
          </div>
          <div style="position:relative; width:40px; height:40px; background:#fff; border:3px solid #DB2777; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(219,39,119,0.4);">
            <span style="font-size:20px;">🛵</span>
          </div>
        </div>
      `,
      iconSize: [120, 60],
      iconAnchor: [60, 54]
    });

    const partnerMarker = L.marker(initialPos, { icon: partnerIcon }).addTo(map);
    partnerMarkerRef.current = partnerMarker;

    mapInstanceRef.current = map;

    setTimeout(() => { map.invalidateSize(); }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Live GPS Simulation Interval (moves partner closer to customer)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgressFraction(prev => {
        if (prev >= 1) {
          setHasArrived(true);
          setEtaMinutes(0);
          setDistanceKm(0);
          return 1;
        }

        const next = Math.min(1, prev + 0.05);
        const remDistance = Math.max(0, parseFloat(((1 - next) * 3.5).toFixed(1)));
        const remEta = Math.max(1, Math.round((1 - next) * 16));

        setDistanceKm(remDistance);
        setEtaMinutes(remEta);

        if (next >= 0.95 && !hasArrived) {
          setHasArrived(true);
          playDoorbellChime();
        }

        // Update marker on map
        if (partnerMarkerRef.current && mapInstanceRef.current) {
          const newPos = getInterpolatedPos(next);
          partnerMarkerRef.current.setLatLng(newPos);
        }

        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [hasArrived]);

  const centerOnPartner = () => {
    if (!mapInstanceRef.current) return;
    const pos = getInterpolatedPos(progressFraction);
    mapInstanceRef.current.flyTo(pos, 16, { duration: 0.8 });
    setActiveView('partner');
  };

  const centerOnCustomer = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([customerLat, customerLng], 16, { duration: 0.8 });
    setActiveView('customer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-pink-100">
        
        {/* Top Header */}
        <div className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-pink-100 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Live Partner Tracking</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE GPS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">#{booking.booking_reference} • {booking.service_title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container Area */}
        <div className="relative flex-1 min-h-[280px] bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Live Status Bar on Map */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-pink-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                🛵
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {hasArrived ? 'Status: Arrived' : 'Estimated Arrival'}
                </p>
                <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  {hasArrived ? (
                    <span className="text-emerald-600">At Doorstep</span>
                  ) : (
                    <>
                      <span>{etaMinutes} Mins</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-slate-500">{distanceKm} km away</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Recenter Controls */}
            <div className="pointer-events-auto flex flex-col gap-1.5">
              <button
                type="button"
                onClick={centerOnPartner}
                className={`p-2.5 rounded-xl shadow-md border text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'partner'
                    ? 'bg-pink-600 text-white border-pink-700 shadow-pink-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Focus on Partner"
              >
                🛵
              </button>
              <button
                type="button"
                onClick={centerOnCustomer}
                className={`p-2.5 rounded-xl shadow-md border text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'customer'
                    ? 'bg-pink-600 text-white border-pink-700 shadow-pink-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Focus on Doorstep"
              >
                🏠
              </button>
            </div>
          </div>

          {/* Arrived Notification Banner on Map */}
          {hasArrived && (
            <div className="absolute bottom-3 left-3 right-3 z-10 bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold">{partnerName} has arrived at your doorstep!</span>
              </div>
              <button
                type="button"
                onClick={() => playDoorbellChime()}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
                Ring Bell
              </button>
            </div>
          )}
        </div>

        {/* Bottom Details Sheet */}
        <div className="bg-white p-4 sm:p-5 border-t border-slate-100 space-y-3.5 shrink-0 overflow-y-auto max-h-[46vh]">
          
          {/* 1. Security Start OTP Card */}
          <div className="p-3.5 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-pink-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Doorstep Security Start OTP</p>
                <p className="text-[11px] text-slate-500">Share with {partnerName} upon arrival</p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 bg-white border border-pink-300 rounded-xl font-mono text-lg font-black text-pink-600 tracking-widest shadow-xs">
              {startOtp}
            </div>
          </div>

          {/* 2. Partner Details & Direct Connect (WhatsApp & Call) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                {partnerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{partnerName}</h4>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500">4.9 ★ (184 Services) • Hero Electric Optima</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://wa.me/91${partnerPhone}?text=${encodeURIComponent(`Hi ${partnerName}, I am tracking your arrival for QuickServe order #${booking.booking_reference}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              <a
                href={`tel:${partnerPhone}`}
                className="p-2 sm:px-3 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Call Partner"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </a>
            </div>
          </div>

          {/* 3. Delivery Address & Service Summary */}
          <div className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <MapPin className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-slate-900">Destination: </span>
              <span>{booking.customer_address || booking.locality || 'Customer Doorstep, Greater Noida'}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
