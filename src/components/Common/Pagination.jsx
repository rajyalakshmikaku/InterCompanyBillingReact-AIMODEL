import React, { useEffect, useState } from "react";
import "./Pagination.css";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPage, setJumpPage] = useState(String(currentPage));
  // holds the index of the ellipsis that is currently active (showing the input)
  const [activeEllipsisIndex, setActiveEllipsisIndex] = useState(null);

  useEffect(() => {
    setJumpPage(String(currentPage));
    // close any active ellipsis when page changes externally
    setActiveEllipsisIndex(null);
  }, [currentPage]);

  if (totalPages === 0) return null;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const submitJumpPage = () => {
    const parsedPage = Number(jumpPage);
    if (Number.isInteger(parsedPage)) {
      goToPage(parsedPage);
      setActiveEllipsisIndex(null);
    }
  };

  const handleJumpToPage = (ellipsisIndex) => {
    // toggle the inline jump input for this specific ellipsis
    setActiveEllipsisIndex((prev) => {
      const next = prev === ellipsisIndex ? null : ellipsisIndex;
      // when opening an ellipsis, reset the input to empty so user types the target
      if (next !== null) setJumpPage("");
      return next;
    });
  };

  const buildPageItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const pagesToShow = buildPageItems();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pager">
      <span className="pager-info">
        Showing {startItem}–{endItem} of {totalItems}
      </span>

      <div className="pager-controls">
        <button
          type="button"
          className="pager-btn pager-nav-btn"
          disabled={currentPage === 1}
          onClick={() => goToPage(1)}
          aria-label="Go to first page"
          title="Go to first page"
        >
          «
        </button>

        <button
          type="button"
          className="pager-btn pager-nav-btn"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          aria-label="Go to previous page"
          title="Go to previous page"
        >
          ‹
        </button>

        {pagesToShow.map((page, index) => {
          if (page === "ellipsis") {
            // if this ellipsis is active, render the inline jump box in-place
            if (activeEllipsisIndex === index) {
              return (
                <div key={`jump-${index}`} className="pager-jump-box-inline">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder={`Enter page number`}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitJumpPage();
                      if (e.key === "Escape") setActiveEllipsisIndex(null);
                    }}
                    className="pager-jump-input"
                    aria-label="Jump to page number"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="pager-btn pager-go-btn"
                    onClick={submitJumpPage}
                  >
                    Go
                  </button>
                </div>
              );
            }

            return (
              <button
                key={`ellipsis-${index}`}
                type="button"
                className="pager-btn pager-ellipsis"
                onClick={() => handleJumpToPage(index)}
                aria-label="Jump to a specific page"
                title="Jump to a specific page"
              >
                ...
              </button>
            );
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              className={`pager-btn ${currentPage === page ? "active" : ""}`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          className="pager-btn pager-nav-btn"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          aria-label="Go to next page"
          title="Go to next page"
        >
          ›
        </button>

        <button
          type="button"
          className="pager-btn pager-nav-btn"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(totalPages)}
          aria-label="Go to last page"
          title="Go to last page"
        >
          »
        </button>

        {/* inline jump input is rendered in-place when an ellipsis is activated */}
      </div>
    </div>
  );
};

export default Pagination;
