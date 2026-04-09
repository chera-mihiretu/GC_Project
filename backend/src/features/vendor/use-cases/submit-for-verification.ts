import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import * as documentRepo from "../infrastructure/vendor-document.repository.js";
import { VendorStatus, type VendorProfile } from "../domain/types.js";
import { canTransition } from "../domain/status-machine.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";
import { pool } from "../../../config/db.js";

export async function submitForVerification(
  userId: string,
): Promise<VendorProfile> {
  const profile = await profileRepo.findByUserId(userId);
  if (!profile) {
    throw Object.assign(new Error("Vendor profile not found"), {
      statusCode: 404,
    });
  }

  if (!canTransition(profile.status, VendorStatus.PENDING_VERIFICATION)) {
    throw Object.assign(
      new Error(
        `Cannot submit for verification from status "${profile.status}"`,
      ),
      { statusCode: 409 },
    );
  }

  if (!profile.businessName || !profile.category || !profile.phoneNumber || !profile.location) {
    throw Object.assign(
      new Error(
        "Profile is incomplete. Business name, category, phone number, and location are required.",
      ),
      { statusCode: 400 },
    );
  }

  const documents = await documentRepo.findByVendorId(profile.id);
  if (documents.length === 0) {
    throw Object.assign(
      new Error("At least one document must be uploaded before submitting"),
      { statusCode: 400 },
    );
  }

  const updated = await profileRepo.updateStatus(
    profile.id,
    VendorStatus.PENDING_VERIFICATION,
  );

  notifyAdminsOfSubmission(profile).catch(() => {});

  return updated;
}

async function notifyAdminsOfSubmission(profile: VendorProfile): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id FROM "user" WHERE role = 'admin'`,
  );
  for (const row of rows) {
    await sendNotification({
      userId: row.id as string,
      type: "vendor_submitted",
      title: "New Vendor Submission",
      body: `${profile.businessName} has submitted documents for verification.`,
      metadata: { vendorProfileId: profile.id, vendorUserId: profile.userId },
    });
  }
}
