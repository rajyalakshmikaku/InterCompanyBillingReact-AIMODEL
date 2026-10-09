import { AxiosInstance } from "./api";


export const loginUser = async (credentials) => {
  try {
    const response = await AxiosInstance.post("/api/Login/login", credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.data.token) {
      sessionStorage.setItem("token", response.data.token);
    }
    return response.data;
  } catch (error) {
    console.log('error',error)
    let message = "Login failed. Please try again.";
    
    if (error.response) {
      const data = error.response.data;
            const responseStatus = error.response.status;

      // if error is a string or has a message field
      if (typeof data === "string") {
        message = data;
      }
      // ✅ If API sends { message: "..." }
      else if (data?.message) {
        message = data.message;
      }
    }
 else if (error.code === "ERR_NETWORK" || error.request) {
      message = "Unable to connect to server. Please check your internet connection.";
    }
    // ✅ Other unexpected errors
    else {
      message = error.message || message;
    }
    throw new Error(message);
  }
};

export const sendNotificationforForgetPassword = async (email) => {
  try {
    const response = await AxiosInstance.post(
      `/api/Login/sendNotificationforForgetPassword?email=${encodeURIComponent(email)}`,
      {}, // empty POST body
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    debugger;
    
    return response.data;
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
  } catch (error) {
    console.error("Error calling forgot password API:", error);
    throw error;
  }
};

export const checkStatusApi = async () => {
  debugger;
    const response = await AxiosInstance.post("/api/Billing/CheckStatus");
    return response.data;
};
