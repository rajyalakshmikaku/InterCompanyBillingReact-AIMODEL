
import { AxiosInstance } from "./api";

// Get users
export const GetUsersList = async () => {
  try {
    const response = await AxiosInstance.get("/api/Master/getuserslist");
    return response.data.list || [];
  } catch (error) {
    console.error("Error fetching users list:", error);
    throw error;
  }
};

//Update user
export const updateuser = async (userData) => {
  try {
    debugger;
    const response = await AxiosInstance.post("/api/Master/updateuser", userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};



// ✅ Get roles list
export const GetRolesList = async () => {
  try {
    const response = await AxiosInstance.get("/api/Master/getroleslist");
    return response.data.list || [];
  } catch (error) {
    console.error("Error fetching roles list:", error);
    throw error;
  }
};

// ✅ Get companies list
export const GetCompaniesList = async () => {
  try {
    const response = await AxiosInstance.get("/api/Master/getcompanieslist");
    return response.data.list || [];
  } catch (error) {
    console.error("Error fetching companies list:", error);
    throw error;
  }
};


// ✅ DELETE user
export const DeleteUserList = async (id) => {
  try {
    const response = await AxiosInstance.post(`/api/Master/DeleteUserList/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error.response?.data || error.message);
    throw error.response?.data || { message: "Error deleting user" };
  }
};


