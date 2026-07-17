/**
 * Compress an image file client-side before upload
 * Resizes to max dimension 1200px and quality 0.7
 */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Draw to canvas and compress
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with quality 0.7
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            // Fallback to original
            resolve(file);
          }
        },
        "image/jpeg",
        0.7
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memproses gambar"));
    };

    img.src = url;
  });
}
