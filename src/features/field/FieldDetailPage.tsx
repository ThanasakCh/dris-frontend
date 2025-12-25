import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Pencil,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Leaf,
  CloudSun,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Trash2,
  Download,
  MapPin,
  LocateFixed,
  Crosshair,
  Layers,
  Sun,
  Moon,
  MapIcon,
  Building2,
  Satellite,
  Globe,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { useField } from "../../contexts/FieldContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useResponsive } from "../../hooks/useResponsive";
import { useFieldActions } from "../../hooks/useFieldActions";
import { mapStyles } from "../../config/mapConfig";
import {
  DesktopHealthPanel,
  DesktopAnalysisPanel,
} from "../../components/panels/desktop";
import { DesktopHeader } from "../../components/desktop";
import type { VISnapshot } from "../../components/panels/desktop";
import { getImageUrl } from "../../config/api";
import profileImage from "../../assets/profile.jpg";

// Custom VectorSquare Icon (matching Lucide vector-square)
const VectorSquareIcon = ({
  size = 24,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19.5 7a24 24 0 0 1 0 10" />
    <path d="M4.5 7a24 24 0 0 0 0 10" />
    <path d="M7 19.5a24 24 0 0 0 10 0" />
    <path d="M7 4.5a24 24 0 0 1 10 0" />
    <rect x="17" y="17" width="5" height="5" rx="1" />
    <rect x="17" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="17" width="5" height="5" rx="1" />
    <rect x="2" y="2" width="5" height="5" rx="1" />
  </svg>
);

export default function MobileFieldDetailPage() {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const { isDesktop } = useResponsive();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { user } = useAuth();
  const { fields, getField, currentField, getThumbnail } = useField();
  const { t, language } = useLanguage();

  const getVarietyLabel = (variety: string | undefined): string => {
    if (!variety) return "-";
    const v = variety.toLowerCase();
    // Match both Thai names and Select option values
    if (v.includes("หอมมะลิ") || v.includes("jasmine") || v === "jasmine")
      return t("farm.jasmine");
    if (v.includes("กข6") || v.includes("rd6") || v === "ricekk6")
      return t("farm.riceKK6");
    if (v.includes("กข15") || v.includes("rd15") || v === "ricekk15")
      return t("farm.riceKK15");
    if (v.includes("ปทุมธานี") || v.includes("pathum") || v === "ricept")
      return t("farm.ricePT");
    if (v.includes("เหนียว") || v.includes("sticky") || v === "stickyrice")
      return t("farm.stickyRice");
    if (
      v.includes("ไรซ์เบอรี่") ||
      v.includes("riceberry") ||
      v === "riceberry"
    )
      return t("farm.riceberry");
    if (v === "other") return t("farm.other");
    return variety;
  };

  const getSeasonLabel = (season: string | undefined): string => {
    if (!season) return "-";
    const s = season.toLowerCase();
    // Match both Thai names and Select option values
    if (s.includes("นาปี") || s.includes("wet") || s === "wetseason")
      return t("farm.wetSeason");
    if (s.includes("นาปรัง") || s.includes("dry") || s === "dryseason")
      return t("farm.drySeason");
    if (s === "transplant") return t("farm.transplant");
    if (s === "broadcast") return t("farm.broadcast");
    return season;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isFieldDetailOpen, setIsFieldDetailOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<string>("satellite");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Snapshots state for map overlay carousel
  const [mapSnapshots, setMapSnapshots] = useState<VISnapshot[]>([]);
  const [mapSelectedSnapshot, setMapSelectedSnapshot] =
    useState<VISnapshot | null>(null);
  const setSnapshotRef = useRef<((s: VISnapshot) => void) | null>(null);
  const fieldDetailPopupRef = useRef<HTMLDivElement>(null);
  const fieldDetailButtonRef = useRef<HTMLButtonElement>(null);

  // State for toggle units
  const [showAreaInSqm, setShowAreaInSqm] = useState(false);
  const [showCoordsInUTM, setShowCoordsInUTM] = useState(false);

  // Clear VI overlay from map
  const clearVIOverlay = () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      if (map.getLayer("vi-overlay-layer")) {
        map.removeLayer("vi-overlay-layer");
      }
      if (map.getSource("vi-overlay")) {
        map.removeSource("vi-overlay");
      }
    } catch (e) {
      // Ignore errors if layer/source doesn't exist
    }

    // Also clear the snapshot states
    setMapSnapshots([]);
    setMapSelectedSnapshot(null);
  };

  // Wrapper to change panel and clear overlay
  const changeActivePanel = (panel: string | null) => {
    clearVIOverlay();
    setActivePanel(panel);
  };

  const field = fields.find((f) => f.id === fieldId) || currentField;

  // Dummy field for hook (hooks must be called unconditionally)
  const dummyField = {
    id: "",
    name: "",
    geometry: null,
    area_m2: 0,
    centroid_lat: 0,
    centroid_lng: 0,
  };

  // Field actions (Edit, Download, Delete) - always call hook unconditionally
  const fieldActions = useFieldActions(field || dummyField, () => {
    // Reload field after update/delete
    if (fieldId) {
      getField(fieldId).catch(console.error);
    }
  });

  // Load field if not in context
  useEffect(() => {
    if (!fieldId) {
      navigate("/dris_project");
      return;
    }

    // If we already have the field in context, don't fetch
    const existingField = fields.find((f) => f.id === fieldId);
    if (!existingField && !currentField) {
      setIsLoading(true);
      getField(fieldId)
        .catch((error) => {
          console.error("Failed to load field:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [fieldId]);

  // Load thumbnail when field is available
  useEffect(() => {
    if (field && fieldId) {
      getThumbnail(fieldId)
        .then((thumbnailData) => {
          setThumbnail(thumbnailData);
        })
        .catch(() => {
          setThumbnail(null);
        });
    }
  }, [field?.id, fieldId]);

  // Handle click outside to close field detail popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isFieldDetailOpen) return;

      const target = event.target as Node;
      const popupEl = fieldDetailPopupRef.current;
      const buttonEl = fieldDetailButtonRef.current;

      // If click is outside popup and button, close it
      if (
        popupEl &&
        !popupEl.contains(target) &&
        buttonEl &&
        !buttonEl.contains(target)
      ) {
        setIsFieldDetailOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFieldDetailOpen]);

  // Initialize map when field is ready and container is mounted
  useEffect(() => {
    if (field && !mapRef.current && !isLoading) {
      // Use requestAnimationFrame to ensure DOM is ready
      const initMap = () => {
        if (mapContainerRef.current) {
          initializeMap();
        } else {
          requestAnimationFrame(initMap);
        }
      };
      requestAnimationFrame(initMap);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [field?.id, isLoading, isDesktop]);

  const initializeMap = () => {
    if (!mapContainerRef.current || !field || mapRef.current) return;

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

      // Fill with semi-transparent yellow
      map.addLayer({
        id: "field-fill",
        type: "fill",
        source: "field",
        paint: {
          "fill-color": "#fbb355ff",
          "fill-opacity": 0.35,
        },
      });

      // Red solid border
      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "field",
        paint: {
          "line-color": "#ff4204ff",
          "line-width": 3,
        },
      });

      // Fit to field bounds
      const coords = field.geometry.coordinates[0] as [number, number][];
      const bounds = coords.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );

      // On desktop, add more padding on right for sidebar panel
      const padding = isDesktop
        ? { top: 100, bottom: 150, left: 50, right: 400 }
        : 5;
      map.fitBounds(bounds, { padding, maxZoom: 17.4 });
    });

    mapRef.current = map;
  };

  // Handle map style change
  const handleStyleChange = (styleKey: string) => {
    if (!mapRef.current || !field) return;
    const style = mapStyles[styleKey as keyof typeof mapStyles];
    if (!style) return;

    // Handle both URL strings and style objects
    const styleSpec =
      typeof style === "string"
        ? style
        : (style as maplibregl.StyleSpecification);

    const map = mapRef.current;

    // Function to add polygon layers
    const addPolygonLayers = () => {
      // Check if source already exists
      if (map.getSource("field")) return;

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
          "fill-color": "#fbb355ff",
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "field",
        paint: {
          "line-color": "#ff4204ff",
          "line-width": 3,
        },
      });
    };

    // Set new style
    map.setStyle(styleSpec);
    setCurrentStyle(styleKey);
    setIsLayersOpen(false);

    // Re-add field polygon after style loads
    map.once("styledata", () => {
      // Wait a bit for style to fully load
      setTimeout(() => {
        if (map.isStyleLoaded()) {
          addPolygonLayers();
        } else {
          map.once("idle", addPolygonLayers);
        }
      }, 100);
    });
  };

  // Format area
  const formatArea = (areaM2: number) => {
    const rai = Math.floor(areaM2 / 1600);
    const remainingNgan = (areaM2 % 1600) / 400;
    const ngan = Math.floor(remainingNgan);
    const tarangwa = Math.floor((areaM2 % 400) / 4);
    return { rai, ngan, tarangwa };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: t("copy.success"),
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
      })
      .catch(() => {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: t("copy.failed"),
          showConfirmButton: false,
          timer: 1500,
        });
      });
  };

  // Convert LatLng to UTM
  const latLngToUTM = (lat: number, lng: number) => {
    const zone = Math.floor((lng + 180) / 6) + 1;
    const hemisphere = lat >= 0 ? "N" : "S";
    const a = 6378137;
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const e = Math.sqrt(2 * f - f * f);
    const e2 = e * e;
    const ep2 = e2 / (1 - e2);
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const lng0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;
    const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
    const T = Math.tan(latRad) ** 2;
    const C = ep2 * Math.cos(latRad) ** 2;
    const A = (lngRad - lng0) * Math.cos(latRad);
    const M =
      a *
      ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latRad -
        ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) *
          Math.sin(2 * latRad) +
        ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latRad) -
        ((35 * e2 ** 3) / 3072) * Math.sin(6 * latRad));
    const easting =
      k0 *
        N *
        (A +
          ((1 - T + C) * A ** 3) / 6 +
          ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) +
      500000;
    let northing =
      k0 *
      (M +
        N *
          Math.tan(latRad) *
          (A ** 2 / 2 +
            ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
            ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
    if (lat < 0) northing += 10000000;
    return {
      zone,
      hemisphere,
      easting: Math.round(easting),
      northing: Math.round(northing),
    };
  };

  const formatDateThai = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const features = [
    {
      id: "health",
      icon: Leaf,
      label: t("feature.health"),
      color: "#16a34a",
      bgColor: "#dcfce7",
      enabled: true,
      onClick: () => navigate(`/dris_project/health/${fieldId}`),
    },
    {
      id: "analysis",
      icon: BarChart3,
      label: t("feature.analysis"),
      color: "#2563eb",
      bgColor: "#dbeafe",
      enabled: true,
      onClick: () => navigate(`/dris_project/analysis/${fieldId}`),
    },
    {
      id: "weather",
      icon: CloudSun,
      label: t("feature.weather"),
      color: "#ea580c",
      bgColor: "#fed7aa",
      enabled: false,
    },
    {
      id: "fertilizer",
      icon: Lightbulb,
      label: t("feature.fertilizer"),
      color: "#16a34a",
      bgColor: "#dcfce7",
      enabled: false,
    },
    {
      id: "disaster",
      icon: AlertTriangle,
      label: t("feature.disaster"),
      color: "#eab308",
      bgColor: "#fef9c3",
      enabled: false,
    },
    {
      id: "notebook",
      icon: BookOpen,
      label: t("feature.notebook"),
      color: "#16a34a",
      bgColor: "#dcfce7",
      enabled: false,
    },
  ];

  if (isLoading || !field) {
    return (
      <div
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
        style={{ background: "#f8fafc" }}
      >
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-500">{t("loading.message")}</p>
      </div>
    );
  }

  const area = formatArea(field.area_m2 || 0);
  const utm = latLngToUTM(field.centroid_lat || 0, field.centroid_lng || 0);

  // ========== DESKTOP LAYOUT ==========
  if (isDesktop) {
    return (
      <>
        <div
          className="fixed inset-0"
          style={{ background: "#f8fafc", zIndex: 9999 }}
        >
          {/* Full Map Background */}
          <div
            id="desktop-map-container"
            ref={mapContainerRef}
            className="absolute inset-0"
            style={{ zIndex: 0, width: "100%", height: "100%" }}
          />

          {/* Desktop Top Right Controls (Language & Theme) - Consistent with UserBadge */}
          {/* Desktop Header (Language, Theme, Profile) */}
          <DesktopHeader
            userName={user?.name}
            userRole="Farmer"
            currentStyle={currentStyle}
            onStyleChange={handleStyleChange}
            profileUrl={user?.profile_url || profileImage}
          />

          {/* Sidebar Panel - Conditional Render */}
          {activePanel === "health" ? (
            <DesktopHealthPanel
              field={{
                id: field.id,
                name: field.name,
                area_m2: field.area_m2,
                address: language === "EN" ? field.address_en : field.address,
                centroid_lat: field.centroid_lat,
                centroid_lng: field.centroid_lng,
                geometry: field.geometry,
                variety: field.variety,
                planting_date: field.planting_date,
                planting_season: field.planting_season,
              }}
              thumbnail={thumbnail}
              onBack={() => changeActivePanel(null)}
              mapRef={mapRef}
              onSnapshotsChange={(
                snapshots: VISnapshot[],
                selected: VISnapshot | null,
                setSelected: (s: VISnapshot) => void
              ) => {
                setMapSnapshots(snapshots);
                setMapSelectedSnapshot(selected);
                setSnapshotRef.current = setSelected;
              }}
            />
          ) : activePanel === "analysis" ? (
            <DesktopAnalysisPanel
              field={{
                id: field.id,
                name: field.name,
                area_m2: field.area_m2,
                address: language === "EN" ? field.address_en : field.address,
                centroid_lat: field.centroid_lat,
                centroid_lng: field.centroid_lng,
                geometry: field.geometry,
                variety: field.variety,
                planting_date: field.planting_date,
                planting_season: field.planting_season,
              }}
              thumbnail={thumbnail}
              onBack={() => changeActivePanel(null)}
              mapRef={mapRef}
            />
          ) : (
            <>
              {/* RIGHT SIDE - Field Details Panel (compact) + Feature Buttons */}
              <div
                className="absolute top-[130px] right-5 z-30 flex flex-col gap-3 pointer-events-auto"
                style={{ width: "350px", maxHeight: "742.4px" }}
              >
                {/* Field Details Panel */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800 text-center">
                      {t("field.details")}
                    </h2>
                  </div>

                  {/* Field Info */}
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="shrink-0">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt="Field thumbnail"
                            className="w-20 h-20 rounded-2xl object-cover shadow-sm"
                            style={{ border: "1px solid #e5e7eb" }}
                          />
                        ) : (
                          <div
                            className="w-20 h-20 rounded-2xl bg-gray-100 shadow-sm flex items-center justify-center text-gray-300"
                            style={{ border: "1px solid #e5e7eb" }}
                          >
                            <span className="text-xl">🌾</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name + Action Buttons */}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-800 leading-tight truncate pr-2">
                            {field.name}
                          </h3>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={fieldActions?.handleEdit}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 shadow-sm"
                              title={t("action.edit")}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={fieldActions?.handleDelete}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 shadow-sm"
                              title={t("action.delete")}
                            >
                              <Trash2 size={12} />
                            </button>
                            <button
                              onClick={fieldActions?.handleDownload}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 shadow-sm"
                              title={t("action.download")}
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Info Lines */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <VectorSquareIcon size={12} color="#F6B010" />
                            <span className="text-xs text-gray-700">
                              {showAreaInSqm
                                ? `${(field.area_m2 || 0).toFixed(2)} ${t(
                                    "unit.sqm"
                                  )}`
                                : `${area.rai} ${t("field.rai")} ${
                                    area.ngan
                                  } ${t("field.ngan")} ${area.tarangwa} ${t(
                                    "field.sqWa"
                                  )}`}
                            </span>
                            <button
                              className="text-gray-400 hover:text-gray-600 ml-auto"
                              onClick={() => setShowAreaInSqm(!showAreaInSqm)}
                            >
                              <RefreshCw size={10} />
                            </button>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <MapPin
                              size={12}
                              style={{ color: "#F6B010" }}
                              className="mt-0.5 shrink-0"
                            />
                            <span className="text-xs text-gray-700 leading-tight">
                              {(language === "EN"
                                ? field.address_en
                                : field.address) || t("field.addressFallback")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <LocateFixed
                              size={12}
                              style={{ color: "#F6B010" }}
                            />
                            <span className="text-xs text-gray-700">
                              {showCoordsInUTM
                                ? `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`
                                : `${field.centroid_lat?.toFixed(
                                    4
                                  )} ${field.centroid_lng?.toFixed(4)}`}
                            </span>
                            <button
                              className="text-gray-400 hover:text-gray-600 ml-1"
                              onClick={() =>
                                copyToClipboard(
                                  showCoordsInUTM
                                    ? `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`
                                    : `${field.centroid_lat}, ${field.centroid_lng}`
                                )
                              }
                            >
                              <Copy size={10} />
                            </button>
                            <button
                              className="text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                setShowCoordsInUTM(!showCoordsInUTM)
                              }
                            >
                              <RefreshCw size={8} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field Details Button */}
                  <div className="px-3 pb-3">
                    <button
                      ref={fieldDetailButtonRef}
                      onClick={() => setIsFieldDetailOpen(!isFieldDetailOpen)}
                      className="w-full bg-gray-50 rounded-lg py-2 px-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <ChevronLeft
                        size={12}
                        className={`text-gray-500 transition-transform ${
                          isFieldDetailOpen ? "-rotate-90" : ""
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {t("field.detailOf")}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Feature Buttons - 2 floating cards */}
                <button
                  onClick={() => changeActivePanel("health")}
                  className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl hover:border-green-300 transition-all group flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-600 transition-colors shrink-0">
                    <Leaf
                      size={20}
                      className="text-green-600 group-hover:text-white"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-left leading-tight group-hover:text-green-700">
                    {t("feature.health")}
                  </span>
                </button>

                <button
                  onClick={() => changeActivePanel("analysis")}
                  className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all group flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                    <BarChart3
                      size={20}
                      className="text-blue-600 group-hover:text-white"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-left leading-tight group-hover:text-blue-700">
                    {t("feature.analysis")}
                  </span>
                </button>
              </div>

              {/* Field Detail Popup (Portal) - positioned to the LEFT of details panel */}
              {isFieldDetailOpen &&
                createPortal(
                  <div
                    ref={fieldDetailPopupRef}
                    className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-visible"
                    style={{
                      position: "fixed",
                      right: "375px",
                      top: "200px",
                      width: "260px",
                      zIndex: 99999,
                    }}
                  >
                    {/* Arrow pointing to the right (towards the panel) */}
                    <div
                      style={{
                        position: "absolute",
                        right: "-8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 0,
                        height: 0,
                        borderTop: "8px solid transparent",
                        borderBottom: "8px solid transparent",
                        borderLeft: "8px solid white",
                        filter: "drop-shadow(2px 0 2px rgba(0,0,0,0.1))",
                      }}
                    />
                    <div className="p-3">
                      <div className="border border-green-500 rounded-lg">
                        <div className="flex items-center justify-between h-9 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-green-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-gray-700">
                              {t("field.detailOf")}
                            </span>
                          </div>
                          <button
                            onClick={() => setIsFieldDetailOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                        </div>
                        <div className="px-3 pb-3 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-500">
                              {t("field.plantVariety")}
                            </span>
                            <span className="text-[11px] font-medium text-gray-800">
                              {getVarietyLabel(field?.variety)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-500">
                              {t("farm.plantingDate")}
                            </span>
                            <span className="text-[11px] font-medium text-gray-800">
                              {field?.planting_date
                                ? new Date(
                                    field.planting_date
                                  ).toLocaleDateString(
                                    language === "TH" ? "th-TH" : "en-GB",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-gray-500">
                              {t("field.plantingSeasonLabel")}
                            </span>
                            <span className="text-[11px] font-medium text-gray-800">
                              {getSeasonLabel(field?.planting_season)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </>
          )}
          {/* Snapshot Carousel on Map - Floating buttons at bottom center */}
          {activePanel === "health" && mapSnapshots.length > 0 && (
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto flex items-end gap-3">
              {mapSnapshots.map((snapshot) => {
                const isSelected = mapSelectedSnapshot?.id === snapshot.id;
                return (
                  <button
                    key={snapshot.id}
                    onClick={() => setSnapshotRef.current?.(snapshot)}
                    className="flex flex-col items-center justify-center rounded-xl transition-all hover:scale-105"
                    style={{
                      width: "90px",
                      height: "88px",
                      padding: "6px",
                      background: "white",
                      border: isSelected
                        ? "3px solid #16a34a"
                        : "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {snapshot.overlay_data ? (
                      <img
                        src={getImageUrl(snapshot.overlay_data)}
                        alt="overlay"
                        className="rounded-lg object-cover mb-1"
                        style={{ width: "76px", height: "54px" }}
                      />
                    ) : (
                      <div
                        className="rounded-lg bg-green-100 flex items-center justify-center mb-1"
                        style={{ width: "76px", height: "54px" }}
                      >
                        <MapPin size={24} className="text-green-600" />
                      </div>
                    )}
                    <span
                      className="text-[11px] text-center font-semibold"
                      style={{ color: isSelected ? "#16a34a" : "#374151" }}
                    >
                      {formatDateThai(snapshot.snapshot_date)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TOP LEFT - Back Button */}
          <button
            onClick={() => navigate("/dris_project")}
            className="absolute top-5 left-5 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-green-600 hover:shadow-xl transition-all border border-gray-100 pointer-events-auto"
          >
            <ChevronLeft size={24} />
          </button>

          {/* LEFT SIDE - Map Controls (Vertically Centered) */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 pointer-events-auto">
            {/* Location + Layers Panel */}
            <div className="bg-white rounded-[20px] shadow-lg p-2 flex flex-col gap-2 w-12 border border-gray-100">
              <button
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                title="My Location"
                onClick={() => {
                  if (field && mapRef.current) {
                    mapRef.current.flyTo({
                      center: [field.centroid_lng, field.centroid_lat],
                      zoom: 16,
                    });
                  }
                }}
              >
                <Crosshair size={18} />
              </button>
              <button
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isLayersOpen
                    ? "bg-green-100 text-green-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                title="Layers"
                onClick={() => setIsLayersOpen(!isLayersOpen)}
              >
                <Layers size={18} />
              </button>
            </div>

            {/* Layers Popup */}
            {isLayersOpen && (
              <div className="absolute left-14 bottom-16 bg-white rounded-2xl shadow-xl p-4 min-w-[280px] border border-gray-100">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  {t("map.selectBasemap")}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "light",
                      name: "Light",
                      Icon: Sun,
                      desc: t("map.light"),
                      color: "text-amber-500",
                      bg: "bg-amber-50",
                    },
                    {
                      id: "dark",
                      name: "Dark",
                      Icon: Moon,
                      desc: t("map.dark"),
                      color: "text-slate-600",
                      bg: "bg-slate-100",
                    },
                    {
                      id: "voyager",
                      name: "Voyager",
                      Icon: MapIcon,
                      desc: t("map.voyager"),
                      color: "text-blue-500",
                      bg: "bg-blue-50",
                    },
                    {
                      id: "streets",
                      name: "Streets",
                      Icon: Building2,
                      desc: t("map.streets"),
                      color: "text-purple-500",
                      bg: "bg-purple-50",
                    },
                    {
                      id: "satellite",
                      name: "Satellite",
                      Icon: Satellite,
                      desc: t("map.satellite"),
                      color: "text-green-600",
                      bg: "bg-green-50",
                    },
                    {
                      id: "osm",
                      name: "OpenStreetMap",
                      Icon: Globe,
                      desc: t("map.osm"),
                      color: "text-cyan-500",
                      bg: "bg-cyan-50",
                    },
                  ].map((basemap) => (
                    <button
                      key={basemap.id}
                      onClick={() => handleStyleChange(basemap.id)}
                      className={`relative p-3 rounded-xl border-2 transition-all ${
                        currentStyle === basemap.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 ${basemap.bg} rounded-xl flex items-center justify-center mb-2 mx-auto`}
                      >
                        <basemap.Icon size={22} className={basemap.color} />
                      </div>
                      <div className="text-xs font-medium text-gray-800">
                        {basemap.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {basemap.desc}
                      </div>
                      {currentStyle === basemap.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px]">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="bg-white rounded-[20px] shadow-lg p-2 flex flex-col gap-2 w-12 border border-gray-100">
              <button
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-medium transition-colors"
                onClick={() => mapRef.current?.zoomIn()}
                title={t("map.zoomIn")}
              >
                +
              </button>
              <button
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-medium transition-colors"
                onClick={() => mapRef.current?.zoomOut()}
                title={t("map.zoomOut")}
              >
                −
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {fieldActions?.EditModal}
        {fieldActions?.DownloadPanel}
      </>
    );
  }

  // ========== MOBILE LAYOUT ==========
  return (
    <>
      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: "#f4f3ef", zIndex: 9999 }}
      >
        {/* Header */}
        <header
          className="flex items-center px-4 py-3 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "white",
            position: "relative",
            height: "auto",
            minHeight: "50px",
            border: "none",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <button
            onClick={() => navigate("/mobile")}
            className="w-9 h-9 rounded-full flex items-center justify-center mr-3 transition-colors"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 style={{ fontSize: "17px", fontWeight: 600, color: "white" }}>
            {t("field.details")}
          </h1>
        </header>

        {/* Map Section */}
        <div
          className="relative flex-shrink-0"
          style={{
            height: "37vh",
            minHeight: "180px",
            padding: "8px 12px",
            background: "#f4f3ef",
          }}
        >
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        {/* Bottom Sheet */}
        <div
          className="flex-1 overflow-y-auto relative z-10"
          style={{ background: "#f4f3ef", paddingTop: "0" }}
        >
          <div className="px-3 pb-4">
            {/* Field Info Card */}
            <div
              className="bg-white rounded-xl p-3 mb-1.5"
              style={{
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Field Name */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  {field.name}
                </h2>
                <button
                  onClick={fieldActions?.handleEdit}
                  className="p-1 rounded-md hover:bg-green-50 transition-colors"
                  title={t("field.editName")}
                >
                  <Pencil
                    className="w-3.5 h-3.5"
                    style={{ color: "#F6B010" }}
                  />
                </button>
              </div>

              {/* Area Info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                    <VectorSquareIcon size={12} color="#F6B010" />
                  </div>
                  <span style={{ fontSize: "12px", color: "#374151" }}>
                    {showAreaInSqm
                      ? `${(field.area_m2 || 0).toFixed(2)} ${t(
                          "unit.sqmShort"
                        )}`
                      : `${area.rai} ${t("field.rai")} ${area.ngan} ${t(
                          "field.ngan"
                        )} ${area.tarangwa} ${t("field.sqWaShort")}`}
                  </span>
                </div>
                <button
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => setShowAreaInSqm(!showAreaInSqm)}
                  title={
                    showAreaInSqm
                      ? t("unit.changeToRai")
                      : t("unit.changeToSqm")
                  }
                >
                  <RefreshCw
                    className="w-3.5 h-3.5"
                    style={{ color: "#6b7280" }}
                  />
                </button>
              </div>

              {/* Address */}
              <div className="flex items-start gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin size={12} style={{ color: "#F6B010" }} />
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#374151",
                    lineHeight: "1.4",
                  }}
                >
                  {(language === "EN" ? field.address_en : field.address) ||
                    t("field.addressFallback")}
                </span>
              </div>

              {/* Coordinates */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                    <LocateFixed size={12} style={{ color: "#F6B010" }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#374151" }}>
                    {showCoordsInUTM
                      ? `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`
                      : `${field.centroid_lat?.toFixed(
                          6
                        )}N, ${field.centroid_lng?.toFixed(6)}E`}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  <button
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      copyToClipboard(
                        showCoordsInUTM
                          ? `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`
                          : `${field.centroid_lat?.toFixed(
                              6
                            )}, ${field.centroid_lng?.toFixed(6)}`
                      )
                    }
                    title="คัดลอก"
                  >
                    <Copy
                      className="w-3.5 h-3.5"
                      style={{ color: "#6b7280" }}
                    />
                  </button>
                  <button
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    onClick={() => setShowCoordsInUTM(!showCoordsInUTM)}
                    title={
                      showCoordsInUTM
                        ? "เปลี่ยนเป็น ละติจูด, ลองจิจูด"
                        : "เปลี่ยนเป็น UTM"
                    }
                  >
                    <RefreshCw
                      className="w-3.5 h-3.5"
                      style={{ color: "#6b7280" }}
                    />
                  </button>
                </div>
              </div>

              {/* Field Detail Selector (Now inside the same card) */}
              <button
                onClick={() => setIsFieldDetailOpen(!isFieldDetailOpen)}
                className="w-full bg-blue-50 rounded-lg py-2 px-3 flex items-center justify-between cursor-pointer transition-colors border border-blue-100 hover:bg-blue-100"
              >
                <span className="text-xs font-semibold text-gray-800">
                  {t("field.detailOf")}
                </span>

                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isFieldDetailOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Field Detail Content (Inline Dropdown) */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isFieldDetailOpen
                    ? "max-h-[500px] opacity-100 mt-2"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Header with Radio */}
                  <div className="p-2">
                    <div className="border border-green-500 rounded-lg">
                      <div className="flex items-center justify-between h-10 px-3 border-b border-green-500/10">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-xs text-gray-700">
                            {t("field.detailOf")}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-3 py-3 space-y-3">
                        {/* ชนิดพันธุ์พืช */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {t("field.plantVariety")}
                          </span>
                          <span className="text-xs font-medium text-gray-800">
                            {getVarietyLabel(field?.variety)}
                          </span>
                        </div>

                        {/* วันที่ปลูก */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {t("farm.plantingDate")}
                          </span>
                          <span className="text-xs font-medium text-gray-800">
                            {field?.planting_date
                              ? new Date(
                                  field.planting_date
                                ).toLocaleDateString(
                                  language === "TH" ? "th-TH" : "en-US",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </span>
                        </div>

                        {/* ฤดูกาลปลูก */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {t("field.plantingSeasonLabel")}
                          </span>
                          <span className="text-xs font-medium text-gray-800">
                            {getSeasonLabel(field?.planting_season)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Buttons Card */}
            <div
              className="bg-white rounded-xl p-3"
              style={{
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={feature.enabled ? feature.onClick : undefined}
                      disabled={!feature.enabled}
                      className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 group"
                      style={{
                        background: feature.enabled ? "#f9fafb" : "#f3f4f6",
                        opacity: feature.enabled ? 1 : 0.5,
                        cursor: feature.enabled ? "pointer" : "not-allowed",
                      }}
                      onMouseEnter={(e) => {
                        if (feature.enabled) {
                          e.currentTarget.style.background = feature.bgColor;
                          e.currentTarget.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (feature.enabled) {
                          e.currentTarget.style.background = "#f9fafb";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-1 transition-all duration-200"
                        style={{ background: feature.bgColor }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: feature.color }}
                        />
                      </div>
                      <span
                        className="text-center whitespace-pre-line"
                        style={{
                          fontSize: "9px",
                          fontWeight: 500,
                          color: feature.enabled ? "#374151" : "#9ca3af",
                          lineHeight: 1.2,
                        }}
                      >
                        {feature.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {fieldActions?.EditModal}
      {fieldActions?.DownloadPanel}
    </>
  );
}
