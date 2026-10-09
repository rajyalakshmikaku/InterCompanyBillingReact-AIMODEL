import React from "react";
import { FaDownload, FaEye } from "react-icons/fa";
import {
  PaymentProofAction,
  usePaymentProofFiles,
} from "../Common/PaymentProofFiles";

const QuotationTable = ({ data, loading, status, onSort, sortConfig, onView, downloadingId,
  onDownload }) => {
  // Proofs for the whole visible page, loaded up front so the tbody loop has
  // its files (and counts) without each row fetching for itself.
  const { filesByRef: proofFilesByRef, loading: proofFilesLoading } =
    usePaymentProofFiles((data || []).map((item) => item?.header?.referenceNumber));

  return (
  <div className="quotation-dashboard-table-container">
    <table className="quotation-dashboard-table">
      <thead>
        <tr>
          <th onClick={() => onSort("refno")}>
            QUOTATION ID {""}
            {sortConfig.key === "refno" ?
              (sortConfig.direction === "asc" ? "↑" : "↓")
              : "↑"}
          </th>
          <th>DATE</th>
          <th>COMPANY</th>
          <th>CUSTOMER</th>
          {status === "Rejected" && <th>REASON</th>}
          <th>VIEW</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={6} style={{ textAlign: "center" }}>
              <div className="loader"></div>
            </td>
          </tr>
        ) : !status ? (
          <tr>
            <td colSpan={6} style={{ textAlign: "center", color: "green" }}>
              Please select a status
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: "center" }}>
              No results found
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={item.header.referenceNumber}>
              <td>{item.header.referenceNumber}</td>

              {/* <td>{item.quotationDate ? new Date(item.quotationDate).toLocaleDateString() : "-"}</td> */}
              <td>
                {item.header.quotationDate
                  ? new Date(item.header.quotationDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  : "-"}
              </td>

              <td>{item.header.companyName || "-"}</td>
              <td>{item.header.customerName || "-"}</td>
              {status === "Rejected" && (
                <td>
                  {item.header.reason || item.header.rejectionReason ? (
                    <div
                      style={{
                        maxWidth: "250px",
                        whiteSpace: "normal",
                        lineHeight: "1.4"
                      }}
                    >
                      {item.header.reason || item.header.rejectionReason}
                    </div>
                  ) : null}
                </td>
              )}

              <td>

                <FaEye
                  style={{ cursor: 'pointer' }}
                  className="action-icon view-icon"
                  onClick={() => onView(item)}
                  title="View Quotation Details"
                />

                {downloadingId === item.header.quotationId ? (
                  <div
                    className="spinner"
                    style={{
                      width: "18px",
                      height: "18px",
                    }}
                  ></div>
                ) : (
                  <FaDownload
                    style={{
                      color: "#2563eb",
                      cursor: "pointer",
                    }}
                    className="action-icon download-icon"
                    onClick={() =>
                      onDownload(
                        item.header.quotationId,
                        item.header.referenceNumber
                      )
                    }
                    title="Download"
                  />
                )}

                {/* The KPI modal is opened per status, so `status` stands in
                    when the row carries none of its own. */}
                <PaymentProofAction
                  referenceNumber={item.header.referenceNumber}
                  status={
                    item.header.status ||
                    item.header.quotationStatus ||
                    status ||
                    ""
                  }
                  files={proofFilesByRef[item.header.referenceNumber]}
                  loading={proofFilesLoading}
                  subtitle={`Quotation ${item.header.referenceNumber || ""}`.trim()}
                />
              </td>

            </tr>
          ))
        )}
      </tbody>

    </table>
  </div>
  );
};

export default QuotationTable;
