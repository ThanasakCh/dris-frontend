import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  ChevronDown,
  Check,
  ChevronUp,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useField } from "../../contexts/FieldContext";
import { useLanguage } from "../../contexts/LanguageContext";
import axios from "../../config/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { TimeSeriesChart } from "../../shared/charts";
import { getImageUrl } from "../../config/api";

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

interface VISnapshot {
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

export default function MobileHealthPage() {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { fields, getField, currentField } = useField();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [snapshots, setSnapshots] = useState<VISnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<VISnapshot | null>(
    null
  );
  const [selectedVI, setSelectedVI] = useState("NDVI");

  const [isCarouselExpanded, setIsCarouselExpanded] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  };

  const scrollPrev = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
    }
  };

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

  useEffect(() => {
    if (field && mapLoaded) {
      loadSnapshots();
    }
  }, [field, selectedVI, mapLoaded]);

  useEffect(() => {
    if (selectedSnapshot && mapRef.current && field && mapLoaded) {
      displayOverlay(selectedSnapshot);
    }
  }, [selectedSnapshot, mapLoaded]);

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
      // Add field boundary
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
          "fill-color": "#ffff00",
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "field",
        paint: {
          "line-color": "#ff0000",
          "line-width": 2,
        },
      });

      // Fit to field bounds
      const coords = field.geometry.coordinates[0] as [number, number][];
      const bounds = coords.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 50 });

      // Mark map as loaded
      setMapLoaded(true);
    });

    mapRef.current = map;
  };

  const loadSnapshots = async () => {
    if (!fieldId) return;

    try {
      const response = await axios.get(`/vi-analysis/snapshots/${fieldId}`, {
        params: { vi_type: selectedVI, limit: 4 },
      });

      const sortedSnapshots = response.data.sort(
        (a: VISnapshot, b: VISnapshot) =>
          new Date(b.snapshot_date).getTime() -
          new Date(a.snapshot_date).getTime()
      );

      setSnapshots(sortedSnapshots);

      if (sortedSnapshots.length > 0) {
        setSelectedSnapshot(sortedSnapshots[0]);
      }
    } catch (error) {
      console.error("Failed to load snapshots:", error);
      setSnapshots([]);
    }
  };

  const displayOverlay = (snapshot: VISnapshot) => {
    if (!mapRef.current || !field || !snapshot.overlay_data) return;

    const map = mapRef.current;

    // Remove existing overlay
    if (map.getSource("vi-overlay")) {
      map.removeLayer("vi-overlay-layer");
      map.removeSource("vi-overlay");
    }

    // Calculate bounds
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

    // Add image overlay
    map.addSource("vi-overlay", {
      type: "image",
      url: getImageUrl(snapshot.overlay_data),
      coordinates: [
        [minLng, maxLat], // top-left
        [maxLng, maxLat], // top-right
        [maxLng, minLat], // bottom-right
        [minLng, minLat], // bottom-left
      ],
    });

    map.addLayer({
      id: "vi-overlay-layer",
      type: "raster",
      source: "vi-overlay",
      paint: {
        "raster-opacity": 0.85,
      },
    });
  };

  const handleAnalyze = async () => {
    if (!fieldId) return;

    try {
      setIsAnalyzing(true);

      // Clear old snapshots
      try {
        await axios.delete(`/vi-analysis/snapshots/${fieldId}`, {
          params: { vi_type: selectedVI },
        });
      } catch (e) {
        console.warn("Failed to clear old snapshots");
      }

      // Fetch new analysis
      const response = await axios.post(
        `/vi-analysis/${fieldId}/analyze-historical`,
        null,
        {
          params: { vi_type: selectedVI, count: 4, clear_old: true },
        }
      );

      const data = response.data;

      // Reload snapshots
      await loadSnapshots();

      // Show result notification
      if (data.snapshots_created === 0) {
        await Swal.fire({
          title: "แจ้งเตือน",
          text: "ไม่สามารถดึงข้อมูลดาวเทียมได้ สาเหตุที่เป็นไปได้: ไม่มีข้อมูลดาวเทียมใสสำหรับพื้นที่นี้ หรือ Google Earth Engine ยังไม่ได้ตั้งค่า กรุณาลองใหม่อีกครั้ง",
          icon: "warning",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#16a34a",
          backdrop: true,
          allowOutsideClick: false,
        });
      } else {
        await Swal.fire({
          title: "สำเร็จ",
          text: `วิเคราะห์เสร็จสิ้น! ได้ข้อมูล ${selectedVI} จริงจากดาวเทียม: ${data.snapshots_created} ภาพ, ${data.unique_dates} วันที่แตกต่างกัน`,
          icon: "success",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#16a34a",
          backdrop: true,
          allowOutsideClick: false,
        });
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text:
          "การวิเคราะห์ไม่สำเร็จ: " +
          (error.response?.data?.detail || error.message),
        icon: "error",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#16a34a",
        backdrop: true,
        allowOutsideClick: false,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const getHealthDescription = (value: number): string => {
    if (value < 0.2) return "พืชมีความอ่อนแอหรือความหนาแน่นต่ำ";
    if (value < 0.4) return "พืชมีความสมบูรณ์หรือหนาแน่นปานกลาง";
    if (value < 0.6) return "พืชมีความสมบูรณ์หรือหนาแน่นปานกลาง";
    if (value < 0.8) return "พืชมีความสมบูรณ์ดี หนาแน่นสูง";
    return "พืชมีความสมบูรณ์ดีเยี่ยม หนาแน่นมาก";
  };

  const handleSnapshotSelect = (snapshot: VISnapshot, _index: number) => {
    setSelectedSnapshot(snapshot);
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
      style={{ background: "#f8fafc", zIndex: 9999 }}
    >
      {/* Header */}
      <header
        className="flex items-center px-4 py-3 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "white",
        }}
      >
        <button
          onClick={() => navigate(`/dris_project/field/${fieldId}`)}
          className="w-9 h-9 rounded-full flex items-center justify-center mr-3 transition-colors"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontSize: "17px", fontWeight: 600 }}>
          {t("health.title")}
        </h1>
      </header>

      {/* Map Section */}
      <div
        className="relative flex-shrink-0 z-0"
        style={{ height: "50vh", minHeight: "250px" }}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Always show Analyze Button on map */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg z-10"
          style={{
            background: isAnalyzing ? "#9ca3af" : "white",
            color: isAnalyzing ? "#6b7280" : "#16a34a",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          <RefreshCw
            className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`}
          />
          {isAnalyzing ? t("action.analyzing") : t("action.analyze")}
        </button>

        {/* Date Carousel - Always show if there are snapshots */}
        {snapshots.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 flex flex-col items-center z-10 transition-all duration-300 ${
              isCarouselExpanded ? "pb-0" : "pb-0"
            }`}
          >
            {/* Toggle Button */}
            <button
              onClick={() => setIsCarouselExpanded(!isCarouselExpanded)}
              className="bg-white/95 px-4 py-1.5 rounded-t-xl shadow-sm text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1 hover:bg-white"
              style={{ paddingBottom: "2px" }}
            >
              {isCarouselExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" /> {t("action.hide")}
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" /> {t("action.selectTime")}
                </>
              )}
            </button>

            {/* Carousel Content - Sliding Window (Show 3 items) */}
            {isCarouselExpanded && (
              <div
                className="w-full flex items-center justify-between px-2 py-3 gap-2"
                style={{ background: "rgba(255,255,255,0.95)" }}
              >
                {/* Prev Button */}
                <button
                  onClick={scrollPrev}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-all active:scale-95 bg-white text-gray-400 hover:text-green-600 border border-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Snapshot Cards Scroll Container */}
                <div
                  ref={scrollRef}
                  className="flex gap-2 overflow-x-auto flex-1 px-0.5 no-scrollbar scroll-smooth snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {snapshots.map((snapshot, index) => {
                    const isSelected = selectedSnapshot?.id === snapshot.id;
                    return (
                      <button
                        key={snapshot.id}
                        onClick={() => handleSnapshotSelect(snapshot, index)}
                        className="flex flex-col items-center p-1.5 rounded-lg transition-all flex-shrink-0 snap-start relative group"
                        style={{
                          width: "calc((100% - 0.5rem * 2) / 3)",
                          minWidth: "calc((100% - 16px) / 3)",
                          background: isSelected ? "#f0fdf4" : "white",
                          border: isSelected
                            ? "2px solid #16a34a"
                            : "1px solid #e5e7eb",
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="w-full aspect-[4/3] rounded mb-1.5 flex items-center justify-center overflow-hidden relative"
                          style={{
                            background: snapshot.overlay_data
                              ? "#dcfce7"
                              : "linear-gradient(135deg, #dcfce7, #86efac)",
                          }}
                        >
                          {snapshot.overlay_data ? (
                            <img
                              src={getImageUrl(snapshot.overlay_data)}
                              alt="overlay"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <span
                              style={{ fontSize: "10px", color: "#16a34a" }}
                            >
                              No overlay
                            </span>
                          )}

                          {/* Selected Indicator Badge */}
                          {isSelected && (
                            <div className="absolute top-0 right-0 p-0.5 bg-green-600 rounded-bl-md">
                              <Check className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>

                        <span
                          className="truncate w-full text-center"
                          style={{
                            fontSize: "10px",
                            color: isSelected ? "#16a34a" : "#374151",
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          {formatDate(snapshot.snapshot_date)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={scrollNext}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-all active:scale-95 bg-white text-gray-400 hover:text-green-600 border border-gray-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sheet - Rectangular and distinct section */}
      <div className="flex-1 bg-white overflow-y-auto relative z-10">
        {/* Handle (Optional - maybe remove if pure rectangular split is desired, but keeping centering line for now) */}
        <div className="flex justify-center pt-3 pb-2 bg-gray-50 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* VI Selector Card - Always visible */}
          <div
            className="rounded-2xl p-5 mb-5"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#dcfce7" }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: "#16a34a" }} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  เลือกดัชนีพืช
                </h4>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                  เลือกดัชนีที่ต้องการวิเคราะห์
                </p>
              </div>
            </div>

            {/* VI Selector */}
            <div className="mb-4">
              <label
                style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}
                className="mb-1.5 block"
              >
                ดัชนีพืช:
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full p-3 rounded-xl flex items-center justify-between outline-none transition-all hover:bg-gray-50 focus:ring-2 focus:ring-green-500/20"
                    style={{
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      background: "white",
                      color: "#1f2937",
                      textAlign: "left",
                    }}
                  >
                    <span className="truncate flex-1">
                      {viTypes.find((v) => v.code === selectedVI)?.name} -{" "}
                      {viTypes.find((v) => v.code === selectedVI)?.description}
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
                      onSelect={() => !isAnalyzing && setSelectedVI(vi.code)}
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

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl"
              style={{
                background: isAnalyzing
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: isAnalyzing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw
                className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`}
              />
              {isAnalyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์ข้อมูลดาวเทียม"}
            </button>
          </div>

          {selectedSnapshot ? (
            <>
              {/* Average Value Section */}
              <div className="mb-6">
                <h3
                  className="text-center mb-4"
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  ค่าเฉลี่ยระดับความสมบูรณ์พืช
                </h3>

                {/* Gauge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#ef4444",
                      fontWeight: 500,
                    }}
                  >
                    น้อย
                  </span>
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    {selectedSnapshot.mean_value.toFixed(3)}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#16a34a",
                      fontWeight: 500,
                    }}
                  >
                    มาก
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  className="h-3 rounded-full overflow-hidden relative"
                  style={{
                    background:
                      "linear-gradient(to right, #ef4444, #f59e0b, #eab308, #84cc16, #22c55e)",
                  }}
                >
                  {/* Indicator */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{
                      left: `${Math.min(
                        selectedSnapshot.mean_value * 100,
                        100
                      )}%`,
                      background: "#374151",
                      marginLeft: "-8px",
                    }}
                  />
                </div>

                {/* Status Message */}
                <div
                  className="mt-4 p-4 rounded-xl text-center"
                  style={{ background: "#dcfce7" }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#15803d",
                      fontWeight: 500,
                    }}
                  >
                    {getHealthDescription(selectedSnapshot.mean_value)}
                  </p>
                </div>
              </div>

              {/* Chart Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    แนวโน้มค่า {selectedVI}
                  </h4>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                    style={{
                      background: isAnalyzing ? "#f3f4f6" : "#16a34a",
                      color: isAnalyzing ? "#6b7280" : "white",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`}
                    />
                    อัปเดต
                  </button>
                </div>

                {/* Chart */}
                {snapshots.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ background: "#f9fafb", padding: "12px" }}
                  >
                    <TimeSeriesChart
                      data={snapshots
                        .map((s) => ({
                          date: formatDate(s.snapshot_date),
                          value: s.mean_value,
                        }))
                        .reverse()}
                      viType={selectedVI}
                      height="200px"
                      showLegend={false}
                      isMobile={true}
                    />
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5"
                      style={{ background: "#16A34A", borderStyle: "dashed" }}
                    />
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      วันที่เลือกให้แสดงข้อมูล
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: "#16A34A" }}
                    />
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      วันที่มีข้อมูลล่าสุด
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#f3f4f6" }}
              >
                <span style={{ fontSize: "40px" }}>🌱</span>
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                ยังไม่มีข้อมูลการวิเคราะห์
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              >
                กดปุ่มวิเคราะห์เพื่อดึงข้อมูลดาวเทียม
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 rounded-full shadow-md"
                style={{
                  background: isAnalyzing
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`}
                />
                {isAnalyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์ข้อมูลดาวเทียม"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
