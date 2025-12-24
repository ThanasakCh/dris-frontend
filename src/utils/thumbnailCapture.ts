import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CaptureOptions {
  center: [number, number]; // [lat, lng]
  zoom: number;
  geometry?: any; // GeoJSON geometry for bounds
  width?: number;
  height?: number;
}

/**
 * Capture a map thumbnail using Leaflet in a hidden container.
 * This works reliably because leaflet-image handles tile loading properly.
 * The polygon is drawn manually on canvas since leaflet-image doesn't capture vector layers.
 */
export async function captureMapThumbnail(
  options: CaptureOptions
): Promise<string | null> {
  const { center, zoom, geometry, width = 320, height = 240 } = options;

  return new Promise((resolve) => {
    // Create hidden container
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: -9999px;
      width: ${width}px;
      height: ${height}px;
      visibility: hidden;
      pointer-events: none;
    `;
    document.body.appendChild(container);

    try {
      // Create Leaflet map
      const map = L.map(container, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add satellite layer (same as visible map)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(map);

      // Store polygon layer for bounds calculation
      let polygonLayer: L.GeoJSON | null = null;
      
      // Add polygon if geometry provided (for fitBounds only, we'll draw it manually)
      if (geometry) {
        polygonLayer = L.geoJSON(geometry, {
          style: { opacity: 0, fillOpacity: 0 }, // Invisible - we draw manually
        }).addTo(map);

        // Fit to polygon bounds - no padding for maximum zoom
        map.fitBounds(polygonLayer.getBounds(), { padding: [0, 0] });
      }

      // Wait for tiles to load, then capture
      const captureImage = async () => {
        try {
          const leafletImage = (await import("leaflet-image")) as any;

          leafletImage.default(
            map,
            (err: any, canvas: HTMLCanvasElement) => {
              if (err) {
                console.error("leaflet-image error:", err);
                map.remove();
                document.body.removeChild(container);
                resolve(null);
                return;
              }

              // Create thumbnail canvas
              const thumbnailCanvas = document.createElement("canvas");
              thumbnailCanvas.width = 320;
              thumbnailCanvas.height = 240;
              const ctx = thumbnailCanvas.getContext("2d")!;
              
              // Draw base map
              ctx.drawImage(canvas, 0, 0, 320, 240);

              // Draw polygon manually if geometry exists
              if (geometry && geometry.geometry) {
                const coords = geometry.geometry.coordinates[0];
                if (coords && coords.length > 0) {
                  // Convert geo coordinates to pixel coordinates
                  const pixelCoords = coords.map((coord: [number, number]) => {
                    const point = map.latLngToContainerPoint([coord[1], coord[0]]);
                    // Scale to thumbnail size
                    return {
                      x: (point.x / width) * 320,
                      y: (point.y / height) * 240
                    };
                  });

                  // Draw yellow fill
                  ctx.beginPath();
                  ctx.moveTo(pixelCoords[0].x, pixelCoords[0].y);
                  for (let i = 1; i < pixelCoords.length; i++) {
                    ctx.lineTo(pixelCoords[i].x, pixelCoords[i].y);
                  }
                  ctx.closePath();
                  ctx.fillStyle = "rgba(253, 224, 71, 0.35)"; // #fde047 with 35% opacity
                  ctx.fill();

                  // Draw red border
                  ctx.beginPath();
                  ctx.moveTo(pixelCoords[0].x, pixelCoords[0].y);
                  for (let i = 1; i < pixelCoords.length; i++) {
                    ctx.lineTo(pixelCoords[i].x, pixelCoords[i].y);
                  }
                  ctx.closePath();
                  ctx.strokeStyle = "#ef4444"; // Red
                  ctx.lineWidth = 3;
                  ctx.stroke();
                }
              }

              // Cleanup
              map.remove();
              document.body.removeChild(container);

              const dataUrl = thumbnailCanvas.toDataURL("image/jpeg", 0.85);
              resolve(dataUrl);
            }
          );
        } catch (importError) {
          console.error("Failed to import leaflet-image:", importError);
          map.remove();
          document.body.removeChild(container);
          resolve(null);
        }
      };

      // Wait for map to be ready, then wait for tiles
      map.whenReady(() => {
        // Give tiles time to load
        setTimeout(captureImage, 1500);
      });
    } catch (error) {
      console.error("Failed to create Leaflet map for capture:", error);
      document.body.removeChild(container);
      resolve(null);
    }
  });
}


