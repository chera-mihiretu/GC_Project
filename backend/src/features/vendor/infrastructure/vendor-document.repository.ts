import { pool } from "../../../config/db.js";
import type { VendorDocument, DocumentType } from "../domain/types.js";

function rowToDocument(row: Record<string, unknown>): VendorDocument {
  return {
    id: row.id as string,
    vendorProfileId: row.vendor_profile_id as string,
    documentType: row.document_type as DocumentType,
    fileUrl: row.file_url as string,
    uploadedAt: new Date(row.uploaded_at as string),
  };
}

export async function create(
  vendorProfileId: string,
  documentType: DocumentType,
  fileUrl: string,
): Promise<VendorDocument> {
  const id = crypto.randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO vendor_documents (id, vendor_profile_id, document_type, file_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, vendorProfileId, documentType, fileUrl],
  );
  return rowToDocument(rows[0]);
}

export async function findByVendorId(
  vendorProfileId: string,
): Promise<VendorDocument[]> {
  const { rows } = await pool.query(
    "SELECT * FROM vendor_documents WHERE vendor_profile_id = $1 ORDER BY uploaded_at DESC",
    [vendorProfileId],
  );
  return rows.map(rowToDocument);
}

export async function findById(
  id: string,
): Promise<VendorDocument | null> {
  const { rows } = await pool.query(
    "SELECT * FROM vendor_documents WHERE id = $1",
    [id],
  );
  return rows.length ? rowToDocument(rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM vendor_documents WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
