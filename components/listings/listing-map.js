'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

// Leaflet CSS is imported once globally via useEffect
let leafletLoaded = false;

export function ListingMap({ listings, photoMap }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);
  const [selectedListing, setSelectedListing] = useState(null);

  // Load Leaflet CSS once
  useEffect(() => {
    if (leafletLoaded) return;
    leafletLoaded = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      // Don't re-init if already created
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Center on Mississauga
      const map = L.map(mapRef.current, {
        center: [43.589, -79.644],
        zoom: 12,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      const markerGroup = L.layerGroup().addTo(map);
      markersRef.current = markerGroup;

      const validListings = listings.filter((l) => l.lat && l.lng);

      validListings.forEach((listing) => {
        const scoreColor = scoreColorHex(listing.hamzaScore);
        const photo = listing.photos?.[0] || (photoMap && photoMap[listing.id]) || '';

        // Custom icon with score color
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background: ${scoreColor};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: pointer;
          ">${listing.hamzaScore}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(markerGroup);

        // Popup content
        const popupContent = `
          <div style="min-width:220px;font-family:Inter,system-ui,sans-serif;">
            ${photo ? `<img src="${photo}" style="width:100%;height:120px;object-fit:cover;border-radius:8px 8px 0 0;margin:-14px -14px 8px -14px;width:calc(100% + 28px);" />` : ''}
            <div style="padding:0 2px;">
              <a href="/listings/${listing.id}" style="color:#1B2A4A;font-weight:600;font-size:13px;text-decoration:none;display:block;margin-bottom:2px;">
                ${listing.address}
              </a>
              <div style="font-size:16px;font-weight:700;color:#1B2A4A;margin-bottom:6px;">
                ${fmtK(listing.price)}
              </div>
              <div style="font-size:11px;color:#64748B;margin-bottom:6px;">
                ${listing.beds} bed · ${listing.baths} bath · ${listing.type}
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#F8FAFC;border-radius:6px;padding:6px;text-align:center;">
                <div>
                  <div style="font-size:9px;text-transform:uppercase;color:#94A3B8;font-weight:500;">DOM</div>
                  <div style="font-size:12px;font-weight:700;color:#1B2A4A;">${listing.dom}</div>
                </div>
                <div>
                  <div style="font-size:9px;text-transform:uppercase;color:#94A3B8;font-weight:500;">CAP</div>
                  <div style="font-size:12px;font-weight:700;color:#1B2A4A;">${listing.capRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div style="font-size:9px;text-transform:uppercase;color:#94A3B8;font-weight:500;">CF</div>
                  <div style="font-size:12px;font-weight:700;color:${listing.cashFlow >= 0 ? '#10B981' : '#EF4444'};">${fmtNum(listing.cashFlow)}</div>
                </div>
              </div>
              <a href="/listings/${listing.id}" style="display:block;text-align:center;background:#2563EB;color:white;padding:6px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;margin-top:8px;">
                View Details
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 260,
          className: 'custom-popup',
        });
      });

      // Fit bounds to markers
      if (validListings.length > 0) {
        const bounds = L.latLngBounds(validListings.map((l) => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [listings, photoMap]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Map legend */}
      <div className="absolute top-3 right-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Score</p>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />8+
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />6.5+
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />5+
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />&lt;5
          </span>
        </div>
      </div>

      {/* Map count */}
      <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <p className="text-xs font-semibold text-navy">
          {listings.filter((l) => l.lat && l.lng).length} <span className="font-normal text-slate-400">on map</span>
        </p>
      </div>

      <div ref={mapRef} className="h-[600px] w-full" />

      <style jsx global>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 14px;
          line-height: 1.4;
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
