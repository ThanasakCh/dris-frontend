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

/**
 * Generate a procedural fallback thumbnail
 */
export function generateFallbackThumbnail(fieldId: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d")!;

  // Generate unique color from fieldId
  const hash = fieldId.split("").reduce((a, b) => {
    a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
    return a < 0 ? a + 0x100000000 : a;
  }, 0);

  const hue = hash % 360;
  const sat = 40 + (hash % 30);
  const light = 55 + (hash % 20);

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 320, 240);
  gradient.addColorStop(0, `hsl(${hue}, ${sat}%, ${light}%)`);
  gradient.addColorStop(1, `hsl(${hue + 40}, ${sat}%, ${light - 15}%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 320, 240);

  // Add texture pattern
  ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light - 25}%, 0.2)`;
  for (let i = 0; i < 30; i++) {
    const x = (hash + i * 123) % 320;
    const y = (hash + i * 456) % 240;
    const size = 3 + ((hash + i) % 12);
    ctx.fillRect(x, y, size, size);
  }

  // Add field indicator border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 280, 200);

  // Add emoji
  ctx.font = "48px Arial";
  ctx.fillText("🌾", 130, 130);

  // Add field text
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 16px Arial";
  ctx.fillText("แปลงเกษตร", 115, 175);

  return canvas.toDataURL("image/jpeg", 0.85);
}
