/**
 * Capture Leaflet map with all overlays (polygons, polylines, markers)
 * Uses a direct canvas approach that avoids CSS parsing issues
 */
export async function captureMapWithDomToImage(mapContainer: HTMLElement): Promise<string> {
  try {
    // Wait for tiles and overlays to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a new canvas to composite the map
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Get the map container dimensions
    const rect = mapContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find and render the Leaflet tile canvas
    const tileCanvas = mapContainer.querySelector('canvas') as HTMLCanvasElement;
    if (tileCanvas && tileCanvas.width > 0 && tileCanvas.height > 0) {
      try {
        ctx.drawImage(tileCanvas, 0, 0);
      } catch (e) {
        console.warn('Could not draw tile canvas:', e);
      }
    }

    // Find and render all SVG overlays (polygons, polylines, markers)
    const svgElements = mapContainer.querySelectorAll('svg');
    for (const svgElement of svgElements) {
      try {
        const svgRect = svgElement.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        
        const x = svgRect.left - containerRect.left;
        const y = svgRect.top - containerRect.top;
        const width = svgRect.width;
        const height = svgRect.height;

        // Serialize SVG to string
        const svgString = new XMLSerializer().serializeToString(svgElement);
        
        // Create a blob from the SVG string
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Create an image from the SVG blob
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              ctx.drawImage(img, x, y, width, height);
              URL.revokeObjectURL(url);
              resolve();
            } catch (e) {
              URL.revokeObjectURL(url);
              reject(e);
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG'));
          };
          img.src = url;
        });
      } catch (e) {
        console.warn('Could not draw SVG overlay:', e);
      }
    }

    // Convert canvas to PNG data URL
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    return dataUrl;
  } catch (error) {
    console.error('Error capturing map:', error);
    throw error;
  }
}

/**
 * Alternative: Just capture the Leaflet canvas directly
 */
export async function captureMapWithDomToImageCanvas(mapContainer: HTMLElement): Promise<string> {
  try {
    // Wait for tiles to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the Leaflet canvas element
    const leafletCanvas = mapContainer.querySelector('canvas') as HTMLCanvasElement;
    
    if (leafletCanvas && leafletCanvas.width > 0 && leafletCanvas.height > 0) {
      // Try to get the canvas data directly
      try {
        return leafletCanvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Could not export canvas directly:', e);
        // Fall back to full capture
        return captureMapWithDomToImage(mapContainer);
      }
    }

    // Fallback to full container capture
    return captureMapWithDomToImage(mapContainer);
  } catch (error) {
    console.error('Error capturing map with canvas:', error);
    throw error;
  }
}
