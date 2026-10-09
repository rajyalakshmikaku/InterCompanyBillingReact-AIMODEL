import React, { useState, useEffect } from "react";
import { AxiosInstance, baseURL } from "../../services/api";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import "./RejectedList.css";
import { FaEye, FaDownload } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchRejectedQuotationList } from "../../redux/receivingEntitiesSlice";
import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";
import Pagination from "../../components/Common/Pagination";
import HoloButton from "../../components/Common/HoloButton";
import { ViewPopup } from '../../components/Dashboard';
import { downloadPdfFromPage } from '../../components/Common/downloadPdf';
import {
  PaymentProofAction,
  usePaymentProofFiles,
} from '../../components/Common/PaymentProofFiles';
import { quotationStatusLabel, INVOICE_STAGES } from "../../utility/statusPipelines";

// The API takes one type per call, so both are fetched separately; the
// invoice terminal ("closed without a refund/credit note") status string
// comes from the shared pipeline definition rather than being duplicated here.
const INVOICE_CLOSED_DRILL_STATUS =
  INVOICE_STAGES.find((stage) => stage.key === "Order Completed")?.drillStatus;

const RejectedList = () => {
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { error, success } = useSelector((state) => state.receivingEntities);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [originalEditItem, setOriginalEditItem] = useState(null);
  const [recordsPerPage, setRecordsPerPage] = useState(5); // default page size
  const [currentPage, setCurrentPage] = useState(1);
  const companyList = useSelector((state) => state.Customers.companies);
  const [type, setType] = useState("");

  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewType, setViewType] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [invoiceDownloadLoadingId, setInvoiceDownloadLoadingId] = useState(null);


  const rejectedQuotationList = useSelector(
    (state) => state.receivingEntities.rejectedQuotationList
  );


  const handleViewClick = (item) => {
    setSelectedQuotation(item);
    setViewType(item.documentType);
    setShowModal(true);
  };

  const handleClosePopup = () => {
    setSelectedQuotation(null);
    setShowModal(false);
  };


  useEffect(() => {
    dispatch(
      fetchRejectedQuotationList({
        type: "Quotation",
        status: "Paid",
      })
    );

    dispatch(
      fetchRejectedQuotationList({
        type: "Invoice",
        status: "Order Completed",
      })
    );
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [recordsPerPage, rejectedQuotationList]);

  // Loaders
  // const [loading, setLoading] = useState(true); // for list fetch
  const [createLoading, setCreateLoading] = useState(false); // for create button
  const [updateLoading, setUpdateLoading] = useState(false); // for update button

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDeleteId, setCompanyToDeleteId] = useState(null);


  const { companies, loading } = useSelector(
    (state) => state.receivingEntities
  );

  const handleDownloadQuotation = async (
    quotationId,
    referenceNumber
  ) => {
    debugger
    try {
      setDownloadingId(quotationId);

      const url =
        `${window.location.origin}/QuotationTemplateModern?quotationId=${referenceNumber}&type=download`;


      await downloadPdfFromPage({
        url,
        fileName: `Quotation_${referenceNumber}.pdf`,
        elementSelector: ".cit-sheet",
      });
    } catch (error) {
      alertify.error("Failed to download quotation.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadInvoice = async (
    invoiceId,
    invoiceReferenceNumber
  ) => {
    try {
      debugger
      setInvoiceDownloadLoadingId(invoiceId);

      const url =
        `${window.location.origin}` +
        `/InvoiceTemplate?invoiceId=${invoiceId}&type=download`;

      await downloadPdfFromPage({
        url,
        fileName: `Invoice_${invoiceReferenceNumber}.pdf`,
        elementSelector: ".cit-sheet",
      });

    } catch (error) {

      console.log("Invoice Download Error", error);

      alertify.error("Failed to download invoice");

    } finally {

      // small delay so spinner is visible
      setTimeout(() => {
        setInvoiceDownloadLoadingId(null);
      }, 500);
    }
  };



  // When the user clicks the Delete
  const handleTriggerDelete = (id) => {
    setCompanyToDeleteId(id);
    setShowDeleteModal(true);
  };




  // Filters
  const [filters, setFilters] = useState({
    companyName: "",
    documentType: "",
    documentNumber: "",
    customerName: "",
  });

  const [tempFilters, setTempFilters] = useState({
    companyName: "",
    documentType: "",
    documentNumber: "",
    customerName: "",
  });

  const handleApplyFilters = () => {
    setFilters({
      companyName: tempFilters.companyName.trim(),
      documentType: tempFilters.documentType.trim(),
      documentNumber: tempFilters.documentNumber.trim(),
      customerName: tempFilters.customerName.trim(),
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const cleared = {
      companyName: "",
      documentType: "",
      documentNumber: "",
      customerName: "",
    };

    setTempFilters(cleared);
    setFilters(cleared);
    setCurrentPage(1);
  };


  const filteredData = (rejectedQuotationList || []).filter((row) => {
    const companyName = row.companyName || "";
    const documentType = row.documentType || "";
    const customerName = row.customerName || "";

    const documentNumber =
      row.documentType === "Quotation"
        ? row.quotationReferenceNumber || ""
        : row.invoiceReferenceNumber || "";

    return (
      companyName.toLowerCase().includes(filters.companyName.toLowerCase()) &&
      documentType.toLowerCase().includes(filters.documentType.toLowerCase()) &&
      documentNumber.toLowerCase().includes(filters.documentNumber.toLowerCase()) &&
      customerName.toLowerCase().includes(filters.customerName.toLowerCase())
    );
  });
  // --- Local sorting (replace useSort hook to remove dependency issues) ---
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // helper to convert values for comparison
  const _getComparable = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "number") return val;
    const n = Number(val);
    if (!Number.isNaN(n) && String(val).trim() !== "") return n;
    return String(val).toLowerCase();
  };

  // compute sortedData from filteredData + sortConfig
  const sortedData = React.useMemo(() => {
    const list = Array.isArray(filteredData) ? filteredData.slice() : [];

    if (!sortConfig.key) return list;

    const key = sortConfig.key;

    const compareRow = (a, b) => {
      // try exact key, then camel/lower/upper fallbacks
      const getValue = (obj) =>
        obj[key] ?? obj[key.charAt(0).toLowerCase() + key.slice(1)] ?? obj[key.charAt(0).toUpperCase() + key.slice(1)] ?? "";
      const aVal = _getComparable(getValue(a));
      const bVal = _getComparable(getValue(b));

      if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    };

    list.sort(compareRow);
    if (sortConfig.direction === "desc") list.reverse();
    return list;
  }, [filteredData, sortConfig]);

  const paginatedCustomers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return sortedData.slice(startIndex, startIndex + recordsPerPage);
  }, [sortedData, currentPage, recordsPerPage]);

  // const proofReferenceNumbers = (paginatedCustomers || [])
  //   .map((item) => {
  //     const referenceNumber =
  //       item?.documentType === "Invoice"
  //         ? item?.invoiceReferenceNumber || item?.quotationReferenceNumber
  //         : item?.quotationReferenceNumber || item?.invoiceReferenceNumber;
  //     return referenceNumber || "";
  //   })
  //   .filter(Boolean);

  const proofReferenceNumbers = Array.from(
  new Set(
    (paginatedCustomers || [])
      .flatMap((item) => [
        item?.invoiceReferenceNumber,
        item?.quotationReferenceNumber,
      ])
      .filter(Boolean)
      .map(String)
  )
);

  const { filesByRef: proofFilesByRef, loading: proofFilesLoading } =
    usePaymentProofFiles(proofReferenceNumbers);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* LIST SCREEN */}
        {!showCreateScreen && !showEditScreen && (
          <div className="reports-section">
            {/* <h2 style={{ color: 'rgb(61, 140, 79)' }}>Companies</h2> */}
            <div className="list-header">
              <h3 className="customer-title">Complete Order List</h3>
              <div className="qdb-page-header-right">
                <div className="qdb-type-toggle">

                </div>

                <HoloButton
                  variant="secondary"
                  size="md"
                  onClick={() => setShowHelp(true)}
                >
                  <i className="fas fa-question-circle"></i> Help
                </HoloButton>
              </div>
            </div>
            {/* Filters */}
            <div className="filter-section">

              <select
                value={tempFilters.documentType}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    documentType: e.target.value,
                  })
                }
              >
                <option value="">Type</option>
                <option value="quotation">Quotation</option>
                <option value="invoice">Invoice</option>
              </select>

              <input
                type="text"
                value={tempFilters.documentNumber}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, documentNumber: e.target.value })
                }
                placeholder="Document Number"
              />
              <select
                value={tempFilters.companyName}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, companyName: e.target.value })
                }
                className="form-control"
              >
                <option value="">Select Company </option>
                {companyList.map((company) => (
                  <option key={company.companyName} value={company.companyName}>
                    {company.companyName}
                  </option>
                ))}

              </select>
              <input
                type="text"
                value={tempFilters.customerName}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, customerName: e.target.value })
                }
                placeholder="Customer"
              />
              <HoloButton
                variant="primary"
                size="md"
                onClick={handleApplyFilters}
              >
                Filter
              </HoloButton>

              <HoloButton
                variant="secondary"
                size="md"
                onClick={() => {
                  const clearedFilters = {
                    companyName: "",
                    documentType: "",
                    documentNumber: "",
                    customerName: "",
                  };


                  setTempFilters(clearedFilters); setFilters(clearedFilters); setCurrentPage(1);
                }}
              >
                Clear
              </HoloButton>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "10px 0",
              }}
            >


              {/* Records per page */}
              <div className="records-per-page">
                Records per page:
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[2, 5, 10, 25].map((num) => (
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
                  <th onClick={() => requestSort("name")}>
                    TYPE {""}
                    {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
                  </th>
                  <th>DOCUMENT NUMBER</th>
                  <th>COMPLETED DATE</th>
                  <th>COMPANY</th>
                  <th>CUSTOMER</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      <div className="loader"></div>
                    </td>
                  </tr>
                ) : paginatedCustomers?.length > 0 ? (
                  paginatedCustomers.map((item, index) => (
                    <tr key={index}>

                      <td>
                        <span
                          className={`type-badge ${(item.documentType || "").toLowerCase()}`}

                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",

                          }}
                        >
                          {item.documentType}
                        </span>

                      </td>

                      <td>
                        {item.documentType === "Quotation"
                          ? item.quotationReferenceNumber
                          : item.invoiceReferenceNumber}
                      </td>
                      <td>
                        {item.rejectedDate
                          ? new Date(item.rejectedDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                          : "-"}
                      </td>
                      <td>{item.companyName}</td>
                      <td>{item.customerName}</td>
                      <td>{item.totalAmount}</td>
                      <td>

                        <span
                          className={`status-badge ${String(item.status || "")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {(item.documentType === "Quotation"
                            ? quotationStatusLabel(item.status)
                            : item.status) || "-"}
                        </span>
                      </td>

                      <td>
                        <FaEye
                          className="action-icon view-icon"
                          title="View"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleViewClick(item)}
                        />
                        {(
                          (item.documentType === "Quotation" &&
                            downloadingId === item.quotationId) ||
                          (item.documentType === "Invoice" &&
                            invoiceDownloadLoadingId === item.invoiceId)
                        ) ? (
                          <div
                            className="spinner"
                            style={{
                              width: "18px",
                              height: "18px",
                              display: "inline-block",
                            }}
                          ></div>
                        ) : (
                          <FaDownload
                            style={{
                              color: "#2563eb",
                              cursor: "pointer",
                            }}
                            className="action-icon download-icon"
                            onClick={() => {
                              if (item.documentType === "Quotation") {
                                handleDownloadQuotation(
                                  item.quotationId,
                                  item.quotationReferenceNumber
                                );
                              } else {
                                handleDownloadInvoice(
                                  item.invoiceId,
                                  item.invoiceReferenceNumber
                                );
                              }
                            }}
                            title="Download"
                          />
                        )}

<PaymentProofAction
  referenceNumber={
    item?.documentType === "Invoice"
      ? item?.invoiceReferenceNumber || item?.quotationReferenceNumber
      : item?.quotationReferenceNumber || item?.invoiceReferenceNumber
  }
  status={item?.status || ""}
  files={Array.from(
    new Map(
      [
        ...(proofFilesByRef[item?.invoiceReferenceNumber] || []),
        ...(proofFilesByRef[item?.quotationReferenceNumber] || []),
      ].map((file, fileIndex) => [
        file?.filePath || `${file?.fileName}-${fileIndex}`,
        file,
      ])
    ).values()
  )}
  loading={proofFilesLoading}
  subtitle={
    `${item?.documentType || "Document"} ${
      item?.documentType === "Invoice"
        ? item?.invoiceReferenceNumber ||
          item?.quotationReferenceNumber ||
          ""
        : item?.quotationReferenceNumber ||
          item?.invoiceReferenceNumber ||
          ""
    }`.trim()
  }
/>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      No Closed Quotations Found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination */}
            {!loading && paginatedCustomers.length > 0 && (

              <Pagination
                currentPage={currentPage}
                totalItems={sortedData.length}
                itemsPerPage={recordsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}

          </div>
        )}

        <ViewPopup
          show={showModal}
          onClose={handleClosePopup}
          selectedInvoice={selectedQuotation}
          type={viewType}
        />

        <HelpModal show={showHelp} title="Complete Order List - Help & Overview" screenName="CompleteOrderList" onClose={() => setShowHelp(false)} />

      </div>
    </div>
  );
};

export default RejectedList;