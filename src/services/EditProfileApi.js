import { AxiosInstance } from "./api";


export const getRolesList = async () => {
  const response = await AxiosInstance.get("/getRolesList"); 
  return response.data;
};

export const getReceivingList = async () => {
  const response = await AxiosInstance.get("/getReceivingList");
  return response.data;  
};

export const getUserDetailswithEmail = async (email) => {
  debugger;
  try {
    const response = await AxiosInstance.get(
  `/api/Login/getUserDetailswithEmail?email=${encodeURIComponent(email)}`,
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);

    return response.data;
  } catch (error) {
    console.error("Error calling forgot password API:", error);
    throw error;
  }
};

export const EditProfilewithEmail = async (userdata) => {
  try {
    console.log("Sending payload:", userdata);
    const response = await AxiosInstance.put(
      "/api/Login/EditProfilewithEmail",
      userdata,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Axios PUT error:", error.response || error);
    throw error;
  }
};


