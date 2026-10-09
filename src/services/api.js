import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import alertify from 'alertifyjs';



//export const baseURL = "https://localhost:7034";
//export const baseURL = "http://154.66.198.237:3001";
export const baseURL = "https://testing.iotsa.tech:3001";
//export const baseURL = "https://durban.iotsa.tech:8069";


export const AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================== Logout helper ===================
export const logout = () => {
  sessionStorage.clear();
  localStorage.removeItem("token");
  alertify.alert('Warning', 'Session expired or unauthorized. Please login again.', () => {
    window.location.href = '/';
  });
};

// =================== Request interceptor ===================
AxiosInstance.interceptors.request.use(
  (config) => {
    
    // if (config.url && config.url.toLowerCase().includes('/')) {
    //   return config;
    // }
  
    const token = sessionStorage.getItem("token");
    console.log('token',token);
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
          logout(); // Token expired → logout
          return Promise.reject(new Error("Token expired"));
        }

        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.warn("Invalid token:", err);
        logout();
        return Promise.reject(err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =================== Response interceptor ===================
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url?.toLowerCase();

      // ⚠️ Skip logout for login API invalid credentials or inactive account
      if (requestUrl && requestUrl.includes('/')) {
        // Let your login page handle invalid credentials normally
        return Promise.reject(error);
      }

      // 🚪 For all other 401s → Logout and redirect
      logout();
    }
   
   
    return Promise.reject(error);
  }
);

// =================== Response interceptor ===================
// =================== Response interceptor ===================
// AxiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {

//     if (error.response?.status === 401) {

//       const requestUrl = error.config?.url?.toLowerCase() || "";

//       // Do NOT logout when login itself returns 401
//       if (requestUrl.includes("/api/login/login")) {
//         return Promise.reject(error);
//       }

//       // Any other 401 → logout immediately
//       console.log("401 Unauthorized - Logging out user");

//       logout();
//     }

//     return Promise.reject(error);
//   }
// );