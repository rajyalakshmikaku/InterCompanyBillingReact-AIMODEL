import React, { useState, useEffect, useRef } from "react";
import { AxiosInstance } from "../../services/api";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import "./InventoryItem.css";
import Button from "../../components/Common/Button";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompanieswithdeactivestatus } from "../../redux/CustomerSlice";
import HelpModal from "../../components/Common/HelpModal";
import {
  allowAlphaNumeric,
  isAlphaNumeric,
} from "../../validations/InputValdation";
import Pagination from "../../components/Common/Pagination";
import { FiCheck, FiX } from "react-icons/fi";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FaEdit, FaTrash } from "react-icons/fa";
import HoloButton from "../../components/Common/HoloButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/AlertDialog";

const InventoryItem = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingCsvTemplate, setIsDownloadingCsvTemplate] =
    useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const companyList = useSelector(
    (state) => state.Customers?.companieslist ?? []
  );

  useEffect(() => {
    console.log("InventoryItem companyList from Redux:", companyList);
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchCompanieswithdeactivestatus());
        console.log("Dispatch company thunk result:", result);
      } catch (err) {
        console.error("Error fetching customers/companies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [newItem, setNewItem] = useState({
    ItemName: "",
    Description: "",
    Price: "",
    PriceDisplay: "",
    ItemCode: "",
    UnitOfMeasure: "",
    CompanyId: "",
    Status: "",
    MeterTypeId: "",
    Category: "",
    VatableStatus: false,
  });

  const [editItem, setEditItem] = useState({
    Id: "",
    ItemName: "",
    Description: "",
    PriceDisplay: "",
    ItemCode: "",
    UnitOfMeasure: "",
    CompanyId: "",
    Status: "",
    MeterTypeId: "",
    Category: "",
    VatableStatus: "",
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    let updatedItem = { ...newItem, [name]: finalValue };

    // if (name === "Category") {
    //   if (String(finalValue).trim().toLowerCase() === "service rendered") {
    //     updatedItem.Quantity = 0;
    //   } else {
    //     updatedItem.Quantity = "";
    //   }
    // }

    const textFields = ["ItemName", "Description", "UnitOfMeasure", "ItemCode"];
    if (type !== "checkbox" && textFields.includes(name)) {
      const regex = /^[a-zA-Z0-9\s]*$/;
      if (!regex.test(value)) {
        return;
      }
    }

    setNewItem(updatedItem);
    console.log("Create form changed:", { name, value, updatedItem });

    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, type, value, checked } = e.target;

    let updatedItem = {
      ...editItem,
      [name]: type === "checkbox" ? checked : value,
    };

    // if (name === "Category") {
    //   if (String(value).trim().toLowerCase() === "service rendered") {
    //     updatedItem.Quantity = 0;
    //   } else {
    //     updatedItem.Quantity = "";
    //   }
    // }

    const textFields = ["ItemName", "Description", "UnitOfMeasure", "ItemCode"];
    if (textFields.includes(name)) {
      const regex = /^[a-zA-Z0-9\s]*$/;
      if (!regex.test(value)) return;
    }

    setEditItem(updatedItem);
    console.log("Edit form changed:", { name, value, updatedItem });
  };

  useEffect(() => {
    GetTaxes();
    fetchMeterType();
    fetchItems();
    fetchCategories();
  }, []);




  const [taxes, setTaxes] = useState([]);
  const [meterType, setMeterType] = useState([]);
  const [categories, setcategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await AxiosInstance.get(
        "/api/InventoryItems/GetCategories",
      );
      console.log("categories", response.data);
      setcategories(response.data.data);
      if (response.data.success) {
      }
    } catch (error) {
      console.error("Error fetching ", error);
      alertify.alert("Error", "Failed to load");
    } finally {
    }
  };

  const GetTaxes = async () => {
    try {
      const response = await AxiosInstance.get("/api/InventoryItems/GetTaxes");
      console.log("Tax data", response.data);
      if (response.data.success && response.data.data.length > 0) {
        setTaxes(response.data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching ", error);
      alertify.alert("Error", "Failed to load");
    }
  };

  const fetchMeterType = async () => {
    try {
      const response = await AxiosInstance.get(
        "/api/InventoryItems/GetMeterTypes",
      );
      console.log("Meter data", response.data);
      setMeterType(response.data.data);
      if (response.data.success) {
      }
    } catch (error) {
      console.error("Error fetching ", error);
      alertify.alert("Error", "Failed to load");
    } finally {
    }
  };

  const fetchItems = async () => {
    try {
      const response = await AxiosInstance.get(
        "/api/InventoryItems/GetTotalInventoryItems",
      );
      console.log("inventory items", response);
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      alertify.alert("Error", "Error fetching inventory items.");
    } finally {
      setLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    ItemName: "",
    Description: "",
    itemCode: "",
    PriceRange: "",
    Category: "",
    CompanyId: "",
  });
  const [tempFilters, setTempFilters] = useState({
    ItemName: "",
    itemCode: "",
    Description: "",
    PriceRange: "",
    Category: "",
    CompanyId: "",
  });

  const applyFilter = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
  };

  const filteredInvoices = items.filter((invoice) => {
    const price = Number(invoice.price);
    const matchesPrice =
      filters.PriceRange === "" ||
      (filters.PriceRange === "under-100" && price < 100) ||
      (filters.PriceRange === "100-499" && price >= 100 && price < 500) ||
      (filters.PriceRange === "500-999" && price >= 500 && price < 1000) ||
      (filters.PriceRange === "1000-4999" && price >= 1000 && price < 5000) ||
      (filters.PriceRange === "5000-plus" && price >= 5000);

    return (
      (filters.Category === "" ||
        invoice.category
          ?.toLowerCase()
          .includes(filters.Category.toLowerCase())) &&
      (filters.ItemName === "" ||
        invoice.itemName
          ?.toLowerCase()
          .includes(filters.ItemName.toLowerCase())) &&
      (filters.Description === "" ||
        invoice.description
          ?.toLowerCase()
          .includes(filters.Description.toLowerCase())) &&
      (filters.itemCode === "" ||
        invoice.itemCode
          ?.toLowerCase()
          .includes(filters.itemCode.toLowerCase())) &&
      (filters.CompanyId === "" ||
        String(invoice.companyId) === String(filters.CompanyId)) &&
      matchesPrice
    );
  });

  const [editErrors, setEditErrors] = useState({});

  const validateEditForm = () => {
    const editErrors = {};
    const safeTrim = (value) =>
      value !== null && value !== undefined ? value.toString().trim() : "";

    const itemName = safeTrim(editItem.ItemName);

    if (!itemName) {
      editErrors.ItemName = "Item Name is required";
    }
    if (!safeTrim(editItem.Description))
      editErrors.Description = "Description is required";
    if (!safeTrim(editItem.PriceDisplay) && !safeTrim(editItem.Price))
      editErrors.PriceDisplay = "Price is required";
    if (!safeTrim(editItem.ItemCode))
      editErrors.ItemCode = "Item Code is required";
    if (!safeTrim(editItem.UnitOfMeasure))
      editErrors.UnitOfMeasure = "Unit of Measure is required";
    if (!safeTrim(editItem.Category))
      editErrors.Category = "Category is required";

    if (
      editItem.CompanyId === 0 ||
      editItem.CompanyId === null ||
      editItem.CompanyId === undefined ||
      editItem.CompanyId === ""
    )
      editErrors.CompanyId = "Company is required";

    if (
      editItem.Status === null ||
      editItem.Status === undefined ||
      editItem.Status === ""
    )
      editErrors.Status = "Status is required";

    setEditErrors(editErrors);
    return Object.keys(editErrors).length === 0;
  };

  useEffect(() => {
    Object.keys(editItem).forEach((key) => {
      if (editItem[key] && editErrors[key]) {
        setEditErrors((prev) => ({ ...prev, [key]: "" }));
      }
    });
  }, [editItem]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [recordsPerPage, setRecordsPerPage] = useState(5);

  // const start = (currentPage - 1) * recordsPerPage;
  // const end = start + recordsPerPage;
  // const paginatedInvoices = filteredInvoices.slice(start, end);

  // const requestSort = (key) => {
  //   let direction = "asc";
  //   if (sortConfig.key === key && sortConfig.direction === "asc") {
  //     direction = "desc";
  //   }
  //   setSortConfig({ key, direction });
  // };

  // const sortedInvoices = [...paginatedInvoices].sort((a, b) => {
  //   if (!sortConfig.key) return 0;
  //   const x = a[sortConfig.key] ?? "";
  //   const y = b[sortConfig.key] ?? "";
  //   if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
  //   if (x > y) return sortConfig.direction === "asc" ? 1 : -1;
  //   return 0;
  // });

const requestSort = (key) => {
  let direction = "asc";

  if (
    sortConfig.key === key &&
    sortConfig.direction === "asc"
  ) {
    direction = "desc";
  }

  setSortConfig({
    key,
    direction,
  });

  setCurrentPage(1);
};

const sortedInvoices = [...filteredInvoices].sort((a, b) => {
  if (!sortConfig.key) return 0;

  if (sortConfig.key === "price") {
    const x = Number(a.price) || 0;
    const y = Number(b.price) || 0;

    return sortConfig.direction === "asc"
      ? x - y
      : y - x;
  }

  const x = String(a[sortConfig.key] ?? "").toLowerCase();
  const y = String(b[sortConfig.key] ?? "").toLowerCase();

  if (x < y) {
    return sortConfig.direction === "asc" ? -1 : 1;
  }

  if (x > y) {
    return sortConfig.direction === "asc" ? 1 : -1;
  }

  return 0;
});

// Pagination should happen AFTER sorting
const start = (currentPage - 1) * recordsPerPage;
const end = start + recordsPerPage;

const paginatedInvoices = sortedInvoices.slice(start, end);

  const [errors, setErrors] = useState({});

  const onSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      handleCreateItem();
    }
  };

  const validate = () => {
    debugger
    const newErrors = {};
    const safeTrim = (value) => (value ? value.toString().trim() : "");

    const itemName = safeTrim(newItem.ItemName);

    if (!itemName) {
      newErrors.ItemName = "Item Name is required";
    } else if (
      !/^(?=(?:.*[A-Za-z]){3,})[A-Za-z0-9\s&.,()\/-]{3,50}$/.test(itemName)
    ) {
      newErrors.ItemName =
        "Item Name must contain at least 3 letters and can contain only letters, numbers, spaces, &, ., -, /, commas, and parentheses.";
    }
    if (!safeTrim(newItem.Description))
      newErrors.Description = "Description is required";
    if (!safeTrim(newItem.Price) && !safeTrim(newItem.PriceDisplay))
      newErrors.PriceDisplay = "Price is required";
    if (!safeTrim(newItem.ItemCode))
      newErrors.ItemCode = "Item Code is required";
    if (!safeTrim(newItem.UnitOfMeasure))
      newErrors.UnitOfMeasure = "Unit of Measure is required";
    if (!safeTrim(newItem.CompanyId)) newErrors.CompanyId = "Company is required";
    if (!safeTrim(newItem.Category))
      newErrors.Category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleCreateItem = async () => {
    setIsLoading(true);
    debugger
    try {
      const payload = {
        ...newItem,
        Price: Number(newItem.Price) || 0,
        CompanyId: String(newItem.CompanyId),
        MeterTypeId: newItem.MeterTypeId
          ? Number(newItem.MeterTypeId)
          : null,
        VatableStatus: Boolean(newItem.VatableStatus),
        Status: 'Active'
      };

      console.log("Sending Payload");
      console.log(JSON.stringify(payload, null, 2));

      const response = await AxiosInstance.post(
        "/api/InventoryItems/SaveInventoryItem",
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log(response.data);

      if (response.data.success) {
        alertify.alert('Success', response.data.message);

        fetchItems();

        setShowCreateScreen(false);

        setNewItem({
          ItemName: "",
          Description: "",
          Price: "",
          PriceDisplay: "",
          ItemCode: "",
          UnitOfMeasure: "",
          CompanyId: "",
          Status: "",
          MeterTypeId: "",
          Category: "",
          VatableStatus: false
        });
      }
      else {
        alertify.alert("Error", response.data.message);
      }
    }
    catch (err) {

      console.log("Status :", err.response?.status);
      console.log("API Error :", err.response?.data);
      // console.log("Payload :", payload);

      if (err.response?.data?.errors) {

        let message = "";

        Object.keys(err.response.data.errors).forEach(key => {

          message += `${key}\n`;

          err.response.data.errors[key].forEach(e => {
            message += "• " + e + "\n";
          });

        });

        alertify.alert("Validation Error", message);

      }
      else {

        alertify.alert(
          "Error",
          err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Unable to save item."
        );

      }

    }
    finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) {
      return;
    }
    setIsSaving(true);
    console.log("Edit meter type =", editItem.MeterTypeId);
    try {
      const payload = {
        ...editItem,
        Price: parseFloat(editItem.PriceDisplay || editItem.Price) || 0,
        CompanyId: parseInt(editItem.CompanyId) || 0,
        VatableStatus: editItem.VatableStatus,
        ModifiedDate: new Date().toISOString(),
      };
      console.log("Update payload:", payload);
      const response = await AxiosInstance.post(
        `/api/InventoryItems/${editItem.Id}`,
        payload,
      );
      if (response.data.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === editItem.Id ? { ...payload, id: editItem.Id } : i,
          ),
        );
        const message = response?.data?.message || "Item updated successfully.";
        alertify.alert("Success", message);
        setShowEditScreen(false);
        setSelectedInvoice(null);
        fetchItems();
      } else {
        const message = response?.data?.message || "No Changes Found.";
        alertify.alert("Error", message);
      }
    } catch (error) {
      console.log("Status:", error.response?.status);
      console.log("Response:", error.response?.data);

      alertify.alert(
        "Error",
        JSON.stringify(error.response?.data, null, 2)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const Cancel = async () => {
    setNewItem("");
    setShowCreateScreen(false);
  };

  // Step 1: Intercept delete icon click and set state variables
  const handleInitiateDelete = (id) => {
    setItemToDelete(id);
    setIsDeleteOpen(true);
  };



  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const response = await AxiosInstance.get(
        "/api/InventoryItems/download-template",
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ProductTemplate.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ✅ CSV Template download — opens in Word (.doc)
  const downloadCsvTemplate = () => {
    // Set loader first, then defer the actual work so React re-renders the spinner before blob runs
    setIsDownloadingCsvTemplate(true);

    setTimeout(() => {
      try {
        const headers = [
          "Item Code",
          "Item Name",
          "Item Description",
          "Category",
          "Price Excl VAT",
          "Unit Of Measure",
          "Company",
          "Is Vatable",
        ];

        const escapeCsv = (val) => {
          if (val === null || val === undefined) return '""';
          const s = String(val);
          const escaped = s.replace(/"/g, '""');
          return `"${escaped}"`;
        };

        const sanitizeList = (arr, nameKey) => {
          if (!arr || !arr.length) return ["No Data"];
          return arr
            .map((item) => {
              const val = nameKey ? item[nameKey] : item;
              if (val === null || val === undefined) return "";
              return String(val).replace(/\s+/g, " ").trim();
            })
            .filter(Boolean);
        };

        const categoryVals = sanitizeList(categories, "name");
        const companyVals = sanitizeList(companyList, "companyName");
        const uomVals = ["Hour", "Unit"];
        const vatableVals = ["TRUE", "FALSE"];

        const joinPipe = (arr) =>
          arr.map((v) => v.replace(/\|/g, " ")).join("|");

        const categoryList = joinPipe(categoryVals);
        const companyNames = joinPipe(companyVals);
        const uomList = joinPipe(uomVals);
        const vatableList = joinPipe(vatableVals);

        const rows = [];
        rows.push(headers.map((h) => escapeCsv(h)).join(","));
        rows.push(headers.map(() => '""').join(","));
        rows.push(headers.map(() => '""').join(","));

        rows.push(
          ["", escapeCsv("LOOKUP_SECTION"), "", "", "", "", "", ""].join(","),
        );
        rows.push(
          [
            "",
            escapeCsv("Lookup Name"),
            escapeCsv("Allowed Values"),
            "",
            "",
            "",
            "",
            "",
          ].join(","),
        );

        const makeLookupRow = (lookupName, lookupValues) => {
          const cols = ["", lookupName, lookupValues, "", "", "", "", ""].map(
            (c) => escapeCsv(c),
          );
          return cols.join(",");
        };

        rows.push(makeLookupRow("VALID_CATEGORIES", categoryList));
        rows.push(makeLookupRow("UNIT_OF_MEASURE", uomList));
        rows.push(makeLookupRow("IS_VATABLE", vatableList));
        rows.push(makeLookupRow("COMPANIES", companyNames));

        const csvContent = rows.join("\n") + "\n";

        // Use CSV MIME type for proper CSV format
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        // .csv extension for CSV format
        link.setAttribute("download", "ProductTemplate.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("CSV template download failed:", error);
      } finally {
        setIsDownloadingCsvTemplate(false);
      }
    }, 300); // 300ms delay lets React paint the spinner before blob work starts
  };

  const handleBulkUpload = (e) => {
    console.log("Upload triggered");
    setIsBulkUploading(true);

    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      e.target.value = "";
      setIsBulkUploading(false);
      return;
    }

    console.log("File:", file.name);
    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          console.log("CSV Parsed Data:", results.data);
          if (!results.data || results.data.length === 0) {
            alertify.alert("Error", "CSV is empty");
            e.target.value = "";
            return;
          }
          sendBulkData(results.data);
          e.target.value = "";
          fetchItems();
        },
        error: function (err) {
          console.error("CSV Parse Error:", err);
          e.target.value = "";
          alertify.alert("Error", "Failed to parse CSV file");
          setIsBulkUploading(false);
        },
      });
    } else if (fileType === "xlsx" || fileType === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        console.log("Excel file loaded");
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          console.log("Workbook:", workbook);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          console.log("Excel Parsed Data:", jsonData);
          if (!jsonData || jsonData.length === 0) {
            alertify.alert("Error", "Excel file is empty");
            e.target.value = "";
            return;
          }
          const cleanedData = jsonData.map((item) => ({
            ...item,
            VatableStatus:
              item.VatableStatus === true ||
              item.VatableStatus === "true" ||
              item.VatableStatus === 1,
          }));
          console.log("Cleaned Data:", cleanedData);
          sendBulkData(cleanedData);
          e.target.value = "";
        } catch (err) {
          console.error("Excel Processing Error:", err);
          alertify.alert("Error", "Error reading Excel file");
          e.target.value = "";
          setIsBulkUploading(false);
        }
      };
      reader.onerror = () => {
        console.error("File reading failed");
        alertify.alert("Error", "Failed to read file");
        e.target.value = "";
        setIsBulkUploading(false);
      };
      reader.readAsBinaryString(file);
    } else {
      alertify.alert("Error", "Only CSV or Excel files supported");
      e.target.value = "";
      setIsBulkUploading(false);
    }
  };

  const sendBulkData = async (data) => {
    console.log("Raw Data:", data);

    const normalizeData = (rows) => {
      return rows.map((row) => {
        const normalized = {};
        for (let key in row) {
          const value = row[key];
          const lowerKey = key.toLowerCase().trim();
          if (lowerKey === "itemname" || lowerKey === "item name") {
            normalized.ItemName = value;
          } else if (lowerKey === "itemcode" || lowerKey === "item code") {
            normalized.ItemCode = value;
          } else if (
            lowerKey === "description" ||
            lowerKey === "item description" ||
            lowerKey === "desc"
          ) {
            normalized.Description = value;
          } else if (lowerKey === "category") {
            normalized.Category = value;
          } else if (
            lowerKey === "price" ||
            lowerKey === "price excl vat" ||
            lowerKey === "price exclvat"
          ) {
            normalized.Price = value;
          } else if (
            lowerKey === "unitofmeasure" ||
            lowerKey === "unit of measure" ||
            lowerKey === "uom"
          ) {
            normalized.UnitOfMeasure = value;
          } else if (lowerKey === "companyid" || lowerKey === "company id") {
            normalized.CompanyId = value;
          } else if (
            lowerKey === "companyname" ||
            lowerKey === "company name" ||
            lowerKey === "company"
          ) {
            normalized.CompanyName = value;
          } else if (
            lowerKey === "vatablewstatus" ||
            lowerKey === "is vatable" ||
            lowerKey === "vatable"
          ) {
            normalized.VatableStatus = value;
          }
        }
        return normalized;
      });
    };

    const filterUploadRows = (rows) => {
      return rows.filter((row) => {
        if (!row || typeof row !== "object") return false;
        const values = Object.values(row).map((value) =>
          String(value || "").trim(),
        );
        const allEmpty = values.every((value) => value === "");
        if (allEmpty) return false;
        const lowerValues = values.map((value) => value.toLowerCase());
        const lookupSectionLabels = [
          "lookup_section",
          "lookup name",
          "allowed values",
          "valid_categories",
          "unit_of_measure",
          "is_vatable",
          "companies",
        ];
        if (lowerValues.some((value) => lookupSectionLabels.includes(value))) {
          return false;
        }
        if (
          !values[0] &&
          values[1] &&
          lookupSectionLabels.includes(values[1].toLowerCase())
        ) {
          return false;
        }
        return true;
      });
    };

    const filteredData = filterUploadRows(data);
    console.log("Filtered Data:", filteredData);

    const normalizedData = normalizeData(filteredData);
    console.log("Normalized Data:", normalizedData);

    const requiredFields = [
      "ItemName",
      "ItemCode",
      "Description",
      "Category",
      "UnitOfMeasure",
    ];
    const invalidRecords = [];

    const allowedCategories = (categories || []).map((c) =>
      (c.name ? c.name : c).trim().toLowerCase(),
    );
    const allowedCompanies = (companyList || []).map((c) =>
      c.companyName.trim().toLowerCase(),
    );
    const allowedUOM = ["Hour", "Unit"].map((u) => u.toLowerCase());
    const allowedVatable = ["TRUE", "FALSE"].map((v) => v.toLowerCase());

    normalizedData.forEach((item, index) => {
      const missingFields = requiredFields.filter(
        (field) => !item[field] || String(item[field]).trim() === "",
      );
      if (missingFields.length > 0) {
        invalidRecords.push({
          rowIndex: index + 1,
          missingFields: missingFields,
          record: item,
        });
        return;
      }

      const itemCategoryLower = String(item.Category).trim().toLowerCase();
      if (!allowedCategories.includes(itemCategoryLower)) {
        invalidRecords.push({
          rowIndex: index + 1,
          error: `Invalid Category "${item.Category}". Allowed: ${allowedCategories.join(", ")}`,
          record: item,
        });
        return;
      }

      const itemUOMLower = String(item.UnitOfMeasure).trim().toLowerCase();
      if (!allowedUOM.includes(itemUOMLower)) {
        invalidRecords.push({
          rowIndex: index + 1,
          error: `Invalid Unit Of Measure "${item.UnitOfMeasure}". Allowed: Hour, Unit`,
          record: item,
        });
        return;
      }

      if (
        item.VatableStatus !== undefined &&
        item.VatableStatus !== null &&
        item.VatableStatus !== ""
      ) {
        const itemVatableLower = String(item.VatableStatus)
          .trim()
          .toLowerCase();
        if (!allowedVatable.includes(itemVatableLower)) {
          invalidRecords.push({
            rowIndex: index + 1,
            error: `Invalid Is Vatable "${item.VatableStatus}". Allowed: TRUE, FALSE`,
            record: item,
          });
          return;
        }
      }

      if (item.CompanyName) {
        const itemCompanyLower = String(item.CompanyName).trim().toLowerCase();
        if (!allowedCompanies.includes(itemCompanyLower)) {
          invalidRecords.push({
            rowIndex: index + 1,
            error: `Invalid Company "${item.CompanyName}". Allowed: ${allowedCompanies.join(", ")}`,
            record: item,
          });
          return;
        }
      }
    });

    if (invalidRecords.length > 0) {
      const errorMessage = `Validation Error: The following rows have issues:\n\n${invalidRecords
        .slice(0, 5)
        .map((record) => {
          if (record.missingFields) {
            return `Row ${record.rowIndex}: Missing ${record.missingFields.join(", ")}`;
          } else {
            return `Row ${record.rowIndex}: ${record.error}`;
          }
        })
        .join(
          "\n",
        )}${invalidRecords.length > 5 ? `\n\n... and ${invalidRecords.length - 5} more rows` : ""}\n\nPlease check your file and ensure all values match the allowed lookup values.`;

      console.error("Validation Errors:", invalidRecords);
      alertify.alert("Validation Error", errorMessage);
      setIsBulkUploading(false);
      return;
    }

    const companyErrors = [];
    const formattedData = normalizedData.map((item, index) => {
      let companyId = parseInt(item.CompanyId) || 0;

      if (!companyId && item.CompanyName) {
        const matchedCompany = companyList?.find(
          (company) =>
            company.companyName?.toLowerCase().trim() ===
            String(item.CompanyName).toLowerCase().trim(),
        );
        companyId = matchedCompany?.id || 0;

        if (!matchedCompany) {
          companyErrors.push({
            rowIndex: index + 1,
            companyName: item.CompanyName,
          });
          console.warn(`Company not found for: ${item.CompanyName}`);
        }
      }

      return {
        ItemName: item.ItemName?.toString().trim(),
        ItemCode: item.ItemCode?.toString().trim(),
        Description: item.Description?.toString().trim(),
        Category: item.Category?.toString().trim(),
        Price: parseFloat(item.Price) || 0,
        UnitOfMeasure: item.UnitOfMeasure?.toString().trim(),
        CompanyId: companyId,
        VatableStatus:
          item.VatableStatus === true ||
          item.VatableStatus === "true" ||
          item.VatableStatus === "TRUE" ||
          item.VatableStatus === 1 ||
          String(item.VatableStatus).toLowerCase() === "true",
      };
    });

    if (companyErrors.length > 0) {
      const errorMessage = `Warning: The following companies were not found in the system:\n\n${companyErrors
        .slice(0, 5)
        .map((err) => `Row ${err.rowIndex}: "${err.companyName}"`)
        .join(
          "\n",
        )}${companyErrors.length > 5 ? `\n\n... and ${companyErrors.length - 5} more` : ""}\n\nAvailable companies: ${companyList?.map((c) => c.companyName).join(", ") || "None"
        }`;

      alertify.alert("Company Mapping Warning", errorMessage);
      return;
    }

    console.log("Formatted Data:", formattedData);

    try {
      const response = await AxiosInstance.post(
        "/api/InventoryItems/BulkUpload",
        formattedData,
      );
      console.log("API Response:", response);
      if (response.data.success) {
        alertify.alert("Success", "Bulk upload successful", function () {
          fetchItems();
        });
        fetchItems();
      } else {
        alertify.alert("Warning", response.data.message, function () {
          fetchItems();
        });
      }
    } catch (err) {
      console.error("API Error:", err.response?.data || err);
      if (err.response?.data?.errors) {
        const errorObj = err.response.data.errors;
        let errorMsg = "Upload failed with validation errors:\n\n";
        let errorCount = 0;
        for (let rowIndex in errorObj) {
          if (errorCount >= 3) {
            errorMsg += `\n... and more errors`;
            break;
          }
          const rowErrors = errorObj[rowIndex];
          if (Array.isArray(rowErrors)) {
            errorMsg += `Row ${parseInt(rowIndex) + 1}: ${rowErrors.join(", ")}\n`;
            errorCount++;
          }
        }
        alertify.alert("Validation Error", errorMsg);
        setIsBulkUploading(false);
      } else {
        alertify.alert(
          "Error",
          err.response?.data?.message || "Bulk upload failed",
        );
        setIsBulkUploading(false);
      }
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* ✅ LIST SCREEN */}
        {!showCreateScreen && !showEditScreen && (
          <div className="reports-section">
            <div className="list-header">
              <h2 className="page-title">Products</h2>
              <HoloButton
                variant="secondary"
                size="md"
                onClick={() => setShowHelp(true)}
              >
                <i className="fas fa-question-circle"></i> Help
              </HoloButton>
            </div>

            {/* Filters */}
            <div className="filter-section">
              <select
                name="CompanyId"
                value={tempFilters.CompanyId}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, CompanyId: e.target.value })
                }
                className="inventoryitem-input"
              >
                <option value="">Select Company</option>
                {companyList.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>

              <select
                name="Category"
                value={tempFilters.Category}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, Category: e.target.value })
                }
                className="inventoryitem-input"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={tempFilters.ItemName}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, ItemName: e.target.value })
                }
                placeholder="Item Name"
                className="inventoryitem-input"
              />
              <input
                type="text"
                value={tempFilters.itemCode}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, itemCode: e.target.value })
                }
                placeholder="Item Code"
                className="inventoryitem-input"
              />
              <select
                value={tempFilters.PriceRange}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, PriceRange: e.target.value })
                }
                className="inventoryitem-input"
              >
                <option value="">Select Price Range</option>
                <option value="under-100">Under 100</option>
                <option value="100-499">100 - 499</option>
                <option value="500-999">500 - 999</option>
                <option value="1000-4999">1,000 - 4,999</option>
                <option value="5000-plus">5,000 and above</option>
              </select>
              <HoloButton variant="primary" size="md" onClick={applyFilter}>
                Filter
              </HoloButton>
              <HoloButton
                variant="secondary"
                size="md"
                onClick={() => {
                  const clearedFilters = {
                    ItemName: "",
                    Description: "",
                    itemCode: "",
                    PriceRange: "",
                    Category: "",
                    CompanyId: "",
                  };
                  setTempFilters(clearedFilters);
                  setFilters(clearedFilters);
                  setCurrentPage(1);
                }}
              >
                Clear
              </HoloButton>
            </div>
            <div className="products-toolbar">
              <div className="products-actions">
                <HoloButton
                  variant="primary"
                  size="md"
                  onClick={() => setShowCreateScreen(true)}
                >
                  + Add New
                </HoloButton>

                <HoloButton
                  variant="secondary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBulkUploading}
                >
                  {isBulkUploading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      &nbsp;Uploading...
                    </>
                  ) : (
                    "Bulk Upload"
                  )}
                </HoloButton>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  style={{ display: "none" }}
                  onChange={handleBulkUpload}
                  disabled={isBulkUploading}
                />

                {!loading && (
                  <>
                    <HoloButton
                      variant="ghost"
                      size="md"
                      onClick={downloadTemplate}
                      disabled={isDownloadingTemplate}
                    >
                      {isDownloadingTemplate ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          &nbsp;Downloading...
                        </>
                      ) : (
                        "Download xl Template"
                      )}
                    </HoloButton>

                    <HoloButton
                      variant="ghost"
                      size="md"
                      onClick={downloadCsvTemplate}
                      disabled={isDownloadingCsvTemplate}
                    >
                      {isDownloadingCsvTemplate ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          &nbsp;Downloading...
                        </>
                      ) : (
                        "Download CSV Template"
                      )}
                    </HoloButton>
                  </>
                )}
              </div>

              <div className="records-per-page">
                <span>Records per page</span>
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="inventoryitem-input records-select"
                >
                  {[5, 10, 25].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th
                    onClick={() => requestSort("itemCode")}
                    style={{ cursor: "pointer" }}
                  >
                    ITEM CODE{" "}
                    {sortConfig.key === "itemCode"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : "↑"}
                  </th>
                  <th>ITEM NAME</th>
                  <th>COMPANY</th>
                  <th>CATEGORY</th>
                  <th
                    onClick={() => requestSort("description")}
                    style={{ cursor: "pointer" }}
                  >
                    DESCRIPTION{" "}
                    {sortConfig.key === "description"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>
                  {/* <th
                    onClick={() => requestSort("price")}
                    style={{ cursor: "pointer" }}
                  >
                    PRICE EXCL VAT{" "}
                    {sortConfig.key === "price"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th> */}

                  <th
                    onClick={() => requestSort("price")}
                    style={{ cursor: "pointer" }}requestSort 
                    title="Sort price"
                  >
                    PRICE EXCL VAT{" "}
                    <span style={{ marginLeft: "5px" }}>
                      {sortConfig.key === "price"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↑"}
                    </span>
                  </th>
                  <th
                    onClick={() => requestSort("price")}
                    style={{ cursor: "pointer" }}
                  >
                    IS VATABLE
                  </th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      <div className="loader"></div>
                    </td>
                  </tr>
                ) : sortedInvoices.length > 0 ? (
                 paginatedInvoices.map((invoice, idx) => (
                    <tr key={idx}>
                      <td>{invoice.itemCode}</td>
                      <td>{invoice.itemName}</td>
                      <td>
                        {invoice.companyName ||
                          companyList.find(
                            (company) =>
                              String(company.id) === String(invoice.companyId)
                          )?.companyName ||
                          "-"}
                      </td>
                      <td>{invoice.category}</td>
                      <td>{invoice.description}</td>
                      <td style={{ textAlign: "center" }}>{invoice.price}</td>
                      <td>
                        {invoice.vatableStatus === true ||
                          String(invoice.vatableStatus).toLowerCase() === "true" ? (
                          <FiCheck className="vatable-icon vatable-yes" />
                        ) : (
                          <FiX className="vatable-icon vatable-no" />
                        )}
                      </td>
                      <td>
                        <FaEdit
                          style={{ cursor: "pointer" }}
                          className="action-icon edit-icon"
                          title="Edit"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setEditItem({
                              Id: invoice.id,
                              ItemName: invoice.itemName,
                              Description: invoice.description,
                              Currency: invoice.currency,
                              PriceDisplay: invoice.price,
                              ItemCode: invoice.itemCode,
                              UnitOfMeasure: invoice.unitOfMeasure,
                              CompanyId: invoice.companyId ? parseInt(invoice.companyId).toString() : "",
                              VatableStatus: invoice.vatableStatus === true || String(invoice.vatableStatus).toLowerCase() === "true",
                              Status: invoice.status,
                              MeterTypeId: invoice.meterTypeId,
                              Category: invoice.category,
                              CreatedDate: invoice.createdDate,
                              CreatedBy: invoice.createdBy,
                            });
                            setShowEditScreen(true);
                          }}
                        />

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No result found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredInvoices.length}
              itemsPerPage={recordsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}


        {/* ✅ CREATE ITEM SCREEN */}
        {showCreateScreen && (
          <div className="create-item-section">
            <div className="create-item-box">
              <h3 className="role-title">Create New Item</h3>
              <form
                onSubmit={onSubmit}
                noValidate
                className="create-item-form-row"
              >
                <div className="formlabel-group">
                  <label>
                    Category<span className="required">*</span>
                  </label>
                  <select
                    name="Category"
                    value={newItem.Category}
                    onChange={handleInputChange}
                    className={`inventoryitem-input ${errors.Category ? "error-border" : ""}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((Category) => (
                      <option key={Category.name} value={Category.name}>
                        {Category.name}
                      </option>
                    ))}
                  </select>
                  {errors.Category && (
                    <p className="error-message">{errors.Category}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Item Name <span className="required">*</span>
                  </label>
                  {/* <input
                    type="text"
                    name="ItemName"
                    // placeholder="Item Name"
                    value={newItem.ItemName}
                    onChange={handleInputChange}
                    className={`inventoryitem-input ${errors.ItemName ? "error-border" : ""}`}
                  />
                  {errors.ItemName && <p className="error-message">{errors.ItemName}</p>} */}
                  <input
                    type="text"
                    name="ItemName"
                    value={newItem.ItemName}
                    onChange={(e) => {
                      const value = e.target.value;

                      setNewItem({
                        ...newItem,
                        ItemName: value,
                      });

                      if (!value.trim()) {
                        setErrors((prev) => ({
                          ...prev,
                          ItemName: "Item Name is required",
                        }));
                      }
                      else {
                        setErrors((prev) => ({
                          ...prev,
                          ItemName: "",
                        }));
                      }
                    }}
                    className={`inventoryitem-input ${errors.ItemName ? "error-border" : ""
                      }`}
                  />

                  {errors.ItemName && (
                    <p className="error-message">{errors.ItemName}</p>
                  )}
                </div>

                {newItem.ItemName?.trim().toLowerCase() === "meter" && (
                  <div className="formlabel-group">
                    <label>
                      Meter Type <span className="required">*</span>
                    </label>
                    <select
                      name="MeterTypeId"
                      value={newItem.MeterTypeId}
                      onChange={handleInputChange}
                      className={`inventoryitem-input ${errors.MeterTypeId ? "error-border" : ""}`}
                    >
                      <option value="">Select MeterType</option>
                      {meterType.map((meterType) => (
                        <option key={meterType.id} value={meterType.id}>
                          {meterType.type}
                        </option>
                      ))}
                    </select>
                    {errors.MeterTypeId && (
                      <p className="error-message">{errors.MeterTypeId}</p>
                    )}
                  </div>
                )}

                <div className="formlabel-group">
                  <label>
                    Item Code <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="ItemCode"
                    // placeholder="Item Code"
                    value={newItem.ItemCode}
                    onChange={handleInputChange}
                    className={`inventoryitem-input ${errors.ItemCode ? "error-border" : ""}`}
                  />
                  {errors.ItemCode && (
                    <p className="error-message">{errors.ItemCode}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Description <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="Description"
                    // placeholder="Description"
                    value={newItem.Description}
                    onChange={handleInputChange}
                    className={`inventoryitem-input ${errors.Description ? "error-border" : ""}`}
                  />
                  {errors.Description && (
                    <p className="error-message">{errors.Description}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Company Name <span className="required">*</span>
                  </label>
                  <select
                    name="CompanyId"
                    value={newItem.CompanyId}
                    onChange={handleInputChange}
                    className={`inventoryitem-input ${errors.CompanyId ? "error-border" : ""}`}
                  >
                    <option value="">Select Company</option>
                    {(companyList || []).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.CompanyId && (
                    <p className="error-message">{errors.CompanyId}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Price excl VAT <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="Price"
                    // placeholder="Price"
                    value={newItem.PriceDisplay}
                    onChange={(e) => {
                      let input = e.target.value;
                      input = input.replace(/[^0-9.,]/g, "");
                      const normalized = input.replace(",", ".");
                      const parsed = parseFloat(normalized);
                      setNewItem({
                        ...newItem,
                        PriceDisplay: input,
                        Price: isNaN(parsed) ? "" : Number(parsed.toFixed(2)),
                      });
                    }}
                    className={`inventoryitem-input ${errors.PriceDisplay ? "error-border" : ""}`}
                  />
                  {errors.PriceDisplay && (
                    <p className="error-message">{errors.PriceDisplay}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Unit Of Measure <span className="required">*</span>
                  </label>
                  <select
                    name="UnitOfMeasure"
                    value={newItem.UnitOfMeasure}
                    onChange={handleInputChange}
                    className={`inventoryitem-input ${errors.UnitOfMeasure ? "error-border" : ""}`}
                  >
                    <option value="">Select UOM</option>
                    <option value="Hour">Hour</option>
                    <option value="Unit">Unit</option>
                  </select>
                  {errors.UnitOfMeasure && (
                    <p className="error-message">{errors.UnitOfMeasure}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label
                    htmlFor="VatableStatus"
                    style={{ marginBottom: "-20px" }}
                  >
                    Is Vatable <span className="required">*</span>
                  </label>
                  <input
                    type="checkbox"
                    id="VatableStatus"
                    name="VatableStatus"
                    checked={newItem.VatableStatus}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setNewItem({
                        ...newItem,
                        VatableStatus: isChecked,
                        TaxRate: isChecked ? taxes.id : 0,
                      });
                    }}
                    style={{
                      marginBottom: "-15px",
                      marginLeft: "40%",
                      width: "15px",
                      height: "15px",
                    }}
                  />
                </div>


                <div className="Inventory-actions">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        &nbsp;Save
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-lg"
                    onClick={() => {
                      Cancel();
                      setErrors({});
                      setShowCreateScreen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ EDIT ITEM SCREEN */}
        {showEditScreen && selectedInvoice && (
          <div className="create-item-section">
            <div className="create-item-box">
              <h3 className="role-title">Edit Item</h3>
              <form onSubmit={handleEditItem} className="create-item-form-row">
                <div className="formlabel-group">
                  <label>
                    Category<span className="required">*</span>
                  </label>
                  {/* <select
                    value={editItem.Category}
                    onChange={handleEditChange}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select> */}
                  <select
                    name="Category"
                    value={editItem.Category || ""}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.Category ? "error-border" : ""
                      }`}
                  >
                    <option value="">Select Category</option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {editErrors.Category && (
                    <p className="error-message">
                      {editErrors.Category}
                    </p>
                  )}

                  {editErrors.Category && (
                    <p className="error-message">{editErrors.Category}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Item Name <span className="required">*</span>
                  </label>
                  {/* <input
                    type="text"
                    name="ItemName"
                    // placeholder="Item Name"
                    value={editItem.ItemName || ""}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.ItemName ? "error-border" : ""}`}
                  />
                  {editErrors.ItemName && <p className="error-message">{editErrors.ItemName}</p>} */}
                  <input
                    type="text"
                    name="ItemName"
                    value={editItem.ItemName || ""}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.ItemName ? "error-border" : ""
                      }`}
                  />

                  {editErrors.ItemName && (
                    <p className="error-message">{editErrors.ItemName}</p>
                  )}
                </div>

                {editItem.ItemName?.trim().toLowerCase() === "meter" && (
                  <div className="formlabel-group">
                    <label>
                      Meter Type <span className="required">*</span>
                    </label>
                    <select
                      name="MeterTypeId"
                      value={editItem.MeterTypeId}
                      onChange={handleEditChange}
                      className={`inventoryitem-input ${editErrors.MeterTypeId ? "error-border" : ""}`}
                    >
                      <option value="">Select MeterType</option>
                      {meterType.map((meterType) => (
                        <option key={meterType.id} value={meterType.id}>
                          {meterType.type}
                        </option>
                      ))}
                    </select>
                    {editErrors.MeterTypeId && (
                      <p className="error-message">{editErrors.MeterTypeId}</p>
                    )}
                  </div>
                )}

                <div className="formlabel-group">
                  <label>
                    Item Code <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="ItemCode"
                    // placeholder="Item Code"
                    value={editItem.ItemCode}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.ItemCode ? "error-border" : ""}`}
                  />
                  {editErrors.ItemCode && (
                    <p className="error-message">{editErrors.ItemCode}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Description <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="Description"
                    // placeholder="Description"
                    value={editItem.Description}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.Description ? "error-border" : ""}`}
                  />
                  {editErrors.Description && (
                    <p className="error-message">{editErrors.Description}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Company Name <span className="required">*</span>
                  </label>
                  <select
                    name="CompanyId"
                    value={editItem.CompanyId || ""}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.CompanyId ? "error-border" : ""}`}
                  >
                    <option value="">Select Company</option>
                    {(companyList || []).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                  {editErrors.CompanyId && (
                    <p className="error-message">{editErrors.CompanyId}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Price excl VAT<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="Price"
                    // placeholder="Price"
                    value={editItem.PriceDisplay}
                    onChange={(e) => {
                      let input = e.target.value;
                      input = input.replace(/[^0-9.,]/g, "");
                      const parts = input.split(/[.,]/);
                      if (parts.length > 2) {
                        input = parts[0] + "." + parts[1];
                      }
                      const normalized = input.replace(/,/g, ".");
                      const parsed = parseFloat(normalized);
                      setEditItem({
                        ...editItem,
                        PriceDisplay: input,
                        Price: isNaN(parsed) ? "" : Number(parsed.toFixed(2)),
                      });
                    }}
                    className={`inventoryitem-input ${editErrors.PriceDisplay ? "error-border" : ""}`}
                  />
                  {editErrors.PriceDisplay && (
                    <p className="error-message">{editErrors.PriceDisplay}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Unit of Measure <span className="required">*</span>
                  </label>
                  <select
                    name="UnitOfMeasure"
                    value={editItem.UnitOfMeasure}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.UnitOfMeasure ? "error-border" : ""}`}
                  >
                    <option value="">Select UOM</option>
                    <option value="Hour">Hour</option>
                    <option value="Unit">Unit</option>
                  </select>
                  {editErrors.UnitOfMeasure && (
                    <p className="error-message">{editErrors.UnitOfMeasure}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label
                    htmlFor="VatableStatus"
                    style={{ marginBottom: "-20px" }}
                  >
                    Is Vatable <span className="required">*</span>
                  </label>
                  <input
                    type="checkbox"
                    id="VatableStatus"
                    name="VatableStatus"

                    checked={
                      editItem.VatableStatus === true ||
                      String(editItem.VatableStatus).toLowerCase() === "true"
                    }
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEditItem({
                        ...editItem,
                        VatableStatus: isChecked,
                        TaxRate: isChecked ? taxes.id : 0,
                      });
                    }}
                    style={{
                      marginBottom: "-15px",
                      marginLeft: "40%",
                      width: "15px",
                      height: "15px",
                    }}
                  />
                </div>

                <input type="hidden" name="TaxRate" value={editItem.TaxRate} />

                <div className="formlabel-group">
                  <label>
                    Status <span className="required">*</span>
                  </label>
                  <select
                    name="Status"
                    value={editItem.Status}
                    onChange={handleEditChange}
                    className={`inventoryitem-input ${editErrors.Status ? "error-border" : ""}`}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {editErrors.Status && (
                    <p className="error-message">{editErrors.Status}</p>
                  )}
                </div>



                <div className="Inventory-actions">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        &nbsp;Update
                      </>
                    ) : (
                      "Update"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-lg"
                    onClick={() => setShowEditScreen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <HelpModal
          show={showHelp}
          title="Products - Help & Overview"
          screenName="Products"
          onClose={() => setShowHelp(false)}
        />
      </div>
    </div>
  );
};

export default InventoryItem;
