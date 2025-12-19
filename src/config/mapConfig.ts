// MapLibre configuration with CARTO and Maptiler basemaps
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || "rsmMjWx8nNEAsnCHmxAJ";

export const mapStyles = {
  // CARTO Positron (Light)
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  
  // CARTO Dark Matter (Dark)
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  
  // CARTO Voyager
  voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  
  // Maptiler Streets
  streets: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`,
  
  // Satellite (Esri, Maxar, Earthstar Geographics)
  satellite: {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        attribution: "Esri, Maxar, Earthstar Geographics",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  } as any,
  
  // OpenStreetMap (Fallback)
  osm: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap Contributors",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  } as any,
};

export const defaultMapConfig = {
  center: [100.5231, 13.7465] as [number, number], // Bangkok
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

export const thailandBounds: [[number, number], [number, number]] = [
  [97.3, 5.6], // Southwest
  [105.6, 20.5], // Northeast
];
