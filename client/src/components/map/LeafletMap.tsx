import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';

export interface MapMarkerItem {
  id: string;
  trackingId?: string;
  lat: number;
  lng: number;
  title: string;
  priority: string;
  status: string;
  category: string;
  onClick?: () => void;
}

interface LeafletMapProps {
  markers?: MapMarkerItem[];
  center?: [number, number];
  zoom?: number;
  interactivePicker?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  height?: string;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  markers = [],
  center = [40.7512, -73.9825],
  zoom = 13,
  interactivePicker = false,
  onLocationSelect,
  selectedLocation,
  height = '450px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const { theme } = useApp();

  // Color generator for status/priority
  const getMarkerColor = (priority: string, status: string) => {
    if (status === 'Resolved') return '#10B981'; // Emerald
    if (priority === 'Urgent') return '#EF4444'; // Rose
    if (priority === 'High') return '#F59E0B'; // Amber
    if (priority === 'Medium') return '#3B82F6'; // Blue
    return '#94A3B8'; // Slate
  };

  // Create custom HTML DivIcon
  const createDivIcon = (priority: string, status: string, isPicker = false) => {
    const color = isPicker ? '#00F2FE' : getMarkerColor(priority, status);
    const isUrgent = priority === 'Urgent' && status !== 'Resolved';

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          ${isUrgent ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
          <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      // Standard OpenStreetMap tiles (no API key required)
      const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Handle interactive location picker click
      if (interactivePicker && onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach(m => {
      if (!m.lat || !m.lng) return;

      const marker = L.marker([m.lat, m.lng], {
        icon: createDivIcon(m.priority, m.status),
      });

      // Bind interactive popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-900';
      popupContent.innerHTML = `
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="font-size: 10px; font-weight: bold; color: #0284c7; font-family: monospace;">${m.trackingId || 'INCIDENT'}</div>
          <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">${m.title}</div>
          <div style="display: flex; gap: 4px; margin-top: 6px; font-size: 10px;">
            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">${m.category}</span>
            <span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">${m.status}</span>
          </div>
        </div>
      `;

      if (m.onClick) {
        marker.on('click', () => {
          m.onClick?.();
        });
      }

      marker.bindPopup(popupContent);
      marker.addTo(markersLayerRef.current!);
    });
  }, [markers]);

  // Handle selectedLocation marker in interactivePicker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (interactivePicker && selectedLocation) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      } else {
        const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
          icon: createDivIcon('Low', 'Submitted', true),
        }).addTo(mapInstanceRef.current);
        pickerMarkerRef.current = marker;
      }
      mapInstanceRef.current.panTo([selectedLocation.lat, selectedLocation.lng]);
    }
  }, [selectedLocation, interactivePicker]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border shadow-md ${className}`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className={`h-full w-full z-10 ${theme === 'dark' ? 'dark-map' : ''}`} />
      {interactivePicker && (
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-medium backdrop-blur-md border border-slate-700 shadow-lg pointer-events-none">
          Click anywhere on the map to place issue marker
        </div>
      )}
    </div>
  );
};
