import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { saveForgetPassword } from "../services/ChangePasswordApi";

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ userId, newPassword ,oldPassword}, { rejectWithValue }) => {
    try {
      return await saveForgetPassword(userId, newPassword,oldPassword);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password."
      );
    }
  }
);


const initialState = {
  loading: false,
  success: false,
  error: null,
};

const ChangePasswordSlice = createSlice({
  name: "changePassword",
  initialState,
  reducers: {
    resetChangePasswordState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changePassword.pending, (state) => {
        debugger
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        debugger
        state.loading = false;
        state.success = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        debugger
        state.loading = false;
        state.success = false;
        state.error =
          action.payload || "Something went wrong.";
      });
  },
});

export const { resetChangePasswordState } = ChangePasswordSlice.actions;
export default ChangePasswordSlice.reducer;
