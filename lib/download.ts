/**
 * Downloads a remote file as a Blob with a guaranteed filename and extension.
 */
export async function downloadFileWithExtension(url: string, defaultName: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch file");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    let filename = defaultName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!filename.includes(".")) {
      const type = blob.type.toLowerCase();
      if (type.includes("pdf")) filename += ".pdf";
      else if (type.includes("png")) filename += ".png";
      else if (type.includes("jpeg") || type.includes("jpg")) filename += ".jpg";
      else if (type.includes("webp")) filename += ".webp";
      else if (type.includes("word") || type.includes("doc")) filename += ".docx";
      else filename += ".pdf";
    }

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (e) {
    // Fallback: open in new window
    window.open(url, "_blank");
  }
}

