import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  useMap,
  Marker,
} from "react-leaflet";
import { BiCurrentLocation } from "react-icons/bi";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const carIcon = L.icon({
  iconUrl: "/icons/car.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function RotatedMarker({ position, icon, rotationAngle }) {
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !marker._icon) return;

    const el = marker._icon;

    setTimeout(() => {
      const oldTransform = el.style.transform || "";
      const translatePart = oldTransform.match(/translate[^)]*\)/)?.[0] || "";
      el.style.transformOrigin = "center";
      el.style.transform = `${translatePart} rotate(${rotationAngle}deg)`;
    }, 0);
  }, [rotationAngle, position]);

  return <Marker ref={markerRef} position={position} icon={icon} />;
}

function MapFollower({ position, isFollowing, onStopFollowing }) {
  const map = useMap();
  const lastMoveRef = useRef(0);

  useEffect(() => {
    if (!isFollowing || !position) return;

    const now = Date.now();
    if (now - lastMoveRef.current > 400) {
      lastMoveRef.current = now;
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, isFollowing, map]);

  useEffect(() => {
    const stop = () => {
      if (isFollowing) onStopFollowing();
    };
    map.on("dragstart", stop);
    map.on("zoomstart", stop);
    map.on("mousedown", stop);
    return () => {
      map.off("dragstart", stop);
      map.off("zoomstart", stop);
      map.off("mousedown", stop);
    };
  }, [map, isFollowing, onStopFollowing]);

  return null;
}

function VehicleMap() {
  const [routeData, setRouteData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const mapRef = useRef(null);
  const [bearing, setBearing] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch("/dummy-route.json")
      .then((res) => res.json())
      .then((data) => setRouteData(data))
      .catch((err) => console.error("Error fetching route data:", err));
  }, []);

  const calculateBearing = (start, end) => {
    const lat1 = (start.lat * Math.PI) / 180;
    const lon1 = (start.lng * Math.PI) / 180;
    const lat2 = (end.lat * Math.PI) / 180;
    const lon2 = (end.lng * Math.PI) / 180;
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const brng = Math.atan2(y, x);
    return ((brng * 180) / Math.PI + 360) % 360;
  };

  useEffect(() => {
    if (!isPlaying || routeData.length < 2) return;

    let progress = currentIndex;
    const speedMetersPerSec = 35;
    let animationFrame;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const distance = (a, b) => {
      const R = 6371000;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const aVal =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
      return R * c;
    };

    const animate = () => {
      const i = Math.floor(progress);
      if (i >= routeData.length - 1) {
        setIsPlaying(false);
        cancelAnimationFrame(animationFrame);
        return;
      }

      const start = routeData[i];
      const end = routeData[i + 1];
      const segmentDist = distance(start, end);

      const distPerFrame = speedMetersPerSec / 60;
      const tIncrement = distPerFrame / segmentDist;

      progress += tIncrement;

      const t = progress % 1;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;

      setBearing(calculateBearing(start, end));
      setCurrentIndex(progress);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, routeData]);

  if (routeData.length === 0) {
    return <p className="text-center mt-10">Loading route data...</p>;
  }

  const currentIndexFloor = Math.floor(currentIndex);
  const nextIndex = Math.min(currentIndexFloor + 1, routeData.length - 1);
  const start = routeData[currentIndexFloor];
  const end = routeData[nextIndex];
  const t = currentIndex % 1;

  const currentPos = {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  };
  const startPos = routeData[0];

  return (
    <div className="relative h-screen w-screen">
      <MapContainer
        center={[startPos.lat, startPos.lng]}
        zoom={25}
        style={{ height: "100vh", width: "100%" }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapFollower
          position={currentPos}
          isFollowing={isFollowing}
          onStopFollowing={() => setIsFollowing(false)}
        />

        <Polyline
          positions={[
            ...routeData
              .slice(0, Math.floor(currentIndex) + 1)
              .map((p) => [p.lat, p.lng]),
            [
              routeData[Math.floor(currentIndex)].lat +
                (routeData[
                  Math.min(Math.floor(currentIndex) + 1, routeData.length - 1)
                ].lat -
                  routeData[Math.floor(currentIndex)].lat) *
                  (currentIndex % 1),
              routeData[Math.floor(currentIndex)].lng +
                (routeData[
                  Math.min(Math.floor(currentIndex) + 1, routeData.length - 1)
                ].lng -
                  routeData[Math.floor(currentIndex)].lng) *
                  (currentIndex % 1),
            ],
          ]}
          color="blue"
          weight={5}
        />

        <Polyline
          positions={[
            [
              routeData[Math.floor(currentIndex)].lat +
                (routeData[
                  Math.min(Math.floor(currentIndex) + 1, routeData.length - 1)
                ].lat -
                  routeData[Math.floor(currentIndex)].lat) *
                  (currentIndex % 1),
              routeData[Math.floor(currentIndex)].lng +
                (routeData[
                  Math.min(Math.floor(currentIndex) + 1, routeData.length - 1)
                ].lng -
                  routeData[Math.floor(currentIndex)].lng) *
                  (currentIndex % 1),
            ],
            ...routeData
              .slice(Math.floor(currentIndex) + 1)
              .map((p) => [p.lat, p.lng]),
          ]}
          color="gray"
          weight={4}
          opacity={0.5}
        />

        <RotatedMarker
          position={[currentPos.lat, currentPos.lng]}
          icon={carIcon}
          rotationAngle={bearing}
        />
      </MapContainer>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-[9999]">
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg flex gap-4">
          <button
            onClick={() => setIsPlaying(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
          >
            Play
          </button>
          <button
            onClick={() => setIsPlaying(false)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded"
          >
            Pause
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentIndex(0);
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>

        <button
          onClick={() => setIsFollowing(true)}
          className="bg-white hover:bg-gray-100 p-3 rounded-full shadow-md border border-gray-300 flex items-center justify-center transition-all"
          title="Recenter on car"
        >
          <BiCurrentLocation size={22} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default VehicleMap;
