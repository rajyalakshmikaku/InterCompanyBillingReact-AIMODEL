import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOutstandingInvoiceDetails } from "../../redux/ReportsDashboardSlice";
import { fetchCreditnotedetailswithInvoicerefno } from "../../redux/QuotationTemplateSlice";
import { quotationStatusLabel } from "../../utility/statusPipelines";
import OutstandingRecordsTable from "./OutstandingRecordsTable";
import ViewPopup from "./ViewPopup";
import CreditNotePopup from "./CreditNotePopup";
import Pagination from "../Common/Pagination";
import useSort from "../Common/useSort";
import HoloButton from "../Common/HoloButton";
import { downloadPdfFromPage } from '../../components/Common/downloadPdf';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import "./OutstandingInvoiceModal.css";


// SP_GetOutstandingInvoiceDetails only branches on "Quotation" / "Invoice";
// anything else ("All", "Outstanding", empty) is the union branch.
const normaliseTypeFilter = (type) =>
    type === "Quotation" || type === "Invoice" ? type : "All";

// A row is an invoice when the SP gave it an invoice side — the union branch
// says so with its Type column, the single-type branches by leaving the
// invoice columns NULL.
const readRowType = (header) => {
    const declared = header.type || header.Type;
    if (declared === "Quotation" || declared === "Invoice") return declared;

    return header.invoiceId || header.invoiceReferenceNumber
        ? "Invoice"
        : "Quotation";
};

// Flattens { header, detail } into the shape the table sorts, filters and
// renders — useSort only compares top-level keys.
const normaliseRow = (item, index) => {
    const header = item?.header || item || {};
    const detail = item?.detail || item?.details || [];

    const type = readRowType(header);
    const isInvoice = type === "Invoice";

    const quotationRefNo =
        header.quotationReferenceNumber || header.referenceNumber || "";
    const invoiceRefNo = header.invoiceReferenceNumber || "";

    const statusLabel = isInvoice
        ? header.invoiceStatus || header.status || ""
        : quotationStatusLabel(header.quotationStatus || header.status || "");

    return {
        key: `${type}-${invoiceRefNo || quotationRefNo || "row"}-${index}`,
        type,
        quotationRefNo,
        invoiceRefNo,
        quotationId: header.quotationId ?? null,
        invoiceId: header.invoiceId ?? null,
        // The quotation branch aliases QuotationDate AS InvoiceDate, so either
        // column can be the one that is populated.
        documentDate: isInvoice
            ? header.invoiceDate || header.quotationDate || ""
            : header.quotationDate || header.invoiceDate || "",
        companyName: header.companyName || "",
        receivingEntity: header.receivingEntity || "",
        customerName: header.customerName || "",
        statusLabel,
        hasCreditNote:
            isInvoice && header.invoiceStatus === "Credit note Created",
        header,
        detail,
    };
};

const matchesPeriod = (row, period) => {
    if (!period?.year || !period?.monthNo) return true;
    if (!row.documentDate) return false;

    const date = new Date(row.documentDate);
    if (Number.isNaN(date.getTime())) return false;

    return (
        date.getFullYear() === Number(period.year) &&
        date.getMonth() + 1 === Number(period.monthNo)
    );
};

const EMPTY_FILTERS = { referenceNumber: "", companyName: "", customerName: "" };

const OutstandingInvoiceModal = ({
    show,
    status,
    onClose,
    companyList,
    companyName,
    receivingEntity,
    type,
    // Optional drill-down context from the receivables table — { label, year, monthNo }
    period,
}) => {
    const dispatch = useDispatch();
    const { outstandingInvoiceDetails, loadingOutstandingInvoiceDetails, } = useSelector((s) => s.reports);

    const typeFilter = normaliseTypeFilter(type);

    const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [periodFilter, setPeriodFilter] = useState(null);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [selectedType, setSelectedType] = useState("Invoice");
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedCreditNote, setSelectedCreditNote] = useState(null);
    const [showCreditNotePopup, setShowCreditNotePopup] = useState(false);
    const [childModalOpen, setChildModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [creditViewLoadingId, setCreditViewLoadingId] = useState(null);
    const [creditDownloadLoadingId, setCreditDownloadLoadingId] = useState(null);
    const [invoiceDownloadLoadingId, setInvoiceDownloadLoadingId] = useState(null);
    const [quotationDownloadLoadingId, setQuotationDownloadLoadingId] = useState(null);

    const periodLabel = period?.label || "";
    const periodYear = period?.year;
    const periodMonthNo = period?.monthNo;

    const handleDownloadQuotation = async (
        quotationId,
        referenceNumber
    ) => {
        try {
            setQuotationDownloadLoadingId(quotationId);

            // Allow UI render
            await new Promise((resolve) => setTimeout(resolve, 300));

            const url =
                `${window.location.origin}` +
                `/QuotationTemplateModern?quotationId=${referenceNumber}&type=download`;

            await downloadPdfFromPage({
                url,
                fileName: `Quotation_${referenceNumber}.pdf`,
                elementSelector: ".cit-sheet",
            });

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

            setQuotationDownloadLoadingId(null);

        }
    };

    const handleDownloadInvoice = async (
        invoiceId,
        invoiceReferenceNumber
    ) => {
        try {
            setInvoiceDownloadLoadingId(invoiceId);

            const url =
                `${window.location.origin}` +
                `/InvoiceTemplate?invoiceId=${invoiceId}`;

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

    const handleDownloadCreditNote = async (
        creditnoteId,
        CreditReferenceNumber
    ) => {
        const url =
            `${window.location.origin}` +
            `/CreditNoteViewtemplate?creditNoteId=${creditnoteId}`;

        await downloadPdfFromPage({
            url,
            fileName: `CreditNote_${CreditReferenceNumber}.pdf`,
            elementSelector: ".cit-sheet",
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

    useEffect(() => {
        if (!show) return;

        dispatch(
            fetchOutstandingInvoiceDetails({
                companyName,
                receivingEntity,
                type: typeFilter,
            })
        );

        setFilters(EMPTY_FILTERS);
        setTempFilters(EMPTY_FILTERS);

        // The receivables drill-down is one month wide; the outstanding table
        // has no period, so it opens unfiltered.
        setPeriodFilter(
            periodYear && periodMonthNo
                ? { label: periodLabel, year: periodYear, monthNo: periodMonthNo }
                : null
        );

        setCurrentPage(1);
    }, [
        show,
        companyName,
        receivingEntity,
        typeFilter,
        periodLabel,
        periodYear,
        periodMonthNo,
        dispatch,
    ]);

    const handleCreditNoteView = async (row) => {
        const refNo = row.invoiceRefNo;
        if (!refNo) return;

        try {
            setCreditViewLoadingId(row.invoiceId);

            const response = await dispatch(
                fetchCreditnotedetailswithInvoicerefno(refNo)
            ).unwrap();

            setSelectedCreditNote(response.list);
            setShowCreditNotePopup(true);
            setChildModalOpen(true);
        } catch (e) {
            console.error(e);
        } finally {
            setCreditViewLoadingId(null);
        }
    };

    const handleViewClick = (row) => {
        setSelectedQuotation({
            ...row.header,
            detail: row.detail,
        });

        // ViewPopup renders a Quotation or an Invoice block off this
        setSelectedType(row.type);
        setShowViewModal(true);
        setChildModalOpen(true);
    };

    const normalisedRows = useMemo(
        () => (outstandingInvoiceDetails || []).map(normaliseRow),
        [outstandingInvoiceDetails]
    );

    const filteredData = useMemo(() => {
        const reference = filters.referenceNumber.toLowerCase();
        const company = filters.companyName.toLowerCase();
        const customer = filters.customerName.toLowerCase();

        return normalisedRows.filter((row) => {
            // One box searches either reference — the union branch shows both.
            const matchesReference =
                !reference ||
                row.quotationRefNo.toLowerCase().includes(reference) ||
                row.invoiceRefNo.toLowerCase().includes(reference);

            return (
                matchesReference &&
                (!company || row.companyName.toLowerCase().includes(company)) &&
                (!customer || row.customerName.toLowerCase().includes(customer)) &&
                matchesPeriod(row, periodFilter)
            );
        });
    }, [normalisedRows, filters, periodFilter]);

    const { sortedData, sortConfig, requestSort } = useSort(filteredData);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Columns follow the branch the SP actually answered from, and are worked
    // out over every row so they do not change between pages.
    const showTypeColumn =
        typeFilter === "All" && normalisedRows.some((row) => row.type === "Quotation")
        && normalisedRows.some((row) => row.type === "Invoice");
    const showInvoiceColumn =
        typeFilter !== "Quotation" && normalisedRows.some((row) => row.invoiceRefNo);

    const heading =
        typeFilter === "Quotation"
            ? "Outstanding Quotation Records"
            : typeFilter === "Invoice"
                ? "Outstanding Invoice Records"
                : "Outstanding Quotation & Invoice Records";

    const handleClose = () => {
        setSelectedQuotation(null);
        setShowViewModal(false);
        setSelectedCreditNote(null);
        setShowCreditNotePopup(false);
        setChildModalOpen(false);
        onClose();
    };

    if (!show) return null;

    const statusSlug = (status || "").toLowerCase().replace(/\s+/g, "-");

    return (
        <>
            <div
                className={`kpi-modal-overlay${childModalOpen ? " kpi-modal-hidden" : ""}`}
                onClick={(e) => {
                    if (e.target === e.currentTarget) handleClose();
                }}
            >
                <div className="kpi-modal-panel">
                    {/* ── Header ── */}
                    <div className="kpi-modal-header">
                        <div className="kpi-modal-title-row">
                            <span
                                className={`kpi-modal-status-badge kpi-status-${statusSlug}`}
                            >
                                {status}
                            </span>
                            <h3 className="kpi-modal-title">{heading}</h3>

                            {(companyName || receivingEntity) && (
                                <span className="outstanding-modal-context">
                                    {companyName || "All companies"}
                                    {receivingEntity ? ` → ${receivingEntity}` : ""}
                                </span>
                            )}

                            {!loadingOutstandingInvoiceDetails && (
                                <span className="kpi-modal-count">
                                    {filteredData.length} record
                                    {filteredData.length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        <button
                            className="kpi-modal-close-btn"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* ── Filters ── */}
                    <div className="kpi-modal-filters-container">
                        <div className="kpi-modal-filters">
                            <input
                                type="text"
                                placeholder={
                                    typeFilter === "Quotation"
                                        ? "Search Quotation ID…"
                                        : typeFilter === "Invoice"
                                            ? "Search Invoice ID…"
                                            : "Search Quotation / Invoice ID…"
                                }
                                value={tempFilters.referenceNumber}
                                onChange={(e) =>
                                    setTempFilters({
                                        ...tempFilters,
                                        referenceNumber: e.target.value,
                                    })
                                }
                                onKeyDown={(e) => e.key === "Enter" && setFilters(tempFilters)}
                            />

                            <input
                                type="text"
                                placeholder="Search Customer…"
                                value={tempFilters.customerName}
                                onChange={(e) =>
                                    setTempFilters({
                                        ...tempFilters,
                                        customerName: e.target.value,
                                    })
                                }
                                onKeyDown={(e) => e.key === "Enter" && setFilters(tempFilters)}
                            />
                        </div>
                        <div className="kpi-filter-action-btns">
                            <HoloButton
                                variant="primary"
                                size="md"
                                onClick={() => {
                                    setFilters(tempFilters);
                                    setCurrentPage(1);
                                }}
                            >
                                Apply
                            </HoloButton>

                            <HoloButton
                                variant="secondary"
                                size="md"
                                onClick={() => {
                                    setTempFilters(EMPTY_FILTERS);
                                    setFilters(EMPTY_FILTERS);
                                    setCurrentPage(1);
                                }}
                            >
                                Reset
                            </HoloButton>
                        </div>
                    </div>

                    {/* The details SP takes no period, so the month clicked on the
                        receivables table is applied here and can be cleared. */}
                    {periodFilter && (
                        <div className="outstanding-period-bar">
                            <span className="outstanding-period-chip">
                                Period: {periodFilter.label || `${periodFilter.monthNo}/${periodFilter.year}`}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPeriodFilter(null);
                                        setCurrentPage(1);
                                    }}
                                    aria-label="Clear period filter"
                                >
                                    ✕
                                </button>
                            </span>
                            <span className="outstanding-period-hint">
                                Showing records dated in this period only
                            </span>
                        </div>
                    )}

                    {/* ── Body ── */}
                    <div className="kpi-modal-body">
                        <OutstandingRecordsTable
                            rows={paginatedData}
                            loading={loadingOutstandingInvoiceDetails}
                            showType={showTypeColumn}
                            showInvoiceColumn={showInvoiceColumn}
                            sortConfig={sortConfig}
                            onSort={requestSort}
                            onView={handleViewClick}
                            onDownloadQuotation={handleDownloadQuotation}
                            onDownloadInvoice={handleDownloadInvoice}
                            quotationDownloadLoadingId={quotationDownloadLoadingId}
                            invoiceDownloadLoadingId={invoiceDownloadLoadingId}
                            onViewCreditNote={handleCreditNoteView}
                            onDownloadCreditNote={handleCreditNoteDownloadClick}
                            creditDownloadLoadingId={creditDownloadLoadingId}
                            creditViewLoadingId={creditViewLoadingId}
                        />

                        {!loadingOutstandingInvoiceDetails && filteredData.length > itemsPerPage && (
                            <Pagination
                                currentPage={currentPage}
                                totalItems={filteredData.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        )}

                        {!loadingOutstandingInvoiceDetails && filteredData.length === 0 && (
                            <div className="kpi-modal-empty">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="8"
                                        stroke="#cbd5e1"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M21 21l-4.35-4.35"
                                        stroke="#cbd5e1"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <p>No records found</p>
                                <span>
                                    {periodFilter
                                        ? "Try clearing the period filter"
                                        : "Try adjusting your filters"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedQuotation &&
                createPortal(
                    <ViewPopup
                        show={showViewModal}
                        onClose={() => {
                            setShowViewModal(false);
                            setSelectedQuotation(null);
                            setChildModalOpen(false);
                        }}
                        selectedInvoice={selectedQuotation}
                        type={selectedType}
                        onGenerateInvoice={null}
                        loadingRefNo={null}
                    />,
                    document.body,
                )}

            {showCreditNotePopup &&
                selectedCreditNote &&
                createPortal(
                    <CreditNotePopup
                        selectedCreditNote={selectedCreditNote}
                        onClose={() => {
                            setShowCreditNotePopup(false);
                            setSelectedCreditNote(null);
                            setChildModalOpen(false);
                        }}
                    />,
                    document.body,
                )}
        </>
    );
};

export default OutstandingInvoiceModal;
