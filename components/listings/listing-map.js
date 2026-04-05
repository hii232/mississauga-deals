'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

// Leaflet CSS is imported once globally via useEffect
let leafletLoaded = false;

/**
 * ListingMap — Leaflet map with price pins, hover sync, and optional bounds filtering.
 *
 * Props:
 *   listings       — filtered listing array
 *   photoMap       — { id: photoUrl }
 *   highlightId    — listing id to highlight on the map (hovered in list)
 *   onHoverListing — (id | null) => void — called when a marker is hovered
 *   onBoundsChange — (bounds) => void — called when map is panned/zoomed with visible bounds
 *   height         — CSS height string (default '600px')
 *   compact        — boolean — if true, uses smaller markers suitable for split view
 */
export function ListingMap({
  listings,
  photoMap,
  highlightId = null,
  onHoverListing,
  onBoundsChange,
  height = '600px',
  compact = false,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});   // { listingId: markerInstance }
  const markerGroupRef = useRef(null);
  const boundsTimerRef = useRef(null);

  // Load Leaflet CSS once
  useEffect(() => {
    if (leafletLoaded) return;
    leafletLoaded = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  // Format price for pin label
  const pinPrice = useCallback((price) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

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

      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;

      // Notify parent when bounds change (debounced)
      if (onBoundsChange) {
        const fireBounds = () => {
          clearTimeout(boundsTimerRef.current);
          boundsTimerRef.current = setTimeout(() => {
            const b = map.getBounds();
            onBoundsChange({
              north: b.getNorth(),
              south: b.getSouth(),
              east: b.getEast(),
              west: b.getWest(),
            });
          }, 300);
        };
        map.on('moveend', fireBounds);
        map.on('zoomend', fireBounds);
      }

      // Build markers
      buildMarkers(L, markerGroup);

      // Fit bounds to markers
      const validListings = listings.filter((l) => l.lat && l.lng);
      if (validListings.length > 0) {
        const bounds = L.latLngBounds(validListings.map((l) => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    }

    function buildMarkers(L, markerGroup) {
      markerGroup.clearLayers();
      const newMarkers = {};

      const validListings = listings.filter((l) => l.lat && l.lng);
      const size = compact ? 'small' : 'normal';

      validListings.forEach((listing) => {
        const scoreColor = scoreColorHex(listing.hamzaScore);
        const photo = listing.photos?.[0] || (photoMap && photoMap[listing.id]) || '';
        const priceLabel = pinPrice(listing.price);

        // Price pin icon
        const iconHtml = size === 'small'
          ? `<div class="price-pin price-pin-sm" style="--pin-color:${scoreColor};">${priceLabel}</div>`
          : `<div class="price-pin" style="--pin-color:${scoreColor};">${priceLabel}</div>`;

        const icon = L.divIcon({
          className: 'custom-marker',
          html: iconHtml,
          iconSize: size === 'small' ? [70, 28] : [80, 32],
          iconAnchor: size === 'small' ? [35, 28] : [40, 32],
        });

        const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(markerGroup);

        // Hover events — sync with list
        marker.on('mouseover', () => {
          if (onHoverListing) onHoverListing(listing.id);
          marker.getElement()?.querySelector('.price-pin')?.classList.add('price-pin-active');
        });
        marker.on('mouseout', () => {
          if (onHoverListing) onHoverListing(null);
          marker.getElement()?.querySelector('.price-pin')?.classList.remove('price-pin-active');
        });

        // Popup content
        const popupContent = `
          <div style="min-width:220px;font-family:Inter,system-ui,sans-serif;">
            ${photo ? `<img src="${photo}" style="width:100%;height:120px;object-fit:cover;border-radius:8px 8px 0 0;margin:-14px -14px 8px -14px;width:calc(100% + 28px);" onerror="this.style.display='none'" />` : ''}
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
                  <div style="font-size:8px;color:#94A3B8;font-weight:500;">CF/mo</div>
                  <div style="font-size:12px;font-weight:700;color:${listing.cashFlow >= 0 ? '#10B981' : '#EF4444'};">${fmtNum(listing.cashFlow)}</div>
                </div>
              </div>
              <a href="/listings/${listing.id}" style="display:block;text-align:center;background:#2563EB;color:white;padding:6px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;margin-top:8px;">
                View Details
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260, className: 'custom-popup' });
        newMarkers[listing.id] = marker;
      });

      markersRef.current = newMarkers;
    }

    initMap();

    return () => {
      cancelled = true;
      clearTimeout(boundsTimerRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [listings, photoMap, compact, onBoundsChange, onHoverListing, pinPrice]);

  // Highlight marker when hovered in list
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (!el) return;
      const pin = el.querySelector('.price-pin');
      if (!pin) return;
      if (id === highlightId) {
        pin.classList.add('price-pin-active');
      } else {
        pin.classList.remove('price-pin-active');
      }
    });
  }, [highlightId]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm h-full">
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

      <div ref={mapRef} style={{ height }} className="w-full" />

      <style jsx global>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .price-pin {
          background: var(--pin-color, #2563EB);
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: 2px solid white;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          text-align: center;
        }
        .price-pin::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid var(--pin-color, #2563EB);
        }
        .price-pin-sm {
          font-size: 10px;
          padding: 3px 7px;
          border-radius: 6px;
        }
        .price-pin-sm::after {
          bottom: -5px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--pin-color, #2563EB);
        }
        .price-pin-active,
        .price-pin:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          z-index: 9999 !important;
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
