/**
 * Downloads a remote file with guaranteed filename, mime-type and extension.
 * Routes through the backend media stream proxy to bypass any Cloudinary ACL 401s or CORS limits.
 */
export async function downloadFileWithExtension(url: string, defaultName: string) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    let filename = defaultName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!filename.includes(".")) {
      filename += ".pdf";
    }

    const streamUrl = `${apiBase}/media/stream?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`;

    const res = await fetch(streamUrl);
    if (!res.ok) {
      // Fallback direct fetch
      const directRes = await fetch(url);
      if (!directRes.ok) throw new Error("Fetch failed");
      const blob = await directRes.blob();
      triggerBlobDownload(blob, filename);
      return;
    }

    const blob = await res.blob();
    triggerBlobDownload(blob, filename);
  } catch (e) {
    window.open(url, "_blank");
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

/**
 * Returns a guaranteed viewable URL for documents and PDFs.
 * If Cloudinary raw PDF, transforms to image rendering or backend streaming proxy.
 */
export function getDocumentPreviewUrl(url: string): string {
  if (!url) return "";
  if (url.includes("cloudinary.com") && url.includes("/raw/upload/") && url.toLowerCase().endsWith(".pdf")) {
    return url.replace("/raw/upload/", "/image/upload/").replace(/\.pdf$/i, ".png");
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${apiBase}/media/stream?url=${encodeURIComponent(url)}`;
}
