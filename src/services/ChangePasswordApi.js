import { AxiosInstance } from "./api";

export const saveForgetPassword = async (userId, newPassword,oldPassword) => {
  try {
    const response = await AxiosInstance.post(
  `/api/Login/postsavechangepassword?UserId=${Number(userId)}&newpassword=${encodeURIComponent(newPassword)}&oldpassword=${encodeURIComponent(oldPassword)}`
    );
  
    return response.data;
  } catch (error) {
    console.error("Error calling change password API:", error);
    throw error;
  }
};
