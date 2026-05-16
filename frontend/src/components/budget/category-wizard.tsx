"use client";

import { useState } from "react";
import {
  suggestCategories,
  bulkReplaceCategories,
  type SuggestedCategory,
  type DroppedCategory,
} from "@/services/budget.service";
import {
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiZap,
  FiTrash2,
  FiStar,
  FiMapPin,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import Link from "next/link";

interface CategoryWizardProps {
  totalAmount: number;
  currency: string;
  onComplete: () => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = [
  "Venue",
  "Food & Drinks",
  "Photography",
  "Music & DJ",
  "Decor & Flowers",
  "Attire & Beauty",
  "Entertainment",
  "Honeymoon Fund",
];

const STYLE_OPTIONS = [
  { id: "intimate", label: "Intimate", desc: "Under 50 guests, personal & cozy" },
  { id: "classic", label: "Classic", desc: "50\u2013150 guests, traditional celebration" },
  { id: "grand", label: "Grand", desc: "150\u2013300 guests, large-scale event" },
  { id: "lavish", label: "Lavish", desc: "300+ guests, luxury & extravagant" },
];

function getExtrasForBudget(totalAmount: number): string[] {
  if (totalAmount >= 300000) {
    return ["Transportation", "Videography", "Wedding Planner", "Live Band"];
  }
  if (totalAmount >= 100000) {
    return ["Transportation", "Videography", "Wedding Planner"];
  }
  return ["Transportation"];
}

export default function CategoryWizard({
  totalAmount,
  currency,
  onComplete,
  onCancel,
}: CategoryWizardProps) {
  const [step, setStep] = useState(0);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [weddingStyle, setWeddingStyle] = useState<string>("");
  const [extras, setExtras] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([]);
  const [dropped, setDropped] = useState<DroppedCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const extrasOptions = getExtrasForBudget(totalAmount);
  const totalSteps = 4;

  function togglePriority(p: string) {
    setPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  }

  function toggleExtra(e: string) {
    setExtras((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return priorities.length >= 1;
    if (step === 1) return weddingStyle !== "";
    if (step === 2) return true;
    return suggestions.length > 0;
  }

  async function handleNext() {
    if (step < 2) {
      setStep(step + 1);
    } else if (step === 2) {
      setLoading(true);
      setError(null);
      try {
        const result = await suggestCategories({ priorities, weddingStyle, extras });
        setSuggestions(result.categories);
        setDropped(result.dropped);
        setStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get suggestions");
      } finally {
        setLoading(false);
      }
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function updateSuggestionAmount(idx: number, value: string) {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) return;
    setSuggestions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, allocatedAmount: amount } : s)),
    );
  }

  function removeSuggestion(idx: number) {
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleCategoryExpand(idx: number) {
    setExpandedCategory((prev) => (prev === idx ? null : idx));
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      await bulkReplaceCategories(
        suggestions.map((s) => ({
          name: s.name,
          allocatedAmount: s.allocatedAmount,
          vendors: s.vendors,
        })),
      );
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save categories");
    } finally {
      setSaving(false);
    }
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  }

  function formatPrice(min: number | null, max: number | null) {
    if (min == null) return "Price not listed";
    if (max != null && max !== min) return `${formatAmount(min)}\u2013${formatAmount(max)} ${currency}`;
    return `From ${formatAmount(min)} ${currency}`;
  }

  const suggestedTotal = suggestions.reduce((sum, s) => sum + s.allocatedAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FiZap className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-gray-900">Smart Budget Setup</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-pink-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Step {step + 1} of {totalSteps}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Priorities */}
          {step === 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                What matters most to you?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Pick up to 3 priorities. We&apos;ll allocate more budget to these.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_OPTIONS.map((p) => {
                  const selected = priorities.includes(p);
                  const rank = priorities.indexOf(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className={`relative p-3 rounded-xl border-2 text-left text-sm font-medium transition-all cursor-pointer ${
                        selected
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      } ${!selected && priorities.length >= 3 ? "opacity-50" : ""}`}
                    >
                      {p}
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">
                          {rank + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Wedding Style */}
          {step === 1 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                What&apos;s your wedding style?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                This helps us balance venue, catering, and entertainment allocations.
              </p>
              <div className="space-y-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setWeddingStyle(s.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      weddingStyle === s.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-800">{s.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Extras */}
          {step === 2 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Any extras you&apos;d like?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Optional add-ons based on your budget. Select any that apply, or skip.
              </p>
              <div className="space-y-2">
                {extrasOptions.map((e) => {
                  const selected = extras.includes(e);
                  return (
                    <button
                      key={e}
                      onClick={() => toggleExtra(e)}
                      className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all cursor-pointer ${
                        selected
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{e}</span>
                        {selected && <FiCheck className="w-4 h-4 text-pink-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Your personalized breakdown
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Based on real vendors on our platform. Total: {formatAmount(suggestedTotal)} / {formatAmount(totalAmount)} {currency}
              </p>

              {/* Dropped categories warning */}
              {dropped.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-sm font-semibold text-amber-800">
                      {dropped.length} {dropped.length === 1 ? "category" : "categories"} adjusted for your budget
                    </span>
                  </div>
                  {dropped.map((d, i) => (
                    <p key={i} className="text-xs text-amber-700 ml-6 mt-1">
                      <span className="font-medium">{d.name}:</span> {d.reason}
                    </p>
                  ))}
                </div>
              )}

              {/* Total bar */}
              <div className="mb-4">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      suggestedTotal > totalAmount ? "bg-red-400" : "bg-gradient-to-r from-pink-500 to-purple-500"
                    }`}
                    style={{ width: `${Math.min((suggestedTotal / totalAmount) * 100, 100)}%` }}
                  />
                </div>
                {suggestedTotal > totalAmount && (
                  <p className="text-xs text-red-500 mt-1">Over budget by {formatAmount(suggestedTotal - totalAmount)} {currency}</p>
                )}
              </div>

              {/* Category list with vendor recommendations */}
              <div className="space-y-1">
                {suggestions.map((cat, idx) => {
                  const percent = totalAmount > 0 ? ((cat.allocatedAmount / totalAmount) * 100).toFixed(1) : "0";
                  const isExpanded = expandedCategory === idx;
                  const hasVendors = cat.vendors && cat.vendors.length > 0;

                  return (
                    <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                      {/* Category row */}
                      <div className="flex items-center gap-2 p-2.5 hover:bg-gray-50">
                        {hasVendors ? (
                          <button
                            onClick={() => toggleCategoryExpand(idx)}
                            className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {isExpanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <div className="w-[18px]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
                            <span className="text-xs text-gray-400">{percent}%</span>
                          </div>
                          {hasVendors && (
                            <button
                              onClick={() => toggleCategoryExpand(idx)}
                              className="text-[10px] text-pink-500 font-medium cursor-pointer hover:text-pink-700"
                            >
                              {cat.vendors.length} vendor{cat.vendors.length > 1 ? "s" : ""} recommended
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          value={cat.allocatedAmount}
                          onChange={(e) => updateSuggestionAmount(idx, e.target.value)}
                          min="0"
                          className="w-28 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                        />
                        <button
                          onClick={() => removeSuggestion(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Vendor recommendations (expandable) */}
                      {isExpanded && hasVendors && (
                        <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-2">
                          {cat.vendors.map((vendor) => (
                            <div key={vendor.id} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-gray-100">
                              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-pink-500">
                                  {vendor.businessName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/vendors/${vendor.id}`}
                                  className="text-sm font-medium text-gray-800 hover:text-pink-600 truncate block"
                                >
                                  {vendor.businessName}
                                </Link>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                  <span className="flex items-center gap-0.5">
                                    <FiStar className="w-3 h-3 text-amber-400" />
                                    {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                                  </span>
                                  {vendor.location && (
                                    <span className="flex items-center gap-0.5 truncate">
                                      <FiMapPin className="w-3 h-3" />
                                      {vendor.location}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatPrice(vendor.priceRangeMin, vendor.priceRangeMax)}
                                </p>
                                <p className="text-xs text-pink-600 mt-1 italic">
                                  &ldquo;{vendor.reason}&rdquo;
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-4" />
              <p className="text-sm text-gray-500">AI is analyzing vendors and crafting your budget...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={step === 0 ? onCancel : handleBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
          >
            {step === 0 ? (
              <>Cancel</>
            ) : (
              <>
                <FiChevronLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>

          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={!canAdvance() || loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              {step === 2 ? (
                <>
                  <FiZap className="w-4 h-4" />
                  Generate
                </>
              ) : (
                <>
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleConfirm}
              disabled={saving || suggestions.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              <FiCheck className="w-4 h-4" />
              {saving ? "Saving..." : "Apply This Breakdown"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
