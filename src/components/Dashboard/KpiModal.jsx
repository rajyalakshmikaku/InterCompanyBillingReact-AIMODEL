import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchQuotationOrInvoiceDetails } from "../../redux/DashboardSlice";
import { fetchCreditnotedetailswithInvoicerefno } from "../../redux/QuotationTemplateSlice";
import QuotationTable from "./QuotationTable";
import InvoiceTable from "./InvoiceTable";
import ViewPopup from "./ViewPopup";
import CreditNotePopup from "./CreditNotePopup";
import Pagination from "../Common/Pagination";
import useSort from "../Common/useSort";
import HoloButton from "../Common/HoloButton";
import { downloadPdfFromPage } from '../../components/Common/downloadPdf';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';


const KpiModal = ({ show, status, type, data, onClose, companyList, selectedReference, companyId }) => {
  debugger;
  const dispatch = useDispatch();
  const { quotationOrInvoiceData, loading } = useSelector((s) => s.dashboardsData);

  const [tempFilters, setTempFilters] = useState({ referenceNumber: "", customerName: "" });
  const [filters, setFilters] = useState({ referenceNumber: "", customerName: "" });

  // The popup's own company dropdown drives the API call directly (server-side
  // filter), rather than matching companyName text against already-fetched rows.
  // It starts from the dashboard-level selection but can be overridden here.
  const [selectedPopupCompany, setSelectedPopupCompany] = useState(companyId || "");
  // Dropdown selection is staged here and only applied (fetched) on the Apply click.
  const [tempPopupCompany, setTempPopupCompany] = useState(companyId || "");

  useEffect(() => {
    setSelectedPopupCompany(companyId || "");
    setTempPopupCompany(companyId || "");
  }, [companyId, show]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [showCreditNotePopup, setShowCreditNotePopup] = useState(false);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [creditViewLoadingId, setCreditViewLoadingId] = useState(null);
  const [creditDownloadLoadingId, setCreditDownloadLoadingId] = useState(null);
  const [invoiceDownloadLoadingId, setInvoiceDownloadLoadingId] = useState(null);

  const [downloadingId, setDownloadingId] = useState(null);

  const getRecordDetails = (item) => {
    const header = item?.header || item?.Header || item || {};
    const details =
      item?.detail ||
      item?.Detail ||
      item?.details ||
      item?.Details ||
      item?.invoiceDetails ||
      item?.InvoiceDetails ||
      item?.quotationDetails ||
      item?.QuotationDetails ||
      item?.lineItems ||
      item?.LineItems ||
      header?.detail ||
      header?.Detail ||
      header?.details ||
      header?.Details ||
      header?.invoiceDetails ||
      header?.InvoiceDetails ||
      [];

    return Array.isArray(details) ? details : [];
  };

  const normalizeRecordDetails = (details) =>
    details.map((detail) => ({
      ...detail,
      itemCode: detail.itemCode ?? detail.ItemCode,
      category: detail.category ?? detail.Category,
      itemName: detail.itemName ?? detail.ItemName,
      quantity: detail.quantity ?? detail.Quantity,
      invoiceQuantity: detail.invoiceQuantity ?? detail.InvoiceQuantity,
      quotationQuantity: detail.quotationQuantity ?? detail.QuotationQuantity,
      unitRate: detail.unitRate ?? detail.UnitRate,
      amount: detail.amount ?? detail.Amount ?? detail.invoiceAmount ?? detail.InvoiceAmount,
      discount: detail.discount ?? detail.Discount,
      tax: detail.tax ?? detail.Tax ?? detail.vat ?? detail.VAT,
      netAmount: detail.netAmount ?? detail.NetAmount,
    }));

  const handleDownloadQuotation = async (
    quotationId,
    referenceNumber
  ) => {
   
    try {
      debugger
      setDownloadingId(quotationId);

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

 useEffect(() => {
  if (show && status && type) {
    dispatch(
      fetchQuotationOrInvoiceDetails({
        type,
        status,
        companyId: selectedPopupCompany || null
      })
    );
  }
}, [show, status, type, selectedPopupCompany, dispatch]);

useEffect(() => {
  if (show && status && type) {
    setFilters({
      referenceNumber: "",
      customerName: ""
    });

    setTempFilters({
      referenceNumber: "",
      customerName: ""
    });

    setCurrentPage(1);
  }
}, [show, status, type]);

  useEffect(() => {
    console.log("Quotation/Invoice Details:", quotationOrInvoiceData);
  }, [quotationOrInvoiceData]);

  useEffect(() => {
  if (!selectedReference || !quotationOrInvoiceData?.length) return;

  const record = quotationOrInvoiceData.find((item) => {
    const header = item.header || item.Header || item;

    const ref =
      header.quotationReferenceNumber ||
      header.QuotationReferenceNumber ||
      header.invoiceReferenceNumber ||
      header.InvoiceReferenceNumber ||
      header.referenceNumber;

    return ref === selectedReference;
  });

  if (record) {
    setSelectedQuotation({
      ...(record.header || record.Header || record),
      detail: normalizeRecordDetails(getRecordDetails(record)),
      paymentHistory:
        record.payments ||
        record.Payments ||
        record.paymentHistory ||
        record.PaymentHistory ||
        [],
    });

    setShowViewModal(true);
    setChildModalOpen(true);
  }
}, [quotationOrInvoiceData, selectedReference]);

  const handleCreditNoteView = async (invoice) => {
    debugger
    const refNo = invoice.header.invoiceReferenceNumber;
    if (!refNo) return;
    try {
      const response = await dispatch(fetchCreditnotedetailswithInvoicerefno(refNo)).unwrap();
      setSelectedCreditNote(response.list);
      setShowCreditNotePopup(true);
      setChildModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewClick = (item) => {
    setSelectedQuotation({
      ...(item.header || item.Header || item),
      detail: normalizeRecordDetails(getRecordDetails(item)),
      paymentHistory:
        item.payments ||
        item.Payments ||
        item.paymentHistory ||
        item.PaymentHistory ||
        [],
    });

    setShowViewModal(true);
    setChildModalOpen(true);
  };

  const filteredData = (quotationOrInvoiceData || []).filter((item) => {
    const header = item.header || {};

    const searchRef =
      type === "Invoice"
        ? (header.invoiceReferenceNumber || "")
        : (header.quotationReferenceNumber || "");

    return (
      (!filters.referenceNumber ||
        searchRef
          .toLowerCase()
          .includes(filters.referenceNumber.toLowerCase())) &&

      (!filters.customerName ||
        (header.customerName || "")
          .toLowerCase()
          .includes(filters.customerName.toLowerCase()))
    );
  });

  const { sortedData, sortConfig, requestSort } = useSort([...filteredData]);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              <h3 className="kpi-modal-title">{type} Records</h3>
              {!loading && (
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
                  type === "Quotation"
                    ? "Search Quotation ID…"
                    : "Search Invoice ID…"
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
              <select
                value={tempPopupCompany}
                onChange={(e) => setTempPopupCompany(e.target.value)}
              >
                <option value="">All Companies</option>
                {(companyList || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
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
                  setSelectedPopupCompany(tempPopupCompany);
                  setCurrentPage(1);
                }}
              >
                Apply
              </HoloButton>

              <HoloButton
                variant="secondary"
                size="md"
                onClick={() => {
                  const empty = {
                    referenceNumber: "",
                    customerName: "",
                  };
                  setTempFilters(empty);
                  setFilters(empty);
                  setSelectedPopupCompany("");
                  setTempPopupCompany("");
                  setCurrentPage(1);
                }}
              >
                Reset
              </HoloButton>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="kpi-modal-body">
            {type === "Quotation" ? (
              <QuotationTable
                data={paginatedData}
                loading={loading}
                status={status}
                sortConfig={sortConfig}
                onSort={requestSort}
                onView={handleViewClick}
                downloadingId={downloadingId}
                onDownload={handleDownloadQuotation}
              />
            ) : (
              <InvoiceTable
                data={paginatedData}
                loading={loading}
                status={status}
                sortConfig={sortConfig}
                onSort={requestSort}

                onView={handleViewClick}

                onDownloadInvoice={handleDownloadInvoice}
                invoiceDownloadLoadingId={invoiceDownloadLoadingId}

                onViewCreditNote={handleCreditNoteView}
                onDownloadCreditNote={handleCreditNoteDownloadClick}

                creditDownloadLoadingId={creditDownloadLoadingId}
                creditViewLoadingId={creditViewLoadingId}
              />
            )}

            {!loading && filteredData.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}

            {!loading && filteredData.length === 0 && (
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
                <span>Try adjusting your filters</span>
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
            type={type}
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

export default KpiModal;
