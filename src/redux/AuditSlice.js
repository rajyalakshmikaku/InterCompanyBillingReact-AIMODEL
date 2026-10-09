import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {getusersListforAudit,getAuditLogsWithFilter,getAuditLogsWithDetails} from "../services/AuditApi";

// Async thunk

export const fetchUsers = createAsyncThunk('audit/fetchUsers', async () => {
  const response = await getusersListforAudit();
  return response.list; 
});
export const fetchAuditLogsWithFilter = createAsyncThunk(
  "audit/fetchAuditLogsWithFilter",
  async ({ user,ScreenName, fromDate, toDate }) => {
    const response = await getAuditLogsWithFilter(user,ScreenName, fromDate, toDate);
    return response.list || response; 
  }
);

export const fetchAuditdetailswithId = createAsyncThunk(
  "audit/fetchAuditdetailswithId",
  async ({ ScreenName, Id,Refno }, { rejectWithValue }) => {
    debugger;
    try {
      const response = await getAuditLogsWithDetails(ScreenName, Id, Refno);
      return response.list || response; 
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const clearAuditLogs = () => (dispatch) => {
  dispatch({ type: 'audit/clearAuditLogs' });
};




const AuditSlice = createSlice({
  name: "audit",
  initialState: {
    Users: [],
    Details :[],
    auditLogs: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAuditLogs: (state) => {
      state.auditLogs = [];
    },
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.Users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

      builder
      .addCase(fetchAuditLogsWithFilter.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAuditLogsWithFilter.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogsWithFilter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

      builder
      .addCase(fetchAuditdetailswithId.pending, (state) => {
        // state.loading = true;
      })
      .addCase(fetchAuditdetailswithId.fulfilled, (state, action) => {
        //state.loading = false;
        state.Details = action.payload;
      })
      .addCase(fetchAuditdetailswithId.rejected, (state, action) => {
        // state.loading = false;
        state.error = action.error.message;
      });
      
  },
});

export default AuditSlice.reducer;
