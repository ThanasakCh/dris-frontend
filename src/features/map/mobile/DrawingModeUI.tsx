import { useEffect } from "react";
import { ChevronLeft, Trash2, Undo2, Check, LocateFixed } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface MobileDrawingModeProps {
  isActive: boolean;
  onCancel: () => void;
  onAddPoint: () => void;
  onUndo: () => void;
  onConfirm: () => void;
  onDeleteAll: () => void;
  nodeCount: number;
  areaText?: string;
  areaCentroid?: { x: number; y: number } | null;
}

// Toast popup component
function DrawingToast({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5000,
        }}
      />

      {/* Toast */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 5001,
          background: "#fff",
          borderRadius: "16px",
          padding: "24px 32px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        {/* Polygon Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="12" cy="12" r="6" fill="#22C55E" />
            <circle cx="52" cy="12" r="6" fill="#22C55E" />
            <circle cx="12" cy="52" r="6" fill="#22C55E" />
            <circle cx="52" cy="52" r="6" fill="#22C55E" />
            <line
              x1="18"
              y1="12"
              x2="46"
              y2="12"
              stroke="#22C55E"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <line
              x1="52"
              y1="18"
              x2="52"
              y2="46"
              stroke="#22C55E"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <line
              x1="46"
              y1="52"
              x2="18"
              y2="52"
              stroke="#22C55E"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <line
              x1="12"
              y1="46"
              x2="12"
              y2="18"
              stroke="#22C55E"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
        <p
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#1e293b",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          วาดแปลง
          <br />
          ของคุณได้เลย
        </p>
      </div>
    </>
  );
}

// Crosshair component
function MapCrosshair() {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1500,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LocateFixed
        size={48}
        strokeWidth={1.5}
        style={{
          color: "#22C55E",
          display: "block",
        }}
      />
    </div>
  );
}

export default function MobileDrawingMode({
  isActive,
  onCancel,
  onAddPoint,
  onUndo,
  onConfirm,
  onDeleteAll,
  nodeCount,
  areaText,
  areaCentroid,
}: MobileDrawingModeProps) {
  const { t } = useLanguage();
  const canConfirm = nodeCount >= 3;

  if (!isActive) return null;

  return (
    <>
      {/* Green Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
          zIndex: 3000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        {/* Back Button */}
        <button
          onClick={onCancel}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.5)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={24} color="#fff" />
        </button>

        {/* Title */}
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#fff",
            margin: 0,
          }}
        >
          {t("draw.title")}
        </h1>

        {/* Delete Button - show when has nodes */}
        {nodeCount > 0 ? (
          <button
            onClick={onDeleteAll}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.5)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Trash2 size={20} color="#fff" />
          </button>
        ) : (
          <div style={{ width: "40px" }} />
        )}
      </div>

      {/* Crosshair */}
      <MapCrosshair />

      {/* Area Display - positioned at polygon centroid */}
      {areaText && nodeCount >= 2 && areaCentroid && (
        <div
          style={{
            position: "fixed",
            top: areaCentroid.y,
            left: areaCentroid.x,
            transform: "translate(-50%, -50%)",
            zIndex: 1500,
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {areaText}
        </div>
      )}

      {/* Add Point Button */}
      <div
        style={{
          position: "fixed",
          bottom: "120px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3000,
        }}
      >
        <button
          onClick={onAddPoint}
          style={{
            padding: "14px 32px",
            background: "#fff",
            border: "none",
            borderRadius: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            fontSize: "15px",
            fontWeight: 600,
            color: "#1e293b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          เพิ่มจุดนี้
        </button>
      </div>

      {/* Bottom Card */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "20px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          zIndex: 3000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Text */}
        <div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#1e293b",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            คุณสามารถวาดแปลงได้
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              margin: "4px 0 0 0",
            }}
          >
            ไม่เกิน 3,000 ไร่ / แปลง
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={nodeCount === 0}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: nodeCount > 0 ? "pointer" : "default",
              opacity: nodeCount > 0 ? 1 : 0.4,
            }}
          >
            <Undo2 size={20} color="#64748b" />
          </button>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "none",
              background: canConfirm ? "#22C55E" : "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: canConfirm ? "pointer" : "default",
            }}
          >
            <Check size={24} color={canConfirm ? "#fff" : "#94a3b8"} />
          </button>
        </div>
      </div>
    </>
  );
}

// Export toast component for use in parent
export { DrawingToast };
