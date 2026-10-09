import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  GetUsersListforApproval,
  ApproveUser,
  DeclineUser,
  MapUserRoleCompanies,
  ApproveAndMapUser,
  updateuser
} from "../services/UserVerificationApi";


// ===============================
// GET USERS
// ===============================

export const getUsersListforApproval = createAsyncThunk(
  "User/getUsersListforApproval",
  async (_, { rejectWithValue }) => {
    try {
      const data = await GetUsersListforApproval();

      console.log("THUNK DATA:", data);
      console.log("THUNK DATA LENGTH:", data?.length);

      return data;
    } catch (error) {
      console.error("THUNK ERROR:", error);

      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch users"
      );
    }
  }
);


// ===============================
// APPROVE USER
// ===============================

export const approveUser = createAsyncThunk(
  "User/approveUser",
  async ({ id, activationlink }, { rejectWithValue }) => {
    debugger
    try {
      console.log("APPROVE THUNK ID:", id);
      console.log("APPROVE THUNK ACTIVATION LINK:", activationlink);

      const data = await ApproveUser(
        id,
        activationlink
      );

      console.log("APPROVE THUNK RESPONSE:", data);

      return data;
    } catch (error) {
      console.error("APPROVE THUNK ERROR:", error);

      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to approve user"
      );
    }
  }
);


// ===============================
// DECLINE USER
// ===============================

export const declineUser = createAsyncThunk(
  "User/declineUser",
  async ({ id, reason,registrationUrl } = {}, { rejectWithValue }) => {
    try {
      console.log("DECLINE USER ID:", id, "REASON:", reason);

      const data = await DeclineUser(id, reason,registrationUrl);

      console.log("DECLINE THUNK RESPONSE:", data);

      return data;
    } catch (error) {
      console.error("DECLINE THUNK ERROR:", error);

      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to decline user"
      );
    }
  }
);


// ===============================
// MAP USER ROLE & COMPANIES
// ===============================

export const mapUserRoleCompanies = createAsyncThunk(
  "User/mapUserRoleCompanies",
  async ({ id, roleId, companyIds }, { rejectWithValue }) => {
    try {
      const data = await MapUserRoleCompanies(
        id,
        roleId,
        companyIds
      );

      console.log("MAP ROLE/COMPANIES THUNK RESPONSE:", data);

      return data;
    } catch (error) {
      console.error("MAP ROLE/COMPANIES THUNK ERROR:", error);

      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to map role and companies"
      );
    }
  }
);


// ===============================
// APPROVE USER + MAP ROLE & COMPANIES (single combined call)
// ===============================

export const approveAndMapUser = createAsyncThunk(
  "User/approveAndMapUser",
  async ({ id, activationlink, roleId, companyIds }, { rejectWithValue }) => {
    try {
      const data = await ApproveAndMapUser(
        id,
        activationlink,
        roleId,
        companyIds
      );

      console.log("APPROVE & MAP THUNK RESPONSE:", data);

      return data;
    } catch (error) {
      console.error("APPROVE & MAP THUNK ERROR:", error);

      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to approve and map user"
      );
    }
  }
);
export const fetchupdateUser = createAsyncThunk(
  "User/fetchupdateUser",
  async (userData, { rejectWithValue }) => {
    try {
      debugger;
      const data = await updateuser(userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);


// ===============================
// SLICE
// ===============================

const UserVerificationSlice = createSlice({
  name: "users",

  initialState: {
    userList: [],
    loading: false,
    error: null,

    approving: false,
    declining: false,
    mapping: false,
    approvingAndMapping: false,
  },

  reducers: {},

  extraReducers: (builder) => {

    // ===============================
    // GET USERS
    // ===============================

    builder

      .addCase(
        getUsersListforApproval.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getUsersListforApproval.fulfilled,
        (state, action) => {
          state.loading = false;
          state.userList = action.payload || [];

          console.log(
            "REDUX USER LIST:",
            action.payload
          );
        }
      )

      .addCase(
        getUsersListforApproval.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;

          console.error(
            "REDUX USER LIST ERROR:",
            action.payload
          );
        }
      );


    // ===============================
    // APPROVE USER
    // ===============================

    builder

      .addCase(
        approveUser.pending,
        (state) => {
          state.approving = true;
          state.error = null;
        }
      )

      .addCase(
        approveUser.fulfilled,
        (state) => {
          state.approving = false;
        }
      )

      .addCase(
        approveUser.rejected,
        (state, action) => {
          state.approving = false;
          state.error = action.payload;
        }
      );


    // ===============================
    // DECLINE USER
    // ===============================

    builder

      .addCase(
        declineUser.pending,
        (state) => {
          state.declining = true;
          state.error = null;
        }
      )

      .addCase(
        declineUser.fulfilled,
        (state) => {
          state.declining = false;
        }
      )

      .addCase(
        declineUser.rejected,
        (state, action) => {
          state.declining = false;
          state.error = action.payload;
        }
      );


    // ===============================
    // MAP USER ROLE & COMPANIES
    // ===============================

    builder

      .addCase(
        mapUserRoleCompanies.pending,
        (state) => {
          state.mapping = true;
          state.error = null;
        }
      )

      .addCase(
        mapUserRoleCompanies.fulfilled,
        (state) => {
          state.mapping = false;
        }
      )

      .addCase(
        mapUserRoleCompanies.rejected,
        (state, action) => {
          state.mapping = false;
          state.error = action.payload;
        }
      );


    // ===============================
    // APPROVE USER + MAP ROLE & COMPANIES
    // ===============================

    builder

      .addCase(
        approveAndMapUser.pending,
        (state) => {
          state.approvingAndMapping = true;
          state.error = null;
        }
      )

      .addCase(
        approveAndMapUser.fulfilled,
        (state) => {
          state.approvingAndMapping = false;
        }
      )

      .addCase(
        approveAndMapUser.rejected,
        (state, action) => {
          state.approvingAndMapping = false;
          state.error = action.payload;
        }
      );
      builder
      .addCase(
        fetchupdateUser.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchupdateUser.fulfilled,
        (state, action) => {
          state.loading = false;

          const updatedUser = action.payload || {};
          if (!updatedUser || (!updatedUser.id && !updatedUser.Id)) {
            return;
          }

          const userId = updatedUser.id ?? updatedUser.Id;
          state.userList = state.userList.map((user) =>
            user.id === userId || user.Id === userId
              ? {
                  ...user,
                  ...updatedUser,
                  Activation:
                    updatedUser.Activation ??
                    updatedUser.activation ??
                    updatedUser.IsActive ??
                    updatedUser.isActive ??
                    user.Activation ??
                    user.activation ??
                    user.IsActive ??
                    user.isActive ??
                    "Active",
                  activation:
                    updatedUser.activation ??
                    updatedUser.Activation ??
                    user.activation ??
                    user.Activation ??
                    "Active",
                  Status:
                    updatedUser.Status ??
                    updatedUser.status ??
                    updatedUser.Activation ??
                    updatedUser.activation ??
                    user.Status ??
                    user.status ??
                    user.Activation ??
                    user.activation ??
                    "Active",
                  status:
                    updatedUser.status ??
                    updatedUser.Status ??
                    updatedUser.Activation ??
                    updatedUser.activation ??
                    user.status ??
                    user.Status ??
                    user.Activation ??
                    user.activation ??
                    "Active",
                  IsActive:
                    updatedUser.IsActive ??
                    updatedUser.isActive ??
                    user.IsActive ??
                    user.isActive ??
                    (updatedUser.Activation ?? updatedUser.activation ?? user.Activation ?? user.activation ?? "Active") === "Active",
                  isActive:
                    updatedUser.isActive ??
                    updatedUser.IsActive ??
                    user.isActive ??
                    user.IsActive ??
                    (updatedUser.Activation ?? updatedUser.activation ?? user.Activation ?? user.activation ?? "Active") === "Active",
                }
              : user
          );
        }
      )
      .addCase(
        fetchupdateUser.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload || "Failed to update user";
        }
      );
  },
});

export default UserVerificationSlice.reducer;