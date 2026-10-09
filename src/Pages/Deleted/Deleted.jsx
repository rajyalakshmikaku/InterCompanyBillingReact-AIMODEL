import React, { useEffect, useMemo, useState } from "react";
import "./Deleted.css";
import { FaEye, FaDownload } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import HelpModal from "../../components/Common/HelpModal";
import Pagination from "../../components/Common/Pagination";
import HoloButton from "../../components/Common/HoloButton";
import { ViewPopup } from "../../components/Dashboard";
import { fetchRejectedQuotationList } from "../../redux/receivingEntitiesSlice";
import CommonDatePicker from "../../components/Common/CommonDatePicker";
import { downloadPdfFromPage } from "../../components/Common/downloadPdf";

// Only quotations are shown here - the deleted list is scoped to quotation
// type/status the same way the Closed list scopes to "Closed". There is no
// Invoice type for deleted records.
const DELETED_STATUS = "Deleted";
const roleName = sessionStorage.getItem('roleName') || '';
const isSuperAdmin = roleName.toLowerCase().replace(/\s+/g, '') === 'superadmin';

// fetchRejectedQuotationList already normalises documentType/status onto the
// row - this just adds the deleted-specific fields the table below expects.
const mapDeletedRow = (item) => ({
    ...item,
    referenceNumber: item.quotationReferenceNumber || item.referenceNumber || "-",
    deletedBy: item.deletedBy || item.DeletedBy || "-",
    deletedDate: item.deletedDate || item.DeletedDate || item.quotationDate || null,
});

const Deleted = () => {
    const [showHelp, setShowHelp] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const dispatch = useDispatch();
    const companyList = useSelector((state) => state.Customers.companies);

    const { rejectedQuotationList, loading } = useSelector(
        (state) => state.receivingEntities
    );

    // rejectedQuotationList is a shared slice - other screens (e.g. the Closed
    // List) fetch into the same array with a different type/status and their
    // rows aren't cleared on navigation, so this has to filter down to just
    // the Quotation/Deleted rows this screen asked for instead of trusting
    // everything currently in the slice.
    const deletedRecords = useMemo(
        () =>
            (rejectedQuotationList || [])
                .filter(
                    (item) =>
                        item.documentType === "Quotation" &&
                        (item.status || "").toLowerCase() === DELETED_STATUS.toLowerCase()
                )
                .map(mapDeletedRow),
        [rejectedQuotationList]
    );

    useEffect(() => {
        dispatch(fetchRejectedQuotationList({ type: "Quotation", status: DELETED_STATUS }));
    }, [dispatch]);

    const handleViewClick = (item) => {
        setSelectedRecord(item);
        setShowModal(true);
    };

    const handleClosePopup = () => {
        setSelectedRecord(null);
        setShowModal(false);
    };

    const handleDownloadQuotation = async (quotationId, referenceNumber) => {
        try {
            setDownloadingId(quotationId);

            const url = `${window.location.origin}/QuotationTemplateModern?quotationId=${referenceNumber}&type=download`;

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

    // ================= FILTER STATES =================
    const [filters, setFilters] = useState({
        // documentType: "",
        referenceNumber: "",
        companyName: "",
        customerName: "",
        deletedDate: "",
    });

    const [tempFilters, setTempFilters] = useState({
        // documentType: "",
        referenceNumber: "",
        companyName: "",
        customerName: "",
        deletedDate: "",
    });

    // ================= PAGINATION =================
    const [recordsPerPage, setRecordsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    // ================= SORTING =================
    const [sortConfig, setSortConfig] = useState({
        key: "",
        direction: "",
    });

    // ================= APPLY FILTER =================
    const handleApplyFilters = () => {
        setFilters({
            // documentType: tempFilters.documentType.trim(),
            referenceNumber: tempFilters.referenceNumber.trim(),
            companyName: tempFilters.companyName.trim(),
            customerName: tempFilters.customerName.trim(),
            deletedDate: tempFilters.deletedDate.trim(),
        });

        setCurrentPage(1);
    };

    // ================= CLEAR FILTER =================
    const handleClearFilters = () => {
        const clearedFilters = {
            // documentType: "",
            referenceNumber: "",
            companyName: "",
            customerName: "",
            deletedDate: "",
        };

        setTempFilters(clearedFilters);
        setFilters(clearedFilters);
        setCurrentPage(1);
    };

    // ================= FILTER DATA =================
    const filteredData = useMemo(() => {
        return deletedRecords.filter((item) => {
            const referenceNumber = item.referenceNumber || "";
            const companyName = item.companyName || "";
            const customerName = item.customerName || "";
            const deletedDate = item.deletedDate || "";

            return (
                referenceNumber
                    .toLowerCase()
                    .includes(filters.referenceNumber.toLowerCase()) &&

                companyName
                    .toLowerCase()
                    .includes(filters.companyName.toLowerCase()) &&

                customerName
                    .toLowerCase()
                    .includes(filters.customerName.toLowerCase()) &&

                deletedDate
                    .toLowerCase()
                    .includes(filters.deletedDate.toLowerCase())
            );
        });
    }, [deletedRecords, filters]);
    // ================= SORT =================
    const requestSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return {
                    key,
                    direction:
                        prev.direction === "asc"
                            ? "desc"
                            : "asc",
                };
            }

            return {
                key,
                direction: "asc",
            };
        });
    };

    // ================= SORTED DATA =================
    const sortedData = useMemo(() => {
        const list = [...filteredData];

        if (!sortConfig.key) return list;

        list.sort((a, b) => {
            const aValue = String(
                a[sortConfig.key] || ""
            ).toLowerCase();

            const bValue = String(
                b[sortConfig.key] || ""
            ).toLowerCase();

            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;

            return 0;
        });

        if (sortConfig.direction === "desc") {
            list.reverse();
        }

        return list;
    }, [filteredData, sortConfig]);

    // ================= PAGINATION DATA =================
    const paginatedRecords = useMemo(() => {
        const startIndex =
            (currentPage - 1) * recordsPerPage;

        return sortedData.slice(
            startIndex,
            startIndex + recordsPerPage
        );
    }, [
        sortedData,
        currentPage,
        recordsPerPage,
    ]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">

                <div className="reports-section">

                    {/* ================= HEADER ================= */}
                    <div className="list-header">

                        <div className="deleted-header-left">
                            <div>
                                <h3 className="customer-title">
                                    Deleted Records
                                </h3>

                                {/* <p className="deleted-subtitle">
                                    View all deleted quotations and invoices.
                                </p> */}
                            </div>

                            {/* Total Deleted */}
                            {/* <div className="deleted-total-card">
                                <span>Total Deleted</span>

                                <strong>
                                    {deletedRecords.length}
                                </strong>
                            </div> */}
                        </div>

                        <div className="qdb-page-header-right">
                            <HoloButton
                                variant="secondary"
                                size="md"
                                onClick={() =>
                                    setShowHelp(true)
                                }
                            >
                                <i className="fas fa-question-circle"></i>
                                {" "}
                                Help
                            </HoloButton>
                        </div>

                    </div>

                    {/* ================= FILTERS ================= */}
                    <div className="filter-section">

                        {/* Type */}
                        {/* <select
                            value={tempFilters.documentType}
                            onChange={(e) =>
                                setTempFilters({
                                    ...tempFilters,
                                    documentType:
                                        e.target.value,
                                })
                            }
                        >
                            <option value="">
                               Type
                            </option>

                            <option value="Quotation">
                                Quotation
                            </option>
                        </select> */}

                        {/* Reference Number */}
                        <input
                            type="text"
                            value={
                                tempFilters.referenceNumber
                            }
                            onChange={(e) =>
                                setTempFilters({
                                    ...tempFilters,
                                    referenceNumber:
                                        e.target.value,
                                })
                            }
                            placeholder="Reference Number"
                        />

                        {/* Customer */}
                        <input
                            type="text"
                            value={
                                tempFilters.customerName
                            }
                            onChange={(e) =>
                                setTempFilters({
                                    ...tempFilters,
                                    customerName:
                                        e.target.value,
                                })
                            }
                            placeholder="Customer"
                        />
                        {/* Company */}
                        
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

                        {/* Deleted By */}


                        <CommonDatePicker
                            value={tempFilters.deletedDate}
                            onChange={(newDate) => {
                                if (newDate && newDate.isValid && newDate.isValid()) {
                                    setTempFilters({
                                        ...tempFilters,
                                        deletedDate: newDate.format('YYYY-MM-DD'),
                                    });
                                } else {
                                    setTempFilters({
                                        ...tempFilters,
                                        deletedDate: '',
                                    });
                                }
                            }}
                            className="common-input" label="Select Date" placeholder="Select Date"
                        />


                        {/* Filter Button */}
                        <HoloButton
                            variant="primary"
                            size="md"
                            onClick={handleApplyFilters}
                        >
                            Filter
                        </HoloButton>

                        {/* Clear Button */}
                        <HoloButton
                            variant="secondary"
                            size="md"
                            onClick={handleClearFilters}
                        >
                            Clear
                        </HoloButton>

                    </div>

                    {/* ================= RECORDS PER PAGE ================= */}
                    <div className="deleted-list-controls">

                        <div className="records-per-page">
                            Records per page:

                            <select
                                value={recordsPerPage}
                                onChange={(e) => {
                                    setRecordsPerPage(
                                        Number(
                                            e.target.value
                                        )
                                    );

                                    setCurrentPage(1);
                                }}
                            >
                                {[2, 5, 10, 25].map(
                                    (num) => (
                                        <option
                                            key={num}
                                            value={num}
                                        >
                                            {num}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                    </div>

                    {/* ================= TABLE ================= */}
                    <div className="deleted-table-container">

                        <table className="data-table">
                            <thead>
                                <tr>
                                    {/* <th>Type</th> */}
                                    <th>Reference Number</th>
                                     <th>Date</th>
                                    <th>Customer</th>
                                    <th>Company Name</th>
                                    {/* <th>Deleted By</th> */}
                                   
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center" }}>
                                            <div className="loader"></div>
                                        </td>
                                    </tr>
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((item, index) => (
                                        <tr key={index}>
                                            {/* <td>{item.documentType}</td> */}
                                            <td>{item.referenceNumber}</td>
                                            <td>
                                                {item.deletedDate
                                                    ? new Date(item.deletedDate).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })
                                                    : "-"}
                                            </td>
                                            <td>{item.customerName || "-"}</td>
                                            <td>{item.companyName || "-"}</td>
                                            {/* <td>{item.deletedBy || "-"}</td> */}
                                            
                                            <td>
                                                <FaEye
                                                    className="action-icon view-icon"
                                                    title="View"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleViewClick(item)}
                                                />
                                                <FaDownload
                                                    className="action-icon download-icon"
                                                    title="Download"
                                                    style={{ cursor: downloadingId === item.quotationId ? "not-allowed" : "pointer", opacity: downloadingId === item.quotationId ? 0.5 : 1 }}
                                                    onClick={() => !downloadingId && handleDownloadQuotation(item.quotationId, item.referenceNumber)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="no-records"
                                        >
                                            No deleted records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    </div>

                    {/* ================= PAGINATION ================= */}
                    {!loading && paginatedRecords.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={
                                sortedData.length
                            }
                            itemsPerPage={
                                recordsPerPage
                            }
                            onPageChange={(page) =>
                                setCurrentPage(page)
                            }
                        />
                    )}

                </div>

                <ViewPopup
                    show={showModal}
                    onClose={handleClosePopup}
                    selectedInvoice={selectedRecord}
                    type={selectedRecord?.documentType || "Quotation"}
                />

                {/* ================= HELP MODAL ================= */}
                <HelpModal
                    show={showHelp}
                    title="Deleted Records - Help & Overview"
                    screenName="Deleted"
                    onClose={() =>
                        setShowHelp(false)
                    }
                />

            </div>
        </div>
    );
};

export default Deleted;