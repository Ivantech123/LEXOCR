import { ImageFile } from '../types';

export const convertPdfToImages = async (file: File): Promise<ImageFile[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageImages: ImageFile[] = [];

  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    // Reduced scale from 2.0 to 1.5 to optimize payload size and prevent XHR errors
    // while maintaining sufficient quality for OCR.
    const scale = 1.5; 
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const base64Full = canvas.toDataURL('image/jpeg', 0.85);
      const base64Data = base64Full.split(',')[1];

      pageImages.push({
        id: `pdf-${file.name}-page-${i}-${Date.now()}`,
        previewUrl: base64Full,
        base64: base64Data,
        mimeType: 'image/jpeg',
        pageIndex: i
      });
    }
  }

  return pageImages;
};