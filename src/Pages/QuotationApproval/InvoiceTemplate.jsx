import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "alertifyjs/build/css/alertify.css";
import { fetchInvoicedetailswithRefno } from "../../redux/QuotationTemplateSlice";
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

const InvoiceTemplate = () => {
  const templateRef = useRef(null);
  const location = useLocation();
  const dispatch = useDispatch();

  const queryParams = new URLSearchParams(location.search);
  const invoiceId = queryParams.get("invoiceId");

  const { invoiceDetails, invoiceloading, error, message } =
    useSelector((state) => state.quotationApprovalTemplate) || {};

  const invoice = invoiceDetails?.list?.[0] || null;

  const isOrderCompleted =
    String(invoice?.invoiceStatus || "")
      .trim()
      .toLowerCase() === "completed" ||
    String(invoice?.invoiceStatus || "")
      .trim()
      .toLowerCase() === "order completed";

  useEffect(() => {
    if (invoiceId) dispatch(fetchInvoicedetailswithRefno(invoiceId));
  }, [dispatch, invoiceId]);

  console.log("Invoice Details:", invoiceDetails);

  const formatCurrency = (n) => {
    if (n == null || n === "") return "-";
    return Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const logoFileName = invoice?.comapanyLogo
    ? invoice.comapanyLogo.split(/[/\\]/).pop()?.trim()
    : "";
  const logoUrl = logoFileName
    ? `${baseURL}/UploadedFiles/${logoFileName}`
    : LOCAL_LOGO;

  const handleDownloadInvoice = () => {
    if (!templateRef.current) {
      return;
    }

    const element = templateRef.current;

    const invoiceNumber =
      invoice?.invoiceReferenceNumber || `Invoice-${invoiceId}`;

    const options = {
      margin: [10, 10, 10, 10],

      filename: `${invoiceNumber}.pdf`,

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

  if (invoiceloading) {
    return (
      <div className="cit-loading">
        <div className="cit-spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="cit-error">Failed to load invoice. Please try again.</div>;
  }

  if (!invoice) {
    return <div className="cit-error">Invoice not found.</div>;
  }

  return (
    <div className="cit-page">
      <div className="cit-sheet" ref={templateRef}>

        {/* DOWNLOAD BUTTON — data-html2canvas-ignore keeps it out of the generated PDF */}
        <button
          type="button"
          className="cit-download-btn"
          onClick={handleDownloadInvoice}
          data-html2canvas-ignore="true"
        >
          Download
        </button>
        <br /><br />
        {message && <div className="cit-banner success">{message}</div>}

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
          {/* <div className="cit-title-wrap">
            <h1 className="cit-title">Invoice</h1>

          </div> */}

          <div className="cit-title-wrap">
            <h1 className="cit-title">Invoice</h1>

            {isOrderCompleted && (
              <div
                style={{
                  marginTop: "6px",
                  display: "inline-block",
                  padding: "5px 12px",
                  backgroundColor: "#eaf6ee",
                  border: "1px solid #3D8C4F",
                  borderRadius: "20px",
                  color: "#2f7d43",
                  fontSize: "10px",
                  fontWeight: "700",
                  lineHeight: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  visibility: "visible",
                  opacity: 1,
                  WebkitTextFillColor: "#2f7d43",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginRight: "5px",
                    width: "14px",
                    height: "14px",
                    lineHeight: "14px",
                    textAlign: "center",
                    backgroundColor: "#3D8C4F",
                    color: "#ffffff",
                    borderRadius: "50%",
                    fontSize: "9px",
                    fontWeight: "700",
                    verticalAlign: "middle",
                    WebkitTextFillColor: "#ffffff",
                  }}
                >
                  ✓
                </span>

                <span
                  style={{
                    color: "#2f7d43",
                    WebkitTextFillColor: "#2f7d43",
                  }}
                >
                  Order Completed
                </span>
              </div>
            )}
          </div>
          <div className="cit-company">
            <div className="cit-company-name">{invoice?.companyName || "-"}</div>
            <div className="cit-row-line">
              <span>Company Reg No:</span>

              {invoice?.registrationNumber || "-"}

            </div>
            <div className="cit-row-line">
              <span>VAT Reg No:</span> {invoice?.vatNumber || "-"}
            </div>
            <div className="cit-row-line">
              <span>Website:</span>
              {invoice?.companyWebsite || "-"}
            </div>

            <div className="cit-row-line">
              <span>Tel:</span> {invoice?.companyPhoneNumber || "-"}
            </div>
            <div className="cit-row-line">
              <span>Email:</span> {invoice?.companyEmail || "-"}
            </div>
            <div className="cit-row-line">
              <span>Address:</span> {invoice?.companyAddress || "-"}
            </div>
          </div>
        </div>

        {/* Meta row: customer | title | doc meta */}
        <div className="cit-meta">
          <div className="cit-party">
            <div className="cit-block-label">Bill To</div>
            <div className="cit-strong">{invoice?.receivingEntity || "-"}</div>
            <div className="cit-strong">{invoice?.customerName || "-"}</div>
            <div className="cit-strong">{invoice?.customerEmail || "-"}</div>
          </div>

          <div className="cit-title-wrap">
            {/* <h1 className="cit-title">Invoice</h1>
            <div className="cit-title-sub">{invoice?.invoiceStatus || ""}</div> */}
          </div>

          <div className="cit-docmeta">
            <div className="cit-mrow">
              <span>Quotation Id</span>
              <span>{invoice?.quotationReferenceNumber || "-"}</span>
            </div>
            <div className="cit-mrow">
              <span>Invoice Id</span>
              <span>{invoice?.invoiceReferenceNumber || "-"}</span>
            </div>

            <div className="cit-mrow">
              <span>Date</span>
              <span>{formatDate(invoice?.invoiceDate)}</span>
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
            <span>Type</span>
            {invoice?.quotationType || "-"}
          </div>
          <div className="cit-attr">
            <span>Payment Terms</span>
            {invoice?.paymentTerms || "-"}
          </div>
        </div>
        {/* <div className="cit-attrs">
  <div className="cit-attr">
    <span>
      {type === "cancelled" ? "Rejected Date" : "VAT Number"}
    </span>

    {type === "cancelled"
      ? formatDate(invoice?.rejectedDate)
      : invoice?.vatNumber || "-"}
  </div>

  <div className="cit-attr">
    <span>Type</span>
    {invoice?.invoiceType || "-"}
  </div>

  <div className="cit-attr">
    <span>
      {type === "cancelled" ? "Reason" : "Payment Terms"}
    </span>

    {type === "cancelled"
      ? invoice?.reason || "-"
      : invoice?.paymentTerms || "-"}
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
              <th style={{ width: "100px" }}>Amount</th>
              <th style={{ width: "70px" }}>Disc</th>
              <th style={{ width: "70px" }}>Disc Total</th>
              <th style={{ width: "60px" }}>VAT %</th>
              <th style={{ width: "120px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice?.details?.length > 0 ? (
              invoice.details.map((d, idx) => {
                const base = (Number(d.quotationQuantity) || 0) * (Number(d.unitRate) || 0);
                const discounted = base - (Number(d.discount) || 0);
                const net = discounted + (discounted * (Number(d.vat) || 0)) / 100;
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
                    <td className="cit-ctr">{d.vat}</td>
                    <td className="cit-num">{formatCurrency(net)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="cit-empty" colSpan="7">
                  No invoice details found.
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
              <span>Account Name</span>
              <span>{invoice?.accountHolderName || "-"}</span>
            </div>
            <div className="cit-brow">
              <span>Bank Name</span>
              <span>{invoice?.bankName || "-"}</span>
            </div>
            <div className="cit-brow">
              <span>Branch Code</span>
              <span>{invoice?.branchCode || "-"}</span>
            </div>
            <div className="cit-brow">
              <span>Account Number</span>
              <span>{invoice?.bankAccountNumber || "-"}</span>
            </div>

          </div>

          <div className="cit-totals">
            <div className="cit-trow">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice?.subTotal)}</span>
            </div>
            <div className="cit-trow">
              <span>VAT</span>
              <span>{formatCurrency(invoice?.taxAmount)}</span>
            </div>
            <div className="cit-trow cit-grand">
              <span>Total Incl. VAT</span>
              <span>{formatCurrency(invoice?.totalAmount)}</span>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default InvoiceTemplate;
