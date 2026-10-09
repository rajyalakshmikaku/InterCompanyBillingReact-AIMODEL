import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getquotationslist, saveInvoicegeneration } from '../services/QuotationApprovalApi';

// Thunks
export const fetchQuotationlist = createAsyncThunk('user/fetchQuotationlist', async () => {
  const response = await getquotationslist();
  return response.list;

});

export const savegenerateinvoicewitherefno = createAsyncThunk(
  'user/savegenerateinvoicewitherefno',
  async ({ refNo, templateUrl, unpaidstatus, invoicestatus }, { rejectWithValue }) => {
    try {
      const data = await saveInvoicegeneration(refNo, templateUrl,unpaidstatus, invoicestatus);

      // The API answers 200 with { success:false, message } when it refuses to
      // generate (wrong status, already invoiced, ...) — that is a failure, not
      // a success, so callers must not treat it as one.
      if (data && data.success === false) {
        return rejectWithValue(data.message || 'Failed to generate invoice');
      }
      return data;
    } catch (error) {
      const serverData = error?.response?.data;
      return rejectWithValue(
        serverData?.message ||
        (typeof serverData === 'string' ? serverData : null) ||
        error?.message ||
        'Failed to generate invoice'
      );
    }
  }
);


const QuotationApprovalSlice = createSlice({
  name: 'quotationData',
  initialState: {
    quotationList: [],
    statusofInvoicegeneration: {}, 
    loadingByRefNo: {},           
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // approval quotation list
    builder
      .addCase(fetchQuotationlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotationlist.fulfilled, (state, action) => {
        console.log('quotationlist', action.payload);
        state.quotationList = action.payload;
        state.loading = false;
      })
      .addCase(fetchQuotationlist.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

    // generate Invoice
    builder
      .addCase(savegenerateinvoicewitherefno.pending, (state, action) => {
        const refNo = action.meta.arg?.refNo;   // the refNo passed to thunk
        state.loadingByRefNo[refNo] = true;
        state.error = null;
      })
      .addCase(savegenerateinvoicewitherefno.fulfilled, (state, action) => {
        const refNo = action.meta.arg?.refNo;
        state.statusofInvoicegeneration[refNo] = action.payload;
        console.log('action.payload',action.payload);
        state.loadingByRefNo[refNo] = false;
      })
      .addCase(savegenerateinvoicewitherefno.rejected, (state, action) => {
        const refNo = action.meta.arg?.refNo;
        state.error = action.payload || action.error.message;
        state.loadingByRefNo[refNo] = false;
      });
  },
});


export default QuotationApprovalSlice.reducer;