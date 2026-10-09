import { AxiosInstance } from "./api";


export const getRolesList = async () => {
  const response = await AxiosInstance.get("/getRolesList"); 
  return response.data;
};

export const getScreensList = async () => {
  const response = await AxiosInstance.get("/getScreensList"); 
  return response.data;
};
export const getRolewiseScreensList = async () => {
  const response = await AxiosInstance.get("/getRolewiseScreensList"); 
  return response.data;
};

export const savescreenmappingdata = async (mapdata) => {
  debugger;
   console.log('mapdata',mapdata);
  const response = await AxiosInstance.post(
     "savescreenmappingdata",
     mapdata, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  debugger;
  return response.data;
};
