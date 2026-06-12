import { useCallback, useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api, mediaUrl } from "../lib/api";
import { uploadMediaFile } from "../lib/media-upload";
import { TrashBinIcon } from "../icons";

type Slide = {
  eyebrow: string;
  title: string;
  highlight: string;
  suffix: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
};
type VisualMeta = { chip: string; metricLabel: string; metricValue: string; metricHint: string };
type StatCard = { key: string; value: number; suffix: string; label: string };
type Offer = { id: string; title: string; subtitle: string; cta: string; tone: "primary" | "accent" | "dark" };

type LandingHeroForm = {
  announcementBadge: string;
  referralBonusLabel: string;
  trustPills: string[];
  slides: Slide[];
  visualMeta: VisualMeta[];
  statCards: StatCard[];
  offers: Offer[];
};

export default function AdminLandingHero() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<LandingHeroForm>({
    announcementBadge: "",
    referralBonusLabel: "",
    trustPills: [],
    slides: [],
    visualMeta: [],
    statCards: [],
    offers: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.landingHeroGet();
      setForm({
        announcementBadge: data.announcementBadge || "",
        referralBonusLabel: data.referralBonusLabel || "",
        trustPills: data.trustPills || [],
        slides: data.slides || [],
        visualMeta: data.visualMeta || [],
        statCards: data.statCards || [],
        offers: data.offers || [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load landing hero data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.landingHeroPatch(form);
      setSuccess("Landing hero updated successfully.");
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof LandingHeroForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [uploadingSlide, setUploadingSlide] = useState<string | null>(null);

  const handleFileUpload = async (file: File, slideIndex: number, field: "imageUrl" | "videoUrl") => {
    const key = `${slideIndex}-${field}`;
    setUploadingSlide(key);
    try {
      const url = await uploadMediaFile(file, field === "videoUrl" ? "video" : "image");
      const newSlides = [...form.slides];
      newSlides[slideIndex][field] = url;
      updateField("slides", newSlides);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingSlide(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageBreadcrumb pageTitle="Landing Hero" />
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Landing Hero | StartSuccess Admin" description="Manage homepage hero section" />
      <PageBreadcrumb pageTitle="Landing Hero" />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure the main hero section of the landing page.
          </p>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {error ? <Alert variant="error" title="Error" message={error} /> : null}
        {success ? <Alert variant="success" title="Saved" message={success} /> : null}

        <ComponentCard title="General Settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Announcement Badge</Label>
              <Input
                value={form.announcementBadge}
                onChange={(e) => updateField("announcementBadge", e.target.value)}
                placeholder="e.g. New cohorts every Monday"
              />
            </div>
            <div>
              <Label>Referral Bonus Label</Label>
              <Input
                value={form.referralBonusLabel}
                onChange={(e) => updateField("referralBonusLabel", e.target.value)}
                placeholder="e.g. ₹500 / referral"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>Trust Pills (comma separated)</Label>
            <Input
              value={form.trustPills.join(", ")}
              onChange={(e) =>
                updateField(
                  "trustPills",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="e.g. 50K+ learners, Live mentorship"
            />
          </div>
        </ComponentCard>

        <ComponentCard title="Hero Slides">
          <div className="space-y-8">
            {form.slides.map((slide, index) => (
              <div key={index} className="p-6 border rounded-2xl border-gray-200 dark:border-gray-800 space-y-6 bg-gray-50/30 dark:bg-gray-900/30 relative">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-white">Slide {index + 1}</h4>
                  <button
                    onClick={() => {
                      const newSlides = [...form.slides];
                      newSlides.splice(index, 1);
                      updateField("slides", newSlides);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Eyebrow</Label>
                        <Input
                          value={slide.eyebrow}
                          onChange={(e) => {
                            const newSlides = [...form.slides];
                            newSlides[index].eyebrow = e.target.value;
                            updateField("slides", newSlides);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Title Prefix</Label>
                        <Input
                          value={slide.title}
                          onChange={(e) => {
                            const newSlides = [...form.slides];
                            newSlides[index].title = e.target.value;
                            updateField("slides", newSlides);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Highlight Word</Label>
                        <Input
                          value={slide.highlight}
                          onChange={(e) => {
                            const newSlides = [...form.slides];
                            newSlides[index].highlight = e.target.value;
                            updateField("slides", newSlides);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Suffix</Label>
                        <Input
                          value={slide.suffix}
                          onChange={(e) => {
                            const newSlides = [...form.slides];
                            newSlides[index].suffix = e.target.value;
                            updateField("slides", newSlides);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <TextArea
                        value={slide.description}
                        onChange={(val) => {
                          const newSlides = [...form.slides];
                          newSlides[index].description = val;
                          updateField("slides", newSlides);
                        }}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Slide Image</Label>
                        <div className="flex gap-2">
                          <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <span>
                              {uploadingSlide === `${index}-imageUrl`
                                ? "Uploading…"
                                : slide.imageUrl
                                  ? "Change Image"
                                  : "Upload Image"}
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], index, "imageUrl")}
                            />
                          </label>
                        </div>
                        {slide.imageUrl && (
                          <div className="mt-3 aspect-video w-full rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group relative">
                            <img src={mediaUrl(slide.imageUrl) ?? slide.imageUrl} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                               onClick={() => {
                                 const newSlides = [...form.slides];
                                 newSlides[index].imageUrl = "";
                                 updateField("slides", newSlides);
                               }}
                               className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Slide Video (Optional)</Label>
                        <div className="flex gap-2">
                          <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <span>
                              {uploadingSlide === `${index}-videoUrl`
                                ? "Uploading…"
                                : slide.videoUrl
                                  ? "Change Video"
                                  : "Upload Video"}
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="video/*"
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], index, "videoUrl")}
                            />
                          </label>
                        </div>
                        {slide.videoUrl && (
                          <div className="mt-3 aspect-video w-full rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center group relative">
                            <video src={mediaUrl(slide.videoUrl) ?? slide.videoUrl} controls className="max-h-full max-w-full" />
                            <button
                               onClick={() => {
                                 const newSlides = [...form.slides];
                                 newSlides[index].videoUrl = "";
                                 updateField("slides", newSlides);
                               }}
                               className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full py-4 border-dashed"
              onClick={() =>
                updateField("slides", [
                  ...form.slides,
                  { eyebrow: "", title: "", highlight: "", suffix: "", description: "", imageUrl: "", videoUrl: "" },
                ])
              }
            >
              + Add New Hero Slide
            </Button>
          </div>
        </ComponentCard>

        <ComponentCard title="Visual Meta (Hero Side Card)">
          <div className="space-y-6">
            {form.visualMeta.map((meta, index) => (
              <div key={index} className="p-4 border rounded-xl border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 dark:text-white">Item {index + 1}</h4>
                  <button
                    onClick={() => {
                      const newMeta = [...form.visualMeta];
                      newMeta.splice(index, 1);
                      updateField("visualMeta", newMeta);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Chip</Label>
                    <Input
                      value={meta.chip}
                      onChange={(e) => {
                        const newMeta = [...form.visualMeta];
                        newMeta[index].chip = e.target.value;
                        updateField("visualMeta", newMeta);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Metric Label</Label>
                    <Input
                      value={meta.metricLabel}
                      onChange={(e) => {
                        const newMeta = [...form.visualMeta];
                        newMeta[index].metricLabel = e.target.value;
                        updateField("visualMeta", newMeta);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Metric Value</Label>
                    <Input
                      value={meta.metricValue}
                      onChange={(e) => {
                        const newMeta = [...form.visualMeta];
                        newMeta[index].metricValue = e.target.value;
                        updateField("visualMeta", newMeta);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Metric Hint</Label>
                    <Input
                      value={meta.metricHint}
                      onChange={(e) => {
                        const newMeta = [...form.visualMeta];
                        newMeta[index].metricHint = e.target.value;
                        updateField("visualMeta", newMeta);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                updateField("visualMeta", [
                  ...form.visualMeta,
                  { chip: "", metricLabel: "", metricValue: "", metricHint: "" },
                ])
              }
            >
              Add Visual Meta
            </Button>
          </div>
        </ComponentCard>

        <ComponentCard title="Stat Cards">
          <div className="space-y-6">
            {form.statCards.map((stat, index) => (
              <div key={index} className="p-4 border rounded-xl border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 dark:text-white">Stat {index + 1}</h4>
                  <button
                    onClick={() => {
                      const newStats = [...form.statCards];
                      newStats.splice(index, 1);
                      updateField("statCards", newStats);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Key</Label>
                    <Input
                      value={stat.key}
                      onChange={(e) => {
                        const newStats = [...form.statCards];
                        newStats[index].key = e.target.value;
                        updateField("statCards", newStats);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={String(stat.value)}
                      onChange={(e) => {
                        const newStats = [...form.statCards];
                        newStats[index].value = Number(e.target.value) || 0;
                        updateField("statCards", newStats);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Suffix</Label>
                    <Input
                      value={stat.suffix}
                      onChange={(e) => {
                        const newStats = [...form.statCards];
                        newStats[index].suffix = e.target.value;
                        updateField("statCards", newStats);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = [...form.statCards];
                        newStats[index].label = e.target.value;
                        updateField("statCards", newStats);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                updateField("statCards", [...form.statCards, { key: "", value: 0, suffix: "", label: "" }])
              }
            >
              Add Stat Card
            </Button>
          </div>
        </ComponentCard>

        <ComponentCard title="Offers">
          <div className="space-y-6">
            {form.offers.map((offer, index) => (
              <div key={index} className="p-4 border rounded-xl border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 dark:text-white">Offer {index + 1}</h4>
                  <button
                    onClick={() => {
                      const newOffers = [...form.offers];
                      newOffers.splice(index, 1);
                      updateField("offers", newOffers);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>ID</Label>
                    <Input
                      value={offer.id}
                      onChange={(e) => {
                        const newOffers = [...form.offers];
                        newOffers[index].id = e.target.value;
                        updateField("offers", newOffers);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Tone</Label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-500"
                      value={offer.tone}
                      onChange={(e) => {
                        const newOffers = [...form.offers];
                        newOffers[index].tone = e.target.value as "primary" | "accent" | "dark";
                        updateField("offers", newOffers);
                      }}
                    >
                      <option value="primary">Primary</option>
                      <option value="accent">Accent</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={offer.title}
                    onChange={(e) => {
                      const newOffers = [...form.offers];
                      newOffers[index].title = e.target.value;
                      updateField("offers", newOffers);
                    }}
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={offer.subtitle}
                    onChange={(e) => {
                      const newOffers = [...form.offers];
                      newOffers[index].subtitle = e.target.value;
                      updateField("offers", newOffers);
                    }}
                  />
                </div>
                <div>
                  <Label>CTA Text</Label>
                  <Input
                    value={offer.cta}
                    onChange={(e) => {
                      const newOffers = [...form.offers];
                      newOffers[index].cta = e.target.value;
                      updateField("offers", newOffers);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                updateField("offers", [
                  ...form.offers,
                  { id: "", title: "", subtitle: "", cta: "", tone: "primary" },
                ])
              }
            >
              Add Offer
            </Button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
