import { useState, useRef, MutableRefObject, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  Pencil,
  Trash2,
  Download,
  MapPin,
  LocateFixed,
  Copy,
  X,
  Image as ImageIcon,
  FileText,
  BarChart3,
  Grid3X3,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import axios from "../../../config/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { TimeSeriesChart, TimeSeriesChartRef } from "../../../shared/charts";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useFieldActions } from "../../../hooks/useFieldActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const TrendIcon = ({
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
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

interface TimeSeriesData {
  date: string;
  value: number;
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

interface DesktopAnalysisPanelProps {
  field: Field;
  thumbnail: string | null;
  onBack: () => void;
  mapRef: MutableRefObject<maplibregl.Map | null>;
}

const viTypes = [
  {
    code: "NDVI",
    name: "NDVI",
    description: "Normalized Difference Vegetatio...",
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

const monthKeys = [
  "month.jan",
  "month.feb",
  "month.mar",
  "month.apr",
  "month.may",
  "month.jun",
  "month.jul",
  "month.aug",
  "month.sep",
  "month.oct",
  "month.nov",
  "month.dec",
];

const monthShortKeys = [
  "month.janShort",
  "month.febShort",
  "month.marShort",
  "month.aprShort",
  "month.mayShort",
  "month.junShort",
  "month.julShort",
  "month.augShort",
  "month.sepShort",
  "month.octShort",
  "month.novShort",
  "month.decShort",
];

export default function DesktopAnalysisPanel({
  field,
  thumbnail,
  onBack,
  mapRef: _mapRef,
}: DesktopAnalysisPanelProps) {
  const { t, language } = useLanguage();
  const fieldActions = useFieldActions(field, onBack);

  // Helper functions to translate variety and season
  const getVarietyLabel = (variety: string | undefined): string => {
    if (!variety) return "-";
    const v = variety.toLowerCase();
    if (v.includes("jasmine") || v === "jasmine") return t("farm.jasmine");
    if (v.includes("ricekk6") || v === "ricekk6") return t("farm.riceKK6");
    if (v.includes("ricekk15") || v === "ricekk15") return t("farm.riceKK15");
    if (v.includes("ricept") || v === "ricept") return t("farm.ricePT");
    if (v.includes("stickyrice") || v === "stickyrice")
      return t("farm.stickyRice");
    if (v.includes("riceberry") || v === "riceberry")
      return t("farm.riceberry");
    if (v.includes("other") || v === "other") return t("farm.other");
    return variety;
  };

  const getSeasonLabel = (season: string | undefined): string => {
    if (!season) return "-";
    const s = season.toLowerCase();
    if (s.includes("wetseason") || s === "wetseason")
      return t("farm.wetSeason");
    if (s.includes("dryseason") || s === "dryseason")
      return t("farm.drySeason");
    if (s.includes("transplant") || s === "transplant")
      return t("farm.transplant");
    if (s.includes("broadcast") || s === "broadcast")
      return t("farm.broadcast");
    return season;
  };
  const [selectedVI, setSelectedVI] = useState("NDVI");
  const [analysisType, setAnalysisType] = useState<
    "monthly_range" | "full_year" | "ten_year_avg"
  >("monthly_range");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [isFieldDetailOpen, setIsFieldDetailOpen] = useState(false);
  const chartRef = useRef<TimeSeriesChartRef>(null);
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

  // State for toggle units
  const [showAreaInSqm, setShowAreaInSqm] = useState(false);
  const [showCoordsInUTM, setShowCoordsInUTM] = useState(false);

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
  const utm = latLngToUTM(field.centroid_lat || 0, field.centroid_lng || 0);

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 9;
    return Array.from({ length: 10 }, (_, i) => startYear + i).reverse();
  };

  const getAnalysisDescription = (): string => {
    switch (analysisType) {
      case "monthly_range":
        const start = t(monthKeys[startMonth - 1]);
        const end = t(monthKeys[endMonth - 1]);
        return `${t("analysis.monthlyAvg")} ${selectedVI} ${t(
          "analysis.monthlyRange"
        )} ${start} - ${end} ${t("analysis.yearLabel")} ${selectedYear}`;
      case "full_year":
        return `${t("analysis.yearlyAvg")} ${selectedVI} ${t(
          "analysis.fullYear"
        )} ${selectedYear}`;
      case "ten_year_avg":
        return `${t("analysis.yearlyAvg")} ${selectedVI} (${t(
          "analysis.tenYearAvg"
        )})`;
      default:
        return "";
    }
  };

  const processTimeSeriesData = (rawData: any[]): TimeSeriesData[] => {
    if (analysisType === "ten_year_avg") {
      return rawData
        .map((item) => {
          const date = new Date(item.measurement_date || item.date);
          const value = item.vi_value || item.value;
          return { date: date.getFullYear().toString(), value };
        })
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else {
      return rawData.map((item) => {
        const date = new Date(item.measurement_date || item.date);
        const value = item.vi_value || item.value;
        const monthIndex = date.getMonth();
        return {
          date: t(monthShortKeys[monthIndex]),
          value,
        };
      });
    }
  };

  const analyzeFieldVI = async () => {
    if (!field.id) return;

    try {
      setIsAnalyzing(true);
      // Clear old data and close popup before starting new analysis
      setTimeSeriesData([]);
      setShowResultPopup(false);

      let startDate: Date, endDate: Date;

      switch (analysisType) {
        case "monthly_range":
          startDate = new Date(selectedYear, startMonth - 1, 1);
          endDate = new Date(selectedYear, endMonth, 0);
          break;
        case "full_year":
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          break;
        case "ten_year_avg":
          endDate = new Date();
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 10);
          break;
        default:
          return;
      }

      const response = await axios.get(`/vi/timeseries/${field.id}`, {
        params: {
          vi_type: selectedVI,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          analysis_type: analysisType,
        },
      });

      if (response.data.timeseries && response.data.timeseries.length > 0) {
        const processedData = processTimeSeriesData(response.data.timeseries);
        setTimeSeriesData(processedData);
        setShowResultPopup(true);
      } else {
        setTimeSeriesData([]);
        setShowResultPopup(false);
        Swal.fire({
          title: t("confirm.warning"),
          text: t("analysis.noDataWarning"),
          icon: "warning",
          confirmButtonText: t("action.ok"),
          confirmButtonColor: "#16a34a",
        });
      }
    } catch (error: any) {
      console.error("Failed to analyze field VI:", error);
      setTimeSeriesData([]);
      setShowResultPopup(false);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        t("health.unknownCause");
      Swal.fire({
        title: t("confirm.error"),
        text: `${t("analysis.geeError")}:\n\n${errorMessage}`,
        icon: "error",
        confirmButtonText: t("action.ok"),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadChartImage = () => {
    chartRef.current?.downloadImage(
      `${field?.name || "field"}_${selectedVI}_${analysisType}.png`
    );
  };

  const downloadCSV = () => {
    if (timeSeriesData.length === 0) return;
    const headers = [t("table.date"), `${t("table.value")} ${selectedVI}`];
    const csvData = timeSeriesData.map((item) => [
      item.date,
      item.value.toFixed(4),
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      field?.name || "field"
    }_${selectedVI}_${analysisType}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  return (
    <>
      {/* Main Panel */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          bottom: 16,
          zIndex: 30,
          width: 350,
        }}
      >
        <div className="w-full h-full bg-gray-50 rounded-[32px] shadow-xl pointer-events-auto relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:text-green-600 hover:border-green-600 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-800 flex-1 text-center">
                {t("field.details")}
              </h2>
              <div className="w-12 h-12" />
            </div>
          </div>

          {/* Fixed Content */}
          <div
            className="shrink-0 px-4 relative z-20"
            style={{ overflow: "visible" }}
          >
            {/* Field Info Card */}
            <div className="bg-white rounded-3xl p-3.5 mb-3 shadow-sm border border-gray-100">
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

            {/* Field Detail Selector */}
            <div className="mb-3">
              <button
                ref={fieldDetailButtonRef}
                onClick={() => setIsFieldDetailOpen(!isFieldDetailOpen)}
                className="w-full bg-blue-50 rounded-xl py-2 px-4 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <span className="text-sm font-semibold text-gray-800">
                  {t("field.detailOf")}
                </span>
                <ChevronRight
                  size={14}
                  className={`text-gray-600 transition-transform ${
                    isFieldDetailOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Field Detail Popup - GISTDA Style (using Portal) */}
              {isFieldDetailOpen &&
                createPortal(
                  <div
                    ref={fieldDetailPopupRef}
                    className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                    style={{
                      position: "fixed",
                      left: "334px",
                      top: "222px",
                      width: "300px",
                      zIndex: 9999,
                    }}
                  >
                    {/* Header with Radio */}
                    <div className="px-2 py-2">
                      <div className="border border-green-500 rounded-lg">
                        <div className="flex items-center justify-between h-10 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-gray-700">
                              {t("field.detailOf")}
                            </span>
                          </div>
                          <button
                            onClick={() => setIsFieldDetailOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ChevronUp size={16} />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="px-3 pb-2 space-y-2">
                          {/* ชนิดพันธุ์พืช */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {t("field.plantVariety")}
                            </span>
                            <span className="text-xs font-medium text-gray-800">
                              {getVarietyLabel(field.variety)}
                            </span>
                          </div>

                          {/* วันที่ปลูก */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {t("farm.plantingDate")}
                            </span>
                            <span className="text-xs font-medium text-gray-800">
                              {field.planting_date
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
                              {getSeasonLabel(field.planting_season)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>,

                  document.body
                )}
            </div>

            {/* Tab Header */}
            <div className="flex items-center justify-between py-2 px-1 mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <TrendIcon size={18} color="#16a34a" />
                <span className="text-[15px] font-semibold text-gray-800">
                  {t("analysis.trendAnalysis")}
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: 12, color: "#073B1A" }}>
                  {t("health.menu")}
                </span>
                <button
                  type="button"
                  id="menu_btn"
                  aria-label="ย้อนกลับ"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onBack) onBack();
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    background: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                >
                  <Grid3X3 size={16} style={{ color: "#073B1A" }} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* เลือกดัชนีพืช */}
            <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
              <div className="text-[12px] text-gray-500 mb-2">
                {t("analysis.selectVI")}
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
            </div>

            {/* ประเภทการวิเคราะห์ */}
            <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
              <div className="text-[12px] text-gray-500 mb-2">
                {t("analysis.type")}
              </div>
              <div className="flex gap-2">
                {[
                  { code: "monthly_range", label: t("analysis.monthRange") },
                  { code: "full_year", label: t("analysis.fullYear") },
                  { code: "ten_year_avg", label: t("analysis.tenYearAvg") },
                ].map((type) => (
                  <button
                    key={type.code}
                    onClick={() =>
                      setAnalysisType(
                        type.code as
                          | "monthly_range"
                          | "full_year"
                          | "ten_year_avg"
                      )
                    }
                    disabled={isAnalyzing}
                    className={`flex-1 py-2 rounded-full text-[12px] font-medium transition-all ${
                      analysisType === type.code
                        ? "bg-green-100 text-green-700 border-2 border-green-500"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selectors */}
            {analysisType !== "ten_year_avg" && (
              <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
                <div className="flex gap-2 items-end">
                  {/* ปี */}
                  <div className="flex-1">
                    <label className="text-[11px] text-gray-500 mb-1 block">
                      {t("analysis.yearLabel")}
                    </label>
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(value) => setSelectedYear(Number(value))}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger className="w-full h-9 px-2 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                        <SelectValue placeholder={String(selectedYear)} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableYears().map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* เดือนเริ่ม */}
                  {analysisType === "monthly_range" && (
                    <>
                      <div className="flex-1">
                        <label className="text-[11px] text-gray-500 mb-1 block">
                          {t("analysis.startMonth")}
                        </label>
                        <Select
                          value={String(startMonth)}
                          onValueChange={(value) =>
                            setStartMonth(Number(value))
                          }
                          disabled={isAnalyzing}
                        >
                          <SelectTrigger className="w-full h-9 px-2 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                            <SelectValue placeholder={t(monthKeys[0])} />
                          </SelectTrigger>
                          <SelectContent>
                            {monthKeys.map((key, idx) => (
                              <SelectItem key={idx} value={String(idx + 1)}>
                                {t(key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* เดือนสิ้นสุด */}
                      <div className="flex-1">
                        <label className="text-[11px] text-gray-500 mb-1 block">
                          {t("analysis.endMonth")}
                        </label>
                        <Select
                          value={String(endMonth)}
                          onValueChange={(value) => setEndMonth(Number(value))}
                          disabled={isAnalyzing}
                        >
                          <SelectTrigger className="w-full h-9 px-2 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                            <SelectValue placeholder={t(monthKeys[0])} />
                          </SelectTrigger>
                          <SelectContent>
                            {monthKeys.map((key, idx) => (
                              <SelectItem key={idx} value={String(idx + 1)}>
                                {t(key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={analyzeFieldVI}
              disabled={isAnalyzing}
              className={`w-full py-3 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors ${
                isAnalyzing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 cursor-pointer"
              } text-white`}
            >
              <RefreshCw
                size={16}
                className={isAnalyzing ? "animate-spin" : ""}
              />
              {isAnalyzing ? t("action.analyzing") : t("analysis.analyzeTrend")}
            </button>

            {/* Description */}
            <p className="text-[10px] text-gray-400 text-center mt-2 leading-relaxed">
              {t("analysis.sentinelInfo")}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Open Button - shown when popup is closed but has data */}
      {!showResultPopup && timeSeriesData.length > 0 && (
        <button
          onClick={() => setShowResultPopup(true)}
          className="absolute bg-white flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            left: 366,
            width: 28,
            height: 56,
            zIndex: 35,
            borderRadius: "0 16px 16px 0",
            boxShadow: "4px 0 12px rgba(0,0,0,0.1)",
          }}
        >
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}

      {/* Result Popup - ข้างๆ Panel */}
      {showResultPopup && timeSeriesData.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: 366,
            zIndex: 35,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Toggle Button (Arrow) - seamlessly connected */}
          <button
            onClick={() => setShowResultPopup(false)}
            className="bg-white flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
            style={{
              width: 28,
              height: 56,
              borderRadius: "16px 0 0 16px",
              marginRight: -1,
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Popup Content */}
          <div
            className="bg-white overflow-hidden"
            style={{
              width: 340,
              borderRadius: "0 24px 24px 0",
              boxShadow: "4px 4px 20px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendIcon size={20} color="#16a34a" />
                <span className="font-semibold text-gray-800 text-[17px]">
                  {t("analysis.resultOf")} {selectedVI}
                </span>
              </div>
              <button
                onClick={() => setShowResultPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Field Info Card - Green */}
            <div className="mx-4 mb-4">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    <MapPin size={16} className="text-white" />
                  </div>
                  <span className="text-white font-semibold text-[15px]">
                    {field.name}
                  </span>
                </div>
                <div className="text-white/90 text-[13px]">
                  Lat: {field.centroid_lat?.toFixed(4)}, Lng:{" "}
                  {field.centroid_lng?.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Time Series Title */}
            <div className="px-5 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600" />
                <span className="font-semibold text-gray-800">
                  {t("analysis.timeSeries")} ({selectedYear})
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {timeSeriesData.length} {t("analysis.dataPoints")}
              </span>
            </div>

            {/* Chart */}
            <div className="px-4 mb-4">
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <TimeSeriesChart
                  ref={chartRef}
                  data={timeSeriesData}
                  viType={selectedVI}
                  height="200px"
                  showLegend={true}
                  isMobile={false}
                />
              </div>

              {/* Description */}
              <div className="text-center text-xs text-gray-500 mt-3">
                {getAnalysisDescription()}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="px-4 mb-4 flex gap-3">
              <button
                onClick={downloadChartImage}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 border-green-600 text-green-600 font-semibold text-[14px] hover:bg-green-50 transition-colors"
              >
                <ImageIcon size={18} />
                {t("action.image")}
              </button>
              <button
                onClick={downloadCSV}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 border-green-600 text-green-600 font-semibold text-[14px] hover:bg-green-50 transition-colors"
              >
                <FileText size={18} />
                CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals from useFieldActions hook */}
      {fieldActions.EditModal}
      {fieldActions.DownloadPanel}
    </>
  );
}
