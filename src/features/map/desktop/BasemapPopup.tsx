import { useState } from "react";
import {
  Map as MapIcon,
  X,
  Sun,
  Moon,
  MapPin,
  Building2,
  Satellite as SatelliteIcon,
} from "lucide-react";
import type { Map } from "maplibre-gl";
import { mapStyles } from "../../../config/mapConfig";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DesktopBasemapPopupProps {
  map: Map | null;
  currentStyle: keyof typeof mapStyles;
  onStyleChange: (style: keyof typeof mapStyles) => void;
}

const basemaps = [
  { id: "light", name: "Light", icon: Sun, color: "text-gray-600" },
  { id: "dark", name: "Dark", icon: Moon, color: "text-gray-600" },
  { id: "voyager", name: "Voyager", icon: MapPin, color: "text-gray-600" },
  { id: "streets", name: "Streets", icon: Building2, color: "text-gray-600" },
  {
    id: "satellite",
    name: "Satellite",
    icon: SatelliteIcon,
    color: "text-blue-500",
  },
] as const;

export default function DesktopBasemapPopup({
  map,
  currentStyle,
  onStyleChange,
}: DesktopBasemapPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const handleStyleChange = (styleId: keyof typeof mapStyles) => {
    if (map && mapStyles[styleId]) {
      onStyleChange(styleId);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Basemap Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(10px)",
          border: isOpen ? "2px solid rgb(59, 130, 246)" : "none",
          boxShadow: isOpen
            ? "rgba(59, 130, 246, 0.4) 0px 0px 0px 3px"
            : "rgba(0, 0, 0, 0.15) 0px 4px 15px",
        }}
        title={t("map.basemapTitle")}
      >
        <div
          style={{ color: isOpen ? "rgb(59, 130, 246)" : "rgb(51, 51, 51)" }}
        >
          <MapIcon className="w-[18px] h-[18px]" />
        </div>
      </button>

      {/* Popup Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup */}
          <div
            className="absolute left-13 top-0 z-40 rounded-xl p-4"
            style={{
              maxWidth: "220px",
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 20px",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h4
                className="m-0 flex items-center gap-2"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgb(51, 51, 51)",
                }}
              >
                <MapIcon className="w-4 h-4" />
                {t("map.selectBasemap")}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer p-1 hover:bg-black/5 rounded transition-colors"
              >
                <X
                  className="w-4 h-4"
                  style={{ color: "rgb(102, 102, 102)" }}
                />
              </button>
            </div>

            {/* Basemap List */}
            <div className="flex flex-col" style={{ gap: "4px" }}>
              {basemaps.map((basemap) => {
                const Icon = basemap.icon;
                const isActive = currentStyle === basemap.id;

                return (
                  <button
                    key={basemap.id}
                    onClick={() =>
                      handleStyleChange(basemap.id as keyof typeof mapStyles)
                    }
                    className="flex items-center rounded-lg cursor-pointer transition-all duration-200"
                    style={{
                      padding: "8px",
                      background: isActive
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(0, 0, 0, 0.03)",
                      border: isActive
                        ? "1px solid rgb(59, 130, 246)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Icon
                      className="w-[18px] h-[18px] mr-2.5"
                      style={{
                        color: isActive
                          ? "rgb(59, 130, 246)"
                          : "rgb(102, 102, 102)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? "rgb(59, 130, 246)"
                          : "rgb(51, 51, 51)",
                      }}
                    >
                      {basemap.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
