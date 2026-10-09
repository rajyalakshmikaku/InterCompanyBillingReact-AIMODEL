import React, { useEffect, useState } from "react";
import { baseURL } from "../../services/api";
import {
  PaymentProofList,
  hasPaymentProofStatus,
  fetchPaymentFiles,
  filterPaymentFilesByType,
  proofTypeForRowStatus,

} from "../Common/PaymentProofFiles";
const ViewQuotationModal = ({
  show,
  onClose,
  selectedInvoice,
}) => {

  // 1. ALL useState hooks first
  const [paymentFiles, setPaymentFiles] = useState([]);
  const [paymentFilesLoading, setPaymentFilesLoading] = useState(false);

  // 2. Normal variables
  const logoFileName = selectedInvoice?.companyLogo?.split(/[/\\]/).pop();

  const proofRefNo = selectedInvoice?.referenceNumber;

  const showPaymentProof = hasPaymentProofStatus(
    selectedInvoice?.Status,
    selectedInvoice?.status,
    selectedInvoice?.quotationStatus,
    selectedInvoice?.invoiceStatus
  );

  // 3. ALL useEffect hooks
  useEffect(() => {
    if (!show || !showPaymentProof || !proofRefNo) {
      setPaymentFiles([]);
      return;
    }

    let ignore = false;
    setPaymentFilesLoading(true);

    fetchPaymentFiles(proofRefNo)
      .then((files) => {
        console.log("Fetched payment files:", files);
        if (!ignore) setPaymentFiles(files);
      })
      .catch(() => {
        if (!ignore) setPaymentFiles([]);
      })
      .finally(() => {
        if (!ignore) setPaymentFilesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [show, showPaymentProof, proofRefNo]);

  // 4. EARLY RETURN AFTER ALL HOOKS
  if (!show || !selectedInvoice) {
    return null;
  }

  // Only the documents belonging to this row's stage (PaymentUploads.Type) —
  // a refunded quotation shows its refund document, not the invoice proof.
  // A status that owns no proof at all resolves to null and shows nothing.
  const proofType = proofTypeForRowStatus(
    selectedInvoice?.Status ||
    selectedInvoice?.status ||
    selectedInvoice?.quotationStatus ||
    selectedInvoice?.invoiceStatus
  );

  const visibleProofFiles = proofType
    ? filterPaymentFilesByType(paymentFiles, proofType)
    : [];

  return (
    <div className="quotation-view-overlay">
      <div className="quotation-view-modal">
        <div className="quotation-view-header">
          <h3 className="quotation-view-title" style={{ color: "#fff" }}>
            View Quotation Details
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoFileName && (
              <img
                src={`${baseURL}/UploadedFiles/${logoFileName}`}
                alt="Company Logo"
                className="quotation-company-logo-corner"
              />
            )}
            <button
              className="quotation-view-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="quotation-view-body">
          {/* {selectedInvoice.comapanyLogo && (() => {
          const logoFileName = selectedInvoice.comapanyLogo.split(/[/\\]/).pop();
          console.log('logoFileName', logoFileName);
          return (
            <img
              src={`${baseURL}/UploadedFiles/${logoFileName}`}
              alt="Company Logo"
              className="company-logo-corner"
            />
          );
        })()} */}
          {/* Company Information */}
          <div className="section-container">
            <h4 className="quotation-view-section-title">
              Company Information
            </h4>
            <div className="quotation-view-info">
              <div>
                <span className="label">Company Name</span>
                <span>:</span>
                <span>{selectedInvoice.companyName || "-"}</span>
              </div>
              <div>
                <span className="label">VAT Number</span>
                <span>:</span>
                <span>{selectedInvoice.vatNumber || "-"}</span>
              </div>
              <div>
                <span className="label">Reg Number</span>
                <span>:</span>
                <span>{selectedInvoice.registrationNumber || "-"}</span>
              </div>
              <div>
                <span className="label">Address</span>
                <span>:</span>
                <span>{selectedInvoice.companyAddress || "-"}</span>
              </div>
              <div>
                <span className="label">Email</span>
                <span>:</span>
                <span>{selectedInvoice.companyEmail || "-"}</span>
              </div>
              <div>
                <span className="label">Phone</span>
                <span>:</span>
                <span>{selectedInvoice.companyPhoneNumber || "-"}</span>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="section-container">
            <h4 className="quotation-view-section-title">Banking Details</h4>
            <div className="quotation-view-info">
              <div>
                <span className="label">Bank Name</span>
                <span>:</span>
                <span>{selectedInvoice.bankName || "-"}</span>
              </div>
              <div>
                <span className="label">Account Holder</span>
                <span>:</span>
                <span>{selectedInvoice.accountHolderName || "-"}</span>
              </div>
              <div>
                <span className="label">Account Number</span>
                <span>:</span>
                <span>{selectedInvoice.bankAccountNumber || "-"}</span>
              </div>
              <div>
                <span className="label">Branch Code</span>
                <span>:</span>
                <span>{selectedInvoice.branchCode || "-"}</span>
              </div>
              <div>
                <span className="label">Branch Address</span>
                <span>:</span>
                <span>
                  {selectedInvoice?.branchAddress ||
                    selectedInvoice?.brannchAddress ||
                    "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Quotation Information */}
          <div className="section-container">
            <h4 className="quotation-view-section-title">
              Quotation Information
            </h4>
            <div className="quotation-view-info">
              <div>
                <span className="label">Quotation ID</span> :{" "}
                <span>{selectedInvoice.id}</span>
              </div>
              <div>
                <span className="label">Date</span>
                <span>:</span>
                <span>
                  {selectedInvoice?.date
                    ? (() => {
                      const d = new Date(selectedInvoice.date);
                      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                    })()
                    : "-"}
                </span>
              </div>
              <div>
                <span className="label">Status</span>
                <span>:</span>
                <span>
                  {selectedInvoice.Status
                    || "-"}
                </span>
              </div>
              <div>
                <span className="label">Due Date</span>
                <span>:</span>
                <span> {selectedInvoice?.dueDate
                  ? (() => {
                    const d = new Date(selectedInvoice.dueDate);
                    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                  })()
                  : "-"}</span>
              </div>


              <div>
                <span className="label">Total Amount</span>
                <span>:</span>
                <span>
                  {selectedInvoice.totalAmount != null
                    ? selectedInvoice.totalAmount.toFixed(2)
                    : "-"}
                </span>
              </div>
              {(
                selectedInvoice?.quotationStatus === "Proforma Invoice Generated" ||
                selectedInvoice?.Status === "Proforma Invoice Generated"
              ) &&
                (selectedInvoice?.porformaReferenceNumber ||
                  selectedInvoice?.proformaReferenceNumber) && (
                  <div>
                    <span className="label">Proforma Reference No</span>
                    <span>:</span>
                    <span>
                      {selectedInvoice?.porformaReferenceNumber ||
                        selectedInvoice?.proformaReferenceNumber}
                    </span>
                  </div>
                )}


              {/* {(selectedInvoice.porformaReferenceNumber ||
                selectedInvoice.proformaReferenceNumber) && (
                  <div>
                    <span className="label">Proforma Reference No</span>
                    <span>:</span>
                    <span>
                      {selectedInvoice.porformaReferenceNumber ||
                        selectedInvoice.proformaReferenceNumber}
                    </span>
                  </div>
                )} */}
              {(selectedInvoice.quotationStatus === "Rejected" || selectedInvoice.Status === "Rejected") && (
                <div>

                  <span className="label">Reason</span>
                  <span>:</span>
                  <span>
                    {selectedInvoice.reason ||

                      "-"}
                  </span>
                </div>
              )}


            </div>
          </div>
          {(

            selectedInvoice.Status === "Deposit Paid" ||
            selectedInvoice.Status === "Paid" ||
            selectedInvoice.Status === "Partial Paid"
          ) && (
              <div className="vp-section payment-history-section">
                <h4 className="quotation-view-section-title">Payment History</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Payment Date</th>
                      <th className="num">Outstanding Amount</th>
                      <th className="num">Paid Amount</th>
                      <th className="num">Amount Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.payments?.length > 0 ? (
                      selectedInvoice.payments.map((payment, index) => (
                        <tr key={payment.id || index}>
                          <td>{payment.transactionId || "-"}</td>
                          <td>
                            {payment.paymentDate
                              ? new Date(payment.paymentDate).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                          <td className="num">
                            {payment.totalAmount != null
                              ? Number(payment.totalAmount).toFixed(2)
                              : "0.00"}
                          </td>
                          <td className="num">
                            {payment.paidAmount != null
                              ? Number(payment.paidAmount).toFixed(2)
                              : "0.00"}
                          </td>
                          <td className="num">
                            {payment.totatlDue != null
                              ? Number(payment.totatlDue).toFixed(2)
                              : "0.00"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          No payment history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Quotation Details Table */}
          <div className="vp-section">
            <h4 className="quotation-view-section-title">Quotation Details</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ITEM CODE</th>
                  <th>CATEGORY</th>
                  <th>NAME</th>
                  <th className="num">QTY</th>
                  <th className="num">UNIT RATE EXCL VAT</th>
                  <th className="num">AMOUNT</th>
                  <th className="num">DISCOUNT</th>
                  <th className="num">DISCOUNTED TOTAL</th>
                  <th className="num">VAT %</th>
                  <th className="num">NET AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice.details || []).map((d, i) => (
                  <tr key={i}>
                    <td>{d.itemCode}</td>
                    <td>{d.category}</td>
                    <td>{d.Name}</td>
                    <td className="num">{d.quantity}</td>
                    <td className="num">{d.unitRate}</td>
                    <td className="num">{d.quantity * d.unitRate}</td>
                    <td className="num">{d.discount || 0}</td>
                    <td className="num">
                      {d.quantity * d.unitRate - d.discount}
                    </td>
                    <td className="num">{d.tax}</td>
                    <td className="num">
                      {(
                        d.quantity * d.unitRate -
                        d.discount +
                        ((d.quantity * d.unitRate - d.discount) * d.tax) / 100
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          {/* Customer Information */}
          <div className="section-container">
            <h4 className="quotation-view-section-title">
              Customer Information
            </h4>
            <div className="quotation-view-info">
              <div>
                <span className="label">Company Name</span> :{" "}
                <span>{selectedInvoice.receiving}</span>
              </div>
              <div>
                <span className="label">Name</span> :{" "}
                <span>{selectedInvoice.customerName}</span>
              </div>
              <div>
                <span className="label">Phone</span> :
                <span>{selectedInvoice.customerPhone}</span>
              </div>
              <div>
                <span className="label">Email</span>:{" "}
                <span>{selectedInvoice.customerEmail}</span>
              </div>
              <div>
                <span className="label">Address</span> :
                <span>{selectedInvoice.customerAddress}</span>
              </div>
              <div>
                <span className="label">Payment Terms</span> :
                <span>{selectedInvoice.paymentTerms}</span>
              </div>
            </div>
          </div>
          {/* Proof of Payment — invoiced / refunded rows only */}
          {/* {showPaymentProof && (
            <div className="vp-section">
              <h4 className="quotation-view-section-title">
                Proof of Payment
                {visibleProofFiles.length > 0 && ` (${visibleProofFiles.length})`}
              </h4>
              <div className="payment-proof-body">
                <PaymentProofList
                  files={visibleProofFiles}
                  loading={paymentFilesLoading}
                />
              </div>
            </div>
          )} */}


        </div>
      </div>
    </div>
  );
};

export default ViewQuotationModal;
