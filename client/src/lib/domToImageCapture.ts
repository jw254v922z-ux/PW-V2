/**
 * Capture Leaflet map with all overlays (polygons, polylines, markers)
 * Uses a simple approach: render the map to a canvas, then convert to PNG
 */
export async function captureMapWithDomToImage(mapContainer: HTMLElement): Promise<string> {
  try {
    // Ensure all tiles and overlays are fully rendered
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const rect = mapContainer.getBoundingClientRect();
    
    // Set canvas dimensions (2x for higher quality)
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale the context for higher DPI
    ctx.scale(2, 2);

    // Draw all visible elements from the map container
    await drawElementsToCanvas(ctx, mapContainer);

    // Return as PNG data URL
    return canvas.toDataURL('image/png', 0.95);
  } catch (error) {
    console.error('Error capturing map:', error);
    throw error;
  }
}

/**
 * Draw DOM elements to canvas, handling SVG and other elements
 */
async function drawElementsToCanvas(ctx: CanvasRenderingContext2D, element: HTMLElement): Promise<void> {
  const children = element.children;
  
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    const style = window.getComputedStyle(child);
    
    // Skip hidden elements
    if (style.display === 'none' || style.visibility === 'hidden') {
      continue;
    }

    const rect = child.getBoundingClientRect();
    const parentRect = element.getBoundingClientRect();
    
    const x = rect.left - parentRect.left;
    const y = rect.top - parentRect.top;
    const width = rect.width;
    const height = rect.height;

    // Handle SVG elements (polygons, polylines, markers)
    if (child.tagName.toLowerCase() === 'svg') {
      try {
        const svgString = new XMLSerializer().serializeToString(child);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              ctx.drawImage(img, x, y, width, height);
              URL.revokeObjectURL(url);
              resolve();
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG image'));
          };
          img.src = url;
        });
      } catch (e) {
        console.warn('Failed to draw SVG element:', e);
      }
    }
    // Handle canvas elements (Leaflet tile layers)
    else if (child.tagName.toLowerCase() === 'canvas') {
      try {
        const childCanvas = child as HTMLCanvasElement;
        ctx.drawImage(childCanvas, x, y, width, height);
      } catch (e) {
        console.warn('Failed to draw canvas element:', e);
      }
    }
    // Recursively handle nested elements
    else if (child.children.length > 0) {
      await drawElementsToCanvas(ctx, child);
    }
  }
}

/**
 * Alternative: Use canvas rendering for better performance
 */
export async function captureMapWithDomToImageCanvas(mapContainer: HTMLElement): Promise<string> {
  try {
    // Ensure all tiles and overlays are fully rendered
    await new Promise(resolve => setTimeout(resolve, 800));

    // Try to find Leaflet canvas element first
    const leafletCanvas = mapContainer.querySelector('canvas') as HTMLCanvasElement;
    
    if (leafletCanvas && leafletCanvas.width > 0 && leafletCanvas.height > 0) {
      return leafletCanvas.toDataURL('image/png');
    }

    // Fallback to full container capture
    return captureMapWithDomToImage(mapContainer);
  } catch (error) {
    console.error('Error capturing map with canvas:', error);
    throw error;
  }
}
