import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import Alert from "../components/ui/alert/Alert";
import { Modal } from "../components/ui/modal";
import { DataTable } from "../components/common/DataTable";
import { api } from "../lib/api";
import { TrashBinIcon } from "../icons";

type ReviewItem = {
  _id: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  userId?: { _id: string; name?: string; email?: string };
  courseId?: { _id: string; title?: string; slug?: string };
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`size-4 ${s <= value ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.reviewsList({ page: p, limit: LIMIT });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.admin.reviewDelete(deleteId);
      setSuccess("Review deleted.");
      setDeleteId(null);
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const s = searchQ.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (r) =>
        r.userId?.name?.toLowerCase().includes(s) ||
        r.userId?.email?.toLowerCase().includes(s) ||
        r.courseId?.title?.toLowerCase().includes(s) ||
        (r.comment || "").toLowerCase().includes(s)
    );
  }, [items, searchQ]);

  const ratingBadgeColor = (r: number) => {
    if (r >= 4) return "success";
    if (r === 3) return "warning";
    return "error";
  };

  const columns = useMemo(
    () => [
      {
        header: "User",
        accessor: (r: ReviewItem) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              {r.userId?.name || "Unknown"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{r.userId?.email || "-"}</span>
          </div>
        ),
      },
      {
        header: "Course",
        accessor: (r: ReviewItem) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
            {r.courseId?.title || "-"}
          </span>
        ),
      },
      {
        header: "Rating",
        accessor: (r: ReviewItem) => (
          <div className="flex items-center gap-2">
            <StarRating value={r.rating} />
            <Badge size="sm" color={ratingBadgeColor(r.rating)}>
              {r.rating}/5
            </Badge>
          </div>
        ),
      },
      {
        header: "Comment",
        accessor: (r: ReviewItem) => (
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs line-clamp-2">
            {r.comment || <span className="italic text-gray-400">No comment</span>}
          </p>
        ),
      },
      {
        header: "Date",
        accessor: (r: ReviewItem) => (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}
          </span>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (r: ReviewItem) => (
          <button
            onClick={() => setDeleteId(r._id)}
            title="Delete review"
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-gray-400"
          >
            <TrashBinIcon className="size-5" />
          </button>
        ),
      },
    ],
    []
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <PageMeta title="Reviews | StartSuccess Admin" description="Moderate user course reviews" />
      <PageBreadcrumb pageTitle="Reviews" />

      <div className="space-y-6">
        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Success" message={success} />}

        <ComponentCard
          title={`All Reviews (${total})`}
          desc="Moderate and remove inappropriate course reviews."
        >
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            onSearch={setSearchQ}
            searchPlaceholder="Search by user, course, or comment..."
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages} · {total} total reviews
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => void load(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => void load(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        className="max-w-md w-full p-6 m-4"
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Delete this review?</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          This action is permanent and cannot be undone. The review will be removed from the course.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="error" disabled={deleting} onClick={confirmDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
