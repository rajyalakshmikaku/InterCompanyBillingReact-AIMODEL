import { AxiosInstance } from "./api";

// Save master data
export const SaveMaster = async (userdata) => {
  const response = await AxiosInstance.post(
    "/api/Master/SaveMaster",
    userdata,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

// Get master list
export const GetMasterList = async (entityType) => {
  const response = await AxiosInstance.get(`/api/Master/GetMasterList?entityType=${entityType}`);
  return response.data.list; 
};

// Update master data
export const UpdateMaster = async (userdata) => {
  const response = await AxiosInstance.post(
    "/api/Master/UpdateMaster",
    userdata,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

// ✅ Delete master data
export const DeleteMaster = async (userdata) => {
  const response = await AxiosInstance.post(
    "/api/Master/DeleteMaster",
    userdata, 
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};


export const Gethelpinfowithscreen = async (Screenname) => {
  debugger;
  const response = await AxiosInstance.get(`/api/Login/Gethelpinfowithscreen?Screenname=${Screenname}`);
  return response.data.list; 
};