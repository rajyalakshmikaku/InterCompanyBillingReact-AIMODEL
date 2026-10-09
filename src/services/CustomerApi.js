import { AxiosInstance } from "./api";


export const getCompaniesListwithoutRole = async () => {
  const response = await AxiosInstance.get("/GetReceivingList");
  return response.data;  
};
export const getCompanieswithdeactivestatus = async () => {
  const response = await AxiosInstance.get("/getCompaniesListwithdeactivatestatus");
  console.log(' companies response',response.data);
  return response.data;  
};

export const getCompaniesListforFilter = async () => {
  debugger;
  const response = await AxiosInstance.get("/getCompaniesListforfilter"); 
  return response.data;
};

export const getCustomersList = async () => {
  const response = await AxiosInstance.get("/api/Billing/getCustomersList"); 
  return response.data;
};
export const savecustomerdetails = async (custdata) => {
  debugger;
   console.log('custdata',custdata);
  const response = await AxiosInstance.post(
     "/api/Billing/savecustomerdetails",
     custdata, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  debugger;
  return response.data;
};
export const updatecustomerdetails = async (updatedata) => {
  debugger;
   console.log('custdata',updatedata);
  const response = await AxiosInstance.post(
     "/api/Billing/updatecustomerdetails",
     updatedata, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  debugger;
  return response.data;
};
export const deletecustomerdetails = async (id) => {
  debugger;
   console.log('custdata',id);
   const response = await AxiosInstance.post(`/api/Billing/deletecustomerdetails?Id=${id}`);
  debugger;
  return response.data;
};



