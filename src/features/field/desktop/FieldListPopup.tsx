import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
  ArrowUpDown,
  Edit3,
  Trash2,
  Download,
  MapPin,
  LocateFixed,
  Copy,
  SquareChartGantt,
  RefreshCw,
} from "lucide-react";
import { useField } from "../../../contexts/FieldContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useFieldActions } from "../../../hooks/useFieldActions";
import Swal from "sweetalert2";

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

interface OverlayData {
  imageUrl: string;
  bounds: [[number, number], [number, number]];
  fieldId: string;
}

interface DesktopAnalysisMenuPopupProps {
  selectedFieldId?: string;
  selectedFieldName?: string;
  onOverlayChange?: (overlay: OverlayData | null) => void;
  onFieldSelect?: (fieldId: string, fieldName: string) => void;
}

// Action Button Component
const ActionButton = ({
  icon,
  colorClass,
  onClick,
}: {
  icon: React.ReactNode;
  colorClass: string;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-colors ${colorClass}`}
  >
    {icon}
  </button>
);

// Field Action Buttons Component - uses hook for each field
const FieldActionButtons = ({ field }: { field: any }) => {
  const fieldActions = useFieldActions(field);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fieldActions.handleEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fieldActions.handleDelete();
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fieldActions.handleDownload();
  };

  return (
    <>
      <div className="flex gap-1.5 shrink-0">
        <ActionButton
          icon={<Edit3 size={13} />}
          colorClass="text-sky-600 bg-sky-50 hover:bg-sky-100"
          onClick={handleEditClick}
        />
        <ActionButton
          icon={<Trash2 size={13} />}
          colorClass="text-red-500 bg-red-50 hover:bg-red-100"
          onClick={handleDeleteClick}
        />
        <ActionButton
          icon={<Download size={13} />}
          colorClass="text-teal-600 bg-teal-50 hover:bg-teal-100"
          onClick={handleDownloadClick}
        />
      </div>
      {/* Modals from hook */}
      {fieldActions.EditModal}
      {fieldActions.DownloadPanel}
    </>
  );
};

export default function DesktopAnalysisMenuPopup({}: DesktopAnalysisMenuPopupProps) {
  const navigate = useNavigate();
  const { fields } = useField();
  const { t } = useLanguage();
  const [isSelectPopupOpen, setIsSelectPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"latest" | "name_asc" | "name_desc">(
    "latest"
  );
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showAreaInSqm, setShowAreaInSqm] = useState(false);
  const [showCoordsInUTM, setShowCoordsInUTM] = useState(false);

  // Thumbnails are now included in field data from API - no need to load separately

  const handleButtonClick = () => {
    if (fields.length === 0) {
      Swal.fire({
        title: t("field.noFields"),
        text: t("field.createFirst"),
        icon: "warning",
        confirmButtonText: t("action.ok"),
        confirmButtonColor: "#16a34a",
      });
      return;
    }
    setIsSelectPopupOpen(true);
  };

  const handleFieldSelect = (fieldId: string) => {
    setIsSelectPopupOpen(false);
    navigate(`/dris_project/field/${fieldId}`);
  };

  // UTM conversion function
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

  // Format area from m² to rai-ngan-wa
  const formatArea = (areaM2?: number) => {
    if (!areaM2) return "-";
    const rai = Math.floor(areaM2 / 1600);
    const ngan = Math.floor((areaM2 % 1600) / 400);
    const sqWa = Math.floor((areaM2 % 400) / 4);
    return `${rai} ${t("field.rai")} ${ngan} ${t("field.ngan")} ${sqWa} ${t(
      "field.sqWa"
    )}`;
  };

  // Filter and sort fields
  const filteredFields = fields
    .filter((field) =>
      field.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === "latest") {
        // Sort by created_at descending (newest first)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      } else {
        // Sort by name
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortMode === "name_asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    });

  const sortOptions = [
    { value: "latest", label: "เรียงตามแปลงที่เพิ่มล่าสุด" },
    { value: "name_asc", label: "เรียงตามชื่อแปลง (A → Z)" },
    { value: "name_desc", label: "เรียงตามชื่อแปลง (Z → A)" },
  ];

  return (
    <>
      {/* Analysis Menu Icon Button */}
      <button
        onClick={handleButtonClick}
        className="flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: isSelectPopupOpen
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(10px)",
          border: isSelectPopupOpen ? "2px solid rgb(59, 130, 246)" : "none",
          boxShadow: isSelectPopupOpen
            ? "rgba(59, 130, 246, 0.4) 0px 0px 0px 3px"
            : "rgba(0, 0, 0, 0.15) 0px 4px 15px",
        }}
        title="วิเคราะห์แปลง"
      >
        <div
          style={{
            color: isSelectPopupOpen ? "rgb(59, 130, 246)" : "rgb(51, 51, 51)",
          }}
        >
          <SquareChartGantt className="w-[18px] h-[18px]" />
        </div>
      </button>

      {/* Field Selection Popup - Only shows when multiple fields */}
      {isSelectPopupOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30"
              style={{ zIndex: 10000 }}
              onClick={() => setIsSelectPopupOpen(false)}
            />

            {/* Popup - Desktop size */}
            <div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-lg overflow-hidden flex flex-col"
              style={{
                zIndex: 10001,
                background: "#f8f9fa",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                maxHeight: "85vh",
              }}
            >
              {/* Header */}
              <div
                className="h-[60px] flex items-center justify-between px-5 shrink-0 shadow-md"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "white",
                }}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-white" />
                  <span className="font-semibold text-lg tracking-wide">
                    {t("field.select")}
                  </span>
                </div>
                <button
                  onClick={() => setIsSelectPopupOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Content */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ background: "#f8f9fa" }}
              >
                {/* Search Bar */}
                <div className="flex gap-3 mb-3">
                  <div className="relative flex-1 group">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder={t("field.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all shadow-sm text-sm"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className={`bg-white border rounded-lg w-11 h-full flex items-center justify-center transition-all shadow-sm ${
                        isSortDropdownOpen
                          ? "border-green-600 text-green-600"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-green-600 hover:border-green-600"
                      }`}
                    >
                      <ArrowUpDown size={18} />
                    </button>

                    {/* Sort Dropdown */}
                    {isSortDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[10001]"
                          onClick={() => setIsSortDropdownOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 z-[10002] bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[220px]">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortMode(option.value as typeof sortMode);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                sortMode === option.value
                                  ? "text-green-600 bg-green-50 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Count Label */}
                <div className="flex justify-between items-end text-xs text-gray-500 px-1 mb-3 font-medium">
                  <span>{t("field.allFields")}</span>
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    ({filteredFields.length}) {t("field.unit")}
                  </span>
                </div>

                {/* List Items */}
                <div className="space-y-4 pb-2">
                  {filteredFields.map((field) => (
                    <div
                      key={field.id}
                      onClick={() => handleFieldSelect(field.id)}
                      className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                      {/* Left: Map Thumbnail */}
                      <div className="w-[100px] h-[100px] shrink-0 relative rounded-xl overflow-hidden bg-gray-200 shadow-inner border border-gray-100">
                        {field.thumbnail ? (
                          <img
                            src={field.thumbnail}
                            alt="Map"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <MapPin size={24} className="text-green-400" />
                          </div>
                        )}
                      </div>

                      {/* Right: Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        {/* Header: Title & Actions */}
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-gray-800 text-[15px] truncate pr-2 flex-1 leading-tight">
                            {field.name}
                          </h3>

                          {/* Action Buttons */}
                          <FieldActionButtons field={field} />
                        </div>

                        {/* Info Rows */}
                        <div className="space-y-1.5">
                          {/* Area Size */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="w-5 flex justify-center shrink-0">
                                <VectorSquareIcon size={14} color="#F6B010" />
                              </div>
                              <span className="truncate flex-1 font-medium text-gray-700 ml-1">
                                {showAreaInSqm
                                  ? `${(field.area_m2 || 0).toFixed(
                                      2
                                    )} ตารางเมตร`
                                  : formatArea(field.area_m2)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAreaInSqm(!showAreaInSqm);
                              }}
                              className="text-gray-400 hover:text-green-600 transition-colors shrink-0 ml-1"
                              title={
                                showAreaInSqm
                                  ? "เปลี่ยนเป็น ไร่ งาน ตารางวา"
                                  : "เปลี่ยนเป็น ตารางเมตร"
                              }
                            >
                              <RefreshCw size={11} />
                            </button>
                          </div>

                          {/* Location */}
                          <div className="flex items-center text-xs text-gray-600">
                            <div className="w-5 flex justify-center shrink-0">
                              <MapPin size={14} style={{ color: "#F6B010" }} />
                            </div>
                            <span className="truncate flex-1 ml-1">
                              {field.address || t("field.noAddress")}
                            </span>
                          </div>

                          {/* Coords */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="w-5 flex justify-center shrink-0">
                                <LocateFixed
                                  size={14}
                                  style={{ color: "#F6B010" }}
                                />
                              </div>
                              <span className="truncate flex-1 font-mono text-[11px] ml-1">
                                {showCoordsInUTM
                                  ? (() => {
                                      const utm = latLngToUTM(
                                        field.centroid_lat,
                                        field.centroid_lng
                                      );
                                      return `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`;
                                    })()
                                  : `${field.centroid_lat?.toFixed(
                                      4
                                    )} ${field.centroid_lng?.toFixed(4)}`}
                              </span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const utm = latLngToUTM(
                                    field.centroid_lat,
                                    field.centroid_lng
                                  );
                                  const textToCopy = showCoordsInUTM
                                    ? `${utm.zone}${utm.hemisphere} ${utm.easting}E ${utm.northing}N`
                                    : `${field.centroid_lat}, ${field.centroid_lng}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  Swal.fire({
                                    title: t("action.copied"),
                                    icon: "success",
                                    timer: 1000,
                                    showConfirmButton: false,
                                    position: "bottom",
                                    toast: true,
                                  });
                                }}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                              >
                                <Copy size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCoordsInUTM(!showCoordsInUTM);
                                }}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                                title={
                                  showCoordsInUTM
                                    ? "เปลี่ยนเป็น ละติจูด, ลองจิจูด"
                                    : "เปลี่ยนเป็น UTM"
                                }
                              >
                                <RefreshCw size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredFields.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {t("field.notFound")}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                className="bg-white border-t border-gray-100 p-3 text-center text-xs text-gray-400"
                style={{ boxShadow: "0 -4px 10px rgba(0,0,0,0.02)" }}
              >
                {t("field.total")} {fields.length} {t("field.unit")}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
