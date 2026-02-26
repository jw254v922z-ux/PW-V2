import domtoimage from 'dom-to-image';

/**
 * Capture Leaflet map with all overlays (polygons, polylines, markers) using dom-to-image
 * This library has better SVG support than html2canvas
 */
export async function captureMapWithDomToImage(mapContainer: HTMLElement): Promise<string> {
  try {
    // Ensure all tiles and overlays are fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use dom-to-image to capture the entire map container
    // This respects SVG rendering better than html2canvas
    const dataUrl = await domtoimage.toPng(mapContainer, {
      cacheBust: true,
      pixelRatio: 2, // Higher quality
      quality: 0.95,
    });

    return dataUrl;
  } catch (error) {
    console.error('Error capturing map with dom-to-image:', error);
    throw error;
  }
}

/**
 * Alternative: Use canvas rendering for better performance
 */
export async function captureMapWithDomToImageCanvas(mapContainer: HTMLElement): Promise<string> {
  try {
    // Ensure all tiles and overlays are fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use canvas rendering which is faster
    const dataUrl = await domtoimage.toCanvas(mapContainer, {
      cacheBust: true,
      pixelRatio: 2,
    }).then(canvas => canvas.toDataURL('image/png'));

    return dataUrl;
  } catch (error) {
    console.error('Error capturing map with dom-to-image canvas:', error);
    throw error;
  }
}
