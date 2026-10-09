import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GetOutstandingAmounts, getCompanyReceivablesAPI, getOutstandingSummaryAPI, getOutstandingInvoiceDetailsAPI } from "../services/ReportsDashboard";



// Every reports thunk accepts either a plain company name (legacy callers) or
// { companyName, type, ... }. type is "All" | "Quotation" | "Invoice"; "All"
// is dropped at the service layer so the SP receives @Type = NULL.
const readArgs = (arg) =>
    typeof arg === "object" && arg !== null ? arg : { companyName: arg };

// Outstanding Amounts
export const fetchOutstandingAmounts = createAsyncThunk(
    "reports/fetchOutstandingAmounts",
    async (arg, { rejectWithValue }) => {
        const { companyName, type } = readArgs(arg);

        try {
            return await GetOutstandingAmounts(companyName, type);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Outstanding Invoices
// Accepts either a plain company name or { companyName, periodDays, type }
export const fetchCompanyReceivables = createAsyncThunk(
    "reports/fetchCompanyReceivables",
    async (arg, { rejectWithValue }) => {
        const { companyName, periodDays = 0, type } = readArgs(arg);

        try {
            return await getCompanyReceivablesAPI(companyName, periodDays, type);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Outstanding Summary
export const fetchOutstandingSummary = createAsyncThunk(
    "reports/fetchOutstandingSummary",
    async (arg, { rejectWithValue }) => {
        const { companyName, type } = readArgs(arg);

        try {
            return await getOutstandingSummaryAPI(companyName, type);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
// Outstanding Summary Details
export const fetchOutstandingInvoiceDetails = createAsyncThunk(
    "reports/fetchOutstandingInvoiceDetails",
    async ({ companyName, receivingEntity, type }, { rejectWithValue }) => {
        try {
            return await getOutstandingInvoiceDetailsAPI(
                companyName,
                receivingEntity,
                type
            );
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    outstandingAmounts: [],
    companyReceivables: [],
    outstandingInvoiceDetails: [],
    outstandingSummary: null,
    loadingCompanyReceivables: false,
    loadingAmounts: false,
    loadingSummary: false,
    loadingOutstandingInvoiceDetails: false,
    error: null,
};

const ReportsSlice = createSlice({
    name: "reports",
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder

            // Outstanding Amounts
            .addCase(fetchOutstandingAmounts.pending, (state) => {
                state.loadingAmounts = true;
                state.error = null;
            })
            .addCase(fetchOutstandingAmounts.fulfilled, (state, action) => {
                state.loadingAmounts = false;
                state.outstandingAmounts = action.payload;
            })
            // Outstanding Invoice Details
            .addCase(fetchOutstandingInvoiceDetails.pending, (state) => {
                state.loadingOutstandingInvoiceDetails = true;
                state.error = null;
            })
            .addCase(fetchOutstandingInvoiceDetails.fulfilled, (state, action) => {
                state.loadingOutstandingInvoiceDetails = false;
                state.outstandingInvoiceDetails = action.payload.list || [];
            })
            .addCase(fetchOutstandingInvoiceDetails.rejected, (state, action) => {
                state.loadingOutstandingInvoiceDetails = false;
                state.error = action.payload;
            })
            .addCase(fetchOutstandingAmounts.rejected, (state, action) => {
                state.loadingAmounts = false;
                state.error = action.payload;
            })
            // Outstanding Invoices
            .addCase(fetchCompanyReceivables.pending, (state) => {
                state.loadingCompanyReceivables = true;
            })
            .addCase(fetchCompanyReceivables.fulfilled, (state, action) => {
                state.loadingCompanyReceivables = false;
                const payload = action.payload;
                if (Array.isArray(payload)) {
                    state.companyReceivables = payload;
                } else if (payload && Array.isArray(payload.list)) {
                    state.companyReceivables = payload.list;
                } else if (payload && Array.isArray(payload.data)) {
                    state.companyReceivables = payload.data;
                } else {
                    const foundArray = payload
                        ? Object.values(payload).find((v) => Array.isArray(v))
                        : null;
                    state.companyReceivables = foundArray || [];
                }
            })
            .addCase(fetchCompanyReceivables.rejected, (state, action) => {
                state.loadingCompanyReceivables = false;
                state.error = action.payload;
            })
            // Outstanding Summary
            .addCase(fetchOutstandingSummary.pending, (state) => {
                state.loadingSummary = true;
                state.error = null;
            })
            .addCase(fetchOutstandingSummary.fulfilled, (state, action) => {
                console.log("Outstanding Summary API Response:", action.payload);

                state.loadingSummary = false;
                state.outstandingSummary = action.payload;
            })
            .addCase(fetchOutstandingSummary.rejected, (state, action) => {
                state.loadingSummary = false;
                state.error = action.payload;
            });
    },
});

export default ReportsSlice.reducer;