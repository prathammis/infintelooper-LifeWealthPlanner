import { PlanState } from '../types';

function downloadBlob(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);

  link.href = objectUrl;
  link.download = fileName;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function downloadText(fileName: string, content: string, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([content], { type }), fileName);
}

export function downloadSvg(svgElement: SVGSVGElement | null, fileName: string) {
  if (!svgElement) {
    return;
  }

  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const source = new XMLSerializer().serializeToString(clone);
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), fileName);
}

export async function downloadSvgAsPng(svgElement: SVGSVGElement | null, fileName: string) {
  if (!svgElement) {
    return;
  }

  const bounds = svgElement.getBoundingClientRect();
  const source = new XMLSerializer().serializeToString(svgElement);
  const image = new Image();
  const canvas = document.createElement('canvas');
  const scale = window.devicePixelRatio || 2;

  canvas.width = Math.max(1, Math.round(bounds.width * scale));
  canvas.height = Math.max(1, Math.round(bounds.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const encoded = window.btoa(unescape(encodeURIComponent(source)));
  const imageSource = `data:image/svg+xml;base64,${encoded}`;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to rasterize SVG'));
    image.src = imageSource;
  });

  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.fillStyle = '#08111f';
  context.fillRect(0, 0, bounds.width, bounds.height);
  context.drawImage(image, 0, 0, bounds.width, bounds.height);

  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (png) {
    downloadBlob(png, fileName);
  }
}

export function encodePlan(plan: PlanState) {
  return window.btoa(unescape(encodeURIComponent(JSON.stringify(plan))));
}

export function decodePlan(hash: string): PlanState | null {
  try {
    const cleaned = hash.replace(/^#/, '');
    if (!cleaned) {
      return null;
    }

    return JSON.parse(decodeURIComponent(escape(window.atob(cleaned))));
  } catch {
    return null;
  }
}
