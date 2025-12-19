import BasemapPopup from "../../map/mobile/BasemapPopup";
import DrawPolygonPopup from "../../map/mobile/DrawPolygonPopup";
import LegendPopup from "../../map/mobile/LegendPopup";
import AnalysisMenuPopup from "../../field/mobile/FieldListPopup";
import type { Map } from "maplibre-gl";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import { mapStyles } from "../../../config/mapConfig";

interface OverlayData {
  imageUrl: string;
  bounds: [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  fieldId: string;
}

interface FloatingSidebarProps {
  onItemClick: (panel: string) => void;
  activePanel?: string;
  map: Map | null;
  currentStyle: keyof typeof mapStyles;
  onStyleChange: (style: keyof typeof mapStyles) => void;
  draw?: MapboxDraw | null;
  onStartDrawing?: () => void;
  selectedFieldId?: string;
  selectedFieldName?: string;
  fieldsCount?: number;
  onOverlayChange?: (overlay: OverlayData | null) => void;
}

export default function FloatingSidebar({
  map,
  currentStyle,
  onStyleChange,
  draw,
  onStartDrawing,
  selectedFieldId,
  selectedFieldName,
  fieldsCount = 0,
  onOverlayChange,
}: FloatingSidebarProps) {
  return (
    <div
      className="absolute left-2.5 z-40 flex flex-col"
      style={{
        top: "125px",
        gap: "10px",
      }}
    >
      {/* 1. Basemap Popup (แผนที่) */}
      <BasemapPopup
        map={map}
        currentStyle={currentStyle}
        onStyleChange={onStyleChange}
      />

      {/* 2. Draw Polygon Popup (วาดโพลิกอน) */}
      <DrawPolygonPopup
        draw={draw}
        onStartDrawing={onStartDrawing}
        savedPolygons={fieldsCount}
      />

      {/* 3. Legend Popup (ข้อมูลดัชนี) */}
      <LegendPopup />

      {/* 4. Analysis Menu (วิเคราะห์แปลง - รวม Health + Analysis) */}
      <AnalysisMenuPopup
        selectedFieldId={selectedFieldId}
        selectedFieldName={selectedFieldName}
        onOverlayChange={onOverlayChange}
      />
    </div>
  );
}
