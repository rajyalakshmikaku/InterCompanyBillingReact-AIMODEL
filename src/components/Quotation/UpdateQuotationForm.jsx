
import React, { useState } from "react";
import { FaTrash, FaMinus, FaBuilding, FaUsers } from "react-icons/fa";
import { FiSearch, FiCheck, FiX, FiPlusSquare, FiPlus } from "react-icons/fi";


const UpdateQuotationForm = ({
  selectedQuotation,
  setSelectedQuotation,
  showInvoiceUpdateForm,
  setShowInvoiceUpdateForm,
  currencies,
  handleEditDetailsChange,
  handleEditAddRow,
  handleEditRemoveRow,
  setShowCustomerPopup,
  handleSearch,
  fetchCustomers,
  setPopupCustomerMode,
  openEditPopup,
  setSelectedRowIndex,
  setPopupMode,
  setShowInventoryPopup,
  handleUpdate,
  isSaving,
  createErrors = {},
  setCreateErrors,
  setShowDiscountPopup,
  setTotalBefore,
  setupdatediscounttype,
  setupdatediscountvalue,
  generatedQuotationId,
  todayDate,
  popuploading,
  setDiscountType,
  setDiscountedTotal,
  setDiscountValue,
  DiscountMode,
  setDiscountMode,
  tax,
  logoFile,
  baseURL,
  handleAddCustomItem,
  categories = [],
  companyList = [],
  quotationTypes = [],
}) => {
  console.log("Selected Quotation:", selectedQuotation);
  console.log("Company Logo:", selectedQuotation?.companyLogo);

  const PAYMENT_TERM_OPTIONS = [
    "Account - Payment due within 30 days",
    "Account - Payment due within 60 days",
    "Payment due prior to collection",
    "50% deposit on order and 50% due prior to collection/delivery",
  ];
  const initialCustom =
    selectedQuotation?.paymentTerms &&
    !PAYMENT_TERM_OPTIONS.includes(selectedQuotation.paymentTerms);

  const [showCustom, setShowCustom] = useState(initialCustom);

  const dropdownValue =
    PAYMENT_TERM_OPTIONS.includes(selectedQuotation?.paymentTerms)
      ? selectedQuotation.paymentTerms
      : showCustom
        ? "__custom__"
        : "";

  const displayedLogoFile = (() => {
    const rawLogo =
      logoFile ||
      selectedQuotation?.companyLogo ||
      selectedQuotation?.CompanyLogo ||
      selectedQuotation?.logoFile ||
      selectedQuotation?.companyLogoFile ||
      "";

    if (typeof rawLogo !== "string") return "";

    const normalizedLogo = rawLogo.split(/[/\\]UploadedFiles[/\\]/).pop();
    return normalizedLogo ? normalizedLogo.split(/[/\\]/).pop() : "";
  })();

  const handleDropdownChange = (e) => {
    const value = e.target.value;

    if (value === "__custom__") {
      setShowCustom(true);

      setSelectedQuotation({
        ...selectedQuotation,
        paymentTerms: "",
      });

      setCreateErrors?.({
        ...(createErrors || {}),
        PaymentTerms: "Payment Terms is required",
      });
    } else {
      setShowCustom(false);

      setSelectedQuotation({
        ...selectedQuotation,
        paymentTerms: value,
      });

      setCreateErrors?.({
        ...(createErrors || {}),
        PaymentTerms: value ? "" : "Payment Terms is required",
      });
    }
  };

  const LOCAL_LOGO = "/images/company-logo.png";
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

  const logoFileName = selectedQuotation?.companyLogo
    ? selectedQuotation.companyLogo.split(/[/\\]/).pop()
    : "";

  const logoUrl = logoFileName
    ? `${baseURL}/UploadedFiles/${logoFileName}`
    : LOCAL_LOGO;

  console.log("Selected Quotation:", selectedQuotation);
  console.log("Company Logo File:", logoFileName);
  console.log("Final Logo URL:", logoUrl);

  // Get VAT status from quotation detail items
  const quotationItems = selectedQuotation?.details || [];

  // At least one Vatable item
  const hasVatableItems = quotationItems.some(
    (row) => Number(row.tax) > 0
  );

  // At least one Non-Vatable item
  const hasNonVatableItems = quotationItems.some(
    (row) => Number(row.tax) === 0
  );

  // Show VAT % if:
  // - at least one item is Vatable
  // - OR both Vatable and Non-Vatable items are selected
  const showVatPercentage = hasVatableItems || (hasVatableItems && hasNonVatableItems);


  return (
    <>
      {(
        <div className="quotation-form-overlay">
          <div className="quotation-form-modal">

            {/* <span
              className="closequotation-btn"
              onClick={() => setShowInvoiceUpdateForm(false)}
            >
              &times;
            </span> */}

            {/* <h2 style={{ color: "green" }}>Update Quotation</h2> */}
            <div className="cqf-header">
              <div className="cqf-header-left">
                <div>
                  <h2 className="cqf-title">Update Quotation</h2>
                  <div className="cqf-meta">
                    <span><strong>ID:</strong> {selectedQuotation?.id || "-"}</span>
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
                  gap: "15px",
                }}
              >
                {displayedLogoFile && (
                  <img
                    src={`${baseURL}/UploadedFiles/${displayedLogoFile}`}
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
                  onClick={() => setShowInvoiceUpdateForm(false)}
                >
                  &times;
                </button>
              </div>
            </div>

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
                  {selectedQuotation?.companyName ? "Change Company" : "Select Company"}
                </button>
              </div>

              {selectedQuotation?.companyName ? (
                <div className="cqf-info-grid">
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Company Name</span>
                    <span className="cqf-info-value">{selectedQuotation.companyName || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">VAT Number</span>
                    <span className="cqf-info-value">{selectedQuotation.vatNumber || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Reg Number</span>
                    <span className="cqf-info-value">{selectedQuotation.registrationNumber || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Address</span>
                    <span className="cqf-info-value">{selectedQuotation.companyAddress || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Website</span>
                    <span className="cqf-info-value">{selectedQuotation.companyWebsite || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Email</span>
                    <span className="cqf-info-value">{selectedQuotation.companyEmail || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Phone</span>
                    <span className="cqf-info-value">{selectedQuotation.companyPhoneNumber || "—"}</span>
                  </div>
                </div>
              ) : (
                <div className="cqf-empty-state">
                  <FaBuilding className="cqf-empty-icon" />
                  <p>No company selected. Click <strong>Select Company</strong> to continue.</p>
                </div>
              )}
            </div>

            <div className="cqf-section">
              <div className="cqf-section-header">
                <span className="cqf-section-icon">🏦</span>
                <span className="cqf-section-title">Banking Details</span>
              </div>

              {(selectedQuotation?.bankName || selectedQuotation?.accountHolderName || selectedQuotation?.bankAccountNumber || selectedQuotation?.branchCode || selectedQuotation?.brannchAddress) ? (
                <div className="cqf-info-grid">
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Bank Name</span>
                    <span className="cqf-info-value">{selectedQuotation.bankName || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Account Holder</span>
                    <span className="cqf-info-value">{selectedQuotation.accountHolderName || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Account Number</span>
                    <span className="cqf-info-value">{selectedQuotation.bankAccountNumber || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Branch Code</span>
                    <span className="cqf-info-value">{selectedQuotation.branchCode || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Branch Address</span>
                    <span className="cqf-info-value">{selectedQuotation.brannchAddress || "—"}</span>
                  </div>
                </div>
              ) : (
                <div className="cqf-empty-state cqf-empty-muted">companyLogo
                  <p>Banking details will appear after a company is selected.</p>
                </div>
              )}
            </div>
            <div className="cqf-section-header">
              <span className="cqf-section-icon"><FaBuilding /></span>
              <span className="cqf-section-title">Quotation Information</span>
              <button
                type="button"
                className="cqf-select-btn"
                onClick={() => {
                  fetchCustomers();
                  setPopupCustomerMode("edit");
                  setShowCustomerPopup(true);
                }}
              >
                <FaUsers style={{ marginRight: "6px" }} />
                Change Receiving Entity
              </button>
            </div>

            {/* <h4 className="quotationsub-title" style={{ color: "green" }}>Quotation Information</h4> */}



            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "4px" }}>
              {/* quotation ID */}

              <div style={{ flex: "1 1 22%" }}>
                <label>Receiving Entity&nbsp;&nbsp;
                  {/* <FiSearch
                    style={{ cursor: "pointer", marginRight: "5px" }}
                    onClick={() => {
                      fetchCustomers(); // API call
                      setPopupCustomerMode("edit"); // edit form mode
                      setShowCustomerPopup(true);
                    }}
                  /> */}
                </label>
                <input
                  type="text"
                  style={{ width: "100%", backgroundColor: "#e9ecef" }}
                  value={selectedQuotation?.receiving || ""}
                  readOnly
                  onChange={(e) =>
                    setSelectedQuotation((prev) => ({
                      ...prev,
                      receivingEntity: e.target.value,
                    }))
                  }
                />

              </div>
              <div style={{ flex: "1 1 22%" }}>
                <label>Due Date</label>

                <input
                  type="date"
                  name="dueDate"
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  value={
                    selectedQuotation?.dueDate
                      ? selectedQuotation.dueDate.split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedQuotation({
                      ...selectedQuotation,
                      dueDate: e.target.value,
                    })
                  }
                />
              </div>
              <div style={{ flex: "1 1 22%" }}>
                <label>Quotation Type</label>

                <select
                  name="quotationType"
                  value={selectedQuotation?.quotationType || ""}
                  onChange={(e) =>
                    setSelectedQuotation({
                      ...selectedQuotation,
                      quotationType: e.target.value,
                    })
                  }
                >
                  <option value="">Select Type</option>

                  {(quotationTypes || []).map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 22%" }}>
              </div>
            </div>

            {/* Quotation Details Example */}
            {(
              <>
                <div className="cqf-section">
                  <div className="cqf-section-header">
                    <span className="cqf-section-icon">📦</span>
                    <span className="cqf-section-title">Quotation Details</span>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button type="button" className="cqf-add-row-btn" onClick={handleEditAddRow}>
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
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>NAME</th>
                          {/* <th>DESCRIPTION</th> */}
                          <th>QUANTITY</th>
                          <th>UNIT RATE EXCL VAT</th>
                          <th>AMOUNT</th>
                          <th>DISCOUNT</th>
                          <th>DISCOUNTED TOTAL</th>
                          <th>VAT</th>
                          <th>NET AMOUNT</th>
                          <th>Actions</th>
                          {/* <th>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                            <FiPlusSquare className="add-row-btn" onClick={handleEditAddRow} />
                            <button
                              type="button"
                              className="cqf-add-row-btn"
                              onClick={() => setShowCustomItemPopup(true)}
                              style={{ padding: "6px 10px", fontSize: "12px", background: "#0d6efd" }}
                            >
                              Add Customized Item
                            </button>
                          </div>
                        </th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedQuotation.details || []).map((row, index) => (
                          <tr key={index}>
                            <td hidden>{row.id}</td>
                            <td className="cqf-item-cell">
                              <div className="cqf-item-name-wrap">
                                {/* Customized rows are typed in the popup, so no inventory pick */}
                                {/* {!row.isCustom && (
                                <FiSearch
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    openEditPopup(index)
                                    setSelectedRowIndex(index);
                                    setPopupMode("edit");
                                  }}
                                />
                              )} */}

                                <textarea
                                  type="text"
                                  value={row.itemName || ""}
                                  onChange={(e) => handleEditDetailsChange(index, "itemName", e.target.value)}
                                  readOnly
                                  className="cqf-item-textarea"
                                  style={{
                                    borderColor: createErrors?.[`itemName${index}`] ? "red" : "undefined"
                                  }}
                                />

                                {createErrors?.[`itemName${index}`] && (
                                  <span className="error-text">{createErrors[`itemName${index}`]}</span>
                                )}
                                {!row.isCustom && (
                                  <button
                                    type="button"
                                    className="cqf-item-pick-btn"
                                    title="Pick item from inventory"
                                    onClick={() => {
                                      openEditPopup(index)
                                      setSelectedRowIndex(index);
                                      setPopupMode("edit");
                                    }}
                                  >
                                    Browse
                                  </button>
                                )}
                              </div>
                            </td>

                            <td>
                              <input
                                type="number"
                                value={row.quantity || ""}
                                min="1"
                                step="1"
                                //onChange={(e) => handleEditDetailsChange(index, "quantity", e.target.value)}

                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (value === "" || /^\d+$/.test(value)) {
                                    handleEditDetailsChange(index, "quantity", value);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ([".", ",", "-", "+", "e", "E"].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                style={{
                                  borderColor: createErrors?.[`quantity_${index}`] ? "red" : "#28a745",
                                  textAlign: "right",
                                  width: "100%",
                                  minWidth: "110px",
                                  backgroundColor: "white",
                                }}
                              />
                              {createErrors?.[`quantity_${index}`] && (
                                <span className="error-text">{createErrors[`quantity_${index}`]}</span>
                              )}
                            </td>

                            <td>
                              <input
                                type="number"
                                min={0}
                                value={row.unitRate || ""}
                                onChange={(e) => handleEditDetailsChange(index, "unitRate", e.target.value)}
                                style={{
                                  borderColor: createErrors?.[`unitRate_${index}`] ? "red" : "#28a745",
                                  textAlign: "right",
                                  width: "100%",
                                  minWidth: "110px",
                                }}
                              />
                              {createErrors?.[`unitRate_${index}`] && (
                                <span className="error-text">{createErrors[`unitRate_${index}`]}</span>
                              )}
                            </td>

                            <td>
                              <input
                                type="number"
                                value={(row.unitRate * row.quantity)}
                                readOnly
                                onChange={(e) => handleEditDetailsChange(index, "amount", e.target.value)}
                                style={{
                                  borderColor: createErrors?.[`amount_${index}`] ? "red" : "#ccc", textAlign: "right",
                                  backgroundColor: "#e9ecef", minWidth: "110px",
                                }}
                              />

                            </td>
                            <td>
                              <input
                                type="number"
                                value={row.discount}
                                onChange={(e) => handleEditDetailsChange(index, "discount", e.target.value)}
                                style={{
                                  width: "100%",
                                  minWidth: "110px",
                                  textAlign: "right",
                                  backgroundColor: "#e9ecef",
                                }}
                                readOnly />
                            </td>

                            <td>
                              <input
                                type="number"
                                style={{ textAlign: "right", backgroundColor: "#e9ecef", minWidth: "110px", }}
                                value={
                                  Number(row.discount) > 0
                                    ? (
                                      (Number(row.quantity) || 0) * (Number(row.unitRate) || 0) -
                                      Number(row.discount)
                                    ).toFixed(2)
                                    : "0.00"
                                }
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="hidden"
                                style={{ textAlign: "center", backgroundColor: "#e9ecef", minWidth: "110px", width: "100%" }}
                                value={row.tax}
                                onChange={(e) => handleEditDetailsChange(index, "tax", e.target.value)}
                                readOnly
                              />

                              {Number(row.tax) !== 0 ? (
                                <FiCheck style={{ color: "green", marginLeft: "46px", fontSize: "20px", textAlign: "center" }} />
                              ) : (
                                <FiX style={{ color: "red", marginLeft: "46px", fontSize: "20px", textAlign: "center" }} />
                              )}
                            </td>

                            <td>

                              <input
                                type="number"
                                style={{ textAlign: "right", backgroundColor: "#e9ecef", minWidth: "110px" }}
                                value={row.netamount}
                                onChange={(e) => handleEditDetailsChange(index, "netamount", e.target.value)}
                                readOnly
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                <button className="remove-row-btn" onClick={() => handleEditRemoveRow(index)}>
                                  <FaTrash />
                                </button>
                                <button
                                  className="discount-row-btn"
                                  disabled={row.quantity <= 0}
                                  style={{
                                    opacity: row.quantity <= 0 ? 0.5 : 1,
                                    cursor: row.quantity <= 0 ? "not-allowed" : "pointer"
                                  }}
                                  onClick={() => {
                                    setShowDiscountPopup(true);
                                    setTotalBefore(row.unitRate * row.quantity);
                                    setSelectedRowIndex(index);
                                    setDiscountMode("edit");
                                    setDiscountType(row.discountType);
                                    setDiscountedTotal(row.discount);
                                    setDiscountValue(row.discountValue);
                                  }}
                                >
                                  <FaMinus />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </>
            )}
            <h4 className="quotationsub-title" style={{ color: "green" }}>Totals</h4>
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <div
                className="totals-section"
                style={{
                  width: "250px",       // reduced width
                  display: "flex",      // make sure children stack vertically
                  flexDirection: "column",
                  gap: "2px"           // space between rows
                }}
              >
                <div>
                  <label>Sub Total</label>
                  <input
                    type="text"
                    style={{ width: "100%", textAlign: "right", backgroundColor: "#e9ecef", }}
                    value={selectedQuotation.subTotal || "0.00"}
                    onChange={(e) =>
                      setSelectedQuotation({
                        ...selectedQuotation,
                        subTotal: e.target.value,
                      })
                    } readOnly

                  />
                </div>
                {showVatPercentage && (
                  <div>
                    <label>VAT %</label>
                    <input
                      type="text" style={{ width: "100%", textAlign: "right", backgroundColor: "#e9ecef" }} value={tax ?? ""} readOnly />
                  </div>
                )}

                <div>
                  <label>VAT Amount</label>
                  <input
                    type="text"
                    style={{ width: "100%", textAlign: "right", backgroundColor: "#e9ecef", }}
                    value={selectedQuotation.taxAmount || "0.00"}

                    onChange={(e) =>
                      setSelectedQuotation({
                        ...selectedQuotation,
                        taxAmount: e.target.value,
                      })
                    } readOnly
                  />
                </div>

                <div>
                  <label>Total Net Amount</label>
                  <input
                    type="text"
                    style={{ width: "100%", textAlign: "right", backgroundColor: "#e9ecef", }}
                    value={selectedQuotation.totalAmount || "0.00"}

                    onChange={(e) =>
                      setSelectedQuotation({
                        ...selectedQuotation,
                        amount: e.target.value,
                      })
                    } readOnly
                  />
                </div>
              </div>
            </div>
            <div className="cqf-section">
              <div className="cqf-section-header">
                <span className="cqf-section-icon"><FaUsers /></span>
                <span className="cqf-section-title">Customer Information</span>

              </div>

              {(selectedQuotation?.customerName || selectedQuotation?.customerEmail || selectedQuotation?.customerPhone || selectedQuotation?.customerAddress) ? (
                <div className="cqf-info-grid">
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Customer Name</span>
                    <span className="cqf-info-value">{selectedQuotation.customerName || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Customer Email</span>
                    <span className="cqf-info-value">{selectedQuotation.customerEmail || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Customer Phone</span>
                    <span className="cqf-info-value">{selectedQuotation.customerPhone || "—"}</span>
                  </div>
                  <div className="cqf-info-item">
                    <span className="cqf-info-label">Customer Address</span>
                    <span className="cqf-info-value">{selectedQuotation.customerAddress || "—"}</span>
                  </div>
                </div>
              ) : (
                <div className="cqf-empty-state cqf-empty-muted">
                  <FaUsers className="cqf-empty-icon" />
                  <p>No customer selected. Click <strong>Select Customer</strong> to continue.</p>
                </div>
              )}
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

                      <label className="cqf-label">Item Code  <span className="required">*</span></label>
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

            <div className="cqf-section-header">
              <span className="cqf-section-icon">📝</span>
              <span className="cqf-section-title">Payment Terms</span>
            </div>

            <div className="cqf-field">
              <label>
                Payment Terms <span className="required">*</span>
              </label>

              <select
                value={dropdownValue}
                onChange={handleDropdownChange}
                className={createErrors?.PaymentTerms ? "input-error" : ""}
              >
                <option value="">-- Select Payment Terms --</option>

                {PAYMENT_TERM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}

                <option value="__custom__">Custom</option>
              </select>

              {showCustom && (
                <textarea
                  placeholder="Enter custom payment terms..."
                  value={selectedQuotation?.paymentTerms || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedQuotation({
                      ...selectedQuotation,
                      paymentTerms: value,
                    });

                    setCreateErrors({
                      ...(createErrors || {}),
                      PaymentTerms: value ? "" : "Payment Terms is required",
                    });
                  }}
                  className={createErrors?.PaymentTerms ? "input-error" : ""}
                />
              )}

              {createErrors?.PaymentTerms && (
                <span className="error-text">
                  {createErrors?.PaymentTerms}
                </span>
              )}
            </div>

            <br />
            {/* Save button */}
            <div className="quotation-actions">
              <button
                className="submit-btn"
                disabled={isSaving}
                onClick={() => handleUpdate(selectedQuotation)}
              >
                {isSaving && (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                )} Update
              </button>
              <button
                type="button"
                className="btn btn-danger btn-lg"
                onClick={() => setShowInvoiceUpdateForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateQuotationForm;