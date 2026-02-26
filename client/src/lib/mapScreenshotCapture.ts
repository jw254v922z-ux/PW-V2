import html2canvas from 'html2canvas';

/**
 * Capture a Leaflet map container as a data URL using html2canvas.
 * This captures everything visible including tiles, polygons, polylines, and markers.
 * Removes the black border by capturing only the map canvas content.
 */
export async function captureMapScreenshot(mapContainer: HTMLDivElement): Promise<string> {
  try {
    // Wait for tiles to load
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find the actual map canvas/content, excluding controls
    const mapContent = mapContainer.querySelector('.leaflet-container') as HTMLElement;
    const targetElement = mapContent || mapContainer;

    const canvas = await html2canvas(targetElement, {
      backgroundColor: "#ffffff",
      scale: 1.5, // Reduced from 2 for better quality and smaller file size
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 5000,
      windowHeight: targetElement.scrollHeight || 600,
      windowWidth: targetElement.scrollWidth || 800,
    });

    // Convert to JPEG to avoid transparency and black borders
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    return dataUrl;
  } catch (error) {
    console.error("Map screenshot capture failed:", error);
    throw error;
  }
}

export async function captureMapScreenshotWithTimeout(
  timeoutMs: number = 5000
): Promise<string | undefined> {
  try {
    // Check for stored screenshot first
    const storedScreenshot = sessionStorage.getItem('mapScreenshot');
    if (storedScreenshot) {
      sessionStorage.removeItem('mapScreenshot');
      return storedScreenshot;
    }

    // Find map element
    const mapElement = document.querySelector('[data-map-container]');
    if (!mapElement) {
      return undefined;
    }

    // Create timeout promise
    const timeoutPromise = new Promise<undefined>((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, timeoutMs);
    });

    // Create capture promise
    const capturePromise = html2canvas(mapElement as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    }).then(canvas => canvas.toDataURL('image/png'));

    // Race them
    return Promise.race([capturePromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to capture map screenshot:', error);
    return undefined;
  }
}
