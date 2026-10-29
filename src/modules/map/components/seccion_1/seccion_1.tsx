import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Coordenadas aproximadas de Mazamari, Junín, Perú
const MAZAMARI_COORDS: [number, number] = [-11.3167, -74.5333];

export default function Seccion_1() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView(MAZAMARI_COORDS, 16);

    // Capa 1: Calles (OpenStreetMap) - soporta zoom alto en TODO el mundo, sin cortes
    const calles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }
    );

    // Capa 2: Satelite (Esri) - buena en ciudades, puede faltar detalle en zonas rurales
    const satelite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        maxNativeZoom: 17, // evita el cartel de "not available", solo amplia el ultimo tile disponible
        maxZoom: 19,
      }
    );

    // Capa 3: Topografico (relieve)
    const topografico = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenTopoMap contributors",
        maxNativeZoom: 17,
        maxZoom: 19,
      }
    );

    // Capa 4: Modo oscuro (CartoDB)
    const oscuro = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 19,
      }
    );

    // Calles como capa por defecto: es la que garantiza buen zoom en Mazamari
    calles.addTo(map);

    L.control
      .layers(
        {
          Calles: calles,
          Satélite: satelite,
          Topográfico: topografico,
          Oscuro: oscuro,
        },
        {},
        { position: "topright" }
      )
      .addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <section>
      <h2>Mapa - Mazamarí</h2>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "80vh" }}
      />
    </section>
  );
}