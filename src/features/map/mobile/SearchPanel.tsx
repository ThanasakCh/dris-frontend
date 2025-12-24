import React, { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import axios from "../../../config/axios";
import { Search, MapPin, X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  class: string;
}

interface MobileSearchPanelProps {
  map: maplibregl.Map | null;
}

const MobileSearchPanel: React.FC<MobileSearchPanelProps> = ({ map }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);

      // Try API endpoint first
      const response = await axios.get("/utils/search", {
        params: { q: searchQuery },
      });

      setResults(response.data.results || []);
    } catch (error) {
      console.error("Search API failed, trying direct Nominatim:", error);

      // Fallback to direct Nominatim search
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=th&q=${encodeURIComponent(
            searchQuery
          )}&limit=8&addressdetails=1`,
          {
            headers: {
              "User-Agent": "Grovi-CropMonitoring/1.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const formattedResults = data.map((item: any) => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type || "",
            class: item.class || "",
          }));
          setResults(formattedResults);
        } else {
          setResults([]);
        }
      } catch (fallbackError) {
        console.error("Fallback search failed:", fallbackError);
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (!map) {
      console.error("Map is not available");
      return;
    }

    try {
      // Remove existing marker
      if (marker) {
        marker.remove();
      }

      // Create popup instance
      const popup = new maplibregl.Popup().setHTML(
        `<div style="padding: 4px; font-size: 12px;">${result.display_name}</div>`
      );

      // Add new marker
      const newMarker = new maplibregl.Marker()
        .setLngLat([result.lon, result.lat])
        .setPopup(popup)
        .addTo(map);

      // Remove marker when popup closes
      popup.on("close", () => {
        newMarker.remove();
        setMarker(null);
      });

      newMarker.togglePopup();
      setMarker(newMarker);

      // Fly to location
      map.flyTo({
        center: [result.lon, result.lat],
        zoom: 13,
        duration: 1500,
      });

      // Clear results and collapse panel
      setResults([]);
      setQuery("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Error navigating to location:", error);
    }
  };

  const handleSearchButtonClick = () => {
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery("");
    setResults([]);
  };

  // Collapsed state - just a search icon button
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{
          width: "44px",
          height: "44px",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(10px)",
          border: "none",
          borderRadius: "12px",
          boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 15px",
          cursor: "pointer",
        }}
      >
        <Search size={20} color="#333" />
      </button>
    );
  }

  // Expanded state - full search bar
  return (
    <div
      ref={panelRef}
      className="transition-all duration-300"
      style={{
        width: "calc(100vw - 20px)",
        maxWidth: "400px",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(15px)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          overflow: "hidden",
        }}
      >
        {/* Search Input Row */}
        <div className="flex items-center gap-1.5 p-1.5">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
              <Search size={14} color="#666" />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder={t("field.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearchButtonClick();
              }}
              style={{
                width: "100%",
                height: "32px",
                paddingLeft: "28px",
                paddingRight: "8px",
                background: "rgba(0, 0, 0, 0.05)",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#333",
                outline: "none",
              }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearchButtonClick}
            disabled={isLoading}
            style={{
              height: "32px",
              padding: "0 12px",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "50px",
            }}
          >
            {isLoading ? (
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              t("action.search")
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(0, 0, 0, 0.05)",
              border: "none",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="#666" />
          </button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div
            style={{
              maxHeight: "250px",
              overflowY: "auto",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultClick(result)}
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "rgba(34, 197, 94, 0.15)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={16} color="#22c55e" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#333",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {result.display_name.split(",")[0]}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {result.display_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {query && results.length === 0 && !isLoading && (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#888",
              fontSize: "13px",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            {t("field.notFound")}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearchPanel;
