import React, { useState, useEffect } from "react";
import { FaBuilding, FaUsers } from "react-icons/fa";
import { FiCheck, FiX } from "react-icons/fi";
import { AxiosInstance, baseURL } from "../../services/api";

const ProformaInvoicePopup = ({
    invoice,
    ProformaReferenceNumber,
    setProformaReferenceNumber,
    proformaError,
    handleSave,
    closeProformaPopup,
}) => {
    const [isLoadingProformaNo, setIsLoadingProformaNo] = useState(false);

    // Auto-generate proforma number on component mount
    useEffect(() => {
        const generateProformaNumber = async () => {
            try {
                setIsLoadingProformaNo(true);
                const response = await AxiosInstance.get("/api/quotation/getProformaRefno");
                if (response.data && response.data.referenceNumber) {
                    setProformaReferenceNumber(response.data.referenceNumber);
                }
            } catch (error) {
                console.error("Error generating proforma number:", error);
                // Fallback to PR prefix if API fails
                setProformaReferenceNumber(`PI-${new Date().toISOString().slice(0, 10)}-0001`);
            } finally {
                setIsLoadingProformaNo(false);
            }
        };

        generateProformaNumber();
    }, [setProformaReferenceNumber]);
    const getInvoiceValue = (...values) => {

        for (const value of values) {
            if (value !== undefined && value !== null && value !== "") {
                return value;
            }
        }
        return "";
    };


    const invoiceDetailsSource =
        Array.isArray(invoice?.invoiceDetails)
            ? invoice.invoiceDetails
            : Array.isArray(invoice?.details)
                ? invoice.details
                : Array.isArray(invoice?.detail)
                    ? invoice.detail
                    : Array.isArray(invoice?.invoice?.details)
                        ? invoice.invoice.details
                        : [];

    const companyName = getInvoiceValue(
        invoice?.companyName,
        invoice?.CompanyName,
        invoice?.company?.companyName,
        invoice?.company?.CompanyName
    );
    const vatNumber = getInvoiceValue(
        invoice?.vatNumber,
        invoice?.VatNumber,
        invoice?.company?.vatNumber,
        invoice?.company?.VatNumber
    );
    const registrationNumber = getInvoiceValue(
        invoice?.registrationNumber,
        invoice?.RegistrationNumber,
        invoice?.company?.registrationNumber,
        invoice?.company?.RegistrationNumber
    );
    const companyAddress = getInvoiceValue(
        invoice?.companyAddress,
        invoice?.CompanyAddress,
        invoice?.company?.companyAddress,
        invoice?.company?.CompanyAddress
    );
    const companyEmail = getInvoiceValue(
        invoice?.companyEmail,
        invoice?.CompanyEmail,
        invoice?.company?.companyEmail,
        invoice?.company?.CompanyEmail
    );
    const companyPhoneNumber = getInvoiceValue(
        invoice?.companyPhoneNumber,
        invoice?.companyPhone,
        invoice?.CompanyPhoneNumber,
        invoice?.company?.companyPhoneNumber
    );
    const bankName = getInvoiceValue(
        invoice?.bankName,
        invoice?.BankName,
        invoice?.company?.bankName,
        invoice?.company?.BankName
    );
    const accountHolderName = getInvoiceValue(
        invoice?.accountHolderName,
        invoice?.AccountHolderName,
        invoice?.company?.accountHolderName,
        invoice?.company?.AccountHolderName
    );
    const bankAccountNumber = getInvoiceValue(
        invoice?.bankAccountNumber,
        invoice?.BankAccountNumber,
        invoice?.company?.bankAccountNumber,
        invoice?.company?.BankAccountNumber
    );
    const branchCode = getInvoiceValue(
        invoice?.branchCode,
        invoice?.BranchCode,
        invoice?.company?.branchCode,
        invoice?.company?.BranchCode
    );
    const branchAddress = getInvoiceValue(
        invoice?.branchAddress,
        invoice?.BrannchAddress,
        invoice?.company?.branchAddress,
        invoice?.company?.BrannchAddress
    );
    const receivingEntity = getInvoiceValue(
        invoice?.receivingEntity,
        invoice?.ReceivingEntity,
        invoice?.customer?.receivingEntity,
        invoice?.customer?.ReceivingEntity
    );
    const dueDateRaw = getInvoiceValue(
        invoice?.dueDate,
        invoice?.DueDate,
        invoice?.invoiceDate,
        invoice?.InvoiceDate
    );
    const invoiceType = getInvoiceValue(
        invoice?.invoiceType,
        invoice?.quotationType,
        invoice?.InvoiceType
    );
    const dueDate = dueDateRaw
        ? new Date(dueDateRaw).toISOString().slice(0, 10)
        : "";
    const customerName = getInvoiceValue(
        invoice?.customerName,
        invoice?.CustomerName,
        invoice?.customer?.customerName,
        invoice?.customer?.CustomerName
    );
    const customerPhone = getInvoiceValue(
        invoice?.customerPhone,
        invoice?.CustomerPhone,
        invoice?.customer?.customerPhone,
        invoice?.customer?.CustomerPhone
    );
    const customerEmail = getInvoiceValue(
        invoice?.customerEmail,
        invoice?.CustomerEmail,
        invoice?.customer?.customerEmail,
        invoice?.customer?.CustomerEmail
    );
    const customerAddress = getInvoiceValue(
        invoice?.customerAddress,
        invoice?.CustomerAddress,
        invoice?.customer?.customerAddress,
        invoice?.customer?.CustomerAddress
    );
    const paymentTerms = getInvoiceValue(invoice?.paymentTerms, invoice?.PaymentTerms);
    const generatedInvoiceId = getInvoiceValue(
        invoice?.invoiceReferenceNumber,
        invoice?.referenceNumber,
        invoice?.invoiceNo,
        invoice?.InvoiceReferenceNumber
    );

    const getNumericValue = (...values) => {
        for (const value of values) {
            const numericValue = Number(value);
            if (value !== undefined && value !== null && value !== "" && Number.isFinite(numericValue)) {
                return numericValue;
            }
        }
        return 0;
    };

    const tax = getNumericValue(
        invoice?.tax,
        invoice?.Tax,
        invoice?.vat,
        invoice?.VAT,
        invoice?.taxRate,
        invoice?.TaxRate,
        invoice?.vatRate,
        invoice?.VatRate,
        invoice?.taxPercentage,
        invoice?.TaxPercentage,
        invoice?.vatPercentage,
        invoice?.VatPercentage
    );
    const logoFile = getInvoiceValue(
        invoice?.companyLogo,
        invoice?.CompanyLogo,
        invoice?.logoFile
    );

    const getDetailValue = (row, ...fields) => {
        for (const field of fields) {
            const value = row?.[field];
            if (value !== undefined && value !== null && value !== "") {
                return value;
            }
        }
        return "";
    };

    const invoiceReferenceNumber = getInvoiceValue(
        invoice?.invoiceReferenceNumber,
        invoice?.referenceNumber,
        invoice?.invoiceNo,
        invoice?.InvoiceReferenceNumber
    );

    const quotationReference = getInvoiceValue(
        invoice?.referenceNumber,
        invoice?.quotationReferenceNumber,
        invoice?.quotationRefNo,
        invoice?.ReferenceNumber
    );

    const subtotal = invoiceDetailsSource.reduce((sum, row) => {
        const quantity = Number(getDetailValue(row, "quantity", "quotationQuantity", "QuotationQuantity", "qty", "Qty")) || 0;
        const price = Number(getDetailValue(row, "price", "unitRate", "UnitRate", "unitPrice", "UnitPrice")) || 0;
        const discount = Number(getDetailValue(row, "discount", "Discount", "discountValue", "DiscountValue")) || 0;
        return sum + (quantity * price - discount);
    }, 0);

    const rowTaxValues = invoiceDetailsSource
        .map((row) => getNumericValue(
            getDetailValue(row, "tax", "Tax", "vat", "VAT", "taxRate", "TaxRate", "vatRate", "VatRate", "taxPercentage", "TaxPercentage", "vatPercentage", "VatPercentage")
        ))
        .filter((value) => value > 0);

    const displayedTaxPercent = rowTaxValues.length > 0 ? rowTaxValues[0] : tax;

    const taxAmount = invoiceDetailsSource.reduce((sum, row) => {
        const quantity = Number(getDetailValue(row, "quantity", "quotationQuantity", "QuotationQuantity", "qty", "Qty")) || 0;
        const price = Number(getDetailValue(row, "price", "unitRate", "UnitRate", "unitPrice", "UnitPrice")) || 0;
        const discount = Number(getDetailValue(row, "discount", "Discount", "discountValue", "DiscountValue")) || 0;
        const rowSubtotal = quantity * price - discount;
        const taxValue = getNumericValue(
            getDetailValue(row, "tax", "Tax", "vat", "VAT", "taxRate", "TaxRate", "vatRate", "VatRate", "taxPercentage", "TaxPercentage", "vatPercentage", "VatPercentage")
        );
        return sum + (rowSubtotal * taxValue) / 100;
    }, 0);

    const totalAmount = subtotal + taxAmount;

    return (
        <div className="quotation-form-overlay">
            <div className="quotation-form-modal">

                {/* Header with Logo */}
                <div className="cqf-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                    {/* Logo Section */}
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                        {logoFile && (
                            <img
                                src={`${baseURL}/UploadedFiles/${logoFile}`}
                                alt="Company Logo"
                                style={{
                                    height: "80px",
                                    width: "auto",
                                    objectFit: "contain"
                                }}
                            />
                        )}
                        <div>
                            <h2 className="cqf-title" style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#1a5a40" }}>
                                PROFORMA INVOICE
                            </h2>
                            <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>
                                Reference: <strong>{isLoadingProformaNo ? "Generating..." : ProformaReferenceNumber}</strong>
                            </p>
                        </div>
                    </div>
                    {/* Close Button */}
                    <button
                        type="button"
                        className="cqf-close-btn"
                        onClick={() => closeProformaPopup?.()}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "28px",
                            cursor: "pointer",
                            lineHeight: 1,
                            flexShrink: 0
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Company Details */}
                <div className="cqf-section" style={{ paddingTop: "10px" }}>
                    <div className="cqf-section-header">
                        <span className="cqf-section-icon">
                            <FaBuilding />
                        </span>
                        <span className="cqf-section-title">
                            Company Information
                        </span>
                    </div>

                    {companyName || vatNumber || registrationNumber || companyAddress || companyEmail || companyPhoneNumber ? (
                        <div className="cqf-info-grid">
                            <div className="cqf-info-item">
                                <span className="cqf-info-label">Company Name</span>
                                <span className="cqf-info-value">{companyName || "—"}</span>
                            </div>
                            <div className="cqf-info-item">
                                <span className="cqf-info-label">VAT Number</span>
                                <span className="cqf-info-value">{vatNumber || "—"}</span>
                            </div>
                            <div className="cqf-info-item">
                                <span className="cqf-info-label">Registration Number</span>
                                <span className="cqf-info-value">{registrationNumber || "—"}</span>
                            </div>
                            <div className="cqf-info-item">
                                <span className="cqf-info-label">Email</span>
                                <span className="cqf-info-value">{companyEmail || "—"}</span>
                            </div>
                            <div className="cqf-info-item">
                                <span className="cqf-info-label">Phone</span>
                                <span className="cqf-info-value">{companyPhoneNumber || "—"}</span>
                            </div>
                            <div className="cqf-info-item">
                                <span className="cqf-info-label">Address</span>
                                <span className="cqf-info-value">{companyAddress || "—"}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="cqf-empty-state cqf-empty-muted">
                            <p>No company information available.</p>
                        </div>
                    )}
                </div>

                {/* Bank Details */}
                <div className="cqf-section">
                    <div className="cqf-section-header">
                        <span className="cqf-section-icon">
                            🏦
                        </span>
                        <span className="cqf-section-title">
                            Banking Details
                        </span>
                    </div>

                    <div className="cqf-info-grid">
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Bank Name</span>
                            <span className="cqf-info-value">{bankName || "—"}</span>
                        </div>
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Account Holder</span>
                            <span className="cqf-info-value">{accountHolderName || "—"}</span>
                        </div>
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Account Number</span>
                            <span className="cqf-info-value">{bankAccountNumber || "—"}</span>
                        </div>
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Branch Code</span>
                            <span className="cqf-info-value">{branchCode || "—"}</span>
                        </div>
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Branch Address</span>
                            <span className="cqf-info-value">{branchAddress || "—"}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="cqf-section">
                    <div className="cqf-section-header">
                        <span className="cqf-section-icon">
                            <FaUsers />
                        </span>
                        <span className="cqf-section-title">
                            Customer Information
                        </span>
                    </div>

                    <div className="cqf-info-grid">
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Customer Name</span>
                            <span className="cqf-info-value">{customerName || "—"}</span>
                        </div>
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Customer Phone</span>
                            <span className="cqf-info-value">{customerPhone || "—"}</span>
                        </div>
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Customer Email</span>
                            <span className="cqf-info-value">{customerEmail || "—"}</span>
                        </div>
                        <div className="cqf-info-item" style={{ gridColumn: "1 / -1" }}>
                            <span className="cqf-info-label">Customer Address</span>
                            <span className="cqf-info-value">{customerAddress || "—"}</span>
                        </div>
                    </div>
                </div>
                {/* Invoice Information */}

                <div className="cqf-section">

                    <div className="cqf-section-header">

                        <span className="cqf-section-icon">
                            📋
                        </span>

                        <span className="cqf-section-title">
                            Invoice Information
                        </span>

                    </div>

                    <div className="cqf-info-grid">
                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Receiving Entity</span>
                            <span className="cqf-info-value">{receivingEntity || "—"}</span>
                        </div>

                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Due Date</span>
                            <span className="cqf-info-value">{dueDate || "—"}</span>
                        </div>

                        <div className="cqf-info-item">
                            <span className="cqf-info-label">Quotation Type</span>
                            <span className="cqf-info-value">{invoiceType || "—"}</span>
                        </div>
                    </div>

                </div>

                {/* Invoice Details */}

                <div className="cqf-section">

                    <div className="cqf-section-header">

                        <span className="cqf-section-icon">
                            📦
                        </span>

                        <span className="cqf-section-title">
                            Invoice Details
                        </span>

                    </div>

                    <div className="table-responsive">

                        <table className="data-table cqf-details-table">

                            <thead>

                                <tr>

                                    <th hidden>ID</th>

                                    <th>Item / Service</th>

                                    <th>Qty</th>

                                    <th>Unit Rate (Excl. VAT)</th>

                                    <th>Amount</th>

                                    <th>Discount</th>

                                    <th>Discounted Total</th>

                                    <th>VAT</th>

                                    <th>Net Amount</th>

                                </tr>

                            </thead>
                            <tbody>
                                {invoiceDetailsSource.map((row, index) => {
                                    const qty = Number(row.quotationQuantity) || 0;
                                    const price = Number(row.unitRate) || 0;
                                    const amount = qty * price;

                                    const discount = Number(row.discount) || 0;
                                    const discounted = amount - discount;

                                    const taxValue = parseFloat(row.tax) || 0;
                                    const netAmount = discounted + (discounted * taxValue) / 100;

                                    console.log("Row:", row);
                                    console.log("Quantity:", qty);
                                    console.log("Unit Rate:", price);
                                    console.log("Amount:", amount);
                                    console.log("Discount:", discount);
                                    console.log("Discounted Amount:", discounted);
                                    console.log("Tax %:", taxValue);
                                    console.log("Net Amount:", netAmount);

                                    return (
                                        <tr key={index}>
                                            <td hidden>{row.id}</td>

                                            <td className="cqf-item-cell">

                                                {getDetailValue(
                                                    row,
                                                    "itemName",
                                                    "ItemName",
                                                    "description",
                                                    "item",
                                                    "Item"
                                                )}

                                            </td>

                                            <td>
                                                {qty}

                                            </td>

                                            <td>
                                                {price}

                                            </td>

                                            <td>
                                                {amount.toFixed(2)}

                                            </td>

                                            <td>
                                                {discount.toFixed(2)}

                                            </td>

                                            <td>

                                                {discounted.toFixed(2)}

                                            </td>

                                            <td className="cqf-vat-cell">
                                                {taxValue > 0 ? (
                                                    <span className="cqf-vat-badge cqf-vat-yes">
                                                        <FiCheck /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="cqf-vat-badge cqf-vat-no">
                                                        <FiX /> No
                                                    </span>
                                                )}
                                            </td>

                                            <td >
                                                {netAmount.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>

                    </div>

                </div>
                {/* ── Totals ───────────────────────────────────────── */}

                <div className="cqf-totals-wrap">

                    <div className="cqf-totals-card">

                        <div className="cqf-totals-row">

                            <span>Sub Total</span>


                            <span className="cqf-info-value">{subtotal.toFixed(2) || "—"}</span>

                        </div>

                        <div className="cqf-totals-row">

                            <span>VAT %</span>
                            <span className="cqf-info-value">{displayedTaxPercent || "—"}</span>

                            

                        </div>

                        <div className="cqf-totals-row">

                            <span>VAT Amount</span>
                            <span className="cqf-info-value">{taxAmount.toFixed(2) || "—"}</span>



                        </div>

                        <div className="cqf-totals-row cqf-totals-net">

                            <span>Total Net Amount</span>
                            <span className="cqf-info-value">{totalAmount.toFixed(2) || "—"}</span>


                        </div>

                    </div>

                </div>



                {/* ── Payment Terms ───────────────────────────────── */}

                <div className="cqf-section">
                    <div className="cqf-section-header">
                        <span className="cqf-section-icon">📝</span>
                        <span className="cqf-section-title">Payment Terms</span>
                    </div>

                    <div className="cqf-field">
                        <label className="cqf-label">Payment Terms</label>


                        <span className="cqf-info-value">{paymentTerms || "—"}</span>
                    </div>
                    <br />
                </div>
                {/* ── Footer ───────────────────────────────────── */}

                <div className="cqf-footer">

                    <button
                        type="button"
                        className="cqf-cancel-btn"
                        onClick={() => closeProformaPopup?.()}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="cqf-save-btn"
                        onClick={handleSave}
                    // disabled={isSaving}
                    >

                        {/* {isSaving && (
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                />
                            )} */}

                        Save Proforma

                    </button>

                </div>

            </div>
        </div>

    );
};

export default ProformaInvoicePopup;