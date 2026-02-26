import L from "leaflet";
import leafletImage from "leaflet-image";

/**
 * Capture a Leaflet map as a data URL using leaflet-image library.
 * This is the most reliable method for capturing Leaflet maps with tiles.
 */
export async function captureLeafletMapAsDataUrl(map: L.Map): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      leafletImage(map, (err: Error | null, canvas: HTMLCanvasElement) => {
        if (err) {
          console.error("leaflet-image capture failed:", err);
          reject(err);
          return;
        }

        try {
          const dataUrl = canvas.toDataURL("image/png");
          resolve(dataUrl);
        } catch (e) {
          console.error("Failed to convert canvas to data URL:", e);
          reject(e);
        }
      });
    } catch (e) {
      console.error("leaflet-image error:", e);
      reject(e);
    }
  });
}
