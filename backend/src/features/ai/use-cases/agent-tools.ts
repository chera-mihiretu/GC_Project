import { pool } from "../../../config/db.js";
import { searchVendorsByVector, type SearchFilters } from "../infrastructure/embedding.repository.js";
import type { VendorCard } from "../domain/types.js";
import { findOrCreateConversation, createMessage, getMessagesByConversation } from "../../realtime/infrastructure/conversation.repository.js";
import { getIO } from "../../realtime/infrastructure/socket-server.js";
import { createBooking, type CreateBookingInput } from "../../booking/use-cases/create-booking.js";

export interface SearchVendorsParams {
  query: string;
  categories?: string[];
  location?: string;
  maxBudget?: number;
  minRating?: number;
  limit?: number;
}

export interface VendorDetailResult {
  id: string;
  businessName: string;
  category: string[];
  description: string | null;
  location: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  yearsOfExperience: number | null;
  rating: number;
  reviewCount: number;
  socialMedia: Record<string, string> | null;
  recentReviews: { rating: number; comment: string; date: string }[];
  portfolioCategories: { category: string; count: number }[];
  availableRanges: { startDate: string; endDate: string; note: string | null }[];
  completedBookings: number;
}

export interface AvailabilityCheckResult {
  vendorProfileId: string;
  businessName: string;
  isAvailable: boolean;
  conflictingBookings: { eventDate: string; status: string }[];
  availableRanges: { startDate: string; endDate: string }[];
}

export async function executeSearchVendors(
  params: SearchVendorsParams,
): Promise<{ vendors: VendorCard[]; searchContext: string }> {
  const filters: SearchFilters = {
    categories: params.categories,
    location: params.location,
    maxBudget: params.maxBudget,
    minRating: params.minRating,
    limit: params.limit ?? 5,
  };

  const results = await searchVendorsByVector(params.query, filters);

  const vendors: VendorCard[] = results.map((r) => ({
    id: r.id,
    businessName: r.businessName,
    category: r.category,
    rating: r.rating,
    reviewCount: r.reviewCount,
    thumbnail: r.thumbnail,
    priceRangeMin: r.priceRangeMin,
    priceRangeMax: r.priceRangeMax,
    location: r.location,
  }));

  const searchContext = results
    .map((r, i) => `${i + 1}. ${r.businessName}\n   vendorProfileId: "${r.id}"\n   Categories: ${r.category.join(", ")}\n   Location: ${r.location}\n   Price: ${r.priceRangeMin}-${r.priceRangeMax} ETB\n   Rating: ${r.rating}/5 (${r.reviewCount} reviews)\n   Summary: ${r.content.slice(0, 400)}`)
    .join("\n\n");

  return { vendors, searchContext };
}

export async function executeGetVendorDetail(
  vendorProfileId: string,
): Promise<VendorDetailResult | null> {
  console.log(`[AI Tool] getVendorDetail called with: "${vendorProfileId}"`);
  let profileResult = await pool.query(
    `SELECT id, business_name, category, description, location,
            price_range_min, price_range_max, years_of_experience,
            rating, review_count, social_media
     FROM vendor_profiles WHERE id = $1 AND status = 'verified'`,
    [vendorProfileId],
  );

  if (profileResult.rows.length === 0) {
    profileResult = await pool.query(
      `SELECT id, business_name, category, description, location,
              price_range_min, price_range_max, years_of_experience,
              rating, review_count, social_media
       FROM vendor_profiles WHERE LOWER(business_name) = LOWER($1) AND status = 'verified' LIMIT 1`,
      [vendorProfileId],
    );
  }

  if (profileResult.rows.length === 0) return null;
  const p = profileResult.rows[0];
  const resolvedId = p.id as string;

  const reviewsResult = await pool.query(
    `SELECT rating, comment, created_at FROM reviews
     WHERE vendor_profile_id = $1 AND is_approved = true
     ORDER BY created_at DESC LIMIT 5`,
    [resolvedId],
  );

  const portfolioResult = await pool.query(
    `SELECT category, COUNT(*) as count FROM vendor_portfolio_items
     WHERE vendor_profile_id = $1 GROUP BY category ORDER BY count DESC`,
    [resolvedId],
  );

  const availResult = await pool.query(
    `SELECT start_date, end_date, note FROM vendor_availability
     WHERE vendor_profile_id = $1 AND end_date >= CURRENT_DATE
     ORDER BY start_date LIMIT 10`,
    [resolvedId],
  );

  const bookingResult = await pool.query(
    `SELECT COUNT(*) as completed FROM bookings
     WHERE vendor_profile_id = $1 AND status = 'completed'`,
    [resolvedId],
  );

  return {
    id: resolvedId,
    businessName: p.business_name,
    category: p.category || [],
    description: p.description,
    location: p.location,
    priceRangeMin: p.price_range_min ? Number(p.price_range_min) : null,
    priceRangeMax: p.price_range_max ? Number(p.price_range_max) : null,
    yearsOfExperience: p.years_of_experience,
    rating: Number(p.rating),
    reviewCount: Number(p.review_count),
    socialMedia: p.social_media,
    recentReviews: reviewsResult.rows.map((r: { rating: number; comment: string; created_at: Date }) => ({
      rating: r.rating,
      comment: r.comment || "",
      date: new Date(r.created_at).toISOString().split("T")[0],
    })),
    portfolioCategories: portfolioResult.rows.map((r: { category: string; count: string }) => ({
      category: r.category,
      count: Number(r.count),
    })),
    availableRanges: availResult.rows.map((r: { start_date: string; end_date: string; note: string | null }) => ({
      startDate: r.start_date,
      endDate: r.end_date,
      note: r.note,
    })),
    completedBookings: Number(bookingResult.rows[0]?.completed || 0),
  };
}

export async function executeCheckAvailability(
  vendorProfileId: string,
  startDate: string,
  endDate: string,
): Promise<AvailabilityCheckResult | null> {
  console.log(`[AI Tool] checkAvailability called with: "${vendorProfileId}", ${startDate} to ${endDate}`);
  let profileResult = await pool.query(
    `SELECT id, business_name FROM vendor_profiles WHERE id = $1 AND status = 'verified'`,
    [vendorProfileId],
  );

  if (profileResult.rows.length === 0) {
    profileResult = await pool.query(
      `SELECT id, business_name FROM vendor_profiles WHERE LOWER(business_name) = LOWER($1) AND status = 'verified' LIMIT 1`,
      [vendorProfileId],
    );
  }

  if (profileResult.rows.length === 0) return null;
  const profile = profileResult.rows[0];
  const resolvedId = profile.id as string;

  const conflictsResult = await pool.query(
    `SELECT event_date, status FROM bookings
     WHERE vendor_profile_id = $1
       AND status IN ('accepted', 'deposit_paid')
       AND event_date >= $2::date AND event_date <= $3::date
     ORDER BY event_date`,
    [resolvedId, startDate, endDate],
  );

  const availResult = await pool.query(
    `SELECT start_date, end_date FROM vendor_availability
     WHERE vendor_profile_id = $1
       AND start_date <= $3::date AND end_date >= $2::date
     ORDER BY start_date`,
    [resolvedId, startDate, endDate],
  );

  const conflicts = conflictsResult.rows.map((r: { event_date: string; status: string }) => ({
    eventDate: new Date(r.event_date).toISOString().split("T")[0],
    status: r.status,
  }));

  const availableRanges = availResult.rows.map((r: { start_date: string; end_date: string }) => ({
    startDate: new Date(r.start_date).toISOString().split("T")[0],
    endDate: new Date(r.end_date).toISOString().split("T")[0],
  }));

  return {
    vendorProfileId: resolvedId,
    businessName: profile.business_name,
    isAvailable: conflicts.length === 0,
    conflictingBookings: conflicts,
    availableRanges,
  };
}

export interface SendMessageResult {
  vendorProfileId: string;
  businessName: string;
  conversationId: string;
  sent: boolean;
  error?: string;
}

export async function executeSendMessageToVendors(
  vendorProfileIds: string[],
  message: string,
  coupleUserId: string,
): Promise<SendMessageResult[]> {
  const results: SendMessageResult[] = [];

  for (const vpId of vendorProfileIds) {
    try {
      console.log(`[AI Tool] sendMessage called for vendor: "${vpId}"`);
      let profileResult = await pool.query(
        `SELECT id, user_id, business_name FROM vendor_profiles WHERE id = $1 AND status = 'verified'`,
        [vpId],
      );

      if (profileResult.rows.length === 0) {
        profileResult = await pool.query(
          `SELECT id, user_id, business_name FROM vendor_profiles WHERE LOWER(business_name) = LOWER($1) AND status = 'verified' LIMIT 1`,
          [vpId],
        );
      }

      if (profileResult.rows.length === 0) {
        results.push({ vendorProfileId: vpId, businessName: "Unknown", conversationId: "", sent: false, error: "Vendor not found" });
        continue;
      }

      const vendorUserId = profileResult.rows[0].user_id as string;
      const businessName = profileResult.rows[0].business_name as string;

      const conversation = await findOrCreateConversation(coupleUserId, vendorUserId);

      const savedMessage = await createMessage({
        conversationId: conversation.id,
        senderId: coupleUserId,
        content: message,
      });

      // Broadcast via Socket.IO so the vendor sees it in real-time
      try {
        const io = getIO();
        io.to(`conversation:${conversation.id}`).emit("chat:message", savedMessage);
        io.to(`user:${vendorUserId}`).emit("chat:message", savedMessage);
      } catch {
        // Socket.IO not initialized (e.g. in tests) — message is still persisted
      }

      results.push({ vendorProfileId: vpId, businessName, conversationId: conversation.id, sent: true });
    } catch (err) {
      results.push({
        vendorProfileId: vpId,
        businessName: "Unknown",
        conversationId: "",
        sent: false,
        error: err instanceof Error ? err.message : "Failed to send",
      });
    }
  }

  return results;
}

export interface ReadMessagesResult {
  vendorProfileId: string;
  vendorBusinessName: string;
  conversationId: string;
  messages: { sender: "couple" | "vendor"; content: string; time: string }[];
}

export async function executeReadMessages(
  vendorProfileId: string,
  coupleUserId: string,
  limit = 20,
): Promise<ReadMessagesResult | null> {
  console.log(`[AI Tool] readMessages called for vendor: "${vendorProfileId}"`);

  let profileResult = await pool.query(
    `SELECT id, user_id, business_name FROM vendor_profiles WHERE id = $1 AND status = 'verified'`,
    [vendorProfileId],
  );

  if (profileResult.rows.length === 0) {
    profileResult = await pool.query(
      `SELECT id, user_id, business_name FROM vendor_profiles WHERE LOWER(business_name) = LOWER($1) AND status = 'verified' LIMIT 1`,
      [vendorProfileId],
    );
  }

  if (profileResult.rows.length === 0) return null;

  const resolvedVendorProfileId = profileResult.rows[0].id as string;
  const vendorUserId = profileResult.rows[0].user_id as string;
  const businessName = profileResult.rows[0].business_name as string;

  const [p1, p2] = coupleUserId < vendorUserId
    ? [coupleUserId, vendorUserId]
    : [vendorUserId, coupleUserId];

  const convResult = await pool.query(
    `SELECT id FROM conversation WHERE participant_one = $1 AND participant_two = $2`,
    [p1, p2],
  );

  if (convResult.rows.length === 0) {
    return { vendorProfileId: resolvedVendorProfileId, vendorBusinessName: businessName, conversationId: "", messages: [] };
  }

  const conversationId = convResult.rows[0].id as string;
  const msgs = await getMessagesByConversation(conversationId, limit, 0);

  const formattedMessages = msgs.reverse().map((m) => ({
    sender: (m.senderId === coupleUserId ? "couple" : "vendor") as "couple" | "vendor",
    content: m.content,
    time: m.createdAt.toISOString(),
  }));

  return { vendorProfileId: resolvedVendorProfileId, vendorBusinessName: businessName, conversationId, messages: formattedMessages };
}

export async function executeReadAllConversations(
  coupleUserId: string,
): Promise<{ vendorName: string; vendorProfileId: string | null; vendorCategory: string[]; lastMessage: string; unreadCount: number; lastMessageTime: string }[]> {
  console.log(`[AI Tool] readAllConversations called for user: "${coupleUserId}"`);

  const result = await pool.query(
    `SELECT
       c.id,
       c.participant_one,
       c.participant_two,
       c.last_message_at,
       lm.content AS last_msg_content,
       COALESCE(unread.cnt, 0) AS unread_count,
       CASE
         WHEN c.participant_one = $1 THEN c.participant_two
         ELSE c.participant_one
       END AS other_user_id
     FROM conversation c
     LEFT JOIN LATERAL (
       SELECT content FROM chat_message
       WHERE conversation_id = c.id
       ORDER BY created_at DESC LIMIT 1
     ) lm ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS cnt FROM chat_message
       WHERE conversation_id = c.id
         AND sender_id != $1
         AND read = FALSE
     ) unread ON TRUE
     WHERE c.participant_one = $1 OR c.participant_two = $1
     ORDER BY c.last_message_at DESC
     LIMIT 20`,
    [coupleUserId],
  );

  const conversations = [];
  for (const row of result.rows) {
    const otherUserId = row.other_user_id as string;
    const vpResult = await pool.query(
      `SELECT id, business_name, category FROM vendor_profiles WHERE user_id = $1 LIMIT 1`,
      [otherUserId],
    );
    const vendorProfile = vpResult.rows[0];
    conversations.push({
      vendorName: (vendorProfile?.business_name as string) || "Unknown Vendor",
      vendorProfileId: (vendorProfile?.id as string) ?? null,
      vendorCategory: (vendorProfile?.category as string[]) || [],
      lastMessage: (row.last_msg_content as string) || "",
      unreadCount: Number(row.unread_count),
      lastMessageTime: new Date(row.last_message_at as string).toISOString(),
    });
  }

  return conversations;
}

export interface BookingListItem {
  bookingId: string;
  vendorBusinessName: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  status: string;
  createdAt: string;
}

export async function executeListMyBookings(
  coupleUserId: string,
  status?: string,
  limit = 10,
): Promise<BookingListItem[]> {
  console.log(`[AI Tool] listMyBookings called for user: "${coupleUserId}", status: "${status || "all"}"`);

  const conditions = ["b.couple_id = $1"];
  const values: unknown[] = [coupleUserId];
  let idx = 2;

  if (status) {
    conditions.push(`b.status = $${idx++}`);
    values.push(status);
  }

  values.push(Math.min(limit, 20));
  const { rows } = await pool.query(
    `SELECT b.id, b.vendor_profile_id, b.service_category, b.event_date, b.status, b.created_at,
            vp.business_name
     FROM bookings b
     JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY b.event_date DESC
     LIMIT $${idx}`,
    values,
  );

  return rows.map((r: Record<string, unknown>) => ({
    bookingId: r.id as string,
    vendorBusinessName: r.business_name as string,
    vendorProfileId: r.vendor_profile_id as string,
    serviceCategory: r.service_category as string,
    eventDate: r.event_date instanceof Date
      ? r.event_date.toISOString().split("T")[0]
      : String(r.event_date).split("T")[0],
    status: r.status as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export interface BookingDetailResult {
  bookingId: string;
  vendorBusinessName: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  status: string;
  message: string | null;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function executeGetBookingDetail(
  bookingId: string,
  coupleUserId: string,
): Promise<BookingDetailResult | null> {
  console.log(`[AI Tool] getBookingDetail called for booking: "${bookingId}"`);

  const { rows } = await pool.query(
    `SELECT b.*, vp.business_name
     FROM bookings b
     JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     WHERE b.id = $1 AND b.couple_id = $2`,
    [bookingId, coupleUserId],
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    bookingId: r.id as string,
    vendorBusinessName: r.business_name as string,
    vendorProfileId: r.vendor_profile_id as string,
    serviceCategory: r.service_category as string,
    eventDate: r.event_date instanceof Date
      ? r.event_date.toISOString().split("T")[0]
      : String(r.event_date).split("T")[0],
    status: r.status as string,
    message: r.message as string | null,
    declineReason: r.decline_reason as string | null,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

export async function executeCancelBooking(
  bookingId: string,
  coupleUserId: string,
): Promise<{ success: boolean; message: string }> {
  console.log(`[AI Tool] cancelBooking called for booking: "${bookingId}"`);

  const { rows } = await pool.query(
    `SELECT id, status FROM bookings WHERE id = $1 AND couple_id = $2`,
    [bookingId, coupleUserId],
  );

  if (rows.length === 0) {
    return { success: false, message: "Booking not found or does not belong to you." };
  }

  const currentStatus = rows[0].status as string;
  if (currentStatus === "cancelled" || currentStatus === "completed") {
    return { success: false, message: `Cannot cancel a booking that is already ${currentStatus}.` };
  }

  await pool.query(
    `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [bookingId],
  );

  return { success: true, message: "Booking cancelled successfully." };
}

export async function executeRescheduleBooking(
  bookingId: string,
  newEventDate: string,
  coupleUserId: string,
): Promise<{ success: boolean; newBookingId?: string; message: string }> {
  console.log(`[AI Tool] rescheduleBooking called: booking="${bookingId}", newDate="${newEventDate}"`);

  const { rows } = await pool.query(
    `SELECT b.id, b.vendor_profile_id, b.service_category, b.message, b.status,
            vp.business_name
     FROM bookings b
     JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     WHERE b.id = $1 AND b.couple_id = $2`,
    [bookingId, coupleUserId],
  );

  if (rows.length === 0) {
    return { success: false, message: "Booking not found or does not belong to you." };
  }

  const booking = rows[0];
  const currentStatus = booking.status as string;
  if (currentStatus === "cancelled" || currentStatus === "completed") {
    return { success: false, message: `Cannot reschedule a booking that is ${currentStatus}.` };
  }

  await pool.query(
    `UPDATE bookings SET status = 'cancelled', decline_reason = 'Rescheduled', updated_at = NOW() WHERE id = $1`,
    [bookingId],
  );

  try {
    const input: CreateBookingInput = {
      coupleId: coupleUserId,
      vendorProfileId: booking.vendor_profile_id as string,
      serviceCategory: booking.service_category as string,
      eventDate: newEventDate,
      message: (booking.message as string | null) ?? undefined,
    };
    const newBooking = await createBooking(input);
    return {
      success: true,
      newBookingId: newBooking.id,
      message: `Booking rescheduled to ${newEventDate} with ${booking.business_name}.`,
    };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to create new booking" };
  }
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  vendorBusinessName: string;
  serviceCategory: string;
  eventDate: string;
  error?: string;
}

export async function executeCreateBooking(
  vendorProfileId: string,
  serviceCategory: string,
  eventDate: string,
  coupleUserId: string,
  message?: string,
): Promise<BookingResult> {
  console.log(`[AI Tool] createBooking called for vendor: "${vendorProfileId}", service: "${serviceCategory}", date: "${eventDate}"`);

  let resolvedVendorProfileId = vendorProfileId;
  let businessName = "Unknown";

  const profileResult = await pool.query(
    `SELECT id, business_name FROM vendor_profiles WHERE id = $1 AND status = 'verified'`,
    [vendorProfileId],
  );

  if (profileResult.rows.length === 0) {
    const nameResult = await pool.query(
      `SELECT id, business_name FROM vendor_profiles WHERE LOWER(business_name) = LOWER($1) AND status = 'verified' LIMIT 1`,
      [vendorProfileId],
    );
    if (nameResult.rows.length === 0) {
      return { success: false, vendorBusinessName: vendorProfileId, serviceCategory, eventDate, error: "Vendor not found" };
    }
    resolvedVendorProfileId = nameResult.rows[0].id as string;
    businessName = nameResult.rows[0].business_name as string;
  } else {
    businessName = profileResult.rows[0].business_name as string;
  }

  try {
    const input: CreateBookingInput = {
      coupleId: coupleUserId,
      vendorProfileId: resolvedVendorProfileId,
      serviceCategory,
      eventDate,
      message,
    };

    const booking = await createBooking(input);
    return {
      success: true,
      bookingId: booking.id,
      vendorBusinessName: businessName,
      serviceCategory,
      eventDate,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Booking failed";
    return { success: false, vendorBusinessName: businessName, serviceCategory, eventDate, error: errMsg };
  }
}
