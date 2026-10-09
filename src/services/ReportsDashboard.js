import { AxiosInstance } from "./api";

// "All" on the UI means no type filter — the SPs take @Type = NULL.
// Returning undefined keeps axios from serialising the param at all.
const normaliseType = (type) =>
  !type || type === "All" ? undefined : type;

export const GetOutstandingAmounts = async (companyName, type) => {
  const response = await AxiosInstance.get(
    `/api/Reports/outstandingamounts`,
    {
      params: {
        companyName,
        type: normaliseType(type),
      },
    }
  );

  return response.data;
};

// periodDays maps to @PeriodDays on SP_GetCompanyReceivables (0 = all time)
export const getCompanyReceivablesAPI = async (companyName, periodDays = 0, type) => {
  const response = await AxiosInstance.get(
    "/api/Reports/companyreceivables",
    {
      params: {
        companyName,
        periodDays: Number(periodDays) || 0,
        type: normaliseType(type),
      },
    }
  );

  return response.data;
};

export const getOutstandingSummaryAPI = async (companyName, type) => {
  const response = await AxiosInstance.get(
    `/api/Reports/outstandingsummary`,
    {
      params: {
        companyName,
        type: normaliseType(type),
      },
    }
  );

  return response.data;
};

export const getOutstandingInvoiceDetailsAPI = async (companyName, receivingEntity, type) => {
    const response = await AxiosInstance.get(
        `/api/Reports/GetOutstandingInvoiceDetails`,
        {
            params: {
                companyName,
                receivingEntity,
                type: normaliseType(type),
            },
        }
    );

    return response.data;
};
