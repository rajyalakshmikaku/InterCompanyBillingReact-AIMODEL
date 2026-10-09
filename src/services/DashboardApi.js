import { AxiosInstance } from "./api";


export const getQuotationorInvoicecount = async (companyId = null) => {
  const response = await AxiosInstance.get(
    "/api/Dashboard/GetQuotationOrInvoiceCount",
    {
      params: {
        companyId: companyId
      }
    }
  );

  console.log("Count API Company ID:", companyId);

  return response.data;
};

export const getLatestStatusRecords = async (companyId = null) => {
  const response = await AxiosInstance.get(
    "/api/Dashboard/GetLatestStatusRecords",
    {
      params: {
        companyId: companyId
      }
    }
  );

  console.log("Latest API Company ID:", companyId);

  return response.data;
};


export const getQuotationOrInvoiceDetails = async ({ type, status, companyId }) => {
  const url = `/api/Dashboard/getQuotationorInvoicedetails?type=${type}&status=${status}&companyId=${companyId ?? "null"}`;
  const response = await AxiosInstance.post(url);
  return response.data;
};

export const getDashboardReport = async (fromDate) => {
  
  const response = await AxiosInstance.get(
    `/api/Reports/dashboard`,
    {
      params: { fromDate }
    }
  );

  return response.data;
};

export const getReportDetails = async (type, status, fromDate) => {
  debugger
  const response = await AxiosInstance.get(
    `/api/Reports/details`,
    {
      params: {
        type,
        status,
        fromDate
      }
    }
  );

  return response.data;
};
