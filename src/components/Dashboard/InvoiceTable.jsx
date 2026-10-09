import React from "react";
import { FaEye, FaDownload } from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";
import {
  PaymentProofAction,
  usePaymentProofFiles,
} from "../Common/PaymentProofFiles";

const InvoiceTable = ({
 data, 
 loading, 
 status, 
 onSort, 
 sortConfig, 
 onView, 
 onDownloadInvoice,
 onViewCreditNote,
 onDownloadCreditNote,
 invoiceDownloadLoadingId,
 creditDownloadLoadingId,
 creditViewLoadingId,
}) => {
  // Proofs for the whole visible page, loaded up front so the tbody loop has
  // its files (and counts) without each row fetching for itself.
  const { filesByRef: proofFilesByRef, loading: proofFilesLoading } =
    usePaymentProofFiles((data || []).map((item) => item?.header?.referenceNumber));

  return (

  <div className="quotation-dashboard-table-container">



    <table className="quotation-dashboard-table">
      <thead>
        <tr>
          <th onClick={() => onSort("refno")} style={{ cursor: "pointer" }}>
            QUOTATION ID{" "}

            {sortConfig.key === "refno" ?
              (sortConfig.direction === "asc" ? "↑" : "↓")
              : "↑"}
          </th>

          <th>INVOICE ID</th>
          <th>INVOICE DATE</th>
          <th>COMPANY</th>
          <th>CUSTOMER</th>
          {/* <th>STATUS</th> */}
          {status === "Cancelled" && <th>REASON</th>}
          <th>VIEW</th>
        </tr>
      </thead>




      <tbody>
        {loading ? (
          <tr>
            <td colSpan={7} style={{ textAlign: "center" }}>
              <div className="loader"></div>
            </td>
          </tr>
        ) : !status ? (
          <tr>
            <td colSpan={7} style={{ textAlign: "center", color: "green" }}>
              Please select a status
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: "center" }}>
              No results found
            </td>
          </tr>
        ) : (
          data.map((item, index) => (


            <tr key={index}>

              <td>{item.header.referenceNumber || "-"}</td>
              <td>{item.header.invoiceReferenceNumber || "-"}</td>
              <td>

                {item.header.invoiceDate
                  ? new Date(item.header.invoiceDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  : "-"}
              </td>

              <td>{item.header.companyName || "-"}</td>
              <td>{item.header.customerName || "-"}</td>

              {status === "Cancelled" && (
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
                <div className="action-container">

                  {/* Invoice View */}
                  <FaEye
                    style={{ cursor: "pointer" }}
                    className="action-icon view-icon"
                    onClick={() => onView(item)}
                    title="View Invoice Details"
                  />

                  {/* Invoice Download */}
                  <div
                    onClick={() =>
                      onDownloadInvoice(
                        item.header.invoiceId,
                        item.header.invoiceReferenceNumber
                      )
                    }
                    style={{
                      cursor:
                        invoiceDownloadLoadingId === item.header.invoiceId
                          ? "not-allowed"
                          : "pointer",
                      pointerEvents:
                        invoiceDownloadLoadingId === item.header.invoiceId
                          ? "none"
                          : "auto",
                    }}
                  >
                    {invoiceDownloadLoadingId === item.header.invoiceId ? (
                      <div className="mini-spinner"></div>
                    ) : (
                      <FaDownload
                        className="action-icon download-icon"
                        title="Invoice Download"
                      />
                    )}
                  </div>

                  {/* Proof of payment — refunded rows show the refund
                      document, everything else the invoice proof */}
                  <PaymentProofAction
                    referenceNumber={item.header.referenceNumber}
                    status={item.header.invoiceStatus}
                    files={proofFilesByRef[item.header.referenceNumber]}
                    loading={proofFilesLoading}
                    subtitle={`Invoice ${item.header.invoiceReferenceNumber || ""}`.trim()}
                  />

                  {/* Credit Note Actions */}
                  {item.header.invoiceStatus === "Credit note Created" && (
                    <>
                      <div
                        onClick={() => onViewCreditNote(item)}
                        style={{ cursor: "pointer" }}
                      >
                        {creditViewLoadingId === item.header.invoiceId ? (
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
                          onDownloadCreditNote(
                            item.header.invoiceReferenceNumber,
                            item.header.invoiceId
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {creditDownloadLoadingId === item.header.invoiceId ? (
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
          ))
        )}
      </tbody>

    </table>
  </div>
  );
};

export default InvoiceTable;
