import React, { useEffect, useMemo, useState } from "react";
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFilePdf,
  FaPaperclip,
  FaTimes,
} from "react-icons/fa";
import { saveAs } from "file-saver";
import { AxiosInstance, baseURL } from "../../services/api";
import "./PaymentProofFiles.css";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];

// Statuses that mean a payment actually happened, so a proof document can
// exist. Compared against a lower-cased / trimmed status.
export const PAYMENT_PROOF_STATUSES = [
  "created",
  "updated",
  "invoice generated",
  "proforma invoice generated",
  "partial paid",
  "deposit paid",
  "refunded",
  "refund",
  "paid",
  "order completed",
];

export const hasPaymentProofStatus = (...statuses) =>
  statuses.some((status) =>
    PAYMENT_PROOF_STATUSES.includes(String(status || "").toLowerCase().trim()),
  );

// The proof-of-payment endpoint returns rows like
// { filename, filepath: "/PaymentUploads/<guid>_<name>" }, but casing has
// varied across endpoints — flatten to { fileName, filePath } where filePath
// is the server-relative path appended to the base URL.
export const normalizePaymentFiles = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.data || payload?.list || payload?.files || [];

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      const path =
        typeof item === "string"
          ? item
          : item?.filepath || item?.filePath || item?.FilePath || "";
      const name =
        typeof item === "string"
          ? ""
          : item?.filename || item?.fileName || item?.FileName || "";
      // Casing / naming of the Type column has varied across endpoints.
      const type =
        typeof item === "string"
          ? ""
          : item?.type ||
            item?.Type ||
            item?.paymentType ||
            item?.PaymentType ||
            item?.documentType ||
            item?.DocumentType ||
            item?.uploadType ||
            item?.UploadType ||
            "";
      const uploadedOn =
        typeof item === "string"
          ? ""
          : item?.createdDate ||
            item?.CreatedDate ||
            item?.uploadedDate ||
            item?.uploadedOn ||
            "";

      // Backend paths can come through with Windows separators.
      const relativePath = String(path).replace(/\\/g, "/");
      const displayName = String(name || relativePath).split("/").pop();

      if (!relativePath && !displayName) return null;

      return {
        fileName: displayName,
        // No stored path (older rows) — fall back to the shared upload folder.
        filePath: relativePath || `/UploadedFiles/${displayName}`,
        type,
        uploadedOn,
      };
    })
    .filter(Boolean);
};

export const fetchPaymentFiles = async (referenceNumber) => {

  if (!referenceNumber) return [];

  const res = await AxiosInstance.get(
    `/api/Quotation/GetPaymentFiles/${referenceNumber}`,
  );
  console.log("fetchPaymentFiles res", res.data);
  return normalizePaymentFiles(res.data);
};

// ── Type (PaymentUploads.Type) ────────────────────────────────────────────
// Uploads are tagged "Invoice Generated" when a quotation is paid and
// "Refund" when a cancelled invoice is refunded, so a row must only show the
// documents belonging to its own stage.
export const PROOF_TYPE_INVOICE = "Invoice Generated";
export const PROOF_TYPE_PAYMENT = "Payment";
export const PROOF_TYPE_REFUND = "Refund";

const normalizeText = (value) => String(value || "").toLowerCase().trim();

// "Refund" / "Refunded" / "refund proof" all mean the same bucket. Rows saved
// before the Type column existed come through blank — those predate the refund
// flow, so they count as invoice proofs.
const isRefundProof = (value) => normalizeText(value).startsWith("refund");

// Which bucket a row should show, from whichever status field the screen has.
export const proofTypeForStatus = (...statuses) => {
  const status = statuses.map(normalizeText).find(Boolean) || "";
  return isRefundProof(status) ? PROOF_TYPE_REFUND : PROOF_TYPE_INVOICE;
};

// Only two stages actually own a proof document, so only those rows get the
// option — every other status returns null and shows nothing.
//
//   Refunded / Refund            -> the refund document
//   Created / Updated            -> invoice-side names for "the payment that
//   Invoice Generated / Paid        generated this invoice"
//
// Anything else (Approved, Proforma Invoice Generated, Order Completed,
// Cancelled, Closed, Credit note Created, Rejected, Expired, Overdue) has no
// proof of its own.
const PROOF_TYPE_BY_STATUS = {
  refund: PROOF_TYPE_REFUND,
  refunded: PROOF_TYPE_REFUND,
  created: PROOF_TYPE_PAYMENT,
  updated: PROOF_TYPE_PAYMENT,
  "invoice generated": PROOF_TYPE_PAYMENT,
  "proforma invoice generated": PROOF_TYPE_PAYMENT,
  "partial paid": PROOF_TYPE_PAYMENT,
  "deposit paid": PROOF_TYPE_PAYMENT,
  paid: PROOF_TYPE_PAYMENT,
  "order completed": PROOF_TYPE_PAYMENT,
  cancelled: PROOF_TYPE_PAYMENT,
  "credit note created": PROOF_TYPE_PAYMENT,

};

export const proofTypeForRowStatus = (status) =>
  PROOF_TYPE_BY_STATUS[normalizeText(status)] || null;

// Pass proofType = null/"" to opt out of filtering and show everything.
export const filterPaymentFilesByType = (files = [], proofType) => {
  if (!proofType) return files;

  // Deposit proofs and the final payment proofs share one history. Once a
  // quotation is Paid, its earlier deposit documents must remain visible.
  if (proofType === PROOF_TYPE_PAYMENT) {
    return files.filter((file) => !isRefundProof(file.type));
  }

  // GetPaymentFiles has not always projected the Type column. If no row came
  // back with one there is nothing to split on, so show every document rather
  // than silently hiding proofs that do exist. Once the endpoint returns Type
  // the split below takes over on its own.
  if (!files.some((file) => normalizeText(file.type))) {
    if (files.length > 0) {
      console.warn(
        "[PaymentProof] GetPaymentFiles returned no Type for any file — " +
          "cannot separate Refund from Invoice Generated documents, so all " +
          `${files.length} are being shown. Add Type to the endpoint's response.`,
      );
    }
    return files;
  }

  const wantRefund = isRefundProof(proofType);
  return files.filter((file) => isRefundProof(file.type) === wantRefund);
};

// ── Shared fetch cache ────────────────────────────────────────────────────
// The actions-column icon shows its count before it is clicked, so every
// visible row fetches on mount. One promise per reference number keeps that to
// a single request even when several icons/screens ask for the same one.
const paymentFilesCache = new Map();

export const getPaymentFilesCached = (referenceNumber) => {
  if (!referenceNumber) return Promise.resolve([]);

  if (!paymentFilesCache.has(referenceNumber)) {
    paymentFilesCache.set(
      referenceNumber,
      fetchPaymentFiles(referenceNumber).catch((err) => {
        // Drop the rejected promise so a later render can retry.
        paymentFilesCache.delete(referenceNumber);
        throw err;
      }),
    );
  }

  return paymentFilesCache.get(referenceNumber);
};

// Call after uploading a new proof so the counts pick it up.
export const invalidatePaymentFiles = (referenceNumber) => {
  if (referenceNumber) paymentFilesCache.delete(referenceNumber);
  else paymentFilesCache.clear();
};

// Loads the proofs for a whole page of rows up front and returns them keyed by
// reference number, so the tbody loop already has its files (and counts) to
// hand instead of every row firing its own request when rendered.
//
//   const refs = currentItems.map((q) => q.quotationReferenceNumber);
//   const { filesByRef } = usePaymentProofFiles(refs);
//   ... filesByRef[q.quotationReferenceNumber]
export const usePaymentProofFiles = (referenceNumbers = []) => {
  const [filesByRef, setFilesByRef] = useState({});
  const [loading, setLoading] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  // The array is a fresh identity on every render, so the effect keys off a
  // sorted/deduped string instead — same page of rows, same key, no refetch.
  const refKey = useMemo(() => {
    const unique = Array.from(
      new Set((referenceNumbers || []).filter(Boolean).map(String)),
    );
    unique.sort();
    return unique.join("|");
  }, [referenceNumbers]);

  useEffect(() => {
    const refs = refKey ? refKey.split("|") : [];

    if (refs.length === 0) {
      setFilesByRef({});
      return undefined;
    }

    let ignore = false;
    setLoading(true);

    Promise.all(
      refs.map((ref) =>
        // One bad reference must not blank the whole page.
        getPaymentFilesCached(ref)
          .then((files) => [ref, files])
          .catch(() => [ref, []]),
      ),
    )
      .then((entries) => {
        if (!ignore) setFilesByRef(Object.fromEntries(entries));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // Paging / filtering can swap the rows out before this settles.
    return () => {
      ignore = true;
    };
  }, [refKey, reloadVersion]);

  return {
    filesByRef,
    loading,
    refresh: () => setReloadVersion((version) => version + 1),
  };
};

// Proof files are served from the API host at the path the backend stored
// (e.g. /PaymentUploads/<guid>_<name>), so only the base URL is prefixed.
export const buildPaymentFileUrl = (filePath = "") => {
  if (/^https?:\/\//i.test(filePath)) return filePath;
  // encodeURI keeps the slashes but escapes the spaces in the file name.
  return `${baseURL}/${encodeURI(String(filePath).replace(/^\/+/, ""))}`;
};

const isImageFile = (name = "") =>
  IMAGE_EXTENSIONS.includes(name.split(".").pop()?.toLowerCase());

const fileKey = (file, index) => `${file?.filePath || ""}-${index}`;

// Pull the file down as a blob so the browser saves it under its real name.
// The proof files live on the API host, so a cross-origin <a download> would
// be ignored by the browser — the XHR is what makes the rename stick. If the
// host refuses the XHR (CORS) we fall back to a plain anchor, which at worst
// opens the file in a new tab instead of saving it.
export const downloadPaymentFile = async (file) => {
  const url = buildPaymentFileUrl(file?.filePath);
  const name = file?.fileName || "proof-of-payment";

  try {
    const res = await AxiosInstance.get(url, { responseType: "blob" });
    saveAs(res.data, name);
  } catch (err) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

// Sequential on purpose — browsers drop all but the first of a burst of
// simultaneous downloads, so each file is saved before the next is requested.
export const downloadPaymentFiles = async (files = [], onProgress) => {
  for (let i = 0; i < files.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await downloadPaymentFile(files[i]);
    if (onProgress) onProgress(i + 1, files.length);
  }
};

const isPdfFile = (name = "") =>
  name.split(".").pop()?.toLowerCase() === "pdf";

// react-icons rather than a FontAwesome class — the FontAwesome stylesheet is
// only imported on the Quotation page, so `fas fa-file-alt` rendered blank
// everywhere else (which is what hid the icon for PDF proofs).
const PaymentProofThumb = ({ file }) =>
  isImageFile(file.fileName) ? (
    <img
      src={buildPaymentFileUrl(file.filePath)}
      alt={file.fileName}
      className="payment-proof-thumb"
    />
  ) : (
    <span className="payment-proof-icon">
      {isPdfFile(file.fileName) ? <FaFilePdf /> : <FaFileAlt />}
    </span>
  );

// Renders the file list only — the caller supplies the section wrapper/title so
// it can match the surrounding modal's markup.
export const PaymentProofList = ({ files = [], loading = false }) => {
  if (loading) {
    return <span className="payment-proof-empty">Loading files...</span>;
  }

  if (files.length === 0) {
    return (
      <span className="payment-proof-empty">No proof of payment uploaded</span>
    );
  }

  return (
    <div className="payment-proof-list">
      {files.map((file, i) => {
        const fileUrl = buildPaymentFileUrl(file.filePath);
        return (
          <div className="payment-proof-item" key={fileKey(file, i)}>
            <PaymentProofThumb file={file} />
            <span className="payment-proof-name" title={file.fileName}>
              {file.fileName}
            </span>
            <span className="payment-proof-item-actions">
              <a
                className="payment-proof-mini-btn"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`View ${file.fileName}`}
              >
                <FaEye />
              </a>
              <button
                type="button"
                className="payment-proof-mini-btn"
                onClick={() => downloadPaymentFile(file)}
                title={`Download ${file.fileName}`}
              >
                <FaDownload />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Pop-up listing every uploaded proof for one reference number: how many there
// are, their file names, and a per-file / bulk download choice.
export const PaymentProofModal = ({
  open,
  onClose,
  files = [],
  loading = false,
  error = "",
  referenceNumber = "",
  subtitle = "",
}) => {
  const [selected, setSelected] = useState([]);
  const [downloading, setDownloading] = useState("");

  // Reopening for another row must not carry the previous selection over.
  useEffect(() => {
    setSelected([]);
    setDownloading("");
  }, [open, referenceNumber]);

  const keys = useMemo(() => files.map((f, i) => fileKey(f, i)), [files]);
  const allSelected = keys.length > 0 && selected.length === keys.length;

  const toggle = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const toggleAll = () => setSelected(allSelected ? [] : keys);

  const runDownload = async (list, mode) => {
    if (list.length === 0) return;
    setDownloading(mode);
    try {
      await downloadPaymentFiles(list);
    } finally {
      setDownloading("");
    }
  };

  const selectedFiles = files.filter((f, i) => selected.includes(fileKey(f, i)));

  if (!open) return null;

  return (
    <div className="payment-proof-overlay" onClick={onClose}>
      <div
        className="payment-proof-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="payment-proof-modal-header">
          <div>
            <h4 className="payment-proof-modal-title">Proof of Payment</h4>
            <span className="payment-proof-modal-sub">
              {subtitle || referenceNumber}
            </span>
          </div>
          <button
            type="button"
            className="payment-proof-close"
            onClick={onClose}
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="payment-proof-modal-meta">
          {loading ? (
            <span className="payment-proof-empty">Loading documents...</span>
          ) : (
            <span className="payment-proof-count">
              {files.length} document{files.length === 1 ? "" : "s"} uploaded
            </span>
          )}
          {!loading && files.length > 0 && (
            <label className="payment-proof-selectall">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
              />
              Select all
            </label>
          )}
        </div>

        <div className="payment-proof-modal-body">
          {error && <div className="payment-proof-error">{error}</div>}

          {!loading && !error && files.length === 0 && (
            <span className="payment-proof-empty">
              No proof of payment has been uploaded for this record.
            </span>
          )}

          {!loading &&
            files.map((file, i) => {
              const key = fileKey(file, i);
              const fileUrl = buildPaymentFileUrl(file.filePath);
              return (
                <div className="payment-proof-row" key={key}>
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={() => toggle(key)}
                  />
                  <PaymentProofThumb file={file} />
                  <div className="payment-proof-row-text">
                    <span className="payment-proof-name" title={file.fileName}>
                      {file.fileName}
                    </span>
                    {file.type && (
                      <span className="payment-proof-row-type">{file.type}</span>
                    )}
                  </div>
                  <a
                    className="payment-proof-btn ghost"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View ${file.fileName}`}
                  >
                    <FaEye /> View
                  </a>
                  <button
                    type="button"
                    className="payment-proof-btn ghost"
                    onClick={() => runDownload([file], key)}
                    disabled={downloading !== ""}
                    title={`Download ${file.fileName}`}
                  >
                    <FaDownload />
                    {downloading === key ? "..." : "Download"}
                  </button>
                </div>
              );
            })}
        </div>

        <div className="payment-proof-modal-footer">
          <button
            type="button"
            className="payment-proof-btn ghost"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="payment-proof-btn"
            onClick={() => runDownload(selectedFiles, "selected")}
            disabled={selectedFiles.length === 0 || downloading !== ""}
          >
            <FaDownload />
            {downloading === "selected"
              ? "Downloading..."
              : `Download Selected (${selectedFiles.length})`}
          </button>
          <button
            type="button"
            className="payment-proof-btn primary"
            onClick={() => runDownload(files, "all")}
            disabled={files.length === 0 || downloading !== ""}
          >
            <FaDownload />
            {downloading === "all" ? "Downloading..." : "Download All"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Actions-column icon, driven entirely by data the tbody loop already holds —
// it does no fetching of its own. Pass the row's `files` (from
// usePaymentProofFiles) and its `status`; the status decides which Type bucket
// is shown, and a status that owns no proof renders nothing at all.
export const PaymentProofAction = ({
  referenceNumber,
  status,
  files = [],
  loading = false,
  proofType,
  subtitle = "",
  title = "",
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  // Explicit proofType wins; otherwise the status decides, and null means this
  // status has no proof stage.
  const effectiveType =
    proofType === undefined ? proofTypeForRowStatus(status) : proofType;

  const visibleFiles = useMemo(
    () => (effectiveType ? filterPaymentFilesByType(files, effectiveType) : []),
    [files, effectiveType],
  );

  // No proof stage for this status → no option in the actions column.
  if (proofType === undefined && !effectiveType) return null;

  // Still loading, or nothing uploaded for this stage — nothing to offer.
  if (loading || visibleFiles.length === 0) return null;

  const count = visibleFiles.length;

  return (
    <>
      <span className="payment-proof-action-wrap">
        <FaPaperclip
          className={`action-icon proof-icon ${className}`.trim()}
          style={{ cursor: "pointer" }}
          onClick={() => setOpen(true)}
          title={
            title ||
            `View / download ${effectiveType || "proof of payment"} document${
              count === 1 ? "" : "s"
            } (${count})`
          }
        />
        <span className="payment-proof-badge">{count}</span>
      </span>

      <PaymentProofModal
        open={open}
        onClose={() => setOpen(false)}
        files={visibleFiles}
        referenceNumber={referenceNumber}
        subtitle={subtitle}
      />
    </>
  );
};

export default PaymentProofList;
