// QuotationTemplateModern.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import {
  fetchQuotationdetailswithRefno,
  fetchSaveQuotationApprovalorRejection,
} from "../../redux/QuotationTemplateSlice";
import "./ClassicInvoiceTemplate.css";
import { baseURL } from "../../services/api";
import html2pdf from "html2pdf.js";

const LOCAL_LOGO = "/images/company-logo.png";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
};

const QuotationTemplateModern = () => {
  const templateRef = useRef(null);
  const location = useLocation();
  const dispatch = useDispatch();

  const queryParams = new URLSearchParams(location.search);
  const quotationId = queryParams.get("quotationId");
  const type = queryParams.get("type");

  const { quotationDetails, loading, error, message } =
    useSelector((state) => state.quotationApprovalTemplate) || {};

  const quotation = quotationDetails?.quotation || null;
  const details = quotationDetails?.details || [];

  useEffect(() => {
    if (quotationId) 
      dispatch(fetchQuotationdetailswithRefno({ refNo: quotationId, guId: null, type: null }));
  }, [dispatch, quotationId]);

  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [downloading, setDownloading] = useState(false);

  const formatCurrency = (n) => {
    if (n == null || n === "") return "-";
    return Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const logoFileName = quotation?.companyLogo
    ? quotation.companyLogo.split(/[/\\]/).pop()
    : "";
  const logoUrl = logoFileName
    ? `${baseURL}/UploadedFiles/${logoFileName}`
    : LOCAL_LOGO;

  const handleDownloadQuotation = () => {
    if (!templateRef.current || downloading) return;

    const element = templateRef.current;
    const referenceNumber =
      quotation?.porformaReferenceNumber ||
      quotation?.quotationReferenceNumber ||
      quotationId ||
      "ProformaInvoice";

    const options = {
      margin: [10, 10, 10, 10],
      filename: `ProformaInvoice_${referenceNumber}.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Skip elements marked data-html2canvas-ignore (e.g. the Download
        // button itself) so they don't end up baked into the PDF.
        ignoreElements: (el) => el.hasAttribute("data-html2canvas-ignore"),
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
      },
    };

    setDownloading(true);
    html2pdf()
      .set(options)
      .from(element)
      .save()
      .catch((err) => {
        console.error(err);
        alertify.error("Failed to download proforma invoice.");
      })
      .finally(() => setDownloading(false));
  };

  const handleApprove = () => {
    alertify.confirm(
      "Confirmation",
      "Are you sure you want to approve this quotation?",
      function () {
        setApproveLoading(true);
        dispatch(
          fetchSaveQuotationApprovalorRejection({
            quotationId: quotation.quotationReferenceNumber,
            type: "Approve",
            reason: "",
          })
        ).then((res) => {
          setApproveLoading(false);
          if (res.meta.requestStatus === "fulfilled") {
            alertify.alert("Success", res.payload.message, function () {
              window.location.reload();
            });
          } else {
            alertify.alert("Error", "Approval failed.");
          }
        });
      },
      function () {
        alertify.alert("Cancelled", "Approval cancelled.");
      }
    );
  };

  const handleReject = () => {
    alertify.confirm(
      "Confirmation",
      "Are you sure you want to reject this quotation?",
      function () {
        setShowRejectModal(true);
      },
      function () {
        alertify.error("Rejection cancelled.");
      }
    );
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      alertify.alert("Warning", "Please enter a rejection reason.");
      return;
    }
    setRejectLoading(true);
    dispatch(
      fetchSaveQuotationApprovalorRejection({
        quotationId: quotation.quotationReferenceNumber,
        type: "Closed",
        reason: rejectReason,
      })
    ).then((res) => {
      setRejectLoading(false);
      if (res.meta.requestStatus === "fulfilled") {
        alertify.alert("Success", res.payload.message, function () {
          setShowRejectModal(false);
          window.location.reload();
        });
      } else {
        alertify.alert("Error", "Rejection failed.");
      }
    });
  };

  if (loading) {
    return (
      <div className="cit-loading">
        <div className="cit-spinner" />
      </div>
    );
  }

  return (
    <div className="cit-page">
      <div className="cit-sheet" ref={templateRef}>
        {/* DOWNLOAD BUTTON — data-html2canvas-ignore keeps it out of the generated PDF */}
        <button
          type="button"
          className="cit-download-btn"
          onClick={handleDownloadQuotation}
          disabled={downloading}
          data-html2canvas-ignore="true"
        >
          {downloading && <span className="cit-spinner cit-spinner-sm" />}
          {downloading ? "Downloading..." : "Download"}
        </button>
        <br/><br/>
        {message && <div className="cit-banner success">{message}</div>}
        {error && <div className="cit-banner error">{error}</div>}
        
        {/* Header: logo + company block */}
        <div className="cit-head">
          <div className="cit-logo-box">
            {logoFileName && (
              <img
                src={logoUrl}
                alt="Company Logo"
                className="cit-logo"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="cit-title-wrap">
            <h1 className="cit-title">Proforma Invoice</h1>
            {/* <div className="cit-title-sub">{quotation?.quotationStatus || ""}</div> */}
          </div>
          <div className="cit-company">
            <div className="cit-company-name">{quotation?.companyName || "-"}</div>
            <div className="cit-row-line">
              <span>Company Reg No:</span> {quotation?.registrationNumber || "-"}
            </div>
            <div className="cit-row-line">
              <span>VAT Reg No:</span> {quotation?.vatNumber || "-"}
            </div>
            <div className="cit-row-line">
              <span>Website :</span>
              {quotation?.companyWebsite || "-"}
            </div>

            <div className="cit-row-line">
              <span>Tel:</span> {quotation?.companyPhoneNumber || "-"}
            </div>
            <div className="cit-row-line">
              <span>Email:</span> {quotation?.companyEmail || "-"}
            </div>
            <div className="cit-row-line">
              <span>Address:</span> {quotation?.companyAddress || "-"}
            </div>


          </div>
        </div>

        {/* Meta row: customer | title | doc meta */}
        <div className="cit-meta">
          <div className="cit-party">
            <div className="cit-block-label">Customer</div>
            <div className="cit-strong">{quotation?.receivingEntity || "-"}</div>
            <div className="cit-strong">{quotation?.customerName || "-"}</div>
            <div className="cit-strong">{quotation?.customerEmail || "-"}</div>
          </div>

          <div className="cit-title-wrap">
            {/* <h1 className="cit-title">Quotation</h1>
            <div className="cit-title-sub">{quotation?.quotationStatus || ""}</div> */}
          </div>

          <div className="cit-docmeta">
            <div className="cit-mrow">
              <span>Quotation Id</span>
              <span>{quotation?.quotationReferenceNumber || "-"}</span>
            </div>
            
            <div className="cit-mrow">
              <span>Proforma Id</span>
              <span>{quotation?.porformaReferenceNumber || "-"}</span>
            </div>
            
            <div className="cit-mrow">
              <span>Quotation Date</span>
              <span>{formatDate(quotation?.quotationDate)}</span>
            </div>

            {/* <div className="cit-mrow">
              <span>Customer Ref No</span>
              <span>{quotation?.customerRefno || "-"}</span>
            </div> */}
            <div className="cit-mrow">
              <span>Due Date</span>
              <span>{formatDate(quotation?.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Secondary attributes */}
        <div className="cit-attrs">
          <div className="cit-attr">
            <span>VAT Number</span>
            {quotation?.vatNumber || "-"}
          </div>
          <div className="cit-attr">
            <span>Type</span>
            {quotation?.quotationType || "-"}
          </div>
          <div className="cit-attr">
            <span>Payment Terms</span>
            {quotation?.paymentTerms || "-"}
          </div>
        </div>
        {/* <div className="cit-attrs">
  <div className="cit-attr">
    <span>
      {type === "rejected" ? "Rejected Date" : "VAT Number"}
    </span>

    {type === "rejected"
      ? formatDate(quotation?.rejectedDate)
      : quotation?.vatNumber || "-"}
  </div>

  <div className="cit-attr">
    <span>Type</span>
    {quotation?.quotationType || "-"}
  </div>

  <div className="cit-attr">
    <span>
      {type === "rejected" ? "Reason" : "Payment Terms"}
    </span>

    {type === "rejected"
      ? quotation?.reason || "-"
      : quotation?.paymentTerms || "-"}
  </div>
</div> */}

        {/* Line items */}
        <table className="cit-table">
          <thead>
            <tr>
              <th style={{ width: "110px" }}>Item Code</th>
              <th>Description</th>
              <th style={{ width: "80px" }}>Qty</th>
              <th style={{ width: "100px" }}>Unit Rate Excl VAT</th>
              <th style={{ width: "70px" }}>Amount</th>
              <th style={{ width: "70px" }}>Disc</th>
              <th style={{ width: "70px" }}>Disc Total</th>
              <th style={{ width: "60px" }}>VAT %</th>
              <th style={{ width: "120px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {details?.length > 0 ? (
              details.map((d, idx) => {
                const base = (Number(d.quotationQuantity) || 0) * (Number(d.unitRate) || 0);
                const discounted = base - (Number(d.discount) || 0);
                const net = discounted + (discounted * (Number(d.tax) || 0)) / 100;
                return (
                  <tr key={idx}>
                    <td className="cit-ctr">{d.itemCode}</td>
                    <td className="cit-desc">
                      {d.itemName}
                      {d.category ? (
                        <span className="cit-dim"> — {d.category}</span>
                      ) : null}
                    </td>
                    <td className="cit-ctr">{d.quotationQuantity}</td>
                    <td className="cit-num">{formatCurrency(d.unitRate)}</td>
                     <td style={{ textAlign: "right" }}>
                      {formatCurrency(d.quotationQuantity * d.unitRate)}
                    </td>
                    <td className="cit-num">{formatCurrency(d.discount)}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(d.quotationQuantity * d.unitRate - d.discount)}
                    </td>
                    <td className="cit-ctr">{d.tax}</td>
                    <td className="cit-num">{formatCurrency(net)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="cit-empty" colSpan="7">
                  No quotation details found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer: bank + totals */}
        <div className="cit-foot">
          <div className="cit-bank">
            <div className="cit-block-label">Bank Details</div>
            <div className="cit-brow">
              <span>Bank Name</span>
              <span>{quotation?.bankName || "-"}</span>
            </div>
            <div className="cit-brow">
              <span>Account Name</span>
              <span>{quotation?.accountHolderName || "-"}</span>
            </div>
            <div className="cit-brow">
              <span>Branch Code</span>
              <span>{quotation?.branchCode || "-"}</span>
            </div>
            <div className="cit-brow">
              <span>Account Number</span>
              <span>{quotation?.bankAccountNumber || "-"}</span>
            </div>
            {/* <div className="cit-brow">
              <span>Reference</span>
              <span>{quotation?.referenceNumber || "-"}</span>
            </div> */}
          </div>

          <div className="cit-totals">
            <div className="cit-trow">
              <span>Subtotal</span>
              <span>{formatCurrency(quotation?.subTotal)}</span>
            </div>
            <div className="cit-trow">
              <span>VAT</span>
              <span>{formatCurrency(quotation?.taxAmount)}</span>
            </div>
            <div className="cit-trow cit-grand">
              <span>Total Incl. VAT</span>
              <span>{formatCurrency(quotation?.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment terms */}
        {/* <div className="cit-note">
          Payment Terms: {quotation?.paymentTerms || "—"}
        </div> */}

        {/* Actions */}
        <div className="cit-actions">
          {type === "customer" &&
            (quotation?.quotationStatus === "Created" ||
              quotation?.quotationStatus === "Updated") && (
              <>
                <button
                  className="cit-btn cit-btn-approve"
                  onClick={handleApprove}
                  disabled={approveLoading || rejectLoading}
                >
                  {approveLoading && <span className="cit-spinner cit-spinner-sm" />}
                  Approve
                </button>
                <button
                  className="cit-btn cit-btn-reject"
                  onClick={handleReject}
                  disabled={approveLoading || rejectLoading}
                >
                  Reject
                </button>
              </>
            )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="cit-modal-overlay">
          <div className="cit-modal">
            <h3>Rejection Reason</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason"
            />
            
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationTemplateModern;
