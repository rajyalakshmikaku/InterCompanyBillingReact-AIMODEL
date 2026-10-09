import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getqouationdetailswithrefno,savequotationApprovalorRejection,getinvoicedetailswithrefno, getcreditnotedetailswithrefno, getCreditnotedetailswithInvoicerefno} from '../services/QuotationTemplateApi';

// Thunks

export const fetchQuotationdetailswithRefno = createAsyncThunk(
  "quotation/fetchQuotationdetailswithRefno",
  async ({ refNo, guId,type }, { rejectWithValue }) => {
    debugger;
    try {
      const data = await getqouationdetailswithrefno(refNo,guId,type);
      return data;
    } catch (err) {
      debugger;
      let errorMessage = "Quotation fetch failed";

      if (err.response) {
        console.log("Backend error response:", err.response);

        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchInvoicedetailswithRefno = createAsyncThunk(
  'quotation/fetchInvoicedetailswithRefno',
  async (refNo) => {  
    debugger;
    const data = await getinvoicedetailswithrefno(refNo); 
    return data;
  }
);

export const fetchCreditnotedetailswithRefno = createAsyncThunk(
  'quotation/fetchCreditnotedetailswithRefno',
  async (refNo, { rejectWithValue }) => {  
    try {
      const data = await getcreditnotedetailswithrefno(refNo);

      // 🔥 IMPORTANT: check backend response
      if (data.success === false) {
        return rejectWithValue(data.message);
      }

      return data;

    } catch (err) {
      return rejectWithValue("Something went wrong");
    }
  }
);


export const fetchCreditnotedetailswithInvoicerefno = createAsyncThunk(
  'quotation/fetchCreditnotedetailswithInvoicerefno',
  async (refNo, { rejectWithValue }) => {  
    try {
      const data = await getCreditnotedetailswithInvoicerefno(refNo);

      // 🔥 IMPORTANT: check backend response
      if (data.success === false) {
        return rejectWithValue(data.message);
      }

      return data;

    } catch (err) {
      return rejectWithValue("Something went wrong");
    }
  }
);

export const fetchSaveQuotationApprovalorRejection = createAsyncThunk(
  'quotation/fetchSaveQuotationApprovalorRejection',
  async ({ quotationId, type, reason }) => {
    const data = await savequotationApprovalorRejection(quotationId, type, reason);
    return data;
  }
);


const QuotationTemplateSlice = createSlice({
  name: 'quotationData',
  initialState: {
    quotationDetails: null,
    invoiceDetails : null,
    creditNoteDetails: null,
    creditNoteViewDetails : null,
    saveapprovestatus: null,
    loading: false,
    actionLoading : false,
    error: null,
    message: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetch quotation details
    builder
      .addCase(fetchQuotationdetailswithRefno.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchQuotationdetailswithRefno.fulfilled, (state, action) => {
        
            console.log('quotationDetails',action.payload);
            state.quotationDetails = action.payload;
            state.loading = false;
        })
      .addCase(fetchQuotationdetailswithRefno.rejected, (state, action) => {
        debugger;
        console.log('quotationDetails','reject');
        state.error = action.payload || action.error.message;
        state.loading = false;
        state.message = null;
      });
      // fetch credit note details
       builder
      .addCase(fetchInvoicedetailswithRefno.pending, (state) => {
        state.invoiceloading = true;
        state.error = null;
      })
      .addCase(fetchInvoicedetailswithRefno.fulfilled, (state, action) => {
            console.log('invoiceDetails',action.payload);
            state.invoiceDetails = action.payload;
            state.invoiceloading = false;
        })
      .addCase(fetchInvoicedetailswithRefno.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.invoiceloading = false;
      });
      
     // fetch credit note details
    builder
      .addCase(fetchCreditnotedetailswithRefno.pending, (state) => {
        state.creditNoteloading = true;
        state.error = null;
      })
      .addCase(fetchCreditnotedetailswithRefno.fulfilled, (state, action) => {
            console.log('creditNoteDetails',action.payload);
            state.creditNoteDetails = action.payload;
            state.creditNoteloading = false;
        })
      .addCase(fetchCreditnotedetailswithRefno.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.creditNoteloading = false;
      });
    // fetch credit note details witg Invoice ref no
    builder
      .addCase(fetchCreditnotedetailswithInvoicerefno.pending, (state) => {
        state.creditNoteloading = true;
        state.error = null;
      })
      .addCase(fetchCreditnotedetailswithInvoicerefno.fulfilled, (state, action) => {
            console.log('creditNoteviewDetails',action.payload);
            state.creditNoteViewDetails = action.payload?.list || action.payload;;
      
            state.creditNoteloading = false;
        })
      .addCase(fetchCreditnotedetailswithInvoicerefno.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.creditNoteloading = false;
      });
     // save approval status
    builder
      .addCase(fetchSaveQuotationApprovalorRejection.pending, (state) => {
        state.actionLoading  = true;
        state.error = null;
      })
      .addCase(fetchSaveQuotationApprovalorRejection.fulfilled, (state, action) => {
            console.log('quotationDetails',action.payload);
            state.saveapprovestatus = action.payload;
            state.actionLoading  = false;
        })
      .addCase(fetchSaveQuotationApprovalorRejection.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.actionLoading  = false;
      });
 
   
  },
});

export default QuotationTemplateSlice.reducer;