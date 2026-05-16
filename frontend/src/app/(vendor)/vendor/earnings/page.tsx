"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiArrowDownCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import {
  getEarningsSummary,
  getPaymentHistory,
  getWithdrawalHistory,
  requestWithdrawal,
  listBanks,
} from "@/services/earnings.service";
import type {
  EarningsSummary,
  VendorPaymentRecord,
  Withdrawal,
  ChapaBank,
} from "@/types/payment";

type Tab = "payments" | "withdrawals";

export default function VendorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [payments, setPayments] = useState<VendorPaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("payments");

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [banks, setBanks] = useState<ChapaBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<ChapaBank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, paymentData, withdrawalData] = await Promise.all([
        getEarningsSummary(),
        getPaymentHistory(1, 20),
        getWithdrawalHistory(1, 20),
      ]);
      setSummary(summaryData);
      setPayments(paymentData.payments);
      setPaymentsTotal(paymentData.total);
      setWithdrawals(withdrawalData.withdrawals);
      setWithdrawalsTotal(withdrawalData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function openWithdrawModal() {
    setShowWithdrawModal(true);
    setError("");
    setSuccessMessage("");
    setWithdrawAmount("");
    setSelectedBank(null);
    setAccountNumber("");
    setAccountName("");

    if (banks.length === 0) {
      setBanksLoading(true);
      try {
        const data = await listBanks();
        setBanks(data);
      } catch {
        setError("Failed to load bank list");
      } finally {
        setBanksLoading(false);
      }
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!selectedBank) {
      setError("Select a bank");
      return;
    }
    if (!accountNumber.trim() || !accountName.trim()) {
      setError("Account number and name are required");
      return;
    }

    setWithdrawLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await requestWithdrawal({
        amount,
        bankCode: String(selectedBank.id),
        bankName: selectedBank.name,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });

      if (result.withdrawal.status === "completed") {
        setSuccessMessage(
          `Successfully withdrawn ${amount.toLocaleString()} ${summary?.currency ?? "ETB"} to ${selectedBank.name}`,
        );
      } else if (result.withdrawal.status === "failed") {
        setError(result.withdrawal.failureReason ?? "Transfer failed. Please try again.");
      } else {
        setSuccessMessage("Withdrawal submitted and is being processed.");
      }

      setShowWithdrawModal(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-10">
        <div>
          <div className="h-3 w-20 bg-warm-100 rounded animate-pulse mb-3" />
          <div className="h-9 w-40 bg-warm-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white p-8 animate-pulse">
              <div className="h-3 w-24 bg-warm-100 rounded mb-5" />
              <div className="h-8 w-36 bg-warm-100 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-warm-200/30 bg-white animate-pulse h-80" />
      </div>
    );
  }

  const currency = summary?.currency ?? "ETB";

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
            Financial
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            Earnings
          </h1>
          <p className="text-[14px] text-slate-400 font-light mt-2">
            Track your income and manage withdrawals
          </p>
        </div>
        {summary && summary.availableBalance > 0 && (
          <button
            onClick={openWithdrawModal}
            className="cursor-pointer group flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-full text-[13px] font-semibold shadow-[0_2px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800 hover:shadow-[0_4px_30px_rgba(15,23,42,0.2)] transition-all duration-500"
          >
            <FiArrowDownCircle className="w-4 h-4" />
            Withdraw
          </button>
        )}
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-[13px] text-red-600">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="cursor-pointer text-red-300 hover:text-red-500 transition-colors duration-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-[13px] text-emerald-700">
          <FiCheckCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="cursor-pointer text-emerald-300 hover:text-emerald-500 transition-colors duration-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Summary cards ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Available Balance */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-7 sm:p-8 hover:border-warm-200 hover:shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-700">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
                <FiDollarSign className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400">
                Available Balance
              </p>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              {summary.availableBalance.toLocaleString()}{" "}
              <span className="text-[14px] font-normal text-slate-300">{currency}</span>
            </p>
          </div>

          {/* Total Earned */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-7 sm:p-8 hover:border-warm-200 hover:shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-700">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/40 flex items-center justify-center">
                <FiTrendingUp className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400">
                Total Earned
              </p>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              {summary.totalEarned.toLocaleString()}{" "}
              <span className="text-[14px] font-normal text-slate-300">{currency}</span>
            </p>
            <p className="text-[12px] text-slate-400 font-light mt-2">
              {summary.paymentCount} payment{summary.paymentCount !== 1 ? "s" : ""} received
            </p>
          </div>

          {/* Total Withdrawn */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-7 sm:p-8 hover:border-warm-200 hover:shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-700">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center">
                <FiArrowDownCircle className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400">
                Total Withdrawn
              </p>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              {summary.totalWithdrawn.toLocaleString()}{" "}
              <span className="text-[14px] font-normal text-slate-300">{currency}</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction list ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white overflow-hidden">
        {/* Tab bar */}
        <div className="flex gap-1 p-2 bg-warm-50/50 border-b border-warm-200/30">
          <button
            onClick={() => setTab("payments")}
            className={`cursor-pointer flex-1 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-500 ${
              tab === "payments"
                ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Payments Received
            <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${
              tab === "payments" ? "bg-warm-100 text-slate-500" : "bg-transparent text-slate-300"
            }`}>
              {paymentsTotal}
            </span>
          </button>
          <button
            onClick={() => setTab("withdrawals")}
            className={`cursor-pointer flex-1 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-500 ${
              tab === "withdrawals"
                ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Withdrawals
            <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${
              tab === "withdrawals" ? "bg-warm-100 text-slate-500" : "bg-transparent text-slate-300"
            }`}>
              {withdrawalsTotal}
            </span>
          </button>
        </div>

        {/* Payments tab */}
        {tab === "payments" && (
          <div>
            {payments.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-5">
                  <FiDollarSign className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-[15px] font-medium text-slate-500 mb-1">No payments received yet</p>
                <p className="text-[13px] text-slate-400 font-light">
                  Payments from couples will appear here
                </p>
              </div>
            ) : (
              payments.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-4 px-6 sm:px-8 py-5 hover:bg-warm-50/30 transition-colors duration-500 ${
                    i < payments.length - 1 ? "border-b border-warm-200/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/30 flex items-center justify-center shrink-0">
                      <FiDollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-slate-800 truncate">
                        {p.coupleName ?? "Customer"}
                        {p.serviceCategory && (
                          <span className="text-slate-300 font-light"> · {p.serviceCategory}</span>
                        )}
                      </p>
                      <p className="text-[12px] text-slate-400 font-light mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {p.paymentMethod && ` · ${p.paymentMethod}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-semibold text-emerald-600">
                      +{p.netAmount.toLocaleString()} {p.currency}
                    </p>
                    {p.chargeAmount > 0 && (
                      <p className="text-[11px] text-slate-300 font-light mt-0.5">
                        {p.grossAmount.toLocaleString()} − {p.chargeAmount.toLocaleString()} fee
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Withdrawals tab */}
        {tab === "withdrawals" && (
          <div>
            {withdrawals.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-5">
                  <FiArrowDownCircle className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-[15px] font-medium text-slate-500 mb-1">No withdrawals yet</p>
                <p className="text-[13px] text-slate-400 font-light">
                  Your withdrawal history will appear here
                </p>
              </div>
            ) : (
              withdrawals.map((w, i) => (
                <div
                  key={w.id}
                  className={`flex items-center justify-between gap-4 px-6 sm:px-8 py-5 hover:bg-warm-50/30 transition-colors duration-500 ${
                    i < withdrawals.length - 1 ? "border-b border-warm-200/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/30 flex items-center justify-center shrink-0">
                      <FiArrowDownCircle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-[14px] font-medium text-slate-800 truncate">
                          {w.bankName} · {w.accountNumber}
                        </p>
                        <WithdrawalStatusBadge status={w.status} />
                      </div>
                      <p className="text-[12px] text-slate-400 font-light mt-0.5">
                        {new Date(w.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {w.failureReason && (
                          <span className="text-red-400"> · {w.failureReason}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-600 shrink-0">
                    −{w.amount.toLocaleString()} {w.currency}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Withdraw modal ── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] w-full max-w-md animate-scale-reveal">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-warm-200/30">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Withdraw Funds
                </h2>
                <p className="text-[12px] text-slate-400 font-light mt-0.5">
                  Transfer to your bank account
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="cursor-pointer w-8 h-8 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-warm-200 transition-all duration-500"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="p-8 space-y-5">
              {/* Modal error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-[12px] text-red-600">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Balance display */}
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/30 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-editorial text-emerald-500 mb-1">
                  Available balance
                </p>
                <p className="font-display text-2xl font-bold text-emerald-800 tracking-tight">
                  {summary?.availableBalance.toLocaleString()} {currency}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="1"
                  max={summary?.availableBalance}
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
                />
              </div>

              {/* Bank selector */}
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                  Bank
                </label>
                {banksLoading ? (
                  <div className="flex items-center gap-2 py-3 text-[13px] text-slate-400 font-light">
                    <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                    Loading banks...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedBank ? String(selectedBank.id) : ""}
                      onChange={(e) => {
                        const bank = banks.find((b) => String(b.id) === e.target.value) ?? null;
                        setSelectedBank(bank);
                      }}
                      required
                      className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none appearance-none transition-all duration-500 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
                    >
                      <option value="">Select a bank</option>
                      {banks.map((b) => (
                        <option key={String(b.id)} value={String(b.id)}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Account number */}
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  placeholder="e.g. 1000123456789"
                  className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
                />
              </div>

              {/* Account name */}
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  placeholder="Full name as on the bank account"
                  className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={withdrawLoading}
                className="cursor-pointer w-full py-3.5 rounded-xl text-[13px] font-semibold bg-slate-900 text-white shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500"
              >
                {withdrawLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Withdraw ${withdrawAmount ? parseFloat(withdrawAmount).toLocaleString() : "0"} ${currency}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { classes: string; icon: React.ReactNode; label: string }> = {
    pending: {
      classes: "bg-amber-50 text-amber-600 border-amber-200/40",
      icon: <FiClock className="w-3 h-3" />,
      label: "Pending",
    },
    completed: {
      classes: "bg-emerald-50 text-emerald-600 border-emerald-200/40",
      icon: <FiCheckCircle className="w-3 h-3" />,
      label: "Completed",
    },
    failed: {
      classes: "bg-red-50 text-red-500 border-red-200/40",
      icon: <FiXCircle className="w-3 h-3" />,
      label: "Failed",
    },
  };

  const c = config[status] ?? config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-luxury ${c.classes}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
