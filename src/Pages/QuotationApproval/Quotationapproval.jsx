import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './Quotationapproval.css';
import { fetchQuotationlist, savegenerateinvoicewitherefno } from '../../redux/QuotationApprovalSlice';
import { fetchActiveUrl } from '../../redux/RegistrationSlice';
import { AxiosInstance, baseURL } from "../../services/api";
import {
    getQuotationPayments,
    recordQuotationPayment,
} from "../../services/QuotationPaymentsApi";
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import Pagination from "../../components/Common/Pagination";
import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";
import CommonDatePicker from "../../components/Common/CommonDatePicker";
import dayjs from 'dayjs';
import { FaDownload, FaEye } from "react-icons/fa";
import { downloadPdfFromPage } from '../../components/Common/downloadPdf';
import { ViewPopup } from '../../components/Dashboard';
import HoloButton from "../../components/Common/HoloButton";
import { fetchSaveInvoicestatusPaidorcancel } from '../../redux/QuotationInvoiceApprovalSlice';
import { FaTimesCircle, FaCheckCircle, FaFileInvoice, FaMoneyCheckAlt } from "react-icons/fa";
import StatusPipeline from "../../components/Common/StatusPipeline";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
} from "../../components/ui";
import { quotationStatusLabel, quotationRowStatus, isQuotationOverdue } from "../../utility/statusPipelines";
import {
    PaymentProofAction,
    invalidatePaymentFiles,
    usePaymentProofFiles,
} from "../../components/Common/PaymentProofFiles";

// Quotation approval track — an approved quotation ends up either invoiced
// straight away (paid) or as a proforma that is chased for payment, and a
// proforma that never gets paid is cancelled.
const APPROVAL_PIPELINE_STAGES = [
    {
        key: "approved", label: "Approved", color: "#3D8C4F",
        hint: "Quotation approved, awaiting payment decision",
    },
    {
        key: "proforma", label: "Proforma Invoice", color: "#06b6d4",
        hint: "Proforma issued — waiting for the customer to pay",
    },
    {
        key: "deposit-paid", label: "Deposit Paid", color: "#f59e0b",
        hint: "Part payment received — waiting for the balance",
    },
    {
        key: "partial-paid", label: "Partial Paid", color: "#f97316",
        hint: "An installment was received — waiting for the balance",
    },
    {
        key: "unpaid", label: "Unpaid", color: "#3531a9",
        hint: "Invoice generated but not yet paid",
    },
    {
        key: "overdue", label: "Over due", color: "#e91e63",
        hint: "Past its due date and still awaiting payment",
    },
    // {
    //     key: "cancelled", label: "Cancelled", color: "#ef4444",
    //     hint: "Proforma never paid — quotation cancelled",
    // },
];




const getQuotationTotal = (quotation) =>
    Number(quotation?.totalAmount ?? quotation?.TotalAmount ?? 0) || 0;

const getQuotationPaidAmount = (quotation) =>
    Number(
        quotation?.paidAmount ??
        quotation?.PaidAmount ??
        quotation?.amountPaid ??
        quotation?.AmountPaid ??
        0,
    ) || 0;

const getDepositPercentage = (quotation) => {
    const terms = String(quotation?.paymentTerms ?? quotation?.PaymentTerms ?? "");
    const match = terms.match(/(\d+(?:\.\d+)?)\s*%\s*deposit/i);
    return match ? Number(match[1]) : null;
};



const formatMoney = (amount) => Number(amount || 0).toFixed(2);

const getApprovalStageKey = (quotation) => {
    // Once an invoice has been generated as unpaid, the quotation has left the
    // approval loop for good — it takes priority over the overdue due-date
    // rule so a stale due date doesn't relabel it back to Over due.
    const unpaidStatus = (
        quotation?.unpaidStatus ?? quotation?.UnpaidStatus ?? ""
    ).toLowerCase().trim();
    if (unpaidStatus === "unpaid") return "unpaid";

    // Overdue is a due-date rule, not a stored status, so it takes priority
    // over whatever status the quotation is otherwise sitting in.
    if (isQuotationOverdue(quotation)) return "overdue";

    switch ((quotation?.quotationStatus || "").toLowerCase().trim()) {
        case "proforma invoice generated":
            return "proforma";
        case "invoice generated":
            return "invoiced";
        case "deposit paid":
            return "deposit-paid";
        case "partial paid":
            return "partial-paid";
        case "cancelled":
        case "closed":
            return "cancelled";
        default:
            // Approved / anything still awaiting a decision
            return "approved";
    }
};

const Quotationapproval = () => {
    //method and return data handler
    const dispatch = useDispatch();
    const { activeurl } = useSelector((state) => state.registration);
    const [showHelp, setShowHelp] = useState(false);
    const companyList = useSelector((state) => state.Customers.companies);
    const [showModal, setShowModal] = useState(false);
    const [paidLoadingId, setPaidLoadingId] = useState(null);
    const [cancelLoadingId, setCancelLoadingId] = useState(null);
    const {
        quotationList = [],
        loading,
        error } = useSelector(
            (state) => state.quotationapproval || {}
        );
    //pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Pipeline stage the user clicked — narrows the table to that stage only.
    const [activeStage, setActiveStage] = useState(null);

    const roleName = sessionStorage.getItem("roleName") || "";
    const isSuperAdmin = roleName.toLowerCase().replace(/\s+/g, "") === "superadmin";
    const isAdmin = roleName.toLowerCase().replace(/\s+/g, "") === "admin";
    console.log('role', roleName);
    console.log('fv', isSuperAdmin);



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

    const handleApplyFilters = () => {

        setFilters(tempFilters); // Apply only on button click
        setCurrentPage(1);       // Reset pagination (if needed)
    };
    const filteredQuotations1 = quotationList.filter((q) => {
        // const idMatch = (q.referenceNumber || '').toLowerCase().includes((filterId || '').toLowerCase());
        // const dateMatch = filterDate ? new Date(q.invoiceDate).toISOString().slice(0, 10) === filterDate : true;
        // const companyMatch = (q.companyName || '').toLowerCase().includes((filterCompany || '').toLowerCase());
        // const customerMatch = (q.billingEntity || '').toLowerCase().includes((filterCustomer || '').toLowerCase());

        // return idMatch && dateMatch && companyMatch && customerMatch;
        return (
            // (filters.referenceNumber === "" ||
            //     q.referenceNumber?.toLowerCase().includes(
            //         filters.referenceNumber.toLowerCase()
            //     ))
            !filters.referenceNumber ||
            (q.quotationReferenceNumber || "")
                .toLowerCase()
                .includes(filters.referenceNumber.toLowerCase()) ||
            (q.porformaReferenceNumber || "")
                .toLowerCase()
                .includes(filters.referenceNumber.toLowerCase()) &&
            (filters.invoiceDate === "" ||
                q.invoiceDate?.toLowerCase().includes(filters.invoiceDate.toLowerCase())) &&
            (filters.companyName === "" ||
                q.companyName?.toLowerCase().includes(
                    filters.companyName.toLowerCase()
                )) &&
            (filters.customerName === "" ||
                q.customerName?.toLowerCase().includes(
                    filters.customerName.toLowerCase()
                ))
        );
    });
    const filteredQuotations = quotationList.filter((q) => {
        const searchReference = (filters.referenceNumber || "")
            .trim()
            .toLowerCase();

        const quotationRef = String(q.quotationReferenceNumber || "")
            .trim()
            .toLowerCase();

        const proformaRef = String(q.porformaReferenceNumber || "")
            .trim()
            .toLowerCase();

        const referenceMatch =
            !searchReference ||
            quotationRef.includes(searchReference) ||
            proformaRef.includes(searchReference);

        const companyMatch =
            !filters.companyName ||
            String(q.companyName || "")
                .toLowerCase()
                .includes(filters.companyName.toLowerCase());

        const customerMatch =
            !filters.customerName ||
            String(q.customerName || "")
                .toLowerCase()
                .includes(filters.customerName.toLowerCase());

        let dateMatch = true;

        if (filters.invoiceDate) {
            const qDate = dayjs(q.invoiceDate || q.quotationDate);

            dateMatch =
                qDate.isValid() &&
                qDate.format("YYYY-MM-DD") === filters.invoiceDate;
        }

        return (
            referenceMatch &&
            companyMatch &&
            customerMatch &&
            dateMatch
        );
    });

    // const filteredQuotations = quotationList.filter((q) => {
    //     debugger
    //     // Reference Number Match
    //     // const referenceMatch =
    //     //     !filters.referenceNumber ||
    //     //     (q.quotationReferenceNumber || "")
    //     //         .toLowerCase()
    //     //         .includes(filters.referenceNumber.toLowerCase());
    //     const referenceMatch =
    //   !filters.referenceNumber ||
    // (q.quotationReferenceNumber || "")
    //     .toString()
    //     .toLowerCase()
    //     .includes(filters.referenceNumber.toString().toLowerCase()) ||

    // (q.porformaReferenceNumber || "")
    //     .toString()
    //     .toLowerCase()
    //     .includes(filters.referenceNumber.toString().toLowerCase()) ||

    // (q.proformaReferenceNumber || "")
    //     .toString()
    //     .toLowerCase()
    //     .includes(filters.referenceNumber.toString().toLowerCase()) ||

    // (q.ProformaReferenceNumber || "")
    //     .toString()
    //     .toLowerCase()
    //     .includes(filters.referenceNumber.toString().toLowerCase());
    //     // Company Match
    //     const companyMatch =
    //         !filters.companyName ||
    //         q.companyName?.toLowerCase().includes(filters.companyName.toLowerCase());

    //     // Customer Match
    //     const customerMatch =
    //         !filters.customerName ||
    //         q.customerName?.toLowerCase().includes(filters.customerName.toLowerCase());

    //     // Date Match
    //     let dateMatch = true;
    //     if (filters.invoiceDate) {
    //         const qDate = dayjs(q.invoiceDate, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY-MM-DDTHH:mm:ss']);
    //         dateMatch = qDate.isValid() && qDate.format('YYYY-MM-DD') === filters.invoiceDate;
    //     }

    //     return referenceMatch && companyMatch && customerMatch && dateMatch;
    // });


    // Clicking the stage that is already selected clears the filter.
    const handleStageClick = (stageKey) => {
        setActiveStage((prev) => (prev === stageKey ? null : stageKey));
        setCurrentPage(1);
    };

    // The pipeline counts off filteredQuotations so every stage stays visible;
    // only the table narrows to the stage that was clicked.



    const visibleQuotations =
        activeStage === null
            ? filteredQuotations
            : filteredQuotations.filter(
                (q) => getApprovalStageKey(q) === activeStage
            );

    const { sortedData, requestSort, sortConfig } = useSort(visibleQuotations);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const [ProformaReferenceNumber, setProformaReferenceNumber] = useState(null);

    // Proofs for the whole visible page, loaded up front so the tbody loop has
    // its files (and counts) without each row fetching for itself.
    const {
        filesByRef: proofFilesByRef,
        loading: proofFilesLoading,
        refresh: refreshPaymentFiles,
    } =
        usePaymentProofFiles(
            currentItems.map((q) => q.quotationReferenceNumber),
        );

    // useEffect(() => {
    //     const generateProformaNumber = async () => {
    //         try {
    //             setIsLoadingProformaNo(true);
    //             const response = await AxiosInstance.get("/api/quotation/getProformaRefno");
    //             if (response.data && response.data.referenceNumber) {
    //                 setProformaReferenceNumber(response.data.referenceNumber);
    //             }
    //         } catch (error) {
    //             console.error("Error generating proforma number:", error);
    //             // Fallback to PR prefix if API fails
    //             setProformaReferenceNumber(`PI-${new Date().toISOString().slice(0, 10)}-0001`);
    //         } finally {
    //             setIsLoadingProformaNo(false);
    //         }
    //     };

    //     generateProformaNumber();
    // }, [setProformaReferenceNumber]);
    const [isLoadingProformaNo, setIsLoadingProformaNo] = useState(false);
    const [proformaLoadingId, setProformaLoadingId] = useState(null);

    const handleSaveProforma = async (quotationReferenceNumber) => {


        try {
            const response = await AxiosInstance.post(
                "/api/Quotation/updateProforma",
                {
                    InvoiceReferenceNumber: quotationReferenceNumber,
                    ProformaReferenceNumber: "null",
                    Status: "Proforma Invoice Generated",
                    TemplateUrl: ProformatemplateUrl

                }
            );
            alertify.alert("Success", response.data.message);
            dispatch(fetchQuotationlist());
        } catch (error) {
            alertify.alert("Failed to save proforma.");
        }
    };

    // useEffect(() => {
    //     setCurrentPage(1);
    // }, [filterId, filterDate, filterCompany, filterCustomer]);


    //data binding
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [showPaidPopup, setShowPaidPopup] = useState(false);
    const [selectedPaidQuotation, setSelectedPaidQuotation] = useState(null);
    const [paymentOption, setPaymentOption] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentRecords, setPaymentRecords] = useState([]);
    const [paymentRecordsLoading, setPaymentRecordsLoading] = useState(false);
    const [paymentRecordsRef, setPaymentRecordsRef] = useState("");
    // const [proofFile, setProofFile] = useState(null);
    const [proofFile, setProofFile] = useState([]);
    const [popupLoadingInvoice, setPopupLoadingInvoice] = useState(false);
    const [popupLoadingProforma, setPopupLoadingProforma] = useState(false);
    const [popupLoadingCancel, setPopupLoadingCancel] = useState(false);

    // Cancelling a quotation has to be justified — the payment dialog hands over
    // to this popup, which captures the reason before anything is sent.
    const [showCancelReasonPopup, setShowCancelReasonPopup] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelTargetQuotation, setCancelTargetQuotation] = useState(null);
    // "cancel" closes an unpaid proforma; "decline" rejects a quotation before
    // it ever became a proforma. Same reason-capture popup, different status.
    const [reasonPopupMode, setReasonPopupMode] = useState("cancel");

    // A proforma already sits in this list waiting to be paid. For those rows
    // the same Paid button asks "has it been paid now?" instead of
    // "paid or unpaid?" — yes generates the invoice, no cancels the quotation.
    const isProformaFollowUp = ["proforma invoice generated", "deposit paid", "partial paid"].includes(
        (selectedPaidQuotation?.quotationStatus || "").toLowerCase().trim(),
    );

    // Overdue quotations skip the pay-now options entirely — the only action
    // offered is marking it unpaid to issue a proforma. Applies to SuperAdmin
    // too: once overdue, Full/Partial payment drop away and only Unpaid remains.
    const isOverdueUnpaidOnly =
    !isProformaFollowUp &&
    isQuotationOverdue(selectedPaidQuotation);

    const quotationTotal = getQuotationTotal(selectedPaidQuotation);
    const listedQuotationPaid = getQuotationPaidAmount(selectedPaidQuotation);

    const quotationStatus =
        (selectedPaidQuotation?.quotationStatus || "")
            .toLowerCase()
            .trim();

    const isSelectedQuotationOverdue = isQuotationOverdue(selectedPaidQuotation);

    // Get the approval stage key for the selected quotation
    const approvalStageKey = getApprovalStageKey(selectedPaidQuotation);

    // Super Admin: Show Unpaid option when status is "Approved" OR "Overdue"
    // Admin: Show Unpaid option only when status is "Overdue"
    const canShowUnpaidOption =
        isSuperAdmin
            ? (approvalStageKey === "approved" || isSelectedQuotationOverdue)
            : isSelectedQuotationOverdue;


    const unpaidStatus =
        (
            selectedPaidQuotation?.unpaidStatus ??
            selectedPaidQuotation?.UnpaidStatus ??
            ""
        )
            .toLowerCase()
            .trim();

    const isInvoiceAlreadyGeneratedUnpaid =
        unpaidStatus === "unpaid";

    const getPaymentButtonText = () => {
        if (
            isInvoiceAlreadyGeneratedUnpaid &&
            (isSuperAdmin || isAdmin)&&
            paymentMode === "full"
        ) {
            return "Full Paid";
        }

        if (paymentMode === "full") {
            return isDepositBalanceOutstanding
                ? "Record Deposit Payment"
                : "Generate Invoice";
        }

        return "Record Partial Payment";
    };


    const ledgerPaid = paymentRecords.reduce(
        (total, payment) => total + Number(
            payment?.paidAmount ?? payment?.PaidAmount ?? payment?.paymentAmount ?? 0,
        ),
        0,
    );
    const quotationPaid = paymentRecordsRef === selectedPaidQuotation?.quotationReferenceNumber
        ? ledgerPaid
        : listedQuotationPaid;
    const quotationBalance = Math.max(quotationTotal - quotationPaid, 0);
    const depositPercentage = getDepositPercentage(selectedPaidQuotation);
    const depositTarget = depositPercentage == null
        ? null
        : quotationTotal * depositPercentage / 100;
    const isDepositPaymentTerm = depositPercentage != null;
    const depositBalance = depositTarget == null
        ? 0
        : Math.max(depositTarget - quotationPaid, 0);
    const isDepositBalanceOutstanding = isDepositPaymentTerm && depositBalance > 0;
    const paymentTarget = isDepositBalanceOutstanding ? depositBalance : quotationBalance;
    const fullPaymentAmount = isDepositBalanceOutstanding
        ? Math.min(depositBalance, quotationBalance)
        : quotationBalance;

    useEffect(() => {
        dispatch(fetchQuotationlist());
        dispatch((fetchActiveUrl()));
    }, [dispatch]);

    const templateUrl = `${activeurl?.[0] || ''}Invoicetemplate`;

    const ProformatemplateUrl = `${activeurl?.[0] || ''}ProformaInvoicetemplate`;

    console.log('ProformatemplateUrl:', ProformatemplateUrl);

    //viewbutton//
    const handleViewClick = (quotation) => {
        setSelectedQuotation({
            ...quotation
        });

        setShowModal(true);
    };

    const loadQuotationPayments = async (quotationId) => {
        if (!quotationId) return [];

        setPaymentRecordsLoading(true);
        try {
            const records = await getQuotationPayments(quotationId);
            setPaymentRecords(records);
            setPaymentRecordsRef(quotationId);
            return records;
        } catch (error) {
            setPaymentRecords([]);
            setPaymentRecordsRef(quotationId);
            throw error;
        } finally {
            setPaymentRecordsLoading(false);
        }
    };

    const handleOpenPaidPopup = (quotation) => {
        console.log('quotation', quotation);
        setSelectedPaidQuotation(quotation);
        setPaymentRecords([]);
        setPaymentRecordsRef("");
        loadQuotationPayments(quotation.quotationReferenceNumber).catch(() => {
            alertify.alert("Error", "Unable to load the quotation payment history.");
        });
        setPaymentOption("");
        setPaymentMode("");
        setProofFile([]);
        setPaymentAmount("");
        setPaymentRecords([]);
        setPaymentRecordsRef("");
        setShowPaidPopup(true);
    };

    const handlePaymentModeChange = (mode) => {
        setPaymentOption("");
        setPaymentMode(mode);
        setPaymentAmount(mode === "full" ? String(fullPaymentAmount) : "");
    };

    const handleClosePaidPopup = () => {
        setSelectedPaidQuotation(null);
        setShowPaidPopup(false);
        setPaymentOption("");
        setPaymentMode("");
        setProofFile([]);
        setPaymentAmount("");
    };

    // const handleProofChange = (event) => {
    //     setProofFile(event.target.files?.[0] ?? null);
    // };

    // Picking more files adds to the selection (skipping exact duplicates) so
    // a wrongly chosen file can be removed without re-selecting the rest.
    const handleProofChange = (event) => {
        const picked = Array.from(event.target.files || []);
        setProofFile((prev) => [
            ...prev,
            ...picked.filter(
                (f) => !prev.some((p) => p.name === f.name && p.size === f.size && p.lastModified === f.lastModified),
            ),
        ]);
        // Reset so choosing the same file again after removing it still fires onChange.
        event.target.value = "";
    };

    const handleRemoveProofFile = (indexToRemove) => {
        setProofFile((prev) => prev.filter((_, i) => i !== indexToRemove));
    };
    // Proof of payment is only persisted once the invoice actually exists, so
    // this is called from the success branch of the invoice generation.
    const uploadPaymentProof = async (referenceNumber, files, type) => {
        if (!files || files.length === 0) return;

        const formData = new FormData();

        formData.append("referenceNumber", referenceNumber);
        formData.append("type", type);
        files.forEach((file) => {
            formData.append("files", file);
        });

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
    };
    const handleGenerateInvoiceFromPopup = async (unpaidstatus, invoicestatus) => {
        debugger
        if (!selectedPaidQuotation) return;

        if (proofFile.length === 0) {
            alertify.alert("Error", "Please upload proof of payment before continuing.");
            return;
        }

        // Capture before closing the popup wipes the state.
        const refNo = selectedPaidQuotation.quotationReferenceNumber;
        const quotationId = Number(selectedPaidQuotation.quotationId);
        const fileToUpload = proofFile;
        let latestPayments;

        if (!Number.isInteger(quotationId) || quotationId <= 0) {
            alertify.alert("Error", "The selected quotation does not have a valid payment ID.");
            return;
        }

        try {
            latestPayments = await loadQuotationPayments(refNo);
        } catch (error) {
            alertify.alert("Error", "Unable to verify the existing payment records.");
            return;
        }

        const paidBeforePayment = latestPayments.reduce(
            (total, payment) => total + Number(
                payment?.paidAmount ?? payment?.PaidAmount ?? payment?.paymentAmount ?? 0,
            ),
            0,
        );
        const currentBalance = Math.max(quotationTotal - paidBeforePayment, 0);
        const currentDepositBalance = depositTarget == null
            ? 0
            : Math.max(depositTarget - paidBeforePayment, 0);
        const currentDepositOutstanding = isDepositPaymentTerm && currentDepositBalance > 0;
        const currentFullPaymentAmount = currentDepositOutstanding
            ? Math.min(currentDepositBalance, currentBalance)
            : currentBalance;
        const enteredAmount = paymentMode === "full"
            ? currentFullPaymentAmount
            : Number(paymentAmount);
        const nextPaidAmount = paidBeforePayment + enteredAmount;

        if (paymentOption === "deposit" && !isDepositPaymentTerm) {
            alertify.alert("Error", "Deposit payments are only available for quotations with deposit payment terms.");
            return;
        }

        if (!paymentMode) {
            alertify.alert("Error", "Select full payment or partial payment.");
            return;
        }

        if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
            alertify.alert("Error", "Enter a payment amount greater than zero.");
            return;
        }

        if (enteredAmount > currentBalance) {
            alertify.alert("Error", `Payment cannot exceed the remaining balance of ${formatMoney(currentBalance)}.`);
            return;
        }

        const isFullyPaid = quotationTotal > 0 && nextPaidAmount >= quotationTotal;
        const isDepositSatisfied = isDepositPaymentTerm &&
            depositTarget != null &&
            nextPaidAmount >= depositTarget;
        if (paymentMode === "full" && !currentDepositOutstanding && !isFullyPaid) {
            alertify.alert("Error", `The full payment amount is ${formatMoney(currentBalance)}.`);
            return;
        }

        try {
            setPopupLoadingInvoice(true);
            const isPartialPayment = paymentMode === "partial";
            const nextStatus = isFullyPaid
                ? "Paid"
                : isDepositSatisfied
                    ? "Deposit Paid"
                    : isPartialPayment
                        ? "Partial Paid"
                        : isDepositPaymentTerm
                            ? "Deposit Paid"
                            : selectedPaidQuotation.quotationStatus || "Proforma Invoice Generated";
            console.log("Record payment request:", {
                QuotationRefNo: quotationId,
                TotalAmount: quotationTotal,
                DepositAmount: depositTarget || 0,
                PaymentAmount: enteredAmount,
                PaymentMethod: paymentMode,
                TransactionId: null,
            });
            const paymentRequest = {
                QuotationRefNo: quotationId,
                TotalAmount: quotationTotal,
                DepositAmount: depositTarget || 0,
                PaymentAmount: enteredAmount,
                PaymentMethod: paymentMode,
                TransactionId: null,
            };


            // if (isFullyPaid) {
            //     await handleGenerateInvoice(refNo, unpaidstatus, invoicestatus);
            //     paymentResponse = await recordQuotationPayment(paymentRequest);
            // } else {
            //     paymentResponse = await recordQuotationPayment(paymentRequest);
            // }

            let paymentResponse;
            let successMessage = "";

            if (
                isFullyPaid &&
                isInvoiceAlreadyGeneratedUnpaid &&
               (isSuperAdmin || isAdmin)
            ) {
                // Existing invoice already generated as Unpaid.
                // Do NOT generate another invoice.

                paymentResponse = await recordQuotationPayment(paymentRequest);

                // Update existing invoice to Paid
                const invoiceUpdateResponse = await AxiosInstance.post(
                    "/api/Quotation/updateProforma",
                    {
                        InvoiceReferenceNumber: refNo,
                        ProformaReferenceNumber:
                            selectedPaidQuotation.porformaReferenceNumber || "null",
                        Status: "Paid",
                        UnpaidStatus: "Unpaid",
                        TemplateUrl: ProformatemplateUrl,
                    }
                );

                successMessage =
                    invoiceUpdateResponse?.data?.message ||
                    `${refNo} has been Paid successfully`;

            } else if (isFullyPaid) {

                // No existing unpaid invoice.
                // Generate invoice normally.
                // showAlert: false — the consolidated "has been Paid successfully"
                // alert below already covers this, so don't show a second one.
                await handleGenerateInvoice(
                    refNo,
                    unpaidstatus,
                    invoicestatus,
                    { showAlert: false }
                );

                paymentResponse = await recordQuotationPayment(paymentRequest);

                successMessage =
                    `${refNo} has been Paid successfully`;

            } else {

                // Partial payment
                paymentResponse = await recordQuotationPayment(paymentRequest);

                successMessage =
                    `${refNo} payment recorded successfully`;
            }



            const totalPaidFromApi = Number(
                paymentResponse?.totalPaid ??
                paymentResponse?.TotalPaid ??
                nextPaidAmount
            );

            if (!isFullyPaid) {
                await AxiosInstance.post("/api/Quotation/updateProforma", {
                    InvoiceReferenceNumber: refNo,
                    ProformaReferenceNumber:
                        selectedPaidQuotation.porformaReferenceNumber || "null",
                    Status: nextStatus,
                    TemplateUrl: ProformatemplateUrl,
                });
            }

            try {
                await uploadPaymentProof(
                    refNo,
                    fileToUpload,
                    nextStatus
                );
            } catch (uploadError) {
                console.error("Error uploading payment proof:", uploadError);

                alertify.alert(
                    "Warning",
                    "Payment saved, but the proof of payment could not be uploaded."
                );
            }

            refreshPaymentFiles();

            alertify.alert(
                "Success",
                successMessage,
                () => {
                    dispatch(fetchQuotationlist());
                    refreshPaymentFiles();
                }
            );




            if (!isFullyPaid) {
                alertify.alert(
                    "Success",
                    `Payment recorded. Remaining balance: ${formatMoney(quotationTotal - totalPaidFromApi)}.`,
                    () => refreshPaymentFiles(),
                );
                dispatch(fetchQuotationlist());
            }
            handleClosePaidPopup();
        } catch (err) {
            console.error("Payment or invoice generation failed:", err);
            const responseData = err?.response?.data;
            const message =
                (typeof responseData === "string" && responseData) ||
                responseData?.message ||
                responseData?.title ||
                err?.message ||
                "Payment could not be saved and the invoice was not generated.";
            alertify.alert("Error", message);
        } finally {
            setPopupLoadingInvoice(false);
        }
    };

    // Proforma follow-up, "No" branch — hand over to the reason popup instead of
    // cancelling straight away. The quotation is kept aside because closing the
    // payment dialog clears selectedPaidQuotation.
    const handleOpenCancelReasonPopup = () => {
        if (!selectedPaidQuotation) return;

        setCancelTargetQuotation(selectedPaidQuotation);
        setCancelReason("");
        setReasonPopupMode("cancel");
        handleClosePaidPopup();
        setShowCancelReasonPopup(true);
    };

    // Approved quotation, "Decline" branch — same reason capture popup, but
    // this rejects the quotation outright rather than cancelling a proforma.
    const handleOpenDeclineReasonPopup = () => {
        if (!selectedPaidQuotation) return;

        setCancelTargetQuotation(selectedPaidQuotation);
        setCancelReason("");
        setReasonPopupMode("decline");
        handleClosePaidPopup();
        setShowCancelReasonPopup(true);
    };

    const handleCloseCancelReasonPopup = () => {
        setShowCancelReasonPopup(false);
        setCancelReason("");
        setCancelTargetQuotation(null);
    };

    // The customer never paid, so the quotation is closed off with the
    // captured reason — cancelled if it was already a proforma, rejected if
    // it was declined straight out of Approved.
    const handleCancelProformaFromPopup = async () => {
        if (!cancelTargetQuotation) return;

        const isDecline = reasonPopupMode === "decline";

        if (!cancelReason.trim()) {
            alertify.alert("Error", `Please enter a reason before ${isDecline ? "declining" : "cancelling"}.`);
            return;
        }
        try {
            setPopupLoadingCancel(true);
            const response = await AxiosInstance.post("/api/Quotation/updateProforma", {
                InvoiceReferenceNumber: cancelTargetQuotation.quotationReferenceNumber,
                ProformaReferenceNumber: cancelTargetQuotation.porformaReferenceNumber,
                Status: isDecline ? "Rejected" : "Closed",
                Reason: cancelReason.trim(),
                TemplateUrl: ProformatemplateUrl

            });
            alertify.alert("Success", response.data.message, () => refreshPaymentFiles());
            dispatch(fetchQuotationlist());
            handleCloseCancelReasonPopup();
        } catch (error) {
            alertify.alert("Error", `Failed to ${isDecline ? "decline" : "cancel"} this quotation.`);
        } finally {
            setPopupLoadingCancel(false);
        }
    };

    const handleSaveProformaFromPopup = () => {
        if (selectedPaidQuotation) {
            (async () => {
                try {
                    setPopupLoadingProforma(true);
                    await handleSaveProforma(selectedPaidQuotation.quotationReferenceNumber);
                    setPopupLoadingProforma(false);
                    handleClosePaidPopup();
                } catch (err) {
                    setPopupLoadingProforma(false);
                }
            })();
        }
    };

    //popup open//
    const handleClosePopup = () => {
        setSelectedQuotation(null);
        setShowModal(false);
    };

    //generate Invoice

    const [loadingRefNo, setLoadingRefNo] = useState(null);


    // selector with default
    const { loadingByRefNo = {}, statusofInvoicegeneration } = useSelector(
        (state) => state.quotationapproval || {}
    );
    const [invoiceMessage, setInvoiceMessage] = useState('');

    const handleGenerateInvoice = (refNo, unpaidstatus, invoicestatus, options = {}) => {
        const { showAlert = true } = options;
        setLoadingRefNo(refNo);


        return dispatch(savegenerateinvoicewitherefno({ refNo, templateUrl, unpaidstatus, invoicestatus }))
            .unwrap()
            .then((res) => {
                setLoadingRefNo(false);
                setSelectedQuotation(null);
                console.log("Invoice generated successfully:", res.mess);
                setInvoiceMessage(res.message); // store message
                if (showAlert) {
                    alertify.alert("Success", res.message);
                }
                dispatch(fetchQuotationlist()); // refresh list
            })
            .catch((err) => {
                setLoadingRefNo(null);
                setSelectedQuotation(null);
                console.error("Error generating invoice:", err);
                // unwrap() throws the rejectWithValue payload (a string) — show
                // what the API actually said instead of a generic message.
                const message =
                    (typeof err === "string" && err) ||
                    err?.message ||
                    "Failed to generate invoice";
                alertify.alert("Error", message);
                throw err;
            });
    };


    const [downloadingId, setDownloadingId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingCancelId, setPendingCancelId] = useState(null);
    const handleDownloadQuotation = async (
        quotationId,
        referenceNumber,
        isProformaDocument = false
    ) => {

        try {

            setDownloadingId(quotationId);

            // Allow UI render
            await new Promise((resolve) => setTimeout(resolve, 300));

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
    const handleApprove = (invoiceId, quotationReferenceNumber) => {
        window.alert("ref no", quotationReferenceNumber);
        alertify.confirm(
            "Confirmation",
            "Are you sure you want to update status of this invoice as Paid?",
            function () {
                setPaidLoadingId(invoiceId);
                dispatch(
                    fetchSaveInvoicestatusPaidorcancel({
                        InvoiceId: invoiceId,
                        type: "Paid",
                        reason: ""
                    })
                ).then((res) => {
                    setPaidLoadingId(null);
                    if (res.meta.requestStatus === "fulfilled") {
                        alertify.alert("Success", res.payload.message, function () {
                            dispatch(fetchQuotationlist()); // refresh list

                        });
                        handleGenerateInvoice(quotationReferenceNumber)
                    } else {
                        alertify.alert("Error", "Failed to update invoice as Paid.");
                    }
                });
            },
            function () {
                alertify.alert('Warning', "Payment update cancelled.");
            }
        );
    };
    const handleCancel = (invoiceId) => {
        setPendingCancelId(invoiceId);
        setShowConfirmModal(true);
    };

    // Quotation being acted on, shown inside the payment dialog so the user can
    // see exactly which reference number they are deciding about.
    const renderQuotationSummary = (quotation) => {
        if (!quotation) return null;

        const rows = [
            ["Quotation Ref No", quotation.quotationReferenceNumber],
            ["Company", quotation.companyName],
            ["Customer", quotation.customerName],
            [
                "Quotation Date",
                quotation.quotationDate
                    ? new Date(quotation.quotationDate).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                    })
                    : "-",
            ],
            [
                "Due Date",
                quotation.quotationDate
                    ? new Date(quotation.dueDate).toLocaleDateString("en-GB", {
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
        <div className="quotation-approval-container">
            {/* <h2 className='quotationapprovalheading'>Quotation Approval List</h2> */}
            <div className="list-header">
                <h2 className="Auditlogheading">Quotation Approval List</h2>
                <HoloButton
                    variant="secondary"
                    size="md"
                    onClick={() => setShowHelp(true)}
                >
                    <i className="fas fa-question-circle"></i> Help
                </HoloButton>
            </div>

            <div className="filter-section">
                {/* <input
                    type="text"
                    value={tempFilters.referenceNumber}
                    onChange={(e) =>
                        setTempFilters({ ...tempFilters, referenceNumber: e.target.value })
                    }
                    // placeholder="Quotation Id"
                    placeholder={isQuotation ? "Quotation Id" : "Quotation /  Proforma Invoice"}
                /> */}
                <input
                    type="text"
                    value={tempFilters.referenceNumber}
                    onChange={(e) =>
                        setTempFilters({
                            ...tempFilters,
                            referenceNumber: e.target.value
                        })
                    }
                    placeholder="Quotation / Proforma"
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
                        if (newDate && newDate.isValid && newDate.isValid()) {
                            setTempFilters({
                                ...tempFilters,
                                invoiceDate: newDate.format('YYYY-MM-DD'),
                            });
                        } else {
                            setTempFilters({
                                ...tempFilters,
                                invoiceDate: '',
                            });
                        }
                    }}
                    className="common-input" label="Quotation Date" placeholder="Quotation Date"
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
                        setTempFilters(clearedFilters); setFilters(clearedFilters); setActiveStage(null); setCurrentPage(1);
                    }}
                >
                    Clear
                </HoloButton>
            </div>

            <StatusPipeline
                stages={APPROVAL_PIPELINE_STAGES}
                items={filteredQuotations}
                getKey={getApprovalStageKey}
                title="Quotation Status"
                subtitle="Click a status to show only those records — click it again to clear"
                showTotal
                activeKey={activeStage}
                onStageClick={handleStageClick}
            />

            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort("referenceNumber")}>
                            QUOTATION ID {""}
                            {sortConfig.key === "referenceNumber" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
                        </th>
                        <th>PROFOMA NUMBER</th>
                        <th>QUOTATION DATE</th>
                        <th>COMPANY NAME</th>
                        <th>CUSTOMER NAME</th>
                        <th>STATUS</th>
                        <th>VIEW</th>
                        <th>ACTION</th>

                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8" style={{ textAlign: "center", padding: "40px 0" }}>
                                <div className="loader"></div>
                            </td>
                        </tr>
                    ) : visibleQuotations.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>
                                No result found.
                            </td>
                        </tr>
                    ) : (
                        currentItems.map((q) => (
                            <tr key={q.quotationId}>
                                <td style={{
                                    width: "18%"
                                }}>{q.quotationReferenceNumber}</td>

                                <td style={{ width: "15%" }}>
                                    {q.porformaReferenceNumber === null ||
                                        q.porformaReferenceNumber === undefined ||
                                        q.porformaReferenceNumber === "null" ||
                                        q.porformaReferenceNumber === ""
                                        ? "-"
                                        : q.porformaReferenceNumber}
                                </td>
                                <td style={{
                                    width: "15%"
                                }}>
                                    {q.quotationDate
                                        ? new Date(q.quotationDate).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                        : "-"}


                                </td>
                                <td style={{
                                    width: "15%"
                                }}>{q.companyName || '-'}</td>
                                <td style={{
                                    width: "15%"
                                }}>{q.customerName}</td>
                                <td style={{
                                    width: "12%",

                                }}
                                >
                                    <span
                                        className={`status ${quotationRowStatus(q)
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")}`}
                                    >
                                        {q.quotationStatus || q.status}
                                    </span>
                                </td>

                                <td style={{
                                    width: "12%"
                                }}>
                                    <FaEye
                                        style={{ cursor: 'pointer', }}
                                        className="action-icon view-icon"
                                        onClick={() => handleViewClick(q)}
                                        title="View Quotation Details"
                                    />
                                </td>

                                <td
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "nowrap",
                                        gap: "10px"
                                    }}
                                >
                                    {/* Only rows still awaiting payment can be actioned —
                                        once invoiced or cancelled the quotation is done. */}
                                    {["approved", "proforma invoice generated", "deposit paid", "partial paid", "overdue", "unpaid"].includes(
                                        (q.quotationStatus || "").toLowerCase().trim()
                                    ) && (
                                            <HoloButton
                                                variant="primary"
                                                size="md"
                                                title="Record payment outcome for this quotation"
                                                onClick={() => handleOpenPaidPopup(q)}
                                                style={{
                                                    backgroundColor: "#1E7D4E",
                                                    minWidth: "140px",
                                                    fontSize: "12.5px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "6px",
                                                    whiteSpace: "nowrap",
                                                    borderRadius: "10px",
                                                    color: "#fff",
                                                    height: "34px !important",
                                                }}
                                            >
                                                <FaMoneyCheckAlt />
                                                Update Payment
                                            </HoloButton>
                                        )}

                                    {/* <div
                                        onClick={() => handleApprove(q.quotationId, q.quotationReferenceNumber)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {paidLoadingId === q.quotationId ? (
                                            <span className="icon-spinner"></span>
                                        ) : (
                                            <FaCheckCircle
                                                title="Marks as Paid"
                                                className="action-icon invoicepaid-icon"
                                            />
                                        )}
                                    </div> */}



                                    {downloadingId === q.quotationId ? (
                                        <div
                                            className="spinner"
                                            style={{
                                                width: "18px",
                                                height: "18px"
                                            }}
                                        ></div>
                                    ) : (
                                        <FaDownload
                                            style={{
                                                color: "#2563eb",
                                                cursor: "pointer"
                                            }}
                                            className="action-icon download-icon"
                                            onClick={() =>
                                                handleDownloadQuotation(
                                                    q.quotationId,
                                                    q.quotationReferenceNumber,
                                                    /proforma/i.test(
                                                        String(
                                                            q.quotationStatus || q.status || ""
                                                        )
                                                    ) ||
                                                    Boolean(
                                                        q.porformaReferenceNumber  
                                                    )
                                                )
                                            }
                                            title={
        /proforma/i.test(
            String(q.quotationStatus || q.status || "")
        )
            ? "Proforma Invoice Download"
            : "Quotation Download"
    }
                                        />
                                    )}

                                    {/* Proof of payment captured on the Update Payment dialog.
                                        Only Invoice Generated / Paid rows own one. */}
                                    <PaymentProofAction
                                        referenceNumber={q.quotationReferenceNumber}
                                        status={q.quotationStatus}
                                        files={proofFilesByRef[q.quotationReferenceNumber]}
                                        loading={proofFilesLoading}
                                        subtitle={`Quotation ${q.quotationReferenceNumber || ""}`.trim()}
                                    />
                                </td>


                            </tr>
                        ))

                    )}
                </tbody>
            </table>

            {!loading && quotationList.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={visibleQuotations.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}

            <AlertDialog
                open={showPaidPopup && !!selectedPaidQuotation}
                onOpenChange={handleClosePaidPopup}
            >
                <AlertDialogContent
                    className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 gap-6"
                    closeOnOutsideClick={false}
                >
                    <AlertDialogHeader className="relative pr-10">
                        <button
                            type="button"
                            className="quotation-view-close-btn absolute right-0 top-0"
                            onClick={handleClosePaidPopup}
                            aria-label="Close payment dialog"
                            title="Close"
                        >
                            <FaTimesCircle />
                        </button>
                        <AlertDialogTitle className="text-xl">
                            {isProformaFollowUp ? "Record another payment" : "Record payment"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            {isDepositPaymentTerm ? (
                                <>
                                    This quotation requires a {depositPercentage}% deposit. Select{" "}
                                    <strong>{isDepositBalanceOutstanding ? "Full deposit payment" : "Full payment"}</strong>{" "}
                                    to pay the current amount due, or{" "}
                                    <strong>{isDepositBalanceOutstanding ? "Partial deposit payment" : "Partial payment"}</strong>{" "}
                                    to enter another amount.
                                </>
                            ) : isProformaFollowUp ? (
                                <>
                                    This quotation does not have a deposit term. Select{" "}
                                    <strong>Full payment</strong> to pay the remaining balance, or{" "}
                                    <strong>Partial payment</strong> to enter another amount.
                                </>
                            ) : (
                                <>
                                    This quotation does not have a deposit term. Select{" "}
                                    <strong>Full payment</strong> to pay the remaining balance, or{" "}
                                    <strong>Partial payment</strong> to enter another amount.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {renderQuotationSummary(selectedPaidQuotation)}

                    <div className="payment-balance-summary">
                        <div>Total quotation: <strong>{formatMoney(quotationTotal)}</strong></div>
                        <div>
                            {isDepositBalanceOutstanding
                                ? `Deposit amount (${depositPercentage}%)`
                                : "Amount due"}: <strong>{formatMoney(paymentTarget)}</strong>
                        </div>
                        <div>Previously paid: <strong>{formatMoney(quotationPaid)}</strong></div>
                        <div>Remaining balance: <strong>{formatMoney(quotationBalance)}</strong></div>
                    </div>

                    <div className="paid-action-body" style={{ padding: 0 }}>
                        <div className="payment-option-row">
                            {/* Show payment options for all quotations including overdue */}
                            <>
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        value="full"
                                        checked={paymentMode === "full"}
                                        onChange={() => handlePaymentModeChange("full")}
                                    />
                                    {isDepositBalanceOutstanding ? "Full deposit payment" : "Full payment"}
                                </label>

                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        value="partial"
                                        checked={paymentMode === "partial"}
                                        onChange={() => handlePaymentModeChange("partial")}
                                    />
                                    {isDepositBalanceOutstanding ? "Partial deposit payment" : "Partial payment"}
                                </label>
                            </>
                        


                            {canShowUnpaidOption && (
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="paymentOption"
                                        value="unpaid"
                                        checked={paymentOption === "unpaid"}
                                        onChange={() => {
                                            setPaymentOption("unpaid");
                                            setPaymentMode("");
                                            setPaymentAmount("");
                                        }}
                                    />
                                    Unpaid
                                </label>
                            )}

                           {paymentOption === "unpaid" && (
                                <>
                                    {/* Generate Proforma - available for everyone */}
                                    <button
                                        type="button"
                                        className="generate-proforma-btn"
                                        disabled={popupLoadingProforma || popupLoadingInvoice}
                                        onClick={handleSaveProformaFromPopup}
                                    >
                                        {popupLoadingProforma ? (
                                            <span className="spinner"></span>
                                        ) : (
                                            "Generate Proforma"
                                        )}
                                    </button>

                                    {/* Generate Invoice - Super Admin only */}
                                    {isSuperAdmin && (
                                        <button
                                            type="button"
                                            className="generate-invoice-btn"
                                            disabled={popupLoadingInvoice || popupLoadingProforma}
                                            onClick={async () => {
                                                if (!selectedPaidQuotation) return;

                                                try {
                                                    setPopupLoadingInvoice(true);

                                                    const refNo =
                                                        selectedPaidQuotation.quotationReferenceNumber;

                                                    await handleGenerateInvoice(refNo, 'Unpaid', 'Unpaid & Created');

                                                    handleClosePaidPopup();
                                                } catch (error) {
                                                    console.error(
                                                        "Failed to generate invoice:",
                                                        error
                                                    );
                                                } finally {
                                                    setPopupLoadingInvoice(false);
                                                }
                                            }}
                                        >
                                            {popupLoadingInvoice ? (
                                                <span className="spinner"></span>
                                            ) : (
                                                "Generate Invoice"
                                            )}
                                        </button>
                                    )}
                                </>
                            )}




                        </div>

                        {paymentMode && paymentOption !== "unpaid" && (
                            <>
                                <div className="payment-amount-row">
                                    <label htmlFor="payment-amount">Amount paid now</label>
                                    <input
                                        id="payment-amount"
                                        type="number"
                                        min="0.01"
                                        max={quotationBalance || undefined}
                                        step="0.01"
                                        value={paymentMode === "full"
                                            ? formatMoney(fullPaymentAmount)
                                            : paymentAmount}
                                        readOnly={paymentMode === "full"}
                                        onChange={(event) => setPaymentAmount(event.target.value)}
                                        placeholder={formatMoney(fullPaymentAmount || paymentTarget || quotationBalance)}
                                    />
                                </div>
                                <div className="proof-upload-row">
                                    <label className="proof-upload-label">
                                        Upload proof of payment <span style={{ color: "red" }}>*</span>
                                    </label>

                                    {/* <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleProofChange}
                                    /> */}

                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={handleProofChange}
                                    />
                                </div>

                                {proofFile.length > 0 && (
                                    <div className="proof-file-list-section">
                                        <label className="proof-files-label">Uploaded Files:</label>
                                        <div className="proof-file-list">
                                            {proofFile.map((file, index) => (
                                                <div key={`${file.name}-${index}`} className="proof-file-name">
                                                    <span className="proof-file-name-text">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        className="proof-file-remove-btn"
                                                        onClick={() => handleRemoveProofFile(index)}
                                                        disabled={popupLoadingInvoice}
                                                        aria-label={`Remove ${file.name}`}
                                                        title="Remove file"
                                                    >
                                                        <FaTimesCircle />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            onClick={handleClosePaidPopup}
                        >
                            Close
                        </AlertDialogCancel>

                        {/* Plain buttons — they must keep the dialog open while the
                            request is in flight, which AlertDialogAction would not. */}
                        {paymentMode && (
                            // <button
                            //     type="button"
                            //     className="generate-invoice-btn"
                            //     disabled={
                            //         (!isSuperAdmin && proofFile.length === 0) ||
                            //         (!paymentMode && !paymentAmount) ||
                            //         popupLoadingInvoice
                            //     }
                            //     onClick={() => handleGenerateInvoiceFromPopup('Paid', 'Created')}
                            // >
                            //     {popupLoadingInvoice ? (
                            //         <span className="spinner"></span>
                            //     ) : (
                            //         paymentMode === "full"
                            //             ? (isDepositBalanceOutstanding ? "Record Deposit Payment" : "Generate Invoice")
                            //             : "Record Partial Payment"
                            //     )}
                            // </button>
                            <button
                                type="button"
                                className="generate-invoice-btn"
                                disabled={
                                    proofFile.length === 0 ||
                                    popupLoadingInvoice
                                }
                                onClick={() =>
                                    handleGenerateInvoiceFromPopup("Paid", "Created")
                                }
                            >
                                {popupLoadingInvoice ? (
                                    <span className="spinner"></span>
                                ) : (
                                    getPaymentButtonText()
                                )}
                            </button>
                        )}

                        {/* {paymentOption === "unpaid" &&
                            !isProformaFollowUp && (
                                <button
                                    type="button"
                                    className="generate-proforma-btn"
                                    disabled={popupLoadingProforma}
                                    onClick={handleSaveProformaFromPopup}
                                >
                                    {popupLoadingProforma ? (
                                        <span className="spinner"></span>
                                    ) : (
                                        'Generate Proforma'
                                    )}
                                </button>
                            )} */}


                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reason capture — a quotation is only closed off once the user says why. */}
            {showCancelReasonPopup && (
                <div className="cancel-popup-overlay">
                    <div className="cancel-popup">
                        <h4>{reasonPopupMode === "decline" ? "Decline Quotation" : "Cancel Quotation"}</h4>
                        <textarea
                            placeholder={reasonPopupMode === "decline" ? "Enter decline reason..." : "Enter cancellation reason..."}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={4}
                            style={{ width: "100%" }}
                            autoFocus
                        />
                        <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={handleCloseCancelReasonPopup}
                                disabled={popupLoadingCancel}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="paid-btn"
                                onClick={handleCancelProformaFromPopup}
                                disabled={popupLoadingCancel}
                            >
                                {popupLoadingCancel && <span className="spinner"></span>}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ViewPopup show={showModal} onClose={() => setShowModal(false)} selectedInvoice={selectedQuotation} type="quotationapproval"
                onGenerateInvoice={handleGenerateInvoice}
                loadingRefNo={loadingRefNo} />

            <HelpModal show={showHelp} title="Quotation Approval List - Help & Overview" screenName="QuotationApproval" onClose={() => setShowHelp(false)} />



        </div>
    );
};

export default Quotationapproval;
