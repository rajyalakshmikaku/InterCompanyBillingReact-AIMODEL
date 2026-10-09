import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRolesList, getDepartmentList, getReceivingList, saveRegistration ,getActiveURL,getRolesListforFilter} from '../services/RegistrationApi';

// Thunks
export const fetchActiveUrl = createAsyncThunk('user/fetchActiveUrl', async () => {
  const response = await getActiveURL();
  return response.urlname; 
});

export const fetchRoles = createAsyncThunk('user/fetchRoles', async () => {
  const response = await getRolesList();
  return response.list; 
});
export const fetchRolesforfilter = createAsyncThunk('user/fetchRolesforfilter', async () => {
  const response = await getRolesListforFilter();
  return response.list; 
});

export const fetchDepartments = createAsyncThunk('user/fetchDepartments', async () => {
  const response = await getDepartmentList();
  return response.list;
});

export const fetchCompanies = createAsyncThunk('user/fetchCompanies', async () => {
  const response = await getReceivingList();
  return response.list;
});


export const registerUser = createAsyncThunk(
  'user/registerUser',
  async (userdata, { rejectWithValue }) => {
    try {
      const res = await saveRegistration(userdata); 
      return res; 
    } catch (err) {
      let errorMessage = "Registration failed";

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
  name: 'userData',
  initialState: {
    roles: [],
    filteredroles :[],
    departments: [],
    companies: [],
    activeurl :null,
    registrationResult: null,
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
        state.roles = action.payload;
        state.loading = false;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });
     // Roles with filter
    builder
      .addCase(fetchRolesforfilter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolesforfilter.fulfilled, (state, action) => {
        state.filteredroles = action.payload;
        state.loading = false;
      })
      .addCase(fetchRolesforfilter.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

    // Departments
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
        state.loading = false;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
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

    // Registration (save)

    builder
      .addCase(registerUser.pending, (state,action) => {
        console.log('pending', action.payload); 
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        //console.log('fulfilled', action.payload); 
        state.registrationResult = action.payload;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        //console.log('rejected', action.payload); 
        state.error = action.payload || action.error.message;
        state.loading = false;
      });
      //active url
       builder
      .addCase(fetchActiveUrl.pending, (state,action) => {
        //console.log('pending', action.payload); 
        state.error = null;
      })
      .addCase(fetchActiveUrl.fulfilled, (state, action) => {
       // console.log('fulfilled', action.payload); 
        state.activeurl = action.payload;
        
      })
      .addCase(fetchActiveUrl.rejected, (state, action) => {
        console.log('rejected', action.payload); 
        state.error = action.payload || action.error.message;
        
      });
  },
});

export default registrationSlice.reducer;

