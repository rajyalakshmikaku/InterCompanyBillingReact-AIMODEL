import React, { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { read, utils } from 'xlsx';
import alertify from 'alertifyjs';
import { AxiosInstance } from '../../services/api';
import './BulkUploadHistoricalBacklog.css';
import axios from 'axios';
import { baseURL } from "../../services/api";


const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const UPLOAD_ENDPOINTS = [
  "/api/HistoricalBacklog/HistoricalBacklogBulkUpload",
];

const BulkUploadHistoricalBacklog = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const previewRows = useMemo(() => parsedRows.slice(0, 10), [parsedRows]);
  const previewColumns = useMemo(() => {
    if (!previewRows.length) return [];
    return Object.keys(previewRows[0]);
  }, [previewRows]);

  const validateFile = (file) => {
    if (!file) {
      throw new Error('Please select a file first.');
    }

    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new Error('Only .xlsx, .xls and .csv files are supported.');
    }
  };

  const parseFile = async (file) => {
    validateFile(file);

    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (result.errors?.length) {
        console.warn('CSV parse warnings:', result.errors);
      }

      return {
        rows: result.data || [],
        sheetNames: [],
        selectedSheet: '',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer, { type: 'array' });
    const workbookSheetNames = workbook.SheetNames || [];
    const firstSheetName = workbookSheetNames[0] || '';
    const selectedWorkbookSheet = workbook.Sheets[firstSheetName] || null;
    const rows = selectedWorkbookSheet
  ? utils.sheet_to_json(selectedWorkbookSheet, {
      range: 1,
      defval: ''
    })
  : [];

    return {
      rows,
      sheetNames: workbookSheetNames,
      selectedSheet: firstSheetName,
    };
  };

  const handleFileChange = async (event) => {
    debugger;
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setMessage('');
    setError('');
    setParsedRows([]);
    setSheetNames([]);
    setSelectedSheet('');

    try {
      const parsed = await parseFile(file);
      setParsedRows(parsed.rows);
      console.log(parsed.rows);
      setSheetNames(parsed.sheetNames);
      setSelectedSheet(parsed.selectedSheet);
      setMessage(`Loaded ${parsed.rows.length} row(s) from ${file.name}.`);
    } catch (err) {
      console.error('Failed to parse file:', err);
      setError(err.message || 'Unable to read the selected file.');
    }
  };

const excelDateToString = (excelDate) => {
  if (!excelDate || excelDate === "") return "";

  if (isNaN(excelDate)) return excelDate;

  const date = new Date((Number(excelDate) - 25569) * 86400 * 1000);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

 const submitUpload = async () => {
  debugger;
  if (!selectedFile) {
    alertify.alert("Error", "Please select a file.");
    return;
  }

  if (parsedRows.length === 0) {
    alertify.alert("Error", "No rows found.");
    return;
  }

  try {
    setIsUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();

    formData.append("sourceName", selectedFile.name);
    formData.append("sheetName", selectedSheet || "");
    formData.append("rowCount", parsedRows.length.toString());

    const mappedRows = parsedRows.map(r => ({
    From_Company_Name: r["From Company Name"],
    From_Address: r["From Address"],
    From_Phone_Number: r["From Phone Number"],
    From_Email: r["From Email"],
    From_VAT_Number: String(r["From VAT Number"] ?? ""),
    From_Registration_Number: String(r["From Registration Number"] ?? ""),

    To_Company_Name: r["To Company Name"],
    To_Address: r["To Address"],
    To_Phone_Number: r["To Phone Number"],
    To_Email: r["To Email"],
    To_VAT_Number: String(r["To VAT Number"] ?? ""),
    To_Registration_Number: String(r["To Registration Number"] ?? ""),

    Title: r["Title"],
    Name: r["Name"],
    Surname: r["Surname"],
    Email: r["Email"],
    Role: r["Role"],
    Gender: r["Gender"],
    Address: r["Address"],
    Mobile_Number: r["Mobile Number"],
    Username: r["Username"],

    Item_Name: r["Item Name"],
    Description: r["Description"],
    Currency: r["Currency"],
    Price: String(r["Price"] ?? ""),
    Unit_Rate_Per_Item: String(r["Unit Rate Per Item"] ?? ""),
    Quantity: String(r["Quantity"] ?? ""),
    Tax_Percentage: String(r["Tax Percentage"] ?? ""),

    Reference_Number: r["Reference Number"],
    Quotation_Date: excelDateToString(r["Quotation Date"]),
    QuotationType: r["QuotationType"],

    Bank_Account_Number: String(r["Bank Account Number"] ?? ""),
    Bank_Name: r["Bank Name"],
    Branch_Code: String(r["Branch Code"] ?? ""),
    Branch_Address: r["Branch Address"],
    Bank_Account_Holder_Name: r["Bank Account Holder Name"],

    Subtotal: String(r["Subtotal"] ?? ""),
    Tax_Amount: String(r["Tax Amount"] ?? ""),
    Total_Amount: String(r["Total Amount"] ?? ""),

    Invoice_Reference_Number: r["Invoice Reference Number"],
Invoice_Date: excelDateToString(r["Invoice Date"]),
    Payment_Terms: r["Payment Terms"]
}));

formData.append("rows", JSON.stringify(mappedRows));
    

    console.log("Rows:", JSON.stringify(parsedRows));
    console.log("Uploading...");

   const response = await AxiosInstance.post(
    "/api/HistoricalBacklog/HistoricalBacklogBulkUpload",
    formData,
    {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }
);

    console.log(response.data);

    setMessage(response.data.message);
    alertify.alert('Success',response.data.message);
  } catch (err) {
    console.log(err);

    if (err.response) {
      console.log("Status :", err.response.status);
      console.log("Data :", err.response.data);
      console.log("Headers :", err.response.headers);

      alertify.alert(
        "Error",
        JSON.stringify(err.response.data.message, null, 2)
      );
    } else {
      alertify.alert("Error", err.response.data.message);
    }
  } finally {
    setIsUploading(false);
  }
};

  return (
    <div className="bulk-upload-page">
      <div className="bulk-upload-card">
        <div className="bulk-upload-header">
          <div>
            {/* <p className="bulk-upload-eyebrow">General</p> */}
            <h2 className="bulk-upload-title">Historical Backlog Bulk Upload</h2>
            <p className="bulk-upload-description">
              Upload the invoice template Excel file to send the rows into the historical backlog import endpoint.
            </p>
          </div>
        </div>

        <div className="bulk-upload-panel">
          <div className="upload-zone">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              Choose file
            </button>
            <p className="upload-file-name">{selectedFile ? selectedFile.name : 'No file selected'}</p>
          </div>

          {sheetNames.length > 0 && (
            <div className="sheet-selector">
              <label htmlFor="sheet-name">Sheet</label>
              <select id="sheet-name" value={selectedSheet} onChange={(event) => setSelectedSheet(event.target.value)}>
                {sheetNames.map((sheetName) => (
                  <option key={sheetName} value={sheetName}>
                    {sheetName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bulk-upload-actions">
            <button type="button" className="submit-btn" onClick={submitUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload to historical backlog'}
            </button>
          </div>

          {message && <div className="bulk-upload-success">{message}</div>}
          {error && <div className="bulk-upload-error">{error}</div>}
        </div>

        {previewRows.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>Preview</h3>
              <span>{previewRows.length} row(s)</span>
            </div>
            <div className="preview-table-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    {previewColumns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rowIndex) => (
                    <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                      {previewColumns.map((column) => (
                        <td key={`${rowIndex}-${column}`}>{String(row[column] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadHistoricalBacklog;
