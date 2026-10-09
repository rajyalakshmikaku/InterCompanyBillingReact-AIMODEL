import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "alertifyjs/build/css/alertify.css";
import { fetchCreditnotedetailswithRefno } from "../../redux/QuotationTemplateSlice";
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

const CreditNoteViewTemplate = () => {
  const templateRef = useRef(null);
  const location = useLocation();
  const dispatch = useDispatch();

  const queryParams = new URLSearchParams(location.search);
  const creditNoteId = queryParams.get("creditNoteId");

  const { creditNoteDetails, creditNoteloading, error, message } =
    useSelector((state) => state.quotationApprovalTemplate) || {};

  const invoice = creditNoteDetails?.list || null;

  useEffect(() => {
    if (creditNoteId) dispatch(fetchCreditnotedetailswithRefno(creditNoteId));
  }, [dispatch, creditNoteId]);

  const formatCurrency = (n) => {
    if (n == null || n === "") return "-";
    return Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };


  const handleDownloadPDF = () => {
    if (!templateRef.current) {
      return;
    }

    const element = templateRef.current;

    const creditNoteNumber =
      invoice?.referenceNumber || `CreditNote-${creditNoteId}`;

    const options = {
      margin: [10, 10, 10, 10],

      filename: `${creditNoteNumber}.pdf`,

      image: {
        type: "jpeg",
        quality: 0.98,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
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

    html2pdf()
      .set(options)
      .from(element)
      .save();
  };

  const logoFileName = invoice?.comapanyLogo
    ? invoice.comapanyLogo.split(/[/\\]/).pop()?.trim()
    : "";
  const logoUrl = logoFileName
    ? `${baseURL}/UploadedFiles/${logoFileName}`
    : LOCAL_LOGO;

  if (creditNoteloading) {
    return (
      <div className="cit-loading">
        <div className="cit-spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="cit-error">{error}</div>;
  }

  if (!invoice) {
    return <div className="cit-error">No data available</div>;
  }

  return (
    <div className="cit-page">
      <div className="cit-sheet" ref={templateRef}>

        {/* DOWNLOAD BUTTON — data-html2canvas-ignore keeps it out of the generated PDF */}
        <button
          type="button"
          className="cit-download-btn"
          onClick={handleDownloadPDF}
          data-html2canvas-ignore="true"
        >
          Download
        </button>
        <br /><br />
        {message && (
          <div className="cit-banner success">
            {message}
          </div>
        )}

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
            <h1 className="cit-title"
              style={{
                fontSize: "24px",
                whiteSpace: "nowrap",
                marginLeft: "10px"
              }}>Credit Note</h1>
          </div>

          <div className="cit-company">
            <div className="cit-company-name">
              {invoice?.companyName || "-"}
            </div>

            <div className="cit-row-line">
              <span>Company Reg No:</span>{" "}
              {invoice?.registrationNumber || "-"}
            </div>

            <div className="cit-row-line">
              <span>VAT Reg No:</span>{" "}
              {invoice?.vatNumber || "-"}
            </div>

            <div className="cit-row-line">
              <span>Website:</span>{" "}
              {invoice?.companyWebsite || "-"}
            </div>

            <div className="cit-row-line">
              <span>Tel:</span>{" "}
              {invoice?.companyPhoneNumber || "-"}
            </div>

            <div className="cit-row-line">
              <span>Email:</span>{" "}
              {invoice?.companyEmail || "-"}
            </div>

            <div className="cit-row-line">
              <span>Address:</span>{" "}
              {invoice?.companyAddress || "-"}
            </div>
          </div>
        </div>

        {/* Meta row: customer | title | doc meta */}
        <div className="cit-meta">

          <div className="cit-party">
            <div className="cit-block-label">
              Credit Note Addressed To
            </div>

            <div className="cit-strong">
              {invoice?.receivingEntity || "-"}
            </div>

            <div className="cit-strong">
              {invoice?.customerName || "-"}
            </div>

            <div className="cit-strong">
              {invoice?.customerEmail || "-"}
            </div>

            <div className="cit-strong">
              {invoice?.customerPhone || "-"}
            </div>
          </div>

          <div className="cit-title-wrap">
            {/* Empty center space */}
          </div>

          <div className="cit-docmeta">

            <div className="cit-mrow">
              <span>Credit Note No</span>
              <span>
                {invoice?.referenceNumber || "-"}
              </span>
            </div>

            <div className="cit-mrow">
              <span>Credit Note Date</span>
              <span>
                {formatDate(invoice?.creditNoteDate)}
              </span>
            </div>

            <div className="cit-mrow">
              <span>Invoice Ref No</span>
              <span>
                {invoice?.invoiceReferenceNumber || "-"}
              </span>
            </div>

            <div className="cit-mrow">
              <span>Due Date</span>
              <span>
                {formatDate(invoice?.dueDate)}
              </span>
            </div>

          </div>
        </div>

        {/* Secondary attributes */}
        <div className="cit-attrs">

          <div className="cit-attr">
            <span>VAT Number</span>
            {invoice?.vatNumber || "-"}
          </div>

          <div className="cit-attr">
            <span>Invoice Date</span>
            {formatDate(invoice?.invoiceDate)}
          </div>

          <div className="cit-attr">
            <span>Payment Terms</span>
            {invoice?.paymentTerms || "-"}
          </div>

        </div>

        {/* Line items */}
        <table className="cit-table">
          <thead>
            <tr>
              <th style={{ width: "110px" }}>Item Code</th>
              <th>Description</th>
              <th style={{ width: "80px" }}>Qty</th>
              <th style={{ width: "100px" }}>
                Unit Rate Excl VAT
              </th>
              <th style={{ width: "100px" }}>
                Amount
              </th>
              <th style={{ width: "70px" }}>Disc</th>
              <th style={{ width: "70px" }}>Disc Total</th>
              <th style={{ width: "60px" }}>VAT %</th>
              <th style={{ width: "120px" }}>Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice?.details?.length > 0 ? (
              invoice.details.map((d, idx) => {

                const base =
                  (Number(d.itemQuantity) || 0) *
                  (Number(d.unitRate) || 0);

                const discounted =
                  base - (Number(d.discount) || 0);

                const net =
                  discounted +
                  (discounted * (Number(d.vat) || 0)) / 100;

                return (
                  <tr key={idx}>

                    <td className="cit-ctr">
                      {d.itemCode}
                    </td>

                    <td className="cit-desc">
                      {d.itemName}

                      {d.category ? (
                        <span className="cit-dim">
                          {" "}— {d.category}
                        </span>
                      ) : null}
                    </td>

                    <td className="cit-ctr">
                      {d.itemQuantity}
                    </td>

                    <td className="cit-num">
                      {formatCurrency(d.unitRate)}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(d.itemQuantity * d.unitRate)}
                    </td>

                    <td className="cit-num">
                      {formatCurrency(d.discount)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(d.itemQuantity * d.unitRate - d.discount)}
                    </td>

                    <td className="cit-ctr">
                      {d.vat}
                    </td>

                    <td className="cit-num">
                      {formatCurrency(net)}
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="cit-empty"
                  colSpan="7"
                >
                  No details found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer: bank + totals */}
        <div className="cit-foot">

          <div className="cit-bank">

            <div className="cit-block-label">
              Bank Details
            </div>

            <div className="cit-brow">
              <span>Bank Name</span>
              <span>{invoice?.bankName || "-"}</span>
            </div>

            <div className="cit-brow">
              <span>Account Name</span>
              <span>
                {invoice?.accountHolderName || "-"}
              </span>
            </div>

            <div className="cit-brow">
              <span>Branch Code</span>
              <span>{invoice?.branchCode || "-"}</span>
            </div>

            <div className="cit-brow">
              <span>Account Number</span>
              <span>
                {invoice?.bankAccountNumber || "-"}
              </span>
            </div>

          </div>

          <div className="cit-totals">

            <div className="cit-trow">
              <span>Subtotal</span>
              <span>
                {formatCurrency(invoice?.subTotal)}
              </span>
            </div>

            <div className="cit-trow">
              <span>VAT</span>
              <span>
                {formatCurrency(invoice?.taxAmount)}
              </span>
            </div>

            <div className="cit-trow cit-grand">
              <span>Total Incl. VAT</span>
              <span>
                {formatCurrency(invoice?.totalAmount)}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CreditNoteViewTemplate;
