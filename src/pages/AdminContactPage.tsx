import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import Badge from "../components/ui/badge/Badge";
import { Modal } from "../components/ui/modal";
import { DataTable } from "../components/common/DataTable";
import { api } from "../lib/api";
import { TrashBinIcon } from "../icons";

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

type ContactInquiryItem = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  status?: string;
  createdAt?: string;
};

const INQUIRY_LIMIT = 20;

export default function AdminContactPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ContactPageForm>(EMPTY);

  const [inquiries, setInquiries] = useState<ContactInquiryItem[]>([]);
  const [inquiryTotal, setInquiryTotal] = useState(0);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquirySearch, setInquirySearch] = useState("");
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null);
  const [deletingInquiry, setDeletingInquiry] = useState(false);

  const loadInquiries = useCallback(async (p = 1) => {
    setInquiriesLoading(true);
    try {
      const res = await api.admin.contactInquiriesList({ page: p, limit: INQUIRY_LIMIT });
      setInquiries((res.items as ContactInquiryItem[]) || []);
      setInquiryTotal(res.total || 0);
      setInquiryPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contact messages");
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

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
    void loadInquiries(1);
  }, [load, loadInquiries]);

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

  const filteredInquiries = useMemo(() => {
    const s = inquirySearch.trim().toLowerCase();
    if (!s) return inquiries;
    return inquiries.filter(
      (item) =>
        item.name?.toLowerCase().includes(s) ||
        item.email?.toLowerCase().includes(s) ||
        item.topic?.toLowerCase().includes(s) ||
        item.message?.toLowerCase().includes(s) ||
        (item.phone || "").toLowerCase().includes(s),
    );
  }, [inquiries, inquirySearch]);

  const inquiryColumns = useMemo(
    () => [
      {
        header: "Name",
        accessor: (item: ContactInquiryItem) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{item.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.email}</span>
          </div>
        ),
      },
      {
        header: "Phone",
        accessor: (item: ContactInquiryItem) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{item.phone || "—"}</span>
        ),
      },
      {
        header: "Topic",
        accessor: (item: ContactInquiryItem) => (
          <Badge size="sm" color="primary">{item.topic}</Badge>
        ),
      },
      {
        header: "Message",
        accessor: (item: ContactInquiryItem) => (
          <p className="max-w-xs text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.message}</p>
        ),
      },
      {
        header: "Date",
        accessor: (item: ContactInquiryItem) => (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "—"}
          </span>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (item: ContactInquiryItem) => (
          <button
            onClick={() => setDeleteInquiryId(item._id)}
            title="Delete message"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10"
          >
            <TrashBinIcon className="size-5" />
          </button>
        ),
      },
    ],
    [],
  );

  const confirmDeleteInquiry = async () => {
    if (!deleteInquiryId) return;
    setDeletingInquiry(true);
    try {
      await api.admin.contactInquiryDelete(deleteInquiryId);
      setSuccess("Contact message deleted.");
      setDeleteInquiryId(null);
      await loadInquiries(inquiryPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingInquiry(false);
    }
  };

  const inquiryTotalPages = Math.ceil(inquiryTotal / INQUIRY_LIMIT);

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

        <ComponentCard
          title={`Contact form messages (${inquiryTotal})`}
          desc="Messages submitted from the public Contact page and homepage contact section."
        >
          <DataTable
            columns={inquiryColumns}
            data={filteredInquiries}
            loading={inquiriesLoading}
            onSearch={setInquirySearch}
            searchPlaceholder="Search by name, email, topic, or message..."
          />

          {inquiryTotalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {inquiryPage} of {inquiryTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inquiryPage <= 1 || inquiriesLoading}
                  onClick={() => void loadInquiries(inquiryPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inquiryPage >= inquiryTotalPages || inquiriesLoading}
                  onClick={() => void loadInquiries(inquiryPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </ComponentCard>
      </div>

      <Modal isOpen={Boolean(deleteInquiryId)} onClose={() => setDeleteInquiryId(null)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Delete message?</h3>
          <p className="mt-2 text-sm text-gray-500">This contact inquiry will be permanently removed.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteInquiryId(null)} disabled={deletingInquiry}>
              Cancel
            </Button>
            <Button onClick={() => void confirmDeleteInquiry()} disabled={deletingInquiry}>
              {deletingInquiry ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
