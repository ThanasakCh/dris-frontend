import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Pencil,
  RefreshCw,
  Copy,
  ChevronDown,
  Leaf,
  MapPin,
  Navigation,
  Cloud,
  BarChart3,
  Lightbulb,
  Zap,
  BookOpen,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import { useField } from "../../../contexts/FieldContext";
import { useLanguage } from "../../../contexts/LanguageContext";

interface FieldDetailPanelProps {
  fieldId: string;
  onClose: () => void;
  onFeatureClick: (feature: string, fieldId: string) => void;
}

export default function FieldDetailPanel({
  fieldId,
  onClose,
  onFeatureClick,
}: FieldDetailPanelProps) {
  const { t } = useLanguage();
  const { fields } = useField();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState("1/2568");

  const field = fields.find((f) => f.id === fieldId);

  const seasons = ["1/2568", "2/2567", "1/2567", "2/2566", "1/2566"];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !field) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          esri: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
          },
        },
        layers: [{ id: "esri-layer", type: "raster", source: "esri" }],
      },
      center: [field.centroid_lng, field.centroid_lat],
      zoom: 15,
      interactive: true,
    });

    map.on("load", () => {
      map.addSource("field", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: field.geometry,
          properties: {},
        },
      });

      map.addLayer({
        id: "field-fill",
        type: "fill",
        source: "field",
        paint: {
          "fill-color": "#fde047",
          "fill-opacity": 0.4,
        },
      });

      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "field",
        paint: {
          "line-color": "#ef4444",
          "line-width": 3,
        },
      });

      const coords = field.geometry.coordinates[0] as [number, number][];
      const bounds = coords.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 50 });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [field]);

  if (!field) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <p className="text-gray-500">{t("field.notFound")}</p>
      </div>
    );
  }

  const calculateArea = () => {
    const areaM2 = field.area_m2 || 0;
    const areaRai = areaM2 / 1600;
    const rai = Math.floor(areaRai);
    const remainingNgan = (areaRai - rai) * 4;
    const ngan = Math.floor(remainingNgan);
    const wah = ((remainingNgan - ngan) * 100).toFixed(2);
    return `${rai} ${t("unit.rai")} ${ngan} ${t("unit.ngan")} ${wah} ${t(
      "unit.wah"
    )}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const features = [
    {
      id: "health",
      name: t("feature.health"),
      icon: Leaf,
      color: "#16a34a",
      bgColor: "#dcfce7",
      enabled: true,
    },
    {
      id: "weather",
      name: t("feature.weather"),
      icon: Cloud,
      color: "#f97316",
      bgColor: "#fed7aa",
      enabled: false,
    },
    {
      id: "analysis",
      name: t("analysis.fieldStatus"),
      icon: BarChart3,
      color: "#2563eb",
      bgColor: "#dbeafe",
      enabled: true,
    },
    {
      id: "fertilizer",
      name: t("feature.fertilizer"),
      icon: Lightbulb,
      color: "#16a34a",
      bgColor: "#dcfce7",
      enabled: false,
    },
    {
      id: "disaster",
      name: t("feature.disaster"),
      icon: Zap,
      color: "#eab308",
      bgColor: "#fef9c3",
      enabled: false,
    },
    {
      id: "notebook",
      name: t("feature.notebook"),
      icon: BookOpen,
      color: "#16a34a",
      bgColor: "#dcfce7",
      enabled: false,
    },
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#f8fafc", zIndex: 9999 }}
    >
      {/* Header - Same style as MobileHealthPage/MobileAnalysisPage */}
      <header
        className="flex items-center px-4 py-3 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "white",
        }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center mr-3 transition-colors"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontSize: "17px", fontWeight: 600 }}>
          {t("field.detailOf")}
        </h1>
      </header>

      {/* Map Section - Same height as MobileAnalysisPage */}
      <div
        className="relative flex-shrink-0"
        style={{ height: "40vh", minHeight: "200px" }}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </div>

      {/* Bottom Sheet - Rectangular and distinct section */}
      <div className="flex-1 bg-white overflow-y-auto relative z-10">
        {/* Handle Header */}
        <div className="flex justify-center pt-3 pb-2 bg-gray-50 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Field Info Card - Same card style as MobileAnalysisPage */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* Field Name */}
            <div
              className="flex items-center gap-2 mb-4 pb-3"
              style={{ borderBottom: "1px solid #f3f4f6" }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1f2937",
                  margin: 0,
                  flex: 1,
                }}
              >
                {field.name}
              </h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" style={{ color: "#6b7280" }} />
              </button>
            </div>

            {/* Info Rows */}
            <div className="space-y-3">
              {/* Area */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#dcfce7" }}
                  >
                    <Leaf className="w-4 h-4" style={{ color: "#16a34a" }} />
                  </div>
                  <span style={{ fontSize: "14px", color: "#374151" }}>
                    {calculateArea()}
                  </span>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" style={{ color: "#6b7280" }} />
                </button>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#fee2e2" }}
                >
                  <MapPin className="w-4 h-4" style={{ color: "#ef4444" }} />
                </div>
                <span style={{ fontSize: "14px", color: "#6b7280", flex: 1 }}>
                  {field.address || t("field.addressFallback")}
                </span>
              </div>

              {/* Coordinates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#dbeafe" }}
                  >
                    <Navigation
                      className="w-4 h-4"
                      style={{ color: "#3b82f6" }}
                    />
                  </div>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {field.centroid_lat?.toFixed(6)}N,{" "}
                    {field.centroid_lng?.toFixed(6)}E
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${field.centroid_lat?.toFixed(
                          6
                        )}, ${field.centroid_lng?.toFixed(6)}`
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" style={{ color: "#6b7280" }} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw
                      className="w-4 h-4"
                      style={{ color: "#6b7280" }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Season Selector Card */}
          <div
            className="rounded-2xl mb-4"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setIsSeasonOpen(!isSeasonOpen)}
              className="w-full flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
            >
              <span
                style={{ fontSize: "15px", color: "#374151", fontWeight: 500 }}
              >
                {selectedSeason}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  isSeasonOpen ? "rotate-180" : ""
                }`}
                style={{ color: "#16a34a" }}
              />
            </button>

            {isSeasonOpen && (
              <div style={{ borderTop: "1px solid #e5e7eb" }}>
                {seasons.map((season) => (
                  <button
                    key={season}
                    onClick={() => {
                      setSelectedSeason(season);
                      setIsSeasonOpen(false);
                    }}
                    className="w-full text-left p-3 transition-colors hover:bg-gray-50"
                    style={{
                      fontSize: "14px",
                      color: season === selectedSeason ? "#16a34a" : "#374151",
                      fontWeight: season === selectedSeason ? 600 : 400,
                      borderBottom: "1px solid #f3f4f6",
                      background:
                        season === selectedSeason ? "#f0fdf4" : "transparent",
                    }}
                  >
                    {season}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-3 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() =>
                    feature.enabled && onFeatureClick(feature.id, fieldId)
                  }
                  disabled={!feature.enabled}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all"
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    boxShadow: feature.enabled
                      ? "0 2px 8px rgba(0,0,0,0.05)"
                      : "none",
                    opacity: feature.enabled ? 1 : 0.6,
                    minHeight: "100px",
                    cursor: feature.enabled ? "pointer" : "not-allowed",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: feature.bgColor }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <span
                    className="text-center whitespace-pre-line leading-tight"
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: feature.enabled ? "#374151" : "#9ca3af",
                    }}
                  >
                    {feature.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
