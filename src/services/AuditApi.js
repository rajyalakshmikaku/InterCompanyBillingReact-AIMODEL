import { AxiosInstance } from "./api"; 


export const getusersListforAudit = async () => {
  debugger
  try {
    const response = await AxiosInstance.get("/api/Billing/getusersListforAudit");
     return response.data;
  } catch (error) {
    console.error("Error fetching list:", error);
    throw error;
  }
};

export const getAuditLogsWithFilter = async (user,ScreenName, fromDate, toDate) => {
  debugger;
  try {
    const params = new URLSearchParams();
    if (user) params.append("user", user);
    if (ScreenName) params.append("screenname", ScreenName);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const response = await AxiosInstance.get(`/api/Billing/GetAuditLogsWithFilter?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

export const getAuditLogsWithDetails = async (ScreenName, Id,Refno) => {
  debugger
  try {
    const params = new URLSearchParams();
    if (ScreenName) params.append("Screenname", ScreenName); // backend expects Screenname
    if (Id !== undefined) params.append("Id", Id);           // backend expects Id
    if (Refno !== undefined) params.append("Refno", Refno); // backend expects Refno

    const response = await AxiosInstance.get(
      `/api/Billing/getAuditLogsWithDetails?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};


