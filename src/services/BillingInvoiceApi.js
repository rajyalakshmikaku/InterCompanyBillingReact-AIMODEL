import { AxiosInstance } from "./api";

export const getInvoiceRefNo = async () => {
  const response = await AxiosInstance.get("/api/Billing/getInvoiceRefno");
  return response.data;
};


// Save a directly-captured invoice (mirrors saveQuotation payload shape).
// NOTE: endpoint name may need to be confirmed with the backend team.
export const saveInvoice = async (formData) => {
  const response = await AxiosInstance.post("/api/Billing/saveInvoice", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};


export const saveInvoiceForSuperAdmin = async (formData) => {
  const response = await AxiosInstance.post("/api/Quotation/saveInvoice", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateInvoiceForSuperAdmin = async (invoiceData) => {
    const response = await AxiosInstance.post(
        "/api/Quotation/updateInvoice",
        invoiceData,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};