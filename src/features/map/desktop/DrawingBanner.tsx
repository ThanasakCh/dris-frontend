import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DesktopDrawingBannerProps {
  isVisible: boolean;
  onCancel: () => void;
  areaText?: string;
  areaCentroid?: { x: number; y: number } | null;
}

export default function DesktopDrawingBanner({
  isVisible,
  onCancel,
  areaText,
  areaCentroid,
}: DesktopDrawingBannerProps) {
  if (!isVisible) return null;

  return createPortal(
    <>
      {/* Area Display - floating on map when drawing */}
      {areaText && areaCentroid && (
        <div
          className="fixed z-[9999]"
          style={{
            top: areaCentroid.y,
            left: areaCentroid.x,
            transform: "translate(-50%, -50%)",
            color: "#fff",
            fontSize: "18px",
            fontWeight: 600,
            textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {areaText}
        </div>
      )}

      {/* Bottom Banner */}
      <div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          padding: "12px 20px",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Text Content */}
        <div className="flex flex-col">
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            คุณสามารถวาดแปลงได้
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            ไม่เกิน 3,000 ไร่ / แปลง
          </span>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="flex items-center justify-center transition-all hover:scale-110"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            border: "none",
            cursor: "pointer",
          }}
          title="ยกเลิกการวาด"
        >
          <X
            size={20}
            style={{
              color: "#ef4444",
            }}
          />
        </button>
      </div>
    </>,
    document.body
  );
}
