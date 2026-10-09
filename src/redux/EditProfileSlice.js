import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRolesList, getReceivingList, EditProfilewithEmail,getUserDetailswithEmail } from '../services/EditProfileApi';

// Thunks
export const fetchRoles = createAsyncThunk('editProfile/fetchRoles', async () => {
  const response = await getRolesList();
  return response.list; 
});

export const fetchCompanies = createAsyncThunk('editProfile/fetchCompanies', async () => {
  const response = await getReceivingList();
  return response.list;
});

export const fetchUserByEmail = createAsyncThunk(
  "editProfile/fetchUserByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const data = await getUserDetailswithEmail(email);
      console.log("API response in thunk:", data); // 👈 check this
      return data.list; // might need to adjust based on log
    } catch (error) {
      console.error("Error fetching user:", error);
      return rejectWithValue(error.response?.data || { message: "Failed to fetch user" });
    }
  }
);


export const updateUser = createAsyncThunk(
  'editProfile/updateUser',
  async (userdata, { rejectWithValue }) => {
    debugger;
    try {
      console.log('userdata',userdata);
      const res = await EditProfilewithEmail(userdata); 
      return res; 
    } catch (err) {
      let errorMessage = "Updation failed";

      if (err.response) {
        console.log("Backend error response:", err.response);

        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      return rejectWithValue(errorMessage);
    }
  }
);

const registrationSlice = createSlice({
  name: 'editProfile',
  initialState: {
    roles: [],
    companies: [],
    user: {}, 
    updateResult: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Roles
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        console.log('roles',action.payload);
        state.roles = action.payload;
        state.loading = false;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

    // Companies
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companies = action.payload;
        state.loading = false;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

    // User
    builder
      .addCase(fetchUserByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserByEmail.fulfilled, (state, action) => {
  state.loading = false;
  console.log("Fetched user data in slice:", action.payload);
  state.user = action.payload || {}; // 👈 fallback if undefined
})

      .addCase(fetchUserByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // Update
      builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.meta.arg }; // merge updated values
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });
  },
});

export default registrationSlice.reducer;

