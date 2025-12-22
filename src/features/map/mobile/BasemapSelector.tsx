import { useState } from "react";
import { Map as MapIcon } from "lucide-react";
import type { Map } from "maplibre-gl";
import { mapStyles } from "../../../config/mapConfig";

interface BasemapSelectorProps {
  map: Map | null;
  currentStyle: keyof typeof mapStyles;
  onStyleChange: (style: keyof typeof mapStyles) => void;
}

const basemaps = [
  { id: "light", name: "Light", icon: "L" },
  { id: "dark", name: "Dark", icon: "D" },
  { id: "voyager", name: "Voyager", icon: "V" },
  { id: "streets", name: "Streets", icon: "S" },
  { id: "satellite", name: "Satellite", icon: "Sat" },
] as const;

export default function BasemapSelector({
  map,
  currentStyle,
  onStyleChange,
}: BasemapSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStyleChange = (styleId: keyof typeof mapStyles) => {
    if (map && mapStyles[styleId]) {
      onStyleChange(styleId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Basemap Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 flex items-center justify-center text-gray-600 hover:bg-white/50 hover:text-green-600 transition-colors"
        title="Basemap"
      >
        <MapIcon className="w-5 h-5" />
      </button>

      {/* Basemap Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute bottom-14 right-0 z-40 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-3 min-w-[200px]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">
                Basemap
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-1">
              {basemaps.map((basemap) => (
                <button
                  key={basemap.id}
                  onClick={() =>
                    handleStyleChange(basemap.id as keyof typeof mapStyles)
                  }
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all
                    ${
                      currentStyle === basemap.id
                        ? "bg-green-100 text-green-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  <span className="text-lg">{basemap.icon}</span>
                  <span className="text-sm">{basemap.name}</span>
                  {currentStyle === basemap.id && (
                    <span className="ml-auto text-green-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
