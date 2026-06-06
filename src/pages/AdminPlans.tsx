import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { Modal } from "../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";
import { PencilIcon, TrashBinIcon } from "../icons";
import { DataTable } from "../components/common/DataTable";
import type { PublicPricingCompareRow, PublicPricingTier } from "../lib/landing-pricing-types";

function emptyTier(): PublicPricingTier {
  return {
    id: `tier-${Date.now()}`,
    name: "New plan",
    tagline: "Short pitch for cards",
    price: 499,
    period: "one-time",
    features: ["First plan benefit"],
    highlight: false,
    showOnLanding: false,
    chip: "Chip label",
    savings: "Savings vs retail",
    description: "Long description for the plan.",
    accent: "from-primary/70 via-primary/40 to-transparent",
    courseIds: [],
  };
}

function padCells(cells: string[], n: number): string[] {
  const out = [...cells].slice(0, n);
  while (out.length < n) out.push("—");
  return out;
}

function syncCompareToTiers(
  tiers: PublicPricingTier[],
  rows: PublicPricingCompareRow[]
): PublicPricingCompareRow[] {
  const n = tiers.length;
  if (!n) return [];
  return rows.map((r) => ({
    label: (r.label || "Feature").trim(),
    cells: padCells((r.cells || []).map((c) => String(c)), n),
  }));
}

export default function AdminPlans() {
  const [tiers, setTiers] = useState<PublicPricingTier[]>([]);
  const [compareRows, setCompareRows] = useState<PublicPricingCompareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planQ, setPlanQ] = useState("");

  const filteredTiers = useMemo(() => {
    const s = planQ.trim().toLowerCase();
    if (!s) return tiers;
    return tiers.filter((t) => t.name.toLowerCase().includes(s) || t.id.toLowerCase().includes(s));
  }, [tiers, planQ]);

  const [view, setView] = useState<"list" | "form">("list");
  const [tierIndex, setTierIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PublicPricingTier | null>(null);
  const [featureLines, setFeatureLines] = useState("");

  const [deleteTierIdx, setDeleteTierIdx] = useState<number | null>(null);
  const [allCourses, setAllCourses] = useState<
    { _id: string; title: string; slug?: string; isPublished?: boolean }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.landingPricingGet();
      const t = (data.tiers as PublicPricingTier[]) || [];
      const cr = (data.compareRows as PublicPricingCompareRow[]) || [];
      setTiers(t);
      setCompareRows(
        syncCompareToTiers(t, cr.length ? cr : [{ label: "Feature", cells: t.map(() => "—") }])
      );
      const courses = (await api.admin.coursesList()) as {
        _id: string;
        title: string;
        slug?: string;
        isPublished?: boolean;
      }[];
      setAllCourses(Array.isArray(courses) ? courses : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (currentTiers: PublicPricingTier[], currentRows: PublicPricingCompareRow[]) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const rows = syncCompareToTiers(currentTiers, currentRows);
      const cleanTiers = currentTiers.map((t) => ({
        ...t,
        id: (t.id || "").trim(),
        name: (t.name || "").trim(),
        tagline: (t.tagline || "").trim(),
        period: (t.period || "").trim(),
        features: (t.features || []).map((f) => (f || "").trim()).filter(Boolean),
        chip: (t.chip || "").trim(),
        savings: (t.savings || "").trim(),
        description: (t.description || "").trim(),
        accent: (t.accent || "").trim(),
        badge: t.badge?.trim() || undefined,
        highlight: !!t.highlight,
        showOnLanding: !!t.showOnLanding,
        courseIds: (t.courseIds ?? []).map((id) => String(id).trim()).filter(Boolean),
      }));
      await api.admin.landingPricingPatch({ tiers: cleanTiers, compareRows: rows });
      setSuccess("Changes saved successfully.");
      // Refresh local state from server response if needed, or just keep current
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save to database");
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  const openTier = (idx: number) => {
    setTierIndex(idx);
    setDraft({ ...tiers[idx], courseIds: tiers[idx].courseIds ?? [] });
    setFeatureLines(tiers[idx].features.join("\n"));
    setView("form");
    setSuccess(null);
    setError(null);
  };

  const openNewTier = () => {
    const t = emptyTier();
    setTierIndex(null);
    setDraft(t);
    setFeatureLines(t.features.join("\n"));
    setView("form");
    setSuccess(null);
    setError(null);
  };

  const saveTierDialogAndPersist = async () => {
    if (!draft) return;
    const features = featureLines
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const next: PublicPricingTier = {
      ...draft,
      id: draft.id.trim(),
      features: features.length ? features : ["Benefit"],
      badge: draft.badge?.trim() || undefined,
    };

    let newList: PublicPricingTier[];
    if (tierIndex === null) {
      newList = [...tiers, next];
    } else {
      newList = tiers.map((x, i) => (i === tierIndex ? next : x));
    }

    const newRows = syncCompareToTiers(newList, compareRows);

    // Update UI
    setTiers(newList);
    setCompareRows(newRows);
    setView("list");
    setDraft(null);
    window.scrollTo(0, 0);

    // Call API
    await persist(newList, newRows);
  };

  const confirmDeleteTierAndPersist = async () => {
    if (deleteTierIdx === null || tiers.length <= 1) return;
    const newList = tiers.filter((_, i) => i !== deleteTierIdx);
    const newRows = syncCompareToTiers(newList, compareRows);

    setTiers(newList);
    setCompareRows(newRows);
    setDeleteTierIdx(null);

    await persist(newList, newRows);
  };

  const handleManualPersist = () => persist(tiers, compareRows);

  const columns = useMemo(
    () => [
      {
        header: "Plan Info",
        accessor: (t: PublicPricingTier) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono italic">{t.id}</span>
          </div>
        ),
      },
      {
        header: "Pricing",
        accessor: (t: PublicPricingTier) => (
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ₹{t.price}
            <span className="text-xs text-gray-500 font-normal ml-1">/{t.period}</span>
          </span>
        ),
      },
      {
        header: "Benefits",
        accessor: (t: PublicPricingTier) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t.features?.length ?? 0} features
          </span>
        ),
      },
      {
        header: "Courses",
        accessor: (t: PublicPricingTier) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {t.courseIds?.length ?? 0} attached
          </span>
        ),
      },
      {
        header: "Flags",
        accessor: (t: PublicPricingTier) => (
          <div className="flex gap-1">
            {t.highlight ? (
              <Badge size="sm" color="success">
                Highlight
              </Badge>
            ) : null}
            {t.badge ? (
              <Badge size="sm" color="primary">
                {t.badge}
              </Badge>
            ) : null}
            {t.showOnLanding ? (
              <Badge size="sm" color="success">
                Landing
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (t: PublicPricingTier) => {
          const idx = tiers.findIndex((x) => x.id === t.id);
          return (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => openTier(idx)}
                title="Edit tier"
                className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/10 dark:text-gray-400"
              >
                <PencilIcon className="size-5" />
              </button>
              <button
                onClick={() => setDeleteTierIdx(idx)}
                disabled={tiers.length <= 1}
                title="Delete tier"
                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <TrashBinIcon className="size-5" />
              </button>
            </div>
          );
        },
      },
    ],
    [tiers]
  );

  return (
    <>
      <PageMeta title="Plans & pricing | StartSuccess Admin" description="Landing pricing tiers" />
      <PageBreadcrumb pageTitle="Plans & pricing" />
      <div className="space-y-6">
        {view === "list" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Changes are saved to the database immediately when you apply edits.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={openNewTier}>
                  Add tier
                </Button>
                <Button disabled={saving || loading} onClick={handleManualPersist}>
                  {saving ? "Saving…" : "Force Save"}
                </Button>
              </div>
            </div>

            {error ? <Alert variant="error" title="Error" message={error} /> : null}
            {success ? <Alert variant="success" title="Success" message={success} /> : null}

            <ComponentCard title={`Tiers (${tiers.length})`}>
              <DataTable
                columns={columns}
                data={filteredTiers}
                loading={loading}
                onSearch={setPlanQ}
                searchPlaceholder="Search plans..."
              />
            </ComponentCard>

            <ComponentCard title="Compare table">
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const n = tiers.length;
                    if (!n) return;
                    const newRows = [
                      ...compareRows,
                      { label: "New row", cells: tiers.map(() => "—") },
                    ];
                    setCompareRows(newRows);
                    void persist(tiers, newRows);
                  }}
                >
                  Add row
                </Button>
              </div>
              {tiers.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableCell
                          isHeader
                          className="min-w-[140px] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          Feature
                        </TableCell>
                        {tiers.map((t) => (
                          <TableCell
                            key={t.id}
                            isHeader
                            className="min-w-[120px] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {t.name}
                          </TableCell>
                        ))}
                        <TableCell isHeader className="w-12 px-2 py-3">
                          {" "}
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compareRows.map((row, ri) => (
                        <TableRow
                          key={`${row.label}-${ri}`}
                          className="border-b border-gray-100 dark:border-white/[0.05]"
                        >
                          <TableCell className="px-2 py-2">
                            <Input
                              value={row.label}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCompareRows(
                                  compareRows.map((r, i) => (i === ri ? { ...r, label: v } : r))
                                );
                              }}
                              onBlur={() => void persist(tiers, compareRows)}
                            />
                          </TableCell>
                          {tiers.map((_, ci) => (
                            <TableCell key={ci} className="px-2 py-2">
                              <Input
                                value={row.cells[ci] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setCompareRows(
                                    compareRows.map((r, i) => {
                                      if (i !== ri) return r;
                                      const cells = [...padCells(r.cells, tiers.length)];
                                      cells[ci] = v;
                                      return { ...r, cells };
                                    })
                                  );
                                }}
                                onBlur={() => void persist(tiers, compareRows)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="px-2 py-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newRows = compareRows.filter((_, i) => i !== ri);
                                setCompareRows(newRows);
                                void persist(tiers, newRows);
                              }}
                            >
                              ×
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Add at least one tier first.</p>
              )}
            </ComponentCard>
          </>
        ) : (
          <div className="space-y-6">
            {draft && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setView("list")}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-white/5 transition-colors"
                    >
                      <svg
                        className="size-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                    </button>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {tierIndex === null ? "New tier" : "Edit tier"}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setView("list")}>
                      Cancel
                    </Button>
                    <Button disabled={saving} onClick={saveTierDialogAndPersist}>
                      {saving ? "Saving..." : "Apply & Save"}
                    </Button>
                  </div>
                </div>

                {error ? <Alert variant="error" title="Error" message={error} /> : null}

                <div className="grid gap-6 lg:grid-cols-2">
                  <ComponentCard title="General Info">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Id (slug)</Label>
                        <Input
                          value={draft.id}
                          onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Tagline</Label>
                      <Input
                        value={draft.tagline}
                        onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      <div>
                        <Label>Price (₹)</Label>
                        <Input
                          type="number"
                          value={String(draft.price)}
                          onChange={(e) =>
                            setDraft({ ...draft, price: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label>Period</Label>
                        <Input
                          value={draft.period}
                          onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                        />
                      </div>
                    </div>
                  </ComponentCard>

                  <ComponentCard title="Benefits & Features">
                    <Label>Plan benefits (one per line)</Label>
                    <TextArea rows={8} value={featureLines} onChange={setFeatureLines} />
                  </ComponentCard>

                  <ComponentCard title="Included courses (playlist)">
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                      Members with this plan can watch all lessons in selected courses (full curriculum unlock).
                    </p>
                    {allCourses.length === 0 ? (
                      <p className="text-sm text-gray-500">No courses in catalog. Create courses first.</p>
                    ) : (
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        {allCourses.map((c) => {
                          const selected = (draft.courseIds ?? []).includes(c._id);
                          return (
                            <label
                              key={c._id}
                              className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300"
                                checked={selected}
                                onChange={() => {
                                  const prev = draft.courseIds ?? [];
                                  const next = selected
                                    ? prev.filter((id) => id !== c._id)
                                    : [...prev, c._id];
                                  setDraft({ ...draft, courseIds: next });
                                }}
                              />
                              <span className="text-sm text-gray-800 dark:text-gray-200">
                                {c.title}
                                {!c.isPublished ? (
                                  <span className="ml-2 text-xs text-amber-600">(draft)</span>
                                ) : null}
                                {c.slug ? (
                                  <span className="ml-1 block text-xs text-gray-500 font-mono">{c.slug}</span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {(draft.courseIds ?? []).length} course(s) selected
                    </p>
                  </ComponentCard>

                  <ComponentCard title="Visuals & Badges">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showOnLanding"
                          checked={!!draft.showOnLanding}
                          onChange={(e) => setDraft({ ...draft, showOnLanding: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500"
                        />
                        <Label htmlFor="showOnLanding" className="cursor-pointer">
                          Show on landing page (homepage pricing cards)
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="highlight"
                          checked={!!draft.highlight}
                          onChange={(e) => setDraft({ ...draft, highlight: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500"
                        />
                        <Label htmlFor="highlight" className="cursor-pointer">
                          Highlight column (Premium Look)
                        </Label>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Badge (optional)</Label>
                        <Input
                          value={draft.badge ?? ""}
                          onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Chip label</Label>
                        <Input
                          value={draft.chip}
                          onChange={(e) => setDraft({ ...draft, chip: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Savings line</Label>
                      <Input
                        value={draft.savings}
                        onChange={(e) => setDraft({ ...draft, savings: e.target.value })}
                      />
                    </div>
                  </ComponentCard>

                  <ComponentCard title="Additional Details">
                    <div>
                      <Label>Description</Label>
                      <TextArea
                        rows={4}
                        value={draft.description}
                        onChange={(v) => setDraft({ ...draft, description: v })}
                      />
                    </div>
                    <div className="mt-4">
                      <Label>Accent (Tailwind gradient fragment)</Label>
                      <Input
                        value={draft.accent}
                        onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
                      />
                    </div>
                  </ComponentCard>
                </div>

                {/* Sticky Action Bar */}
                <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-6 px-4 sm:px-6 lg:px-6 py-4 bg-white/80 backdrop-blur-md border-t border-gray-200 dark:bg-gray-900/80 dark:border-gray-800 flex items-center justify-end gap-3 z-10">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setView("list");
                      window.scrollTo(0, 0);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button disabled={saving} onClick={saveTierDialogAndPersist} className="w-full sm:w-auto min-w-[140px]">
                    {saving ? "Saving..." : "Apply & Save"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteTierIdx !== null}
        onClose={() => setDeleteTierIdx(null)}
        className="max-w-md w-full p-6 m-4"
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          Remove this tier?
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          This will delete the tier from the database immediately.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTierIdx(null)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={confirmDeleteTierAndPersist}>
            {saving ? "Deleting..." : "Remove"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
