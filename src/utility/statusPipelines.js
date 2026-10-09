// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for the quotation / invoice lifecycles.
//
// Every stage carries four things so a screen can drive its pipeline either
// from the count endpoint or from the rows it already has on screen:
//
//   countKeys    key(s) used by /api/Dashboard/getQuotationorInvoicecount.
//                That payload misspells two of them (`inoivcegenerated`,
//                `profroma`), so lookups are normalised and accept aliases —
//                a backend spelling fix will not silently zero the stage.
//   statuses     the quotationStatus / invoiceStatus strings a row can carry,
//                for the list screens that count their own rows.
//   drillStatus  the exact string the details endpoint expects as its filter,
//                so clicking a stage returns the records behind the number.
//   accent       the `stat-*` CSS class used by the summary cards.
//
// A stage may also carry `matches(row)` — a rule that decides the stage from
// the row itself rather than from its stored status. Overdue is the only one:
// it is a due-date calculation, so it is worked out on screen instead of
// waiting for a status the record never gets written.
//
// A stage flagged `derived: true` can only ever come from the count endpoint,
// so row-driven screens skip it — see `rowStages`.
// ─────────────────────────────────────────────────────────────────────────

const normalizeKey = (key) =>
    String(key ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Reads a count off a bucket of the count payload, tolerating the endpoint's
 * key spelling. `keys` may be a single key or a list of accepted aliases.
 */
export const readCount = (bucket, keys) => {
    if (!bucket || typeof bucket !== "object") return 0;

    const wanted = (Array.isArray(keys) ? keys : [keys]).map(normalizeKey);
    const match = Object.entries(bucket).find(([key]) =>
        wanted.includes(normalizeKey(key))
    );

    return Number(match?.[1]) || 0;
};

// Screens hand rows in with different shapes — the list screens map the API
// onto `Status`, everything else keeps the API's `quotationStatus`.
const quotationStatusOf = (row) =>
    String(row?.quotationStatus ?? row?.Status ?? row?.status ?? "")
        .toLowerCase()
        .trim();

const dueDateOf = (row) => row?.dueDate ?? row?.DueDate ?? row?.duedate ?? "";

/** True when `value` is a date strictly before today. */
const isPastDue = (value) => {
    if (!value) return false;

    const due = new Date(value);
    if (Number.isNaN(due.getTime())) return false;
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return due < today;
};

// A quotation still waiting on the customer is overdue once its due date has
// passed. Anything already invoiced, closed or expired has run its course, so
// it stays where it is. A proforma that has already been generated is also
// left alone here — the backend doesn't flip it to Overdue on its own, so the
// UI shouldn't relabel it either once a proforma is out.
const OPEN_QUOTATION_STATUSES = [
    "created",
    "updated",
    "approved",
];

/**
 * Overdue is a due-date rule, not a stored status — the backend counts it for
 * the dashboard, and this works out the same thing for the rows on screen.
 */
export const isQuotationOverdue = (row) => {
    const status = quotationStatusOf(row);
    if (status === "overdue") return true;

    return OPEN_QUOTATION_STATUSES.includes(status) && isPastDue(dueDateOf(row));
};

// "Rejected" is what the API stores and what its filters expect; "Closed" is
// what the business calls it, so the wire value is translated on the way out.
const CLOSED_LABEL = "Closed";
const REJECTED_STATUS = "rejected";

/** Display text for a stored quotation status string. */
export const quotationStatusLabel = (status) => {
    const value = String(status ?? "").trim();
    return value.toLowerCase() === REJECTED_STATUS ? CLOSED_LABEL : value;
};

/** Display text for a quotation row, Overdue included. */
export const quotationRowStatus = (row) =>
    isQuotationOverdue(row)
        ? "Overdue"
        : quotationStatusLabel(row?.quotationStatus ?? row?.Status ?? row?.status);

// Quotation lifecycle: created → approved → (proforma) → invoiced, with
// closed / expired as the terminal outcomes and overdue worked out from the
// due date on top.

export const QUOTATION_STAGES = [
    {
        key: "created",
        label: "Created",
        short: "Created",
        color: "#3b82f6",
        accent: "created",
        hint: "Quotation raised, awaiting approval",
        countKeys: ["created"],
        statuses: ["created", "updated"],
        drillStatus: "Created",
    },
    {
        key: "approved",
        label: "Approved",
        short: "Approved",
        color: "#f59e0b",
        accent: "approved",
        hint: "Quotation approved, awaiting payment decision",
        countKeys: ["approved"],
        statuses: ["approved"],
        drillStatus: "Approved",
    },
    {
        key: "depositPaid",
        label: "Deposit Paid",
        short: "Deposit Paid",
        color: "#eab308",
        accent: "deposit-paid",
        hint: "Part payment received, balance remains",
        countKeys: ["depositPaid", "depositpaid"],
        statuses: ["deposit paid"],
        drillStatus: "Deposit Paid",
    },
    {
        key: "partialPaid",
        label: "Partial Paid",
        short: "Partial Paid",
        color: "#f97316",
        accent: "partial-paid",
        hint: "An installment was received, balance remains",
        countKeys: ["partialPaid", "partialPaid"],
        statuses: ["partial paid"],
        drillStatus: "Partial Paid",
    },
       {
        key: "unpaid",
        label: "Unpaid",
        short: "Unpaid",
        color: "#3531a9",
        accent: "unpaid",
        hint: "Quotation unpaid",

        countKeys: ["unpaid", "unpaidCount", "Unpaid"],
        statuses: ["unpaid"],
        drillStatus: "Unpaid",

        // Unpaid quotations are hard-removed, not a lifecycle outcome, so
        // they are reported next to the track rather than inside it - same
        // treatment as Proforma on the invoice track.
        excludeFromTotal: true,
    },

    {
        key: "rejected",
        label: "Rejected",
        short: "Rejected",
        color: "#ef4444",
        accent: "rejected",
        hint: "Quotation rejected",
        countKeys: ["rejected"],
        // A declined-before-proforma quotation is stored as "Rejected"; a
        // proforma cancelled before payment is stored as "Closed" — same
        // rejected-track outcome, so both land in this stage.
        statuses: ["rejected", "closed"],
        drillStatus: "Rejected",
    },
     {
        key: "paid",
        label: "Paid",
        short: "Paid",
        color: "#8b5cf6",
        accent: "paid",
        hint: "Quotation has been Paid",
        countKeys: ["paid", "paid"],
        statuses: ["paid", "paid"],
        drillStatus: "Paid",
    },
    {
        key: "expired",
        label: "Expired",
        short: "Expired",
        color: "#94a3b8",
        accent: "expired",
        hint: "Quotation lapsed before it was actioned",
        countKeys: ["expired"],
        statuses: ["expired"],
        drillStatus: "Expired",
    },
    {
        key: "overdue",
        label: "Overdue",
        short: "Overdue",
        color: "#111827",
        accent: "overdue",
        hint: "Past its due date and still open",
        countKeys: ["overdue"],
        statuses: ["overdue"],
        drillStatus: "Overdue",
        matches: isQuotationOverdue,
    },
    {
        key: "deleted",
        label: "Deleted",
        short: "Deleted",
        color: "#dc2626",
        accent: "deleted",
        hint: "Quotation deleted",
        countKeys: ["deleted", "deletedCount", "Deleted"],
        statuses: ["deleted"],
        drillStatus: "Deleted",
        excludeFromTotal: true,
    },
  
];
// Invoice lifecycle: generated → exactly one terminal outcome.
export const INVOICE_STAGES = [
  
    {
        key: "proforma",
        label: "Proforma Invoice",
        short: "Proforma",
        color: "#06b6d4",
        accent: "proforma",
        hint: "Proforma invoice issued",
        countKeys: ["proformaGenerated", "profroma", "proforma"],
        statuses: ["proforma invoice generated"],
        drillStatus: "Proforma Invoice Generated",

        // Proforma is displayed separately and is not part of Invoice Total
        excludeFromTotal: true,
    },
    {
        key: "unpaidandCreated",
        label: "Unpaid & Created",
        short: "unpaidandCreated",
        color: "#f97316",
        accent: "unpaidandCreated",
        hint: "Invoice generated but not yet paid",
        countKeys: ["unpaidandCreated", "unpaidandCreatedCount", "unpaidAndCreated"],
        // The invoice is saved with this exact string (see
        // Quotationapproval.jsx's handleGenerateInvoice(refNo, 'Unpaid', 'Unpaid & Created')
        // call) — the resolver lowercases the row's invoiceStatus before matching,
        // so the entry here has to be the lowercased form, not the no-space key.
        statuses: ["unpaid & created"],
        drillStatus: "Unpaid & Created",
    },
    {
        key: "generated",
        label: "Invoice Generated",
        short: "Generated",
        color: "#3b82f6",
        accent: "created",
        hint: "Invoice raised, awaiting outcome",
        countKeys: ["created"],
        statuses: ["created"],
        drillStatus: "Created",
    },
    {
        key: "completed",
        label: "Order Completed",
        short: "Completed",
        color: "#3D8C4F",
        accent: "completed",
        hint: "Order completed against the invoice",
        countKeys: ["orderCompleted"],
        statuses: ["order completed"],
        drillStatus: "Order Completed",
    },
    {
        key: "refund",
        label: "Refunded",
        short: "Refunded",
        color: "#8b5cf6",
        accent: "refund",
        hint: "Invoice settled by refunding the customer",
        countKeys: ["refunded", "refund"],
        statuses: ["refunded", "refund"],
        drillStatus: "Refunded",
    },
    {
        key: "creditnote",
        label: "Credit Note",
        short: "Credit Note",
        color: "#ec4899",
        accent: "creditnote",
        hint: "Credit note issued against the invoice",
        countKeys: ["creditNote"],
        statuses: ["credit note created"],
        drillStatus: "Credit note Created",
    },
    {
        key: "closed",
        label: "Cancelled",
        short: "Closed",
        color: "#f59e0b",
        accent: "closed",
        hint: "Invoice closed without a refund / credit note",
        countKeys: ["closed", "cancelled"],
        statuses: ["closed", "cancelled"],
        drillStatus: "Cancelled",
    },
      
];


export const INVOICE_PIPELINE_STAGES = [
    {
        key: "created",
        label: "Created",
        short: "Created",
        color: "#3b82f6",
        accent: "created",
        hint: "Invoice created",
        countKeys: ["created"],
        statuses: ["created", "updated"],
        drillStatus: "Created",
    },
   
    {
        key: "closed",
        label: "Cancelled",
        short: "Cancelled",
        color: "#ef4444",
        accent: "closed",
        hint: "Invoice cancelled",
        countKeys: ["closed", "cancelled"],
        statuses: ["closed", "cancelled"],
        drillStatus: "Cancelled",
    },
];


export const getStages = (type) =>
    type === "Quotation" ? QUOTATION_STAGES : INVOICE_STAGES;

// Stages a screen can count off its own rows — a `derived` stage only ever
// comes from the count endpoint, so next to row counts it would read 0.
export const rowStages = (stages) => stages.filter((stage) => !stage.derived);

// Proforma is reported on its own — a separate card on the dashboard and the
// Proforma stage of the invoice track — never as part of the quotation
// lifecycle. Sending those rows to a key no quotation stage owns keeps them out
// of Created (and out of the quotation total) without adding a stage.
export const UNCOUNTED_STAGE_KEY = "proforma";

const QUOTATION_STATUS_OVERRIDES = {
    "proforma invoice generated": UNCOUNTED_STAGE_KEY,
};

/**
 * `fallbackKey` is the stage an unrecognised status lands in — it has to be
 * named, not `stages[0]`: the invoice track starts with Proforma, so the
 * positional default quietly filed every unknown invoice status under Proforma
 * and clicking that stage listed the wrong records.
 */
const buildStageResolver = (stages, readStatus, fallbackKey, overrides = {}) => {
    const lookup = new Map();
    stages.forEach((stage) =>
        stage.statuses.forEach((status) => lookup.set(status, stage.key))
    );

    // Rules beat the stored status — Overdue applies on top of the stage the
    // row would otherwise land in.
    const ruleStages = stages.filter((stage) => typeof stage.matches === "function");

    return (row) => {
        const ruled = ruleStages.find((stage) => stage.matches(row));
        if (ruled) return ruled.key;

        const status = readStatus(row);
        return overrides[status] ?? lookup.get(status) ?? fallbackKey;
    };
};

export const getQuotationStageKey = buildStageResolver(
    QUOTATION_STAGES,
    quotationStatusOf,
    "created",
    QUOTATION_STATUS_OVERRIDES
);

// export const getInvoiceStageKey = buildStageResolver(
//     INVOICE_STAGES,
//     (row) => String(row?.invoiceStatus ?? "").toLowerCase().trim(),
//     "generated"
// );

export const getInvoiceStageKey = buildStageResolver(
    INVOICE_STAGES,
    (row) => String(row?.invoiceStatus ?? "").toLowerCase().trim(),
    "created"
);

export const getInvoicePipelineStageKey = buildStageResolver(
    INVOICE_PIPELINE_STAGES,
    (row) => String(row?.invoiceStatus ?? "").toLowerCase().trim(),
    "created"
);


export const getStageResolver = (type) =>
    type === "Quotation" ? getQuotationStageKey : getInvoiceStageKey;

/** Stages with their count endpoint value attached, ready to render. */
export const stagesWithCounts = (stages, bucket) =>
    stages.map((stage) => ({ ...stage, value: readCount(bucket, stage.countKeys) }));
