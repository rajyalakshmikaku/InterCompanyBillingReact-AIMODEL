import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCustomersList, getCompaniesListforFilter, savecustomerdetails, updatecustomerdetails,deletecustomerdetails ,
         getCompanieswithdeactivestatus,getCompaniesListwithoutRole} from '../services/CustomerApi';

// Thunks
export const fetchcustomerlist = createAsyncThunk('Customers/fetchcustomerlist', async () => {
    const response = await getCustomersList();
    return response.list;
});

export const fetchCompanieswithfilter = createAsyncThunk('Customers/fetchCompanieswithfilter', async () => {
    debugger
    const response = await getCompaniesListforFilter();
    return response.list;
});

export const fetchCompaniesListwithoutRole = createAsyncThunk('Customers/fetchCompaniesListwithoutRole', async () => {
    const response = await getCompaniesListwithoutRole();
    return response.list;
});

export const fetchCompanieswithdeactivestatus = createAsyncThunk('Customers/fetchCompanieswithdeactivestatus', async () => {
    debugger
    const response = await getCompanieswithdeactivestatus();
    return response.list;
});

export const createcustomer = createAsyncThunk(
    'Customers/createcustomer',
    async (custdata, { rejectWithValue }) => {
        debugger;
        try {
            const res = await savecustomerdetails(custdata);
            return res;
        } catch (err) {
            let errorMessage = "Customer save failed";

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
export const updatecustomer = createAsyncThunk(
    'Customers/updatecustomer',
    async (updatedata, { rejectWithValue }) => {
        debugger;
        try {
            const res = await updatecustomerdetails(updatedata);
            return res;
        } catch (err) {
            let errorMessage = "Customer Update failed";

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
export const deletecustomer = createAsyncThunk(
    'Customers/deletecustomer',
    async (Id, { rejectWithValue }) => {
        debugger;
        try {
            const res = await deletecustomerdetails(Id);
            return res;
        } catch (err) {
            console.log('err',err)
            let errorMessage = "Customer delete failed";

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



const CustomerSlice = createSlice({
    name: 'Customers',
    initialState: {
        Customerslist: [],
        companies: [],
        companieslist: [],
        comapnieswithoutRole :[],
        saveResult: null,
        updateResult: null,
        deleteResult: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        // customerslist
        builder
            .addCase(fetchcustomerlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchcustomerlist.fulfilled, (state, action) => {
                console.log('Customerslist', action.payload)
                state.Customerslist = action.payload;
                state.loading = false;
            })
            .addCase(fetchcustomerlist.rejected, (state, action) => {
                state.error = action.payload || action.error.message;
                state.loading = false;
            });


        // Companies
        builder
            .addCase(fetchCompanieswithfilter.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCompanieswithfilter.fulfilled, (state, action) => {
                console.log('companies', action.payload)
                state.companies = action.payload;
                state.loading = false;
            })
            .addCase(fetchCompanieswithfilter.rejected, (state, action) => {
                state.error = action.payload || action.error.message;
                state.loading = false;
            });

            
        // Companies without deactivation status
        builder
            .addCase(fetchCompanieswithdeactivestatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCompanieswithdeactivestatus.fulfilled, (state, action) => {
                console.log('companies', action.payload)
                state.companieslist = action.payload;
                state.loading = false;
            })
            .addCase(fetchCompanieswithdeactivestatus.rejected, (state, action) => {
                state.error = action.payload || action.error.message;
                state.loading = false;
            });
        // Companies without Role
        builder
            .addCase(fetchCompaniesListwithoutRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCompaniesListwithoutRole.fulfilled, (state, action) => {
                console.log('companies', action.payload)
                state.comapnieswithoutRole = action.payload;
                state.loading = false;
            })
            .addCase(fetchCompaniesListwithoutRole.rejected, (state, action) => {
                state.error = action.payload || action.error.message;
                state.loading = false;
            });

        // customers (save)

        builder
            .addCase(createcustomer.pending, (state, action) => {
                console.log('pending', action.payload);
                state.loading = true;
                state.error = null;
            })
            .addCase(createcustomer.fulfilled, (state, action) => {
                console.log('fulfilled', action.payload);
                state.saveResult = action.payload;
                state.loading = false;
            })
            .addCase(createcustomer.rejected, (state, action) => {
                console.log('rejected', action.payload);
                state.error = action.payload || action.error.message;
                state.loading = false;
            });
        // customers (update)

        builder
            .addCase(updatecustomer.pending, (state, action) => {
                console.log('pending', action.payload);
                state.loading = true;
                state.error = null;
            })
            .addCase(updatecustomer.fulfilled, (state, action) => {
                console.log('fulfilled', action.payload);
                state.updateResult = action.payload;
                state.loading = false;
            })
            .addCase(updatecustomer.rejected, (state, action) => {
                console.log('rejected', action.payload);
                state.error = action.payload || action.error.message;
                state.loading = false;
            });
         // customers (update)

        builder
            .addCase(deletecustomer.pending, (state, action) => {
                console.log('pending', action.payload);
                state.loading = true;
                state.error = null;
            })
            .addCase(deletecustomer.fulfilled, (state, action) => {
                console.log('fulfilled', action.payload);
                state.deleteResult = action.payload;
                state.loading = false;
            })
            .addCase(deletecustomer.rejected, (state, action) => {
                console.log('rejected', action.payload);
                state.error = action.payload || action.error.message;
                state.loading = false;
            });

    },
});

export default CustomerSlice.reducer;

