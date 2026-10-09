import { AxiosInstance } from "./api";


export const getquotationslist = async () => {
  const response = await AxiosInstance.get("/api/Billing/getquotationslist"); 
  return response.data;
};

export const saveInvoicegeneration = async (refNo, templateUrl, unpaidstatus, invoicestatus) => {
    try {
        const response = await AxiosInstance.post(
            "/api/Billing/saveInvoicegeneration",
            null,
            {
                params: {
                    Refno: refNo,
                    templateUrl: templateUrl,
                    UnpaidStatus: unpaidstatus,
                    InvoiceStatus: invoicestatus
                }
            }
        );

        console.log("saveInvoiceGeneration response:", response.data);

        return response.data;
    } catch (error) {
        console.error("saveInvoiceGeneration ERROR:", error);
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("Headers:", error.response?.headers);

        throw error;
    }
};
