/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lon: string) => void;
}

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const [loaded, setLoaded] = React.useState(false);

  // Load Leaflet dynamically (SSR Safe)
  React.useEffect(() => {
    if ((window as any).L) {
      setLoaded(true);
      return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(stylesheet);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize and sync Map
  React.useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Workaround for broken Leaflet default marker icon paths in SPA
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const latVal = parseFloat(latitude) || -6.2088; // Default to Jakarta coordinates
    const lonVal = parseFloat(longitude) || 106.8456;

    // If map already initialized, just update view and marker
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      const currentCenter = map.getCenter();

      // Update marker position
      if (marker) {
        marker.setLatLng([latVal, lonVal]);
      }

      // Re-center only if coordinates significantly changed
      const dist = Math.abs(currentCenter.lat - latVal) + Math.abs(currentCenter.lng - lonVal);
      if (dist > 0.001) {
        map.setView([latVal, lonVal], 15);
      }
      return;
    }

    // Create Map Instance
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([latVal, lonVal], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create Draggable Marker
    const marker = L.marker([latVal, lonVal], {
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Event handler to push values back to React Hook Form
    const handleLocationUpdate = (newLat: number, newLon: number) => {
      onChange(newLat.toFixed(6), newLon.toFixed(6));
    };

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      handleLocationUpdate(position.lat, position.lng);
    });

    map.on("click", (e: any) => {
      const position = e.latlng;
      marker.setLatLng(position);
      handleLocationUpdate(position.lat, position.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [loaded, latitude, longitude, onChange]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-rule/65 shadow-inner">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-xs text-muted-foreground font-medium z-10">
          Loading interactive map...
        </div>
      )}
      <div ref={containerRef} className="w-full h-[240px] z-0" style={{ minHeight: "240px" }} />
    </div>
  );
}
