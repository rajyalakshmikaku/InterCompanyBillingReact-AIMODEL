import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getInvoiveslist, savequotationIvoiceApprovalPaidorCancel } from '../services/QuotationInvoiceApprovalApi';

// Thunks
export const fetchInvoicelist = createAsyncThunk('quotationInvoiceapproval/fetchInvoicelist', async () => {
  const response = await getInvoiveslist();
  return response.list;

});

export const fetchSaveInvoicestatusPaidorcancel = createAsyncThunk(
  'quotation/fetchSaveInvoicestatusPaidorcancel',
  async ({ InvoiceId, type, reason, cancelledBy = "" ,TemplateUrl = ""}) => {
    const data = await savequotationIvoiceApprovalPaidorCancel(InvoiceId, type, reason, cancelledBy, TemplateUrl);
    return data;
  }
);

const QuotationInvoiceApprovalSlice = createSlice({
  name: 'InvoiceData',
  initialState: {
    invoiceList: [],
    saveapprovestatus: null,  
    actionLoading : false,       
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // approval Invoice list
    builder
      .addCase(fetchInvoicelist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoicelist.fulfilled, (state, action) => {
        console.log('Invoicelist', action.payload);
        state.invoiceList = action.payload;
        state.loading = false;
      })
      .addCase(fetchInvoicelist.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });

    // save Paid/cancel status
       builder
         .addCase(fetchSaveInvoicestatusPaidorcancel.pending, (state) => {
           state.actionLoading  = true;
           state.error = null;
         })
         .addCase(fetchSaveInvoicestatusPaidorcancel.fulfilled, (state, action) => {
               console.log('quotationDetails',action.payload);
               state.saveapprovestatus = action.payload;
               state.actionLoading  = false;
           })
         .addCase(fetchSaveInvoicestatusPaidorcancel.rejected, (state, action) => {
           state.error = action.payload || action.error.message;
           state.actionLoading  = false;
         });
  },
});


export default QuotationInvoiceApprovalSlice.reducer;