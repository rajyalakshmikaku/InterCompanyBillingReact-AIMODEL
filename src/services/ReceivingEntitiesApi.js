import { AxiosInstance } from "./api"; // Ensure you have AxiosInstance here

export const getEntitiesList = async () => {
  debugger;
  const response = await AxiosInstance.get("/getEntitiesList");
  console.log("response",response);
  return response.data; 
  
};
// Save Entity API
export const saveReceivingEntity = async (entityData) => {
  debugger;
  const formData = new FormData();

  // Append fields
  formData.append("CompanyName", entityData.CompanyName);
  formData.append("VatNumber", entityData.VatNumber);
  formData.append("RegistrationNumber", entityData.RegistrationNumber);
  formData.append("CompanyAddress", entityData.CompanyAddress);
  formData.append("CompanyWebsite", entityData.CompanyWebsite);
  formData.append("CompanyEmail", entityData.CompanyEmail);
  formData.append("CompanyPhoneNumber", entityData.CompanyPhoneNumber);
  formData.append("BankAccountNumber", entityData.BankAccountNumber);
  formData.append("BranchCode", entityData.BranchCode);
  formData.append("BranchAddress", entityData.BranchAddress);  
  formData.append("IFSCCode", entityData.IFSCCode);
  formData.append("AccountHolderName", entityData.AccountHolderName);
  formData.append("BankName", entityData.BankName);

  // Append file if selected
  if (entityData.CompanyLogo) {
    formData.append("CompanyLogo", entityData.CompanyLogo);
  }

  const response = await AxiosInstance.post(
    "/savecompanies",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

// Update Entity API
export const updateReceivingEntity = async (id, payload) => {
  debugger;

  const formData = new FormData();

  // ✅ ALWAYS use route id
  formData.append("Id", id);

  // ✅ Text fields (match DTO names EXACTLY)
  formData.append("CompanyName", payload.companyName ?? "");
  formData.append("VatNumber", payload.vatNumber ?? "");
  formData.append("RegistrationNumber", payload.registrationNumber ?? "");
  formData.append("CompanyAddress", payload.companyAddress ?? "");
  formData.append("CompanyWebsite", payload.companyWebsite ?? "");
  formData.append("CompanyEmail", payload.companyEmail ?? "");
  formData.append("CompanyPhoneNumber", payload.companyPhoneNumber ?? "");
  formData.append("BankAccountNumber", payload.bankAccountNumber ?? "");
  formData.append("BranchCode", payload.branchCode ?? "");

  // ✅ SPELLING MUST MATCH DTO
  formData.append("BranchAddress", payload.branchAddress ?? "");

  formData.append("IFSCCode", payload.ifscCode ?? "");
  formData.append("AccountHolderName", payload.accountHolderName ?? "");
  formData.append("BankName", payload.bankName ?? "");
  formData.append("Status", payload.Status ?? "");

  // ✅ File (parameter name must match API)
  if (payload.companyLogo instanceof File) {
    formData.append("companyLogo", payload.companyLogo);
  }

  const response = await AxiosInstance.post(
    `/updatecompanies/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};



 // Delete Entity API
export const deleteReceivingEntity = async (id) => {
  debugger;
  const response = await AxiosInstance.post(`/deletecompanies/${id}`);
  return response.data;
};
export const GetRejectedQuotationList = async ({ type, status } = {}) => {
  debugger;

  const response = await AxiosInstance.get(
    "/GetRejectedQuotationInvoiceList",
    {
      params: {
        type,
        status,
      },
    }
  );

  return response.data;
};