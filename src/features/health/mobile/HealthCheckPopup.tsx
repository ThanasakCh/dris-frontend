import { useState, useEffect } from "react";
import { Sliders, X, Activity, RefreshCw, TrendingUp } from "lucide-react";
import axios from "../../../config/axios";
import { useField } from "../../../contexts/FieldContext";
import { getImageUrl } from "../../../config/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface OverlayData {
  imageUrl: string;
  bounds: [[number, number], [number, number]];
  fieldId: string;
}

interface HealthPopupProps {
  fieldId?: string;
  onSnapshotSelect?: (snapshot: VISnapshot) => void;
  onOverlayChange?: (overlay: OverlayData | null) => void;
}

const viTypes = [
  { code: "NDVI", name: "NDVI", color: "#4CAF50", labelKey: "vi.ndvi" },
  { code: "EVI", name: "EVI", color: "#8BC34A", labelKey: "vi.evi" },
  { code: "GNDVI", name: "GNDVI", color: "#CDDC39", labelKey: "vi.gndvi" },
  { code: "NDWI", name: "NDWI", color: "#2196F3", labelKey: "vi.ndwi" },
  { code: "SAVI", name: "SAVI", color: "#FF9800", labelKey: "vi.savi" },
  { code: "VCI", name: "VCI", color: "#9C27B0", labelKey: "vi.vci" },
];

export default function HealthPopup({
  fieldId: propFieldId,
  onSnapshotSelect,
  onOverlayChange,
}: HealthPopupProps) {
  const { fields } = useField();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(
    propFieldId
  );
  const [selectedVI, setSelectedVI] = useState("NDVI");
  const [snapshots, setSnapshots] = useState<VISnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestSnapshot, setLatestSnapshot] = useState<VISnapshot | null>(null);

  // Use prop fieldId if provided, otherwise use local selection
  const fieldId = propFieldId || selectedFieldId;

  useEffect(() => {
    if (isOpen && fieldId) {
      loadSnapshots();
    }
  }, [isOpen, fieldId, selectedVI]);

  const loadSnapshots = async () => {
    if (!fieldId) return;

    try {
      setIsLoading(true);
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
        setLatestSnapshot(sortedSnapshots[0]);
      }
    } catch (error) {
      console.error("Failed to load snapshots:", error);
      setSnapshots([]);
    } finally {
      setIsLoading(false);
    }
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
      await axios.post(`/vi-analysis/${fieldId}/analyze-historical`, null, {
        params: { vi_type: selectedVI, count: 4, clear_old: true },
      });

      await loadSnapshots();
    } catch (error: any) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getHealthStatus = (value: number) => {
    const percentage = value * 100;
    if (percentage < 30)
      return {
        status: t("health.status.low"),
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.1)",
      };
    if (percentage < 60)
      return {
        status: t("health.status.moderate"),
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.1)",
      };
    if (percentage < 80)
      return {
        status: t("health.status.high"),
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.1)",
      };
    return {
      status: t("health.status.excellent"),
      color: "#059669",
      bg: "rgba(5, 150, 105, 0.1)",
    };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const handleSnapshotClick = (snapshot: VISnapshot) => {
    setLatestSnapshot(snapshot);
    if (onSnapshotSelect) {
      onSnapshotSelect(snapshot);
    }

    // Send overlay data to map
    if (onOverlayChange && snapshot.overlay_data) {
      const selectedField = fields.find((f) => f.id === fieldId);
      if (selectedField && selectedField.geometry) {
        // Calculate bounds from field geometry
        const coords = selectedField.geometry.coordinates[0] as [
          number,
          number
        ][];
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

        onOverlayChange({
          imageUrl: getImageUrl(snapshot.overlay_data),
          bounds: [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          fieldId: fieldId!,
        });
      }
    }
  };

  return (
    <>
      {/* Health Monitor Icon Button */}
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
        title={t("health.tracking")}
      >
        <div
          style={{ color: isOpen ? "rgb(59, 130, 246)" : "rgb(51, 51, 51)" }}
        >
          <Sliders className="w-[18px] h-[18px]" />
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
            className="absolute left-13 top-0 z-40 rounded-xl overflow-hidden"
            style={{
              width: "320px",
              maxHeight: "80vh",
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
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
              }}
            >
              <h4
                className="m-0 flex items-center gap-2"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                <Activity className="w-5 h-5" />
                {t("health.tracking")}
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
              style={{ overflowY: "auto", maxHeight: "calc(80vh - 60px)" }}
            >
              {/* Field Selector */}
              <div className="mb-4">
                <label
                  style={{
                    fontSize: "12px",
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
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p style={{ fontSize: "13px" }}>
                    {t("health.selectFromDropdown")}
                  </p>
                </div>
              ) : (
                <>
                  {/* VI Type Selector */}
                  <div className="mb-4">
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {t("vi.index")}
                    </label>
                    <Select
                      value={selectedVI}
                      onValueChange={(value) => setSelectedVI(value)}
                    >
                      <SelectTrigger className="w-full mt-1 h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                        <SelectValue placeholder="NDVI" />
                      </SelectTrigger>
                      <SelectContent>
                        {viTypes.map((vi) => (
                          <SelectItem key={vi.code} value={vi.code}>
                            {vi.name} - {t(vi.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 rounded-lg mb-4"
                    style={{
                      padding: "12px",
                      background: isAnalyzing
                        ? "#9ca3af"
                        : "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: isAnalyzing ? "not-allowed" : "pointer",
                    }}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`}
                    />
                    {isAnalyzing
                      ? t("action.analyzing")
                      : t("health.analyzeSatellite")}
                  </button>

                  {/* Current Status */}
                  {latestSnapshot && (
                    <div
                      className="rounded-xl p-4 mb-4"
                      style={{
                        background: getHealthStatus(latestSnapshot.mean_value)
                          .bg,
                        border: `1px solid ${
                          getHealthStatus(latestSnapshot.mean_value).color
                        }20`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            fontWeight: 500,
                          }}
                        >
                          {t("health.currentStatus")}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: getHealthStatus(latestSnapshot.mean_value)
                              .color,
                          }}
                        >
                          {getHealthStatus(latestSnapshot.mean_value).status}
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span
                          style={{
                            fontSize: "32px",
                            fontWeight: 700,
                            color: getHealthStatus(latestSnapshot.mean_value)
                              .color,
                            lineHeight: 1,
                          }}
                        >
                          {(latestSnapshot.mean_value * 100).toFixed(0)}%
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          {selectedVI}
                        </span>
                      </div>

                      <div
                        className="mt-2 h-2 rounded-full overflow-hidden"
                        style={{ background: "#e5e7eb" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              latestSnapshot.mean_value * 100,
                              100
                            )}%`,
                            background: getHealthStatus(
                              latestSnapshot.mean_value
                            ).color,
                          }}
                        />
                      </div>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginTop: "8px",
                        }}
                      >
                        {t("health.updated")}:{" "}
                        {formatDate(latestSnapshot.snapshot_date)}
                      </p>
                    </div>
                  )}

                  {/* Snapshots History */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: "#6b7280" }}
                      />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        {t("health.history")} ({snapshots.length})
                      </span>
                    </div>

                    {isLoading ? (
                      <div
                        className="text-center py-4"
                        style={{ color: "#9ca3af" }}
                      >
                        {t("loading.message")}
                      </div>
                    ) : snapshots.length === 0 ? (
                      <div
                        className="text-center py-4 rounded-lg"
                        style={{
                          background: "#f3f4f6",
                          color: "#9ca3af",
                          fontSize: "13px",
                        }}
                      >
                        {t("health.noDataYet")}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {snapshots.map((snapshot) => (
                          <button
                            key={snapshot.id}
                            onClick={() => handleSnapshotClick(snapshot)}
                            className="flex items-center justify-between p-3 rounded-lg transition-all"
                            style={{
                              background:
                                latestSnapshot?.id === snapshot.id
                                  ? "#dbeafe"
                                  : "#f9fafb",
                              border:
                                latestSnapshot?.id === snapshot.id
                                  ? "1px solid #3b82f6"
                                  : "1px solid #e5e7eb",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{ fontSize: "12px", color: "#374151" }}
                            >
                              {formatDate(snapshot.snapshot_date)}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: getHealthStatus(snapshot.mean_value)
                                  .color,
                              }}
                            >
                              {(snapshot.mean_value * 100).toFixed(0)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
