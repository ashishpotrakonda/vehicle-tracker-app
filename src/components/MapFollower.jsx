// components/MapFollower.jsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export default function MapFollower({
  position,
  isFollowing,
  onStopFollowing,
}) {
  const map = useMap();
  const lastMoveRef = useRef(0);

  useEffect(() => {
    if (!isFollowing || !position) return;
    const now = Date.now();
    if (now - lastMoveRef.current > 400) {
      lastMoveRef.current = now;
      map.panTo(position, { animate: true });
    }
  }, [position, isFollowing, map]);

  useEffect(() => {
    const stop = () => isFollowing && onStopFollowing();
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
