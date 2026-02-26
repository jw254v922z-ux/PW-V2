/**
 * Capture Leaflet map using leaflet-image library
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

    console.log('Found Leaflet map instance, using leaflet-image');

    // Import leaflet-image
    const leafletImage = (await import('leaflet-image')).default;
    
    // Use leaflet-image to export the map
    return new Promise((resolve, reject) => {
      try {
        leafletImage(mapInstance, (err: Error | null, canvas: HTMLCanvasElement) => {
          if (err) {
            console.warn('leaflet-image failed:', err);
            fallbackMapCapture(mapContainer).then(resolve).catch(reject);
            return;
          }

          try {
            const dataUrl = canvas.toDataURL('image/png', 0.95);
            console.log('Map capture complete via leaflet-image, data URL length:', dataUrl.length);
            resolve(dataUrl);
          } catch (e) {
            console.error('Error converting canvas to data URL:', e);
            reject(e);
          }
        });
      } catch (e) {
        console.error('Error calling leaflet-image:', e);
        fallbackMapCapture(mapContainer).then(resolve).catch(reject);
      }
    });
  } catch (error) {
    console.error('Error capturing map:', error);
    // Fall back to simple method
    return await fallbackMapCapture(mapContainer);
  }
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
