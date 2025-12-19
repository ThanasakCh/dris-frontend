import { useState } from "react";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DesktopSaveFieldPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: {
    name: string;
    variety: string;
    planting_season: string;
    planting_date: string;
  }) => Promise<void>;
  isMobile?: boolean;
}

export default function DesktopSaveFieldPopup({
  isOpen,
  onClose,
  onSave,
  isMobile = false,
}: DesktopSaveFieldPopupProps) {
  const [formData, setFormData] = useState({
    name: "",
    variety: "ข้าวหอมมะลิ",
    planting_season: "",
    planting_date: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Swal.fire({
        title: t("confirm.warning"),
        text: t("draw.enterFieldName"),
        icon: "warning",
        confirmButtonText: t("action.ok"),
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      // Reset form
      setFormData({
        name: "",
        variety: "ข้าวหอมมะลิ",
        planting_season: "",
        planting_date: "",
      });
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      variety: "ข้าวหอมมะลิ",
      planting_season: "",
      planting_date: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30"
        style={{ zIndex: 5000 }}
        onClick={handleCancel}
      />

      {/* Popup */}
      <div
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl"
        style={{
          zIndex: 5001,
          width: isMobile ? "calc(100% - 32px)" : "420px",
          maxWidth: isMobile ? "360px" : "420px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: isMobile ? "20px" : "24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3
            className="m-0"
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "rgb(31, 41, 55)",
            }}
          >
            {t("field.saveNew")}
          </h3>
          <button
            onClick={handleCancel}
            className="cursor-pointer p-2 hover:bg-black/5 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" style={{ color: "rgb(107, 114, 128)" }} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Field Name */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgb(55, 65, 81)",
              }}
            >
              {t("field.name")}{" "}
              <span style={{ color: "rgb(239, 68, 68)" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("field.placeholder")}
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          {/* Variety */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgb(55, 65, 81)",
              }}
            >
              {t("farm.riceVariety")}
            </label>
            <select
              value={formData.variety}
              onChange={(e) =>
                setFormData({ ...formData, variety: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSaving}
            >
              <option value="ข้าวหอมมะลิ">ข้าวหอมมะลิ</option>
              <option value="ข้าวกข6">ข้าวกข6</option>
              <option value="ข้าวกข15">ข้าวกข15</option>
              <option value="ข้าวปทุมธานี">ข้าวปทุมธานี</option>
              <option value="ข้าวเหนียว">ข้าวเหนียว</option>
              <option value="ข้าวไรซ์เบอรี่">ข้าวไรซ์เบอรี่</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          {/* Planting Season */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgb(55, 65, 81)",
              }}
            >
              {t("farm.plantingSeason")}
            </label>
            <select
              value={formData.planting_season}
              onChange={(e) =>
                setFormData({ ...formData, planting_season: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSaving}
            >
              <option value="">{t("farm.selectSeason")}</option>
              <option value="นาปี">นาปี - ปลูกฤดูฝน</option>
              <option value="นาปรัง">นาปรัง - ปลูกนอกฤดู</option>
              <option value="นาดำ">นาดำ</option>
              <option value="นาหว่าน">นาหว่าน</option>
            </select>
          </div>

          {/* Planting Date */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgb(55, 65, 81)",
              }}
            >
              {t("farm.plantingDate")}
            </label>
            <input
              type="date"
              value={formData.planting_date}
              onChange={(e) =>
                setFormData({ ...formData, planting_date: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 p-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            {t("action.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 p-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? t("action.saving") : t("action.saveField")}
          </button>
        </div>
      </div>
    </>
  );
}
