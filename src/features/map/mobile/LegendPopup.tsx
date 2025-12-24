import { useState } from "react";
import { Info, X, ChevronLeft, ChevronRight, Thermometer } from "lucide-react";
import { useIsMobile } from "../../../hooks/useResponsive";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ScaleRange {
  min: number;
  max: number;
  labelKey: string;
  color: string;
}

interface VILegend {
  code: string;
  name: string;
  fullName: string;
  ranges: ScaleRange[];
}

const getViLegends = (): VILegend[] => [
  {
    code: "NDVI",
    name: "NDVI",
    fullName: "Normalized Difference Vegetation Index",
    ranges: [
      { min: -1, max: 0, labelKey: "legend.waterBuilding", color: "#ef4444" },
      { min: 0, max: 0.2, labelKey: "legend.bareSoil", color: "#f97316" },
      {
        min: 0.2,
        max: 0.5,
        labelKey: "legend.lowVegetation",
        color: "#facc15",
      },
      {
        min: 0.5,
        max: 1,
        labelKey: "legend.healthyVegetation",
        color: "#22c55e",
      },
    ],
  },
  {
    code: "EVI",
    name: "EVI",
    fullName: "Enhanced Vegetation Index",
    ranges: [
      { min: -1, max: 0.1, labelKey: "legend.soilWater", color: "#ef4444" },
      { min: 0.1, max: 0.3, labelKey: "legend.startGrowing", color: "#facc15" },
      { min: 0.3, max: 1, labelKey: "legend.veryHealthy", color: "#22c55e" },
    ],
  },
  {
    code: "GNDVI",
    name: "GNDVI",
    fullName: "Green NDVI",
    ranges: [
      { min: -1, max: 0.3, labelKey: "legend.stressed", color: "#ef4444" },
      { min: 0.3, max: 0.5, labelKey: "legend.normal", color: "#facc15" },
      {
        min: 0.5,
        max: 1,
        labelKey: "legend.highChlorophyll",
        color: "#22c55e",
      },
    ],
  },
  {
    code: "NDWI",
    name: "NDWI",
    fullName: "Normalized Difference Water Index",
    ranges: [
      { min: -1, max: -0.3, labelKey: "legend.drought", color: "#ef4444" },
      { min: -0.3, max: 0, labelKey: "legend.lowMoisture", color: "#facc15" },
      { min: 0, max: 1, labelKey: "legend.moist", color: "#3b82f6" },
    ],
  },
  {
    code: "SAVI",
    name: "SAVI",
    fullName: "Soil Adjusted Vegetation Index",
    ranges: [
      { min: -1, max: 0.2, labelKey: "legend.soil", color: "#ef4444" },
      { min: 0.2, max: 0.4, labelKey: "legend.lowCoverage", color: "#facc15" },
      { min: 0.4, max: 1, labelKey: "legend.highCoverage", color: "#22c55e" },
    ],
  },
  {
    code: "VCI",
    name: "VCI",
    fullName: "Vegetation Condition Index",
    ranges: [
      { min: 0, max: 40, labelKey: "legend.severeDrought", color: "#ef4444" },
      { min: 40, max: 60, labelKey: "legend.normal", color: "#facc15" },
      { min: 60, max: 100, labelKey: "legend.good", color: "#22c55e" },
    ],
  },
];

export default function LegendPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const viLegends = getViLegends();

  const currentVI = viLegends[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? viLegends.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === viLegends.length - 1 ? 0 : prev + 1));
  };

  // Responsive sizes
  const sizes = isMobile
    ? {
        popup: {
          width: "200px",
          left: "56px",
          top: "148px",
          borderRadius: "12px",
        },
        headerPadding: "px-3 py-2",
        headerGap: "gap-1",
        headerIconSize: "w-3 h-3",
        headerFontSize: "11px",
        closeBtn: { width: "20px", height: "20px" },
        closeBtnIcon: "w-3 h-3",
        navPadding: "px-2 py-1.5",
        navBtnSize: { width: "22px", height: "22px" },
        navIconSize: "w-3 h-3",
        viCodeSize: "12px",
        paginationSize: "9px",
        contentPadding: "px-3 py-2",
        colorBox: { width: "18px", height: "12px", borderRadius: "3px" },
        labelSize: "11px",
        gapItems: "gap-1",
        gapContent: "gap-2",
        dotSize: { active: "12px", inactive: "5px", height: "5px" },
        dotGap: "gap-1",
        dotMargin: "mt-2",
        showFullName: false,
      }
    : {
        popup: {
          width: "280px",
          left: "60px",
          top: "150px",
          borderRadius: "16px",
        },
        headerPadding: "px-4 py-3",
        headerGap: "gap-2",
        headerIconSize: "w-4 h-4",
        headerFontSize: "14px",
        closeBtn: { width: "24px", height: "24px" },
        closeBtnIcon: "w-4 h-4",
        navPadding: "px-4 py-3",
        navBtnSize: { width: "28px", height: "28px" },
        navIconSize: "w-4 h-4",
        viCodeSize: "14px",
        paginationSize: "11px",
        contentPadding: "px-4 py-3",
        colorBox: { width: "24px", height: "16px", borderRadius: "4px" },
        labelSize: "13px",
        gapItems: "gap-2",
        gapContent: "gap-3",
        dotSize: { active: "16px", inactive: "6px", height: "6px" },
        dotGap: "gap-1.5",
        dotMargin: "mt-4",
        showFullName: true,
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
        title={t("legend.indexInfo")}
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
              left: sizes.popup.left,
              top: sizes.popup.top,
              width: sizes.popup.width,
              borderRadius: sizes.popup.borderRadius,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 20px",
            }}
          >
            {/* Header */}
            <div
              className={`flex justify-between items-center ${sizes.headerPadding}`}
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className={`flex items-center ${sizes.headerGap}`}>
                <Info
                  className={sizes.headerIconSize}
                  style={{ color: "rgb(107, 114, 128)" }}
                />
                <span
                  style={{
                    fontSize: sizes.headerFontSize,
                    fontWeight: 600,
                    color: "rgb(51, 51, 51)",
                  }}
                >
                  {t("legend.title")}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                style={sizes.closeBtn}
              >
                <X
                  className={sizes.closeBtnIcon}
                  style={{ color: "rgb(107, 114, 128)" }}
                />
              </button>
            </div>

            {/* Navigation Header */}
            <div
              className={`flex justify-between items-center ${sizes.navPadding}`}
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                background: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <button
                onClick={handlePrev}
                className="flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full transition-colors"
                style={{
                  ...sizes.navBtnSize,
                  background: "rgba(0, 0, 0, 0.05)",
                }}
              >
                <ChevronLeft
                  className={sizes.navIconSize}
                  style={{ color: "rgb(51, 51, 51)" }}
                />
              </button>

              <div className={`flex items-center ${sizes.headerGap}`}>
                <Thermometer
                  className={sizes.navIconSize}
                  style={{ color: "#ef4444" }}
                />
                <span
                  style={{
                    fontSize: sizes.viCodeSize,
                    fontWeight: 700,
                    color: "rgb(51, 51, 51)",
                  }}
                >
                  {currentVI.code}
                </span>
                <span
                  style={{
                    fontSize: sizes.paginationSize,
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
                  ...sizes.navBtnSize,
                  background: "rgba(0, 0, 0, 0.05)",
                }}
              >
                <ChevronRight
                  className={sizes.navIconSize}
                  style={{ color: "rgb(51, 51, 51)" }}
                />
              </button>
            </div>

            {/* Legend Content */}
            <div className={sizes.contentPadding}>
              {/* Full Name - Only on Desktop */}
              {sizes.showFullName && (
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
              )}

              {/* Scale Items */}
              <div className={`flex flex-col ${sizes.gapItems}`}>
                {currentVI.ranges.map((range, index) => (
                  <div
                    key={index}
                    className={`flex items-center ${sizes.gapContent}`}
                  >
                    <div
                      style={{
                        width: sizes.colorBox.width,
                        height: sizes.colorBox.height,
                        borderRadius: sizes.colorBox.borderRadius,
                        background: range.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: sizes.labelSize,
                        color: "rgb(51, 51, 51)",
                      }}
                    >
                      {t(range.labelKey)} ({range.min} - {range.max})
                    </span>
                  </div>
                ))}
              </div>

              {/* Index Dots */}
              <div
                className={`flex justify-center ${sizes.dotGap} ${sizes.dotMargin}`}
              >
                {viLegends.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      width:
                        index === currentIndex
                          ? sizes.dotSize.active
                          : sizes.dotSize.inactive,
                      height: sizes.dotSize.height,
                      borderRadius: `calc(${sizes.dotSize.height} / 2)`,
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
