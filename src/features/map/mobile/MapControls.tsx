import { ZoomIn, ZoomOut, Compass, Crosshair } from "lucide-react";
import type { Map } from "maplibre-gl";

interface MapControlsProps {
  map: Map | null;
}

export default function MapControls({ map }: MapControlsProps) {
  const handleZoomIn = () => {
    if (map) map.zoomIn();
  };

  const handleZoomOut = () => {
    if (map) map.zoomOut();
  };

  const handleResetNorth = () => {
    if (map) map.resetNorth();
  };

  const handleGeolocate = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  const buttonStyle = {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(10px)",
    border: "none",
    boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "0.2s",
  };

  return (
    <div
      className="absolute right-2.5 z-40 flex flex-col"
      style={{
        top: "125px",
        gap: "10px",
      }}
    >
      {/* Zoom In */}
      <button onClick={handleZoomIn} style={buttonStyle} title="Zoom In">
        <div style={{ color: "rgb(51, 51, 51)" }}>
          <ZoomIn className="w-[18px] h-[18px]" />
        </div>
      </button>

      {/* Zoom Out */}
      <button onClick={handleZoomOut} style={buttonStyle} title="Zoom Out">
        <div style={{ color: "rgb(51, 51, 51)" }}>
          <ZoomOut className="w-[18px] h-[18px]" />
        </div>
      </button>

      {/* Compass */}
      <button
        onClick={handleResetNorth}
        style={buttonStyle}
        title="Reset North"
      >
        <div style={{ color: "rgb(51, 51, 51)" }}>
          <Compass className="w-[18px] h-[18px]" />
        </div>
      </button>

      {/* Geolocate */}
      <button onClick={handleGeolocate} style={buttonStyle} title="Geolocate">
        <div style={{ color: "rgb(51, 51, 51)" }}>
          <Crosshair className="w-[18px] h-[18px]" />
        </div>
      </button>
    </div>
  );
}
