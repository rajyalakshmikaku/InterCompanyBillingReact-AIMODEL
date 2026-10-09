import { jwtDecode } from 'jwt-decode';

debugger;
export const isTokenValid = (token) => {
    
  try {
    const decoded = jwtDecode(token); 
    const currentTime = Date.now() / 1000;
    return decoded.exp && decoded.exp > currentTime;
  } catch (error) {
    console.error('Invalid token format:', error);
    return false;
  }
};
