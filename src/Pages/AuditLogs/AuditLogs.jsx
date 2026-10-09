import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  fetchAuditLogsWithFilter,
  clearAuditLogs,
  fetchAuditdetailswithId,
} from "../../redux/AuditSlice";
import "./AuditLogs.css";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import { baseURL } from "../../services/api";
import HelpModal from "../../components/Common/HelpModal";
import Pagination from "../../components/Common/Pagination";
import useSort from "../../components/Common/useSort";
import CommonDatePicker from "../../components/Common/CommonDatePicker";
import dayjs from "dayjs";
import { FaEye } from "react-icons/fa";
import HoloButton from "../../components/Common/HoloButton";
import { quotationStatusLabel } from "../../utility/statusPipelines";
import {
  PaymentProofList,
  fetchPaymentFiles,
  hasPaymentProofStatus,
} from "../../components/Common/PaymentProofFiles";
const AuditLogs = () => {
  const dispatch = useDispatch();
  const [showHelp, setShowHelp] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [paymentFiles, setPaymentFiles] = useState([]);
  const [paymentFilesLoading, setPaymentFilesLoading] = useState(false);

  const {
    Details = [],
    auditLogs = [],
    Users = [],
    loading,
    error,
  } = useSelector((state) => state.audit);

  // Fetch users on mount
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Pagination & filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    userId: "",
    ScreenName: "",
    fromDate: "",
    toDate: "",
  });
  useEffect(() => {
    dispatch(clearAuditLogs());
    setHasSearched(false);
    setCurrentPage(1);
  }, [
    filters.userId,
    filters.ScreenName,
    filters.fromDate,
    filters.toDate,
    dispatch,
  ]);

  useEffect(() => {
    return () => {
      dispatch(clearAuditLogs());
    };
  }, [dispatch]);

  const [selectedItem, setSelectedItem] = useState(null);

  const handleFilterSubmit = () => {
    debugger;
    if (!filters.userId) {
      alertify.alert("warning", "Please select options to filter.");
      return;
    }
    setHasSearched(true);
    dispatch(
      fetchAuditLogsWithFilter({
        user: filters.userId,
        ScreenName: filters.ScreenName,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
    );
    setCurrentPage(1);
  };

  // 🟣 Pagination logic (client-side)

  const { sortedData, requestSort, sortConfig } = useSort(auditLogs);
  const itemsPerPage = 5;
  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(
    indexOfFirstRecord,
    indexOfLastRecord,
  );
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleFilterChange = (eOrDate, fieldName) => {
    if (fieldName) {
      // Called from DatePicker, eOrDate is dayjs object
      setFilters((prev) => ({
        ...prev,
        [fieldName]:
          eOrDate && eOrDate.isValid?.() ? eOrDate.format("YYYY-MM-DD") : "",
      }));
    } else if (eOrDate?.target) {
      // Called from select/input, eOrDate is event
      const { name, value } = eOrDate.target;
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      // Defensive fallback — do nothing or log
      console.warn("Unhandled onChange argument", eOrDate);
    }
  };

  const handleRecordsChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCloseModal = () => setSelectedItem(null);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };


  const handleViewClick = async (item) => {
    debugger;

    try {
      const response = await dispatch(
        fetchAuditdetailswithId({
          ScreenName: item.table,
          Id: item.id,
          Refno: item.refno,
        })
      ).unwrap();

      console.log("API Response:", response);

      const objectData = response?.objectdata || {};

      const header = objectData?.header || {};
      const details = objectData?.details || [];

      // Convert PascalCase -> camelCase
      const toCamelCase = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(toCamelCase);
        }

        if (obj !== null && typeof obj === "object") {
          return Object.keys(obj).reduce((result, key) => {
            const camelKey =
              key.charAt(0).toLowerCase() + key.slice(1);

            result[camelKey] = toCamelCase(obj[key]);

            return result;
          }, {});
        }

        return obj;
      };

      const camelHeader = toCamelCase(header);
      const camelDetails = toCamelCase(details);

      console.log("Camel Header:", camelHeader);
      console.log("Camel Details:", camelDetails);

      const selectedData = {
        screenname: response?.screenname || item.table,
        ...camelHeader,
        details: camelDetails,
      };

      console.log("Final Selected Item:", selectedData);

      setSelectedItem(selectedData);

    } catch (err) {
      console.error("Error fetching audit details:", err);
    }
  };

  const totalAmount = selectedItem
    ? (selectedItem.details || []).reduce((sum, d) => {
      const quantity = Number(d.quotationQuantity) || 0;
      const rate = Number(d.unitRate) || 0;
      const discount = Number(d.discount) || 0;
      const tax = Number(d.tax) || 0;

      const baseAmount = quantity * rate;
      const discountedAmount = baseAmount - discount;
      const netAmount = discountedAmount + (discountedAmount * tax) / 100;

      return sum + netAmount;
    }, 0)
    : 0;

  return (
    <div className="Auditlog-container">
      <div className="list-header">
        <h2 className="Auditlogheading">Audit Logs</h2>

        <HoloButton
          variant="secondary"
          size="md"
          onClick={() => setShowHelp(true)}
        >
          <i className="fas fa-question-circle"></i> Help
        </HoloButton>
      </div>
      {/* 🔍 Filter Section */}
      <div className="filter-section">
        <select
          name="userId"
          value={filters.userId}
          onChange={handleFilterChange}
        >
          <option value="">Select User</option>
          {Users.map((user) => (
            <option key={user.email} value={user.email}>
              {user.email}
            </option>
          ))}
        </select>
        <select
          name="ScreenName"
          value={filters.ScreenName}
          onChange={handleFilterChange}
        >
          <option value="">Select Screen</option>
          <option value="Roles">Roles</option>
          <option value="Customers">Customers</option>
          <option value="Companies">Companies</option>
          <option value="Products">Products</option>
          {/* <option value="Service Rendered">Service Rendered</option> */}
          <option value="Quotation">Quotation</option>
          <option value="Invoice">Invoice</option>
        </select>

        {/* <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleFilterChange}
        /> */}
        <CommonDatePicker
          value={filters.fromDate}
          onChange={(newDate) => handleFilterChange(newDate, "fromDate")}
          className="common-input"
          label="Start Date"
          placeholder="From Date"
        />

        <CommonDatePicker
          value={filters.toDate}
          onChange={(newDate) => handleFilterChange(newDate, "toDate")}
          className="common-input"
          label="End Date"
          placeholder="To Date"
        />

        {/* <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
        /> */}

        <HoloButton variant="primary" size="md" onClick={handleFilterSubmit}>
          <i className="fas fa-filter"></i> Filter
        </HoloButton>

        <HoloButton
          variant="secondary"
          size="md"
          onClick={() => {
            setFilters({
              userId: "",
              ScreenName: "",
              fromDate: "",
              toDate: "",
            });
            setCurrentPage(1);
          }}
        >
          <i className="fas fa-times-circle"></i> Clear
        </HoloButton>
      </div>

      {/* 🧾 Records per page */}
      <div className="pagination-controls">
        <label>Records per page &nbsp;</label>
        <select value={recordsPerPage} onChange={handleRecordsChange}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* 🧾 Audit Logs Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("table")}>
              SCREEN{" "}
              {sortConfig.key === "table"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : "↑"}
            </th>
            <th>ACTION</th>
            <th>ACTION DATE</th>
            <th>DETAILS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center" }}>
                <div className="loader"></div>
              </td>
            </tr>
          ) : currentRecords.length > 0 ? (
            currentRecords.map((item, index) => (
              <tr key={index}>
                <td>{item.table}</td>
                <td>{item.action}</td>
                <td>
                  {new Date(item.actionDate).toLocaleString("en-GB", {
                    hour12: false,
                  })}
                </td>
                <td>

                  <FaEye
                    style={{ cursor: "pointer" }}
                    className="action-icon view-icon"
                    onClick={() => handleViewClick(item)}
                    title="View Details"
                  />
                </td>
              </tr>
            ))
          ) : filters.userId || filters.fromDate || filters.toDate ? (
            <tr>
              <td
                colSpan="4"
                className="no-records"
                style={{ textAlign: "center", fontStyle: "normal" }}
              >
                No records found.
              </td>
            </tr>
          ) : (
            <tr>
              <td
                colSpan="4"
                className="no-records"
                style={{
                  textAlign: "center",
                  fontStyle: "normal",
                  color: "green",
                }}
              >
                Search with filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!loading && auditLogs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={auditLogs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal for Audit Details */}
      {selectedItem && (
        <div className="auditlog-modal-overlay">
          <div className="auditlog-modal">
            <div className="audit-view-header">
              <h3 className="audit-view-title">View Details </h3>
              <button
                className="audit-view-close-btn"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Quotation Details */}
            {(selectedItem.screenname === "Quotation" ||
              selectedItem.screenname === "Invoice") && (
                <>
                  <div className="vp-section">
                    <h4 className="auditlog-view-section-title">
                      Company Information
                    </h4>
                    <div className="auditlog-view-info">
                      {selectedItem.filename && (

                        <img
                          src={`${baseURL}/UploadedFiles/${selectedItem.filename}`}
                          alt="Company Logo"
                          className="company-logo-corner"
                          onError={(e) => {
                            console.log(e.target.src);
                            e.target.src = "/images/default-company.png";
                          }}
                        />
                      )}

                      {selectedItem.companyName && (
                        <div className="auditlog-info-row">
                          <span className="label">Company Name</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.companyName}
                          </span>
                        </div>
                      )}
                      {selectedItem.companyEmail && (
                        <div className="auditlog-info-row">
                          <span className="label">Company Email</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.companyEmail}
                          </span>
                        </div>
                      )}
                      {selectedItem.companyPhoneNumber && (
                        <div className="auditlog-info-row">
                          <span className="label">Phone Number</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.companyPhoneNumber}
                          </span>
                        </div>
                      )}
                      {selectedItem.companyAddress && (
                        <div className="auditlog-info-row">
                          <span className="label">Company Address</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.companyAddress}
                          </span>
                        </div>
                      )}
                      {selectedItem.vatNumber && (
                        <div className="auditlog-info-row">
                          <span className="label">VAT Number</span>
                          <span className="colon">:</span>
                          <span className="value">{selectedItem.vatNumber}</span>
                        </div>
                      )}
                      {selectedItem.registrationNumber && (
                        <div className="auditlog-info-row">
                          <span className="label">Registration Number</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.registrationNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="vp-section">
                    <h4 className="auditlog-view-section-title">
                      Bank Information
                    </h4>
                    <div className="auditlog-view-info">
                      {selectedItem.bankName && (
                        <div className="auditlog-info-row">
                          <span className="label">Bank Name</span>
                          <span className="colon">:</span>
                          <span className="value">{selectedItem.bankName}</span>
                        </div>
                      )}
                      {selectedItem.branchCode && (
                        <div className="auditlog-info-row">
                          <span className="label">Branch Code</span>
                          <span className="colon">:</span>
                          <span className="value">{selectedItem.branchCode}</span>
                        </div>
                      )}

                      {selectedItem.accountHolderName && (
                        <div className="auditlog-info-row">
                          <span className="label">Account Holder Name</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.accountHolderName}
                          </span>
                        </div>
                      )}

                      {selectedItem.bankAccountNumber && (
                        <div className="auditlog-info-row">
                          <span className="label">Bank Account Number</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.bankAccountNumber}
                          </span>
                        </div>
                      )}

                      {/* <div className="auditlog-info-row">
                  <span className="label">IFSC Code</span>
                  <span className="colon">:</span>
                  <span className="value">{selectedItem.ifscCode || "-"}</span>
                </div> */}

                      {selectedItem.branchAddress && (
                        <div className="auditlog-info-row">
                          <span className="label">Address</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.branchAddress}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItem.screenname === "Quotation" && (
                    <>
                      <div className="vp-section">
                        <h4 className="auditlog-view-section-title">
                          Quotation Information
                        </h4>
                        {selectedItem.companyLogo && (

                        <img
                          src={`${baseURL}/UploadedFiles/${selectedItem.companyLogo}`}
                          alt="Company Logo"
                          className="company-logo-corner"
                          onError={(e) => {
                            console.log(e.target.src);
                            e.target.src = "/images/default-company.png";
                          }}
                        />
                      )}
                        <div className="auditlog-view-info">
                          {selectedItem.refno && (
                            <div className="auditlog-info-row">
                              <span className="label">Quotation Id</span>
                              <span className="colon">:</span>
                              <span className="value">{selectedItem.refno}</span>
                            </div>
                          )}

                          {selectedItem.quotationDate && (
                            <div className="auditlog-info-row">
                              <span className="label">Date</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {(() => {
                                  const d = new Date(selectedItem.quotationDate);
                                  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                                })()}
                              </span>
                            </div>
                          )}

                          {selectedItem.quotationStatus && (
                            <div className="auditlog-info-row">
                              <span className="label">Status</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {quotationStatusLabel(selectedItem.quotationStatus)}
                              </span>
                            </div>
                          )}

                          {/* {selectedItem.currency && (
                          <div className="auditlog-info-row">
                            <span className="label">Currency</span>
                            <span className="colon">:</span>
                            <span className="value">
                              {selectedItem.currency}
                            </span>
                          </div>
                        )} */}

                          <div className="auditlog-info-row">
                            <span className="label">Due Date</span>
                            <span className="colon">:</span>
                            <span className="value">
                              {selectedItem.dueDate
                                ? (() => {
                                  try {
                                    const d = new Date(selectedItem.dueDate);
                                    if (isNaN(d.getTime())) return "Invalid Date";
                                    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                                  } catch (e) {
                                    return selectedItem.dueDate;
                                  }
                                })()
                                : "-"}
                            </span>
                          </div>

                          {selectedItem.quotationType && (
                            <div className="auditlog-info-row">
                              <span className="label">Type</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {selectedItem.quotationType}
                              </span>
                            </div>
                          )}

                          <div className="auditlog-info-row">
                            <span className="label">Total Amount</span>
                            <span className="colon">:</span>
                            <span className="value">{totalAmount || 0}</span>
                          </div>

                          {selectedItem.quotationStatus === "Rejected" && (
                            <div className="auditlog-info-row">
                              <span className="label">Reason</span>
                              <span className="colon">:</span>
                              <span className="value">{selectedItem.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedItem.screenname === "Invoice" && (
                    <>
                      <h4 className="auditlog-view-section-title">
                        Quotation Information
                      </h4>
                       {selectedItem.companyLogo && (

                        <img
                          src={`${baseURL}/UploadedFiles/${selectedItem.companyLogo}`}
                          alt="Company Logo"
                          className="company-logo-corner"
                          onError={(e) => {
                            console.log(e.target.src);
                            e.target.src = "/images/default-company.png";
                          }}
                        />
                      )}
                      <div className="vp-section">
                        <div className="auditlog-view-info">
                          {selectedItem.referenceNumber && (
                            <div className="auditlog-info-row">
                              <span className="label">Quotation Id</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {selectedItem.referenceNumber}
                              </span>
                            </div>
                          )}

                          {selectedItem.quotationDate && (
                            <div className="auditlog-info-row">
                              <span className="label">Quoation Date</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {(() => {
                                  const d = new Date(selectedItem.quotationDate);
                                  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                                })()}
                              </span>
                            </div>
                          )}
                          {selectedItem.quotationStatus && (
                            <div className="auditlog-info-row">
                              <span className="label">Quotation Status</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {quotationStatusLabel(selectedItem.quotationStatus)}
                              </span>
                            </div>
                          )}

                          {/* {selectedItem.currency && (
                          <div className="auditlog-info-row">
                            <span className="label">Currency</span>
                            <span className="colon">:</span>
                            <span className="value">
                              {selectedItem.currency}
                            </span>
                          </div>
                        )} */}


                          {selectedItem.quotationType && (
                            <div className="auditlog-info-row">
                              <span className="label">Type</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {selectedItem.quotationType}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="vp-section">
                        <h4 className="auditlog-view-section-title">
                          Invoice Information
                        </h4>
                        <div className="auditlog-view-info">
                          {selectedItem.invoiceReferenceNumber && (
                            <div className="auditlog-info-row">
                              <span className="label">Invoice Id</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {selectedItem.invoiceReferenceNumber}
                              </span>
                            </div>
                          )}

                          {selectedItem.invoiceDate && (
                            <div className="auditlog-info-row">
                              <span className="label">Invoice Date</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {(() => {
                                  const d = new Date(selectedItem.invoiceDate);
                                  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                                })()}
                              </span>
                            </div>
                          )}
                          {selectedItem.invoiceStatus && (
                            <div className="auditlog-info-row">
                              <span className="label">Invoice Status</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {selectedItem.invoiceStatus}
                              </span>
                            </div>
                          )}

                          {selectedItem.dueDate && (
                            <div className="auditlog-info-row">
                              <span className="label">Due Date</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {(() => {
                                  const d = new Date(selectedItem.dueDate);
                                  if (isNaN(d.getTime())) return "-";

                                  return `${String(d.getDate()).padStart(2, "0")}/${String(
                                    d.getMonth() + 1
                                  ).padStart(2, "0")}/${d.getFullYear()}`;
                                })()}
                              </span>
                            </div>
                          )}

                          {selectedItem.totalAmount && (
                            <div className="auditlog-info-row">
                              <span className="label">Total</span>
                              <span className="colon">:</span>
                              <span className="value">
                                {selectedItem.totalAmount}
                              </span>
                            </div>
                          )}
                          {selectedItem.invoiceStatus === "Cancelled" && (
                            <div className="auditlog-info-row">
                              <span className="label">Reason</span>
                              <span className="colon">:</span>
                              <span className="value">{selectedItem.reason}</span>
                            </div>
                          )}
                          {/* 
 {(selectedItem.invoiceStatus ===
                            "Refunded" ||selectedItem.invoiceStatus === "Closed") && (
                              <>
                                <h4 className="auditlog-view-section-title">
                                 Proof of Payment Information
                                </h4>

                                {selectedItem.filename && (

                        <img
                          src={`${baseURL}/PaymentUploads/${selectedItem.filename}`}
                          alt="Company Logo"
                          className="company-logo-corner"
                          onError={(e) => {
                            console.log(e.target.src);
                            e.target.src = "/images/default-company.png";
                          }}
                        />
                      )}


                                

                               
                              </>
                            )} */}



                          {selectedItem.invoiceStatus ===
                            "Credit note Created" && (
                              <>
                                <h4 className="auditlog-view-section-title">
                                  Credit Note Information
                                </h4>

                                {selectedItem.creditReferenceNumber && (
                                  <div className="auditlog-info-row">
                                    <span className="label">CreditNote Id</span>
                                    <span className="colon">:</span>
                                    <span className="value">
                                      {selectedItem.creditReferenceNumber}
                                    </span>
                                  </div>
                                )}

                                {selectedItem.creditNoteDate && (
                                  <div className="auditlog-info-row">
                                    <span className="label">Date</span>
                                    <span className="colon">:</span>
                                    <span className="value">
                                      {(() => {
                                        const d = new Date(
                                          selectedItem.creditNoteDate,
                                        );
                                        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                                      })()}
                                    </span>
                                  </div>
                                )}

                                {/* {selectedItem.dueDate && (
                                  <div className="auditlog-info-row">
                                    <span className="label">Due Date</span>
                                    <span className="colon">:</span>
                                    <span className="value">
                                      {(() => {
                                        const d = new Date(selectedItem.dueDate);
                                        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                                      })()}
                                    </span>
                                  </div>
                                )} */}
                              </>
                            )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="vp-section">
                    <h4 className="auditlog-view-section-title">
                      Quotation Details
                    </h4>
                    <div className="auditlog-table-wrapper">
                      <table className="auditlog-view-table">
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
                          {(selectedItem.details || []).map((d, idx) => (
                            <tr key={idx}>
                              <td className="desc">{d.itemCode}</td>
                              <td className="desc">{d.category}</td>
                              <td className="desc">{d.itemName}</td>
                              <td style={{ textAlign: "right" }}>
                                {d.quotationQuantity}
                              </td>
                              <td style={{ textAlign: "right" }}>{d.unitRate}</td>
                              <td style={{ textAlign: "right" }}>
                                {d.quotationQuantity * d.unitRate}
                              </td>
                              <td style={{ textAlign: "right" }}>{d.discount}</td>
                              <td style={{ textAlign: "right" }}>
                                {d.quotationQuantity * d.unitRate - d.discount}
                              </td>
                              <td style={{ textAlign: "right" }}>{d.tax}</td>
                              <td style={{ textAlign: "right" }}>
                                {(
                                  d.quotationQuantity * d.unitRate -
                                  d.discount +
                                  ((d.quotationQuantity * d.unitRate -
                                    d.discount) *
                                    d.tax) /
                                  100
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="vp-section">
                    <h4 className="auditlog-view-section-title">
                      Customer Information
                    </h4>
                    <div className="auditlog-view-info">
                      {selectedItem.customerName && (
                        <div className="auditlog-info-row">
                          <span className="label">Customer Name</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.customerName}
                          </span>
                        </div>
                      )}

                      {selectedItem.customerEmail && (
                        <div className="auditlog-info-row">
                          <span className="label">Email</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.customerEmail}
                          </span>
                        </div>
                      )}

                      {selectedItem.customerPhone && (
                        <div className="auditlog-info-row">
                          <span className="label">Mobile Number</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.customerPhone}
                          </span>
                        </div>
                      )}

                      {selectedItem.customerAddress && (
                        <div className="auditlog-info-row">
                          <span className="label">Address</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.customerAddress}
                          </span>
                        </div>
                      )}
                      {selectedItem.paymentTerms && (
                        <div className="auditlog-info-row">
                          <span className="label">Payment Terms</span>
                          <span className="colon">:</span>
                          <span className="value">
                            {selectedItem.paymentTerms}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            {selectedItem && selectedItem.screenname === "Roles" && (
              <>
                <div className="vp-section">
                  <h4 className="auditlog-view-section-title">
                    Roles Information
                  </h4>
                  <div className="auditlog-view-info">
                    {selectedItem.roleName && (
                      <div className="auditlog-info-row">
                        <span className="label">Role Name</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.roleName}</span>
                      </div>
                    )}
                    {selectedItem.roleDescription && (
                      <div className="auditlog-info-row">
                        <span className="label">Description</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.roleDescription}
                        </span>
                      </div>
                    )}
                    {selectedItem.status && (
                      <div className="auditlog-info-row">
                        <span className="label">Status</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.status}</span>
                      </div>
                    )}


                    {selectedItem.createdBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Created By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.createdBy}</span>
                      </div>
                    )}
                    {selectedItem.createdDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Created Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.createdDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                    {selectedItem.modifiedBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.modifiedBy}</span>
                      </div>
                    )}
                    {selectedItem.modifiedDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.modifiedDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedItem && selectedItem.screenname === "Companies" && (
              <>
                <div className="vp-section">
                  <h4 className="auditlog-view-section-title">
                    Company Information
                  </h4>
                  <div className="auditlog-view-info">
                    {selectedItem.companyLogo &&
                      (() => {
                        const logoFileName = selectedItem.companyLogo
                          .split(/[/\\]/)
                          .pop();
                        return (
                          <img
                            src={`${baseURL}/UploadedFiles/${logoFileName}`}
                            alt="Company Logo"
                            className="company-logo-corner"
                          />
                        );
                      })()}

                    {selectedItem.companyName && (
                      <div className="auditlog-info-row">
                        <span className="label">Name</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.companyName}
                        </span>
                      </div>
                    )}

                    {selectedItem.companyAddress && (
                      <div className="auditlog-info-row">
                        <span className="label">Address</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.companyAddress}
                        </span>
                      </div>
                    )}

                    {selectedItem.companyEmail && (
                      <div className="auditlog-info-row">
                        <span className="label">Email</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.companyEmail}
                        </span>
                      </div>
                    )}

                    {selectedItem.companyPhoneNumber && (
                      <div className="auditlog-info-row">
                        <span className="label">Phone Number</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.companyPhoneNumber}
                        </span>
                      </div>
                    )}

                    {selectedItem.companyWebsite && (
                      <div className="auditlog-info-row">
                        <span className="label">Website</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.companyWebsite}
                        </span>
                      </div>
                    )}

                    {selectedItem.registrationNumber && (
                      <div className="auditlog-info-row">
                        <span className="label">Registration Number</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.registrationNumber}
                        </span>
                      </div>
                    )}

                    {selectedItem.vatNumber && (
                      <div className="auditlog-info-row">
                        <span className="label">VAT Number</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.vatNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="vp-section">
                  <h4 className="auditlog-view-section-title">
                    Bank Information
                  </h4>
                  <div className="auditlog-view-info">
                    {selectedItem.bankName && (
                      <div className="auditlog-info-row">
                        <span className="label">Bank Name</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.bankName}</span>
                      </div>
                    )}
                    {selectedItem.accountHolderName && (
                      <div className="auditlog-info-row">
                        <span className="label">Account Holder Name</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.accountHolderName}
                        </span>
                      </div>
                    )}

                    {selectedItem.bankAccountNumber && (
                      <div className="auditlog-info-row">
                        <span className="label">Account Number</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.bankAccountNumber}
                        </span>
                      </div>
                    )}

                    {selectedItem.branchCode && (
                      <div className="auditlog-info-row">
                        <span className="label">Branch Code</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.branchCode}</span>
                      </div>
                    )}

                    {/* {selectedItem.ifscCode && (
                    <div className="auditlog-info-row">
                      <span className="label">IFSC Code</span>
                      <span className="colon">:</span>
                      <span className="value">{selectedItem.ifscCode}</span>
                    </div>
                  )} */}

                    {selectedItem.branchAddress && (
                      <div className="auditlog-info-row">
                        <span className="label">Address</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.branchAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="vp-section">
                  <h4 className="auditlog-view-section-title">
                    Capturer Information
                  </h4>
                  <div className="auditlog-view-info">
                    {selectedItem.createdBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Created By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.createdBy}</span>
                      </div>
                    )}
                    {selectedItem.createdDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Created Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.createdDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                    {selectedItem.modifiedBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.modifiedBy}</span>
                      </div>
                    )}
                    {selectedItem.modifiedDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.modifiedDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedItem && selectedItem.screenname === "Customers" && (
              <>
                <div className="vp-section">
                  <h4 className="auditlog-view-section-title">
                    Customer Information
                  </h4>
                  <div className="auditlog-view-info">
                    {selectedItem.title && (
                      <div className="auditlog-info-row">
                        <span className="label">Title</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.title}</span>
                      </div>
                    )}

                    {selectedItem.Name && (
                      <div className="auditlog-info-row">
                        <span className="label">Name</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.Name}</span>
                      </div>
                    )}

                    {selectedItem.surName && (
                      <div className="auditlog-info-row">
                        <span className="label">Surname</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.surName}</span>
                      </div>
                    )}

                    {selectedItem.mobile && (
                      <div className="auditlog-info-row">
                        <span className="label">Mobile</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.mobile}</span>
                      </div>
                    )}

                    {selectedItem.gender && (
                      <div className="auditlog-info-row">
                        <span className="label">Gender</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.gender}</span>
                      </div>
                    )}

                    {selectedItem.companyName && (
                      <div className="auditlog-info-row">
                        <span className="label">Company Name</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.companyName}
                        </span>
                      </div>
                    )}

                    {selectedItem.email && (
                      <div className="auditlog-info-row">
                        <span className="label">Email</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.email}</span>
                      </div>
                    )}

                    {selectedItem.customerAccountNo && (
                      <div className="auditlog-info-row">
                        <span className="label">Customer Account No.</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.customerAccountNo}
                        </span>
                      </div>
                    )}

                    {selectedItem.address && (
                      <div className="auditlog-info-row">
                        <span className="label">Address</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.address}</span>
                      </div>
                    )}

                    {selectedItem.createdBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Created By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.createdBy}</span>
                      </div>
                    )}
                    {selectedItem.createdDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Created Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.createdDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                    {selectedItem.modifiedBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.modifiedBy}</span>
                      </div>
                    )}
                    {selectedItem.modifiedDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.modifiedDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedItem && selectedItem.screenname === "Products" && (
              <>
                <div className="vp-section">
                  <h4 className="auditlog-view-section-title">
                    Product Information
                  </h4>
                  <div className="auditlog-view-info">
                    {selectedItem.itemCode && (
                      <div className="auditlog-info-row">
                        <span className="label">Item Code</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.itemCode}</span>
                      </div>
                    )}

                    {selectedItem.category && (
                      <div className="auditlog-info-row">
                        <span className="label">Category</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.category}</span>
                      </div>
                    )}

                    {selectedItem.itemName && (
                      <div className="auditlog-info-row">
                        <span className="label">Item Name</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.itemName}</span>
                      </div>
                    )}

                    {selectedItem.description && (
                      <div className="auditlog-info-row">
                        <span className="label">Description</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.description}
                        </span>
                      </div>
                    )}

                    {selectedItem.price && (
                      <div className="auditlog-info-row">
                        <span className="label">Price excl VAT</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.price}</span>
                      </div>
                    )}

                    {selectedItem.unitOfMeasure && (
                      <div className="auditlog-info-row">
                        <span className="label">Unit of Measure</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {selectedItem.unitOfMeasure}
                        </span>
                      </div>
                    )}

                    {selectedItem.taxRate && (
                      <div className="auditlog-info-row">
                        <span className="label">VAT %</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.taxRate}</span>
                      </div>
                    )}

                    {selectedItem.createdBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Created By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.createdBy}</span>
                      </div>
                    )}
                    {selectedItem.createdDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Created Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.createdDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                    {selectedItem.modifiedBy && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified By</span>
                        <span className="colon">:</span>
                        <span className="value">{selectedItem.modifiedBy}</span>
                      </div>
                    )}
                    {selectedItem.modifiedDate && (
                      <div className="auditlog-info-row">
                        <span className="label">Modified Date</span>
                        <span className="colon">:</span>
                        <span className="value">
                          {(() => {
                            const d = new Date(selectedItem.modifiedDate);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}


            <div>
              <div className="auditlog-view-info">
                {selectedItem.action && (
                  <div className="auditlog-info-row">
                    <span className="label">Action</span>
                    <span className="colon">:</span>
                    <span className="value">{selectedItem.action}</span>
                  </div>
                )}
                {selectedItem.actionBy && (
                  <div className="auditlog-info-row">
                    <span className="label">Action By</span>
                    <span className="colon">:</span>
                    <span className="value">{selectedItem.actionBy}</span>
                  </div>
                )}
                {/* {selectedItem.screenname && <div><span className="label">Screen</span>: {selectedItem.screenname}</div>} */}
                {selectedItem.actionDate && (
                  <div className="auditlog-info-row">
                    <span className="label">Action Date</span>
                    <span className="colon">:</span>
                    <span className="value">
                      {(() => {
                        const d = new Date(selectedItem.actionDate);
                        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <HelpModal
        show={showHelp}
        title="Audit Logs - Help & Overview"
        screenName="AuditLog"
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default AuditLogs;
