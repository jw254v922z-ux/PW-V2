/**
 * Capture Leaflet map using leaflet-image library + SVG overlay compositing
 * This properly handles tiles, overlays, and CORS issues
 */
export async function captureMapWithDomToImage(mapContainer: HTMLElement): Promise<string> {
  try {
    // Wait for tiles and overlays to fully render
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get the Leaflet map instance from global window object
    const mapInstance = (window as any).leafletMap;
    
    if (!mapInstance) {
      console.warn('Could not find global Leaflet map instance');
      return await fallbackMapCapture(mapContainer);
    }

    console.log('Found Leaflet map instance, using leaflet-image with SVG overlay composite');

    // Import leaflet-image
    const leafletImage = (await import('leaflet-image')).default;
    
    // Step 1: Use leaflet-image to export the base map (tiles)
    const baseCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      try {
        leafletImage(mapInstance, (err: Error | null, canvas: HTMLCanvasElement) => {
          if (err) {
            console.warn('leaflet-image failed:', err);
            reject(err);
            return;
          }
          resolve(canvas);
        });
      } catch (e) {
        console.error('Error calling leaflet-image:', e);
        reject(e);
      }
    });

    console.log('Base map captured via leaflet-image');

    // Step 2: Composite SVG overlays on top of the base canvas
    const finalCanvas = await compositeSVGOverlays(baseCanvas, mapContainer);
    
    const dataUrl = finalCanvas.toDataURL('image/png', 0.95);
    console.log('Map capture complete with SVG overlays, data URL length:', dataUrl.length);
    return dataUrl;
    
  } catch (error) {
    console.error('Error capturing map with leaflet-image:', error);
    // Fall back to simple method
    return await fallbackMapCapture(mapContainer);
  }
}

/**
 * Composite SVG overlays (polygons, polylines) on top of the base canvas
 */
async function compositeSVGOverlays(baseCanvas: HTMLCanvasElement, mapContainer: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Set canvas size to match base canvas
  canvas.width = baseCanvas.width;
  canvas.height = baseCanvas.height;

  // Draw the base map (tiles) first
  ctx.drawImage(baseCanvas, 0, 0);
  console.log('Drew base map tiles to composite canvas');

  const containerRect = mapContainer.getBoundingClientRect();

  // Capture all SVG overlays (polygons, polylines, markers) from Leaflet overlay panes
  const overlayPane = mapContainer.querySelector('.leaflet-overlay-pane');
  let svgElements: NodeListOf<SVGElement>;
  
  if (overlayPane) {
    svgElements = overlayPane.querySelectorAll('svg');
    console.log(`Found ${svgElements.length} SVG elements in overlay pane`);
  } else {
    svgElements = mapContainer.querySelectorAll('svg');
    console.log(`Found ${svgElements.length} SVG elements in map container`);
  }

  for (const svgElement of svgElements) {
    try {
      const svgRect = svgElement.getBoundingClientRect();
      const x = svgRect.left - containerRect.left;
      const y = svgRect.top - containerRect.top;
      const width = svgRect.width;
      const height = svgRect.height;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            ctx.drawImage(img, x, y, width, height);
            URL.revokeObjectURL(url);
            console.log(`Composited SVG at (${x}, ${y}) with size ${width}x${height}`);
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
      console.warn('Could not composite SVG overlay:', e);
    }
  }

  return canvas;
}

/**
 * Fallback: Composite canvas and SVG elements directly
 */
async function fallbackMapCapture(mapContainer: HTMLElement): Promise<string> {
  console.log('Using fallback map capture method');
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const rect = mapContainer.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const containerRect = mapContainer.getBoundingClientRect();

  // Try to find and draw all canvas elements (tiles)
  const canvasElements = mapContainer.querySelectorAll('canvas');
  console.log(`Fallback: Found ${canvasElements.length} canvas elements`);

  for (const canvasElement of canvasElements) {
    try {
      const canvasRect = canvasElement.getBoundingClientRect();
      const x = canvasRect.left - containerRect.left;
      const y = canvasRect.top - containerRect.top;

      if (canvasElement.width > 0 && canvasElement.height > 0) {
        try {
          ctx.drawImage(canvasElement, x, y);
          console.log(`Drew canvas at (${x}, ${y}) with size ${canvasElement.width}x${canvasElement.height}`);
        } catch (e) {
          // Canvas might have CORS restrictions
          console.warn('Could not draw canvas (CORS?):', e);
        }
      }
    } catch (e) {
      console.warn('Error processing canvas element:', e);
    }
  }

  // Capture all SVG overlays (polygons, polylines, markers)
  const svgElements = mapContainer.querySelectorAll('svg');
  console.log(`Fallback: Found ${svgElements.length} SVG elements`);

  for (const svgElement of svgElements) {
    try {
      const svgRect = svgElement.getBoundingClientRect();
      const x = svgRect.left - containerRect.left;
      const y = svgRect.top - containerRect.top;
      const width = svgRect.width;
      const height = svgRect.height;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            ctx.drawImage(img, x, y, width, height);
            URL.revokeObjectURL(url);
            console.log(`Drew SVG at (${x}, ${y}) with size ${width}x${height}`);
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

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  console.log('Fallback map capture complete, data URL length:', dataUrl.length);
  return dataUrl;
}

/**
 * Alternative fallback method
 */
export async function captureMapWithDomToImageCanvas(mapContainer: HTMLElement): Promise<string> {
  try {
    return await captureMapWithDomToImage(mapContainer);
  } catch (error) {
    console.error('Error capturing map with canvas:', error);
    throw error;
  }
}
