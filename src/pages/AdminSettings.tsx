import { useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    couponOwnerPercent: 0,
    platformPercent: 0,
    directParentPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.admin.settingsGet();
        setSettings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.settingsUpdate(settings);
      setSuccess("Global settings updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading settings...</div>;

  return (
    <>
      <PageMeta title="System Settings | StartSuccess Admin" description="Control platform parameters" />
      <PageBreadcrumb pageTitle="System Settings" />

      <div className="max-w-4xl space-y-6">
        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Success" message={success} />}

        <ComponentCard title="Commission Configuration">
          <p className="text-sm text-gray-500 mb-6">
            Define how course revenue is distributed. The total should ideally equal the course price minus taxes.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Platform Share (%)</Label>
              <Input
                type="number"
                value={String(settings.platformPercent)}
                onChange={(e) =>
                  setSettings({ ...settings, platformPercent: Number(e.target.value) })
                }
                placeholder="e.g. 20"
              />
              <p className="mt-1 text-xs text-gray-400">Company's direct profit from each sale.</p>
            </div>
            <div>
              <Label>Coupon Owner Share (%)</Label>
              <Input
                type="number"
                value={String(settings.couponOwnerPercent)}
                onChange={(e) =>
                  setSettings({ ...settings, couponOwnerPercent: Number(e.target.value) })
                }
                placeholder="e.g. 50"
              />
              <p className="mt-1 text-xs text-gray-400">Direct active income for the seller.</p>
            </div>
            <div>
              <Label>Direct Parent Share (%)</Label>
              <Input
                type="number"
                value={String(settings.directParentPercent)}
                onChange={(e) =>
                  setSettings({ ...settings, directParentPercent: Number(e.target.value) })
                }
                placeholder="e.g. 10"
              />
              <p className="mt-1 text-xs text-gray-400">Passive income for the immediate upline.</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <Button disabled={saving} onClick={handleSave}>
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>
          </div>
        </ComponentCard>

        <ComponentCard title="System Controls">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Maintenance Mode</h4>
                <p className="text-xs text-gray-500">Disable storefront access for users.</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full dark:bg-gray-700 cursor-not-allowed opacity-50">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Enable Withdrawals</h4>
                <p className="text-xs text-gray-500">Allow users to request payout of their earnings.</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-brand-500 rounded-full cursor-not-allowed opacity-50">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
