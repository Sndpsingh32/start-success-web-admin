import { useCallback, useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";

type ContactPageForm = {
  badgeText: string;
  headingPrefix: string;
  headingHighlight: string;
  headingSuffix: string;
  description: string;
  email: string;
  phone: string;
  office: string;
  responseTimeText: string;
  faqButtonLabel: string;
};

const EMPTY: ContactPageForm = {
  badgeText: "",
  headingPrefix: "",
  headingHighlight: "",
  headingSuffix: "",
  description: "",
  email: "",
  phone: "",
  office: "",
  responseTimeText: "",
  faqButtonLabel: "",
};

export default function AdminContactPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ContactPageForm>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.admin.contactPageGet()) as ContactPageForm;
      setForm({
        badgeText: data.badgeText ?? "",
        headingPrefix: data.headingPrefix ?? "",
        headingHighlight: data.headingHighlight ?? "",
        headingSuffix: data.headingSuffix ?? "",
        description: data.description ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        office: data.office ?? "",
        responseTimeText: data.responseTimeText ?? "",
        faqButtonLabel: data.faqButtonLabel ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contact page content");
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
      await api.admin.contactPagePatch(form);
      setSuccess("Contact page updated. Changes appear on the public site immediately.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save contact page");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ContactPageForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <PageMeta title="Contact page | Admin" description="Edit contact page left-side content" />
      <PageBreadcrumb pageTitle="Contact page" />

      <div className="space-y-6">
        {error ? <Alert variant="error" title="Error" message={error} showLink={false} /> : null}
        {success ? <Alert variant="success" title="Saved" message={success} showLink={false} /> : null}

        <ComponentCard title="Left section content">
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Controls the badge, heading, description, contact cards, and response-time text on the
            public Contact page and homepage contact section.
          </p>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <Label>Badge text</Label>
                <Input value={form.badgeText} onChange={(e) => set("badgeText", e.target.value)} />
              </div>
              <div>
                <Label>FAQ button label</Label>
                <Input
                  value={form.faqButtonLabel}
                  onChange={(e) => set("faqButtonLabel", e.target.value)}
                />
              </div>
              <div>
                <Label>Heading — before highlight</Label>
                <Input
                  value={form.headingPrefix}
                  onChange={(e) => set("headingPrefix", e.target.value)}
                  placeholder="Let's build your"
                />
              </div>
              <div>
                <Label>Heading — highlighted text</Label>
                <Input
                  value={form.headingHighlight}
                  onChange={(e) => set("headingHighlight", e.target.value)}
                  placeholder="next growth"
                />
              </div>
              <div>
                <Label>Heading — after highlight</Label>
                <Input
                  value={form.headingSuffix}
                  onChange={(e) => set("headingSuffix", e.target.value)}
                  placeholder="plan"
                />
              </div>
              <div className="lg:col-span-2">
                <Label>Description</Label>
                <TextArea
                  rows={4}
                  value={form.description}
                  onChange={(v) => set("description", v)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <Label>Office location</Label>
                <Input value={form.office} onChange={(e) => set("office", e.target.value)} />
              </div>
              <div>
                <Label>Response time text</Label>
                <Input
                  value={form.responseTimeText}
                  onChange={(e) => set("responseTimeText", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={() => void handleSave()} disabled={loading || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" onClick={() => void load()} disabled={loading || saving}>
              Reset
            </Button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
