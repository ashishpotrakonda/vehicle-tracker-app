import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import { BiCurrentLocation } from "react-icons/bi";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import RotatedMarker from "./components/RotatedMarker";
import MapFollower from "./components/MapFollower";
import { calculateBearing, distance } from "./utils/mapUtils";

const carIcon = L.icon({
  iconUrl: "../icons/car.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const markerIcon = L.icon({
  iconUrl: "../icons/marker.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function FitRouteOnLoad({ route }) {
  const map = useMap();

  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);

  return null;
}

export default function VehicleMap() {
  const [routeData, setRouteData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [bearing, setBearing] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
    fetch("/dummy-route.json")
      .then((res) => res.json())
      .then(setRouteData)
      .catch((err) => console.error("Error loading route:", err));
  }, []);

  useEffect(() => {
    if (!isPlaying || routeData.length < 2) return;
    let progress = currentIndex;
    const speed = 35;
    let frame;

    const animate = () => {
      const i = Math.floor(progress);
      if (i >= routeData.length - 1) {
        setIsPlaying(false);
        cancelAnimationFrame(frame);
        return;
      }

      const start = routeData[i];
      const end = routeData[i + 1];
      const segmentDist = distance(start, end);
      const distPerFrame = speed / 60;
      const tIncrement = distPerFrame / segmentDist;

      progress += tIncrement;
      setBearing(calculateBearing(start, end));
      setCurrentIndex(progress);

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, routeData]);

  if (!routeData.length) return <p>Loading route...</p>;

  const i = Math.floor(currentIndex);
  const next = Math.min(i + 1, routeData.length - 1);
  const t = currentIndex % 1;

  const pos = {
    lat: routeData[i].lat + (routeData[next].lat - routeData[i].lat) * t,
    lng: routeData[i].lng + (routeData[next].lng - routeData[i].lng) * t,
  };

  return (
    <div className="relative h-screen w-screen">
      <MapContainer
        center={[routeData[0].lat, routeData[0].lng]}
        zoom={25}
        style={{ height: "100vh", width: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFollower
          position={pos}
          isFollowing={isFollowing}
          onStopFollowing={() => setIsFollowing(false)}
        />
        <Polyline
          positions={routeData.map((p) => [p.lat, p.lng])}
          color="#42A5F5"
          opacity={0.5}
          weight={4}
        />
        <Polyline
          positions={routeData
            .slice(0, i + 1)
            .map((p) => [p.lat, p.lng])
            .concat([[pos.lat, pos.lng]])}
          color="blue"
          weight={5}
        />
        <FitRouteOnLoad route={routeData} />
        <Marker
          position={[
            routeData[routeData.length - 1].lat,
            routeData[routeData.length - 1].lng,
          ]}
          icon={markerIcon}
        />
        <RotatedMarker
          position={[pos.lat, pos.lng]}
          icon={carIcon}
          rotationAngle={bearing}
        />
      </MapContainer>

      <div className="absolute w-[155px] top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-md text-sm font-medium text-gray-700 z-[9999]">
        <p>Latitude: {pos.lat.toFixed(4)}</p>
        <p>Longitude: {pos.lng.toFixed(4)}</p>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-[9999] px-2">
        <div className="bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg flex gap-2 sm:gap-4">
          <button
            onClick={() => setIsPlaying(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded"
          >
            Play
          </button>
          <button
            onClick={() => setIsPlaying(false)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded"
          >
            Pause
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentIndex(0);
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded"
          >
            Reset
          </button>
        </div>
        <button
          onClick={() => setIsFollowing(true)}
          className="bg-white hover:bg-gray-100 p-2 sm:p-3 rounded-full shadow-md border border-gray-300 flex items-center justify-center transition-all"
          title="Recenter on car"
        >
          <BiCurrentLocation className="text-gray-700 size-6 md:size-8" />
        </button>
      </div>
    </div>
  );
}
