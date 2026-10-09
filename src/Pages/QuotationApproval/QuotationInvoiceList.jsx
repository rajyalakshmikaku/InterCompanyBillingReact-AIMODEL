import React, { useState, useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './QuotationInvoiceList.css';
import { fetchInvoicelist, fetchSaveInvoicestatusPaidorcancel, handleSaveProforma } from '../../redux/QuotationInvoiceApprovalSlice';
import { baseURL, AxiosInstance } from "../../services/api";
import { getInvoiceRefNo, saveInvoice, saveInvoiceForSuperAdmin, updateInvoiceForSuperAdmin } from '../../services/BillingInvoiceApi';
import { allowAlphaNumeric, isAlphaNumeric } from '../../validations/InputValdation';
import CompanyPopup from '../../components/Quotation/CompanyPopup';
import CustomerPopup from '../../components/Quotation/CustomerPopup';
import InventoryPopup from '../../components/Quotation/InventoryPopup';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import HelpModal from '../../components/Common/HelpModal';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../../components/ui';
import useSort from "../../components/Common/useSort";
import Pagination from "../../components/Common/Pagination";
import { fetchCompanieswithfilter } from '../../redux/CustomerSlice';
import { fetchActiveUrl } from '../../redux/RegistrationSlice';
import CommonDatePicker from "../../components/Common/CommonDatePicker";
import dayjs from 'dayjs';
import { FaTimesCircle, FaCheckCircle, FaUndo, FaEye, FaDownload, FaFileAlt, FaFileInvoiceDollar, FaMoneyCheckAlt, FaReceipt, FaFileInvoice, FaEdit } from "react-icons/fa";
import CreditNoteTemplate from './CreditNoteTemplate';
import { downloadPdfFromPage } from '../../components/Common/downloadPdf';
import { fetchCreditnotedetailswithInvoicerefno } from '../../redux/QuotationTemplateSlice';
import { MdOutlineReceiptLong } from "react-icons/md";
import CreditNotePopup from '../../components/Dashboard/CreditNotePopup';
import { ViewPopup } from '../../components/Dashboard';
import HoloButton from '../../components/Common/HoloButton';
import ProformaInvoicePopup from '../../components/Quotation/ProformaInvoicePopup';
import {
   INVOICE_PIPELINE_STAGES,
    rowStages,
    getInvoicePipelineStageKey
} from '../../utility/statusPipelines';
import StatusPipeline from "../../components/Common/StatusPipeline";

import {
    PaymentProofAction,
    invalidatePaymentFiles,
    usePaymentProofFiles,
} from '../../components/Common/PaymentProofFiles';

// Statuses that still have something to do on this screen.
const OPEN_STATUSES = ["created", "updated"];
const CANCELLED_STATUSES = ["cancelled"]; // "Closed" is the older spelling
const ACTIONABLE_STATUSES = [...OPEN_STATUSES, ...CANCELLED_STATUSES];

const QuotationInvoiceList = () => {
    //method and return data handler
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Only SuperAdmin may create invoices directly from this screen
    const roleName = sessionStorage.getItem('roleName') || '';
    const isSuperAdmin = roleName.toLowerCase().replace(/\s+/g, '') === 'superadmin';

    // Public base URL used by the backend for the invoice email link
    const activeurl = useSelector((state) => state.registration?.activeurl);
    const invoiceActivationUrl = `${activeurl?.[0] || ""}InvoiceTemplate`;

    const [showHelp, setShowHelp] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const { invoiceList = [], loading, error } = useSelector(
        (state) => state.quotationInvoiceapproval || {}
    );
    // For cancel flow
    const [showCreditModal, setShowCreditModal] = useState(false);

    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    // Settle step of an already-cancelled invoice — "Refund or Credit Note?"
    const [showSettleModal, setShowSettleModal] = useState(false);
    // Whole invoice row, so both dialogs can show its reference number
    const [pendingCancelInvoice, setPendingCancelInvoice] = useState(null);

    // Third step of the refund branch — a supporting document is mandatory
    // before the invoice can be marked as refunded.
    const [showRefundPopup, setShowRefundPopup] = useState(false);
    const [refundInvoice, setRefundInvoice] = useState(null);
    // const [refundFile, setRefundFile] = useState(null);
    const [refundFiles, setRefundFiles] = useState([]);

    const [refundError, setRefundError] = useState("");
    const [refundSubmitting, setRefundSubmitting] = useState(false);

    const [cancelLoading, setCancelLoading] = useState(false);
    const companyList = useSelector((state) => state.Customers.companies);

    const [creditViewLoadingId, setCreditViewLoadingId] = useState(null);
    const [creditDownloadLoadingId, setCreditDownloadLoadingId] = useState(null);
    const [invoiceDownloadLoadingId, setInvoiceDownloadLoadingId] = useState(null);
    const [cancelledBy, setCancelledBy] = useState("");

    const [focusedStageKey, setFocusedStageKey] = useState(null);
    const [activeInvoiceStage, setActiveInvoiceStage] = useState(null);

    const [activeStage, setActiveStage] = useState(null);

    const showReasonColumn = activeStage === "closed";


    const handleStageClick = (stageKey) => {
        setActiveStage((prev) =>
            prev === stageKey ? null : stageKey
        );
        setCurrentPage(1);
    };



    //pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // filter functionality
    // const [filterId, setFilterId] = useState('');
    // const [filterDate, setFilterDate] = useState('');
    // const [filterCompany, setFilterCompany] = useState('');
    // const [filterCustomer, setFilterCustomer] = useState('');

    const [filters, setFilters] = useState({
        referenceNumber: "",
        invoiceDate: "",
        companyName: "",
        customerName: "",
    });


    const [tempFilters, setTempFilters] = useState({
        referenceNumber: "",
        invoiceDate: "",
        companyName: "",
        customerName: "",
    });

    // const INVOICE_PIPELINE_STAGES = [
    //     { key: "Created", label: "Created" },
    //     { key: "Order Completed", label: "Order Completed" },
    //     { key: "Refunded", label: "Refunded" },
    //     { key: "Credit Note", label: "Credit Note" },
    //     { key: "Cancelled", label: "Cancelled" },
    // ];

    const handleApplyFilters = () => {
        setFilters(tempFilters); // Apply only on button click
        setCurrentPage(1);       // Reset pagination (if needed)
    };

    const filteredQuotations = invoiceList.filter((q) => {
        const isActionable = ACTIONABLE_STATUSES.includes(
            q.invoiceStatus?.toLowerCase()
        );

        const referenceMatch =
            !filters.referenceNumber ||
            (q.referenceNumber || q.quotationReferenceNumber || "")
                .toLowerCase()
                .includes(filters.referenceNumber.toLowerCase());

        const companyMatch =
            !filters.companyName ||
            q.companyName?.toLowerCase().includes(filters.companyName.toLowerCase());

        const customerMatch =
            !filters.customerName ||
            q.customerName?.toLowerCase().includes(filters.customerName.toLowerCase());

        let dateMatch = true;

        if (filters.invoiceDate) {
            const qDate = dayjs(
                q.invoiceDate,
                ["YYYY-MM-DD", "DD/MM/YYYY", "YYYY-MM-DDTHH:mm:ss"]
            );

            dateMatch =
                qDate.isValid() &&
                qDate.format("YYYY-MM-DD") === filters.invoiceDate;
        }

        return (
            isActionable &&
            referenceMatch &&
            companyMatch &&
            customerMatch &&
            dateMatch
        );
    });


    const stageFilteredInvoices =
        activeStage === null
            ? filteredQuotations
            : filteredQuotations.filter(
                (invoice) => getInvoicePipelineStageKey(invoice) === activeStage
            );

    const { sortedData, requestSort, sortConfig } = useSort(stageFilteredInvoices);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // IMPORTANT: paginate SORTED data
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    // Proofs for the whole visible page, loaded up front so the tbody loop has
    // its files (and counts) without each row fetching for itself.
    const { filesByRef: proofFilesByRef, loading: proofFilesLoading } =
        usePaymentProofFiles(
            currentItems.map((q) => q.quotationReferenceNumber),
        );


    // useEffect(() => {
    //     setCurrentPage(1);
    // }, [filterId, filterDate, filterCompany, filterCustomer]);


    //data binding
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    // method default calling
    useEffect(() => {
        dispatch(fetchInvoicelist());
        dispatch(fetchCompanieswithfilter());
        dispatch(fetchActiveUrl());
    }, [dispatch]);
    //viewbutton//
    const handleViewClick = (quotation) => {
        setSelectedQuotation(quotation);
        setShowModal(true);
    };
    //popup open//
    const handleClosePopup = () => {
        setSelectedQuotation(null);
        setShowModal(false);
    };

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

        if (!invoice.invoiceReferenceNumber) return;

        try {

            setCreditViewLoadingId(invoice.invoiceId);

            const response = await dispatch(
                fetchCreditnotedetailswithInvoicerefno(
                    invoice.invoiceReferenceNumber
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


    // Reject flow
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectLoading, setRejectLoading] = useState(false);
    const [paidLoadingId, setPaidLoadingId] = useState(null);
    const [cancelLoadingId, setCancelLoadingId] = useState(null);
    const [proformaLoadingId, setProformaLoadingId] = useState(null);

    // holds invoiceId while Paid action is running
    const [cancelConfirmLoading, setCancelConfirmLoading] = useState(false); // for cancel confirm
    // Approve (Paid) handler
    debugger;
    const handleApprove = (invoiceId) => {

        alertify.confirm(
            "Confirmation",
            "Are you sure you want to complete this invoice order?",
            function () {
                setPaidLoadingId(invoiceId);
                dispatch(
                    fetchSaveInvoicestatusPaidorcancel({
                        InvoiceId: invoiceId,
                        type: "Completed",
                        reason: "",
                        TemplateUrl: `${window.location.origin}/InvoiceTemplate`
                    })
                ).then((res) => {
                    setPaidLoadingId(null);
                    if (res.meta.requestStatus === "fulfilled") {
                        alertify.alert("Success", res.payload.message, function () {
                            dispatch(fetchInvoicelist()); // refresh
                        });
                    } else {
                        alertify.alert("Error", "Failed to complete this invoice order.");
                    }
                });
            },
            function () {
                alertify.alert('Warning', "Invoice Order update cancelled.");
            }
        );
    };

    // Cancel action → who is cancelling + why, invoice ends at "Cancelled".
    // Settling it (Refund / Credit Note) is a separate action taken afterwards
    // on the cancelled row.
    const handleCancel = (invoice) => {
        alertify.confirm(
            "Confirm Cancellation",
            "Are you sure you want to cancel this invoice?",
            function () {
                setSelectedInvoiceId(invoice?.invoiceId ?? null);
                setCancelledBy("");
                setCancelReason("");
                setShowCancelPopup(true);
            },
            function () {
                // Cancellation aborted — the invoice stays unchanged.
            }
        );
    };

    // Cancelled invoice → ask whether it is a refund or a credit note
    const handleSettleCancelled = (invoice) => {
        setPendingCancelInvoice(invoice);
        setShowSettleModal(true);
    };

    // Note: onOpenChange fires before the buttons' onClick, so this close
    // handler must not clear pendingCancelInvoice — the refund popup still
    // needs it. It is cleared by whichever branch finishes the flow.
    const handleSettleModalClose = () => {
        setShowSettleModal(false);
    };

    // Refund → a supporting document must be attached first, so the action
    // goes through a dedicated popup instead of firing straight away.
    const handleRefund = () => {
        const invoice = pendingCancelInvoice;
        if (!invoice) return;

        setShowSettleModal(false);
        setPendingCancelInvoice(null);
        setRefundInvoice(invoice);
        setRefundFiles([]);
        setRefundError("");
        setShowRefundPopup(true);
    };

    const handleRefundFileChange = (event) => {
        const files = Array.from(event.target.files || []);

        setRefundFiles(files);

        if (files.length > 0) {
            setRefundError("");
        }
    };
    const closeRefundPopup = () => {
        setShowRefundPopup(false);
        setRefundInvoice(null);
        setRefundFiles([]);
        setRefundError("");
    };

    // Document first — the invoice is only marked as refunded once the
    // upload has succeeded, so a refund can never exist without its proof.
    const handleConfirmRefund = async () => {
        debugger;

        const invoice = refundInvoice;

        if (!invoice) return;

        // Multiple files validation
        if (refundFiles.length === 0) {
            setRefundError(
                "Please upload at least one supporting document before refunding."
            );
            return;
        }

        const referenceNumber =
            invoice.quotationReferenceNumber || "";

        setRefundSubmitting(true);
        setCancelLoadingId(invoice.invoiceId);

        try {
            const formData = new FormData();

            formData.append("referenceNumber", referenceNumber);

            // Append all selected files
            refundFiles.forEach((file) => {
                formData.append("files", file);
            });

            formData.append("type", "Refund");

            await AxiosInstance.post(
                "/api/Quotation/UploadPaymentFiles",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // The actions-column count is served from a cache, so drop the stale entry.
            invalidatePaymentFiles(referenceNumber);

        } catch (error) {
            console.error("Refund document upload failed", error);

            setRefundSubmitting(false);
            setCancelLoadingId(null);

            setRefundError(
                error?.response?.data?.message ||
                "Failed to upload the refund documents. Please try again."
            );

            return;
        }

        const res = await dispatch(
            fetchSaveInvoicestatusPaidorcancel({
                InvoiceId: invoice.invoiceId,
                type: "Refund",
                reason: ""
            })
        );

        setRefundSubmitting(false);
        setCancelLoadingId(null);

        if (res.meta.requestStatus === "fulfilled") {
            closeRefundPopup();

            alertify.alert(
                "Success",
                res.payload.message,
                function () {
                    dispatch(fetchInvoicelist());
                }
            );
        } else {
            setRefundError("Failed to refund this invoice.");
        }
    };

    // Credit Note → open the credit note form for this invoice
    const handleSettleWithCreditNote = () => {
        setSelectedInvoiceId(pendingCancelInvoice?.invoiceId ?? null);
        setShowSettleModal(false);
        setPendingCancelInvoice(null);
        setShowCreditModal(true);
    };

    const handleConfirmCancel = () => {
        if (!cancelledBy) {
            alertify.alert("Error", "Please select who is cancelling this invoice.");
            return;
        }

        if (!cancelReason.trim()) {
            alertify.alert("Error", "Please enter a reason before cancelling.");
            return;
        }

        setCancelConfirmLoading(true);
        setShowCancelPopup(false);
        setCancelLoadingId(selectedInvoiceId);
        dispatch(
            fetchSaveInvoicestatusPaidorcancel({
                InvoiceId: selectedInvoiceId,
                type: "Cancelled",
                reason: cancelReason,
                cancelledBy
            })
        ).then((res) => {
            setCancelConfirmLoading(false);
            setCancelLoadingId(null);
            if (res.meta.requestStatus === "fulfilled") {
                alertify.alert("Success", res.payload.message, function () {
                    dispatch(fetchInvoicelist()); // refresh invoice list
                });
            } else {
                alertify.alert("Error", "Failed to cancel invoice.");
            }
            // Reset popup state
            setShowCancelPopup(false);
            setCancelReason("");
            setCancelledBy("");
            setSelectedInvoiceId(null);
        });
    };

    // Already-cancelled invoice that still needs a refund / credit note.
    // Saving the form moves it to "Credit note Created" — end of the flow.
    const handleIssueCreditNote = (invoiceId) => {
        setSelectedInvoiceId(invoiceId);
        setShowCreditModal(true);
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
        debugger
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

    // ─────────────────────────────────────────────────────────────
    // Generate Invoice (capture) flow — mirrors the Quotation create form
    // ─────────────────────────────────────────────────────────────
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [generateInvoiceLoading, setGenerateInvoiceLoading] = useState(false);
    const [isSavingInvoice, setIsSavingInvoice] = useState(false);
    const [invoiceCreateErrors, setInvoiceCreateErrors] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [editInvoiceLoadingId, setEditInvoiceLoadingId] = useState(null);

    // Company
    const [CompanyName, setCompanyName] = useState("");
    const [CompanyId, setCompanyId] = useState("");
    const [VatNumber, setVatNumber] = useState("");
    const [RegistrationNumber, setRegistrationNumber] = useState("");
    const [CompanyAddress, setCompanyAddress] = useState("");
    const [CompanyWebsite, setCompanyWebsite] = useState("");
    const [CompanyEmail, setCompanyEmail] = useState("");
    const [CompanyPhoneNumber, setCompanyPhoneNumber] = useState("");
    const [CompanyLogo, setCompanyLogo] = useState("");
    const [BankAccountNumber, setBankAccountNumber] = useState("");
    const [BranchCode, setBranchCode] = useState("");
    const [BrannchAddress, setBrannchAddress] = useState("");
    const [IFSCCode, setIFSCCode] = useState("");
    const [AccountHolderName, setAccountHolderName] = useState("");
    const [BankName, setBankName] = useState("");

    // Customer
    const [CustomerName, setCustomerName] = useState("");
    const [CustomerPhone, setCustomerPhone] = useState("");
    const [CustomerEmail, setCustomerEmail] = useState("");
    const [CustomerAddress, setCustomerAddress] = useState("");
    const [customerRefNo, setCustomerRefNo] = useState("");
    const [receivingEntity, setReceivingEntity] = useState("");
    const [receivingCompany, setReceivingCompany] = useState("");

    // Invoice meta
    const [generatedInvoiceId, setGeneratedInvoiceId] = useState("");
    const [invoiceCreateDate, setInvoiceCreateDate] = useState(new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState("");
    const [invoiceType, setInvoiceType] = useState("");
    const [PaymentTerms, setPaymentTerms] = useState("");
    const [tax, setTax] = useState(0);
    const [showProformaPopup, setShowProformaPopup] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedInvoiceLoading, setSelectedInvoiceLoading] = useState(false);
    const [ProformaReferenceNumber, setProformaReferenceNumber] = useState("PR");
    const [proformaError, setProformaError] = useState("");
    // Line items
    const [invoiceDetails, setInvoiceDetails] = useState([
        {
            itemName: "", itemCode: "", description: "", quantity: 0, price: "",
            tax: "", amount: 0, discount: 0, category: "", discountType: "",
            netamount: 0, discountValue: 0,
        },
    ]);

    // Totals setters kept only to satisfy the form contract
    const [SubTotal, setSubTotal] = useState("");
    const [TaxAmount, setTaxAmount] = useState("");
    const [TotalAmount, setTotalAmount] = useState("");

    // Popups
    const [showCompanyPopup, setShowCompanyPopup] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
    const [noDataFound, setNoDataFound] = useState(false);
    const [showCustomerPopup, setShowCustomerPopup] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [popupCustomerMode, setPopupCustomerMode] = useState("create");
    const [showInventoryPopup, setShowInventoryPopup] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [popupMode, setPopupMode] = useState("create");
    const [searchQuery, setSearchQuery] = useState("");
    const [popuploading, setpopupLoading] = useState(false);

    // Discount popup
    const [showDiscountPopup, setShowDiscountPopup] = useState(false);
    const [DiscountMode, setDiscountMode] = useState("");
    const [discountType, setDiscountType] = useState("");
    const [discountValue, setDiscountValue] = useState("");
    const [discountedTotal, setDiscountedTotal] = useState(0);
    const [totalBefore, setTotalBefore] = useState(0);
    const [discountError, setDiscountError] = useState("");

    const fetchTax = async () => {
        try {
            const response = await AxiosInstance.get("/api/InventoryItems/GetTax");
            if (response.data.success) setTax(response.data.tax);
        } catch (error) {
            console.error("Error fetching tax", error);
        }
    };

    const fetchItems = async () => {
        setpopupLoading(true);
        try {
            const response = await AxiosInstance.get("/api/InventoryItems/GetInventoryItems");
            if (response.data.success) setInventoryItems(response.data.data);
        } catch (error) {
            console.error("Error fetching inventory items:", error);
        } finally {
            setpopupLoading(false);
        }
    };

    const openCreatePopup = (index) => {
        setSelectedRowIndex(index);
        setPopupMode("create");
        setShowInventoryPopup(true);
        fetchItems();
    };

    const recalculateRow = (row) => {
        const price = Number(row.price) || 0;
        const qty = Number(row.quantity) || 0;
        const rowTax = Number(row.tax) || 0;

        let discount = 0;
        const rowSubtotal = qty * price;

        if (rowSubtotal > 0) {
            if (row.discountType === "%" && row.discountValue) {
                discount = (rowSubtotal * row.discountValue) / 100;
            } else if (row.discountType === "price" && row.discountValue) {
                discount = Math.min(Number(row.discountValue), rowSubtotal);
            }
        }

        discount = Math.max(0, Math.min(discount, rowSubtotal));
        const taxable = rowSubtotal - discount;
        const netamount = taxable + (taxable * rowTax) / 100;

        return {
            ...row,
            amount: Number(rowSubtotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            netamount: Number(netamount.toFixed(2)),
        };
    };

    const handleDetailsChange = (index, field, value) => {
        const updated = [...invoiceDetails];
        updated[index] = { ...updated[index], [field]: value };
        updated[index] = recalculateRow(updated[index]);
        setInvoiceDetails(updated);
    };

    const addRow = () => {
        const lastRow = invoiceDetails[invoiceDetails.length - 1];
        if (!lastRow || Number(lastRow.quantity) > 0) {
            setInvoiceDetails([
                ...invoiceDetails,
                {
                    itemName: "", description: "", quantity: "", price: 0, tax: 0,
                    discount: 0, amount: 0, discountedamount: 0, netamount: 0,
                },
            ]);
        } else {
            alertify.alert(
                "Warning",
                "Please select Item and enter quantity in the previous row before adding a new one."
            );
        }
    };

    const removeRow = (index) => {
        const newDetails = [...invoiceDetails];
        newDetails.splice(index, 1);
        setInvoiceDetails(newDetails);
    };

    const clearInvoiceValidation = (fields = []) => {
        setInvoiceCreateErrors((prev) => {
            const updated = { ...prev };
            fields.forEach((field) => { updated[field] = ""; });
            return updated;
        });
    };

    const clearTableValidation = (fields = [], rowIndex) => {
        setInvoiceCreateErrors((prev) => {
            const updated = { ...prev };
            fields.forEach((field) => {
                const key = `${field}_${rowIndex}`;
                if (updated.hasOwnProperty(key)) delete updated[key];
            });
            return updated;
        });
    };

    const handleItemSelect = (item) => {
        const updated = [...invoiceDetails];
        updated[selectedRowIndex] = {
            ...updated[selectedRowIndex],
            id: item.id,
            itemName: `${item.itemCode} - ${item.itemName} - ${item.description} `,
            itemCode: item.itemCode,
            description: item.description,
            price: item.price,
            tax: item.vatableStatus === "true" ? tax : 0,
            quantity: item.quantity,
            category: item.category,
            amount: parseInt(item.price),
            discount: 0,
            discountValue: 0,
            discountType: "",
        };
        setInvoiceDetails(updated);
        clearTableValidation(["itemName", "description", "price", "quantity", "tax"], selectedRowIndex);
        setShowInventoryPopup(false);
        setSearchQuery("");
    };

    const handleSearch = async () => {
        setShowCompanyPopup(true);
        setpopupLoading(true);
        try {
            const response = await AxiosInstance.get(`/api/Quotation/SearchCompany`);
            if (response.data && response.data.length > 0) {
                setCompanies(response.data);
                setSelectedCompanyIds(response.data[0].id);
                setNoDataFound(false);
            } else {
                setCompanies([]);
                setNoDataFound(true);
            }
        } catch (error) {
            console.error("Error fetching company:", error);
            setCompanies([]);
            setNoDataFound(true);
        } finally {
            setpopupLoading(false);
        }
    };

    const fetchCustomers = async () => {
        setShowCustomerPopup(true);
        setPopupCustomerMode("create");
        setpopupLoading(true);
        try {
            const response = await AxiosInstance.get("/api/Quotation/getCustomersList", {
                params: { excludeIds: selectedCompanyIds },
            });
            if (response.data && response.data.list) setCustomers(response.data.list);
            else setCustomers([]);
        } catch (error) {
            console.error("Error fetching Customers:", error);
            alertify.alert("Error", "Failed to load Customers");
        } finally {
            setpopupLoading(false);
        }
    };

    const handleCompanySelect = (company) => {
        setShowCompanyPopup(false);
        clearInvoiceValidation([
            "CompanyName", "CompanyPhoneNumber", "CompanyEmail", "CompanyAddress",
            "RegistrationNumber", "CompanyWebsite", "VatNumber", "BankAccountNumber",
            "BrannchAddress", "BranchCode", "AccountHolderName", "BankName",
        ]);
        setCompanyName(company.companyName || company.CompanyName || "");
        setVatNumber(company.vatNumber || company.VatNumber || "");
        setRegistrationNumber(company.registrationNumber || company.RegistrationNumber || "");
        setCompanyAddress(company.companyAddress || company.CompanyAddress || "");
        setCompanyWebsite(company.companyWebsite || company.CompanyWebsite || "");
        setCompanyEmail(company.companyEmail || company.CompanyEmail || "");
        setCompanyPhoneNumber(company.companyPhoneNumber || company.CompanyPhoneNumber || "");
        setBankAccountNumber(company.bankAccountNumber || company.BankAccountNumber || "");
        setBranchCode(company.branchCode || company.BranchCode || "");
        setBrannchAddress(company.brannchAddress || company.BrannchAddress || "");
        setIFSCCode(company.ifscCode || company.IFSCCode || "");
        setAccountHolderName(company.accountHolderName || company.AccountHolderName || "");
        setCompanyLogo(company.companyLogo || company.CompanyLogo || "");
        setBankName(company.bankName || company.BankName || "");
        setCompanyId(String(company.id));
    };

    const resetInvoiceForm = () => {
        setCompanyName(""); setCompanyId(""); setVatNumber(""); setRegistrationNumber("");
        setCompanyAddress(""); setCompanyWebsite(""); setCompanyEmail(""); setCompanyPhoneNumber("");
        setCompanyLogo(""); setBankAccountNumber(""); setBranchCode(""); setBrannchAddress("");
        setIFSCCode(""); setAccountHolderName(""); setBankName("");
        setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress("");
        setCustomerRefNo(""); setReceivingEntity(""); setReceivingCompany("");
        setDueDate(""); setInvoiceType(""); setPaymentTerms("");
        setGeneratedInvoiceId("");
        setInvoiceDetails([{ itemName: "", itemCode: "", description: "", quantity: 0, price: "", tax: "", amount: 0, discount: 0, category: "", discountType: "", netamount: 0, discountValue: 0 }]);
        setInvoiceCreateErrors({});
        setInvoiceCreateDate(new Date().toISOString().slice(0, 10));
    };

    const closeInvoiceForm = () => {
        setShowInvoiceForm(false);
        setInvoiceCreateErrors({});
        setIsEditMode(false);
        setEditingInvoice(null);
        resetInvoiceForm();
    };

    const clearForm = () => {
        setShowInvoiceForm(false);
        resetInvoiceForm();
    };

    const resetDiscountPopup = () => {
        setDiscountType("");
        setDiscountValue("");
        setDiscountedTotal(0);
    };

    const handleGenerateInvoice = async () => {
        setGenerateInvoiceLoading(true);
        setIsEditMode(false);
        setEditingInvoice(null);
        try {
            await fetchTax();
            // const res = await getInvoiceRefNo();
            const res = await AxiosInstance.get(`/api/Quotation/getInvoiceRefno`);
            console.log("Invoice Ref Response", res);
            // getInvoiceRefNo returns response.data; guard against a raw axios response too.
            const payload = res && res.data !== undefined ? res.data : res;
            const refNo = payload?.referenceNumber ?? payload?.invoiceReferenceNumber ?? "";
            if (!refNo) {
                throw new Error(payload?.message || "No reference number returned from server.");
            }
            setGeneratedInvoiceId(String(refNo));
            setInvoiceCreateDate(new Date().toISOString().slice(0, 10));
            setInvoiceDetails([
                {
                    itemName: "", itemCode: "", description: "", quantity: 0, price: "",
                    tax: "", amount: 0, discount: 0, category: "", discountType: "",
                    netamount: 0, discountValue: 0,
                },
            ]);
            setShowInvoiceForm(true);
        } catch (error) {
            console.error("Error generating invoice", error);
            const status = error?.response?.status;
            const serverMsg =
                error?.response?.data?.message ||
                (typeof error?.response?.data === "string" ? error.response.data : "") ||
                error?.message;
            alertify.alert(
                "Error",
                `Failed to generate invoice reference number.${status ? ` (HTTP ${status})` : ""}${serverMsg ? ` — ${serverMsg}` : ""}`
            );
        } finally {
            setGenerateInvoiceLoading(false);
        }
    };

    const mapInvoiceDetailsToFormRows = (details = []) => {
        if (!Array.isArray(details) || details.length === 0) {
            return [{ itemName: "", itemCode: "", description: "", quantity: 0, price: "", tax: "", amount: 0, discount: 0, category: "", discountType: "", netamount: 0, discountValue: 0 }];
        }

        return details.map((row) => {
            const quantity = Number(row.quotationQuantity ?? row.quantity ?? row.qty ?? 0);
            const price = Number(row.unitRate ?? row.price ?? row.UnitRate ?? row.Price ?? 0);
            const taxValue = Number(row.tax ?? row.Tax ?? 0);
            const discountValue = Number(row.discount ?? row.Discount ?? row.discountValue ?? row.DiscountValue ?? 0);
            const amount = quantity * price;
            const discountedAmount = Math.max(amount - discountValue, 0);
            const netamount = discountedAmount + (discountedAmount * taxValue) / 100;

            return {
                id: row.inventoryId ?? row.InventoryId ?? row.id ?? "",
                itemName: row.itemName || row.ItemName || row.name || "",
                itemCode: row.itemCode || row.ItemCode || "",
                description: row.description || row.Description || "",
                quantity,
                price,
                tax: taxValue,
                amount: Number(amount.toFixed(2)),
                discount: Number(discountValue.toFixed(2)),
                category: row.category || row.Category || "",
                discountType: row.discountType || row.DiscountType || "",
                netamount: Number(netamount.toFixed(2)),
                discountValue: Number(row.discountValue ?? row.DiscountValue ?? 0),
            };
        });
    };

    const normalizeDateForInput = (value) => {
        if (!value) return "";
        const normalized = dayjs(value);
        return normalized.isValid() ? normalized.format("YYYY-MM-DD") : "";
    };

    const populateInvoiceForm = (invoiceData, invoiceDetailsPayload = []) => {
        const invoice = invoiceData || {};
        const detailRows = Array.isArray(invoiceDetailsPayload)
            ? invoiceDetailsPayload
            : Array.isArray(invoice?.detail)
                ? invoice.detail
                : Array.isArray(invoice?.details)
                    ? invoice.details
                    : Array.isArray(invoice?.invoiceDetails)
                        ? invoice.invoiceDetails
                        : [];
        const formRows = mapInvoiceDetailsToFormRows(detailRows);

        setCompanyName(invoice.companyName || invoice.CompanyName || "");
        setCompanyId(invoice.companyId || invoice.CompanyId || "");
        setVatNumber(invoice.vatNumber || invoice.VatNumber || "");
        setRegistrationNumber(invoice.registrationNumber || invoice.RegistrationNumber || "");
        setCompanyAddress(invoice.companyAddress || invoice.CompanyAddress || "");
        setCompanyWebsite(invoice.companyWebsite || invoice.CompanyWebsite || "");
        setCompanyEmail(invoice.companyEmail || invoice.CompanyEmail || "");
        setCompanyPhoneNumber(invoice.companyPhoneNumber || invoice.CompanyPhoneNumber || "");
        setCompanyLogo(invoice.companyLogo || invoice.CompanyLogo || invoice.comapanyLogo || "");
        setBankAccountNumber(invoice.bankAccountNumber || invoice.BankAccountNumber || "");
        setBranchCode(invoice.branchCode || invoice.BranchCode || "");
        setBrannchAddress(invoice.branchAddress || invoice.BrannchAddress || "");
        setIFSCCode(invoice.ifscCode || invoice.IFSCCode || "");
        setAccountHolderName(invoice.accountHolderName || invoice.AccountHolderName || "");
        setBankName(invoice.bankName || invoice.BankName || "");
        setCustomerName(invoice.customerName || invoice.CustomerName || "");
        setCustomerPhone(invoice.customerPhone || invoice.CustomerPhone || "");
        setCustomerEmail(invoice.customerEmail || invoice.CustomerEmail || "");
        setCustomerAddress(invoice.customerAddress || invoice.CustomerAddress || "");
        setCustomerRefNo(invoice.customerRefNo || invoice.customerRefno || invoice.CustomerRefNo || "");
        setReceivingEntity(invoice.receivingEntity || invoice.ReceivingEntity || "");
        setReceivingCompany(invoice.receivingCompany || invoice.ReceivingCompany || "");
        setDueDate(
            normalizeDateForInput(
                invoice.dueDate || invoice.DueDate || invoice.DueDate?.toString() || ""
            )
        );
        setInvoiceType(invoice.quotationType || invoice.invoiceType || "");
        setPaymentTerms(invoice.paymentTerms || invoice.PaymentTerms || "");
        setGeneratedInvoiceId(invoice.invoiceReferenceNumber || invoice.referenceNumber || "");
        setInvoiceCreateDate(invoice.invoiceDate ? dayjs(invoice.invoiceDate).format("YYYY-MM-DD") : new Date().toISOString().slice(0, 10));
        setSubTotal(invoice.subTotal || invoice.SubTotal || "");
        setTaxAmount(invoice.taxAmount || invoice.TaxAmount || "");
        setTotalAmount(invoice.totalAmount || invoice.TotalAmount || "");
        setInvoiceDetails(formRows);
        setInvoiceCreateErrors({});
        setShowInvoiceForm(true);
        setIsEditMode(true);
        setEditingInvoice(invoice);
    };

    const handleEditInvoice = async (invoice) => {
        if (!invoice?.invoiceReferenceNumber && !invoice?.referenceNumber) {
            alertify.alert("Warning", "Unable to edit this invoice because the reference number is missing.");
            return;
        }

        setEditInvoiceLoadingId(invoice.invoiceId);
        setIsEditMode(true);
        setEditingInvoice(invoice);
        try {
            await fetchTax();
            const detailRows = Array.isArray(invoice.detail)
                ? invoice.detail
                : Array.isArray(invoice.details)
                    ? invoice.details
                    : [];
            populateInvoiceForm(invoice, detailRows);
        } catch (error) {
            console.error("Error preparing invoice for edit", error);
            populateInvoiceForm(invoice, invoice.detail || invoice.details || []);
            alertify.alert("Warning", "Unable to load full invoice details. The form has been opened with the available details.");
        } finally {
            setEditInvoiceLoadingId(null);
        }
    };

    const computedSubtotal = invoiceDetails.reduce(
        (sum, row) => sum + row.quantity * row.price - (row.discount || 0),
        0
    );
    const computedTaxAmount = invoiceDetails.reduce((sum, row) => {
        const rowSubtotal = row.quantity * row.price - (row.discount || 0);
        return sum + (rowSubtotal * (row.tax || 0)) / 100;
    }, 0);
    const computedTotalAmount = computedSubtotal + computedTaxAmount;

    const logoFile =
        CompanyLogo && typeof CompanyLogo === "string"
            ? CompanyLogo.split(/[/\\]UploadedFiles[/\\]/).pop()
            : "";

    const handleSaveInvoice = async () => {
        const newErrors = {};
        if (!CompanyName.trim()) newErrors.CompanyName = "Company Name is required";
        if (!receivingEntity.trim()) newErrors.receivingEntity = "Receiving Entity is required";
        if (!dueDate.trim()) newErrors.dueDate = "Due Date is required";
        if (!invoiceType.trim()) newErrors.invoiceType = "Invoice Type is required";
        if (!CustomerName.trim()) newErrors.CustomerName = "Customer Name is required";
        if (!CustomerPhone.trim()) newErrors.CustomerPhone = "Customer Phone is required";
        if (!CustomerEmail.trim()) newErrors.CustomerEmail = "Customer Email is required";
        if (!CustomerAddress.trim()) newErrors.CustomerAddress = "Customer Address is required";
        if (!PaymentTerms.trim()) newErrors.PaymentTerms = "Payment Terms are required";

        if (invoiceDetails.length === 0) {
            alertify.alert("Warning", "Add at least one invoice item.");
            return;
        }

        invoiceDetails.forEach((row, index) => {
            if (!row.itemName || !row.itemName.trim())
                newErrors[`itemName_${index}`] = "itemName is required";
            if (!row.quantity || row.quantity <= 0)
                newErrors[`quantity_${index}`] = "Quantity must be greater than 0";
            if (Number(row.price) <= 0 || isNaN(Number(row.price)))
                newErrors[`price_${index}`] = "Price must be greater than 0";
        });

        if (Object.keys(newErrors).length > 0) {
            setInvoiceCreateErrors(newErrors);
            alertify.alert("Warning", "Please fill all required fields.");
            return;
        }

        setIsSavingInvoice(true);
        try {
            const formData = new FormData();
            // NOTE: key names/casing must match the backend InvoiceDto exactly
            // (JsonSerializer.Deserialize is case-sensitive). The backend reuses the
            // quotation DTO shape, so line items go under `quotationDetails` and the
            // type field is `quotationType`.
            const invoiceData = {
                CompanyId, CompanyName, VatNumber, RegistrationNumber, CompanyAddress,
                CompanyWebsite, CompanyEmail, CompanyPhoneNumber,
                invoiceId:
                    editingInvoice?.invoiceId?.toString() || generatedInvoiceId, invoiceDate: invoiceCreateDate,
                InvoiceReferenceNumber: generatedInvoiceId,
                QuotationReferenceNumber: generatedInvoiceId,
                ReferenceNumber: generatedInvoiceId,
                dueDate: dueDate,
                receivingEntity,
                quotationType: invoiceType,
                subtotal: computedSubtotal,
                taxAmount: computedTaxAmount,
                totalAmount: computedTotalAmount,
                CustomerName, CustomerPhone, CustomerEmail, CustomerAddress, customerRefNo,
                BankAccountNumber, BranchCode, BrannchAddress, IFSCCode, AccountHolderName,
                BankName, CompanyLogo, PaymentTerms,
                QuotationLink: invoiceActivationUrl,
                FileName: logoFile,
                invoiceDetails: invoiceDetails.map((item) => ({
                    InventoryId: item.id ? item.id.toString() : "",
                    itemName: item.itemName,
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    price: parseFloat(item.price),
                    tax: parseFloat(item.tax),
                    amount: item.amount,
                    ItemCode: item.itemCode,
                    Discount: Number(item.discount),
                    category: item.category,
                    DiscountType: item.discountType,
                    NetAmount: item.netamount,
                    DiscountValue: item.discountValue,
                })),
            };

            formData.append("invoiceData", JSON.stringify(invoiceData));
            console.log("INvoice data for edit or save", invoiceData);
            const res = isEditMode
                ? await updateInvoiceForSuperAdmin(invoiceData)
                : await saveInvoiceForSuperAdmin(formData);
            const message = res?.message || (isEditMode ? "Invoice updated successfully." : "Invoice saved successfully.");
            if (message.includes("already Used")) {
                alertify.alert(
                    "Warning",
                    "Invoice reference already exists. A new reference number will be generated.",
                    function () {
                        handleGenerateInvoice();

                    }
                );
            } else {
                alertify.alert("Success", generatedInvoiceId + " " + message, function () {
                    resetInvoiceForm();
                    setShowInvoiceForm(false);
                    setIsEditMode(false);
                    setEditingInvoice(null);
                    dispatch(fetchInvoicelist());
                });
                setIsSavingInvoice(false);

            }

        } catch (error) {
            console.log("Status:", error.response?.status);
            console.log("Response:", error.response?.data);

            alertify.alert(
                "Error",
                JSON.stringify(error.response?.data)
            );
            setIsSavingInvoice(false);

        }
    };
    // const normalizeProformaNumber = (value) => {
    //     const trimmed = `${value || ""}`.trim();
    //     if (!trimmed) return "PR";
    //     return trimmed.toUpperCase().startsWith("PR")
    //         ? trimmed.toUpperCase()
    //         : `PR${trimmed.toUpperCase()}`;
    // };

    const handleSaveProforma = async () => {


        try {
            await AxiosInstance.post(
                "/api/Quotation/updateProforma",
                {
                    InvoiceReferenceNumber: selectedInvoice?.invoiceReferenceNumber || selectedInvoice?.invoiceReferenceNumber,
                    ProformaReferenceNumber: ProformaReferenceNumber,
                    Status: "Proforma Invoice Generated",
                }
            );
            alertify.alert(
                "Success",
                `${ProformaReferenceNumber} saved successfully`
            );
            setShowProformaPopup(false);
            setSelectedInvoice(null);
            // setPorformaReferenceNumber("PR");
            dispatch(fetchInvoicelist());
        } catch (error) {
            alertify.alert("Failed to save proforma.");
        }
    };

    const handleOpenProforma = async (invoice) => {
        if (!invoice) return;
        setProformaLoadingId(invoice.invoiceId || invoice.invoiceId?.toString());
        setSelectedInvoice(null);
        setSelectedInvoiceLoading(true);
        // setProformaError("");
        setProformaReferenceNumber(ProformaReferenceNumber);
        // setPorformaReferenceNumber(PoformaReferenceNumber(""));

        try {
            const refNo =
                invoice?.invoiceReferenceNumber ||
                invoice?.referenceNumber ||
                invoice?.invoiceId ||
                invoice?.InvoiceId ||
                invoice?.quotationId ||
                invoice?.QuotationId;

            let invoiceData = invoice;
            if (refNo) {
                const response = await AxiosInstance.get(
                    "/api/Billing/getinvoicedetailswithrefno",
                    { params: { refNo } }
                );
                invoiceData =
                    response.data?.list?.[0] || response.data || invoice;
            }

            setSelectedInvoice(invoiceData);
            setShowProformaPopup(true);
        } catch (error) {
            setSelectedInvoice(invoice);
            setShowProformaPopup(true);
        } finally {
            setSelectedInvoiceLoading(false);
            setProformaLoadingId(null);
        }
    };

    const closeProformaPopup = () => {
        setShowProformaPopup(false);
        setSelectedInvoice(null);
        setSelectedInvoiceLoading(false);
        // setProformaNumber("PR");
        setProformaError("");
    };

    // ─────────────────────────────────────────────────────────────
    // Invoice pipeline (display only) — one simple track showing how many
    // invoices sit at each stage. Counts follow the applied filters, so
    // searching a single invoice lights up the stage it is currently in.
    // ─────────────────────────────────────────────────────────────
    //   Invoice Generated → Order Completed, or Cancelled → then settled as
    //   Refunded | Credit Note
    // Stage list and status mapping are shared with the dashboard and the
    // billing overview so the three tracks always read the same.
    const PIPELINE_STAGES = rowStages(INVOICE_PIPELINE_STAGES);

    const pipelineCounts = filteredQuotations.reduce((acc, q) => {
        const key = getInvoicePipelineStageKey(q);

        if (key) {
            acc[key] = (acc[key] || 0) + 1;
        }

        return acc;
    }, {});

    const pipelineTotal = filteredQuotations.length;

    // When the filters narrow the list down to a single invoice, highlight
    // exactly where that invoice sits on the track.

    const renderPipelineNode = (stage) => {
        const count = pipelineCounts[stage.key] || 0;
        const pct = pipelineTotal > 0 ? Math.round((count / pipelineTotal) * 100) : 0;
        const isFocused = focusedStageKey === stage.key;

        return (
            <div
                key={stage.key}
                className={["qip-flow-node", isFocused ? "is-focused" : ""]
                    .filter(Boolean).join(" ")}
                title={stage.hint}
                style={isFocused ? { borderColor: stage.color } : undefined}
            >
                <div
                    className="qip-flow-badge"
                    style={{ background: `${stage.color}15`, borderColor: `${stage.color}40` }}
                >
                    <span className="qip-flow-num" style={{ color: stage.color }}>{count}</span>
                </div>

                <div className="qip-flow-meta">
                    <span className="qip-flow-label">{stage.label}</span>
                    <span className="qip-flow-pct" style={{ color: stage.color }}>{pct}%</span>
                </div>

                <div className="qip-flow-track">
                    <div
                        className="qip-flow-fill"
                        style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${stage.color}cc, ${stage.color})`,
                        }}
                    />
                </div>
            </div>
        );
    };

    const renderPipelineArrow = (key) => (
        <div className="qip-flow-connector" key={key}>
            <div className="qip-flow-line" />
            <svg className="qip-flow-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="qip-flow-line" />
        </div>
    );

    // Invoice being acted on, shown inside the cancel / settle dialogs so the
    // user can see exactly which reference number they are deciding about.
    const renderInvoiceSummary = (invoice) => {
        if (!invoice) return null;

        const rows = [
            ["Invoice Ref No", invoice.invoiceReferenceNumber],
            ["Company", invoice.companyName],
            ["Customer", invoice.customerName],
            [
                "Invoice Date",
                invoice.invoiceDate
                    ? new Date(invoice.invoiceDate).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                    })
                    : "-",
            ],
        ];

        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-1 text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-gray-900 text-right break-all">
                            {value || "-"}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="invoice-approval-page" className="quotationinvoice-approval-container">

            <div className="list-header">
                <h2 className='quotationInvoiceapprovalheading'>Invoice Approval List</h2>
                <HoloButton
                    variant="secondary"
                    size="md"
                    onClick={() => setShowHelp(true)}
                >
                    <i className="fas fa-question-circle"></i> Help
                </HoloButton>
            </div>
            <div className="filter-section">
                <input
                    type="text"
                    value={tempFilters.referenceNumber}
                    onChange={(e) =>
                        setTempFilters({ ...tempFilters, referenceNumber: e.target.value })
                    }
                    placeholder="Quotation Id"
                />
                {/* <input
                    type="date"
                    value={tempFilters.invoiceDate}
                    onChange={(e) =>
                        setTempFilters({ ...tempFilters, invoiceDate: e.target.value })
                    }
                    placeholder="date"
                /> */}
                <CommonDatePicker
                    value={tempFilters.invoiceDate}
                    onChange={(newDate) => {
                        // Check if newDate is a dayjs object
                        if (newDate && newDate.isValid && newDate.isValid()) {
                            // Store in YYYY-MM-DD format for filtering
                            setTempFilters({
                                ...tempFilters,
                                invoiceDate: newDate.format('YYYY-MM-DD'),
                            });
                        } else {
                            // Clear the date if null
                            setTempFilters({
                                ...tempFilters,
                                invoiceDate: '',
                            });
                        }
                    }}
                    className="common-input" label="Invoice Date" placeholder="Invoice Date"
                />
                {/* <input
                    type="text"
                    value={tempFilters.companyName}
                    onChange={(e) =>
                        setTempFilters({ ...tempFilters, companyName: e.target.value })
                    }
                    placeholder="Company Name"
                /> */}
                <select
                    value={tempFilters.companyName}
                    onChange={(e) =>
                        setTempFilters({ ...tempFilters, companyName: e.target.value })
                    }
                    className="form-control"
                >
                    <option value="">Select Company </option>
                    {companyList.map((company) => (
                        <option key={company.id} value={company.companyName}>
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
                        const clearedFilters = { referenceNumber: "", invoiceDate: "", companyName: "", customerName: "" };
                        setTempFilters(clearedFilters); setFilters(clearedFilters); setCurrentPage(1);
                    }}
                >
                    Clear
                </HoloButton>

            </div>



            <StatusPipeline
                stages={INVOICE_PIPELINE_STAGES}
                items={filteredQuotations}
                getKey={getInvoicePipelineStageKey}
                title="Invoice Status"
                subtitle="Click a status to show only those records — click it again to clear"
                showTotal
                activeKey={activeStage}
                onStageClick={handleStageClick}
            />

            {/* <div className="qip-pipeline-card">
                <div className="qip-pipeline-flow">
                    {PIPELINE_STAGES.map((stage, i) => (
                        <Fragment key={stage.key}>
                            {i > 0 && renderPipelineArrow(`arrow-${stage.key}`)}
                            {renderPipelineNode(stage)}
                        </Fragment>
                    ))}
                </div>
            </div> */}

            {/* {isSuperAdmin && (
                <div
                    className="Invoicebuttons"
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                        margin: "10px 0",
                    }}
                >
                    <HoloButton
                        variant="primary"
                        size="md"
                        onClick={handleGenerateInvoice}
                        disabled={generateInvoiceLoading}
                    >
                        {generateInvoiceLoading ? (
                            <>
                                <span className="button-loader" style={{ marginRight: "8px" }} />
                                Generate Invoice
                            </>
                        ) : (
                            "Generate Invoice"
                        )}
                    </HoloButton>
                </div>
            )} */}

            <div className="invoice-approval-list">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort("quotationReferenceNumber")}>
                                QUOTATION ID{" "}
                                {sortConfig.key === "quotationReferenceNumber"
                                    ? (sortConfig.direction === "asc" ? "↑" : "↓")
                                    : "↑"}
                            </th>
                            <th>INVOICE ID</th>
                            <th>INVOICE DATE</th>
                            <th>COMPANY</th>
                            <th>CUSTOMER</th>
                            <th>STATUS</th>
                            {showReasonColumn && <th>REASON</th>}
                            <th>ACTION</th>
                            <th>VIEW / DOWNLOAD</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center", padding: "40px 0" }}>
                                    <div className="loader"></div>
                                </td>
                            </tr>
                        ) : stageFilteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center" }}>No result found.</td>
                            </tr>
                        ) : (
                            currentItems.map((q) => (
                                <tr key={q.invoiceId}>
                                    <td>{q.quotationReferenceNumber || "-"}</td>
                                    <td>{q.invoiceReferenceNumber || "-"}</td>
                                    <td>
                                        {q.invoiceDate
                                            ? new Date(q.invoiceDate).toLocaleDateString("en-GB", {
                                                day: "2-digit", month: "2-digit", year: "numeric"
                                            })
                                            : "-"}
                                    </td>
                                    <td>{q.companyName || "-"}</td>
                                    <td>{q.customerName || "-"}</td>

                                    <td>
                                        <span className={`status-badge
                            ${q.invoiceStatus?.toLowerCase() === "created" ? "status-invoicecreated" : ""}
                            ${q.invoiceStatus?.toLowerCase() === "order completed" ? "status-ordercompleted" : ""}
                            ${["cancelled", "closed"].includes(q.invoiceStatus?.toLowerCase()) ? "status-cancelled" : ""}
                            ${["refund", "refunded"].includes(q.invoiceStatus?.toLowerCase()) ? "status-refund" : ""}
                            ${q.invoiceStatus?.toLowerCase() === "credit note created" ? "status-creditnote" : ""}`}>
                                            {q.invoiceStatus || "-"}
                                        </span>
                                    </td>

                                    {/* <td>
                                        <div style={{ maxWidth: "250px", whiteSpace: "normal", lineHeight: "1.4" }}>
                                            {["cancelled", "closed"].includes(q.invoiceStatus?.toLowerCase())
                                                ? <p>{q.reason || q.rejectionReason || "No reason provided."}</p>
                                                : "-"}
                                        </div>
                                    </td> */}

                                    {showReasonColumn && (
                                        <td>
                                            {q.invoiceStatus?.toLowerCase() === "cancelled" ? (
                                                <div
                                                    style={{
                                                        maxWidth: "250px",
                                                        whiteSpace: "normal",
                                                        lineHeight: "1.4"
                                                    }}
                                                >
                                                    {q.reason || q.rejectionReason || "No reason provided."}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    )}

                                    <td>
                                        <div className="action-container">
                                            {OPEN_STATUSES.includes(q.invoiceStatus?.toLowerCase()) && (
                                                <>
                                                    <div onClick={() => handleApprove(q.invoiceId)} style={{ cursor: "pointer" }}>
                                                        {paidLoadingId === q.invoiceId
                                                            ? <span className="icon-spinner"></span>
                                                            : <FaCheckCircle title="Marks as Order Completed" className="action-icon invoicepaid-icon" />}
                                                    </div>

                                                    <div onClick={() => handleCancel(q)} style={{ cursor: "pointer" }}>
                                                        {cancelLoadingId === q.invoiceId
                                                            ? <span className="icon-spinner"></span>
                                                            : <FaTimesCircle className="action-icon invoicecancel-icon" title="Marks as Cancelled" />}
                                                    </div>
                                                </>
                                            )}

                                            {CANCELLED_STATUSES.includes(q.invoiceStatus?.toLowerCase()) && (
                                                <div onClick={() => handleSettleCancelled(q)} style={{ cursor: "pointer" }}>
                                                    {cancelLoadingId === q.invoiceId
                                                        ? <span className="icon-spinner"></span>
                                                        : <FaUndo className="action-icon invoicerefund-icon" title="Refund / Credit Note" />}
                                                </div>
                                            )}

                                            {!ACTIONABLE_STATUSES.includes(q.invoiceStatus?.toLowerCase()) && (
                                                <div className="no-action" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                                                    -
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="action-container">
                                            <FaEye
                                                style={{ cursor: "pointer" }}
                                                className="action-icon view-icon"
                                                onClick={() => handleViewClick(q)}
                                                title="View Invoice Details"
                                            />

                                            <div
                                                onClick={() => handleDownloadInvoice(q.invoiceId, q.invoiceReferenceNumber)}
                                                style={{
                                                    cursor: invoiceDownloadLoadingId === q.invoiceId ? "not-allowed" : "pointer",
                                                    pointerEvents: invoiceDownloadLoadingId === q.invoiceId ? "none" : "auto"
                                                }}
                                            >
                                                {invoiceDownloadLoadingId === q.invoiceId
                                                    ? <div className="mini-spinner"></div>
                                                    : <FaDownload className="action-icon download-icon" title="Invoice Download" />}
                                            </div>

                                            <PaymentProofAction
                                                referenceNumber={q.quotationReferenceNumber}
                                                status={q.invoiceStatus}
                                                files={proofFilesByRef[q.quotationReferenceNumber]}
                                                loading={proofFilesLoading}
                                                subtitle={`Invoice ${q.invoiceReferenceNumber || ""}`.trim()}
                                            />

                                            {q.invoiceStatus?.toLowerCase() === "credit note created" && (
                                                <>
                                                    <div onClick={() => handleCreditNoteViewClick(q)} style={{ cursor: "pointer" }}>
                                                        {creditViewLoadingId === q.invoiceId
                                                            ? <span className="icon-spinner"></span>
                                                            : <MdOutlineReceiptLong className="action-icon creditview-icon" title="View Credit Note Details" />}
                                                    </div>

                                                    <div
                                                        onClick={() => handleCreditNoteDownloadClick(q.invoiceReferenceNumber, q.invoiceId)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        {creditDownloadLoadingId === q.invoiceId
                                                            ? <span className="icon-spinner"></span>
                                                            : <FaDownload className="action-icon creditdownload-icon" title="Credit Note Download" />}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {sortedData.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={stageFilteredInvoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Step 2 (cancelled invoice) — refund the money, or issue a credit
                note against the invoice */}
            <AlertDialog open={showSettleModal} onOpenChange={handleSettleModalClose}>
                <AlertDialogContent className="max-w-xl p-8 gap-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Refund or Credit Note?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            <strong>Refund</strong> settles the invoice by paying the customer back.
                            <strong> Issue Credit Note</strong> opens the credit note form for this
                            invoice.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {renderInvoiceSummary(pendingCancelInvoice)}

                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            onClick={handleSettleModalClose}
                        >
                            Back
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-white text-brand-600 border-2 border-brand-500 hover:bg-brand-50"
                            onClick={handleRefund}
                        >
                            Refund
                        </AlertDialogAction>
                        <AlertDialogAction onClick={handleSettleWithCreditNote}>
                            Issue Credit Note
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {showCancelPopup && (
                <div className="cancel-popup-overlay">
                    <div className="cancel-popup">
                        <h4>Cancel Invoice</h4>

                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                                Cancellation Requested By
                                <span className="refund-required"> *</span>
                            </label>

                            <div style={{ display: "flex", gap: "25px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input
                                        type="radio"
                                        name="cancelledBy"
                                        value="Company"
                                        checked={cancelledBy === "Company"}
                                        onChange={(e) => setCancelledBy(e.target.value)}
                                    />
                                    Company
                                </label>

                                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input
                                        type="radio"
                                        name="cancelledBy"
                                        value="Customer"
                                        checked={cancelledBy === "Customer"}
                                        onChange={(e) => setCancelledBy(e.target.value)}
                                    />
                                    Customer
                                </label>
                            </div>
                        </div>

                        <textarea
                            placeholder="Enter cancellation reason..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={4}
                            style={{ width: "100%" }}
                        />

                        <div
                            style={{
                                marginTop: "10px",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "10px"
                            }}
                        >
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowCancelPopup(false);
                                    setCancelReason("");
                                    setCancelledBy("");
                                }}
                                disabled={cancelConfirmLoading}
                            >
                                Close
                            </button>

                            <button
                                className="paid-btn"
                                onClick={handleConfirmCancel}
                                disabled={cancelConfirmLoading}
                            >
                                {cancelConfirmLoading && <span classfName="spinner"></span>}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3 (refund branch) — supporting document is mandatory */}
            {showRefundPopup && (
                <div className="cancel-popup-overlay">
                    <div className="cancel-popup">
                        <h4>Refund Invoice</h4>

                        {renderInvoiceSummary(refundInvoice)}

                        <div className="refund-upload-row">
                            <label className="refund-upload-label">
                                Upload supporting document
                                <span className="refund-required"> *</span>
                            </label>

                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                onChange={handleRefundFileChange}
                                disabled={refundSubmitting}
                            />

                            {refundFiles.length > 0 && (
                                <div className="refund-file-list">
                                    {refundFiles.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="refund-file-name">
                                            {file.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {refundError && (
                            <div className="refund-error">{refundError}</div>
                        )}

                        <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                className="cancel-btn"
                                onClick={closeRefundPopup}
                                disabled={refundSubmitting}
                            >
                                Close
                            </button>
                            <button
                                className="paid-btn"
                                onClick={handleConfirmRefund}
                                disabled={refundSubmitting || refundFiles.length === 0}
                            >
                                {refundSubmitting && <span className="spinner"></span>}
                                Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedQuotation && (
                <ViewPopup show={showModal} onClose={() => setShowModal(false)}
                    selectedInvoice={selectedQuotation} type="invoiceapproval"
                    onGenerateInvoice={null}
                    loadingRefNo={null} />
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
            {showCreditModal && (
                <div className="quotation-view-overlay">
                    <div className="quotation-view-modal"
                        style={{
                            maxWidth: '75vw',
                            width: '1200px',
                            maxHeight: '90vh'
                        }}>
                        <div className='close-btn-container'>
                            <button
                                className="quotation-view-creditclose-btn"
                                onClick={() => setShowCreditModal(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            <CreditNoteTemplate
                                invoiceId={selectedInvoiceId}
                                closeModal={() => setShowCreditModal(false)}
                                onSaved={() => {
                                    dispatch(fetchInvoicelist());
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showProformaPopup && selectedInvoiceLoading && (
                <div className="quotation-form-overlay">
                    <div className="quotation-form-modal">
                        <div style={{ padding: "30px", textAlign: "center" }}>
                            Loading Proforma details...
                        </div>
                    </div>
                </div>
            )}
            {showProformaPopup && selectedInvoice && (
                <ProformaInvoicePopup
                    invoice={selectedInvoice}
                    ProformaReferenceNumber={ProformaReferenceNumber}
                    setProformaReferenceNumber={setProformaReferenceNumber}
                    proformaError={proformaError}
                    setProformaError={setProformaError}
                    handleSave={handleSaveProforma}
                    closeProformaPopup={closeProformaPopup}
                />
            )}

            <InventoryPopup
                show={showInventoryPopup}
                onClose={() => setShowInventoryPopup(false)}
                inventoryItems={inventoryItems}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleItemSelect={handleItemSelect}
                popupMode={popupMode}
                quotationDetails={invoiceDetails}
                selectedQuotation={{ details: invoiceDetails }}
                selectedRowIndex={selectedRowIndex}
                popuploading={popuploading}
            />

            <CustomerPopup
                show={showCustomerPopup}
                onClose={() => setShowCustomerPopup(false)}
                customers={customers}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                popupCustomerMode={popupCustomerMode}
                setSelectedQuotation={() => { }}
                clearValidation={clearInvoiceValidation}
                setReceivingEntity={setReceivingEntity}
                setCustomerName={setCustomerName}
                setCustomerPhone={setCustomerPhone}
                setCustomerEmail={setCustomerEmail}
                setCustomerAddress={setCustomerAddress}
                setReceivingCompany={setReceivingCompany}
                setCustomerRefNo={setCustomerRefNo}
                popuploading={popuploading}
            />

            {showCompanyPopup && (
                <CompanyPopup
                    isOpen={showCompanyPopup}
                    companies={companies}
                    onSelect={handleCompanySelect}
                    onClose={() => setShowCompanyPopup(false)}
                    popuploading={popuploading}
                />
            )}

            {showDiscountPopup && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10050,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: "35px",
                            borderRadius: "12px",
                            width: "480px",
                        }}
                    >
                        <span
                            className="closequotation-btn"
                            onClick={() => {
                                resetDiscountPopup();
                                setShowDiscountPopup(false);
                            }}
                        >
                            &times;
                        </span>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontWeight: 600 }}>Discount</label>
                            <select
                                className="uniform-input"
                                style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px" }}
                                value={discountType}
                                onChange={(e) => {
                                    setDiscountType(e.target.value);
                                    setDiscountValue("");
                                    setDiscountedTotal(0);
                                }}
                            >
                                <option value="">-- Select --</option>
                                <option value="%">% Discount</option>
                                <option value="price">Price Off Discount</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: "18px" }}>
                            <label style={{ fontWeight: 600 }}>Total</label>
                            <input
                                className="uniform-input"
                                type="number"
                                disabled
                                style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px" }}
                                value={totalBefore}
                            />
                        </div>

                        {discountType === "%" && (
                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ fontWeight: 600 }}>% Discount</label>
                                <input
                                    type="number"
                                    className="uniform-input"
                                    style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px" }}
                                    value={discountValue}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setDiscountValue(v);
                                        if (v < 0) {
                                            setDiscountError("Discount cannot be negative");
                                            setDiscountedTotal(0);
                                        } else if (v > 100) {
                                            setDiscountError("Percentage cannot be greater than 100%");
                                            setDiscountedTotal(0);
                                        } else {
                                            setDiscountError("");
                                            const calc = (totalBefore * v) / 100;
                                            setDiscountedTotal(calc.toFixed(2));
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {discountType === "price" && (
                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ fontWeight: 600 }}>Price Off Discount</label>
                                <input
                                    className="uniform-input"
                                    type="number"
                                    style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px" }}
                                    value={discountValue}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setDiscountValue(v);
                                        if (v > totalBefore) {
                                            setDiscountError("Discount cannot be greater than total amount");
                                            setDiscountedTotal(0);
                                        } else {
                                            setDiscountError("");
                                            setDiscountedTotal(v);
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {discountError && (
                            <div style={{ color: "red", fontSize: "13px", marginTop: "5px" }}>
                                {discountError}
                            </div>
                        )}

                        <div style={{ marginBottom: "25px" }}>
                            <label style={{ fontWeight: 600 }}>Discounted Total</label>
                            <input
                                className="uniform-input"
                                type="number"
                                disabled
                                style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px" }}
                                value={discountedTotal}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <button
                                style={{
                                    padding: "12px 40px", borderRadius: "8px", background: "#28a745",
                                    border: "none", color: "#fff", fontSize: "18px", cursor: "pointer",
                                }}
                                onClick={() => {
                                    if (selectedRowIndex == null) return;
                                    if (invoiceDetails && Array.isArray(invoiceDetails)) {
                                        const updatedRows = [...invoiceDetails];
                                        if (updatedRows[selectedRowIndex]) {
                                            updatedRows[selectedRowIndex] = recalculateRow({
                                                ...updatedRows[selectedRowIndex],
                                                discountType,
                                                discountValue: parseFloat(discountValue) || 0,
                                            });
                                            setInvoiceDetails(updatedRows);
                                        }
                                    }
                                    resetDiscountPopup();
                                    setShowDiscountPopup(false);
                                }}
                            >
                                Save
                            </button>

                            <button
                                style={{
                                    padding: "12px 34px", borderRadius: "8px", border: "1px solid #777",
                                    background: "red", color: "#fff", cursor: "pointer",
                                }}
                                onClick={() => {
                                    resetDiscountPopup();
                                    setShowDiscountPopup(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HelpModal show={showHelp} title="Invoice Approval - Help & Overview" screenName="InvoiceApporval" onClose={() => setShowHelp(false)} />



        </div>
    );
};

export default QuotationInvoiceList;
