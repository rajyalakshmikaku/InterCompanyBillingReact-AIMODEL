import { AxiosInstance } from "./api";


// GET USERS FOR APPROVAL
export const GetUsersListforApproval = async () => {
  try {
    const response = await AxiosInstance.get(
      "/GetUsersListforApproval"
    );

    console.log("Approval API response:", response);
    console.log("Approval API data:", response.data);

    return response.data?.list || [];
  } catch (error) {
    console.error(
      "Error fetching approval users:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// APPROVE USER
export const ApproveUser = async (id, activationlink) => {
  debugger
  try {
    const response = await AxiosInstance.post(
      `/approveUser/${id}`,
      null,
      {
        params: {
          activationlink: activationlink,
        },
      }
    );

    console.log("Approve API response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Approve user error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// DECLINE USER
export const DeclineUser = async (id, reason, registrationUrl) => {
  try {
    const response = await AxiosInstance.post(
      `/declineUser/${id}`,
      {
        registrationUrl,
        reason: reason ?? "",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Decline API response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Decline user error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// MAP USER ROLE & COMPANIES
export const MapUserRoleCompanies = async (id, roleId, companyIds) => {
  try {
    const response = await AxiosInstance.post(
      `/mapUserRoleCompanies/${id}`,
      {
        roleId,
        companyIds,
      }
    );

    console.log("Map role/companies API response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Map role/companies error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// APPROVE USER + MAP ROLE & COMPANIES (single combined call)
export const ApproveAndMapUser = async (id, activationlink, roleId, companyIds) => {
  try {
    const response = await AxiosInstance.post(
      `/approveAndMapUser/${id}`,
      {
        activationLink: activationlink,
        roleId,
        companyIds,
      }
    );

    console.log("Approve & map API response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Approve & map error:",
      error.response?.data || error.message
    );

    throw error;
  }
};
export const updateuser = async (userData) => {
  try {
    debugger;
    const response = await AxiosInstance.post("/UpdateUser", userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};