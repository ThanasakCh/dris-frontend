import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Image,
  FileSpreadsheet,
  ChevronDown,
  Check,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useField } from "../../contexts/FieldContext";
import { useLanguage } from "../../contexts/LanguageContext";
import axios from "../../config/axios";
import { TimeSeriesChart, TimeSeriesChartRef } from "../../shared/charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const viTypes = [
  {
    code: "NDVI",
    name: "NDVI",
    description: "Normalized Difference Vegetation Index",
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

const months = [
  { value: 1, name: "มกราคม", short: "ม.ค." },
  { value: 2, name: "กุมภาพันธ์", short: "ก.พ." },
  { value: 3, name: "มีนาคม", short: "มี.ค." },
  { value: 4, name: "เมษายน", short: "เม.ย." },
  { value: 5, name: "พฤษภาคม", short: "พ.ค." },
  { value: 6, name: "มิถุนายน", short: "มิ.ย." },
  { value: 7, name: "กรกฎาคม", short: "ก.ค." },
  { value: 8, name: "สิงหาคม", short: "ส.ค." },
  { value: 9, name: "กันยายน", short: "ก.ย." },
  { value: 10, name: "ตุลาคม", short: "ต.ค." },
  { value: 11, name: "พฤศจิกายน", short: "พ.ย." },
  { value: 12, name: "ธันวาคม", short: "ธ.ค." },
];

interface TimeSeriesData {
  date: string;
  value: number;
}

export default function MobileAnalysisPage() {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { fields, getField, currentField } = useField();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [selectedVI, setSelectedVI] = useState("NDVI");
  const [analysisType, setAnalysisType] = useState<
    "monthly_range" | "full_year" | "ten_year_avg"
  >("monthly_range");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(3);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const chartRef = useRef<TimeSeriesChartRef>(null);

  const field = fields.find((f) => f.id === fieldId) || currentField;

  useEffect(() => {
    if (!fieldId) {
      navigate("/dris_project");
      return;
    }
    loadField();
  }, [fieldId]);

  useEffect(() => {
    if (field && mapContainerRef.current && !mapRef.current && !isLoading) {
      initializeMap();
    }
  }, [field, isLoading]);

  const loadField = async () => {
    if (!fieldId) return;
    try {
      setIsLoading(true);
      await getField(fieldId);
    } catch (error) {
      console.error("Failed to load field:", error);
      navigate("/dris_project");
    } finally {
      setIsLoading(false);
    }
  };

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
        data: { type: "Feature", geometry: field.geometry, properties: {} },
      });

      map.addLayer({
        id: "field-fill",
        type: "fill",
        source: "field",
        paint: { "fill-color": "#fde047", "fill-opacity": 0.3 },
      });

      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "field",
        paint: { "line-color": "#ef4444", "line-width": 3 },
      });

      const coords = field.geometry.coordinates[0] as [number, number][];
      const bounds = coords.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 5 });
    });

    mapRef.current = map;
  };

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i).reverse();
  };

  const getAnalysisDescription = (): string => {
    switch (analysisType) {
      case "monthly_range":
        const startMonthName =
          months.find((m) => m.value === startMonth)?.short || "";
        const endMonthName =
          months.find((m) => m.value === endMonth)?.short || "";
        return `${selectedVI} ${startMonthName}-${endMonthName} ${selectedYear}`;
      case "full_year":
        return `${selectedVI} ปี ${selectedYear}`;
      case "ten_year_avg":
        return `${selectedVI} (10 ปีย้อนหลัง)`;
      default:
        return selectedVI;
    }
  };

  const processTimeSeriesData = (rawData: any[]): TimeSeriesData[] => {
    if (analysisType === "ten_year_avg") {
      return rawData
        .map((item) => ({
          date: new Date(item.measurement_date || item.date)
            .getFullYear()
            .toString(),
          value: item.vi_value || item.value,
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else {
      return rawData.map((item) => ({
        date: new Date(item.measurement_date || item.date).toLocaleDateString(
          "th-TH",
          { month: "short" }
        ),
        value: item.vi_value || item.value,
      }));
    }
  };

  const handleAnalyze = async () => {
    if (!fieldId || !field) return;

    try {
      setIsAnalyzing(true);

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

      const response = await axios.get(`/vi/timeseries/${fieldId}`, {
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

        await Swal.fire({
          title: "สำเร็จ",
          text: `วิเคราะห์เสร็จสิ้น! ได้ข้อมูล ${processedData.length} จุด`,
          icon: "success",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#16a34a",
        });
      } else {
        setTimeSeriesData([]);
        await Swal.fire({
          title: "แจ้งเตือน",
          text: "ไม่พบข้อมูลในช่วงเวลาที่เลือก กรุณาเลือกช่วงเวลาอื่น",
          icon: "warning",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#16a34a",
        });
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setTimeSeriesData([]);
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text:
          "การวิเคราะห์ไม่สำเร็จ: " +
          (error.response?.data?.detail || error.message),
        icon: "error",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#16a34a",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadChartImage = () => {
    chartRef.current?.downloadImage(
      `${field?.name || "field"}_${selectedVI}_chart.png`
    );
  };

  const downloadCSV = () => {
    if (timeSeriesData.length === 0) return;
    const header = analysisType === "ten_year_avg" ? "ปี,ค่า" : "เดือน,ค่า";
    const rows = timeSeriesData.map((d) => `${d.date},${d.value}`);
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${field?.name || "field"}_${selectedVI}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
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

  return (
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
          onClick={() => navigate(`/dris_project/field/${fieldId}`)}
          className="w-9 h-9 rounded-full flex items-center justify-center mr-3"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontSize: "17px", fontWeight: 600 }}>
          {t("analysis.analyzeTrend")}
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
        <div className="px-3 pb-3">
          {/* Main Settings Card */}
          <div
            className="rounded-xl p-2.5 mb-2"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* VI Selector Row */}
            {/* VI Selector Row - Stacked for mobile */}
            <div
              className="mb-2 pb-2"
              style={{ borderBottom: "1px solid #f3f4f6" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#dbeafe" }}
                >
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "#3b82f6" }}
                  />
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1f2937",
                      margin: 0,
                    }}
                  >
                    {t("analysis.selectVI")}
                  </h4>
                  <p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>
                    {t("analysis.selectVITrendDesc")}
                  </p>
                </div>
              </div>

              <div className="w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isAnalyzing}
                      className="w-full p-2 rounded-lg flex items-center justify-between"
                      style={{
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                        background: "#f9fafb",
                        color: "#1f2937",
                        textAlign: "left",
                      }}
                    >
                      <span className="truncate">
                        {viTypes.find((v) => v.code === selectedVI)?.name} -{" "}
                        {
                          viTypes.find((v) => v.code === selectedVI)
                            ?.description
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white rounded-xl shadow-lg border border-gray-100 p-1"
                    align="start"
                    sideOffset={5}
                    style={{ zIndex: 10002 }}
                  >
                    {viTypes.map((vi) => (
                      <DropdownMenuItem
                        key={vi.code}
                        onSelect={() => setSelectedVI(vi.code)}
                        className={`rounded-lg py-2.5 px-3 cursor-pointer flex items-center justify-between outline-none ${
                          selectedVI === vi.code
                            ? "bg-green-50 text-green-700"
                            : "text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                          <span className="font-bold whitespace-nowrap text-sm">
                            {vi.name}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              selectedVI === vi.code
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {vi.description}
                          </span>
                        </div>
                        {selectedVI === vi.code && (
                          <Check className="w-4 h-4 flex-shrink-0 ml-2 text-green-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Analysis Type Row */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1f2937",
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("analysis.type")}
                </p>
              </div>

              <div className="flex gap-1 flex-1">
                {[
                  { type: "monthly_range" as const, label: "ช่วงเดือน" },
                  { type: "full_year" as const, label: "ทั้งปี" },
                  { type: "ten_year_avg" as const, label: "10 ปีย้อนหลัง" },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setAnalysisType(item.type)}
                    className="flex-1 px-1.5 py-1.5 rounded-lg text-center"
                    style={{
                      background:
                        analysisType === item.type ? "#dcfce7" : "#f3f4f6",
                      border:
                        analysisType === item.type
                          ? "1.5px solid #16a34a"
                          : "1px solid #e5e7eb",
                      fontSize: "10px",
                      fontWeight: 500,
                      color: analysisType === item.type ? "#16a34a" : "#6b7280",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selectors Row */}
            {analysisType !== "ten_year_avg" && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      fontWeight: 500,
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    ปี:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    disabled={isAnalyzing}
                    className="w-full p-2 rounded-xl"
                    style={{ border: "1px solid #e5e7eb", fontSize: "13px" }}
                  >
                    {getAvailableYears().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {analysisType === "monthly_range" && (
                  <>
                    <div className="flex-1">
                      <label
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          fontWeight: 500,
                          display: "block",
                          marginBottom: "2px",
                        }}
                      >
                        เริ่ม:
                      </label>
                      <select
                        value={startMonth}
                        onChange={(e) =>
                          setStartMonth(parseInt(e.target.value))
                        }
                        disabled={isAnalyzing}
                        className="w-full p-2 rounded-xl"
                        style={{
                          border: "1px solid #e5e7eb",
                          fontSize: "13px",
                        }}
                      >
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          fontWeight: 500,
                          display: "block",
                          marginBottom: "2px",
                        }}
                      >
                        สิ้นสุด:
                      </label>
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(parseInt(e.target.value))}
                        disabled={isAnalyzing}
                        className="w-full p-2 rounded-xl"
                        style={{
                          border: "1px solid #e5e7eb",
                          fontSize: "13px",
                        }}
                      >
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl mb-4"
            style={{
              background: isAnalyzing
                ? "#9ca3af"
                : "linear-gradient(135deg, #16a34a, #15803d)",
              color: "white",
              fontWeight: 600,
              fontSize: "15px",
              border: "none",
              cursor: isAnalyzing ? "not-allowed" : "pointer",
              boxShadow: isAnalyzing
                ? "none"
                : "0 4px 12px rgba(22, 163, 74, 0.3)",
            }}
          >
            <RefreshCw
              className={`w-5 h-5 ${isAnalyzing ? "animate-spin" : ""}`}
            />
            {isAnalyzing ? t("action.analyzing") : t("analysis.analyzeTrend")}
          </button>

          {/* Results Section */}
          {timeSeriesData.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#dcfce7" }}
                  >
                    <BarChart3
                      className="w-4 h-4"
                      style={{ color: "#16a34a" }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1f2937",
                        margin: 0,
                      }}
                    >
                      {t("analysis.results")}
                    </p>
                    <p
                      style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}
                    >
                      {timeSeriesData.length} {t("analysis.dataPoints")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadChartImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      background: "white",
                      fontSize: "12px",
                      color: "#16a34a",
                      border: "1px solid #16a34a",
                      fontWeight: 500,
                    }}
                  >
                    <Image className="w-4 h-4" />
                    {t("action.image")}
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      background: "white",
                      fontSize: "12px",
                      color: "#16a34a",
                      border: "1px solid #16a34a",
                      fontWeight: 500,
                    }}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>

              <div
                className="rounded-xl overflow-hidden mb-2"
                style={{ background: "#f9fafb", padding: "6px" }}
              >
                <TimeSeriesChart
                  ref={chartRef}
                  data={timeSeriesData}
                  viType={selectedVI}
                  height="180px"
                  showLegend={true}
                  title={getAnalysisDescription()}
                  isMobile={true}
                />
              </div>

              <p
                className="text-center"
                style={{ fontSize: "11px", color: "#6b7280" }}
              >
                {getAnalysisDescription()}
              </p>
            </div>
          )}

          {/* Empty State */}
          {timeSeriesData.length === 0 && !isAnalyzing && (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: "#f9fafb", border: "1px dashed #d1d5db" }}
            >
              <TrendingUp
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "#9ca3af" }}
              />
              <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                {t("analysis.selectTimeToAnalyze")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
