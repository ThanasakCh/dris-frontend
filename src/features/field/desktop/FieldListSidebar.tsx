import { useState } from "react";
import { Search, Plus, MapPin, Layers } from "lucide-react";
import { useField } from "../../../contexts/FieldContext";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DesktopSidebarProps {
  onFieldClick: (fieldId: string, fieldName: string) => void;
  selectedFieldId?: string;
  onDrawClick?: () => void;
}

export default function DesktopSidebar({
  onFieldClick,
  selectedFieldId,
  onDrawClick,
}: DesktopSidebarProps) {
  const { fields } = useField();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFields = fields.filter((field) =>
    field.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatArea = (areaM2?: number) => {
    if (!areaM2) return "-";
    const rai = Math.floor(areaM2 / 1600);
    const ngan = Math.floor((areaM2 % 1600) / 400);
    const sqWa = Math.floor((areaM2 % 400) / 4);
    return `${rai} ไร่ ${ngan} งาน ${sqWa} ตร.ว.`;
  };

  return (
    <div
      className="absolute top-0 left-0 h-full z-30 pointer-events-none flex flex-col p-4"
      style={{ width: "366px" }}
    >
      <div className="flex-1 w-full bg-gray-50/95 backdrop-blur-md rounded-[32px] shadow-xl pointer-events-auto relative overflow-hidden flex flex-col border border-gray-200/50">
        {/* Header */}
        <div className="p-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">แปลงของฉัน</h2>
            <button
              onClick={onDrawClick}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md"
            >
              <Plus size={16} />
              เพิ่มแปลง
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาแปลง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
          </div>
        </div>

        {/* Field List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scroll">
          {filteredFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="text-gray-400" size={28} />
              </div>
              <p className="text-gray-500 font-medium">ไม่พบแปลง</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery
                  ? "ลองค้นหาใหม่อีกครั้ง"
                  : "กดปุ่ม 'เพิ่มแปลง' เพื่อสร้างแปลงใหม่"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFields.map((field) => (
                <div
                  key={field.id}
                  onClick={() => onFieldClick(field.id, field.name)}
                  className={`bg-white rounded-2xl p-3.5 shadow-sm border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                    selectedFieldId === field.id
                      ? "border-green-500 ring-2 ring-green-500/20"
                      : "border-gray-100 hover:border-green-300"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl">
                        🌾
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">
                        {field.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                          <span className="text-orange-500 text-[10px]">◼</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatArea(field.area_m2)}
                        </span>
                      </div>
                      {(field.address || field.address_en) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin
                            size={12}
                            className="text-blue-500 shrink-0"
                          />
                          <span className="text-xs text-gray-500 truncate">
                            {language === "EN"
                              ? field.address_en
                              : field.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    {selectedFieldId === field.id && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 pt-3 border-t border-gray-200/50 shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">ทั้งหมด</span>
            <span className="font-bold text-gray-800">
              {fields.length} แปลง
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
