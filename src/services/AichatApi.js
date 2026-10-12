import { AxiosInstance } from "./api";

export const sendChatMessage = async (message) => {
    debugger;
    try {
        console.log("Sending message to AI:", message);

        const response = await AxiosInstance.post(
            "/api/AIModel/chat",
            {
                message: message,
            }
        );

        console.log("AI API response:", response.data);

        return response.data;
    } catch (error) {
        console.error("AI API Error:", error);

        let message2 = "Unable to connect to AIMODEL. Please try again.";

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Response:", error.response.data);

            const data = error.response.data;

            if (error.response.status === 401) {
                message2 = "Please sign in to use this feature.";
            } else if (typeof data === "string" && data) {
                message2 = data;
            } else if (data?.message) {
                message2 = data.message;
            } else if (data?.response) {
                message2 = data.response;
            }
        } else if (error.request) {
            console.error("No response received from API");

            message2 =
                "Unable to connect to the server. Please make sure the API is running.";
        } else {
            message2 = error.message || message2;
        }

        throw new Error(message2);
    }
};