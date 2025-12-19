import { useState } from "react";
import { Info, X, ChevronLeft, ChevronRight, Thermometer } from "lucide-react";

interface ScaleRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

interface VILegend {
  code: string;
  name: string;
  fullName: string;
  ranges: ScaleRange[];
}

const viLegends: VILegend[] = [
  {
    code: "NDVI",
    name: "NDVI",
    fullName: "Normalized Difference Vegetation Index",
    ranges: [
      { min: -1, max: 0, label: "น้ำ / สิ่งปลูกสร้าง", color: "#ef4444" },
      { min: 0, max: 0.2, label: "ดินว่างเปล่า", color: "#f97316" },
      { min: 0.2, max: 0.5, label: "พืชพรรณน้อย", color: "#facc15" },
      { min: 0.5, max: 1, label: "พืชสมบูรณ์", color: "#22c55e" },
    ],
  },
  {
    code: "EVI",
    name: "EVI",
    fullName: "Enhanced Vegetation Index",
    ranges: [
      { min: -1, max: 0.1, label: "ดิน / น้ำ", color: "#ef4444" },
      { min: 0.1, max: 0.3, label: "เริ่มเติบโต", color: "#facc15" },
      { min: 0.3, max: 1, label: "สมบูรณ์มาก", color: "#22c55e" },
    ],
  },
  {
    code: "GNDVI",
    name: "GNDVI",
    fullName: "Green NDVI",
    ranges: [
      { min: -1, max: 0.3, label: "เครียด / ขาดน้ำ", color: "#ef4444" },
      { min: 0.3, max: 0.5, label: "ปกติ", color: "#facc15" },
      {
        min: 0.5,
        max: 1,
        label: "สมบูรณ์ (Chlorophyll สูง)",
        color: "#22c55e",
      },
    ],
  },
  {
    code: "NDWI",
    name: "NDWI",
    fullName: "Normalized Difference Water Index",
    ranges: [
      { min: -1, max: -0.3, label: "แห้งแล้ง", color: "#ef4444" },
      { min: -0.3, max: 0, label: "ความชื้นต่ำ", color: "#facc15" },
      { min: 0, max: 1, label: "ชุ่มชื้น / น้ำ", color: "#3b82f6" },
    ],
  },
  {
    code: "SAVI",
    name: "SAVI",
    fullName: "Soil Adjusted Vegetation Index",
    ranges: [
      { min: -1, max: 0.2, label: "ดิน", color: "#ef4444" },
      { min: 0.2, max: 0.4, label: "พืชปกคลุมน้อย", color: "#facc15" },
      { min: 0.4, max: 1, label: "พืชปกคลุมหนาแน่น", color: "#22c55e" },
    ],
  },
  {
    code: "VCI",
    name: "VCI",
    fullName: "Vegetation Condition Index",
    ranges: [
      { min: 0, max: 40, label: "ภัยแล้งรุนแรง", color: "#ef4444" },
      { min: 40, max: 60, label: "ปกติ", color: "#facc15" },
      { min: 60, max: 100, label: "สมบูรณ์ดี", color: "#22c55e" },
    ],
  },
];

export default function DesktopLegendPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentVI = viLegends[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? viLegends.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === viLegends.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Info Icon Button */}
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
          boxShadow: isOpen
            ? "rgba(59, 130, 246, 0.4) 0px 0px 0px 3px"
            : "rgba(0, 0, 0, 0.15) 0px 4px 15px",
          border: isOpen ? "2px solid rgb(59, 130, 246)" : "none",
        }}
        title="ข้อมูลดัชนี"
      >
        <Info
          className="w-[18px] h-[18px]"
          style={{ color: isOpen ? "rgb(59, 130, 246)" : "rgb(51, 51, 51)" }}
        />
      </button>

      {/* Legend Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup */}
          <div
            className="fixed z-50"
            style={{
              left: "60px",
              top: "150px",
              width: "280px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 20px",
            }}
          >
            {/* Header */}
            <div
              className="flex justify-between items-center px-4 py-3"
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="flex items-center gap-2">
                <Info
                  className="w-4 h-4"
                  style={{ color: "rgb(107, 114, 128)" }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "rgb(51, 51, 51)",
                  }}
                >
                  Legend
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                style={{ width: "24px", height: "24px" }}
              >
                <X
                  className="w-4 h-4"
                  style={{ color: "rgb(107, 114, 128)" }}
                />
              </button>
            </div>

            {/* Navigation Header */}
            <div
              className="flex justify-between items-center px-4 py-3"
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                background: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <button
                onClick={handlePrev}
                className="flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full transition-colors"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "rgba(0, 0, 0, 0.05)",
                }}
              >
                <ChevronLeft
                  className="w-4 h-4"
                  style={{ color: "rgb(51, 51, 51)" }}
                />
              </button>

              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" style={{ color: "#ef4444" }} />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "rgb(51, 51, 51)",
                  }}
                >
                  {currentVI.code}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgb(107, 114, 128)",
                  }}
                >
                  ({currentIndex + 1}/{viLegends.length})
                </span>
              </div>

              <button
                onClick={handleNext}
                className="flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full transition-colors"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "rgba(0, 0, 0, 0.05)",
                }}
              >
                <ChevronRight
                  className="w-4 h-4"
                  style={{ color: "rgb(51, 51, 51)" }}
                />
              </button>
            </div>

            {/* Legend Content */}
            <div className="px-4 py-3">
              {/* Full Name */}
              <p
                style={{
                  fontSize: "11px",
                  color: "rgb(107, 114, 128)",
                  marginBottom: "12px",
                  fontStyle: "italic",
                }}
              >
                {currentVI.fullName}
              </p>

              {/* Scale Items */}
              <div className="flex flex-col gap-2">
                {currentVI.ranges.map((range, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      style={{
                        width: "24px",
                        height: "16px",
                        borderRadius: "4px",
                        background: range.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "rgb(51, 51, 51)",
                      }}
                    >
                      {range.label} ({range.min} - {range.max})
                    </span>
                  </div>
                ))}
              </div>

              {/* Index Dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {viLegends.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      width: index === currentIndex ? "16px" : "6px",
                      height: "6px",
                      borderRadius: "3px",
                      background:
                        index === currentIndex
                          ? "rgb(59, 130, 246)"
                          : "rgba(0, 0, 0, 0.2)",
                      border: "none",
                    }}
                    title={viLegends[index].code}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
