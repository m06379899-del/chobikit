import { zipSync, type Zippable } from "fflate";

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function zipAndDownload(
  files: { name: string; blob: Blob }[],
  zipName: string,
): Promise<void> {
  const entries: Zippable = {};
  for (const file of files) {
    entries[file.name] = new Uint8Array(await file.blob.arrayBuffer());
  }
  const zipped = zipSync(entries, { level: 0 }); // images are already compressed
  downloadBlob(new Blob([zipped], { type: "application/zip" }), zipName);
}
