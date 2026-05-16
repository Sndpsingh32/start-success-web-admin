import React from "react";
import ReactPaginate from "react-paginate";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { GridIcon } from "../../icons";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Search
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  currentPage = 0,
  totalPages = 0,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  return (
    <div className="space-y-3">
      {/* Optional Search Bar */}
      {onSearch && (
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <GridIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg leading-5 bg-white dark:bg-gray-900 dark:border-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl border border-gray-100 dark:border-white/10">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-white/5">
              <TableHeader className="bg-gray-50 dark:bg-white/[0.02]">
                <TableRow>
                  {columns.map((col, idx) => (
                    <TableCell
                      key={idx}
                      isHeader
                      className={`px-4 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                      } ${col.headerClassName || ""}`}
                    >
                      {col.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                        <p className="text-gray-500 font-medium">Loading data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="px-4 py-10 text-center text-gray-500 font-medium">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, rowIdx) => (
                    <TableRow key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      {columns.map((col, colIdx) => (
                        <TableCell
                          key={colIdx}
                          className={`px-4 py-4 whitespace-nowrap text-sm ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          } ${col.className || ""}`}
                        >
                          {typeof col.accessor === "function"
                            ? col.accessor(item)
                            : col.accessor
                            ? (item[col.accessor] as React.ReactNode)
                            : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page <span className="font-medium text-gray-900 dark:text-white">{currentPage + 1}</span> of{" "}
            <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
          </div>
          <ReactPaginate
            previousLabel={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            }
            nextLabel={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            }
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={(selected) => onPageChange(selected.selected)}
            containerClassName={"flex items-center space-x-1"}
            pageClassName={"block"}
            pageLinkClassName={
              "px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
            }
            activeClassName={"!bg-brand-50 dark:!bg-brand-500/10"}
            activeLinkClassName={"!text-brand-600 dark:!text-brand-400"}
            previousClassName={"block"}
            previousLinkClassName={
              "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
            }
            nextClassName={"block"}
            nextLinkClassName={
              "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
            }
            disabledClassName={"opacity-30 cursor-not-allowed"}
            forcePage={currentPage}
          />
        </div>
      )}
    </div>
  );
}
