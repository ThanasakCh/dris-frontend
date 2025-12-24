import { useState, useRef } from "react";
import {
  LineChart,
  X,
  Activity,
  CalendarRange,
  CalendarDays,
  TrendingUp,
  BarChart2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import axios from "../../../config/axios";
import { useIsMobile } from "../../../hooks/useResponsive";
import { useField } from "../../../contexts/FieldContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { TimeSeriesChart, TimeSeriesChartRef } from "../../../shared/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeSeriesData {
  date: string;
  value: number;
}

interface AnalysisPopupProps {
  fieldId?: string;
  fieldName?: string;
}

const viTypes = [
  { code: "NDVI", name: "NDVI" },
  { code: "EVI", name: "EVI" },
  { code: "GNDVI", name: "GNDVI" },
  { code: "NDWI", name: "NDWI" },
  { code: "SAVI", name: "SAVI" },
  { code: "VCI", name: "VCI" },
];

export default function AnalysisPopup({
  fieldId: propFieldId,
  fieldName: propFieldName,
}: AnalysisPopupProps) {
  const { fields } = useField();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(
    propFieldId
  );
  const [selectedVI, setSelectedVI] = useState("NDVI");
  const [analysisType, setAnalysisType] = useState<
    "monthly_range" | "full_year" | "ten_year_avg"
  >("monthly_range");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chartRef = useRef<TimeSeriesChartRef>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  const isMobile = useIsMobile();

  // Use prop fieldId if provided, otherwise use local selection
  const fieldId = propFieldId || selectedFieldId;
  const selectedField = fields.find((f) => f.id === fieldId);
  const fieldName = propFieldName || selectedField?.name;

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 9;
    return Array.from({ length: 10 }, (_, i) => startYear + i).reverse();
  };

  const monthKeys = [
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

  const getAnalysisDescription = (): string => {
    switch (analysisType) {
      case "monthly_range":
        const start = t(monthKeys[startMonth - 1] || "");
        const end = t(monthKeys[endMonth - 1] || "");
        return `${t("analysis.monthRange")} ${start} - ${end} ${selectedYear}`;
      case "full_year":
        return `${t("analysis.fullYear")} ${selectedYear}`;
      case "ten_year_avg":
        return t("analysis.tenYearAvg");
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
        return {
          date: date.toLocaleDateString("th-TH", { month: "short" }),
          value,
        };
      });
    }
  };

  const analyzeFieldVI = async () => {
    if (!fieldId) return;

    try {
      setIsAnalyzing(true);
      // Clear old data before starting new analysis
      setTimeSeriesData([]);

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
      } else {
        setTimeSeriesData([]);
      }
    } catch (error: any) {
      console.error("Failed to analyze field VI:", error);
      setTimeSeriesData([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadChartImage = () => {
    chartRef.current?.downloadImage(
      `${fieldName || "field"}_${selectedVI}_${analysisType}.png`
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
    link.download = `${fieldName || "field"}_${selectedVI}_${analysisType}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Responsive sizes
  const sizes = isMobile
    ? { popup: { width: "280px" }, fontSize: { label: "11px", value: "12px" } }
    : { popup: { width: "360px" }, fontSize: { label: "12px", value: "13px" } };

  return (
    <>
      {/* Analysis Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: isOpen
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(10px)",
          border: isOpen ? "2px solid rgb(59, 130, 246)" : "none",
          boxShadow: isOpen
            ? "rgba(59, 130, 246, 0.4) 0px 0px 0px 3px"
            : "rgba(0, 0, 0, 0.15) 0px 4px 15px",
        }}
        title={t("action.analyze")}
      >
        <LineChart
          className="w-[18px] h-[18px]"
          style={{ color: isOpen ? "rgb(59, 130, 246)" : "rgb(51, 51, 51)" }}
        />
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
            className="absolute left-13 top-0 z-40 rounded-xl overflow-hidden"
            style={{
              width: sizes.popup.width,
              maxHeight: "85vh",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 20px",
            }}
          >
            {/* Header */}
            <div
              className="flex justify-between items-center p-4"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
              }}
            >
              <h4
                className="m-0 flex items-center gap-2"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                <BarChart2 className="w-5 h-5" />
                {t("analysis.analyzeTrend")}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div
              className="p-4"
              style={{ overflowY: "auto", maxHeight: "calc(85vh - 60px)" }}
            >
              {/* Field Selector */}
              <div className="mb-3">
                <label
                  style={{
                    fontSize: sizes.fontSize.label,
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  {t("field.select")}
                </label>
                <Select
                  value={fieldId || ""}
                  onValueChange={(value) =>
                    setSelectedFieldId(value || undefined)
                  }
                >
                  <SelectTrigger className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                    <SelectValue placeholder={`-- ${t("field.select")} --`} />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!fieldId ? (
                <div className="text-center py-4" style={{ color: "#6b7280" }}>
                  <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p style={{ fontSize: "13px" }}>
                    {t("health.selectFromDropdown")}
                  </p>
                </div>
              ) : (
                <>
                  {/* VI Type Selector */}
                  <div className="mb-3">
                    <label
                      style={{
                        fontSize: sizes.fontSize.label,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {t("analysis.viIndex")}
                    </label>
                    <Select
                      value={selectedVI}
                      onValueChange={(value) => setSelectedVI(value)}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                        <SelectValue placeholder="NDVI" />
                      </SelectTrigger>
                      <SelectContent>
                        {viTypes.map((vi) => (
                          <SelectItem key={vi.code} value={vi.code}>
                            {vi.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Analysis Type Selection */}
                  <div className="mb-3">
                    <label
                      style={{
                        fontSize: sizes.fontSize.label,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {t("analysis.type")}
                    </label>
                    <div className="flex flex-col gap-2 mt-1">
                      <button
                        onClick={() => setAnalysisType("monthly_range")}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 p-2 rounded-lg transition-all"
                        style={{
                          background:
                            analysisType === "monthly_range"
                              ? "#dbeafe"
                              : "#f9fafb",
                          border:
                            analysisType === "monthly_range"
                              ? "1px solid #3b82f6"
                              : "1px solid #e5e7eb",
                          fontSize: sizes.fontSize.value,
                          cursor: isAnalyzing ? "not-allowed" : "pointer",
                        }}
                      >
                        <CalendarRange
                          className="w-4 h-4"
                          style={{ color: "#3b82f6" }}
                        />
                        {t("analysis.monthRange")}
                      </button>
                      <button
                        onClick={() => setAnalysisType("full_year")}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 p-2 rounded-lg transition-all"
                        style={{
                          background:
                            analysisType === "full_year"
                              ? "#dbeafe"
                              : "#f9fafb",
                          border:
                            analysisType === "full_year"
                              ? "1px solid #3b82f6"
                              : "1px solid #e5e7eb",
                          fontSize: sizes.fontSize.value,
                          cursor: isAnalyzing ? "not-allowed" : "pointer",
                        }}
                      >
                        <CalendarDays
                          className="w-4 h-4"
                          style={{ color: "#3b82f6" }}
                        />
                        {t("analysis.fullYear")}
                      </button>
                      <button
                        onClick={() => setAnalysisType("ten_year_avg")}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 p-2 rounded-lg transition-all"
                        style={{
                          background:
                            analysisType === "ten_year_avg"
                              ? "#dbeafe"
                              : "#f9fafb",
                          border:
                            analysisType === "ten_year_avg"
                              ? "1px solid #3b82f6"
                              : "1px solid #e5e7eb",
                          fontSize: sizes.fontSize.value,
                          cursor: isAnalyzing ? "not-allowed" : "pointer",
                        }}
                      >
                        <TrendingUp
                          className="w-4 h-4"
                          style={{ color: "#3b82f6" }}
                        />
                        {t("analysis.tenYearAvg")}
                      </button>
                    </div>
                  </div>

                  {/* Date Range Selectors */}
                  {analysisType !== "ten_year_avg" && (
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label
                            style={{
                              fontSize: sizes.fontSize.label,
                              color: "#6b7280",
                              fontWeight: 500,
                            }}
                          >
                            {t("analysis.yearLabel")}
                          </label>
                          <Select
                            value={String(selectedYear)}
                            onValueChange={(value) =>
                              setSelectedYear(Number(value))
                            }
                            disabled={isAnalyzing}
                          >
                            <SelectTrigger className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white">
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
                        {analysisType === "monthly_range" && (
                          <>
                            <div className="flex-1">
                              <label
                                style={{
                                  fontSize: sizes.fontSize.label,
                                  color: "#6b7280",
                                  fontWeight: 500,
                                }}
                              >
                                {t("analysis.startMonth")}
                              </label>
                              <Select
                                value={String(startMonth)}
                                onValueChange={(value) =>
                                  setStartMonth(Number(value))
                                }
                                disabled={isAnalyzing}
                              >
                                <SelectTrigger className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                                  <SelectValue placeholder={t(monthKeys[0])} />
                                </SelectTrigger>
                                <SelectContent>
                                  {monthKeys.map((key, idx) => (
                                    <SelectItem
                                      key={idx}
                                      value={String(idx + 1)}
                                    >
                                      {t(key)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <label
                                style={{
                                  fontSize: sizes.fontSize.label,
                                  color: "#6b7280",
                                  fontWeight: 500,
                                }}
                              >
                                {t("analysis.endMonth")}
                              </label>
                              <Select
                                value={String(endMonth)}
                                onValueChange={(value) =>
                                  setEndMonth(Number(value))
                                }
                                disabled={isAnalyzing}
                              >
                                <SelectTrigger className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                                  <SelectValue placeholder={t(monthKeys[0])} />
                                </SelectTrigger>
                                <SelectContent>
                                  {monthKeys.map((key, idx) => (
                                    <SelectItem
                                      key={idx}
                                      value={String(idx + 1)}
                                    >
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
                    className="w-full flex items-center justify-center gap-2 rounded-lg mb-3"
                    style={{
                      padding: "12px",
                      background: isAnalyzing
                        ? "#9ca3af"
                        : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      border: "none",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: isAnalyzing ? "not-allowed" : "pointer",
                    }}
                  >
                    <Activity
                      className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`}
                    />
                    {isAnalyzing ? t("action.analyzing") : t("action.analyze")}
                  </button>

                  {/* Chart Result */}
                  {timeSeriesData.length > 0 && (
                    <div className="mb-3">
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: "1px solid #e5e7eb" }}
                      >
                        <TimeSeriesChart
                          ref={chartRef}
                          data={timeSeriesData}
                          viType={selectedVI}
                          height="200px"
                          showLegend={true}
                          title={`${selectedVI} - ${getAnalysisDescription()}`}
                          isMobile={isMobile}
                        />
                      </div>

                      {/* Download Buttons */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={downloadChartImage}
                          className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg transition-all"
                          style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            fontSize: sizes.fontSize.value,
                            cursor: "pointer",
                          }}
                        >
                          <ImageIcon
                            className="w-4 h-4"
                            style={{ color: "#6b7280" }}
                          />
                          {t("action.image")}
                        </button>
                        <button
                          onClick={downloadCSV}
                          className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg transition-all"
                          style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            fontSize: sizes.fontSize.value,
                            cursor: "pointer",
                          }}
                        >
                          <FileText
                            className="w-4 h-4"
                            style={{ color: "#6b7280" }}
                          />
                          CSV
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Data Summary */}
                  {timeSeriesData.length > 0 && (
                    <div
                      className="rounded-lg p-3"
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        className="flex items-center gap-2 mb-2"
                        style={{
                          fontSize: sizes.fontSize.label,
                          color: "#166534",
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span style={{ fontWeight: 600 }}>
                          {t("analysis.results")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: sizes.fontSize.value,
                          color: "#166534",
                        }}
                      >
                        <p className="m-0">
                          {t("analysis.foundData")} {timeSeriesData.length}{" "}
                          {t("analysis.dataPoints")}
                        </p>
                        <p className="m-0">
                          {t("analysis.average")}:{" "}
                          {(
                            timeSeriesData.reduce(
                              (sum, d) => sum + d.value,
                              0
                            ) / timeSeriesData.length
                          ).toFixed(3)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
