import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { api, mediaUrl } from "../lib/api";
import { MediaUrlField } from "../components/media/MediaUrlField";
import { PencilIcon, TrashBinIcon } from "../icons";

type TeamMemberRow = {
  _id?: string;
  name: string;
  experience: string;
  position: string;
  shortDescription?: string;
  contactNumber?: string;
  state: string;
  instagram?: string;
  instagramSecondary?: string;
  imageUrl: string;
  order: number;
  active: boolean;
};

function emptyMember(order: number): TeamMemberRow {
  return {
    name: "",
    experience: "",
    position: "",
    shortDescription: "",
    contactNumber: "",
    state: "",
    instagram: "",
    instagramSecondary: "",
    imageUrl: "",
    order,
    active: true,
  };
}

export default function AdminTeamMembers() {
  const [items, setItems] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeamMemberRow>(emptyMember(0));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.teamMembersList();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = (item: TeamMemberRow) => {
    setEditingId(item._id!);
    setDraft({ ...item });
    setView("form");
  };

  const handleCreate = () => {
    setEditingId(null);
    setDraft(emptyMember(items.length));
    setView("form");
  };

  const handleSave = async () => {
    try {
      const body = {
        ...draft,
        name: draft.name.trim(),
        experience: draft.experience.trim(),
        position: draft.position.trim(),
        shortDescription: draft.shortDescription?.trim() || undefined,
        state: draft.state.trim(),
        contactNumber: draft.contactNumber?.trim() || undefined,
        instagram: draft.instagram?.trim().replace(/^@/, "") || undefined,
        instagramSecondary: draft.instagramSecondary?.trim().replace(/^@/, "") || undefined,
      };
      if (editingId) {
        await api.admin.teamMemberUpdate(editingId, body);
      } else {
        await api.admin.teamMemberCreate(body);
      }
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    try {
      await api.admin.teamMemberDelete(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Member",
        accessor: (m: TeamMemberRow) => (
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 grid place-items-center text-xs font-bold">
              {m.imageUrl ? (
                <img src={mediaUrl(m.imageUrl) ?? m.imageUrl} alt={m.name} className="size-full object-cover" />
              ) : (
                m.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</span>
              <span className="text-xs text-gray-500">
                {m.position} · {m.state}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Experience",
        accessor: (m: TeamMemberRow) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{m.experience}</span>
        ),
      },
      {
        header: "Description",
        accessor: (m: TeamMemberRow) => (
          <span className="line-clamp-2 max-w-[220px] text-sm text-gray-600 dark:text-gray-400">
            {m.shortDescription?.trim() || "—"}
          </span>
        ),
      },
      {
        header: "Contact",
        accessor: (m: TeamMemberRow) => (
          <span className="text-sm font-medium text-success">{m.contactNumber || "—"}</span>
        ),
      },
      {
        header: "Order",
        accessor: (m: TeamMemberRow) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">{m.order}</span>
        ),
      },
      {
        header: "Status",
        accessor: (m: TeamMemberRow) => (
          <Badge color={m.active ? "success" : "light"}>{m.active ? "Active" : "Hidden"}</Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (m: TeamMemberRow) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(m)}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/10"
            >
              <PencilIcon className="size-5" />
            </button>
            <button
              onClick={() => m._id && handleDelete(m._id)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
            >
              <TrashBinIcon className="size-5" />
            </button>
          </div>
        ),
      },
    ],
    [items]
  );

  return (
    <>
      <PageMeta title="Team leaders | StartSuccess Admin" description="About Us team profiles" />
      <PageBreadcrumb pageTitle="Team leaders" />

      <div className="space-y-6">
        {view === "list" ? (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profiles shown on the public About Us page. Upload photos and edit contact details here.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleCreate}>Add member</Button>
            </div>

            {error ? <Alert variant="error" title="Error" message={error} /> : null}

            <ComponentCard title={`Team members (${items.length})`}>
              <DataTable columns={columns} data={items} loading={loading} />
            </ComponentCard>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? "Edit member" : "New member"}
              </h3>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="Profile">
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Position</Label>
                      <Input
                        value={draft.position}
                        onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                        placeholder="CEO, Leader, HR"
                      />
                    </div>
                    <div>
                      <Label>Experience</Label>
                      <Input
                        value={draft.experience}
                        onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
                        placeholder="1 year, 2 years"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Short description</Label>
                    <textarea
                      value={draft.shortDescription ?? ""}
                      onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })}
                      rows={3}
                      maxLength={160}
                      placeholder="Brief intro shown on the About Us leader card (max 160 characters)"
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {(draft.shortDescription ?? "").length}/160 characters
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>State / City</Label>
                      <Input
                        value={draft.state}
                        onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Contact number</Label>
                      <Input
                        value={draft.contactNumber ?? ""}
                        onChange={(e) => setDraft({ ...draft, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Instagram</Label>
                      <Input
                        value={draft.instagram ?? ""}
                        onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label>Instagram (2nd)</Label>
                      <Input
                        value={draft.instagramSecondary ?? ""}
                        onChange={(e) => setDraft({ ...draft, instagramSecondary: e.target.value })}
                        placeholder="Optional second handle"
                      />
                    </div>
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Photo & display">
                <div className="space-y-4">
                  <MediaUrlField
                    label="Leader photo"
                    value={draft.imageUrl}
                    onChange={(imageUrl) => setDraft({ ...draft, imageUrl })}
                    kind="image"
                    hint="Team leader photo for About Us page. Uploads to AWS S3 images/."
                    required
                  />
                  <div>
                    <Label>Display order</Label>
                    <Input
                      type="number"
                      value={String(draft.order)}
                      onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="member-active"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="size-4 rounded border-gray-300 text-brand-500"
                    />
                    <Label htmlFor="member-active" className="mb-0 cursor-pointer">
                      Show on About Us page
                    </Label>
                  </div>
                  <Button className="w-full" onClick={handleSave}>
                    {editingId ? "Update member" : "Create member"}
                  </Button>
                </div>
              </ComponentCard>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
