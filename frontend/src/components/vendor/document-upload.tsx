"use client";

import { useState } from "react";
import { FiUploadCloud, FiTrash2, FiFile, FiChevronDown } from "react-icons/fi";
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
      setError("File must be less than 5 MB");
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
          <FiFile className="w-4.5 h-4.5 text-slate-400" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">Documents</h3>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">
            Upload required verification documents
          </p>
        </div>
      </div>

      {/* Existing documents */}
      {documents.length > 0 && (
        <div className="space-y-3 mb-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-warm-50/30 border border-warm-200/30 hover:border-warm-200/50 transition-all duration-500"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-warm-200/40 flex items-center justify-center shrink-0">
                  <FiFile className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-700 truncate">
                    {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  </p>
                  <p className="text-[11px] text-slate-400 font-light mt-0.5">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-500 shrink-0"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload controls */}
      {!disabled && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[200px]">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-warm-200/60 rounded-xl text-[13px] text-slate-700 bg-white outline-none appearance-none transition-all duration-500 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FiChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <label className="cursor-pointer flex items-center gap-2.5 px-5 py-3 bg-slate-900 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] transition-all duration-500">
            <FiUploadCloud className="w-4 h-4" />
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
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

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
