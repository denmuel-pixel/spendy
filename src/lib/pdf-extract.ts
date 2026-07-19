// PDF text extraction utility using pdfjs-dist (Node.js legacy build)
import fs from "fs";
import path from "path";

let workerSrc: string | null = null;

function getWorkerSrc(version: string): string {
  if (workerSrc) return workerSrc;
  try {
    // Try to read the worker file and embed it as a data URI
    const workerPath = path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"
    );
    const content = fs.readFileSync(workerPath, "utf8");
    workerSrc =
      "data:application/javascript;base64," +
      Buffer.from(content).toString("base64");
  } catch {
    // Fallback to CDN
    workerSrc = `https://unpkg.com/pdfjs-dist@${version}/legacy/build/pdf.worker.min.mjs`;
  }
  return workerSrc;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Embed the worker as data URI to avoid bundling issues in Next.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerSrc(pdfjsLib.version);

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const totalPages = doc.numPages;

  const pages: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n---\n");
}

