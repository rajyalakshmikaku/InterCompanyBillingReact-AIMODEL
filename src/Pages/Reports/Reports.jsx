import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import "./Reports.css";
import { AxiosInstance } from "../../services/api";
import { baseURL } from "../../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { SearchBar } from "../../components/Dashboard";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import HelpModal from "../../components/Common/HelpModal";
import Pagination from "../../components/Common/Pagination";
import useSort from "../../components/Common/useSort";
import { downloadPdfFromPage } from "../../components/Common/downloadPdf";
import { FaDownload, FaEye } from "react-icons/fa";
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import { MdOutlineReceiptLong } from "react-icons/md";
import { fetchCreditnotedetailswithInvoicerefno } from "../../redux/QuotationTemplateSlice";
import CreditNotePopup from "../../components/Dashboard/CreditNotePopup";
import { quotationRowStatus } from "../../utility/statusPipelines";

const Reports = () => {
  const dispatch = useDispatch();
  const [type, setType] = useState("Quotation");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Pagination states
  // const [currentPage, setCurrentPage] = useState(1);
  // const [recordsPerPage, setRecordsPerPage] = useState(5);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedServicerendered, setSelectedServicerendered] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch when type changes
  useEffect(() => {
    fetchData();
  }, [type]);

  useEffect(() => {
    if (!data) return;

    const search = searchTerm.trim().toLowerCase();

    const newFilteredData = data.filter((item) => {
      const safe = (val) => (val ? val.toString().toLowerCase() : "");

      if (type === "Quotation" || type === "Invoice") {
        return (
          safe(item.companyName || item.CompanyName).includes(search) ||
          safe(item.customerName || item.QuotationDate).includes(search) ||
          safe(item.quotationDate || item.CustomerName).includes(search) ||
          safe(item.invoiceDate || item.InvoiceDate).includes(search) ||
          safe(item.invoiceRefno || item.InvoiceRefno).includes(search) ||

          safe(item.refno || item.Refno).includes(search)
        );
      }

      if (type === "Users") {
        return (
          safe(item.userName || item.UserName).includes(search) ||
          safe(item.mobile || item.Mobile).includes(search) ||
          safe(item.address || item.Address).includes(search) ||

          safe(item.email || item.Email).includes(search)
        );
      }

      if (type === "Customers") {
        return (
          safe(item.customerName || item.CustomerName).includes(search) ||
          safe(item.customerPhone || item.CustomerPhone).includes(search) ||
          safe(item.customerAddress || item.CustomerAddress).includes(search) ||

          safe(item.customerEmail || item.CustomerEmail).includes(search)
        );
      }

      if (type === "Products") {
        return (
          safe(item.itemName || item.ItemName).includes(search) ||
          safe(item.quantity || item.quotationQuantity).includes(search) ||
          safe(item.unitPrice || item.Amount).includes(search) ||
          safe(item.itemCode || item.ItemCode).includes(search) ||
          safe(item.category || item.Category).includes(search) ||
          safe(item.description || item.Descrption).includes(search)
        );
      }

      return true;
    });

    // ✅ Only update if changed — avoids infinite re-render
    setFilteredData((prev) => {
      const isSame =
        prev.length === newFilteredData.length &&
        prev.every((v, i) => v === newFilteredData[i]);
      return isSame ? prev : newFilteredData;
    });

    setCurrentPage(1);
  }, [searchTerm, data, type]);

  // Fetch API data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.post(`/api/Reports/getReortsData?type=${type}`);
      const list = response?.data?.data || response?.data || [];
      console.log('Type List', list);
      setData(list);
      setFilteredData(list);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel dynamically by typepm
  const handleExportToExcel = () => {
    const exportData = filteredData.map(item => {
      switch (type) {
        case "Quotation":
          return {
            "Quotation Id": item.refno,
            "Quotation Date": item.quotationDate
              ? new Date(item.quotationDate).toLocaleDateString("en-GB")
              : "-",
            "Company Name": item.companyName || "-",
            "Company Email": item.companyEmail || "-",
            "Company Phone Number": item.companyPhoneNumber || "-",
            "Company Address": item.companyAddress || "-",
            "Company VAT Number": item.vatNumber || "-",
            "Company Registration Number": item.registrationNumber || "-",
            "Bank Account Number": item.bankAccountNumber || "-",
            "Branch Code": item.branchCode || "-",
            // "IFSC Code": item.ifscCode || "-",
            "Branch Address": item.branchAddress || "-",
            "Customer Name": item.customerName || "-",
            "Customer Email": item.customerEmail || "-",
            "Customer Phone": item.customerPhone || "-",
            "Customer Address": item.customerAddress || "-",
            "Currency": item.currency || "-",
            "Total Amount": item.totalAmount || 0,
          };
        case "Invoice":
          return {
            "Quotation Id": item.refno,
            "Invoice Id": item.invoiceRefno || "-",
            "Invoice Date": item.invoiceDate
              ? new Date(item.invoiceDate).toLocaleDateString("en-GB")
              : "-",
            "Company Name": item.companyName || "-",
            "Company Email": item.companyEmail || "-",
            "Company Phone Number": item.companyPhoneNumber || "-",
            "Company Address": item.companyAddress || "-",
            "Company VAT Number": item.vatNumber || "-",
            "Company Registration Number": item.registrationNumber || "-",
            "Bank Account Number": item.bankAccountNumber || "-",
            "Branch Code": item.branchCode || "-",
            // "IFSC Code": item.ifscCode || "-",
            "Branch Address": item.branchAddress || "-",

            "Customer Name": item.customerName || "-",
            "Customer Email": item.customerEmail || "-",
            "Customer Phone": item.customerPhone || "-",
            "Customer Address": item.customerAddress || "-",

            "Currency": item.currency || "-",
            "Total Amount": item.totalAmount || 0,
            "Status": item.invoiceStatus || "-"
          };
        case "Users":
          return {
            // "User ID": item.userId,
            "Title": item.title,
            "Name": item.name,
            "Surname": item.surName,
            "Username": item.userName,
            "Email": item.email,
            "Role": item.roleName,
            "Mobile": item.mobile,
            "Gender": item.gender,
            "Address": item.address,
            "Company": item.companyName

            // "Status": item.status
          };
        case "Customers":
          return {
            // "Customer ID": item.customerId,
            "Title": item.title,
            "Name": item.customerName,
            "Gender": item.gender,
            "Email": item.customerEmail,
            "Phone": item.customerPhone,
            "Address": item.customerAddress,
            "Customer Ref No": item.customerRefNo,
            "Company": item.companyName
          };
        case "Products":
          return {
            // "Item ID": item.itemId,
            "Item Code": item.itemCode,
            "Item Code": item.category,
            "Item Name": item.itemName,
            "Item Description ": item.description,
            "Company": item.companyName,
            "Price": item.unitPrice,
            // "Quantity": item.quantity,
            // "Discount": item.discount,
            "Unit of Measure": item.unitofMeasure,
            "Is Vatable": item.vatableStatus,
          };
        case "ServiceRendered":
          return {
            // "Item ID": item.itemId,
            "Name": item.name,
            "Description ": item.description,
            "Company": item.companyName,
            "Unit of Measure": item.unitOfMeasure,
            "Rate": item.rate,

          };
        default:
          return {};
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type);

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileName = `${type}_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  };
  const handleExportToPDF = () => {
    // ✅ Landscape mode for wide tables
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // ✅ Title
    doc.setFontSize(14);
    doc.text(`${type} Report`, 10, 35);

    let headers = [];
    let rows = [];

    switch (type) {
      case "Quotation":
        headers = [
          "Quotation Id",
          "Date",
          "Company Name",
          "Company Email",
          "Phone Number",
          "Company Address",
          "VAT Number",
          "Registration Number",
          "Account Number",
          "Branch Code",
          // "IFSC Code",
          "Branch Address",
          "Customer Name",
          "Customer Email",
          "Customer Phone",
          "Customer Address",
          "Total Amount",
        ];

        rows = filteredData.map((item) => [
          item.refno || "-",

          item.quotationDate
            ? new Date(item.quotationDate).toLocaleDateString("en-GB")
            : "-",
          item.companyName || "-",
          item.companyEmail || "-",
          item.companyPhoneNumber || "-",
          item.companyAddress || "-",
          item.vatNumber || "-",
          item.registrationNumber || "-",
          item.bankAccountNumber || "-",
          item.branchCode || "-",
          // item.ifscCode || "-",
          item.branchAddress || "-",
          item.customerName || "-",
          item.customerEmail || "-",
          item.customerPhone || "-",
          item.customerAddress || "-",
          item.totalAmount || 0,
        ]);
        break;

      case "Invoice":
        headers = [
          "Quotation Id",
          "Invoice Id",
          "Invoice Date",
          "Company Name",
          "Company Email",
          "Phone Number",
          "Company Address",
          "VAT Number",
          "Registration Number",
          "Account Number",
          "Branch Code",
          // "IFSC Code",
          "Branch Address",
          "Customer Name",
          "Customer Email",
          "Customer Phone",
          "Customer Address",
          "Total Amount",
          "Status",
        ];
        rows = filteredData.map((item) => [
          item.refno || "-",
          item.invoiceRefno || "-",
          item.invoiceDate
            ? new Date(item.invoiceDate).toLocaleDateString("en-GB")
            : "-",
          item.companyName || "-",
          item.companyEmail || "-",
          item.companyPhoneNumber || "-",
          item.companyAddress || "-",
          item.vatNumber || "-",
          item.registrationNumber || "-",
          item.bankAccountNumber || "-",
          item.branchCode || "-",
          // item.ifscCode || "-",
          item.branchAddress || "-",
          item.customerName || "-",
          item.customerEmail || "-",
          item.customerPhone || "-",
          item.customerAddress || "-",
          item.totalAmount || 0,
          item.invoiceStatus || "-",
        ]);
        break;

      case "Users":
        headers = ["Title", "Name", "Surname", "Username", "Email", "Role", "Mobile", "Gender", "Address", "Company"];
        rows = filteredData.map((item) => [
          item.title || "-",
          item.name || "-",
          item.surName || "-",
          item.userName || "-",
          item.email || "-",
          item.roleName || "-",
          item.mobile || "-",
          item.gender || "-",
          item.address || "-",
          item.companyName || "-",

        ]);
        break;

      case "Customers":
        headers = ["Title", "Reference No", "Name", "Email", "Phone", "Address", "Gender", "Company"];
        rows = filteredData.map((item) => [

          item.title || "-",
          item.customerRefNo || "-",
          item.customerName || "-",
          item.customerEmail || "-",
          item.customerPhone || "-",
          item.customerAddress || "-",
          item.gender || "-",
          item.companyName


        ]);
        break;

      case "Products":
        headers = ["Item Code", "Category", "Item Name", "Company Name", "Item Description", " Price", "Unit of Measure", "Is Vatable"];
        rows = filteredData.map((item) => [
          item.itemCode || "-",
          item.category || "-",
          item.itemName || "-",
          item.companyName || "-",
          item.description || "-",
          item.unitPrice || "-",
          item.unitofMeasure || "-",
          item.vatableStatus || "-",

        ]);
        break;

      default:
        break;
    }

    // ✅ Generate the table

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 60,
      theme: "grid",

      tableWidth: pageWidth - 20,
      margin: { left: 10, right: 10 },

      styles: {
        fontSize: 5.5,
        cellPadding: 1.5,
        overflow: "linebreak",
        halign: "left",
        valign: "middle",
      },

      headStyles: {
        fontSize: 5.5,
        fillColor: [46, 139, 87],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },

      alternateRowStyles: { fillColor: [245, 245, 245] },
    });





    doc.save(`${type}_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const [creditViewLoadingId, setCreditViewLoadingId] = useState(null);
  const [creditDownloadLoadingId, setCreditDownloadLoadingId] = useState(null);
  const [invoiceDownloadLoadingId, setInvoiceDownloadLoadingId] = useState(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [showCreditNotePopup, setShowCreditNotePopup] = useState(false);
  const creditNoteViewDetails = useSelector(
    (state) => state.quotationApprovalTemplate.creditNoteViewDetails
  );
  const handleCreditnoteClosePopup = () => {
    setShowCreditNotePopup(false);
    setSelectedCreditNote(null);
  };

  const handleCreditNoteViewClick = async (invoice) => {

    if (!invoice.invoiceRefno) return;

    try {

      setCreditViewLoadingId(invoice.invoiceId);

      const response = await dispatch(
        fetchCreditnotedetailswithInvoicerefno(
          invoice.invoiceRefno
        )
      ).unwrap();

      console.log("Credit Note Response", response);

      setSelectedCreditNote(response.list);

      setShowCreditNotePopup(true);

    } catch (error) {

      console.log("Error", error);

      alertify.alert("Error", error);

    } finally {

      setCreditViewLoadingId(null);

    }
  };
  const handleDownloadCreditNote = async (
    creditnoteId,
    CreditReferenceNumber
  ) => {
    debugger
    const url =
      `${window.location.origin}` +
      `/CreditNoteViewtemplate?creditNoteId=${creditnoteId}`;

    await downloadPdfFromPage({
      url,
      fileName: `CreditNote_${CreditReferenceNumber}.pdf`,
    });
  };
  const handleCreditNoteDownloadClick = async (
    invoiceReferenceNumber,
    invoiceId
  ) => {

    if (!invoiceReferenceNumber) return;

    try {

      setCreditDownloadLoadingId(invoiceId);

      const response = await dispatch(
        fetchCreditnotedetailswithInvoicerefno(
          invoiceReferenceNumber
        )
      ).unwrap();

      const data = response?.list || response;

      console.log("Download Data", data);

      await handleDownloadCreditNote(
        data?.creditnoteId,
        data?.referenceNumber
      );

    } catch (error) {

      console.log("Download Error", error);

      alertify.alert("Error", error);

    } finally {

      setCreditDownloadLoadingId(null);

    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);


  // Pagination logic
  const { sortedData, requestSort, sortConfig } = useSort(filteredData);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  const currentRecords = sortedData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);


  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // View modal
  // const handleViewClick = (item) => setSelectedItem(item);
  const handleViewClick = (item) => {
    setSelectedQuotation(item);
  };
  const handleClosePopup = () => setSelectedQuotation(null);
  const handleViewCustomer = (item) => {
    setSelectedItem(item);
  };
  const handleCloseCustomerPopup = () => setSelectedItem(null);
  const handleViewUser = (item) => {
    setSelectedUser(item);
  };
  const handleCloseUserPopup = () => setSelectedUser(null);

  const handleViewInventory = (item) => {
    setSelectedInventory(item);
  };
  const handleCloseInventoryPopup = () => setSelectedInventory(null);

  const handleViewServicerendered = (item) => {
    setSelectedServicerendered(item);
  };
  const handleCloseServicerenderedPopup = () => setSelectedServicerendered(null);


  const handleDownloadInvoice = async (
    invoiceId,
    invoiceReferenceNumber
  ) => {

    try {

      setInvoiceDownloadLoadingId(invoiceId);

      // allow spinner render
      await new Promise((resolve) => setTimeout(resolve, 300));

      const url =
        `${window.location.origin}` +
        `/InvoiceTemplate?invoiceId=${invoiceId}`;

      await downloadPdfFromPage({
        url,
        fileName: `Invoice_${invoiceReferenceNumber}.pdf`,
      });

      // keep spinner visible little longer
      await new Promise((resolve) => setTimeout(resolve, 1200));

    } catch (error) {

      console.log(error);

      alertify.error("Failed to download invoice");

    } finally {

      setInvoiceDownloadLoadingId(null);

    }
  };



  const handleDownloadQuotation = async (
    quotationId,
    referenceNumber
  ) => {

    debugger
    try {

      setDownloadingId(quotationId);

      // Allow UI render
      await new Promise((resolve) => setTimeout(resolve, 300));

      const url =
        `${window.location.origin}` +
        `/QuotationTemplateModern?quotationId=${quotationId}&type=download`;

      await downloadPdfFromPage({
        url,
        fileName: `Quotation_${referenceNumber}.pdf`,
      });

      // Keep loader visible slightly longer
      await new Promise((resolve) => setTimeout(resolve, 1500));

    } catch (error) {

      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to download quotation.";

      if (
        message ===
        "Quotation is older than 14 days and has expired."
      ) {
        alertify.error(
          "Quotation expired. PDF download is not allowed."
        );
      } else {
        alertify.error(message);
      }

    } finally {

      setDownloadingId(null);

    }
  };

  return (
    <div className="report-dashboard">
      <div className="list-header" style={{ marginTop: "20px" }}>
        <h2 className="report-dashboard-header">Reports</h2>
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <i className="fas fa-question-circle"></i> Help
        </button>

      </div>

      <div className="report-dashboard-header">
        <div className="header-actions" style={{ marginTop: "20px" }}>

          <label
            htmlFor="reportType"
            style={{
              display: "block",
              fontWeight: "600",
              color: "#333",
              marginBottom: "6px",
            }}
          >
            Report Type
          </label>

          <select
            id="reportType"
            value={type}
            onChange={(e) => {
              setType(e.target.value);     // update report type
              setSearchTerm("");           // clear search when type changes
            }}
            style={{
              width: "250px", // same width as Search box
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc", // no green border
              backgroundColor: "#fff",
              color: "#333",
              fontSize: "14px",
              height: "38px", // aligns vertically with input boxes
              outline: "none",
              boxShadow: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#888";
              e.target.style.boxShadow = "0 0 3px rgba(0,0,0,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccc";
              e.target.style.boxShadow = "none";
            }}
          >

            <option value="Users">Users</option>
            <option value="Customers">Customers</option>
            <option value="Products">Products</option>
            <option value="Quotation">Quotation</option>
            <option value="Invoice">Invoice</option>

          </select>

        </div>
      </div>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search..." />

      <div className="quotationtable-controls">
        <div className="records-per-page">
          Records per page:
          <select value={recordsPerPage} onChange={(e) => setRecordsPerPage(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div>
          <button onClick={handleExportToExcel} className="quotation-buttons">
            Export to Excel
          </button>
          <button onClick={handleExportToPDF} className="quotation-buttons" style={{ marginLeft: "10px" }}>
            Export to PDF
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="quotation-dashboard-table">
        <thead>
          {type === "Quotation" && (
            <tr>
              <th onClick={() => requestSort("refno")}>
                QUOTATION ID {""}
                {sortConfig.key === "refno" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
              </th>
              <th>DATE</th>
              <th>COMPANY</th>
              <th>CUSTOMER</th>
              <th>STATUS</th>
              <th>VIEW</th>
            </tr>
          )}
          {type === "Invoice" && (
            <tr>
              <th onClick={() => requestSort("refno")}>
                QUOTATION ID{""}
                {sortConfig.key === "refno" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
              </th>
              <th>INVOICE ID</th>
              <th>INVOICE DATE</th>
              <th>COMPANY</th>
              <th>CUSTOMER</th>
              <th>STATUS</th>
              <th>VIEW</th>
            </tr>
          )}
          {type === "Users" && (
            <tr>
              {/* <th>ID</th> */}
              <th onClick={() => requestSort("userName")}>
                USERNAME{""}
                {sortConfig.key === "userName" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
              </th>
              <th>COMPANY</th>
              <th>EMAIL</th>
              <th>PHONE NUMBER</th>
              <th>ADDRESS</th>

              <th>VIEW</th>
              {/* <th>STATUS</th> */}
            </tr>
          )}
          {type === "Customers" && (
            <tr>

              <th onClick={() => requestSort("customerName")}>
                NAME{""}
                {sortConfig.key === "customerName" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
              </th>
              <th>COMPANY</th>
              <th>EMAIL</th>
              <th>PHONE</th>
              <th>ADDRESS</th>
              <th>VIEW</th>
            </tr>
          )}
          {type === "Products" && (
            <tr>

              <th onClick={() => requestSort("itemName")}>
                ITEM CODE{""}
                {sortConfig.key === "itemName" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
              </th>
              <th>ITEM NAME</th>
              <th>CATEGORY</th>
              <th>ITEM DESCRIPTION</th>
              {/* <th>QUANTITY</th> */}
              <th>UNIT PRICE EXCL VAT</th>
              <th>VIEW</th>
            </tr>
          )}
          {type === "ServiceRendered" && (
            <tr>

              <th onClick={() => requestSort("name")}>
                NAME{""}
                {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
              </th>
              <th>DESCRIPTION</th>
              <th>COMPANY</th>
              <th>UNIT OF MEASURE</th>
              <th>RATE</th>
              <th>VIEW</th>
            </tr>
          )}
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="10" className="table-spinner">
                <div className="spinner"></div>
              </td>
            </tr>
          ) : currentRecords.length > 0 ? (
            currentRecords.map((item, index) => (
              <tr key={index}>
                {type === "Quotation" && (
                  <>
                    <td>{item.refno || item.Refno}</td>

                    <td>
                      {item.quotationDate
                        ? new Date(item.quotationDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        : "-"}


                    </td>
                    <td>{item.companyName || item.CompanyName}</td>
                    <td>{item.customerName || item.CustomerName}</td>
                    <td>
                      {/* Overdue comes off the due date, and Rejected reads
                          as Closed — both via the shared helper. */}
                      <span
                        className={`status-badge
                                            ${quotationRowStatus(item) === "Created" ? "status-created" : ""}
                                            ${quotationRowStatus(item) === "Approved" ? "status-paid" : ""}
                                            ${quotationRowStatus(item) === "Expired" ? "status-expired" : ""}
                                            ${quotationRowStatus(item) === "Overdue" ? "status-overdue" : ""}
                                            ${quotationRowStatus(item) === "Closed" ? "status-cancelled" : ""}
                                            ${quotationRowStatus(item) === "Updated" ? "status-updated" : ""}`}>
                        {quotationRowStatus(item)}
                      </span>
                    </td>
                    <td>
                      <div className="action-container">

                        <FaEye
                          className="action-icon view-icon"
                          onClick={() => handleViewClick(item)}
                          title="View Quotation Details"
                        />

                        <div
                          onClick={() =>
                            handleDownloadQuotation(
                              item.quotation,
                              item.refno
                            )
                          }
                          style={{
                            cursor:
                              downloadingId === item.quotation
                                ? "not-allowed"
                                : "pointer",
                            pointerEvents:
                              downloadingId === item.quotation
                                ? "none"
                                : "auto",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "18px",
                            minHeight: "18px",
                          }}
                        >
                          {downloadingId === item.quotation ? (
                            <div className="mini-spinner"></div>
                          ) : (
                            <FaDownload
                              className="action-icon download-icon"
                              title="Quotation Download"
                            />
                          )}
                        </div>

                      </div>
                    </td>
                  </>
                )}
                {type === "Invoice" && (
                  <>
                    <td>{item.refno}</td>
                    <td>{item.invoiceRefno}</td>

                    <td>
                      {item.invoiceDate
                        ? new Date(item.invoiceDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        : "-"}


                    </td>
                    <td>{item.companyName}</td>
                    <td>{item.customerName}</td>
                    <td>
                      <span
                        className={`status-badge 
                                            ${item.invoiceStatus === "Created" ? "status-created" : ""}
                                            ${item.invoiceStatus === "Order Completed" ? "status-ordercompleted" : ""}
                                            ${item.invoiceStatus === "Cancelled" ? "status-cancelled" : ""}
                                            ${item.invoiceStatus === "Credit note Created" ? "status-creditnote" : ""}`}>
                        {item.invoiceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-container">

                        {/* View Invoice */}
                        <FaEye
                          className="action-icon view-icon"
                          onClick={() => handleViewClick(item)}
                          title="View Invoice Details"
                        />

                        {/* Download Invoice */}
                        <div
                          onClick={() =>
                            handleDownloadInvoice(
                              item.invoiceId,
                              item.invoiceRefno
                            )
                          }
                          style={{
                            cursor:
                              invoiceDownloadLoadingId === item.invoiceId
                                ? "not-allowed"
                                : "pointer",
                            pointerEvents:
                              invoiceDownloadLoadingId === item.invoiceId
                                ? "none"
                                : "auto",
                          }}
                        >
                          {invoiceDownloadLoadingId === item.invoiceId ? (
                            <div className="mini-spinner"></div>
                          ) : (
                            <FaDownload
                              className="action-icon download-icon"
                              title="Invoice Download"
                            />
                          )}
                        </div>

                        {/* Credit Note Icons */}
                        {item.invoiceStatus === "Credit note Created" && (
                          <>
                            {/* View Credit Note */}
                            <div
                              onClick={() => handleCreditNoteViewClick(item)}
                              style={{
                                cursor:
                                  creditViewLoadingId === item.invoiceId
                                    ? "not-allowed"
                                    : "pointer",

                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {creditViewLoadingId === item.invoiceId ? (
                                <div className="mini-spinner"></div>
                              ) : (
                                <MdOutlineReceiptLong
                                  className="action-icon creditview-icon"
                                  title="View Credit Note Details"
                                />
                              )}
                            </div>

                            {/* Download Credit Note */}
                            <div
                              onClick={() =>
                                handleCreditNoteDownloadClick(
                                  item.invoiceRefno,
                                  item.invoiceId
                                )
                              }
                              style={{
                                cursor:
                                  creditDownloadLoadingId === item.invoiceId
                                    ? "not-allowed"
                                    : "pointer",

                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {creditDownloadLoadingId === item.invoiceId ? (
                                <div className="mini-spinner"></div>
                              ) : (
                                <FaDownload
                                  className="action-icon creditdownload-icon"
                                  title="Credit Note Download"
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}
                {type === "Users" && (
                  <>
                    {/* <td>{item.userId}</td> */}
                    <td>{item.userName}</td>
                    <td>{item.companyName}</td>
                    <td>{item.email}</td>
                    <td>{item.mobile
                    }</td>
                    <td>{item.address}</td>
                    <td>
                      <button onClick={() => handleViewUser(item)}>
                        <i className="fas fa-eye" style={{ color: "blue" }}></i>
                      </button>
                    </td>
                  </>
                )}
                {type === "Customers" && (
                  <>
                    {/* <td>{item.customerId}</td> */}
                    <td>{item.customerName}</td>
                    <td>{item.companyName}</td>
                    <td>{item.customerEmail}</td>
                    <td>{item.customerPhone}</td>
                    <td>{item.customerAddress}</td>

                    <td>
                      <button onClick={() => handleViewCustomer(item)}>
                        <i className="fas fa-eye" style={{ color: "blue" }}></i>
                      </button>
                    </td>
                  </>
                )}
                {type === "Products" && (
                  <>
                    {/* <td>{item.itemId}</td> */}
                    <td>{item.itemCode}</td>
                    <td>{item.itemName}</td>
                    <td>{item.category}</td>
                    <td>{item.description}</td>
                    {/* <td>{item.quantity}</td> */}
                    <td>{item.unitPrice}</td>
                    <td>
                      <button onClick={() => handleViewInventory(item)}>
                        <i className="fas fa-eye" style={{ color: "blue" }}></i>
                      </button>
                    </td>
                  </>
                )}
                {type === "ServiceRendered" && (
                  <>
                    {/* <td>{item.itemId}</td> */}
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>{item.companyName}</td>
                    <td>{item.unitOfMeasure}</td>
                    <td>{item.rate}</td>
                    <td>
                      <button onClick={() => handleViewServicerendered(item)}>
                        <i className="fas fa-eye" style={{ color: "blue" }}></i>
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="no-results">
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PAGINATION */}
      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredData.length}
        itemsPerPage={recordsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />



      {/* Modal */}
      {selectedQuotation && (
        <div className="quotation-view-overlay">
          <div className="quotation-view-modal">
            {/* <button onClick={handleClosePopup}>&times;</button> */}
            <button className="close-btn" onClick={handleClosePopup}>&times;</button>

            <h3 className="quotation-view-title">View  Details</h3>

            {/* ---------- Company Information ---------- */}
            <h4 className="quotation-view-section-title">Company Information</h4>
            <div className="quotation-view-info">
              <div className="company-logo">
                {selectedQuotation.comapanyLogo && (() => {
                  const logoFileName = selectedQuotation.comapanyLogo.split(/[/\\]/).pop();
                  console.log('logoFileName', logoFileName);
                  return (
                    <img
                      src={`${baseURL}/UploadedFiles/${logoFileName}`}
                      alt="Company Logo"
                      className="company-logo-corner"
                    />
                  );
                })()}
              </div>

              <div><span className="label">Company Name</span>:<span> {selectedQuotation.companyName}</span></div>
              <div><span className="label">Company Email</span>: <span>{selectedQuotation.companyEmail}</span></div>
              <div><span className="label">Phone Number</span>: <span> {selectedQuotation.companyPhoneNumber}</span></div>
              <div><span className="label">Company Address</span> :<span>{selectedQuotation.companyAddress}</span></div>
              <div><span className="label">VAT Number</span>:<span> {selectedQuotation.vatNumber}</span></div>
              <div><span className="label">Registration Number</span>:<span>{selectedQuotation.registrationNumber}</span> </div>
            </div>

            {/* ---------- Bank Info ---------- */}
            <h4 className="quotation-view-section-title">Bank Information</h4>
            <div className="quotation-view-info">
              <div><span className="label">Bank Account Number</span>: <span>{selectedQuotation.bankAccountNumber}</span></div>
              <div><span className="label">Branch Code</span>:<span> {selectedQuotation.branchCode}</span></div>
              {/* <div><span className="label">IFSC Code</span>:<span> {selectedQuotation.ifscCode}</span></div> */}
              <div><span className="label">Address</span>:<span> {selectedQuotation.branchAddress}</span></div>

              {/* ---------- Quotation Information ---------- */}
              <h4 className="quotation-view-section-title">Quotation Information</h4>
              <div className="quotation-view-info">
                <div><span className="label">Quotation Id</span>:<span> {selectedQuotation.refno}</span></div>
                <div><span className="label">Date</span>:<span>

                  {selectedQuotation?.quotationDate
                    ? (() => {
                      const d = new Date(selectedQuotation.quotationDate);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()
                    : "/"}
                </span></div>

                <div><span className="label">Currency</span>: <span>{selectedQuotation.currency}</span></div>
                <div><span className="label">Total Amount</span>:<span>{selectedQuotation.totalAmount || 0}</span></div>
                <div><span className="label">Status</span>:<span> {quotationRowStatus(selectedQuotation)}</span></div>

                {selectedQuotation.quotationStatus === "Rejected" && (

                  <div><span className="label">Address</span>:<span> {selectedQuotation.reason}</span></div>
                )}


              </div>
              {type === "Invoice" && (
                <>
                  <h4 className="quotation-view-section-title">Invoice Information</h4>
                  <div className="quotation-view-info">
                    <div><span className="label">Invoice Id</span>:<span>{selectedQuotation.invoiceRefno || "-"}</span></div>
                    <div><span className="label">Invoice Date</span>:<span>

                      {selectedQuotation?.invoiceDate
                        ? (() => {
                          const d = new Date(selectedQuotation.invoiceDate);
                          const day = String(d.getDate()).padStart(2, "0");
                          const month = String(d.getMonth() + 1).padStart(2, "0");
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()
                        : "/"}
                    </span></div>
                    <div><span className="label">Status</span>:<span> {selectedQuotation.invoiceStatus || "-"}</span></div>

                    {selectedQuotation.invoiceStatus === "Cancelled" && (
                      <div className="info-row">
                        <span className="label">Reason</span>
                        <span className="colon">:</span>
                        <span className="values" style={{ marginInlineStart: '0px' }}>{selectedQuotation.reason}</span>
                      </div>
                    )}
                  </div>
                </>
              )}


              {/* ---------- Quotation Details ---------- */}
              <h4 className="quotation-view-section-title">Quotation Details</h4>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>ITEM CODE</th>
                    <th>CATEGORY</th>
                    <th>NAME</th>
                    <th>QUANTITY</th>
                    <th>UNIT RATE EXCL VAT</th>
                    <th>AMOUNT</th>
                    <th>DISCOUNT</th>
                    <th>DISCOUNTED TOTAL</th>
                    <th>VAT %</th>
                    <th>NET AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedQuotation.details || []).map((d, idx) => (
                    <tr key={idx}>
                      <td className="desc">{d.itemCode}</td>
                      <td className="desc">{d.category}</td>
                      <td className="desc">{d.itemName}</td>
                      <td style={{ textAlign: 'right' }}>{d.quotationQuantity}</td>
                      <td style={{ textAlign: 'right' }}>{d.unitRate}</td>
                      <td style={{ textAlign: 'right' }}>{(d.quotationQuantity * d.unitRate)}</td>
                      <td style={{ textAlign: 'right' }}>{d.discount}</td>
                      <td style={{ textAlign: 'right' }}>{(d.quotationQuantity * d.unitRate) - (d.discount)}</td>
                      <td style={{ textAlign: 'right' }}>{d.tax}</td>
                      <td style={{ textAlign: 'right' }}>
                        {(
                          (d.quotationQuantity * d.unitRate - d.discount) +
                          ((d.quotationQuantity * d.unitRate - d.discount) * d.tax) / 100
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ---------- Customer Info ---------- */}
              <h4 className="quotation-view-section-title">Customer Information</h4>
              <div className="quotation-view-info">

                <div><span className="label">Company Name</span>:<span> {selectedQuotation.receivingEntity}</span></div>
                <div><span className="label">Name</span>:<span> {selectedQuotation.customerName}</span></div>
                <div><span className="label">Email</span>:<span> {selectedQuotation.customerEmail}</span></div>
                <div><span className="label">Address</span>:<span> {selectedQuotation.customerAddress}</span></div>
                {/* <div className="info-row">
                                <span className="label">Address</span>
                                <span className="colon">:</span>
                                <span className="values">{selectedQuotation.customerAddress}</span>
                            </div> */}
                <div><span className="label">Mobile Number</span>:<span>{selectedQuotation.customerPhone}</span></div>
                <div><span className="label">Payment Terms</span>:<span> {selectedQuotation.paymentTerms}</span></div>
              </div>
              <br />




            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="quotation-view-overlay">
          <div className="quotation-view-modal">
            <button className="close-btn" onClick={handleCloseCustomerPopup}>&times;</button>

            <h3 className="quotation-view-title">View Details</h3>


            <div className="quotation-view-info">
              <div className="row">
                <span className="label">Customer Ref No</span>:
                <span className="value">{selectedItem.customerRefNo}</span>
              </div>

              <div className="row">
                <span className="label">Title</span>:
                <span className="value">{selectedItem.title}</span>
              </div>

              <div className="row">
                <span className="label">Name</span>:
                <span className="value">{selectedItem.customerName}</span>
              </div>

              <div className="row">
                <span className="label">Gender</span>:
                <span className="value">{selectedItem.gender}</span>
              </div>

              <div className="row">
                <span className="label">Mobile</span>:
                <span className="value">{selectedItem.customerPhone}</span>
              </div>

              <div className="row">
                <span className="label">Email</span>:
                <span className="value">{selectedItem.customerEmail}</span>
              </div>

              <div className="row">
                <span className="label">Company</span>:
                <span className="value">{selectedItem.companyName}</span>
              </div>

              <div className="row">
                <span className="label">Address</span>:
                <span className="value address">
                  {selectedItem.customerAddress}
                </span>
              </div>
            </div>



          </div>
        </div>
      )}

      {showCreditNotePopup && selectedCreditNote && (
        <CreditNotePopup
          selectedCreditNote={selectedCreditNote}
          onClose={() => {
            setShowCreditNotePopup(false);
            setSelectedCreditNote(null);
          }}
        />
      )}


      {selectedUser && (
        <div className="quotation-view-overlay">
          <div className="quotation-view-modal">
            <button className="close-btn" onClick={handleCloseUserPopup}>&times;</button>

            {/* <button onClick={handleCloseCustomerPopup}>&times;</button> */}

            <h3 className="quotation-view-title">View  Details</h3>

            {/* ---------- Company Information ---------- */}
            <div className="quotation-view-info">
              <div className="row">
                <span className="label">Title</span>:
                <span className="value">{selectedUser.title}</span>
              </div>
              <div className="row">
                <span className="label">Name</span>:
                <span className="value">{selectedUser.name}</span>
              </div>
              <div className="row">
                <span className="label">Surname</span>:
                <span className="value">{selectedUser.surName}</span>
              </div>
              <div className="row">
                <span className="label">Username</span>:
                <span className="value">{selectedUser.userName}</span>
              </div>
              <div className="row">
                <span className="label">Email</span>:
                <span className="value">{selectedUser.email}</span>
              </div>
              <div className="row">
                <span className="label">Mobile</span>:
                <span className="value">{selectedUser.mobile}</span>
              </div>
              <div className="row">
                <span className="label">Gender</span>:
                <span className="value">{selectedUser.gender}</span>
              </div>
              <div className="row">
                <span className="label">Address</span>:
                <span className="value">{selectedUser.address}</span>
              </div>

              <div className="row">

                <span className="label">Role</span>:
                <span className="value">{selectedUser.roleName}</span>
              </div>
              <div className="row">

                <span className="label">Company</span>:
                <span className="value">{selectedUser.companyName}</span>
              </div>


            </div>






          </div>
        </div>
      )}
      {selectedServicerendered && (
        <div className="quotation-view-overlay">
          <div className="quotation-view-modal">
            <button className="close-btn" onClick={handleCloseServicerenderedPopup}>&times;</button>

            {/* <button onClick={handleCloseCustomerPopup}>&times;</button> */}

            <h3 className="quotation-view-title">View Details</h3>

            {/* ---------- Company Information ---------- */}
            <div className="quotation-view-info">
              <div><span className="label">Name</span>: {selectedServicerendered.name}</div>
              <div><span className="label">Decription</span>:{selectedServicerendered.description}</div>
              <div><span className="label">Company</span>:{selectedServicerendered.companyName}</div>
              <div><span className="label">Unit of Measure</span>:{selectedServicerendered.unitOfMeasure}</div>
              <div><span className="label">Rate</span>: {selectedServicerendered.rate}</div>

            </div>

          </div>
        </div>
      )}
      {selectedInventory && (
        <div className="quotation-view-overlay">
          <div className="quotation-view-modal">
            <button className="close-btn" onClick={handleCloseInventoryPopup}>&times;</button>

            {/* <button onClick={handleCloseCustomerPopup}>&times;</button> */}

            <h3 className="quotation-view-title">View Details</h3>

            {/* ---------- Company Information ---------- */}
            <div className="quotation-view-info">
              <div className="row">
                <span className="label">Item Code</span>:
                <span className="value">{selectedInventory.itemCode}</span>
              </div>
              <div className="row">
                <span className="label">Category</span>:
                <span className="value">{selectedInventory.category}</span>
              </div>
              <div className="row">
                <span className="label">Item Name</span>:
                <span className="value">{selectedInventory.itemName}</span>
              </div>
              <div className="row">
                <span className="label">Item Decription</span>:
                <span className="value">{selectedInventory.description}</span>
              </div>
              <div className="row">
                <span className="label">Price excl VAT</span>:
                <span className="value">{selectedInventory.unitPrice}</span>
              </div>
              <div className="row">
                <span className="label">Company Name</span>:
                <span className="value">{selectedInventory.companyName}</span>
              </div>
              <div className="row">
                <span className="label">Unit of Measure</span>:
                <span className="value">{selectedInventory.unitofMeasure}</span>
              </div>
              <div className="row">
                <span className="label">Is Vatable</span>:
                <span className="value">{selectedInventory.vatableStatus}</span>
              </div>


            </div>

          </div>
        </div>
      )}


      <HelpModal show={showHelp} title="Reports- Help & Overview" screenName="Reports" onClose={() => setShowHelp(false)} />

    </div>
  );
};

export default Reports;