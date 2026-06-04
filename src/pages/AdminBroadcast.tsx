import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";
import { PaperPlaneIcon } from "../icons";

export default function AdminBroadcast() {
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    type: "system",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      setError("Title and message body are required.");
      return;
    }
    
    if (!confirm(`Are you sure you want to broadcast this message to ALL users?`)) {
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.broadcastSend(draft);
      setSuccess("Broadcast message sent successfully to all users.");
      setDraft({ title: "", body: "", type: "system" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageMeta title="Broadcast | StartSuccess Admin" description="Send notifications to all users" />
      <PageBreadcrumb pageTitle="Broadcast Notifications" />

      <div className="max-w-4xl space-y-6">
        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Success" message={success} />}

        <ComponentCard title="Compose Message">
          <p className="text-sm text-gray-500 mb-6">
            This message will be delivered to all active users via the in-app notification system.
          </p>
          <div className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label>Notification Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Scheduled Maintenance"
                />
              </div>
              <div>
                <Label>Message Type</Label>
                <select
                  className="w-full h-11 px-4 border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                >
                  <option value="system">System Alert</option>
                  <option value="coupon_used">Promotion / Offer</option>
                  <option value="new_sale">New Sale</option>
                  <option value="new_referral">New Referral</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Message Body</Label>
              <TextArea
                value={draft.body}
                onChange={(val) => setDraft({ ...draft, body: val })}
                placeholder="Type your message here..."
                rows={6}
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <Button disabled={sending} onClick={handleSend} startIcon={<PaperPlaneIcon className="size-5" />}>
              {sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
