import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { updateCreditNoteApi } from "../services/creditNoteApi";

// 🔹 Async thunk
export const updateCreditNote = createAsyncThunk(
    "creditNote/update",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await updateCreditNoteApi(payload);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const creditNoteSlice = createSlice({
    name: "creditNote",
    initialState: {
        loading: false,
        success: false,
        error: null,
        message: null,
    },
    reducers: {
        resetCreditNoteState: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.message = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateCreditNote.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(updateCreditNote.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = action.payload.message || "Updated successfully";
            })
            .addCase(updateCreditNote.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Update failed";
            });
    },
});

export const { resetCreditNoteState } = creditNoteSlice.actions;
export default creditNoteSlice.reducer;