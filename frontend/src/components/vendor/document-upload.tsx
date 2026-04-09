"use client";

import { useState } from "react";
import { FiUpload, FiTrash2, FiFile } from "react-icons/fi";
import { uploadDocument, deleteDocument } from "@/services/vendor.service";
import { DocumentType, type VendorDocument } from "@/types/vendor";

interface Props {
  documents: VendorDocument[];
  onUpdate: () => void;
  disabled?: boolean;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  [DocumentType.BUSINESS_LICENSE]: "Business License",
  [DocumentType.NATIONAL_ID]: "National ID",
  [DocumentType.OTHER]: "Other Document",
};

export default function DocumentUpload({ documents, onUpdate, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(DocumentType.BUSINESS_LICENSE);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);
    try {
      await uploadDocument(file, selectedType as DocumentType);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(docId: string) {
    try {
      await deleteDocument(docId);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>

      {documents.length > 0 && (
        <div className="space-y-2 mb-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <FiFile className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  </p>
                  <p className="text-xs text-gray-400">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete document"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm cursor-pointer hover:bg-gray-800 transition-colors">
            <FiUpload size={14} />
            {uploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
