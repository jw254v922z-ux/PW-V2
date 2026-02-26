import html2canvas from 'html2canvas';

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
