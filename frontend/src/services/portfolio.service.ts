import { apiFetch } from "./auth.service";

const BASE = "/api/v1/vendor/portfolio";

export interface PortfolioItem {
  id: string;
  vendorProfileId: string;
  category: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export async function getPortfolio(): Promise<Record<string, PortfolioItem[]>> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  const data = await res.json();
  return data.portfolio;
}

export async function getPortfolioByCategory(
  category: string,
  limit = 12,
  offset = 0,
): Promise<{ items: PortfolioItem[]; total: number }> {
  const res = await apiFetch(
    `${BASE}/category/${encodeURIComponent(category)}?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) throw new Error("Failed to fetch portfolio category");
  return res.json();
}

export async function requestUploadUrl(
  fileName: string,
  contentType: string,
): Promise<{ signedUrl: string; publicUrl: string; path: string }> {
  const res = await apiFetch(BASE + "/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to get upload URL");
  }
  return res.json();
}

export async function addPortfolioItem(dto: {
  category: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}): Promise<PortfolioItem> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to add item");
  }
  const data = await res.json();
  return data.item;
}

export async function updatePortfolioItem(
  id: string,
  dto: { caption?: string | null; sortOrder?: number },
): Promise<PortfolioItem> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to update item");
  }
  const data = await res.json();
  return data.item;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to delete item");
  }
}

export function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
