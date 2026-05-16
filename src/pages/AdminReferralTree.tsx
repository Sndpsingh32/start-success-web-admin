import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";
import { UserCircleIcon, ChevronDownIcon, ChevronUpIcon } from "../icons";

type TreeNode = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  rank: string;
  avatarUrl?: string;
  createdAt: string;
  children: TreeNode[];
};

const NodeCard = ({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) => {
  const [expanded, setExpanded] = useState(isRoot || (node.children && node.children.length > 0));

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative z-10 flex flex-col items-center p-4 min-w-[200px] bg-white dark:bg-gray-900 border ${
          isRoot ? "border-brand-500 shadow-brand-500/20" : "border-gray-200 dark:border-gray-800"
        } rounded-2xl shadow-theme-sm`}
      >
        <div className="size-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-3">
          {node.avatarUrl ? (
            <img src={node.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <UserCircleIcon className="size-8 text-gray-400" />
          )}
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 text-center">
          {node.name || "Unknown User"}
        </h4>
        <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 mb-2">
          {node.referralCode || "N/A"}
        </code>
        <Badge size="sm" color={node.rank === "BRONZE" ? "light" : "primary"}>
          {node.rank || "MEMBER"}
        </Badge>

        {node.children && node.children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 flex items-center justify-center size-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full shadow-sm text-gray-500 hover:text-brand-500 transition-colors"
          >
            {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
          </button>
        )}
      </div>

      {expanded && node.children && node.children.length > 0 && (
        <div className="relative flex flex-col items-center mt-6">
          {/* Vertical line from parent to horizontal line */}
          <div className="absolute -top-6 w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

          <div className="flex gap-6 relative">
            {/* Horizontal line connecting siblings */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-gray-300 dark:bg-gray-700"
                style={{
                  left: "calc(50% / " + node.children.length + ")",
                  right: "calc(50% / " + node.children.length + ")",
                  width: `calc(100% - (100% / ${node.children.length}))`,
                }}
              ></div>
            )}

            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center pt-6">
                {/* Vertical line down to child */}
                <div className="absolute top-0 w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
                <NodeCard node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminReferralTree() {
  const { id } = useParams<{ id: string }>();
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await api.admin.userReferralTree(id);
        setTreeData(data as TreeNode);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load referral tree");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  return (
    <>
      <PageMeta title="Referral Network | StartSuccess Admin" description="View user affiliate tree" />
      <PageBreadcrumb pageTitle="Referral Network" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-500 transition-colors"
          >
            &larr; Back to Users List
          </Link>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <ComponentCard title="Affiliate Network Tree" className="overflow-x-auto min-h-[500px]">
          {loading ? (
            <div className="flex justify-center py-20 text-gray-500">Loading network structure...</div>
          ) : treeData ? (
            <div className="flex justify-center p-8 min-w-max">
              <NodeCard node={treeData} isRoot={true} />
            </div>
          ) : (
            <div className="flex justify-center py-20 text-gray-500">No data found.</div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
