import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { SaveMaster, GetMasterList, UpdateMaster, DeleteMaster,Gethelpinfowithscreen } from "../services/MasterApi";

// Fetch master list
export const getMasterList = createAsyncThunk(
  "master/getMasterList",
  async (entityType, { rejectWithValue }) => {
    try {
      const data = await GetMasterList(entityType);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch master list");
    }
  }
);

// Save master
export const createmaster = createAsyncThunk(
  "master/createmaster",
  async (userdata, { rejectWithValue }) => {
    try {
      const data = await SaveMaster(userdata);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to save master data");
    }
  }
);

// Update master
export const updatemaster = createAsyncThunk(
  "master/updatemaster",
  async (userdata, { rejectWithValue }) => {
    try {
      const data = await UpdateMaster(userdata);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update master data");
    }
  }
);

// ✅ Delete master
export const deletemaster = createAsyncThunk(
  "master/deletemaster",
  async (userdata, { rejectWithValue }) => {
    try {
      const data = await DeleteMaster(userdata);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete master data");
    }
  }
);

// Get Help Info

export const fetchhelpinfowithscreen = createAsyncThunk(
  "master/fetchhelpinfowithscreen",
  async (Screenname, { rejectWithValue }) => {
    debugger;
    try {
      const data = await Gethelpinfowithscreen(Screenname);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch master list");
    }
  }
);

const MasterSlice = createSlice({
  name: "master",
  initialState: {
    tableData: [],
    helpinfo: null,
    loading: false,
    error: "",
    successMessage: "",
  },
  reducers: {
    clearMessage: (state) => {
      state.successMessage = "";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
   
      // Get list

      
       builder
      .addCase(getMasterList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMasterList.fulfilled, (state, action) => {
        state.tableData = action.payload;
        state.loading = false;
          state.successMessage = "";
        state.error= "";
      })

      .addCase(getMasterList.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Create
       builder
      .addCase(createmaster.fulfilled, (state, action) => {
        state.successMessage = action.payload.message || "Saved successfully";
        state.loading = false;
      })
      .addCase(createmaster.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Update
       builder
      .addCase(updatemaster.fulfilled, (state, action) => {
        state.successMessage = action.payload.message || "Updated successfully";
        state.loading = false;
      })
      .addCase(updatemaster.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // ✅ Delete
       builder
      .addCase(deletemaster.fulfilled, (state, action) => {
        state.successMessage = action.payload.message || "Deleted successfully";
        state.loading = false;
      })
      .addCase(deletemaster.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });


      // HELP INFO 
       builder
      .addCase(fetchhelpinfowithscreen.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchhelpinfowithscreen.fulfilled, (state, action) => {
        state.helpinfo = action.payload;
        state.loading = false;
      })
      
      .addCase(fetchhelpinfowithscreen.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      
  },
});

export const { clearMessage } = MasterSlice.actions;
export default MasterSlice.reducer;
