import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import * as repo from "../infrastructure/budget.repository.js";
import * as categoryRepo from "../infrastructure/budget-category.repository.js";
import * as expenseRepo from "../infrastructure/expense.repository.js";
import { suggestCategories } from "../use-cases/suggest-categories.js";
import { checkBudgetAlerts } from "../use-cases/check-budget-alerts.js";
import { executeSendMessageToVendors } from "../../ai/use-cases/agent-tools.js";
import { getGeminiClient } from "../../ai/infrastructure/gemini-client.js";
import { findByUserId as findCoupleProfile } from "../../couple/infrastructure/couple-profile.repository.js";

const DEFAULT_CATEGORIES = [
  { name: "Venue & Decor", percent: 0.3 },
  { name: "Catering & Drinks", percent: 0.25 },
  { name: "Photography & Video", percent: 0.15 },
  { name: "Attire & Beauty", percent: 0.1 },
  { name: "Music & Entertainment", percent: 0.08 },
  { name: "Invitations & Stationery", percent: 0.04 },
  { name: "Transportation", percent: 0.03 },
  { name: "Miscellaneous", percent: 0.05 },
];

const router = Router();

// ──────────────────── Budget CRUD ────────────────────

router.get("/", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  try {
    const budget = await repo.findByUserId(userId);
    res.json({ budget });
  } catch (err) {
    console.error("[Budget] Get error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to get budget" } });
  }
});

router.post("/", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { totalAmount, name, currency, notes } = req.body ?? {};

  if (totalAmount === undefined || typeof totalAmount !== "number" || totalAmount < 0) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "totalAmount is required and must be a non-negative number" } });
    return;
  }

  try {
    const existing = await repo.findByUserId(userId);
    if (existing) {
      res.status(409).json({ error: { code: "CONFLICT", message: "Budget already exists. Use PATCH to update." } });
      return;
    }

    const budget = await repo.create({
      userId,
      totalAmount,
      name: name || undefined,
      currency: currency || undefined,
      notes: notes || undefined,
    });

    // Seed default categories based on totalAmount
    const defaultCats = DEFAULT_CATEGORIES.map((cat, idx) => ({
      name: cat.name,
      allocatedAmount: Math.round(totalAmount * cat.percent * 100) / 100,
      sortOrder: idx,
    }));
    await categoryRepo.bulkCreate(budget.id, defaultCats);

    res.status(201).json({ budget });
  } catch (err) {
    console.error("[Budget] Create error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create budget" } });
  }
});

router.patch("/", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { totalAmount, name, currency, notes } = req.body ?? {};

  if (totalAmount !== undefined && (typeof totalAmount !== "number" || totalAmount < 0)) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "totalAmount must be a non-negative number" } });
    return;
  }

  try {
    const budget = await repo.update(userId, { totalAmount, name, currency, notes });
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found. Create one first." } });
      return;
    }
    res.json({ budget });
  } catch (err) {
    console.error("[Budget] Update error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update budget" } });
  }
});

router.delete("/", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  try {
    const deleted = await repo.deleteByUserId(userId);
    if (!deleted) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[Budget] Delete error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete budget" } });
  }
});

// ──────────────────── Category CRUD ────────────────────

router.get("/categories", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    const categories = await categoryRepo.findByBudgetId(budget.id);
    const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
    const unallocated = budget.totalAmount - totalAllocated;

    // Get per-category spending
    const spentByCategory = await expenseRepo.getSpentByCategory(budget.id);
    const spentMap = new Map<string, number>();
    let totalSpent = 0;
    for (const s of spentByCategory) {
      spentMap.set(s.categoryId, s.totalSpent);
      totalSpent += s.totalSpent;
    }
    // Include uncategorized spending in totalSpent
    const overallSpent = await expenseRepo.getTotalSpentByBudget(budget.id);
    totalSpent = overallSpent;

    // Attach saved vendors to each category
    const categoryIds = categories.map((c) => c.id);
    const allVendors = await categoryRepo.findVendorsByCategoryIds(categoryIds);
    const vendorsByCategory = new Map<string, typeof allVendors>();
    for (const v of allVendors) {
      const arr = vendorsByCategory.get(v.budgetCategoryId) ?? [];
      arr.push(v);
      vendorsByCategory.set(v.budgetCategoryId, arr);
    }

    const categoriesWithVendors = categories.map((cat) => ({
      ...cat,
      spentAmount: spentMap.get(cat.id) ?? 0,
      vendors: (vendorsByCategory.get(cat.id) ?? []).map((v) => ({
        id: v.vendorProfileId,
        businessName: v.businessName,
        priceRangeMin: v.priceRangeMin,
        priceRangeMax: v.priceRangeMax,
        rating: v.rating,
        reviewCount: v.reviewCount,
        location: v.location,
        reason: v.reason,
      })),
    }));

    res.json({ categories: categoriesWithVendors, totalAllocated, unallocated, totalSpent });
  } catch (err) {
    console.error("[Budget] List categories error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to list categories" } });
  }
});

router.post("/categories", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { name, allocatedAmount, sortOrder } = req.body ?? {};

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "name is required" } });
    return;
  }
  if (allocatedAmount === undefined || typeof allocatedAmount !== "number" || allocatedAmount < 0) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "allocatedAmount is required and must be non-negative" } });
    return;
  }

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found. Create a budget first." } });
      return;
    }

    const category = await categoryRepo.create({
      budgetId: budget.id,
      name: name.trim(),
      allocatedAmount,
      sortOrder: sortOrder ?? undefined,
    });
    res.status(201).json({ category });
  } catch (err) {
    console.error("[Budget] Create category error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create category" } });
  }
});

router.patch("/categories/:id", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const categoryId = req.params.id as string;
  const { name, allocatedAmount, sortOrder } = req.body ?? {};

  if (allocatedAmount !== undefined && (typeof allocatedAmount !== "number" || allocatedAmount < 0)) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "allocatedAmount must be non-negative" } });
    return;
  }

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    const category = await categoryRepo.update(categoryId, budget.id, {
      name: name?.trim(),
      allocatedAmount,
      sortOrder,
    });
    if (!category) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found" } });
      return;
    }
    res.json({ category });
  } catch (err) {
    console.error("[Budget] Update category error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update category" } });
  }
});

router.delete("/categories/:id", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const categoryId = req.params.id as string;

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    const deleted = await categoryRepo.deleteById(categoryId, budget.id);
    if (!deleted) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found" } });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[Budget] Delete category error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete category" } });
  }
});

// ──────────────────── AI Suggest & Bulk Replace ────────────────────

router.post("/suggest-categories", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  console.log("[Budget] suggest-categories request received");
  const userId = req.authContext!.user.id;
  const { priorities, weddingStyle, extras } = req.body ?? {};

  if (!Array.isArray(priorities) || priorities.length === 0) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "priorities array is required" } });
    return;
  }
  if (!weddingStyle || typeof weddingStyle !== "string") {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "weddingStyle is required" } });
    return;
  }

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    const result = await suggestCategories({
      userId,
      totalAmount: budget.totalAmount,
      currency: budget.currency,
      priorities,
      weddingStyle,
      extras: Array.isArray(extras) ? extras : [],
    });

    res.json({ categories: result.categories, dropped: result.dropped });
  } catch (err) {
    console.error("[Budget] Suggest categories error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to generate category suggestions" } });
  }
});

router.put("/categories", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { categories } = req.body ?? {};

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "categories array is required" } });
    return;
  }

  for (const cat of categories) {
    if (!cat.name || typeof cat.allocatedAmount !== "number" || cat.allocatedAmount < 0) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Each category needs a name and valid allocatedAmount" } });
      return;
    }
  }

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    await categoryRepo.deleteAllByBudgetId(budget.id);

    const created = await categoryRepo.bulkCreate(
      budget.id,
      categories.map((cat: { name: string; allocatedAmount: number }, idx: number) => ({
        name: cat.name,
        allocatedAmount: cat.allocatedAmount,
        sortOrder: idx,
      })),
    );

    // Save recommended vendors per category
    const vendorDTOs: import("../domain/types.js").CreateCategoryVendorDTO[] = [];
    for (let i = 0; i < categories.length; i++) {
      const catVendors = categories[i].vendors;
      if (Array.isArray(catVendors)) {
        for (const v of catVendors) {
          vendorDTOs.push({
            budgetCategoryId: created[i].id,
            vendorProfileId: v.id,
            businessName: v.businessName,
            priceRangeMin: v.priceRangeMin ?? null,
            priceRangeMax: v.priceRangeMax ?? null,
            rating: v.rating ?? 0,
            reviewCount: v.reviewCount ?? 0,
            location: v.location ?? null,
            reason: v.reason ?? "",
          });
        }
      }
    }
    const savedVendors = await categoryRepo.bulkCreateVendors(vendorDTOs);

    // Attach vendors to their categories in the response
    const vendorsByCategory = new Map<string, typeof savedVendors>();
    for (const v of savedVendors) {
      const arr = vendorsByCategory.get(v.budgetCategoryId) ?? [];
      arr.push(v);
      vendorsByCategory.set(v.budgetCategoryId, arr);
    }

    const result = created.map((cat) => ({
      ...cat,
      vendors: (vendorsByCategory.get(cat.id) ?? []).map((v) => ({
        id: v.vendorProfileId,
        businessName: v.businessName,
        priceRangeMin: v.priceRangeMin,
        priceRangeMax: v.priceRangeMax,
        rating: v.rating,
        reviewCount: v.reviewCount,
        location: v.location,
        reason: v.reason,
      })),
    }));

    res.json({ categories: result });
  } catch (err) {
    console.error("[Budget] Bulk replace categories error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to replace categories" } });
  }
});

// ──────────────────── Contact Vendors from Budget ────────────────────

router.post("/categories/:id/contact-vendors", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const userName = req.authContext!.user.name ?? "there";
  const categoryId = req.params.id as string;
  const { message: customMessage } = req.body ?? {};

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    // Get saved vendors for this category
    const vendors = await categoryRepo.findVendorsByCategoryIds([categoryId]);
    if (vendors.length === 0) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No recommended vendors for this category" } });
      return;
    }

    // Get the category details
    const categories = await categoryRepo.findByBudgetId(budget.id);
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found" } });
      return;
    }

    let messageToSend = customMessage;

    // If no custom message, generate one with AI using real couple data
    if (!messageToSend || typeof messageToSend !== "string" || messageToSend.trim().length === 0) {
      const coupleProfile = await findCoupleProfile(userId).catch(() => null);
      const ai = getGeminiClient();
      const draftResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: buildVendorMessagePrompt(userName, coupleProfile, category.name, category.allocatedAmount, budget.currency),
          }],
        }],
        config: { temperature: 0.7 },
      });
      messageToSend = draftResponse.text ?? `Hi! My name is ${userName} and we're planning our wedding. We'd love to learn more about your ${category.name} services. Could you share your available packages and pricing? Thank you!`;
    }

    // Send to all saved vendors in this category
    const vendorProfileIds = vendors.map((v) => v.vendorProfileId);
    const results = await executeSendMessageToVendors(vendorProfileIds, messageToSend.trim(), userId);

    const successCount = results.filter((r) => r.sent).length;
    const failed = results.filter((r) => !r.sent);

    if (successCount > 0) {
      await categoryRepo.markContacted(categoryId);
    }

    res.json({
      success: successCount > 0,
      messageSent: messageToSend.trim(),
      summary: successCount > 0
        ? `Message sent to ${successCount} vendor${successCount > 1 ? "s" : ""} for ${category.name}.${failed.length > 0 ? ` Failed for: ${failed.map((f) => f.businessName).join(", ")}` : ""}`
        : `Failed to send messages. ${failed.map((f) => `${f.businessName}: ${f.error}`).join("; ")}`,
      results,
    });
  } catch (err) {
    console.error("[Budget] Contact vendors error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to contact vendors" } });
  }
});

// Preview the AI-drafted message before sending
router.post("/categories/:id/draft-message", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const userName = req.authContext!.user.name ?? "there";
  const categoryId = req.params.id as string;

  try {
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No budget found" } });
      return;
    }

    const vendors = await categoryRepo.findVendorsByCategoryIds([categoryId]);
    if (vendors.length === 0) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No recommended vendors for this category" } });
      return;
    }

    const categories = await categoryRepo.findByBudgetId(budget.id);
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found" } });
      return;
    }

    const coupleProfile = await findCoupleProfile(userId).catch(() => null);
    const ai = getGeminiClient();
    const draftResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: buildVendorMessagePrompt(userName, coupleProfile, category.name, category.allocatedAmount, budget.currency),
        }],
      }],
      config: { temperature: 0.7 },
    });

    const draft = draftResponse.text ?? `Hi! My name is ${userName} and we're planning our wedding. We'd love to learn more about your ${category.name} services. Could you share your available packages and pricing? Thank you!`;

    res.json({
      draft: draft.trim(),
      categoryName: category.name,
      vendors: vendors.map((v) => ({
        id: v.vendorProfileId,
        businessName: v.businessName,
      })),
    });
  } catch (err) {
    console.error("[Budget] Draft message error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to draft message" } });
  }
});

// ──────────────────── Expenses ────────────────────

// List expenses for a budget
router.get("/expenses", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  try {
    const userId = req.authContext!.user.id;
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Budget not found" } });
    }

    const { categoryId, limit, offset } = req.query;
    const result = await expenseRepo.findByBudgetId(budget.id, {
      categoryId: categoryId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json(result);
  } catch (err) {
    console.error("[Budget] List expenses error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to list expenses" } });
  }
});

// Get expense summary (total spent, per-category breakdown)
router.get("/expenses/summary", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  try {
    const userId = req.authContext!.user.id;
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Budget not found" } });
    }

    const [totalSpent, byCategory] = await Promise.all([
      expenseRepo.getTotalSpentByBudget(budget.id),
      expenseRepo.getSpentByCategory(budget.id),
    ]);

    res.json({
      totalBudget: budget.totalAmount,
      totalSpent,
      remaining: budget.totalAmount - totalSpent,
      byCategory,
    });
  } catch (err) {
    console.error("[Budget] Expense summary error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to get expense summary" } });
  }
});

// Create expense
router.post("/expenses", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  try {
    const userId = req.authContext!.user.id;
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Budget not found" } });
    }

    const { description, amount, categoryId, vendorName, expenseDate } = req.body;

    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: { code: "VALIDATION", message: "Description is required" } });
    }
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: { code: "VALIDATION", message: "Amount must be a positive number" } });
    }

    const expense = await expenseRepo.create({
      budgetId: budget.id,
      categoryId: categoryId || null,
      description,
      amount,
      vendorName: vendorName || null,
      expenseDate: expenseDate || undefined,
    });

    checkBudgetAlerts({ budgetId: budget.id, userId }).catch(() => {});

    res.status(201).json(expense);
  } catch (err) {
    console.error("[Budget] Create expense error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create expense" } });
  }
});

// Update expense
router.patch("/expenses/:expenseId", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  try {
    const userId = req.authContext!.user.id;
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Budget not found" } });
    }

    const expenseId = req.params.expenseId as string;
    const { description, amount, categoryId, vendorName, expenseDate } = req.body;

    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
      return res.status(400).json({ error: { code: "VALIDATION", message: "Amount must be a positive number" } });
    }

    const updated = await expenseRepo.update(expenseId, budget.id, {
      description,
      amount,
      categoryId,
      vendorName,
      expenseDate,
    });

    if (!updated) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Expense not found" } });
    }

    checkBudgetAlerts({ budgetId: budget.id, userId }).catch(() => {});

    res.json(updated);
  } catch (err) {
    console.error("[Budget] Update expense error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update expense" } });
  }
});

// Delete expense
router.delete("/expenses/:expenseId", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  try {
    const userId = req.authContext!.user.id;
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Budget not found" } });
    }

    const expenseId = req.params.expenseId as string;
    const deleted = await expenseRepo.deleteById(expenseId, budget.id);

    if (!deleted) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Expense not found" } });
    }

    res.status(204).send();
  } catch (err) {
    console.error("[Budget] Delete expense error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete expense" } });
  }
});

function buildVendorMessagePrompt(
  userName: string,
  coupleProfile: { partnerName: string | null; weddingDate: string | null; weddingLocation: string | null; estimatedGuests: number | null } | null,
  categoryName: string,
  allocatedAmount: number,
  currency: string,
): string {
  const partnerLine = coupleProfile?.partnerName
    ? `The couple is ${userName} and ${coupleProfile.partnerName}.`
    : `The person's name is ${userName}.`;
  const dateLine = coupleProfile?.weddingDate
    ? `Their wedding date is ${new Date(coupleProfile.weddingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
    : "";
  const locationLine = coupleProfile?.weddingLocation
    ? `The wedding will be in ${coupleProfile.weddingLocation}.`
    : "";
  const guestLine = coupleProfile?.estimatedGuests
    ? `They expect approximately ${coupleProfile.estimatedGuests} guests.`
    : "";

  return `Write a complete, ready-to-send chat message from a couple to a wedding vendor about "${categoryName}" services.

COUPLE INFO (use all of this — do NOT leave any blanks or placeholders):
- ${partnerLine}
${dateLine ? `- ${dateLine}` : ""}
${locationLine ? `- ${locationLine}` : ""}
${guestLine ? `- ${guestLine}` : ""}
- Their budget for ${categoryName}: around ${allocatedAmount.toLocaleString()} ${currency}

STRICT RULES:
1. The message must be COMPLETE with zero placeholders. No [brackets], no "___", no "your name here", no "TBD", no ellipsis standing in for missing info.
2. If some couple info is missing (no date, no location, etc.), simply don't mention it — do NOT insert a placeholder.
3. Use the couple's REAL name(s) provided above.
4. Keep it warm, friendly, and professional — like a real person texting a vendor.
5. Mention their approximate budget naturally (e.g., "we've set aside around X" — not the exact number).
6. Ask about availability and package options.
7. Keep it under 120 words.
8. Write ONLY the message body. No subject line, no "Dear vendor", no signature block.
9. Start the message directly (e.g., "Hi! We're..." or "Hello! My name is...").`;
}

// ──────────────────── Budget Report ────────────────────

router.get("/report", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  try {
    const userId = req.authContext!.user.id;
    const budget = await repo.findByUserId(userId);
    if (!budget) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Budget not found" } });
    }

    const format = (req.query.format as string) || "json";

    const categories = await categoryRepo.findByBudgetId(budget.id);
    const [totalSpent, spentByCategory] = await Promise.all([
      expenseRepo.getTotalSpentByBudget(budget.id),
      expenseRepo.getSpentByCategory(budget.id),
    ]);
    const { expenses } = await expenseRepo.findByBudgetId(budget.id, { limit: 200 });

    const spentMap = new Map<string, number>();
    for (const s of spentByCategory) {
      spentMap.set(s.categoryId, s.totalSpent);
    }

    const categoryReport = categories.map((cat) => {
      const spent = spentMap.get(cat.id) ?? 0;
      return {
        name: cat.name,
        allocated: cat.allocatedAmount,
        spent,
        remaining: cat.allocatedAmount - spent,
        percentUsed: cat.allocatedAmount > 0 ? Math.round((spent / cat.allocatedAmount) * 100) : 0,
      };
    });

    const reportData = {
      budget: {
        name: budget.name,
        totalAmount: budget.totalAmount,
        currency: budget.currency,
        totalSpent,
        remaining: budget.totalAmount - totalSpent,
        percentUsed: budget.totalAmount > 0 ? Math.round((totalSpent / budget.totalAmount) * 100) : 0,
      },
      categories: categoryReport,
      expenses: expenses.map((e) => ({
        description: e.description,
        amount: e.amount,
        vendorName: e.vendorName,
        category: categories.find((c) => c.id === e.categoryId)?.name ?? "Uncategorized",
        date: e.expenseDate,
      })),
      generatedAt: new Date().toISOString(),
    };

    if (format === "csv") {
      const lines: string[] = [];
      lines.push(`"Wedding Budget Report - ${budget.name}"`);
      lines.push(`"Generated","${new Date().toLocaleDateString()}"`);
      lines.push(`"Total Budget","${budget.totalAmount}","${budget.currency}"`);
      lines.push(`"Total Spent","${totalSpent}"`);
      lines.push(`"Remaining","${budget.totalAmount - totalSpent}"`);
      lines.push("");
      lines.push('"Category","Allocated","Spent","Remaining","% Used"');
      for (const cat of categoryReport) {
        lines.push(`"${cat.name}","${cat.allocated}","${cat.spent}","${cat.remaining}","${cat.percentUsed}%"`);
      }
      lines.push("");
      lines.push('"Date","Description","Amount","Category","Vendor"');
      for (const exp of reportData.expenses) {
        lines.push(`"${exp.date}","${exp.description}","${exp.amount}","${exp.category}","${exp.vendorName ?? ""}"`);
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="budget-report-${Date.now()}.csv"`);
      res.send(lines.join("\n"));
      return;
    }

    res.json(reportData);
  } catch (err) {
    console.error("[Budget] Report error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to generate report" } });
  }
});

export default router;
