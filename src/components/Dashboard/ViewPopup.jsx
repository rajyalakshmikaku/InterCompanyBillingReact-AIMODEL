import React, { useEffect, useState } from "react";
import { baseURL } from "../../services/api";
import "./ViewPopup.css";
import {
  PaymentProofList,
  fetchPaymentFiles,
  hasPaymentProofStatus,
  filterPaymentFilesByType,
  proofTypeForStatus,
} from "../../components/Common/PaymentProofFiles";
import HoloButton from "../../components/Common/HoloButton";
import { FaTimesCircle, FaCheckCircle, FaFileInvoice, FaMoneyCheckAlt } from "react-icons/fa";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "../../components/ui";
import { jwtDecode } from "jwt-decode";



// The proof endpoint is keyed by the quotation reference, which the screens
// expose under slightly different names.
const getQuotationRefNo = (invoice) =>
  invoice?.quotationReferenceNumber ||
  invoice?.quotationRefno ||
  invoice?.quotationRefNo ||
  invoice?.referenceNumber ||
  "";

const ViewPopup = ({
  show,
  onClose,
  selectedInvoice,
  details,
  type,
  onGenerateInvoice,
  loadingRefNo,
}) => {

  console.log("details", details);
  //   console.log("Selected Invoice:", selectedInvoice);
  // console.log("Detail:", selectedInvoice.detail);
  const [paymentFiles, setPaymentFiles] = useState([]);
  const [paymentFilesLoading, setPaymentFilesLoading] = useState(false);

  // Proof of payment is only captured once money moved, so it is only fetched
  // and shown for the statuses that imply that.
  // const showPaymentProof = hasPaymentProofStatus(
  //   selectedInvoice?.invoiceStatus,
  //   selectedInvoice?.quotationStatus,
  //   selectedInvoice?.status,
  //   selectedInvoice?.Status,
  // );


  const getLoggedRole = () => {
    const stored = sessionStorage.getItem("roleName");
    if (stored && stored !== "undefined" && stored !== "null") return stored;

    try {
      const token = sessionStorage.getItem("token");
      return token ? jwtDecode(token)?.role || "" : "";
    } catch {
      return "";
    }
  };
  const isSuperAdminUser = () =>
    getLoggedRole().toLowerCase().replace(/\s+/g, "") === "superadmin";
  const getApprovalStageKey = (quotation) => {
    switch ((quotation?.quotationStatus || "").toLowerCase().trim()) {
      case "proforma invoice generated":
        return "proforma";
      case "invoice generated":
        return "invoiced";
      case "cancelled":
      case "closed":
        return "cancelled";
      default:
        // Approved / anything still awaiting a decision
        return "approved";
    }
  };

  const showPaymentProof = hasPaymentProofStatus(
    selectedInvoice?.invoiceStatus,
    selectedInvoice?.quotationStatus,
    selectedInvoice?.status,
    selectedInvoice?.Status,
  );
  const [showPaidPopup, setShowPaidPopup] = useState(false);
  const [selectedPaidQuotation, setSelectedPaidQuotation] = useState(null);
  const [paymentOption, setPaymentOption] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [popupLoadingInvoice, setPopupLoadingInvoice] = useState(false);
  const [popupLoadingProforma, setPopupLoadingProforma] = useState(false);
  const [popupLoadingCancel, setPopupLoadingCancel] = useState(false);

  const handleOpenPaidPopup = (quotation) => {
    console.log("ViewPopup handleOpenPaidPopup");
    console.log(setSelectedPaidQuotation);

    setSelectedPaidQuotation(quotation);
    setPaymentOption("");
    setProofFile(null);
    setShowPaidPopup(true);
  };

  const handleClosePaidPopup = () => {
    setSelectedPaidQuotation(null);
    setShowPaidPopup(false);
    setPaymentOption("");
    setProofFile(null);
  };
  const proofRefNo = getQuotationRefNo(selectedInvoice);

  // A proforma already sits in this list waiting to be paid. For those rows
  // the same Paid button asks "has it been paid now?" instead of
  // "paid or unpaid?" — yes generates the invoice, no cancels the quotation.
  const isProformaFollowUp =
    (selectedPaidQuotation?.quotationStatus || "").toLowerCase().trim() ===
    "proforma invoice generated";

  // SuperAdmin only records payments — the unpaid branch (proforma / cancel)
  // is not offered to them, on the plain and the proforma follow-up dialog.
  const isSuperAdmin = isSuperAdminUser();
  const renderQuotationSummary = (quotation) => {
    if (!quotation) return null;

    const rows = [
      ["Quotation Ref No", quotation.quotationReferenceNumber],
      ["Company", quotation.companyName],
      ["Customer", quotation.customerName],
      [
        "Quotation Date",
        quotation.quotationDate
          ? new Date(quotation.quotationDate).toLocaleDateString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
          })
          : "-",
      ],
    ];

    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-1 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900 text-right break-all">
              {value || "-"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleProofChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofFile(e.target.files[0]);
    }
  };
  const handleGenerateInvoiceFromPopup = async () => {
    console.log("Generate Invoice");
  };

  const handleSaveProformaFromPopup = async () => {
    console.log("Generate Proforma");
  };

  const handleCancelProformaFromPopup = async () => {
    console.log("Cancel Quotation");
  };

  useEffect(() => {
    if (!show || !showPaymentProof || !proofRefNo) {
      setPaymentFiles([]);
      return;
    }

    let ignore = false;
    setPaymentFilesLoading(true);

    fetchPaymentFiles(proofRefNo)
      .then((files) => {
        if (!ignore) setPaymentFiles(files);
        console.log("ViewPopup fetchPaymentFiles files", files);
      })
      .catch((err) => {
        console.log(err);
        if (!ignore) setPaymentFiles([]);
      })
      .finally(() => {
        if (!ignore) setPaymentFilesLoading(false);
      });

    // A different row can be opened before the request settles.
    return () => {
      ignore = true;
    };
  }, [show, showPaymentProof, proofRefNo]);

  if (!show || !selectedInvoice) return null;

  const lineItems =
    details ||
    selectedInvoice.detail ||
    selectedInvoice.quotationDetails ||
    selectedInvoice.invoiceDetails ||
    [];

  // Only the documents belonging to this row's stage (PaymentUploads.Type).
  const visibleProofFiles = filterPaymentFilesByType(
    paymentFiles,
    proofTypeForStatus(
      selectedInvoice?.invoiceStatus,
      selectedInvoice?.quotationStatus,
      selectedInvoice?.status,
      selectedInvoice?.Status,
    ),
  );

  return (
    <div className="quotation-view-overlay viewpopup-modern">
      <div className="quotation-view-modal">
        <div className="quotation-view-header">
          <h3 className="quotation-view-title">
            {type === "Invoice" ? "Invoice" : "Quotation"} Details
          </h3>


          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedInvoice.comapanyLogo &&
              (() => {
                const logoFileName = selectedInvoice.comapanyLogo
                  .split(/[/\\]/)
                  .pop();
                return (
                  <img
                    src={`${baseURL}/UploadedFiles/${logoFileName}`}
                    alt="Company Logo"
                    className="company-logo-corner"
                  />
                );
              })()}
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
          {/* ── Company Information ── */}
          <div className="vp-section">
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

          {/* ── Banking Details ── */}
          <div className="vp-section">
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

          {/* ── Quotation/Invoice Information ── */}
           {(
            type === "Quotation" ||
            type === "quotationapproval" 
           ) && (
          <div className="vp-section" >
            <h4 className="quotation-view-section-title">
              Quotation Information
            </h4>

            <div className="quotation-view-info">
              <div>
                <span className="label">Quotation ID</span>
                <span>:</span>
                <span>
                  {selectedInvoice.quotationReferenceNumber ||
                    selectedInvoice.quotationRefno ||
                    "-"}
                </span>
              </div>

              <div>
                <span className="label">Quotation Date</span>
                <span>:</span>
                <span>
                  {selectedInvoice?.quotationDate
                    ? (() => {
                      const d = new Date(selectedInvoice.quotationDate);
                      return !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, "0")}/${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}/${d.getFullYear()}` : "-";
                    })()
                    : "-"}
                </span>
              </div>

              <div>
                <span className="label">Status</span>
                <span>:</span>
                <span>
                  {selectedInvoice.quotationStatus ||
                    selectedInvoice.status ||
                    "-"}
                </span>
              </div>

              <div>
                <span className="label">Due Date</span>
                <span>:</span>
                <span>
                  {selectedInvoice?.dueDate
                    ? (() => {
                      const d = new Date(selectedInvoice.dueDate);
                      return !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, "0")}/${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}/${d.getFullYear()}` : "-";
                    })()
                    : "-"}
                </span>
              </div>


              <div>
                <span className="label">Total Amount</span>
                <span>:</span>
                <span>
                  {selectedInvoice.totalAmount != null
                    ? Number(selectedInvoice.totalAmount).toFixed(2)
                    : "-"}
                </span>
              </div>

             
              {(selectedInvoice.porformaReferenceNumber ||
                selectedInvoice.proformaReferenceNumber) && (
                  <div>
                    <span className="label">Proforma Reference No</span>
                    <span>:</span>
                    <span>
                      {selectedInvoice.porformaReferenceNumber ||
                        selectedInvoice.proformaReferenceNumber}
                    </span>
                  </div>
                )}
              {(selectedInvoice.quotationStatus === "Rejected" || 
              selectedInvoice.status === "Rejected" || selectedInvoice.invoiceStatus === "Rejected") && (
                <div>

                  <span className="label">Reason</span>
                  <span>:</span>
                  <span>
                    {selectedInvoice.reason ||
                      selectedInvoice.rejectionReason ||
                      "-"}
                  </span>
                </div>
              )}
            </div>
          </div>

            )}

            {(
              selectedInvoice.quotationStatus === "Deposit Paid" ||
              selectedInvoice.quotationStatus === "Paid" ||
              selectedInvoice.quotationStatus === "Partial Paid" ||
              selectedInvoice.QuotationStatus === "Deposit Paid" ||
              selectedInvoice.QuotationStatus === "Paid" ||
              selectedInvoice.QuotationStatus === "Partial Paid" ||
              selectedInvoice.status === "Deposit Paid" ||
              selectedInvoice.status === "Paid" ||
              selectedInvoice.status === "Partial Paid" ||
              selectedInvoice.Status === "Deposit Paid" ||
              selectedInvoice.Status === "Paid" ||
              selectedInvoice.Status === "Partial Paid" ||
              selectedInvoice.invoiceStatus === "Deposit Paid" ||
              selectedInvoice.invoiceStatus === "Paid" ||
              selectedInvoice.invoiceStatus === "Partial Paid" ||
              selectedInvoice.InvoiceStatus === "Deposit Paid" ||
              selectedInvoice.InvoiceStatus === "Paid" ||
              selectedInvoice.InvoiceStatus === "Partial Paid"
            ) && (
              <div className="vp-section payment-history-section">
                <h4 className="quotation-view-section-title">Payment History</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Payment Date</th>
                      <th>Outstanding Amount</th>
                      <th>Paid Amount</th>
                      <th>Amount Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.paymentHistory?.length > 0 ? (
                      selectedInvoice.paymentHistory.map((payment, index) => (
                        <tr key={payment.id || index}>
                          <td>{payment.transactionId || payment.TransactionId || "-"}</td>
                          <td>
                            {(payment.paymentDate || payment.PaymentDate)
                              ? new Date(payment.paymentDate || payment.PaymentDate).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                          <td>
                            {(payment.totalAmount ?? payment.TotalAmount) != null
                              ? Number(payment.totalAmount ?? payment.TotalAmount).toFixed(2)
                              : "0.00"}
                           </td>
                          <td>
                            <div className="payment-amount-values">
                              <span>
                                {(payment.paidAmount ?? payment.PaidAmount) != null
                                  ? Number(payment.paidAmount ?? payment.PaidAmount).toFixed(2)
                                  : "0.00"}
                              </span>
                             
                            </div>
                          </td>
                          <td>
                          <div className="payment-amount-values">
                              {(payment.totatlDue ?? payment.TotatlDue ?? payment.outstandingAmount) != null
                              ? Number(payment.totatlDue ?? payment.TotatlDue ?? payment.outstandingAmount).toFixed(2)
                              : selectedInvoice.outstandingAmount != null
                                ? Number(selectedInvoice.outstandingAmount).toFixed(2)
                                : "0.00"}
                          </div>
                           
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
            
            {(
            type === "Invoice" ||
            type === "invoiceapproval" 
           ) && (
           <div className="vp-section">
            <h4 className="quotation-view-section-title">
               Invoice Information
            </h4>

            <div className="quotation-view-info">
              <div>
                <span className="label">Quotation ID</span>
                <span>:</span>
                <span>
                  {selectedInvoice.quotationReferenceNumber ||
                    selectedInvoice.quotationRefno ||
                    "-"}
                </span>
              </div>
              <div>
                <span className="label">Invoice ID</span>
                <span>:</span>
                <span>
                  {selectedInvoice.invoiceReferenceNumber ||"-"}
                </span>
              </div>

              <div>
                <span className="label">Invoice Date</span>
                <span>:</span>
                <span>
                  {selectedInvoice?.invoiceDate
                    ? (() => {
                      const d = new Date(selectedInvoice.invoiceDate);
                      return !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, "0")}/${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}/${d.getFullYear()}` : "-";
                    })()
                    : "-"}
                </span>
              </div>

              <div>
                <span className="label">Status</span>
                <span>:</span>
                <span>
                  {selectedInvoice.invoiceStatus ||
                    selectedInvoice.status ||
                    "-"}
                </span>
              </div>
              
               <div>
                <span className="label">Total Amount</span>
                <span>:</span>
                <span>
                  {selectedInvoice.totalAmount != null
                    ? Number(selectedInvoice.totalAmount).toFixed(2)
                    : "-"}
                </span>
              </div>

             
              {(selectedInvoice.quotationStatus === "Cancelled" || selectedInvoice.status === "Cancelled" || selectedInvoice.invoiceStatus === "Cancelled") && (
                <div>

                  <span className="label">Reason</span>
                  <span>:</span>
                  <span>
                    {selectedInvoice.reason ||
                      selectedInvoice.rejectionReason ||
                      "-"}
                  </span>
                </div>
              )}
            </div>
          </div>
           )}
          {/* ── Line Items ── */}
          <div className="vp-section">
            <h4 className="quotation-view-section-title">Line Items</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Category</th>
                  <th>Name</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Unit Rate</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>Discount</th>
                  <th style={{ textAlign: "right" }}>Disc. Total</th>
                  <th style={{ textAlign: "right" }}>VAT %</th>
                  <th style={{ textAlign: "right" }}>Net Amount</th>
                </tr>
              </thead>
              
              <tbody>
                {lineItems.map((d, i) => {
                  const qty =
                    d.quotationQuantity ??
                    d.invoiceQuantity ??
                    d.quantity ??
                    0;

                  const unitRate =
                    d.unitRate ??
                    d.price ??
                    0;

                  const amount =
                    d.amount ??
                    qty * unitRate;

                  const discount =
                    d.discount ??
                    d.discountValue ??
                    0;

                  const tax =
                    d.tax ??
                    d.vat ??
                    0;

                  const netAmount =
                    d.netAmount ??
                    (amount - discount + ((amount - discount) * tax) / 100);

                  return (
                    <tr key={i}>
                      <td>{d.itemCode || "-"}</td>
                      <td>{d.category || "-"}</td>
                      <td>{d.itemName || d.name || "-"}</td>
                      <td style={{ textAlign: "right" }}>{qty}</td>
                      <td style={{ textAlign: "right" }}>{unitRate}</td>
                      <td style={{ textAlign: "right" }}>{amount}</td>
                      <td style={{ textAlign: "right" }}>{discount}</td>
                      <td style={{ textAlign: "right" }}>{amount - discount}</td>
                      <td style={{ textAlign: "right" }}>{tax}</td>
                      <td style={{ textAlign: "right" }}>
                        {Number(netAmount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>



          {/* ── Customer Information ── */}
          <div className="vp-section">
            <h4 className="quotation-view-section-title">
              Customer Information
            </h4>
            <div className="quotation-view-info">
              <div>
                <span className="label">Company</span>
                <span>:</span>
                <span>{selectedInvoice.receivingEntity || "-"}</span>
              </div>
              <div>
                <span className="label">Name</span>
                <span>:</span>
                <span>{selectedInvoice.customerName || "-"}</span>
              </div>
              <div>
                <span className="label">Phone</span>
                <span>:</span>
                <span>{selectedInvoice.customerPhone || "-"}</span>
              </div>
              <div>
                <span className="label">Email</span>
                <span>:</span>
                <span>{selectedInvoice.customerEmail || "-"}</span>
              </div>
              <div>
                <span className="label">Address</span>
                <span>:</span>
                <span>{selectedInvoice.customerAddress || "-"}</span>
              </div>
              <div>
                <span className="label">Payment Terms</span>
                <span>:</span>
                <span>{selectedInvoice.paymentTerms || "-"}</span>
              </div>
            </div>
          </div>

          {/* ── Proof of Payment — invoiced / refunded rows only. A refunded
                 row shows its refund document, anything else the invoice
                 proof, so the two stages never mix. ── */}
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
          )}
          */}
          <AlertDialog
            open={showPaidPopup && !!selectedPaidQuotation}
            onOpenChange={handleClosePaidPopup}
          >
            <AlertDialogContent className="max-w-xl p-8 gap-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">
                  {isProformaFollowUp
                    ? "Has this proforma been paid?"
                    : "Is this quotation paid?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  {isSuperAdmin ? (
                    <>
                      Confirm the payment was received to generate the invoice.
                    </>
                  ) : isProformaFollowUp ? (
                    <>
                      Choose <strong>Yes</strong> to generate the invoice, or{" "}
                      <strong>No</strong> to cancel this quotation.
                    </>
                  ) : (
                    <>
                      Choose <strong>Paid</strong> to generate the invoice, or{" "}
                      <strong>Unpaid</strong> to issue a proforma invoice instead —
                      it stays in this list until the payment comes in.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {renderQuotationSummary(selectedPaidQuotation)}

              <div className="paid-action-body" style={{ padding: 0 }}>
                <div className="payment-option-row">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="paid"
                      checked={paymentOption === "paid"}
                      onChange={() => setPaymentOption("paid")}
                    />
                    {isProformaFollowUp ? "Yes, payment received" : "Paid"}
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="unpaid"
                      checked={paymentOption === "unpaid"}
                      onChange={() => setPaymentOption("unpaid")}
                    />
                    {isProformaFollowUp ? "No, not paid" : "Unpaid"}
                  </label>
                  {/* {!isSuperAdmin && (
<label className="payment-option">
    <input
        type="radio"
        name="paymentOption"
        value="unpaid"
        checked={paymentOption === "unpaid"}
        onChange={() => setPaymentOption("unpaid")}
    />
    {isProformaFollowUp ? "No, not paid" : "Unpaid"}
</label>
)} */}

                </div>

                {(paymentOption === "paid" ||
                  (isSuperAdmin &&
                    paymentOption === "unpaid" &&
                    !isProformaFollowUp)) && (
                    <div className="proof-upload-row">
                      <label className="proof-upload-label">
                        Upload proof of payment
                      </label>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleProofChange}
                      />

                      {proofFile && (
                        <div className="proof-file-list">
                          <div className="proof-file-name">{proofFile.name}</div>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={handleClosePaidPopup}
                >
                  Close
                </AlertDialogCancel>

                {/* Plain buttons — they must keep the dialog open while the
                            request is in flight, which AlertDialogAction would not. */}
                {(paymentOption === "paid" ||
                  (isSuperAdmin &&
                    paymentOption === "unpaid" &&
                    !isProformaFollowUp)) && (
                    <button
                      type="button"
                      className="generate-invoice-btn"
                      disabled={!proofFile || popupLoadingInvoice}
                      onClick={handleGenerateInvoiceFromPopup}
                    >
                      {popupLoadingInvoice ? (
                        <span className="spinner"></span>
                      ) : (
                        "Generate Invoice"
                      )}
                    </button>
                  )}

                {paymentOption === "unpaid" &&
                  !isProformaFollowUp && (
                    <button
                      type="button"
                      className="generate-proforma-btn"
                      disabled={popupLoadingProforma}
                      onClick={handleSaveProformaFromPopup}
                    >
                      {popupLoadingProforma ? (
                        <span className="spinner"></span>
                      ) : (
                        'Generate Proforma'
                      )}
                    </button>
                  )}

                {paymentOption === "unpaid" &&
                  isProformaFollowUp && (
                    <button
                      type="button"
                      className="cancel-quotation-btn"
                      disabled={popupLoadingCancel}
                      onClick={handleCancelProformaFromPopup}
                    >
                      {popupLoadingCancel ? (
                        <span className="spinner"></span>
                      ) : (
                        'Cancel Quotation'
                      )}
                    </button>
                  )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default ViewPopup;
