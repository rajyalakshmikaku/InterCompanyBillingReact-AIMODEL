import { AxiosInstance } from "./api";

export const getActiveURL = async () => {
  const response = await AxiosInstance.get("/api/Login/getActiveURL"); 
  debugger;
  return response.data;
};

export const getRolesList = async () => {
  const response = await AxiosInstance.get("/getRolesList"); 
  return response.data;
};
export const getRolesListforFilter = async () => {
  const response = await AxiosInstance.get("/getRolesListforFilter"); 
  return response.data;
};

export const getDepartmentList = async () => {
  const response = await AxiosInstance.get("/getDepartmentList"); 
  return response.data;
};

export const getReceivingList = async () => {
  const response = await AxiosInstance.get("/getReceivingList");
  return response.data;  
};

export const saveRegistration = async (userdata) => {
  debugger;
   console.log('userdata',userdata);
  const response = await AxiosInstance.post(
     "saveregistration",
     userdata, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  debugger;
  return response.data;
};
