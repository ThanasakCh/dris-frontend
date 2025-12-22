import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useField } from "../../contexts/FieldContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { mapStyles } from "../../config/mapConfig";
import Swal from "sweetalert2";
import { useResponsive } from "../../hooks/useResponsive";

// Thumbnail Capture Utility (using Leaflet in background)
import {
  captureMapThumbnail,
  generateFallbackThumbnail,
} from "../../utils/thumbnailCapture";

// Mobile UI Components
import FloatingSidebar from "../layout/mobile/FloatingToolbar";
import MapControls from "./mobile/MapControls";
import TopHeader from "../layout/mobile/TopHeader";
import BottomSheet from "../layout/mobile/BottomSheet";
import MobileSidebar from "../layout/mobile/NavigationSidebar";
import MobileDrawingMode, { DrawingToast } from "./mobile/DrawingModeUI";

// Mobile Pages
import MobileAboutPage from "../about/AboutPage";

// Desktop UI Components
import {
  DesktopTopHeader,
  DesktopFloatingSidebar,
  DesktopMapControls,
  DesktopSaveFieldPopup,
  DesktopDrawingBanner,
  DesktopMenuSidebar,
} from "../../components/desktop";

// Panel Components
import HealthPopup from "../health/mobile/HealthCheckPopup";

// Mobile Search Component
import MobileSearchPanel from "./mobile/SearchPanel";

type PanelType =
  | "filters"
  | "info"
  | "analysis"
  | "layers"
  | "favorites"
  | "stats"
  | "draw_form"
  | null;

interface OverlayData {
  imageUrl: string;
  bounds: [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  fieldId: string;
}

const MobileMapPage: React.FC = () => {
  const { isDesktop } = useResponsive();

  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [drawControl, setDrawControl] = useState<MapboxDraw | null>(null);

  const { fields, createField, saveThumbnail, refreshFields } = useField();
  const { t } = useLanguage();

  const [currentStyle, setCurrentStyle] =
    useState<keyof typeof mapStyles>("satellite");
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>();
  const [selectedFieldName, setSelectedFieldName] = useState<
    string | undefined
  >();
  const [drawnFeature, setDrawnFeature] = useState<any>(null);
  const [drawFormData, setDrawFormData] = useState({
    name: "",
    variety: "ข้าวหอมมะลิ",
    planting_season: "",
    planting_date: "",
  });

  // Track if user is actively drawing a polygon
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Mobile Sidebar and Navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<"health" | "about">("health");

  // Desktop Menu Sidebar
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

  // Mobile Drawing Mode
  const [showDrawingToast, setShowDrawingToast] = useState(false);
  const [mobileDrawingActive, setMobileDrawingActive] = useState(false);
  const [mobileDrawingPoints, setMobileDrawingPoints] = useState<
    [number, number][]
  >([]);
  const [mobileAreaText, setMobileAreaText] = useState<string>("");
  const [mobileAreaCentroid, setMobileAreaCentroid] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [desktopAreaText, setDesktopAreaText] = useState<string>("");
  const [desktopAreaCentroid, setDesktopAreaCentroid] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Overlay management functions
  const displayOverlay = (overlay: OverlayData) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing overlay
    clearOverlay();

    // Find the selected field index and hide other field layers
    let selectedFieldLayer: string | undefined;
    const selectedFieldIndex = fields.findIndex(
      (f) => f.id === overlay.fieldId
    );

    for (let i = 0; i < fields.length; i++) {
      const fillLayerId = `field-${i}`;
      const outlineLayerId = `field-${i}-outline`;

      if (map.getLayer(fillLayerId)) {
        if (i === selectedFieldIndex) {
          // Keep selected field visible
          selectedFieldLayer = fillLayerId;
          map.setLayoutProperty(fillLayerId, "visibility", "visible");
        } else {
          // Hide other fields
          map.setLayoutProperty(fillLayerId, "visibility", "none");
        }
      }

      if (map.getLayer(outlineLayerId)) {
        if (i === selectedFieldIndex) {
          map.setLayoutProperty(outlineLayerId, "visibility", "visible");
        } else {
          map.setLayoutProperty(outlineLayerId, "visibility", "none");
        }
      }
    }

    // Add new overlay source
    map.addSource("vi-overlay", {
      type: "image",
      url: overlay.imageUrl,
      coordinates: [
        [overlay.bounds[0][0], overlay.bounds[1][1]], // top-left
        [overlay.bounds[1][0], overlay.bounds[1][1]], // top-right
        [overlay.bounds[1][0], overlay.bounds[0][1]], // bottom-right
        [overlay.bounds[0][0], overlay.bounds[0][1]], // bottom-left
      ],
    });

    // Add overlay layer BELOW field layers
    map.addLayer(
      {
        id: "vi-overlay-layer",
        type: "raster",
        source: "vi-overlay",
        paint: {
          "raster-opacity": 0.85,
        },
      },
      selectedFieldLayer // Insert before (below) the selected field layer
    );
  };

  const clearOverlay = () => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer("vi-overlay-layer")) {
      map.removeLayer("vi-overlay-layer");
    }
    if (map.getSource("vi-overlay")) {
      map.removeSource("vi-overlay");
    }

    // Show all field layers again
    for (let i = 0; i < fields.length; i++) {
      const fillLayerId = `field-${i}`;
      const outlineLayerId = `field-${i}-outline`;

      if (map.getLayer(fillLayerId)) {
        map.setLayoutProperty(fillLayerId, "visibility", "visible");
      }
      if (map.getLayer(outlineLayerId)) {
        map.setLayoutProperty(outlineLayerId, "visibility", "visible");
      }
    }
  };

  const handleOverlayChange = (overlay: OverlayData | null) => {
    if (overlay) {
      displayOverlay(overlay);
    } else {
      clearOverlay();
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyles[currentStyle],
      center: [98.99, 18.79],
      zoom: 12,
      preserveDrawingBuffer: true,
    } as any);

    map.on("error", (e) => {
      console.error("Map error:", e);
    });

    mapRef.current = map;

    // Initialize draw control ONLY for desktop
    if (isDesktop) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        styles: [
          // Polygon fill
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"]],
            paint: {
              "fill-color": "#ffff00",
              "fill-opacity": 0.3,
            },
          },
          // Polygon outline (dashed)
          {
            id: "gl-draw-polygon-stroke",
            type: "line",
            filter: ["all", ["==", "$type", "Polygon"]],
            paint: {
              "line-color": "#ff0000",
              "line-width": 2,
              "line-dasharray": [2, 2],
            },
          },
          // Line stroke (dashed) - for drawing in progress
          {
            id: "gl-draw-line-stroke",
            type: "line",
            filter: ["all", ["==", "$type", "LineString"]],
            paint: {
              "line-color": "#ff0000",
              "line-width": 2,
              "line-dasharray": [2, 2],
            },
          },
          // Vertex points
          {
            id: "gl-draw-polygon-and-line-vertex-active",
            type: "circle",
            filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
            paint: {
              "circle-radius": 8,
              "circle-color": "#ff0000",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          },
        ],
      });

      map.addControl(draw as any);
      setDrawControl(draw);

      // Handle draw events (desktop only)
      map.on("draw.create", (e: any) => {
        const feature = e.features[0];
        setDrawnFeature(feature);
        setActivePanel("draw_form");
        setIsDrawingMode(false);
        setDesktopAreaText("");
        setDesktopAreaCentroid(null);
      });

      map.on("draw.render", () => {
        if (!draw) return;
        const data = draw.getAll();
        if (data.features.length > 0) {
          const feature = data.features[0];
          if (
            feature.geometry.type === "Polygon" &&
            feature.geometry.coordinates[0].length >= 3
          ) {
            const coords = feature.geometry.coordinates[0] as [
              number,
              number
            ][];
            const areaM2 = calculatePolygonArea(coords);
            if (areaM2 > 0) {
              const areaText = formatArea(areaM2);
              setDesktopAreaText(areaText);

              // Calculate centroid
              let sumLng = 0;
              let sumLat = 0;
              // Remove last point (duplicate of first)
              const uniqueCoords = coords.slice(0, coords.length - 1);
              uniqueCoords.forEach((p) => {
                sumLng += p[0];
                sumLat += p[1];
              });
              const centerLng = sumLng / uniqueCoords.length;
              const centerLat = sumLat / uniqueCoords.length;

              const point = map.project([centerLng, centerLat]);
              setDesktopAreaCentroid({ x: point.x, y: point.y });
            }
          }
        }
      });
    }

    // Load existing fields
    map.on("load", () => {
      restoreFields();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isDesktop]);

  // Restore fields when fields array changes
  useEffect(() => {
    if (mapRef.current && fields.length > 0) {
      restoreFields();
    }
  }, [fields]);

  // Draw mobile drawing polygon realtime
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = "mobile-drawing-source";
    const lineLayerId = "mobile-drawing-line";
    const fillLayerId = "mobile-drawing-fill";
    const pointsLayerId = "mobile-drawing-points";

    // Remove existing layers and source
    if (map.getLayer(pointsLayerId)) map.removeLayer(pointsLayerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Only draw if we have points
    if (mobileDrawingPoints.length === 0) return;

    // Create GeoJSON for the polygon/line
    const coordinates = [...mobileDrawingPoints];

    // Add polygon source
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          // Polygon/Line feature
          {
            type: "Feature",
            geometry:
              mobileDrawingPoints.length >= 3
                ? {
                    type: "Polygon",
                    coordinates: [[...coordinates, coordinates[0]]],
                  }
                : {
                    type: "LineString",
                    coordinates: coordinates,
                  },
            properties: {},
          },
          // Point features for markers
          ...mobileDrawingPoints.map((point, index) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: point,
            },
            properties: { index },
          })),
        ],
      },
    });

    // Add fill layer (only visible with 3+ points)
    if (mobileDrawingPoints.length >= 3) {
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#ffff00",
          "fill-opacity": 0.3,
        },
      });
    }

    // Add line layer
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      filter: ["in", "$type", "Polygon", "LineString"],
      paint: {
        "line-color": "#ff0000",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    });

    // Add points layer (markers)
    map.addLayer({
      id: pointsLayerId,
      type: "circle",
      source: sourceId,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 8,
        "circle-color": "#ff0000",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Calculate centroid and update screen position
    const updateCentroidPosition = () => {
      if (mobileDrawingPoints.length < 3) {
        setMobileAreaCentroid(null);
        return;
      }

      // Simple centroid calculation (average of points)
      let sumLng = 0;
      let sumLat = 0;
      mobileDrawingPoints.forEach((p) => {
        sumLng += p[0];
        sumLat += p[1];
      });
      const centerLng = sumLng / mobileDrawingPoints.length;
      const centerLat = sumLat / mobileDrawingPoints.length;

      const point = map.project([centerLng, centerLat]);
      setMobileAreaCentroid({ x: point.x, y: point.y });
    };

    updateCentroidPosition();

    // Update position on map move/zoom
    const handleMapMove = () => updateCentroidPosition();
    map.on("move", handleMapMove);
    map.on("zoom", handleMapMove);

    return () => {
      map.off("move", handleMapMove);
      map.off("zoom", handleMapMove);
    };
  }, [mobileDrawingPoints]);

  // Restore fields on map
  const restoreFields = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Wait for style to load if not ready
    if (!map.isStyleLoaded()) {
      const checkStyle = () => {
        if (map.isStyleLoaded()) {
          restoreFields();
        } else {
          setTimeout(checkStyle, 100);
        }
      };
      setTimeout(checkStyle, 100);
      return;
    }

    // Clear existing field layers first to avoid duplicates
    fields.forEach((_, index) => {
      const sourceId = `field-source-${index}`;
      const layerId = `field-${index}`;
      const outlineId = `${layerId}-outline`;

      try {
        if (map.getLayer(outlineId)) map.removeLayer(outlineId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {
        // Ignore errors during cleanup
      }
    });

    // Add field layers
    fields.forEach((field, index) => {
      const sourceId = `field-source-${index}`;
      const layerId = `field-${index}`;

      try {
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: field.geometry,
            properties: { fieldId: field.id },
          },
        });

        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#ffff00",
            "fill-opacity": 0.3,
          },
        });

        map.addLayer({
          id: `${layerId}-outline`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#ff0000",
            "line-width": 2,
          },
        });

        // Click handler
        map.on("click", layerId, () => {
          setSelectedFieldId(field.id);
          setSelectedFieldName(field.name);
          setActivePanel("info");
        });
      } catch (e) {
        console.warn(`Failed to add field layer ${index}:`, e);
      }
    });
  };

  // Handle panel changes
  const handlePanelClick = (panel: string) => {
    setActivePanel(panel as PanelType);
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarNavigate = (page: "health" | "about") => {
    setCurrentPage(page);
  };

  const handleStyleChange = (styleId: keyof typeof mapStyles) => {
    if (mapRef.current && mapStyles[styleId]) {
      setCurrentStyle(styleId);
      mapRef.current.setStyle(mapStyles[styleId]);

      // Restore fields after style change
      mapRef.current.once("styledata", () => {
        restoreFields();
      });
    }
  };

  const handleStartDrawing = () => {
    setActivePanel(null);
    if (isDesktop) {
      setIsDrawingMode(true);
      setDesktopAreaText("");
      setDesktopAreaCentroid(null);
    } else {
      // Mobile: Show toast and activate mobile drawing mode
      setShowDrawingToast(true);
      setMobileDrawingActive(true);
      setMobileDrawingPoints([]);
      setMobileAreaText("");
    }
  };

  // Cancel drawing mode (before polygon is complete)
  const handleCancelDrawingMode = () => {
    if (drawControl) {
      drawControl.deleteAll();
      drawControl.changeMode("simple_select");
    }
    setIsDrawingMode(false);
    setDrawnFeature(null);
    setDesktopAreaText("");
    setDesktopAreaCentroid(null);
  };

  // Mobile Drawing Handlers
  const handleMobileAddPoint = () => {
    if (!mapRef.current) return;

    // Get the screen center (where the crosshair is fixed)
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    // Get container position on screen
    const container = mapRef.current.getContainer();
    const rect = container.getBoundingClientRect();

    // Convert screen coordinates to container-relative coordinates
    const containerX = screenCenterX - rect.left;
    const containerY = screenCenterY - rect.top;

    // Convert to geographic coordinates
    const lngLat = mapRef.current.unproject([containerX, containerY]);
    const newPoint: [number, number] = [lngLat.lng, lngLat.lat];

    const newPoints = [...mobileDrawingPoints, newPoint];
    setMobileDrawingPoints(newPoints);

    // Calculate and display area if enough points
    if (newPoints.length >= 3) {
      const area = calculatePolygonArea(newPoints);
      setMobileAreaText(formatArea(area));
    }
  };

  const handleMobileUndo = () => {
    if (mobileDrawingPoints.length > 0) {
      const newPoints = mobileDrawingPoints.slice(0, -1);
      setMobileDrawingPoints(newPoints);

      if (newPoints.length >= 3) {
        const area = calculatePolygonArea(newPoints);
        setMobileAreaText(formatArea(area));
      } else {
        setMobileAreaText("");
      }
    }
  };

  const handleMobileConfirm = () => {
    if (mobileDrawingPoints.length < 3) return;

    // Close polygon by adding first point at end
    const closedPoints = [...mobileDrawingPoints, mobileDrawingPoints[0]];

    // Create GeoJSON feature
    const feature = {
      id: `mobile-polygon-${Date.now()}`,
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [closedPoints],
      },
      properties: {},
    };

    setDrawnFeature(feature);
    setMobileDrawingActive(false);
    setActivePanel("draw_form");
    clearMobileDrawingLayers();
  };

  const handleMobileCancelDrawing = () => {
    setMobileDrawingActive(false);
    setMobileDrawingPoints([]);
    setMobileAreaText("");
    clearMobileDrawingLayers();
  };

  const handleMobileDeleteAll = () => {
    setMobileDrawingPoints([]);
    setMobileAreaText("");
  };

  // Clear mobile drawing layers from map
  const clearMobileDrawingLayers = () => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "mobile-drawing-source";
    const lineLayerId = "mobile-drawing-line";
    const fillLayerId = "mobile-drawing-fill";
    const pointsLayerId = "mobile-drawing-points";

    try {
      if (map.getLayer(pointsLayerId)) map.removeLayer(pointsLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn("Error clearing mobile drawing layers:", e);
    }
  };

  // Calculate polygon area in square meters
  const calculatePolygonArea = (points: [number, number][]): number => {
    if (points.length < 3) return 0;

    // Earth radius in meters
    const R = 6371000;

    // Convert to radians and calculate using spherical excess formula
    let total = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = points[i][1] * (Math.PI / 180);
      const lat2 = points[j][1] * (Math.PI / 180);
      const lng1 = points[i][0] * (Math.PI / 180);
      const lng2 = points[j][0] * (Math.PI / 180);

      total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    return Math.abs((total * R * R) / 2);
  };

  // Format area to Thai units (ไร่ งาน ตารางวา)
  const formatArea = (sqMeters: number): string => {
    const sqWa = sqMeters / 4; // 1 ตารางวา = 4 ตารางเมตร
    const rai = Math.floor(sqWa / 400); // 1 ไร่ = 400 ตารางวา
    const ngan = Math.floor((sqWa % 400) / 100); // 1 งาน = 100 ตารางวา
    const wa = Math.round(sqWa % 100);

    return `${rai} ไร่ ${ngan} งาน ${wa} ตารางวา`;
  };

  const handleCancelDraw = () => {
    if (drawControl && drawnFeature) {
      drawControl.delete(drawnFeature.id);
    }
    setDrawnFeature(null);
    setDrawFormData({
      name: "",
      variety: "ข้าวหอมมะลิ",
      planting_season: "",
      planting_date: "",
    });
    setActivePanel(null);
  };

  const handleSaveField = async () => {
    if (!drawnFeature) {
      Swal.fire({
        title: t("confirm.warning"),
        text: t("draw.pleaseDrawFirst"),
        icon: "warning",
        confirmButtonText: t("action.ok"),
      });
      return;
    }

    if (!drawFormData.name.trim()) {
      Swal.fire({
        title: t("confirm.warning"),
        text: t("draw.enterFieldName"),
        icon: "warning",
        confirmButtonText: t("action.ok"),
      });
      return;
    }

    try {
      let planting_date = null;
      if (drawFormData.planting_date) {
        try {
          planting_date = new Date(drawFormData.planting_date).toISOString();
        } catch (error) {
          console.warn("Date format error:", error);
        }
      }

      const fieldData = {
        name: drawFormData.name.trim(),
        crop_type: drawFormData.variety,
        variety: drawFormData.variety,
        planting_season: drawFormData.planting_season || null,
        planting_date: planting_date,
        geometry: drawnFeature.geometry,
      };

      const newField = await createField(fieldData);

      // Capture thumbnail using Leaflet (reliable method)
      // Get center from the drawn geometry
      const coords = drawnFeature.geometry.coordinates[0];
      let sumLat = 0,
        sumLng = 0;
      for (const coord of coords) {
        sumLng += coord[0];
        sumLat += coord[1];
      }
      const center: [number, number] = [
        sumLat / coords.length,
        sumLng / coords.length,
      ];

      let dataUrl = await captureMapThumbnail({
        center: center,
        zoom: 15,
        geometry: {
          type: "Feature",
          geometry: drawnFeature.geometry,
          properties: {},
        },
      });

      // Fallback to procedural thumbnail if Leaflet capture failed
      if (!dataUrl) {
        dataUrl = generateFallbackThumbnail(newField.id);
      }

      if (dataUrl) {
        await saveThumbnail(newField.id, dataUrl);
      }

      // Reset
      if (drawControl && drawnFeature) {
        drawControl.delete(drawnFeature.id);
      }
      setDrawnFeature(null);
      setDrawFormData({
        name: "",
        variety: "ข้าวหอมมะลิ",
        planting_season: "",
        planting_date: "",
      });
      setActivePanel(null);

      // Fields will auto-restore via useEffect when state updates from createField

      Swal.fire({
        title: t("confirm.success"),
        text: t("draw.createSuccess"),
        icon: "success",
        confirmButtonText: t("action.ok"),
      });
    } catch (error: any) {
      console.error("บันทึกแปลงไม่สำเร็จ:", error);
      Swal.fire({
        title: t("confirm.error"),
        text:
          error.response?.data?.detail ||
          error.message ||
          t("draw.createFailed"),
        icon: "error",
        confirmButtonText: t("action.ok"),
      });
    }
  };

  const handleToggleLayer = (_layerId: string) => {
    // TODO: Implement layer toggle logic
  };

  const handleDarkModeToggle = (isDark: boolean) => {
    const newStyle = isDark ? "dark" : "light";
    handleStyleChange(newStyle);
  };

  // Render panel content
  const renderPanelContent = () => {
    switch (activePanel) {
      case "info":
        return <HealthPopup fieldId={selectedFieldId || undefined} />;
      case "analysis":
        return (
          <div className="p-4 text-center text-gray-500">
            <p className="font-medium">วิเคราะห์ VI</p>
            <p className="text-sm mt-2">
              กรุณาเลือกแปลงเพื่อเข้าหน้ารายละเอียด
            </p>
          </div>
        );
      case "filters":
        return (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2">วาดพื้นที่</h3>
            <button
              onClick={handleStartDrawing}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
            >
              เริ่มวาดพื้นที่
            </button>
          </div>
        );
      case "layers":
        return (
          <div className="p-4 text-center text-gray-500">
            <p className="font-medium">ชั้นข้อมูล</p>
            <p className="text-sm mt-2">ฟีเจอร์นี้กำลังพัฒนา</p>
          </div>
        );
      case "draw_form":
        return (
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("field.name")} *
              </label>
              <input
                type="text"
                value={drawFormData.name}
                onChange={(e) =>
                  setDrawFormData({ ...drawFormData, name: e.target.value })
                }
                placeholder={t("field.placeholder")}
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("farm.riceVariety")}
              </label>
              <select
                value={drawFormData.variety}
                onChange={(e) =>
                  setDrawFormData({ ...drawFormData, variety: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("farm.plantingSeason")}
              </label>
              <select
                value={drawFormData.planting_season}
                onChange={(e) =>
                  setDrawFormData({
                    ...drawFormData,
                    planting_season: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
              >
                <option value="">เลือกฤดูกาล</option>
                <option value="นาปี">นาปี - ปลูกฤดูฝน</option>
                <option value="นาปรัง">นาปรัง - ปลูกนอกฤดู</option>
                <option value="นาดำ">นาดำ</option>
                <option value="นาหว่าน">นาหว่าน</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("farm.plantingDate")}
              </label>
              <input
                type="date"
                value={drawFormData.planting_date}
                onChange={(e) =>
                  setDrawFormData({
                    ...drawFormData,
                    planting_date: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDraw}
                className="flex-1 p-3 rounded-lg border border-gray-300 text-gray-700 font-medium"
              >
                {t("action.cancel")}
              </button>
              <button
                onClick={handleSaveField}
                className="flex-1 p-3 rounded-lg bg-green-500 text-white font-medium"
              >
                {t("action.saveField")}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            {t("draw.selectTool")}
          </div>
        );
    }
  };

  const getPanelTitle = () => {
    switch (activePanel) {
      case "info":
        return "สุขภาพแปลง";
      case "analysis":
        return "วิเคราะห์ VI";
      case "filters":
        return "วาดรูปแปลง";
      case "layers":
        return "ชั้นข้อมูล";
      case "stats":
        return "สถิติ";
      case "draw_form":
        return "บันทึกแปลงใหม่";
      default:
        return "เครื่องมือ";
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Map Container - Must be first with lowest z-index */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {isDesktop ? (
        <>
          {/* Show About Page when currentPage is 'about' */}
          {currentPage === "about" ? (
            <MobileAboutPage
              onBack={() => setCurrentPage("health")}
              onMenuClick={() => setIsDesktopMenuOpen(true)}
              isDarkMode={currentStyle === "dark"}
              onDarkModeToggle={handleDarkModeToggle}
            />
          ) : (
            <>
              {/* Desktop Layout */}
              {/* Top Header - Same as Mobile */}
              <DesktopTopHeader
                onMenuClick={() => setIsDesktopMenuOpen(true)}
                isDarkMode={currentStyle === "dark"}
                onDarkModeToggle={handleDarkModeToggle}
              />

              {/* Floating Sidebar (Left) - Same as Mobile */}
              <DesktopFloatingSidebar
                onItemClick={handlePanelClick}
                activePanel={activePanel || undefined}
                map={mapRef.current}
                currentStyle={currentStyle}
                onStyleChange={handleStyleChange}
                draw={drawControl}
                onStartDrawing={handleStartDrawing}
                selectedFieldId={selectedFieldId}
                selectedFieldName={selectedFieldName}
                fieldsCount={fields.length}
                onOverlayChange={handleOverlayChange}
              />

              {/* Desktop Search Panel - same position as mobile */}
              <div
                style={{
                  position: "absolute",
                  top: "70px",
                  left: "10px",
                  zIndex: 1000,
                }}
              >
                <MobileSearchPanel map={mapRef.current} />
              </div>

              {/* Desktop Map Controls (Right) */}
              <DesktopMapControls map={mapRef.current} />

              {/* Desktop Save Field Popup */}
              <DesktopSaveFieldPopup
                isOpen={activePanel === "draw_form"}
                onClose={handleCancelDraw}
                onSave={async (formData) => {
                  if (!drawnFeature) return;

                  try {
                    let planting_date = null;
                    if (formData.planting_date) {
                      try {
                        planting_date = new Date(
                          formData.planting_date
                        ).toISOString();
                      } catch (error) {
                        console.warn("Date format error:", error);
                      }
                    }

                    const fieldData = {
                      name: formData.name.trim(),
                      crop_type: formData.variety,
                      variety: formData.variety,
                      planting_season: formData.planting_season || null,
                      planting_date: planting_date,
                      geometry: drawnFeature.geometry,
                    };

                    const newField = await createField(fieldData);

                    // Capture thumbnail using Leaflet (reliable method)
                    // Get center from the drawn geometry
                    const coords = drawnFeature.geometry.coordinates[0];
                    let sumLat = 0,
                      sumLng = 0;
                    for (const coord of coords) {
                      sumLng += coord[0];
                      sumLat += coord[1];
                    }
                    const center: [number, number] = [
                      sumLat / coords.length,
                      sumLng / coords.length,
                    ];

                    let dataUrl = await captureMapThumbnail({
                      center: center,
                      zoom: 15,
                      geometry: {
                        type: "Feature",
                        geometry: drawnFeature.geometry,
                        properties: {},
                      },
                    });

                    // Fallback to procedural thumbnail if Leaflet capture failed
                    if (!dataUrl) {
                      dataUrl = generateFallbackThumbnail(newField.id);
                    }

                    if (dataUrl) {
                      await saveThumbnail(newField.id, dataUrl);
                    }

                    // Reset
                    if (drawControl && drawnFeature) {
                      drawControl.delete(drawnFeature.id);
                    }
                    setDrawnFeature(null);
                    setDrawFormData({
                      name: "",
                      variety: "ข้าวหอมมะลิ",
                      planting_season: "",
                      planting_date: "",
                    });
                    setActivePanel(null);

                    // Fields will auto-restore via useEffect when state updates from createField

                    Swal.fire({
                      title: "สำเร็จ",
                      text: "สร้างแปลงสำเร็จ!",
                      icon: "success",
                      confirmButtonText: "ตกลง",
                    });
                  } catch (error: any) {
                    console.error("บันทึกแปลงไม่สำเร็จ:", error);
                    Swal.fire({
                      title: "เกิดข้อผิดพลาด",
                      text:
                        error.response?.data?.detail ||
                        error.message ||
                        "สร้างแปลงไม่สำเร็จ",
                      icon: "error",
                      confirmButtonText: "ตกลง",
                    });
                    throw error; // Re-throw to let popup handle loading state
                  }
                }}
              />

              {/* Drawing Mode Banner */}
              <DesktopDrawingBanner
                isVisible={isDrawingMode}
                onCancel={handleCancelDrawingMode}
                areaText={desktopAreaText}
                areaCentroid={desktopAreaCentroid}
              />
            </>
          )}

          {/* Desktop Menu Sidebar - Always render */}
          <DesktopMenuSidebar
            isOpen={isDesktopMenuOpen}
            onClose={() => setIsDesktopMenuOpen(false)}
            activeItem={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              setIsDesktopMenuOpen(false);
            }}
            isDarkMode={currentStyle === "dark"}
          />
        </>
      ) : (
        <>
          {/* Mobile Layout */}
          {/* Top Header - hide when drawing */}
          {!mobileDrawingActive && (
            <TopHeader
              onMenuClick={handleMenuClick}
              isDarkMode={currentStyle === "dark"}
              onDarkModeToggle={handleDarkModeToggle}
            />
          )}

          {/* Mobile Search Panel - hide when drawing */}
          {!mobileDrawingActive && (
            <div
              style={{
                position: "absolute",
                top: "70px",
                left: "10px",
                zIndex: 1000,
              }}
            >
              <MobileSearchPanel map={mapRef.current} />
            </div>
          )}

          {/* Floating Sidebar (Left) - hide when drawing */}
          {!mobileDrawingActive && (
            <FloatingSidebar
              onItemClick={handlePanelClick}
              activePanel={activePanel || undefined}
              map={mapRef.current}
              currentStyle={currentStyle}
              onStyleChange={handleStyleChange}
              draw={drawControl}
              onStartDrawing={handleStartDrawing}
              selectedFieldId={selectedFieldId}
              selectedFieldName={selectedFieldName}
              fieldsCount={fields.length}
              onOverlayChange={handleOverlayChange}
            />
          )}

          {/* Map Controls (Right) - always visible */}
          <MapControls map={mapRef.current} />

          {/* Bottom Sheet - exclude draw_form */}
          <BottomSheet
            isOpen={activePanel !== null && activePanel !== "draw_form"}
            onClose={() => setActivePanel(null)}
            title={getPanelTitle()}
            height="half"
          >
            {renderPanelContent()}
          </BottomSheet>

          {/* Mobile Save Field Popup - for draw_form */}
          <DesktopSaveFieldPopup
            isOpen={activePanel === "draw_form"}
            onClose={handleCancelDraw}
            isMobile={true}
            onSave={async (formData) => {
              if (!drawnFeature) return;
              try {
                let planting_date = null;
                if (formData.planting_date) {
                  planting_date = new Date(
                    formData.planting_date
                  ).toISOString();
                }

                const fieldData = {
                  name: formData.name.trim(),
                  crop_type: formData.variety,
                  variety: formData.variety,
                  planting_season: formData.planting_season || null,
                  planting_date: planting_date,
                  geometry: drawnFeature.geometry,
                };

                const newField = await createField(fieldData);

                // Capture thumbnail
                const coords = drawnFeature.geometry.coordinates[0];
                let sumLat = 0,
                  sumLng = 0;
                for (const coord of coords) {
                  sumLng += coord[0];
                  sumLat += coord[1];
                }
                const center: [number, number] = [
                  sumLat / coords.length,
                  sumLng / coords.length,
                ];

                let dataUrl = await captureMapThumbnail({
                  center: center,
                  zoom: 15,
                  geometry: {
                    type: "Feature",
                    geometry: drawnFeature.geometry,
                    properties: {},
                  },
                });

                if (!dataUrl) {
                  dataUrl = generateFallbackThumbnail(newField.id);
                }

                if (dataUrl) {
                  await saveThumbnail(newField.id, dataUrl);
                }

                setDrawnFeature(null);
                setActivePanel(null);
                await refreshFields();
                restoreFields();

                Swal.fire({
                  title: t("confirm.success"),
                  text: t("draw.createSuccess"),
                  icon: "success",
                  confirmButtonText: t("action.ok"),
                });
              } catch (error: any) {
                console.error("บันทึกแปลงไม่สำเร็จ:", error);
                Swal.fire({
                  title: t("confirm.error"),
                  text:
                    error.response?.data?.detail ||
                    error.message ||
                    t("draw.createFailed"),
                  icon: "error",
                  confirmButtonText: t("action.ok"),
                });
                throw error;
              }
            }}
          />

          {/* Mobile Sidebar */}
          <MobileSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeItem={currentPage}
            onNavigate={handleSidebarNavigate}
            isDarkMode={currentStyle === "dark"}
          />

          {/* Mobile About Page */}
          {currentPage === "about" && (
            <MobileAboutPage
              onBack={() => setCurrentPage("health")}
              onMenuClick={() => setIsSidebarOpen(true)}
              isDarkMode={currentStyle === "dark"}
              onDarkModeToggle={handleDarkModeToggle}
            />
          )}

          {/* Mobile Drawing Mode */}
          <MobileDrawingMode
            isActive={mobileDrawingActive}
            onCancel={handleMobileCancelDrawing}
            onAddPoint={handleMobileAddPoint}
            onUndo={handleMobileUndo}
            onConfirm={handleMobileConfirm}
            onDeleteAll={handleMobileDeleteAll}
            nodeCount={mobileDrawingPoints.length}
            areaText={mobileAreaText}
            areaCentroid={mobileAreaCentroid}
          />

          {/* Drawing Toast Popup */}
          <DrawingToast
            isVisible={showDrawingToast}
            onClose={() => setShowDrawingToast(false)}
          />
        </>
      )}
    </div>
  );
};

export default MobileMapPage;
