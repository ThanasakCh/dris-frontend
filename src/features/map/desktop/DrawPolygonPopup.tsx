import { useState, useRef } from "react";
import { Share2, X, Pencil, Upload, FileUp } from "lucide-react";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import Swal from "sweetalert2";
import shp from "shpjs";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DesktopDrawPolygonPopupProps {
  draw?: MapboxDraw | null;
  onStartDrawing?: () => void;
  savedPolygons?: number;
  onImportGeometry?: (geometry: GeoJSON.Geometry, fileName: string) => void;
}

export default function DesktopDrawPolygonPopup({
  draw,
  onStartDrawing,
  savedPolygons = 0,
  onImportGeometry,
}: DesktopDrawPolygonPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleStartDrawing = () => {
    if (draw) {
      draw.changeMode("draw_polygon");
      setIsOpen(false);
      if (onStartDrawing) {
        onStartDrawing();
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    setIsImporting(true);

    try {
      let geometry: GeoJSON.Geometry | null = null;

      if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
        // Parse GeoJSON
        const text = await file.text();
        const geojson = JSON.parse(text);
        geometry = extractGeometry(geojson);
      } else if (fileName.endsWith(".kml")) {
        // Parse KML
        const text = await file.text();
        geometry = parseKML(text);
      } else if (fileName.endsWith(".zip")) {
        // Parse Shapefile (ZIP containing .shp, .dbf, .shx, etc.)
        const arrayBuffer = await file.arrayBuffer();
        const geojson = await shp(arrayBuffer);
        geometry = extractGeometry(geojson);
      } else if (fileName.endsWith(".shp")) {
        // Single .shp file - need ZIP with all components
        await Swal.fire({
          title: t("draw.uploadZip"),
          html: `
            <p>${t("draw.uploadZipDetail")}</p>
            <p class="text-sm text-gray-500 mt-2">
              ให้รวมไฟล์ .shp, .dbf, .shx, .prj ไว้ในไฟล์ ZIP เดียวกัน
            </p>
          `,
          icon: "info",
          confirmButtonText: t("action.ok"),
          confirmButtonColor: "#16a34a",
        });
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      } else {
        throw new Error(t("draw.fileNotSupported"));
      }

      if (!geometry) {
        throw new Error(t("draw.noGeometry"));
      }

      // Validate geometry type
      if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
        throw new Error(t("draw.polygonOnly"));
      }

      // Call callback or add to map
      if (onImportGeometry) {
        onImportGeometry(geometry, file.name);
        setIsOpen(false);
      } else if (draw) {
        // Add to draw control directly
        draw.add({
          type: "Feature",
          geometry: geometry,
          properties: {},
        });

        setIsOpen(false);

        // Trigger draw create event manually
        if (onStartDrawing) {
          onStartDrawing();
        }
      }

      await Swal.fire({
        title: t("draw.importSuccess"),
        text: `${t("draw.importedFrom")} ${file.name}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Import error:", error);
      await Swal.fire({
        title: t("confirm.error"),
        text: error.message || t("draw.cannotReadFile"),
        icon: "error",
        confirmButtonText: t("action.ok"),
        confirmButtonColor: "#16a34a",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Extract geometry from various GeoJSON structures
  const extractGeometry = (geojson: any): GeoJSON.Geometry | null => {
    if (geojson.type === "Feature") {
      return geojson.geometry;
    } else if (geojson.type === "FeatureCollection") {
      // Get first feature's geometry
      if (geojson.features && geojson.features.length > 0) {
        return geojson.features[0].geometry;
      }
    } else if (geojson.type === "Polygon" || geojson.type === "MultiPolygon") {
      return geojson;
    }
    return null;
  };

  // Simple KML parser for Polygon
  const parseKML = (kmlText: string): GeoJSON.Geometry | null => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlText, "text/xml");

    const coordinates = doc.querySelector("coordinates");
    if (!coordinates) return null;

    const coordText = coordinates.textContent?.trim() || "";
    const coords = coordText
      .split(/\s+/)
      .map((coord) => {
        const [lng, lat] = coord.split(",").map(Number);
        return [lng, lat] as [number, number];
      })
      .filter((c) => !isNaN(c[0]) && !isNaN(c[1]));

    if (coords.length < 3) return null;

    // Ensure polygon is closed
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0]);
    }

    return {
      type: "Polygon",
      coordinates: [coords],
    };
  };

  return (
    <>
      {/* Draw Polygon Icon Button */}
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
        title="วาดโพลิกอน"
      >
        <div
          style={{ color: isOpen ? "rgb(59, 130, 246)" : "rgb(51, 51, 51)" }}
        >
          <Share2 className="w-[18px] h-[18px]" />
        </div>
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,.kml,.shp,.zip"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

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
            className="absolute left-13 top-0 z-40 rounded-xl p-4"
            style={{
              minWidth: "280px",
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "rgba(0, 0, 0, 0.15) 0px 4px 20px",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h4
                className="m-0 flex items-center gap-2"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgb(51, 51, 51)",
                }}
              >
                <Share2 className="w-4 h-4" />
                Draw Polygon
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer p-1 hover:bg-black/5 rounded transition-colors"
              >
                <X
                  className="w-4 h-4"
                  style={{ color: "rgb(102, 102, 102)" }}
                />
              </button>
            </div>

            {/* Start Drawing Button */}
            <button
              onClick={handleStartDrawing}
              className="w-full flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90"
              style={{
                padding: "12px 16px",
                background: "rgb(34, 197, 94)",
                border: "none",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <Pencil className="w-4 h-4" />
              Start Drawing
            </button>

            {/* Import Button */}
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 mt-2"
              style={{
                padding: "12px 16px",
                background: "rgb(59, 130, 246)",
                border: "none",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                opacity: isImporting ? 0.7 : 1,
              }}
            >
              {isImporting ? (
                <>
                  <FileUp className="w-4 h-4 animate-pulse" />
                  {t("action.importing")}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {t("action.import")}
                </>
              )}
            </button>

            {/* Supported Formats Info */}
            <div className="mt-2 p-2 rounded-lg">
              <p
                style={{
                  fontSize: "11px",
                  color: "rgb(51, 51, 51)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {t("draw.supportedFormats").replace(":", ": ")}
              </p>
            </div>

            {/* My Polygons Section */}
            <div className="mt-4">
              <h5
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "rgb(51, 51, 51)",
                  margin: "0 0 8px 0",
                }}
              >
                {t("field.myFields")} ({savedPolygons})
              </h5>
              <p
                style={{
                  fontSize: "12px",
                  color:
                    savedPolygons > 0
                      ? "rgb(34, 197, 94)"
                      : "rgb(156, 163, 175)",
                  margin: 0,
                  fontStyle: savedPolygons > 0 ? "normal" : "italic",
                }}
              >
                {savedPolygons > 0
                  ? `✓ ${t("draw.saved")} ${savedPolygons} ${t("field.unit")}`
                  : t("draw.noFields")}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
