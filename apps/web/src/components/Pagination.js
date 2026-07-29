function Pagination({
  currentPage,
  itemLabel = 'items',
  onPageChange,
  pageSize,
  totalItems
}) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
        <span>
          {totalItems} {itemLabel}
        </span>
        <span>{pageSize} rows per page</span>
      </div>
    );
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
      aria-label="Pagination"
    >
      <span>
        {startItem}-{endItem} of {totalItems} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <span>{pageSize} rows per page</span>
        <button
          className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="min-w-12 text-center text-slate-700">
          {safeCurrentPage}/{totalPages}
        </span>
        <button
          className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
