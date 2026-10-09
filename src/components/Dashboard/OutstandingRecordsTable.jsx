import React from "react";
import { FaEye, FaDownload } from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";

// Mirrors the badge classes already defined in theme/global.css
const getStatusBadgeClass = (status) => {
  switch ((status || "").toLowerCase().trim()) {
    case "approved":
    case "order completed":
      return "status-ordercompleted";
    case "overdue":
      return "status-overdue";
    case "rejected":
    case "cancelled":
    case "closed":
      return "status-cancelled";
    case "refund":
    case "refunded":
      return "status-refund";
    case "credit note created":
      return "status-creditnote";
    case "expired":
      return "status-expired";
    case "proforma invoice generated":
      return "status-proforma";
    case "invoice generated":
      return "status-invoicegenerated";
    default:
      // Created / Updated
      return "status-invoicecreated";
  }
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
};

const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => (
  <th onClick={() => onSort(sortKey)} style={{ cursor: "pointer" }}>
    {label}{" "}
    {sortConfig?.key === sortKey
      ? sortConfig.direction === "asc"
        ? "↑"
        : "↓"
      : "↕"}
  </th>
);

/**
 * One table for both sides of SP_GetOutstandingInvoiceDetails.
 *
 * The SP has three branches — Quotation, Invoice, and the union it falls back
 * to when @Type is NULL — so the columns follow the rows that actually came
 * back: the Type column only appears on the union, and the Invoice ID column
 * only when at least one invoice row is present.
 */
const OutstandingRecordsTable = ({
  rows,
  loading,
  showType,
  showInvoiceColumn,
  sortConfig,
  onSort,
  onView,
  onDownloadQuotation,
  onDownloadInvoice,
  quotationDownloadLoadingId,
  invoiceDownloadLoadingId,
  onViewCreditNote,
  onDownloadCreditNote,
  creditViewLoadingId,
  creditDownloadLoadingId,
}) => {
  const columnCount = 6 + (showType ? 1 : 0) + (showInvoiceColumn ? 1 : 0);

  return (
    <div className="quotation-dashboard-table-container">
      <table className="quotation-dashboard-table">
        <thead>
          <tr>
            {showType && (
              <SortableHeader
                label="TYPE"
                sortKey="type"
                sortConfig={sortConfig}
                onSort={onSort}
              />
            )}

            <SortableHeader
              label="QUOTATION ID"
              sortKey="quotationRefNo"
              sortConfig={sortConfig}
              onSort={onSort}
            />

            {showInvoiceColumn && (
              <SortableHeader
                label="INVOICE ID"
                sortKey="invoiceRefNo"
                sortConfig={sortConfig}
                onSort={onSort}
              />
            )}

            <SortableHeader
              label="DATE"
              sortKey="documentDate"
              sortConfig={sortConfig}
              onSort={onSort}
            />

            <SortableHeader
              label="COMPANY"
              sortKey="companyName"
              sortConfig={sortConfig}
              onSort={onSort}
            />

            <SortableHeader
              label="CUSTOMER"
              sortKey="customerName"
              sortConfig={sortConfig}
              onSort={onSort}
            />

            <th>STATUS</th>
            <th>VIEW</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columnCount} style={{ textAlign: "center" }}>
                <div className="loader"></div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} style={{ textAlign: "center" }}>
                No results found
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isInvoice = row.type === "Invoice";

              const downloadId = isInvoice ? row.invoiceId : row.quotationId;
              const downloading = isInvoice
                ? invoiceDownloadLoadingId === row.invoiceId
                : quotationDownloadLoadingId === row.quotationId;

              return (
                <tr key={row.key}>
                  {showType && (
                    <td>
                      <span
                        className={`outstanding-type-chip outstanding-type-${row.type.toLowerCase()}`}
                      >
                        {row.type}
                      </span>
                    </td>
                  )}

                  <td>{row.quotationRefNo || "-"}</td>

                  {showInvoiceColumn && <td>{row.invoiceRefNo || "-"}</td>}

                  <td>{formatDate(row.documentDate)}</td>
                  <td>{row.companyName || "-"}</td>
                  <td>{row.customerName || "-"}</td>

                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(row.statusLabel)}`}
                    >
                      {row.statusLabel || "-"}
                    </span>
                  </td>

                  <td>
                    <div className="action-container">
                      {/* Details */}
                      <FaEye
                        style={{ cursor: "pointer" }}
                        className="action-icon view-icon"
                        onClick={() => onView(row)}
                        title={`View ${row.type} Details`}
                      />

                      {/* PDF — the quotation and invoice templates are
                          different pages, so the row type picks the handler */}
                      <div
                        onClick={() => {
                          if (downloading || !downloadId) return;

                          if (isInvoice) {
                            onDownloadInvoice(row.invoiceId, row.invoiceRefNo);
                          } else {
                            onDownloadQuotation(
                              row.quotationId,
                              row.quotationRefNo
                            );
                          }
                        }}
                        style={{
                          cursor:
                            downloading || !downloadId
                              ? "not-allowed"
                              : "pointer",
                          opacity: downloadId ? 1 : 0.4,
                        }}
                      >
                        {downloading ? (
                          <div className="mini-spinner"></div>
                        ) : (
                          <FaDownload
                            className="action-icon download-icon"
                            title={`Download ${row.type}`}
                          />
                        )}
                      </div>

                      {/* Credit note — invoice rows only */}
                      {row.hasCreditNote && (
                        <>
                          <div
                            onClick={() => onViewCreditNote(row)}
                            style={{ cursor: "pointer" }}
                          >
                            {creditViewLoadingId === row.invoiceId ? (
                              <span className="icon-spinner"></span>
                            ) : (
                              <MdOutlineReceiptLong
                                className="action-icon creditview-icon"
                                title="View Credit Note Details"
                              />
                            )}
                          </div>

                          <div
                            onClick={() =>
                              onDownloadCreditNote(row.invoiceRefNo, row.invoiceId)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {creditDownloadLoadingId === row.invoiceId ? (
                              <span className="icon-spinner"></span>
                            ) : (
                              <FaDownload
                                className="action-icon creditdownload-icon"
                                title="Credit Note Download"
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OutstandingRecordsTable;
