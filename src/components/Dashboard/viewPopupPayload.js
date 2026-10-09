export const normalizeModuleName = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "quotation" || normalized === "qutation" || normalized === "quote" || normalized === "quotations") {
    return "Quotation";
  }

  if (normalized === "invoice" || normalized === "invoiced" || normalized === "invoices") {
    return "Invoice";
  }

  if (normalized === "proforma" || normalized === "proforma invoice generated") {
    return "Proforma";
  }

  return "";
};

const getFirstObject = (value) => {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value.find((item) => item && typeof item === "object") || null;
  }

  return typeof value === "object" ? value : null;
};

const findFirstArray = (...candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }

  return [];
};

export const normalizeViewPopupPayload = (moduleName, response) => {
  const normalizedModule = normalizeModuleName(moduleName);
  const payload = getFirstObject(response) || response;

  const record =
    payload?.quotation ||
    payload?.invoice ||
    payload?.data ||
    payload?.result ||
    payload?.record ||
    payload?.header ||
    payload?.list?.[0]?.header ||
    payload?.list?.[0] ||
    payload;

  const details = findFirstArray(
    payload?.details,
    payload?.quotationDetails,
    payload?.invoiceDetails,
    payload?.lineItems,
    payload?.items,
    payload?.detail,
    payload?.list?.[0]?.details,
    payload?.list?.[0]?.quotationDetails,
    payload?.list?.[0]?.invoiceDetails,
    payload?.list?.[0]?.lineItems,
    payload?.list?.[0]?.items,
    record?.detail,
    record?.quotationDetails,
    record?.invoiceDetails,
    record?.lineItems,
    record?.items,
  );

  const selectedInvoice = record && typeof record === "object" ? { ...record } : null;

  if (selectedInvoice && Array.isArray(details) && details.length) {
    selectedInvoice.detail = details;

    if (normalizedModule === "Quotation" && !selectedInvoice.quotationDetails) {
      selectedInvoice.quotationDetails = details;
    }

    if (normalizedModule === "Invoice" && !selectedInvoice.invoiceDetails) {
      selectedInvoice.invoiceDetails = details;
    }
  }

  return {
    module: normalizedModule || "",
    selectedInvoice,
    details,
  };
};
