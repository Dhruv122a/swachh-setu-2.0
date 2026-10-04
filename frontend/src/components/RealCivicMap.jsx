import { useEffect } from "react";
import { useState } from "react";
import { MapContainer, TileLayer, Polygon, Circle, Marker, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { WARDS, BOUNDS } from "../data/wards";
import { CATEGORIES } from "../data/constants";

const toLatLng = (points) =>
  points.split(" ").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return [
      BOUNDS.maxLat - (y / 700) * (BOUNDS.maxLat - BOUNDS.minLat),
      BOUNDS.minLng + (x / 1000) * (BOUNDS.maxLng - BOUNDS.minLng),
    ];
  });
export const WARD_POLYGONS = WARDS.map((w) => ({ ...w, latLngs: toLatLng(w.points) }));

const dotIcon = (c, selected) => {
  const cat = CATEGORIES[c.category] || CATEGORIES.garbage;
  const urgent = c.priority >= 85 && c.status !== "RESOLVED";
  const dim = c.status === "RESOLVED" ? "opacity-40" : "";
  return L.divIcon({
    className: "swc-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="swc-dot-wrap ${dim}" data-testid="map-marker-${c.ticketId}">
      ${urgent ? `<span class="swc-pulse" style="border-color:${cat.color}"></span>` : ""}
      <span class="swc-dot" style="background:${cat.color};box-shadow:0 0 10px ${cat.color}cc;${selected ? "outline:3px solid #fff;" : ""}"></span>
    </div>`,
  });
};

const wardLabel = (w, full) => L.divIcon({
  className: "swc-marker", iconSize: full ? [120, 30] : [40, 18], iconAnchor: full ? [60, -14] : [20, -10],
  html: full ? `<div class="swc-ward-label"><b>WARD ${w.ward}</b><span>${w.name}</span></div>` : `<div class="swc-ward-chip">W${w.ward}</div>`,
});
const ALL_WARDS = L.latLngBounds(WARD_POLYGONS.flatMap((w) => w.latLngs));

const FitWards = ({ onZoom }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(ALL_WARDS, { padding: [16, 16] });
    onZoom(map.getZoom());
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map, onZoom]);
  useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
};

const FlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], 15, { duration: 0.8 });
  }, [target, map]);
  return null;
};

export const RealCivicMap = ({ complaints = [], selectedId, onSelect, heatmap, highlightWard, hotWards = [], className = "" }) => {
  const selected = complaints.find((c) => c.ticketId === selectedId);
  const [zoom, setZoom] = useState(12);
  const mobile = L.Browser.mobile;
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 ${className}`} data-testid="civic-map">
      <MapContainer center={[22.726, 75.872]} zoom={12} minZoom={11} zoomSnap={0.25} maxBounds={[[BOUNDS.minLat - 0.06, BOUNDS.minLng - 0.06], [BOUNDS.maxLat + 0.06, BOUNDS.maxLng + 0.06]]}
        className="h-full w-full" zoomControl={false} attributionControl={false} dragging={!mobile} tap={false} scrollWheelZoom={!mobile}>
        <FitWards onZoom={setZoom} />
        <ZoomControl position="topright" />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" attribution="© Esri © OpenStreetMap contributors" />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" opacity={0.9} />
        {WARD_POLYGONS.map((w) => {
          const hot = hotWards.includes(w.ward);
          const active = highlightWard === w.ward;
          return (
            <Polygon key={w.ward} positions={w.latLngs}
              pathOptions={{ color: hot ? "#EF4444" : active ? "#06B6D4" : "#475569", weight: hot || active ? 2.5 : 1.2, dashArray: hot ? "7 6" : "4 6", fillColor: hot ? "#EF4444" : active ? "#06B6D4" : "#1E293B", fillOpacity: hot ? 0.12 : active ? 0.1 : 0.08 }} />
          );
        })}
        {WARD_POLYGONS.map((w) => <Marker key={`l${w.ward}`} position={[w.center.lat, w.center.lng]} icon={wardLabel(w, zoom >= 13)} interactive={false} />)}
        {heatmap && complaints.filter((c) => c.status !== "RESOLVED").flatMap((c) => ([
          <Circle key={`h1${c.ticketId}`} center={[c.latitude, c.longitude]} radius={c.priority * (zoom >= 13 ? 6 : 9)} pathOptions={{ color: "#F59E0B", weight: 0, fillColor: "#F59E0B", fillOpacity: 0.05 }} />,
          <Circle key={`h2${c.ticketId}`} center={[c.latitude, c.longitude]} radius={c.priority * 3.5} pathOptions={{ color: "#EF4444", weight: 0, fillColor: "#EF4444", fillOpacity: 0.16 }} />,
        ]))}
        {complaints.map((c) => (
          <Marker key={c.ticketId} position={[c.latitude, c.longitude]} icon={dotIcon(c, selectedId === c.ticketId)}
            eventHandlers={{ click: () => onSelect?.(c) }} />
        ))}
        <FlyTo target={selected} />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-md border border-slate-700 bg-slate-950/85 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
        <span className="hidden sm:inline">Esri · OpenStreetMap — ward boundaries illustrative</span><span className="sm:hidden">Esri · OSM · illustrative</span>
      </div>
    </div>
  );
};
