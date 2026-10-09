import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEntitiesList, saveReceivingEntity, updateReceivingEntity, deleteReceivingEntity,GetRejectedQuotationList } from "../services/ReceivingEntitiesApi"; // ✅ keep if you have it


// The details endpoint returns [{ header, detail }] per row - flatten and
// normalise onto the field names the RejectedList table expects, the same
// way Deleted.jsx does for its list.
const mapRejectedRow = (item, requestedType) => {
  const header = item?.header || item || {};
  const documentType = header.documentType || header.DocumentType || requestedType || "Quotation";
  return {
    ...header,
    documentType,
    quotationReferenceNumber: header.quotationReferenceNumber || (documentType === "Quotation" ? header.referenceNumber : null) || "-",
    invoiceReferenceNumber: header.invoiceReferenceNumber || (documentType === "Invoice" ? header.referenceNumber : null) || "-",
    status: header.status || header.quotationStatus || header.invoiceStatus || header.Status || "-",
    rejectedDate: header.rejectedDate || header.RejectedDate || header.quotationDate || header.invoiceDate || header.updatedDate || null,
  };
};

// ✅ Thunk for creating entity

export const fetchCompaniesList = createAsyncThunk('receivingEntities/fetchComapnieslist', async () => {
  const response = await getEntitiesList();
  return response.list;
});

export const createReceivingEntity = createAsyncThunk(
  "receivingEntities/create",
  async (entityData, { rejectWithValue }) => {
    debugger;
    try {
      const response = await saveReceivingEntity(entityData);
      debugger
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error saving entity");
    }
  }
);

export const FetchdeleteEntity = createAsyncThunk(
  "receivingEntities/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteReceivingEntity(id);

      return response; // if deleteReceivingEntity already returns response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete company"
      );
    }
  }
);


// ✅ Thunk for updating entity
export const FetchupdateReceivingEntity = createAsyncThunk(
  "receivingEntities/update", async ({ id, payload }, { rejectWithValue }) => {
    debugger;
    try {
      const response = await updateReceivingEntity(id, payload);
      return response; // should return updated entity 
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update receiving entity");
    }
  }
);


export const fetchRejectedQuotationList = createAsyncThunk(
  "receivingEntities/fetchRejectedQuotationList",
  async ({ type, status } = {}, { rejectWithValue }) => {
    try {
      const response = await GetRejectedQuotationList({ type, status });

      console.log("API Response:", response);

      return response;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const receivingEntitiesSlice = createSlice({
  name: "receivingEntities",
  initialState: {
    companies: [],
    rejectedQuotationList: [],
    entities: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetEntityState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompaniesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompaniesList.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;

      })
      .addCase(fetchCompaniesList.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
        state.loading = false;
      });
    builder

      .addCase(createReceivingEntity.pending, (state) => {
        debugger
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReceivingEntity.fulfilled, (state, action) => {
        debugger
        state.loading = false;
        state.success = true;
        state.entities.push(action.payload);
      })
      .addCase(createReceivingEntity.rejected, (state, action) => {
        debugger
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Update entity
      .addCase(FetchupdateReceivingEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(FetchupdateReceivingEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const updatedEntity = action.payload.entity || action.payload; // depends on backend
        const index = state.entities.findIndex((e) => e.Id === updatedEntity.Id);

        if (index !== -1) {
          state.entities[index] = updatedEntity;
        }
      })
      .addCase(FetchupdateReceivingEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ✅ Delete entity 
      .addCase(FetchdeleteEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(FetchdeleteEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.entities = state.entities.filter((e) => e.Id !== action.payload.id);
      })
      .addCase(FetchdeleteEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRejectedQuotationList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRejectedQuotationList.fulfilled, (state, action) => {
        state.loading = false;
        const requestedType = action.meta.arg?.type;
        const rows = (action.payload?.list || []).map((item) => mapRejectedRow(item, requestedType));

        // Quotation and Invoice are fetched as two separate requests (the API
        // takes a single type), so each fulfilled call only replaces the slice
        // of the list it fetched instead of overwriting the other type's rows.
        state.rejectedQuotationList = requestedType
          ? [
              ...state.rejectedQuotationList.filter((row) => row.documentType !== requestedType),
              ...rows,
            ]
          : rows;
      })
      .addCase(fetchRejectedQuotationList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

},
});

export const { resetEntityState } = receivingEntitiesSlice.actions;
export default receivingEntitiesSlice.reducer;
