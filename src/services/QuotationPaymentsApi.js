import { AxiosInstance } from "./api";

// These endpoints belong to the controller that exposes record-payment.
export const getQuotationPayments = async (quotationRefNo) => {
  const response = await AxiosInstance.get(
    `/api/Quotation/get-payments/${encodeURIComponent(quotationRefNo)}`,
  );

  const payload = response.data;
  return Array.isArray(payload)
    ? payload
    : payload?.payments || payload?.data || payload?.list || [];
};

export const recordQuotationPayment = async (payment) => {
  console.log("recordQuotationPayment called with payment:", payment);
  const response = await AxiosInstance.post(
    "/api/Quotation/record-payment",
    payment,
  );
  return response.data;
};
