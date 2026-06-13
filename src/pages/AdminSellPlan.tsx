import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";

type Plan = { _id: string; name: string; price: number; promoPrice?: number };

type Quote = {
  subtotal: number;
  discountAmount: number;
  finalSubtotal: number;
  total: number;
  discountLabel?: string;
  referrerName?: string;
  commissionPreview?: {
    paidAmount: number;
    sellerShare: number;
    parentShare: number;
    platformShare: number;
    sellerPercent: number;
    parentPercent: number;
    platformPercent: number;
    promoOwnerName?: string;
  };
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card (offline POS)" },
  { value: "other", label: "Other" },
] as const;

function formatInr(n?: number) {
  if (n == null || Number.isNaN(n)) return "0";
  return Math.round(n).toLocaleString("en-IN");
}

export default function AdminSellPlan() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [contact, setContact] = useState("");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const list = await api.admin.plansActive();
      const arr = Array.isArray(list) ? list : [];
      setPlans(arr);
      if (arr[0]?._id) setPlanId(String(arr[0]._id));
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const selectedPlan = useMemo(() => plans.find((p) => p._id === planId), [plans, planId]);
  const promoReady = Boolean(appliedPromo && appliedPromo === promo.trim().toUpperCase());

  const pricing = useMemo(() => {
    const base = selectedPlan?.price ?? 0;
    const hasPromo = Boolean(promo.trim());

    if (quote && promoReady) {
      return {
        subtotal: quote.subtotal ?? base,
        discountAmount: quote.discountAmount ?? 0,
        discountedSubtotal: quote.finalSubtotal ?? base,
        total: quote.total ?? quote.finalSubtotal ?? base,
        discountLabel: quote.discountLabel,
      };
    }

    if (hasPromo && selectedPlan?.promoPrice != null && selectedPlan.promoPrice < base) {
      return {
        subtotal: base,
        discountAmount: base - selectedPlan.promoPrice,
        discountedSubtotal: selectedPlan.promoPrice,
        total: selectedPlan.promoPrice,
        discountLabel: `Member promo price ₹${formatInr(selectedPlan.promoPrice)}`,
      };
    }

    return {
      subtotal: base,
      discountAmount: 0,
      discountedSubtotal: base,
      total: base,
      discountLabel: undefined as string | undefined,
    };
  }, [quote, selectedPlan, promo, promoReady]);

  const { subtotal, discountAmount, discountedSubtotal, total } = pricing;

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code || !planId) return;
    setQuoteLoading(true);
    setPromoError(null);
    setAppliedPromo(null);
    setQuote(null);
    try {
      const q = (await api.admin.planSaleQuote({ planId, promoCode: code })) as Quote;
      setQuote(q);
      setAppliedPromo(code);
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Invalid promo code");
    } finally {
      setQuoteLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCredentials(null);
    setSaleId(null);

    const code = promo.trim().toUpperCase();
    if (!code || !promoReady) {
      setError("Apply a valid member promo code first.");
      return;
    }
    if (!paymentMethod) {
      setError("Select a payment method.");
      return;
    }

    setLoading(true);
    try {
      const result = (await api.admin.planSaleCreateOffline({
        fullName: fullName.trim(),
        email: email.trim(),
        dateOfBirth: dob,
        contactNumber: contact.trim(),
        promoCode: code,
        planId,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
      })) as {
        message?: string;
        sale?: { _id?: string };
        buyerCredentials?: { email: string; temporaryPassword: string };
      };

      if (result.buyerCredentials?.temporaryPassword) {
        setCredentials(result.buyerCredentials);
      }
      if (result.sale?._id) setSaleId(result.sale._id);
      setSuccess(
        result.message ??
          "Offline payment recorded. Buyer account created — approve the plan in Plan sales.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record sale");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setDob("");
    setContact("");
    setPromo("");
    setAppliedPromo(null);
    setQuote(null);
    setPaymentMethod("");
    setPaymentReference("");
    setAdminNote("");
    setSuccess(null);
    setCredentials(null);
    setSaleId(null);
    setError(null);
  };

  return (
    <>
      <PageMeta title="Sell plan | StartSuccess Admin" description="Record offline plan sales" />
      <PageBreadcrumb pageTitle="Sell plan" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Record a plan sale with offline payment (cash, UPI, etc.). No Razorpay — buyer account is created
          immediately; activate the plan from{" "}
          <Link to="/admin/plan-sales" className="text-brand-500 hover:underline">
            Plan sales
          </Link>
          .
        </p>
      </div>

      {error ? <Alert variant="error" title="Error" message={error} className="mb-4" /> : null}

      {success ? (
        <div className="mb-6 space-y-4">
          <Alert variant="success" title="Sale recorded" message={success} />
          {credentials ? (
            <ComponentCard title="Buyer login (share with buyer)">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email: <strong className="text-gray-900 dark:text-white">{credentials.email}</strong>
                <br />
                Password:{" "}
                <strong className="font-mono text-gray-900 dark:text-white">
                  {credentials.temporaryPassword}
                </strong>
              </p>
            </ComponentCard>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {saleId ? (
              <Link
                to="/admin/plan-sales"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Review in Plan sales
              </Link>
            ) : null}
            <Button onClick={resetForm}>Record another sale</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-6">
            <ComponentCard title="Choose plan">
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Original price is shown crossed out; promo price is charged with a member code.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.length === 0 ? (
                  <p className="text-sm text-gray-500 sm:col-span-2">No active plans.</p>
                ) : (
                  plans.map((p) => {
                    const selected = planId === p._id;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setPlanId(p._id);
                          setAppliedPromo(null);
                          setQuote(null);
                        }}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          selected
                            ? "border-brand-500 bg-brand-500/5 ring-2 ring-brand-500/20"
                            : "border-gray-200 hover:border-brand-300 dark:border-gray-700"
                        }`}
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">{p.name}</div>
                        <div className="mt-2 flex flex-col gap-1">
                          {p.promoPrice != null && p.promoPrice < p.price ? (
                            <>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Original:</span>
                                <span className="font-medium text-red-500 line-through">
                                  ₹{formatInr(p.price)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-600">Promo:</span>
                                <span className="text-xl font-extrabold text-emerald-600">
                                  ₹{formatInr(p.promoPrice)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              ₹{formatInr(p.price)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ComponentCard>

            <ComponentCard title="Buyer registration">
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Buyer account is created when you submit. Plan access starts after approval in Plan sales.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Full name *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>Date of birth *</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
                <div>
                  <Label>Contact number *</Label>
                  <Input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} required />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Member promo code *">
              <div className="flex flex-wrap gap-2">
                <Input
                  className="flex-1 font-mono uppercase"
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value.toUpperCase());
                    setAppliedPromo(null);
                    setQuote(null);
                    setPromoError(null);
                  }}
                  placeholder="MEMBER-PROMO-CODE"
                  required
                />
                <Button type="button" variant="outline" disabled={quoteLoading || !promo.trim()} onClick={() => void applyPromo()}>
                  {quoteLoading ? "Checking…" : "Apply code"}
                </Button>
              </div>
              {promoError ? <p className="mt-2 text-sm text-red-500">{promoError}</p> : null}
              {promoReady && quote?.discountLabel ? (
                <p className="mt-2 text-sm text-emerald-600">
                  {quote.discountLabel}
                  {quote.referrerName ? ` · ${quote.referrerName}` : ""}
                </p>
              ) : null}
            </ComponentCard>

            <ComponentCard title="Payment (offline)">
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Select how the buyer paid. Razorpay is not used here.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Payment method *</Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="" disabled>
                      Select payment method
                    </option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Payment reference (optional)</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="UPI txn ID, receipt no., bank ref…"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Admin note (optional)</Label>
                  <TextArea rows={3} value={adminNote} onChange={setAdminNote} />
                </div>
              </div>
            </ComponentCard>

            <Button type="submit" disabled={loading || !planId || !promoReady || !paymentMethod} className="w-full sm:w-auto min-w-[200px]">
              {loading ? "Recording…" : `Confirm sale · ₹${formatInr(total)}`}
            </Button>
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <ComponentCard title="Order summary">
              {selectedPlan ? (
                <>
                  <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                    <p className="text-xs font-medium text-brand-500">Plan membership</p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{selectedPlan.name}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Buyer: {fullName.trim() || "—"}
                      <br />
                      {email.trim() || "Email not entered"}
                    </p>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Plan price</dt>
                      <dd>₹{formatInr(subtotal)}</dd>
                    </div>
                    {discountAmount > 0 ? (
                      <div className="flex justify-between text-emerald-600">
                        <dt>
                          Promo discount
                          {pricing.discountLabel ? ` (${pricing.discountLabel})` : ""}
                        </dt>
                        <dd>−₹{formatInr(discountAmount)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Price after promo</dt>
                      <dd className="font-semibold">₹{formatInr(discountedSubtotal)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold dark:border-gray-700">
                      <dt>Total collected</dt>
                      <dd className="text-brand-500">{quoteLoading ? "…" : `₹${formatInr(total)}`}</dd>
                    </div>
                  </dl>
                  {paymentMethod ? (
                    <p className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/5">
                      Payment:{" "}
                      <strong>
                        {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod}
                      </strong>
                      {paymentReference.trim() ? (
                        <>
                          <br />
                          Ref: <span className="font-mono">{paymentReference.trim()}</span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {promo.trim() ? (
                    <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/5">
                      Promo: <span className="font-mono font-semibold">{promo.trim().toUpperCase()}</span>
                    </p>
                  ) : null}
                  {quote?.commissionPreview && promoReady ? (
                    <div className="mt-4 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-3 text-xs">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Commission preview (on ₹{formatInr(quote.commissionPreview.paidAmount)})
                      </p>
                      <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                        <li className="flex justify-between">
                          <span>
                            Seller ({quote.commissionPreview.sellerPercent}%)
                            {quote.commissionPreview.promoOwnerName
                              ? ` · ${quote.commissionPreview.promoOwnerName}`
                              : ""}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₹{formatInr(quote.commissionPreview.sellerShare)}
                          </span>
                        </li>
                        {quote.commissionPreview.parentShare > 0 ? (
                          <li className="flex justify-between">
                            <span>Upline ({quote.commissionPreview.parentPercent}%)</span>
                            <span>₹{formatInr(quote.commissionPreview.parentShare)}</span>
                          </li>
                        ) : null}
                        <li className="flex justify-between">
                          <span>Platform ({quote.commissionPreview.platformPercent}%)</span>
                          <span>₹{formatInr(quote.commissionPreview.platformShare)}</span>
                        </li>
                      </ul>
                    </div>
                  ) : null}
                  {!promoReady ? (
                    <p className="mt-4 text-sm text-amber-600">Apply a valid promo code to continue.</p>
                  ) : null}
                </>
              ) : null}
            </ComponentCard>
          </div>
        </form>
      )}
    </>
  );
}
