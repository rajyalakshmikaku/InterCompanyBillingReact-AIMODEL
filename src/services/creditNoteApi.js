import { AxiosInstance } from "./api";

export const updateCreditNoteApi = async (payload) => {
    debugger
    console.log("payload",payload)
    try {
        const response = await AxiosInstance.post(
            `/api/Billing/save-credit-note`,   
            payload
        );

        return response.data;

    } catch (error) {
        
        if (error.response) {
            throw new Error(error.response.data?.message || "Update failed");
        } else {
            // Network / other error
            throw new Error("Network error");
        }
    }
};