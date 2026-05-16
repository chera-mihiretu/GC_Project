import { getGeminiClient } from "../../ai/infrastructure/gemini-client.js";
import { searchVendorsByVector } from "../../ai/infrastructure/embedding.repository.js";
import { findByUserId as findCoupleProfile } from "../../couple/infrastructure/couple-profile.repository.js";

const MODEL = "gemini-2.5-flash";

export interface SuggestCategoriesInput {
  userId: string;
  totalAmount: number;
  currency: string;
  priorities: string[];
  weddingStyle: string;
  extras: string[];
}

export interface SuggestedVendor {
  id: string;
  businessName: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  rating: number;
  reviewCount: number;
  location: string | null;
  reason: string;
}

export interface SuggestedCategory {
  name: string;
  allocatedAmount: number;
  sortOrder: number;
  vendors: SuggestedVendor[];
}

export interface DroppedCategory {
  name: string;
  reason: string;
}

export interface SuggestCategoriesResult {
  categories: SuggestedCategory[];
  dropped: DroppedCategory[];
}

interface VendorData {
  id: string;
  businessName: string;
  category: string[];
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  rating: number;
  reviewCount: number;
  location: string | null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function suggestCategories(
  input: SuggestCategoriesInput,
): Promise<SuggestCategoriesResult> {
  const ai = getGeminiClient();

  // Resolve couple's wedding location for geo-aware vendor search
  let weddingLocation: string | null = null;
  try {
    const coupleProfile = await withTimeout(findCoupleProfile(input.userId), 5000, "Couple profile lookup");
    weddingLocation = coupleProfile?.weddingLocation ?? null;
  } catch (err) {
    console.warn("[Budget] Could not fetch couple profile for location, continuing without:", err);
  }

  // Search for vendors matching each priority/extra, filtered by location
  let vendorResults: Record<string, VendorData[]> = {};
  try {
    const searchTerms = [...input.priorities, ...input.extras];
    vendorResults = await withTimeout(
      fetchVendorsForTerms(searchTerms, input.totalAmount, weddingLocation),
      10000,
      "Vendor search",
    );
  } catch (err) {
    console.warn("[Budget] Vendor search failed, continuing without vendor data:", err);
  }

  console.log("[Budget] Calling Gemini for category suggestions...");
  const prompt = buildPrompt(input, vendorResults, weddingLocation);

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
    25000,
    "Gemini API call",
  );

  const text = response.text ?? "";
  const parsed = JSON.parse(text) as {
    categories: {
      name: string;
      percent: number;
      vendorIds: string[];
      vendorReasons: string[];
    }[];
    dropped: { name: string; reason: string }[];
  };

  if (!parsed.categories || !Array.isArray(parsed.categories)) {
    throw new Error("AI returned invalid category suggestions");
  }

  // Normalize percentages
  const totalPercent = parsed.categories.reduce((sum, c) => sum + c.percent, 0);
  const normalized = parsed.categories.map((c) => ({
    ...c,
    percent: totalPercent > 0 ? (c.percent / totalPercent) * 100 : 0,
  }));

  // Build vendor lookup map
  const vendorMap = new Map<string, VendorData>();
  for (const vendors of Object.values(vendorResults)) {
    for (const v of vendors) {
      vendorMap.set(v.id, v);
    }
  }

  const categories: SuggestedCategory[] = normalized.map((cat, idx) => {
    const vendors: SuggestedVendor[] = [];
    if (cat.vendorIds) {
      for (let i = 0; i < cat.vendorIds.length; i++) {
        const v = vendorMap.get(cat.vendorIds[i]);
        if (v) {
          vendors.push({
            id: v.id,
            businessName: v.businessName,
            priceRangeMin: v.priceRangeMin,
            priceRangeMax: v.priceRangeMax,
            rating: v.rating,
            reviewCount: v.reviewCount,
            location: v.location,
            reason: cat.vendorReasons?.[i] ?? "Matches your needs",
          });
        }
      }
    }

    return {
      name: cat.name,
      allocatedAmount: Math.round((cat.percent / 100) * input.totalAmount * 100) / 100,
      sortOrder: idx,
      vendors,
    };
  });

  return {
    categories,
    dropped: parsed.dropped ?? [],
  };
}

async function fetchVendorsForTerms(
  terms: string[],
  maxBudget: number,
  location: string | null,
): Promise<Record<string, VendorData[]>> {
  const results: Record<string, VendorData[]> = {};

  const searches = terms.map(async (term) => {
    try {
      const vendors = await searchVendorsByVector(
        `wedding ${term.toLowerCase()} service`,
        { limit: 3, maxBudget, ...(location ? { location } : {}) },
      );
      results[term] = vendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        category: v.category,
        priceRangeMin: v.priceRangeMin,
        priceRangeMax: v.priceRangeMax,
        rating: v.rating,
        reviewCount: v.reviewCount,
        location: v.location,
      }));
    } catch {
      results[term] = [];
    }
  });

  await Promise.all(searches);
  return results;
}

function buildPrompt(
  input: SuggestCategoriesInput,
  vendorData: Record<string, VendorData[]>,
  weddingLocation: string | null,
): string {
  // Build vendor context string
  let vendorContext = "";
  for (const [term, vendors] of Object.entries(vendorData)) {
    if (vendors.length > 0) {
      vendorContext += `\n  "${term}" vendors available:\n`;
      for (const v of vendors) {
        const priceStr = v.priceRangeMin != null
          ? `${v.priceRangeMin.toLocaleString()}–${(v.priceRangeMax ?? v.priceRangeMin).toLocaleString()} ${input.currency}`
          : "Price not listed";
        vendorContext += `    - ID:"${v.id}" | "${v.businessName}" | ${priceStr} | Rating: ${v.rating}/5 (${v.reviewCount} reviews) | ${v.location ?? "Location N/A"}\n`;
      }
    } else {
      vendorContext += `\n  "${term}": No vendors currently available on platform\n`;
    }
  }

  const locationLine = weddingLocation
    ? `- Wedding location: ${weddingLocation} (vendors are pre-filtered to this area)`
    : "- Wedding location: Not specified (showing all vendors)";

  return `You are a wedding budget planning expert. A couple needs help allocating their wedding budget into categories.

INPUTS:
- Total budget: ${input.totalAmount.toLocaleString()} ${input.currency}
- Top priorities (most important to them): ${input.priorities.join(", ")}
- Wedding style: ${input.weddingStyle}
- Extras they want to include: ${input.extras.length > 0 ? input.extras.join(", ") : "None"}
${locationLine}

AVAILABLE VENDORS ON OUR PLATFORM:
${vendorContext}

RULES:
1. Create 5-10 budget categories appropriate for their wedding, based on REAL vendors available.
2. Prioritized items should receive significantly more allocation (first priority gets most boost).
3. Adjust based on wedding style:
   - "intimate" = smaller venue/catering %, more on personal touches
   - "classic" = balanced allocation
   - "grand" = larger venue/catering/entertainment %
   - "lavish" = highest venue/catering %, premium everything
4. Include each requested extra as its own category IF affordable.
5. Always include a "Miscellaneous / Buffer" category (3-5%).
6. CRITICAL: If the user's budget CANNOT afford a selection (vendor prices exceed what's reasonable for that category), you MUST:
   - DROP that category from the main list
   - Add it to the "dropped" array with a clear reason explaining WHY it was dropped (e.g., "Your budget of X cannot accommodate Y services which start at Z")
   - Low-priority items should be dropped first
7. For each category, recommend 1-3 vendors from the available list. Include their IDs and a short reason why you suggest them.
8. If no vendors are available for a category, still include the category but with empty vendorIds.
9. Percentages of included categories must sum to exactly 100.
10. Set allocations based on REAL vendor pricing when available.

RESPOND with this exact JSON structure:
{
  "categories": [
    {
      "name": "Category Name",
      "percent": 30,
      "vendorIds": ["vendor-uuid-1", "vendor-uuid-2"],
      "vendorReasons": ["Best rated venue in your area", "Great value for intimate weddings"]
    }
  ],
  "dropped": [
    {
      "name": "Dropped Service",
      "reason": "Your budget cannot support this as minimum pricing starts at X"
    }
  ]
}`;
}
