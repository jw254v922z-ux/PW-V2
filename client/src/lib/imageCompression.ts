/**
 * Compress a base64 PNG image to JPEG format for better PDF compatibility
 * @param base64Png - Base64 encoded PNG image data
 * @param quality - JPEG quality (0-1, default 0.8)
 * @returns Promise<string> - Base64 encoded JPEG image data
 */
export async function compressImageToJpeg(
  base64Png: string,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      img.onload = () => {
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the image source
      img.src = base64Png;
    } catch (error) {
      reject(error);
    }
  });
}
