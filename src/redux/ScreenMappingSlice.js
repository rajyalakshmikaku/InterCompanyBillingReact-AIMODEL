import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRolesList, getScreensList,getRolewiseScreensList ,savescreenmappingdata } from '../services/ScreenMappingApi';

// Thunks
export const fetchRoles = createAsyncThunk('user/fetchRoles', async () => {
  const response = await getRolesList();
  return response.list; 
});

export const fetchScreenlist = createAsyncThunk('user/fetchScreenlist', async () => {
  const response = await getScreensList();
  return response.list;
});
export const fetchRolewiseScreenlist = createAsyncThunk('user/fetchRolewiseScreenlist', async () => {
  const response = await getRolewiseScreensList();
  debugger;
  return response.list;
});

export const savemapping = createAsyncThunk(
  'user/savemapping',
  async (mapdata, { rejectWithValue }) => {
    try {
      const res = await savescreenmappingdata(mapdata); 
      return res; 
    } catch (err) {
      debugger;
      let errorMessage = "Mapping failed";

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

const ScreenMappingSlice = createSlice({
  name: 'userData',
  initialState: {
    roles: [],
    Screens: [],
    rolewisescreens: [],
    mappingResult : null,
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

    // Screens
    builder
      .addCase(fetchScreenlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScreenlist.fulfilled, (state, action) => {
        console.log('Screens',action.payload);
        state.Screens = action.payload;
        state.loading = false;
      })
      .addCase(fetchScreenlist.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

    // RoleWiseScreens
    builder
      .addCase(fetchRolewiseScreenlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolewiseScreenlist.fulfilled, (state, action) => {
        state.rolewisescreens = action.payload;
        state.loading = false;
      })
      .addCase(fetchRolewiseScreenlist.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });
      // save mapping
     builder
           .addCase(savemapping.pending, (state,action) => {
             console.log('pending', action.payload); 
             state.loading = true;
             state.error = null;
           })
           .addCase(savemapping.fulfilled, (state, action) => {
             console.log('fulfilled', action.payload); 
             state.mappingResult = action.payload;
             state.loading = false;
           })
           .addCase(savemapping.rejected, (state, action) => {
             console.log('rejected', action.payload); 
             state.error = action.payload || action.error.message;
             state.loading = false;
           }); 
   
  },
});

export default ScreenMappingSlice.reducer;

