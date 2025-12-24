import DesktopBasemapPopup from "../../map/desktop/BasemapPopup";
import DesktopDrawPolygonPopup from "../../map/desktop/DrawPolygonPopup";
import DesktopLegendPopup from "../../map/desktop/LegendPopup";
import DesktopAnalysisMenuPopup from "../../field/desktop/FieldListPopup";
import type { Map } from "maplibre-gl";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import { mapStyles } from "../../../config/mapConfig";

interface OverlayData {
  imageUrl: string;
  bounds: [[number, number], [number, number]];
  fieldId: string;
}

interface DesktopFloatingSidebarProps {
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
  onImportGeometry?: (geometry: GeoJSON.Geometry, fileName: string) => void;
}

export default function DesktopFloatingSidebar({
  map,
  currentStyle,
  onStyleChange,
  draw,
  onStartDrawing,
  selectedFieldId,
  selectedFieldName,
  fieldsCount = 0,
  onOverlayChange,
  onImportGeometry,
}: DesktopFloatingSidebarProps) {
  return (
    <div
      className="absolute left-2.5 z-40 flex flex-col"
      style={{
        top: "125px",
        gap: "10px",
      }}
    >
      {/* 1. Basemap Popup (แผนที่) */}
      <DesktopBasemapPopup
        map={map}
        currentStyle={currentStyle}
        onStyleChange={onStyleChange}
      />

      {/* 2. Draw Polygon Popup (วาดโพลิกอน) */}
      <DesktopDrawPolygonPopup
        draw={draw}
        onStartDrawing={onStartDrawing}
        onImportGeometry={onImportGeometry}
        savedPolygons={fieldsCount}
      />

      {/* 3. Legend Popup (ข้อมูลดัชนี) */}
      <DesktopLegendPopup />

      {/* 4. Analysis Menu (วิเคราะห์แปลง) */}
      <DesktopAnalysisMenuPopup
        selectedFieldId={selectedFieldId}
        selectedFieldName={selectedFieldName}
        onOverlayChange={onOverlayChange}
      />
    </div>
  );
}
