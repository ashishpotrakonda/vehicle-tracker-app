import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

export default function RotatedMarker({ position, icon, rotationAngle }) {
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
