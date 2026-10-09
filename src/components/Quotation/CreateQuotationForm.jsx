import React, { useState } from "react";
import { FaTrash, FaTag, FaBuilding, FaUsers } from "react-icons/fa";
import { FiCheck, FiX, FiPlus } from "react-icons/fi";



const PAYMENT_TERM_OPTIONS = [
  "Account - Payment due within 30 days",
  "Account - Payment due within 60 days",
  "Payment due prior to collection",
  "50% deposit on order and 50% due prior to collection/delivery",
];

const PaymentTermsSection = ({ PaymentTerms, setPaymentTerms, createErrors, setCreateErrors }) => {
  const isCustom = PaymentTerms !== "" && !PAYMENT_TERM_OPTIONS.includes(PaymentTerms);
  const [showCustom, setShowCustom] = useState(isCustom);

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setShowCustom(true);
      setPaymentTerms("");
      setCreateErrors({ ...createErrors, PaymentTerms: "Payment Terms is required" });
    } else {
      setShowCustom(false);
      setPaymentTerms(val);
      setCreateErrors({ ...createErrors, PaymentTerms: val === "" ? "Payment Terms is required" : "" });
    }
  };

  const dropdownValue = showCustom ? "__custom__" : (PAYMENT_TERM_OPTIONS.includes(PaymentTerms) ? PaymentTerms : "");

  return (
    <div className="cqf-section">
      <div className="cqf-section-header">
        <span className="cqf-section-icon">📝</span>
        <span className="cqf-section-title">Payment Terms</span>
      </div>
      <div className="cqf-field cqf-payment-terms-field">
        <label className="cqf-label">Payment Terms <span className="required">*</span></label>
        <select
          value={dropdownValue}
          onChange={handleDropdownChange}
          className={createErrors.PaymentTerms && !showCustom ? "input-error" : ""}
        >
          <option value="">— Select a payment term —</option>
          {PAYMENT_TERM_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option value="__custom__">Custom — type your own…</option>
        </select>

        {showCustom && (
          <textarea
            className={`cqf-payment-custom-input ${createErrors.PaymentTerms ? "input-error" : ""}`}
            placeholder="Type your custom payment terms…"
            value={PaymentTerms}
            onChange={(e) => {
              const val = e.target.value;
              setPaymentTerms(val);
              setCreateErrors({ ...createErrors, PaymentTerms: val.trim() === "" ? "Payment Terms is required" : "" });
            }}
          />
        )}

        {createErrors.PaymentTerms && <p className="error-message">{createErrors.PaymentTerms}</p>}
      </div>
    </div>
  );
};

const CreateQuotationForm = ({

  clearForm, logoFile,

  baseURL, CompanyName, setCompanyName, VatNumber, CompanyId, setCompanyId,
  setVatNumber,
  RegistrationNumber,
  setRegistrationNumber,
  CompanyAddress,
  setCompanyAddress,
  CompanyWebsite,
  setCompanyWebsite,
  CompanyEmail,
  setCompanyEmail,
  CompanyPhoneNumber,
  setCompanyPhoneNumber,
  BankAccountNumber,
  setBankAccountNumber,
  BranchCode,
  setBranchCode,
  BrannchAddress,
  setBrannchAddress,
  IFSCCode,
  setIFSCCode,
  generatedQuotationId,
  todayDate,
  receivingEntity,
  setReceivingEntity,
  dueDate,
  setDueDate,
  quotationType,
  setQuotationType,
  quotationTypes = [],
  quotationDetails,
  addRow,
  removeRow,
  handleDetailsChange,
  createErrors,
  setCreateErrors,
  CustomerName,
  setCustomerName,
  CustomerPhone,
  setCustomerPhone,
  CustomerEmail,
  setCustomerEmail,
  CustomerAddress,
  setCustomerAddress,
  PaymentTerms,
  setPaymentTerms,
  allowAlphaNumeric,
  isAlphaNumeric,
  computedSubtotal,
  computedTaxAmount,
  computedTotalAmount,
  setSubTotal,
  setTaxAmount,
  setTotalAmount,
  handleSearch,
  fetchCustomers,
  handleSave,
  isSaving,
  openCreatePopup,
  setSelectedRowIndex,
  setShowDiscountPopup,
  setTotalBefore,
  setShowInvoiceForm,
  closeInvoiceForm,
  DiscountMode,
  setDiscountMode,
  setDiscountType,
  setDiscountedTotal,
  setDiscountValue,
  tax,
  BankName,
  setBankName,
  AccountHolderName,
  setAccountHolderName,
  handleAddCustomItem,
  categories = [],
  companyList = [],
}) => {

  const [showCustomItemPopup, setShowCustomItemPopup] = useState(false);
  const [customItem, setCustomItem] = useState({
    Category: "",
    ItemName: "",
    ItemCode: "",
    Description: "",
    CompanyId: "",
    PriceDisplay: "",
    Price: "",
    UnitOfMeasure: "",
    VatableStatus: false,
    TaxRate: tax || 0,
  });
  const [customErrors, setCustomErrors] = useState({});
  const [isSavingCustomItem, setIsSavingCustomItem] = useState(false);

  const resetCustomItemForm = () => {
    setCustomItem({
      Category: "",
      ItemName: "",
      ItemCode: "",
      Description: "",
      CompanyId: "",
      PriceDisplay: "",
      Price: "",
      UnitOfMeasure: "",
      VatableStatus: false,
      TaxRate: tax || 0,
    });
    setCustomErrors({});
  };

  const handleCustomItemChange = (field, value) => {
    setCustomItem((prev) => ({ ...prev, [field]: value }));
    setCustomErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateCustomItem = () => {
    const errors = {};

    if (!customItem.Category?.trim()) errors.Category = "Category is required";
    if (!customItem.ItemName?.trim()) errors.ItemName = "Item Name is required";
    if (!customItem.ItemCode?.trim()) errors.ItemCode = "Item Code is required";
    if (!customItem.Description?.trim()) errors.Description = "Description is required";
    if (!customItem.CompanyId) errors.CompanyId = "Company Name is required";
    if (!customItem.UnitOfMeasure?.trim()) errors.UnitOfMeasure = "Unit of Measure is required";

    const price = Number(customItem.PriceDisplay);
    if (!customItem.PriceDisplay || Number.isNaN(price) || price <= 0) {
      errors.PriceDisplay = "Valid price is required";
    }

    setCustomErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const closeCustomItemPopup = () => {
    if (isSavingCustomItem) return;
    setShowCustomItemPopup(false);
    resetCustomItemForm();
  };

  const handleCustomItemSave = async () => {
    if (isSavingCustomItem) return;
    if (!validateCustomItem()) return;

    const payload = {
      ...customItem,
      Price: Number(customItem.PriceDisplay) || 0,
      PriceDisplay: customItem.PriceDisplay,
      TaxRate: customItem.VatableStatus ? (customItem.TaxRate || tax || 0) : 0,
    };

    if (typeof handleAddCustomItem !== "function") return;

    try {
      setIsSavingCustomItem(true);
      const saved = await handleAddCustomItem(payload);
      // Keep the popup open (with the entered values) when the save failed.
      if (saved === false) return;

      setShowCustomItemPopup(false);
      resetCustomItemForm();
    } finally {
      setIsSavingCustomItem(false);
    }
  };


  // Check whether any selected item is Vatable
  const hasVatableItems = quotationDetails?.some(
    (row) => Number(row.tax) > 0
  );

  // Check whether any selected item is Non-Vatable
  const hasNonVatableItems = quotationDetails?.some(
    (row) => Number(row.tax) === 0
  );

  // Show VAT % field when:
  // 1. At least one Vatable item exists
  // 2. Even if both Vatable and Non-Vatable items are selected
  const showVatPercentage = hasVatableItems;



  return (
    <>
      <div className="quotation-form-overlay">
        <div className="quotation-form-modal">


          <div className="cqf-header">
            <div className="cqf-header-left">
              <div>
                <h2 className="cqf-title">Generate Quotation</h2>
                <div className="cqf-meta">
                  <span><strong>ID:</strong> Auto Generated on Submit</span>
                  <span className="cqf-meta-sep">•</span>
                  <span><strong>Date:</strong> {todayDate}</span>
                </div>
              </div>
            </div>

            <div
              className="cqf-header-right"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px"
              }}
            >
              {logoFile && (
                <img
                  src={`${baseURL}/UploadedFiles/${logoFile}`}
                  alt="Company Logo"
                  className="company-logo-header"
                  style={{
                    maxWidth: "120px",
                    maxHeight: "60px",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain"
                  }}
                />
              )}

              <button
                className="cqf-close-btn"
                onClick={() => closeInvoiceForm(false)}
                title="Close"
                style={{
                  margin: 0,
                  alignSelf: "center"
                }}
              >
                &times;
              </button>
            </div>
          </div>
          {/* ── Step 1: Company ── */}
          <div className="cqf-section">
            <div className="cqf-section-header">
              <span className="cqf-section-icon"><FaBuilding /></span>
              <span className="cqf-section-title">Company Information</span>
              <button
                type="button"
                className="cqf-select-btn"
                onClick={() => handleSearch()}
              >
                <FaBuilding style={{ marginRight: "6px" }} />
                {CompanyName ? "Change Company" : "Select Company"}
              </button>
            </div>

            {CompanyName ? (
              <div className="cqf-info-grid">
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Company Name</span>
                  <span className="cqf-info-value">{CompanyName}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">VAT Number</span>
                  <span className="cqf-info-value">{VatNumber || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Reg Number</span>
                  <span className="cqf-info-value">{RegistrationNumber || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Email</span>
                  <span className="cqf-info-value">{CompanyEmail || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Phone</span>
                  <span className="cqf-info-value">{CompanyPhoneNumber || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Address</span>
                  <span className="cqf-info-value">{CompanyAddress || "—"}</span>
                </div>
              </div>
            ) : (
              <div className={`cqf-empty-state ${createErrors.CompanyName ? "cqf-empty-error" : ""}`}>
                <FaBuilding className="cqf-empty-icon" />
                <p>No company selected. Click <strong>Select Company</strong> to get started.</p>
              </div>
            )}
            {createErrors.CompanyName && <p className="error-message">{createErrors.CompanyName}</p>}
          </div>

          {/* ── Step 2: Banking Details ── */}
          <div className="cqf-section">
            <div className="cqf-section-header">
              <span className="cqf-section-icon">🏦</span>
              <span className="cqf-section-title">Banking Details</span>
            </div>
            {CompanyName ? (
              <div className="cqf-info-grid">
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Bank Name</span>
                  <span className="cqf-info-value">{BankName || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Account Holder</span>
                  <span className="cqf-info-value">{AccountHolderName || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Account Number</span>
                  <span className="cqf-info-value">{BankAccountNumber || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Branch Code</span>
                  <span className="cqf-info-value">{BranchCode || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Branch Address</span>
                  <span className="cqf-info-value">{BrannchAddress || "—"}</span>
                </div>
              </div>
            ) : (
              <div className="cqf-empty-state cqf-empty-muted">
                <p>Banking details will appear after a company is selected.</p>
              </div>
            )}
          </div>

          {/* ── Step 3: Quotation Info ── */}
          <div className="cqf-section">
            <div className="cqf-section-header">
              <span className="cqf-section-icon">📋</span>
              <span className="cqf-section-title">Quotation Information</span>
              <button
                type="button"
                className="cqf-select-btn"
                onClick={() => fetchCustomers()}
              >
                <FaUsers style={{ marginRight: "6px" }} />
                {receivingEntity ? "Change Receiving Entity" : "Select Receiving Entity"}
              </button>
            </div>

            {receivingEntity ? (
              <div className="cqf-info-grid cqf-receiving-grid">
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Receiving Entity</span>
                  <span className="cqf-info-value">{receivingEntity}</span>
                </div>
              </div>
            ) : (
              <div className={`cqf-empty-state ${createErrors.receivingEntity ? "cqf-empty-error" : "cqf-empty-muted"}`}>
                <p>No receiving entity selected. Click <strong>Select Receiving Entity</strong> to continue.</p>
              </div>
            )}
            {createErrors.receivingEntity && <p className="error-message" style={{ padding: "0 14px 8px" }}>{createErrors.receivingEntity}</p>}

            <div className="cqf-fields-row">
              <div className="cqf-field">
                <label className="cqf-label">
                  Due Date <span className="required">*</span>
                </label>

                <input
                  type="date"
                  className={createErrors.dueDate ? "input-error" : ""}
                  value={dueDate}
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDueDate(value);
                    setCreateErrors({
                      ...createErrors,
                      dueDate: value ? "" : "Due Date is required",
                    });
                  }}
                />

                {/* <input
                  type="date"
                  className={createErrors.dueDate ? "input-error" : ""}
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDueDate(value);
                    setCreateErrors({
                      ...createErrors,
                      dueDate: value ? "" : "Due Date is required",
                    });
                  }}
                /> */}

                {createErrors.dueDate && (
                  <p className="error-message">{createErrors.dueDate}</p>
                )}
              </div>

              <div className="cqf-field">
                <label className="cqf-label">Quotation Type <span className="required">*</span></label>
                <select
                  className={createErrors.quotationType ? "input-error" : ""}
                  value={quotationType || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuotationType(value);
                    setCreateErrors({
                      ...createErrors,
                      quotationType: value.trim() === "" ? "Quotation Type is required" : "",
                    });
                  }}
                >
                  <option value="">Select Quotation Type</option>
                  {quotationTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {createErrors.quotationType && <p className="error-message">{createErrors.quotationType}</p>}
              </div>
            </div>
          </div>

          {/* ── Step 4: Quotation Line Items ── */}
          <div className="cqf-section">
            <div className="cqf-section-header">
              <span className="cqf-section-icon">📦</span>
              <span className="cqf-section-title">Quotation Details</span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" className="cqf-add-row-btn" onClick={addRow}>
                  <FiPlus style={{ marginRight: "5px" }} />
                  Add Item
                </button>
                <button
                  type="button"
                  className="cqf-add-row-btn"
                  onClick={() => setShowCustomItemPopup(true)}
                  style={{ background: "#0d6efd" }}
                >
                  <FiPlus style={{ marginRight: "5px" }} />
                  Add Customized Item
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table cqf-details-table">
                <thead>
                  <tr>
                    <th hidden>ID</th>
                    <th>Item / Service</th>
                    <th>Qty</th>
                    <th>Unit Rate (excl. VAT)</th>
                    <th>Amount</th>
                    <th>Discount</th>
                    <th>Discounted Total</th>
                    <th>VAT</th>
                    <th>Net Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationDetails.map((row, index) => (
                    <tr key={index}>
                      <td hidden>{row.id}</td>

                      {/* Item Name */}
                      <td className="cqf-item-cell">
                        <div className="cqf-item-name-wrap">
                          <textarea
                            value={row.itemName}
                            onChange={(e) => handleDetailsChange(index, "itemName", e.target.value)}
                            readOnly
                            placeholder="Select item…"
                            className="cqf-item-textarea"
                            style={{ borderColor: createErrors[`itemName${index}`] ? "red" : undefined }}
                          />
                          {/* Customized rows are typed in the popup, so no inventory pick */}
                          {!row.isCustom && (
                            <button
                              type="button"
                              className="cqf-item-pick-btn"
                              title="Pick item from inventory"
                              onClick={() => {
                                setSelectedRowIndex(index);
                                openCreatePopup(index);
                              }}
                            >
                              Browse
                            </button>
                          )}
                        </div>
                        {createErrors[`itemName${index}`] && (
                          <span className="error-text">{createErrors[`itemName${index}`]}</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td>
                        <input
                          type="number"
                          value={row.quantity}
                          min="1" sterp="1"
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === "" || /^\d+$/.test(value)) {
                              handleDetailsChange(index, "quantity", value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if ([".", ",", "-", "+", "e", "E"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className="cqf-num-input"
                          style={{ borderColor: createErrors[`quantity_${index}`] ? "red" : undefined }}
                        />
                        {createErrors[`quantity_${index}`] && (
                          <span className="error-text">{createErrors[`quantity_${index}`]}</span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={row.price}
                          onChange={(e) => handleDetailsChange(index, "price", e.target.value)}
                          className="cqf-num-input"
                          style={{ borderColor: createErrors[`price_${index}`] ? "red" : undefined }}
                        />
                        {createErrors[`price_${index}`] && (
                          <span className="error-text">{createErrors[`price_${index}`]}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td>
                        <input
                          type="number"
                          value={(row.price * row.quantity)}
                          readOnly
                          className="cqf-num-input cqf-readonly"
                          onChange={(e) => handleDetailsChange(index, "amount", e.target.value)}
                        />
                      </td>

                      {/* Discount */}
                      <td>
                        <input
                          type="number"
                          value={row.discount}
                          readOnly
                          className="cqf-num-input cqf-readonly"
                          onChange={(e) => handleDetailsChange(index, "discount", e.target.value)}
                        />
                      </td>

                      {/* Discounted Total */}
                      <td>
                        <input
                          type="number"
                          value={
                            Number(row.discount) > 0
                              ? (
                                (Number(row.price) || 0) * (Number(row.quantity) || 0) -
                                Number(row.discount)
                              ).toFixed(2)
                              : "0.00"
                          }
                          readOnly
                          className="cqf-num-input cqf-readonly"
                         
                        />
                      </td>

                      {/* VAT */}
                      <td className="cqf-vat-cell">
                        <input
                          type="hidden"
                          value={row.tax}
                          onChange={(e) => handleDetailsChange(index, "tax", e.target.value)}
                          readOnly
                        />
                        {Number(row.tax) !== 0 ? (
                          <span className="cqf-vat-badge cqf-vat-yes"><FiCheck /> Yes</span>
                        ) : (
                          <span className="cqf-vat-badge cqf-vat-no"><FiX /> No</span>
                        )}
                      </td>

                      {/* Net Amount */}
                      <td>
                        <input
                          type="number"
                          value={
                            row.quantity > 0
                              ? ((row.amount - row.discount) + (row.amount - row.discount) * row.tax / 100).toFixed(2)
                              : 0
                          }
                          readOnly
                          className="cqf-num-input cqf-readonly"
                          onChange={(e) => handleDetailsChange(index, "netamount", e.target.value)}
                        />
                      </td>

                      {/* Actions */}
                      <td className="cqf-actions-cell">
                        <div>
                          <button
                            type="button"
                            className="cqf-discount-btn"
                            disabled={row.quantity <= 0}
                            title={row.quantity <= 0 ? "Enter a quantity first to apply a discount" : "Apply Discount"}
                            onClick={() => {
                              setShowDiscountPopup(true);
                              setTotalBefore(row.price * row.quantity);
                              setSelectedRowIndex(index);
                              setDiscountMode("create");
                              setDiscountType(row.discountType);
                              setDiscountedTotal(row.discount);
                              setDiscountValue(row.discountValue);
                            }}
                          >
                            <FaTag style={{ marginRight: "4px" }} />
                            Discount
                          </button>
                          <button
                            type="button"
                            className="cqf-remove-btn"
                            onClick={() => removeRow(index)}
                            title="Remove line item"
                          >
                            <FaTrash style={{ marginRight: "4px" }} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Totals ── */}
          <div className="cqf-totals-wrap">
            <div className="cqf-totals-card">
              <div className="cqf-totals-row">
                <span>Sub Total</span>
                <input type="text" className="cqf-total-input" value={computedSubtotal.toFixed(2)} readOnly onChange={(e) => setSubTotal(e.target.value)} />
              </div>
              {showVatPercentage && (
                <div className="cqf-totals-row">
                  <span>VAT %</span>
                  <input type="text" className="cqf-total-input" value={tax ?? ""} readOnly />
                </div>
              )}
              <div className="cqf-totals-row">
                <span>VAT Amount</span>
                <input type="text" className="cqf-total-input" value={computedTaxAmount.toFixed(2)} readOnly onChange={(e) => setTaxAmount(e.target.value)} />
              </div>
              <div className="cqf-totals-row cqf-totals-net">
                <span>Total Net Amount</span>
                <input type="text" className="cqf-total-input" value={computedTotalAmount.toFixed(2)} readOnly onChange={(e) => setTotalAmount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Step 5: Customer Information ── */}
          <div className="cqf-section">
            <div className="cqf-section-header">
              <span className="cqf-section-icon"><FaUsers /></span>
              <span className="cqf-section-title">Customer Information</span>
            </div>

            {(CustomerName || CustomerPhone || CustomerEmail || CustomerAddress) ? (
              <div className="cqf-info-grid">
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Customer Name</span>
                  <span className="cqf-info-value">{CustomerName || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Customer Phone</span>
                  <span className="cqf-info-value">{CustomerPhone || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Customer Email</span>
                  <span className="cqf-info-value">{CustomerEmail || "—"}</span>
                </div>
                <div className="cqf-info-item">
                  <span className="cqf-info-label">Customer Address</span>
                  <span className="cqf-info-value">{CustomerAddress || "—"}</span>
                </div>
              </div>
            ) : (
              <div className="cqf-empty-state cqf-empty-muted">
                <FaUsers className="cqf-empty-icon" />
                <p>Customer details will appear once a customer is selected.</p>
              </div>
            )}

            {createErrors.CustomerName && <p className="error-message" style={{ margin: "0 14px 14px" }}>{createErrors.CustomerName}</p>}
            {createErrors.CustomerPhone && <p className="error-message" style={{ margin: "0 14px 14px" }}>{createErrors.CustomerPhone}</p>}
            {createErrors.CustomerEmail && <p className="error-message" style={{ margin: "0 14px 14px" }}>{createErrors.CustomerEmail}</p>}
            {createErrors.CustomerAddress && <p className="error-message" style={{ margin: "0 14px 14px" }}>{createErrors.CustomerAddress}</p>}
          </div>

          {showCustomItemPopup && (
            <div className="cqf-mini-overlay">
              <div className="cqf-mini-modal">
                <div className="cqf-mini-header">
                  <h3 className="cqf-mini-title">Create Customized Item</h3>
                  <button
                    type="button"
                    className="cqf-close-btn"
                    onClick={closeCustomItemPopup}
                    disabled={isSavingCustomItem}
                    title="Close"
                  >
                    &times;
                  </button>
                </div>

                <div className="cqf-mini-grid">
                  <div className="cqf-mini-field">
                    <label className="cqf-label">Category <span className="required">*</span></label>
                    <select
                      value={customItem.Category}
                      onChange={(e) => handleCustomItemChange("Category", e.target.value)}
                      className={customErrors.Category ? "input-error" : ""}
                    >
                      <option value="">Select Category</option>
                      {(categories || []).map((category) => {
                        const label = category?.name || category?.Category || category?.categoryName || category?.category || "";
                        const value = category?.name || category?.Category || category?.categoryName || category?.category || "";
                        return label ? <option key={value} value={value}>{label}</option> : null;
                      })}
                    </select>
                    {customErrors.Category && <p className="error-message">{customErrors.Category}</p>}
                  </div>



                  <div className="cqf-mini-field">
                    <label className="cqf-label">Item Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={customItem.ItemName}
                      onChange={(e) => handleCustomItemChange("ItemName", e.target.value)}
                      className={customErrors.ItemName ? "input-error" : ""}
                    />
                    {customErrors.ItemName && <p className="error-message">{customErrors.ItemName}</p>}
                  </div>

                  <div className="cqf-mini-field">
                    <label className="cqf-label">Item Code <span className="required">*</span></label>
                    <input
                      type="text"
                      value={customItem.ItemCode}
                      onChange={(e) => handleCustomItemChange("ItemCode", e.target.value)}
                    />
                    {customErrors.ItemCode && <p className="error-message">{customErrors.ItemCode}</p>}
                  </div>

                  <div className="cqf-mini-field">
                    <label className="cqf-label">Company Name <span className="required">*</span></label>
                    <select
                      value={customItem.CompanyId}
                      onChange={(e) => handleCustomItemChange("CompanyId", e.target.value)}
                      className={customErrors.CompanyId ? "input-error" : ""}
                    >
                      <option value="">Select Company</option>
                      {(companyList || []).map((company) => (
                        <option key={company.id || company.companyId} value={company.id || company.companyId}>
                          {company.companyName || company.name || company.CompanyName || "Unnamed Company"}
                        </option>
                      ))}
                    </select>
                    {customErrors.CompanyId && <p className="error-message">{customErrors.CompanyId}</p>}
                  </div>

                  <div className="cqf-mini-field cqf-mini-full">
                    <label className="cqf-label">Description <span className="required">*</span></label>
                    <textarea
                      value={customItem.Description}
                      onChange={(e) => handleCustomItemChange("Description", e.target.value)}
                      className={customErrors.Description ? "input-error" : ""}
                    />
                    {customErrors.Description && <p className="error-message">{customErrors.Description}</p>}
                  </div>

                  <div className="cqf-mini-field">
                    <label className="cqf-label">Price excl VAT <span className="required">*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customItem.PriceDisplay}
                      onChange={(e) => handleCustomItemChange("PriceDisplay", e.target.value)}
                      className={customErrors.PriceDisplay ? "input-error" : ""}
                    />
                    {customErrors.PriceDisplay && <p className="error-message">{customErrors.PriceDisplay}</p>}
                  </div>

                  <div className="cqf-mini-field">
                    <label className="cqf-label">Unit Of Measure <span className="required">*</span></label>
                    <select
                      value={customItem.UnitOfMeasure}
                      onChange={(e) => handleCustomItemChange("UnitOfMeasure", e.target.value)}
                      className={customErrors.UnitOfMeasure ? "input-error" : ""}
                    >
                      <option value="">Select UOM</option>
                      <option value="Hour">Hour</option>
                      <option value="Unit">Unit</option>
                    </select>
                    {customErrors.UnitOfMeasure && <p className="error-message">{customErrors.UnitOfMeasure}</p>}
                  </div>

                  <div className="cqf-mini-field cqf-mini-full">
                    <label className="cqf-mini-check">
                      <input
                        type="checkbox"
                        checked={customItem.VatableStatus}
                        onChange={(e) => handleCustomItemChange("VatableStatus", e.target.checked)}
                      />
                      Is Vatable
                    </label>
                  </div>
                </div>

                <div className="cqf-mini-footer">
                  <button
                    type="button"
                    className="cqf-cancel-btn"
                    onClick={closeCustomItemPopup}
                    disabled={isSavingCustomItem}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="cqf-save-btn"
                    onClick={handleCustomItemSave}
                    disabled={isSavingCustomItem}
                  >
                    {isSavingCustomItem && (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    )}
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Payment Terms ── */}
          <PaymentTermsSection
            PaymentTerms={PaymentTerms}
            setPaymentTerms={setPaymentTerms}
            createErrors={createErrors}
            setCreateErrors={setCreateErrors}
          />

          {/* ── Footer Actions ── */}
          <div className="cqf-footer">
            <button
              type="button"
              className="cqf-cancel-btn"
              onClick={() => closeInvoiceForm()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cqf-save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              )}
              Save Quotation
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default CreateQuotationForm;
