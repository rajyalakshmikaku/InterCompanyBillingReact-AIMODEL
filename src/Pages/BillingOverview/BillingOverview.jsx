import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './BillingOverview.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import dayjs from 'dayjs';
import { FaEye, FaDownload } from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";
import HelpModal from '../../components/Common/HelpModal';
import useSort from "../../components/Common/useSort";
import Pagination from "../../components/Common/Pagination";
import CommonDatePicker from "../../components/Common/CommonDatePicker";
import HoloButton from '../../components/Common/HoloButton';
import StatusPipeline from "../../components/Common/StatusPipeline";
import { downloadPdfFromPage } from '../../components/Common/downloadPdf';
import { fetchcount, fetchQuotationOrInvoiceDetails } from '../../redux/DashboardSlice';
import { getQuotationOrInvoiceDetails } from '../../services/DashboardApi';
import { fetchCreditnotedetailswithInvoicerefno } from '../../redux/QuotationTemplateSlice';
import {
    fetchCompanieswithfilter
} from '../../redux/CustomerSlice';
import CreditNotePopup from '../../components/Dashboard/CreditNotePopup';
import { ViewPopup } from '../../components/Dashboard';
import {
    QUOTATION_STAGES,
    INVOICE_STAGES,
    rowStages,
    getQuotationStageKey,
    getInvoiceStageKey,
    quotationRowStatus,
    readCount,
} from '../../utility/statusPipelines';
import {
    PaymentProofAction,
    usePaymentProofFiles,
} from '../../components/Common/PaymentProofFiles';

// This screen is read only — it lists every quotation and every invoice
// regardless of status. "Total" is the status the backend uses for
// "no status filter", the same value the dashboard Total card sends.
const ALL_STATUSES = "Total";

// Same lifecycles the dashboard renders — Overdue included, since it comes off
// the row's own due date rather than the count endpoint.
const QUOTATION_PIPELINE_STAGES = rowStages(QUOTATION_STAGES);
const INVOICE_PIPELINE_STAGES = rowStages(INVOICE_STAGES);

// Proforma is generated against a quotation, so the records live on the
// quotation side of the API — the invoice list never contains them. The
// invoice track still shows the stage (and lists it on click); the stage's
// `excludeFromTotal` flag keeps it out of the invoice total.
const PROFORMA_STAGE_KEY = "proforma";
const PROFORMA_STATUS =
    INVOICE_STAGES.find((stage) => stage.key === PROFORMA_STAGE_KEY)?.drillStatus ||
    "Proforma Invoice Generated";

// The Total details response can include quotation-only rows. An invoice row
// must have at least one invoice-side field; proforma rows are loaded
// separately and are intentionally added back to the invoice view below.
const isInvoiceRecord = (row) =>
    Boolean(
        row?.invoiceReferenceNumber ||
        row?.invoiceId ||
        row?.invoiceNumber ||
        row?.invoiceDate ||
        row?.invoiceStatus
    );

// Maps a status string onto the badge classes already defined in the page CSS.
const getStatusBadgeClass = (status) => {
    debugger
    switch ((status || "").toLowerCase().trim()) {
        case "approved":
        case "order completed":
            return "status-ordercompleted";
        case "overdue":
            return "status-overdue";
        case "closed":
            return "status-paid";
        case "rejected":
            return "status-cancelled";
        case "refund":
        case "refunded":
            return "status-refund";
        case "credit note created":
            return "status-creditnote";
        case "expired":
            return "status-expired";
        case "proforma invoice generated":
            return "status-proforma";
        case "invoice generated":
            return "status-invoicegenerated";
        default:
            // Created / Updated
            return "status-invoicecreated";
    }
};

// A reason is only ever captured when a quotation is rejected or an invoice is
// cancelled, so the REASON column — header and cells alike — is only rendered
// on those two pipeline stages. The invoice stage is keyed "closed" but drills
// on "Cancelled", so both keys are read off the stage list rather than typed.
const QUOTATION_REASON_STAGE_KEY =
    QUOTATION_STAGES.find((stage) => stage.drillStatus === "Rejected")?.key || "rejected";
const INVOICE_REASON_STAGE_KEY =
    INVOICE_STAGES.find((stage) => stage.drillStatus === "Cancelled")?.key || "closed";

const hasReasonStatus = (status) => {
    const value = String(status || "").trim().toLowerCase();
    return value === "rejected" || value === "cancelled" || value === "canceled";
};

const getReasonText = (row) =>
    row?.reason || row?.rejectionReason || row?.Reason || "No reason provided.";

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
        })
        : "-";

const EMPTY_FILTERS = {
    referenceNumber: "",
    proformaNumber: "",
    documentDate: "",
    customerName: "",
};

const ViewQuotationInvoiceList = () => {
    const dispatch = useDispatch();

    // Quotation / Invoice switch — same toggle the dashboard uses.
    const [type, setType] = useState("Quotation");
    const isQuotation = type === "Quotation";

    const [showHelp, setShowHelp] = useState(false);

    const { quotationOrInvoiceData = [], loading, counts } = useSelector(
        (state) => state.dashboardsData || {}
    );
    const companyList = useSelector((state) => {
        const fromCompanies = state.Customers?.companies || [];
        const fromCompaniesList = state.Customers?.companieslist || [];
        const fromWithoutRole = state.Customers?.comapnieswithoutRole || [];

        return fromCompanies.length > 0
            ? fromCompanies
            : fromCompaniesList.length > 0
                ? fromCompaniesList
                : fromWithoutRole;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);

    // Drives the server-side company filter directly (getQuotationorInvoicedetails
    // takes companyId, not a name) — applied immediately, not via the Filter button.
    const [selectedCompanyId, setSelectedCompanyId] = useState("");

    // Pipeline stage the user clicked — narrows the table to that stage only.
    const [activeStage, setActiveStage] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const [selectedCreditNote, setSelectedCreditNote] = useState(null);
    const [showCreditNotePopup, setShowCreditNotePopup] = useState(false);

    const [downloadingId, setDownloadingId] = useState(null);
    const [creditViewLoadingId, setCreditViewLoadingId] = useState(null);
    const [creditDownloadLoadingId, setCreditDownloadLoadingId] = useState(null);

    useEffect(() => {
        dispatch(fetchCompanieswithfilter());

    }, [dispatch]);

    // Re-fetch whenever the toggle flips or the company filter changes;
    // "Total" keeps every status in. No company selected -> pass null explicitly.
    useEffect(() => {
        dispatch(
            fetchQuotationOrInvoiceDetails({
                type,
                status: ALL_STATUSES,
                companyId: selectedCompanyId || null,
            })
        );
        dispatch(fetchcount(selectedCompanyId || null));
        setCurrentPage(1);
        setFilters(EMPTY_FILTERS);
        setTempFilters(EMPTY_FILTERS);
        setActiveStage(null);
    }, [dispatch, type, selectedCompanyId]);

    // The API returns [{ header, detail }] — flatten it so filtering, sorting
    // and the table can work with plain rows.
    const rows = useMemo(
        () =>
            (quotationOrInvoiceData || []).map((item) => ({
                ...(item?.header || item || {}),
                detail: item?.detail || item?.details || [],
                paymentHistory: item?.payments || item?.Payments || item?.paymentHistory || item?.PaymentHistory || [],
            })),
        [quotationOrInvoiceData]
    );

    // Fetched straight from the service, not the store: the store holds the
    // list the table is showing and a second dispatch would overwrite it.
    const [proformaRows, setProformaRows] = useState([]);

    useEffect(() => {
        if (isQuotation) {
            setProformaRows([]);
            return undefined;
        }

        let cancelled = false;

        (async () => {
            try {
                const response = await getQuotationOrInvoiceDetails({
                    type: "Quotation",
                    status: PROFORMA_STATUS,
                    companyId: selectedCompanyId || null,
                });

                const list = response?.list || [];

                if (!cancelled) {
                    setProformaRows(
                        list.map((item) => ({
                            ...(item?.header || item || {}),
                            detail: item?.detail || item?.details || [],
                            isProformaRecord: true,
                        }))
                    );
                }
            } catch (error) {
                console.error("Proforma records fetch failed", error);
                if (!cancelled) setProformaRows([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isQuotation, selectedCompanyId]);

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setTempFilters(EMPTY_FILTERS);
        setFilters(EMPTY_FILTERS);
        setSelectedCompanyId("");
        setActiveStage(null);
        setCurrentPage(1);
    };

    // Clicking the stage that is already selected clears the filter.
    const handleStageClick = (stageKey) => {
        setActiveStage((prev) => (prev === stageKey ? null : stageKey));
        setCurrentPage(1);
    };
    const buildFilterPredicate = (filters, useQuotationDate) => (row) => {
        const details = Array.isArray(row.detail) ? row.detail : [];

        const getValues = (...keys) => [
            ...keys.map((key) => row?.[key]),
            ...details.flatMap((detail) =>
                keys.map((key) => detail?.[key])
            ),
        ];

        const quotationNumbers = getValues(
            "quotationReferenceNumber",
            "QuotationReferenceNumber",
            "referenceNumber",
            "ReferenceNumber",
            "refNo",
            "RefNo"
        );

        const proformaNumbers = getValues(
            "porformaReferenceNumber",
            "PorformaReferenceNumber",
            "proformaReferenceNumber",
            "ProformaReferenceNumber",
            "proformaReferenceNo",
            "ProformaRefNo"
        );

        const invoiceNumbers = getValues(
            "invoiceReferenceNumber",
            "InvoiceReferenceNumber",
            "invoiceReferenceNo",
            "InvoiceReferenceNo"
        );

        const searchValue = String(filters.referenceNumber || "")
            .trim()
            .toLowerCase();

        const allReferences = [
            ...quotationNumbers,
            ...proformaNumbers,
            ...invoiceNumbers,
        ];

        const referenceMatch =
            !searchValue ||
            allReferences.some((ref) =>
                String(ref ?? "")
                    .trim()
                    .toLowerCase()
                    .includes(searchValue)
            );

        const customerName =
            row.customerName ||
            row.CustomerName ||
            details.find((d) => d.customerName || d.CustomerName)?.customerName ||
            details.find((d) => d.customerName || d.CustomerName)?.CustomerName ||
            "";

        const customerMatch =
            !filters.customerName ||
            String(customerName)
                .trim()
                .toLowerCase()
                .includes(String(filters.customerName).trim().toLowerCase());

        let dateMatch = true;

        if (filters.documentDate) {
            const rawDate = useQuotationDate
                ? (
                    row.quotationDate ||
                    row.QuotationDate ||
                    row.documentDate ||
                    row.DocumentDate
                )
                : (
                    row.invoiceDate ||
                    row.InvoiceDate ||
                    row.documentDate ||
                    row.DocumentDate
                );

            const rowDate = dayjs(rawDate);

            dateMatch =
                rowDate.isValid() &&
                rowDate.format("YYYY-MM-DD") === filters.documentDate;
        }

        return (
            referenceMatch &&
            customerMatch &&
            dateMatch
        );
    };
    //    const buildFilterPredicate = (filters, useQuotationDate) => (row) => {

    //     // Quotation:
    //     //   Quotation ID + Proforma Number
    //     //
    //     // Invoice:
    //     //   Quotation ID + Proforma Number + Invoice ID
    //     const searchableRefs = [
    //         // Quotation Reference
    //         row.quotationReferenceNumber,
    //         row.QuotationReferenceNumber,

    //         // Proforma Reference - available in BOTH Quotation and Invoice
    //         row.porformaReferenceNumber,
    //         row.PorformaReferenceNumber,
    //         row.proformaReferenceNumber,
    //         row.ProformaReferenceNumber,
    //         row.proformaReferenceNo,
    //         row.ProformaRefNo,
    //         row.proformaRefNo,
    //         row.ProformaRefNo,

    //         // Invoice Reference - Invoice only
    //         ...(!useQuotationDate
    //             ? [
    //                 row.invoiceReferenceNumber,
    //                 row.InvoiceReferenceNumber,
    //             ]
    //             : []),

    //         // Generic references
    //         row.referenceNumber,
    //         row.ReferenceNumber,
    //         row.refNo,
    //         row.RefNo,

    //         // Detail records
    //         ...(Array.isArray(row.detail)
    //             ? row.detail.flatMap((detail) => [
    //                 // Quotation Reference
    //                 detail.quotationReferenceNumber,
    //                 detail.QuotationReferenceNumber,

    //                 // Proforma Reference - BOTH
    //                 detail.porformaReferenceNumber,
    //                 detail.PorformaReferenceNumber,
    //                 detail.proformaReferenceNumber,
    //                 detail.ProformaReferenceNumber,
    //                 detail.proformaReferenceNo,
    //                 detail.ProformaRefNo,
    //                 detail.proformaRefNo,
    //                 detail.ProformaRefNo,

    //                 // Invoice Reference - Invoice only
    //                 ...(!useQuotationDate
    //                     ? [
    //                         detail.invoiceReferenceNumber,
    //                         detail.InvoiceReferenceNumber,
    //                     ]
    //                     : []),

    //                 detail.referenceNumber,
    //                 detail.ReferenceNumber,
    //                 detail.refNo,
    //                 detail.RefNo,
    //             ])
    //             : []),
    //     ];

    //     const searchValue = String(filters.referenceNumber || "")
    //         .trim()
    //         .toLowerCase();

    //     const referenceMatch =
    //         !searchValue ||
    //         searchableRefs.some((ref) =>
    //             String(ref || "")
    //                 .trim()
    //                 .toLowerCase()
    //                 .includes(searchValue)
    //         );

    //     const companyMatch =
    //         !filters.companyName ||
    //         String(
    //             row.companyName ||
    //             row.CompanyName ||
    //             ""
    //         )
    //             .toLowerCase()
    //             .includes(
    //                 String(filters.companyName).toLowerCase()
    //             );

    //     const customerMatch =
    //         !filters.customerName ||
    //         String(
    //             row.customerName ||
    //             row.CustomerName ||
    //             ""
    //         )
    //             .toLowerCase()
    //             .includes(
    //                 String(filters.customerName).toLowerCase()
    //             );

    //     let dateMatch = true;

    //     if (filters.documentDate) {
    //         const rawDate = useQuotationDate
    //             ? (
    //                 row.quotationDate ||
    //                 row.QuotationDate ||
    //                 row.documentDate ||
    //                 row.DocumentDate
    //             )
    //             : (
    //                 row.invoiceDate ||
    //                 row.InvoiceDate ||
    //                 row.documentDate ||
    //                 row.DocumentDate
    //             );

    //         const rowDate = dayjs(rawDate);

    //         dateMatch =
    //             rowDate.isValid() &&
    //             rowDate.format("YYYY-MM-DD") === filters.documentDate;
    //     }

    //     return (
    //         referenceMatch &&
    //         companyMatch &&
    //         customerMatch &&
    //         dateMatch
    //     );
    // };

    // const filteredRows = useMemo(() => {
    //     return rows.filter((row) => {
    //         const searchableRefs = isQuotation
    //             ? [row.quotationReferenceNumber, row.referenceNumber]
    //             : [row.invoiceReferenceNumber, row.quotationReferenceNumber, row.referenceNumber];

    //         const referenceMatch =
    //             !filters.referenceNumber ||
    //             searchableRefs.some((ref) =>
    //                 (ref || "").toLowerCase().includes(filters.referenceNumber.toLowerCase())
    //             );

    //         const companyMatch =
    //             !filters.companyName ||
    //             (row.companyName || "").toLowerCase().includes(filters.companyName.toLowerCase());

    //         const customerMatch =
    //             !filters.customerName ||
    //             (row.customerName || "").toLowerCase().includes(filters.customerName.toLowerCase());

    //         let dateMatch = true;
    //         if (filters.documentDate) {
    //             const rawDate = isQuotation ? row.quotationDate : row.invoiceDate;
    //             const rowDate = dayjs(rawDate, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY-MM-DDTHH:mm:ss']);
    //             dateMatch =
    //                 rowDate.isValid() &&
    //                 rowDate.format('YYYY-MM-DD') === filters.documentDate;
    //         }

    //         return referenceMatch && companyMatch && customerMatch && dateMatch;
    //     });
    // }, [rows, filters, isQuotation]);

    const filteredRows = useMemo(
        () =>
            rows
                .filter((row) => {
                    if (!isQuotation && !isInvoiceRecord(row)) {
                        return false;
                    }

                    // Do not show Proforma Invoice Generated
                    // in Quotation Overview
                    if (
                        isQuotation &&
                        String(row.status || row.Status || "").trim().toLowerCase() ===
                        "proforma invoice generated"
                    ) {
                        return false;
                    }

                    return true;
                })
                .filter(buildFilterPredicate(filters, isQuotation)),
        [rows, filters, isQuotation]
    );
    // Proforma records are quotations, so they carry quotation dates.
    const filteredProformaRows = useMemo(
        () => proformaRows.filter(buildFilterPredicate(filters, true)),
        [proformaRows, filters]
    );

    // Proforma rows never reach the invoice resolver — they are quotations and
    // are tagged on the way in, so the stage owns them outright.
    const getStageKey = useMemo(
        () => (row) =>
            row?.isProformaRecord
                ? PROFORMA_STAGE_KEY
                : (isQuotation ? getQuotationStageKey : getInvoiceStageKey)(row),
        [isQuotation]
    );

    // On the invoice track the Proforma stage is fed by the proforma records;
    // `excludeFromTotal` on that stage keeps them out of the invoice total.
    const pipelineItems = useMemo(
        () => (isQuotation ? filteredRows : [...filteredRows, ...filteredProformaRows]),
        [isQuotation, filteredRows, filteredProformaRows]
    );

    // Proforma is the one stage whose records are not in the invoice list.
    const isProformaStage = !isQuotation && activeStage === PROFORMA_STAGE_KEY;

    // The pipeline counts off every row so all stages stay visible; only the
    // table narrows to the stage that was clicked.
    const visibleRows = useMemo(() => {
        if (isProformaStage) {
            return filteredProformaRows;
        }

        if (activeStage) {
            return filteredRows.filter((row) => getStageKey(row) === activeStage);
        }

        // With no stage selected the table must list everything the pipeline
        // counted — on the invoice track that includes the proforma records.
        return isQuotation ? filteredRows : [...filteredRows, ...filteredProformaRows];
    }, [
        isQuotation,
        filteredRows,
        filteredProformaRows,
        isProformaStage,
        activeStage,
        getStageKey,
    ]);
    // const visibleRows = useMemo(() => {
    //     if (isProformaStage) return filteredProformaRows;

    //     return activeStage
    //         ? filteredRows.filter((row) => getStageKey(row) === activeStage)
    //         : filteredRows;
    // }, [filteredRows, filteredProformaRows, isProformaStage, activeStage, getStageKey]);

    // Proforma records are listed with the quotation columns — an invoice id
    // and invoice date would both read "-" for them.
    const showQuotationColumns = isQuotation || isProformaStage;

    // REASON belongs to the rejected / cancelled stage only — the column is off
    // everywhere else, including the unfiltered list. Header and cells share
    // this flag so the two never drift apart.
    const showReasonColumn =
        activeStage ===
        (isQuotation ? QUOTATION_REASON_STAGE_KEY : INVOICE_REASON_STAGE_KEY);

    const { sortedData, requestSort, sortConfig } = useSort(visibleRows);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    // Proofs for the whole visible page, loaded up front so the row renderers
    // below already have their files (and counts) to hand.
    const { filesByRef: proofFilesByRef, loading: proofFilesLoading } =
        usePaymentProofFiles(
            currentItems.map(
                (row) => row.quotationReferenceNumber || row.referenceNumber,
            ),
        );

    const handleViewClick = (row) => {
        setSelectedRecord(row);
        setShowModal(true);
    };

    const handleCloseViewPopup = () => {
        setShowModal(false);
        setSelectedRecord(null);
    };

    const handleDownloadQuotation = async (
        quotationId,
        referenceNumber,
        isProformaDocument = false
    ) => {
        if (!referenceNumber) return;

        try {
            setDownloadingId(quotationId ?? referenceNumber);

            const documentType = isProformaDocument ? "proforma" : "quotation";
            const filePrefix = isProformaDocument ? "Proforma" : "Quotation";
            const url =
                `${window.location.origin}` +
                `/QuotationTemplateModern?quotationId=${referenceNumber}&type=download&documentType=${documentType}`;

            await downloadPdfFromPage({
                url,
                fileName: `${filePrefix}_${referenceNumber}.pdf`,
                elementSelector: ".cit-sheet",
            });
        } catch (error) {
            console.error("Quotation Download Error", error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to download quotation.";

            if (message === "Quotation is older than 14 days and has expired.") {
                alertify.error("Quotation expired. PDF download is not allowed.");
            } else {
                alertify.error(message);
            }
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadInvoice = async (invoiceId, invoiceReferenceNumber) => {
        try {
            setDownloadingId(invoiceId);

            const url =
                `${window.location.origin}` +
                `/InvoiceTemplate?invoiceId=${invoiceId}`;

            await downloadPdfFromPage({
                url,
                fileName: `Invoice_${invoiceReferenceNumber}.pdf`,
                elementSelector: ".cit-sheet",
            });
        } catch (error) {
            console.error("Invoice Download Error", error);
            alertify.error("Failed to download invoice");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleCreditNoteViewClick = async (row) => {
        if (!row.invoiceReferenceNumber) return;

        try {
            setCreditViewLoadingId(row.invoiceId);

            const response = await dispatch(
                fetchCreditnotedetailswithInvoicerefno(row.invoiceReferenceNumber)
            ).unwrap();

            setSelectedCreditNote(response.list);
            setShowCreditNotePopup(true);
        } catch (error) {
            console.error("Credit Note View Error", error);
            alertify.alert("Error", "Failed to load credit note details.");
        } finally {
            setCreditViewLoadingId(null);
        }
    };

    const handleCreditNoteDownloadClick = async (invoiceReferenceNumber, invoiceId) => {
        if (!invoiceReferenceNumber) return;

        try {
            setCreditDownloadLoadingId(invoiceId);

            const response = await dispatch(
                fetchCreditnotedetailswithInvoicerefno(invoiceReferenceNumber)
            ).unwrap();

            const data = response?.list || response;

            const url =
                `${window.location.origin}` +
                `/CreditNoteViewtemplate?creditNoteId=${data?.creditnoteId}`;

            await downloadPdfFromPage({
                url,
                fileName: `CreditNote_${data?.referenceNumber}.pdf`,
                elementSelector: ".cit-sheet",
            });
        } catch (error) {
            console.error("Credit Note Download Error", error);
            alertify.alert("Error", "Failed to download credit note.");
        } finally {
            setCreditDownloadLoadingId(null);
        }
    };
    const getProformaNumber = (row) =>
        row.porformaReferenceNumber ||
        row.PorformaReferenceNumber ||
        row.proformaReferenceNumber ||
        row.ProformaReferenceNumber ||
        row.proformaReferenceNo ||
        row.ProformaRefNo ||
        row.proformaRefNo ||
        row.piNumber ||
        row.PINumber ||
        row.piNo ||
        row.PiNo ||
        "-";

    const isProformaRow = (row) => {
        if (row?.isProformaRecord) return true;
        const proformaNumber = getProformaNumber(row);
        return (
            /proforma/i.test(String(row?.status || row?.Status || "")) ||
            (proformaNumber && proformaNumber !== "-" && String(proformaNumber).toLowerCase() !== "null")
        );
    };

    const renderQuotationRow = (row) => {
        const referenceNumber = row.quotationReferenceNumber || row.referenceNumber || "-";
        const rowId = row.quotationId ?? referenceNumber;
        const proformaNumber = getProformaNumber(row);
        // Overdue and Closed are display names, so the badge reads the same
        // status the pipeline counted the row under.
        //const status = quotationRowStatus(row);
        const status = (row.status || "").trim();

        return (
            <tr key={rowId}>
                <td>{referenceNumber}</td>
                <td>{proformaNumber}</td>
                <td>{formatDate(row.quotationDate)}</td>
                <td>{row.companyName || "-"}</td>
                <td>{row.customerName || "-"}</td>

                <td>
                    <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                        {status || "-"}
                    </span>
                </td>
                {showReasonColumn && (
                    <td>
                        {hasReasonStatus(status) ? (
                            <div
                                style={{
                                    maxWidth: "250px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.4"
                                }}
                            >
                                {getReasonText(row)}
                            </div>
                        ) : (
                            "-"
                        )}
                    </td>
                )}
                <td>
                    <div className="action-container">
                        <FaEye
                            style={{ cursor: "pointer" }}
                            className="action-icon view-icon"
                            onClick={() => handleViewClick(row)}
                            title="View Quotation Details"
                        />

                        <div
                            onClick={() =>
                                handleDownloadQuotation(
                                    row.quotationId,
                                    referenceNumber,
                                    isProformaRow(row)
                                )
                            }
                            style={{ cursor: "pointer" }}
                        >
                            {downloadingId === (row.quotationId ?? referenceNumber) ? (
                                <div className="download-spinner"></div>
                            ) : (
                                <FaDownload
                                    className="action-icon download-icon"
                                    title="Download"
                                />
                            )}
                        </div>

                        <PaymentProofAction
                            referenceNumber={referenceNumber}
                            status={status}
                            files={proofFilesByRef[referenceNumber]}
                            loading={proofFilesLoading}
                            subtitle={`Quotation ${referenceNumber}`}
                        />
                    </div>
                </td>
            </tr>
        );
    };

    // A proforma record has no invoice yet, so it is listed with the quotation
    // date and a blank invoice id — but padded to the invoice column layout so
    // it can sit in the unfiltered invoice table.
    const renderProformaInvoiceRow = (row) => {
        const referenceNumber = row.quotationReferenceNumber || row.referenceNumber || "-";
        const rowId = row.quotationId ?? referenceNumber;
        const status = row.status || row.Status || PROFORMA_STATUS;

        return (
            <tr key={`proforma-${rowId}`}>
                <td>{referenceNumber}</td>
                <td>{getProformaNumber(row)}</td>
                <td>-</td>
                <td>{formatDate(row.quotationDate)}</td>
                <td>{row.companyName || "-"}</td>
                <td>{row.customerName || "-"}</td>
                <td>
                    <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                        {status}
                    </span>
                </td>
                {showReasonColumn && (
                    <td>
                        {hasReasonStatus(status) ? (
                            <div
                                style={{
                                    maxWidth: "250px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.4"
                                }}
                            >
                                {getReasonText(row)}
                            </div>
                        ) : (
                            "-"
                        )}
                    </td>
                )}
                <td>
                    <div className="action-container">
                        <FaEye
                            style={{ cursor: "pointer" }}
                            className="action-icon view-icon"
                            onClick={() => handleViewClick(row)}
                            title="View Quotation Details"
                        />

                        <div
                            onClick={() =>
                                handleDownloadQuotation(
                                    row.quotationId,
                                    referenceNumber,
                                    isProformaRow(row)
                                )
                            }
                            style={{ cursor: "pointer" }}
                        >
                            {downloadingId === (row.quotationId ?? referenceNumber) ? (
                                <div className="download-spinner"></div>
                            ) : (
                                <FaDownload
                                    className="action-icon download-icon"
                                    title="Download"
                                />
                            )}
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    const renderInvoiceRow = (row) => {
        const rowId = row.invoiceId ?? row.invoiceReferenceNumber;
        const proformaNumber = getProformaNumber(row);
        return (
            <tr key={rowId}>
                <td>{row.quotationReferenceNumber || row.referenceNumber || "-"}</td>
                <td>{proformaNumber}</td>
                <td>{row.invoiceReferenceNumber || "-"}</td>
                <td>{formatDate(row.invoiceDate)}</td>
                <td>{row.companyName || "-"}</td>
                <td>{row.customerName || "-"}</td>
                <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.invoiceStatus)}`}>
                        {row.invoiceStatus || "-"}
                    </span>
                </td>

                {showReasonColumn && (
                    <td>
                        {hasReasonStatus(row.invoiceStatus) ? (
                            <div
                                style={{
                                    maxWidth: "250px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.4"
                                }}
                            >
                                {getReasonText(row)}
                            </div>
                        ) : (
                            "-"
                        )}
                    </td>
                )}
                <td>
                    <div className="action-container">
                        <FaEye
                            style={{ cursor: "pointer" }}
                            className="action-icon view-icon"
                            onClick={() => handleViewClick(row)}
                            title="View Invoice Details"
                        />

                        <div
                            onClick={() =>
                                handleDownloadInvoice(row.invoiceId, row.invoiceReferenceNumber)
                            }
                            style={{
                                cursor: downloadingId === row.invoiceId ? "not-allowed" : "pointer",
                                pointerEvents: downloadingId === row.invoiceId ? "none" : "auto",
                            }}
                        >
                            {downloadingId === row.invoiceId ? (
                                <div className="download-spinner"></div>
                            ) : (
                                <FaDownload
                                    className="action-icon download-icon"
                                    title="Invoice Download"
                                />
                            )}
                        </div>

                        <PaymentProofAction
                            referenceNumber={
                                row.quotationReferenceNumber || row.referenceNumber
                            }
                            status={row.invoiceStatus}
                            files={
                                proofFilesByRef[
                                row.quotationReferenceNumber || row.referenceNumber
                                ]
                            }
                            loading={proofFilesLoading}
                            subtitle={`Invoice ${row.invoiceReferenceNumber || ""}`.trim()}
                        />

                        {row.invoiceStatus === "Credit note Created" && (
                            <>
                                <div
                                    onClick={() => handleCreditNoteViewClick(row)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {creditViewLoadingId === row.invoiceId ? (
                                        <span className="icon-spinner"></span>
                                    ) : (
                                        <MdOutlineReceiptLong
                                            className="action-icon creditview-icon"
                                            title="View Credit Note Details"
                                        />
                                    )}
                                </div>

                                <div
                                    onClick={() =>
                                        handleCreditNoteDownloadClick(
                                            row.invoiceReferenceNumber,
                                            row.invoiceId
                                        )
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    {creditDownloadLoadingId === row.invoiceId ? (
                                        <span className="icon-spinner"></span>
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
            </tr>
        );
    };

    // Must match the header that is actually rendered, so the "no result" and
    // loading rows span the full table.
    const columnCount =
        (showQuotationColumns ? 7 : 8) + (showReasonColumn ? 1 : 0);

    const dateFieldLabel = isQuotation ? "Quotation Date" : "Invoice Date";

    return (
        <div id="invoice-approval-page" className="quotationinvoice-approval-container">

            <div className="list-header">
                <h2 className='quotationInvoiceapprovalheading'>


                    {isQuotation ? "Quotation Overview" : "Invoice Overview"}

                </h2>

                <div className="vql-header-actions">

                    <HoloButton
                        variant={isQuotation ? "primary" : "secondary"}
                        size="md"
                        onClick={() => setType("Quotation")}
                    >
                        Quotation
                    </HoloButton>

                    <HoloButton
                        variant={!isQuotation ? "primary" : "secondary"}
                        size="md"
                        onClick={() => setType("Invoice")}
                    >
                        Invoice
                    </HoloButton>


                    <HoloButton
                        variant="secondary"
                        size="md"
                        onClick={() => setShowHelp(true)}
                    >
                        <i className="fas fa-question-circle"></i> Help
                    </HoloButton>
                </div>
            </div>

            <div className="filter-section">
                <input
                    type="text"
                    value={tempFilters.referenceNumber}
                    onChange={(e) =>
                        setTempFilters({ ...tempFilters, referenceNumber: e.target.value })
                    }
                    placeholder={
                        isQuotation
                            ? "Quotation / Proforma  Id"
                            : "Quotation / Proforma / Invoice Id"
                    }
                />

                <CommonDatePicker
                    value={tempFilters.documentDate}
                    onChange={(newDate) => {
                        if (newDate && newDate.isValid && newDate.isValid()) {
                            setTempFilters({
                                ...tempFilters,
                                documentDate: newDate.format('YYYY-MM-DD'),
                            });
                        } else {
                            setTempFilters({ ...tempFilters, documentDate: '' });
                        }
                    }}
                    className="common-input"
                    label={dateFieldLabel}
                    placeholder={dateFieldLabel}
                />

                <select
                    value={selectedCompanyId}
                    onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="form-control"
                >
                    <option value="">Select Company </option>

                    {companyList.map((company) => (
                        <option
                            key={company.id}
                            value={company.id}
                        >
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
                    placeholder="Customer Name"
                />

                <HoloButton variant="primary" size="md" onClick={handleApplyFilters}>
                    Filter
                </HoloButton>

                <HoloButton variant="secondary" size="md" onClick={handleClearFilters}>
                    Clear
                </HoloButton>
            </div>

            <StatusPipeline
                stages={isQuotation ? QUOTATION_PIPELINE_STAGES : INVOICE_PIPELINE_STAGES}
                items={pipelineItems}
                getKey={getStageKey}
                title={`${type} Status`}
                subtitle="Click a status to show only those records — click it again to clear"
                showTotal
                totalCount={
                    (isQuotation ? counts?.quotations : counts?.invoices)
                        ? readCount(
                            isQuotation ? counts.quotations : counts.invoices,
                            ["total"]
                        )
                        : undefined
                }
                activeKey={activeStage}
                onStageClick={handleStageClick}
            />

            <div className="invoice-approval-list">
                <table className="data-table">
                    <thead>
                        {showQuotationColumns ? (
                            <tr>
                                <th onClick={() => requestSort("quotationReferenceNumber")}>
                                    QUOTATION ID{" "}
                                    {sortConfig.key === "quotationReferenceNumber"
                                        ? (sortConfig.direction === "asc" ? "↑" : "↓")
                                        : "↑"}
                                </th>
                                <th>PROFORMA NUMBER</th>
                                <th>QUOTATION DATE</th>
                                <th>COMPANY</th>
                                <th>CUSTOMER</th>
                                <th>STATUS</th>
                                {showReasonColumn && <th>REASON</th>}
                                <th>VIEW / DOWNLOAD</th>
                            </tr>
                        ) : (
                            <tr>
                                <th onClick={() => requestSort("quotationReferenceNumber")}>
                                    QUOTATION ID{" "}
                                    {sortConfig.key === "quotationReferenceNumber"
                                        ? sortConfig.direction === "asc"
                                            ? "↑"
                                            : "↓"
                                        : "↑"}
                                </th>

                                <th>PROFORMA NUMBER</th>
                                <th>INVOICE ID</th>
                                <th>INVOICE DATE</th>
                                <th>COMPANY</th>
                                <th>CUSTOMER</th>
                                <th>STATUS</th>
                                {/* 
      {showReasonColumn && <th>REASON</th>} */}

                                <th>VIEW / DOWNLOAD</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columnCount} style={{ textAlign: "center", padding: "40px 0" }}>
                                    <div className="loader"></div>
                                </td>
                            </tr>
                        ) : visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={columnCount} style={{ textAlign: "center" }}>
                                    No result found.
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((row) =>
                                showQuotationColumns
                                    ? renderQuotationRow(row)
                                    : row.isProformaRecord
                                        ? renderProformaInvoiceRow(row)
                                        : renderInvoiceRow(row)
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && sortedData.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={sortedData.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}

            {selectedRecord && (
                <ViewPopup
                    show={showModal}
                    onClose={handleCloseViewPopup}
                    selectedInvoice={selectedRecord}
                    type={selectedRecord?.isProformaRecord ? "Quotation" : type}
                    onGenerateInvoice={null}
                    loadingRefNo={null}
                />
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

            <HelpModal show={showHelp} title="Billing Overview - Help & Overview" screenName="BillingOverview" onClose={() => setShowHelp(false)} />
        </div>
    );
};

export default ViewQuotationInvoiceList;
