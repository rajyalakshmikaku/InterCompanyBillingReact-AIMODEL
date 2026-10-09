
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GetUsersList, updateuser, DeleteUserList } from "../services/UsersListApi";



// Fetch users
export const getuserslist = createAsyncThunk(
  "Master/getuserslist",
  async (_, { rejectWithValue }) => {
    try {
      const data = await GetUsersList();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

// Update user
export const fetchupdateUser = createAsyncThunk(
  "Master/fetchupdateUser",
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


// ✅ DELETE User
export const fetchDeleteUser = createAsyncThunk(
  "Master/fetchDeleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const response = await DeleteUserList(id);
      // alertify.success(response.message || "User deleted successfully");
      return id;
    } catch (error) {
      // alertify.error(error.message || "Error deleting user");
      return rejectWithValue(error);
    }
  }
);



const UsersListSlice = createSlice({
  name: "users",
  initialState: {
    userList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getuserslist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getuserslist.fulfilled, (state, action) => {
        state.loading = false;
        state.userList = action.payload;
      })
      .addCase(getuserslist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchupdateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchupdateUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchupdateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


   // ✅ DELETE
      .addCase(fetchDeleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userList = state.userList.filter((user) => user.id !== action.payload);
      })
      .addCase(fetchDeleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
     


  },
});

export default UsersListSlice.reducer;
