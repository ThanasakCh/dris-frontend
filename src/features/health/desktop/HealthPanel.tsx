import { useState, useEffect, MutableRefObject, useRef } from "react";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  RefreshCw,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Download,
  MapPin,
  LocateFixed,
  Copy,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import axios from "../../../config/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { TimeSeriesChart } from "../../../shared/charts";
import { getImageUrl } from "../../../config/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useFieldActions } from "../../../hooks/useFieldActions";

// Icons
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

const LeafIcon = ({
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
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export interface VISnapshot {
  id: string;
  field_id: string;
  vi_type: string;
  snapshot_date: string;
  mean_value: number;
  min_value?: number;
  max_value?: number;
  overlay_data?: string;
  status_message?: string;
}

interface Field {
  id: string;
  name: string;
  area_m2: number;
  address?: string;
  centroid_lat: number;
  centroid_lng: number;
  geometry: any;
  variety?: string;
  planting_date?: string;
  planting_season?: string;
}

interface DesktopHealthPanelProps {
  field: Field;
  thumbnail: string | null;
  onBack: () => void;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  onSnapshotsChange?: (
    snapshots: VISnapshot[],
    selected: VISnapshot | null,
    setSelected: (s: VISnapshot) => void
  ) => void;
}

const viTypes = [
  {
    code: "NDVI",
    name: "NDVI",
    description: "Normalized Difference Vegetation I...",
  },
  { code: "EVI", name: "EVI", description: "Enhanced Vegetation Index" },
  { code: "GNDVI", name: "GNDVI", description: "Green NDVI" },
  {
    code: "NDWI",
    name: "NDWI",
    description: "Normalized Difference Water Index",
  },
  { code: "SAVI", name: "SAVI", description: "Soil Adjusted Vegetation Index" },
  { code: "VCI", name: "VCI", description: "Vegetation Condition Index" },
];

export default function DesktopHealthPanel({
  field,
  thumbnail,
  onBack,
  mapRef,
  onSnapshotsChange,
}: DesktopHealthPanelProps) {
  const { t } = useLanguage();
  const fieldActions = useFieldActions(field, onBack);

  // Helper functions to translate variety and season

  const [selectedVI, setSelectedVI] = useState("NDVI");
  const [snapshots, setSnapshots] = useState<VISnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<VISnapshot | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFieldDetailOpen, setIsFieldDetailOpen] = useState(false);
  const [showAreaInSqm, setShowAreaInSqm] = useState(false); // false = ไร่, true = ตร.ม.
  const [showCoordsInUTM, setShowCoordsInUTM] = useState(false); // false = LatLng, true = UTM
  const fieldDetailButtonRef = useRef<HTMLButtonElement>(null);
  const fieldDetailPopupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isFieldDetailOpen &&
        fieldDetailPopupRef.current &&
        fieldDetailButtonRef.current &&
        !fieldDetailPopupRef.current.contains(event.target as Node) &&
        !fieldDetailButtonRef.current.contains(event.target as Node)
      ) {
        setIsFieldDetailOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFieldDetailOpen]);

  const formatArea = (areaM2: number) => {
    const rai = Math.floor(areaM2 / 1600);
    const ngan = Math.floor((areaM2 % 1600) / 400);
    const tarangwa = Math.floor((areaM2 % 400) / 4);
    return { rai, ngan, tarangwa };
  };
  const area = formatArea(field.area_m2 || 0);

  // Convert LatLng to UTM
  const latLngToUTM = (lat: number, lng: number) => {
    // Determine UTM zone
    const zone = Math.floor((lng + 180) / 6) + 1;
    const hemisphere = lat >= 0 ? "N" : "S";

    // Constants for WGS84
    const a = 6378137; // semi-major axis
    const f = 1 / 298.257223563; // flattening
    const k0 = 0.9996; // scale factor
    const e = Math.sqrt(2 * f - f * f); // eccentricity
    const e2 = e * e;
    const ep2 = e2 / (1 - e2);

    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const lng0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180; // central meridian

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

    if (lat < 0) northing += 10000000; // southern hemisphere

    return {
      zone,
      hemisphere,
      easting: Math.round(easting),
      northing: Math.round(northing),
    };
  };

  const utm = latLngToUTM(field.centroid_lat || 0, field.centroid_lng || 0);

  useEffect(() => {
    if (field?.id) loadSnapshots();
  }, [field?.id, selectedVI]);
  useEffect(() => {
    if (selectedSnapshot && mapRef.current && field)
      displayOverlay(selectedSnapshot);
  }, [selectedSnapshot]);
  useEffect(() => {
    if (onSnapshotsChange)
      onSnapshotsChange(snapshots, selectedSnapshot, setSelectedSnapshot);
  }, [snapshots, selectedSnapshot]);

  const loadSnapshots = async () => {
    if (!field?.id) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`/vi-analysis/snapshots/${field.id}`, {
        params: { vi_type: selectedVI, limit: 4 },
      });
      const sorted = response.data.sort(
        (a: VISnapshot, b: VISnapshot) =>
          new Date(b.snapshot_date).getTime() -
          new Date(a.snapshot_date).getTime()
      );
      setSnapshots(sorted);
      setSelectedSnapshot(sorted.length > 0 ? sorted[0] : null);
    } catch {
      setSnapshots([]);
      setSelectedSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const displayOverlay = (snapshot: VISnapshot) => {
    if (!mapRef.current || !field || !snapshot.overlay_data) return;
    const map = mapRef.current;
    try {
      if (map.getLayer("vi-overlay-layer")) map.removeLayer("vi-overlay-layer");
      if (map.getSource("vi-overlay")) map.removeSource("vi-overlay");
    } catch {}
    const coords = field.geometry.coordinates[0] as [number, number][];
    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;
    coords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    map.addSource("vi-overlay", {
      type: "image",
      url: getImageUrl(snapshot.overlay_data),
      coordinates: [
        [minLng, maxLat],
        [maxLng, maxLat],
        [maxLng, minLat],
        [minLng, minLat],
      ],
    });
    map.addLayer({
      id: "vi-overlay-layer",
      type: "raster",
      source: "vi-overlay",
      paint: { "raster-opacity": 0.85 },
    });
  };

  const handleAnalyze = async () => {
    if (!field?.id) return;
    try {
      setIsAnalyzing(true);
      try {
        await axios.delete(`/vi-analysis/snapshots/${field.id}`, {
          params: { vi_type: selectedVI },
        });
      } catch {}
      const response = await axios.post(
        `/vi-analysis/${field.id}/analyze-historical`,
        null,
        { params: { vi_type: selectedVI, count: 4, clear_old: true } }
      );
      await loadSnapshots();
      await Swal.fire({
        title:
          response.data.snapshots_created === 0
            ? t("confirm.warning")
            : t("confirm.success"),
        text:
          response.data.snapshots_created === 0
            ? t("analysis.noSatelliteData")
            : `${t("analysis.completed")} ${t("analysis.gotData")} ${
                response.data.snapshots_created
              } ${t("analysis.images")}`,
        icon: response.data.snapshots_created === 0 ? "warning" : "success",
        confirmButtonText: t("action.ok"),
        confirmButtonColor: "#16a34a",
      });
    } catch (error: any) {
      await Swal.fire({
        title: t("confirm.error"),
        text: error.message,
        icon: "error",
        confirmButtonText: t("action.ok"),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear() + 543}`;
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

  const panel = (
    <div
      className="absolute top-[130px] right-5 z-30 flex flex-col gap-3 pointer-events-auto"
      style={{ width: "350px", maxHeight: "calc(100vh - 150px)" }}
    >
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-gray-800">
            {t("health.title")}
          </h2>
          <div className="w-8 h-8" />
        </div>
      </div>

      {/* Scrollable Content Card */}
      <div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex-1 flex flex-col"
        style={{
          maxHeight: "calc(100vh - 250px)",
          overflowY: snapshots.length > 0 ? "auto" : "hidden",
        }}
      >
        <div className="p-4">
          {/* Field Info Card */}
          <div className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100">
            <div className="flex gap-2.5">
              {/* Thumbnail */}
              <div className="shrink-0">
                <img
                  src={
                    thumbnail ||
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="94" height="94"><rect width="100%" height="100%" rx="24" ry="24" fill="%2316a34a"/><path d="M47 25 C47 45 47 60 47 70 M37 35 C42 40 47 45 47 45 M57 35 C52 40 47 45 47 45 M32 50 C40 55 47 60 47 60 M62 50 C54 55 47 60 47 60" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
                  }
                  alt="Field thumbnail"
                  className="w-[94px] h-[94px] rounded-3xl object-cover shadow-sm"
                  style={{ border: "1px solid #e5e7eb" }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                {/* Name + Buttons */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-xl font-bold text-gray-800 leading-none">
                    {field.name}
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={fieldActions.handleEdit}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-200 shadow-sm"
                      title={t("action.edit")}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={fieldActions.handleDelete}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-200 shadow-sm"
                      title={t("action.delete")}
                    >
                      <Trash2 size={10} />
                    </button>
                    <button
                      onClick={fieldActions.handleDownload}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-200 shadow-sm"
                      title={t("action.download")}
                    >
                      <Download size={10} />
                    </button>
                  </div>
                </div>

                {/* Info Lines */}
                <div className="flex flex-col gap-1">
                  {/* Area */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <VectorSquareIcon size={11} color="#F6B010" />
                      <span className="text-[11px] text-gray-600 leading-none">
                        {showAreaInSqm
                          ? `${(field.area_m2 || 0).toFixed(2)} ${t(
                              "unit.sqm"
                            )}`
                          : `${area.rai} ${t("field.rai")} ${area.ngan} ${t(
                              "field.ngan"
                            )} ${area.tarangwa} ${t("field.sqWa")}`}
                      </span>
                    </div>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowAreaInSqm(!showAreaInSqm)}
                      title={
                        showAreaInSqm
                          ? t("unit.changeToRai")
                          : t("unit.changeToSqm")
                      }
                    >
                      <RefreshCw size={10} />
                    </button>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5">
                    <MapPin
                      size={11}
                      style={{ color: "#F6B010" }}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">
                      {field.address || t("field.addressFallback")}
                    </span>
                  </div>

                  {/* Coordinates */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <LocateFixed size={11} style={{ color: "#F6B010" }} />
                      <span className="text-[11px] text-gray-600 leading-none">
                        {showCoordsInUTM
                          ? `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`
                          : `${field.centroid_lat?.toFixed(
                              4
                            )} ${field.centroid_lng?.toFixed(4)}`}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowCoordsInUTM(!showCoordsInUTM)}
                        title={
                          showCoordsInUTM
                            ? t("unit.changeToLatLng")
                            : t("unit.changeToUTM")
                        }
                      >
                        <RefreshCw size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <LeafIcon size={18} color="#16a34a" />
            <span className="text-sm font-semibold text-gray-800">
              {t("health.title")}
            </span>
          </div>

          {/* VI Selector */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
            <div className="text-[13px] text-gray-500 mb-3">
              {t("health.selectVIForMap")}
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <span className="text-[13px] text-gray-700 truncate pr-2">
                    {viTypes.find((v) => v.code === selectedVI)?.name} -{" "}
                    {viTypes.find((v) => v.code === selectedVI)?.description}
                  </span>
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-1"
                style={{
                  width: "var(--radix-dropdown-menu-trigger-width)",
                  zIndex: 10002,
                }}
                align="start"
                sideOffset={4}
              >
                {viTypes.map((vi) => (
                  <DropdownMenuItem
                    key={vi.code}
                    onSelect={() => !isAnalyzing && setSelectedVI(vi.code)}
                    className={`rounded-lg py-2 px-3 cursor-pointer flex items-center justify-between text-[13px] ${
                      selectedVI === vi.code
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>
                      {vi.name} - {vi.description}
                    </span>
                    {selectedVI === vi.code && (
                      <Check size={14} className="text-green-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`w-full mt-4 py-3 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors ${
                isAnalyzing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 cursor-pointer"
              } text-white`}
            >
              <RefreshCw
                size={16}
                className={isAnalyzing ? "animate-spin" : ""}
              />
              {isAnalyzing
                ? t("action.analyzing")
                : t("health.analyzeSatellite")}
            </button>
          </div>
        </div>

        {/* Scrollable Results Area - starts from Gauge Card */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-2">
          {/* Stats Card - Old Style */}
          {selectedSnapshot && (
            <div className="bg-white rounded-xl p-5 mb-3 shadow-sm border border-gray-100">
              <div className="text-center">
                {/* Title with date */}
                <div className="text-[13px] text-gray-500 mb-1">
                  {t("health.avgValue")} {selectedVI}
                </div>
                <div className="text-[14px] font-semibold text-gray-700 mb-4">
                  {new Date(selectedSnapshot.snapshot_date).toLocaleDateString(
                    "th-TH",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </div>

                {/* Large Value */}
                <div
                  className="text-[36px] font-bold mb-2"
                  style={{ color: "#4CAF50" }}
                >
                  {selectedSnapshot.mean_value.toFixed(3)}
                </div>

                {/* Simple Progress Bar */}
                <div className="bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        Math.max(selectedSnapshot.mean_value * 100, 0),
                        100
                      )}%`,
                      background: "linear-gradient(90deg, #4CAF50cc, #4CAF50)",
                    }}
                  />
                </div>

                {/* Health Status Badge */}
                {(() => {
                  const value = selectedSnapshot.mean_value;
                  let status = { text: "", color: "", desc: "" };
                  if (value < 0.3) {
                    status = {
                      text: t("health.low"),
                      color: "#ef4444",
                      desc: t("health.needImprovement"),
                    };
                  } else if (value < 0.6) {
                    status = {
                      text: t("health.medium"),
                      color: "#f59e0b",
                      desc: t("health.fairCondition"),
                    };
                  } else if (value < 0.8) {
                    status = {
                      text: t("health.good"),
                      color: "#10b981",
                      desc: t("health.goodCondition"),
                    };
                  } else {
                    status = {
                      text: t("health.excellent"),
                      color: "#059669",
                      desc: t("health.excellentCondition"),
                    };
                  }
                  return (
                    <div
                      className="inline-block px-3 py-1.5 rounded-full text-[12px] font-semibold"
                      style={{
                        background: status.color + "20",
                        border: `1px solid ${status.color}40`,
                        color: status.color,
                      }}
                    >
                      {status.text} • {status.desc}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Card 5: Chart - สีขาว */}
          {snapshots.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                {t("health.trendValue")} {selectedVI}
              </div>
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <TimeSeriesChart
                  data={snapshots
                    .map((s) => ({
                      date: formatDate(s.snapshot_date),
                      value: s.mean_value,
                    }))
                    .reverse()}
                  viType={selectedVI}
                  height="150px"
                  showLegend={false}
                  isMobile={false}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 20,
                  marginTop: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 0,
                      borderTop: "2px solid #16a34a",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    {t("health.selectedDateData")}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#16a34a",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    {t("health.latestDataDate")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && snapshots.length === 0 && (
            <div
              className="flex-1 flex flex-col items-center justify-center"
              style={{
                background: "white",
                borderRadius: 20,
                padding: 20,
                textAlign: "center",
                minHeight: 120,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  fontSize: 24,
                }}
              >
                🌱
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                {t("health.noDataYet")}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div
              style={{
                background: "white",
                borderRadius: 20,
                padding: 32,
                textAlign: "center",
              }}
            >
              <div
                className="animate-spin"
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid #16a34a",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ fontSize: 14, color: "#9ca3af" }}>
                {t("loading.message")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Return wrapped with modals from useFieldActions hook
  return (
    <>
      {panel}
      {fieldActions.EditModal}
      {fieldActions.DownloadPanel}
    </>
  );
}
