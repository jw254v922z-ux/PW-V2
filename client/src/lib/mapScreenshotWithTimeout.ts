import html2canvas from 'html2canvas';

export async function captureMapScreenshotWithTimeout(timeoutMs: number = 3000): Promise<string | undefined> {
  try {
    const storedScreenshot = sessionStorage.getItem('mapScreenshot');
    console.log('[PDF] Checking for stored map screenshot:', !!storedScreenshot);
    if (storedScreenshot) {
      console.log('[PDF] Found stored map screenshot, using it');
      sessionStorage.removeItem('mapScreenshot');
      return storedScreenshot;
    }
    
    // Return undefined immediately if map not found
    const mapElement = document.querySelector('[data-map-container]');
    if (!mapElement) {
      console.log('[PDF] Map element not found - PDF will be generated without map screenshot');
      return undefined;
    }
    
    // Capture with timeout
    console.log('[PDF] Starting map screenshot capture with timeout:', timeoutMs);
    return await Promise.race([
      (async () => {
        const canvas = await html2canvas(mapElement as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        console.log('[PDF] Map screenshot captured successfully');
        return canvas.toDataURL('image/png');
      })(),
      new Promise<undefined>(resolve => setTimeout(() => {
        console.log('[PDF] Map screenshot capture timeout after', timeoutMs, 'ms, proceeding without map');
        resolve(undefined);
      }, timeoutMs))
    ]);
  } catch (error) {
    console.error('[PDF] Failed to capture map screenshot:', error);
    return undefined;
  }
}
