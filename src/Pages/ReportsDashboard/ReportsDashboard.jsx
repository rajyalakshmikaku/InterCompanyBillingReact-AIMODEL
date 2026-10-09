import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchCompanieswithfilter } from "../../redux/CustomerSlice";
import { fetchOutstandingAmounts, fetchCompanyReceivables } from "../../redux/ReportsDashboardSlice";
import "./ReportsDashboard.css";
import Pagination from "../../components/Common/Pagination";
import HoloButton from "../../components/Common/HoloButton";

import OutstandingInvoiceModal from "../../components/Dashboard/OutstandingInvoiceModal";

const REPORT_TYPES = ["All", "Quotation", "Invoice"];

// SP_GetOutstandingAmounts has no Type column — the row's side is read off the
// reference-number prefix (QUO-… / INV-…). SP_GetCompanyReceivables does return
// Type, so that one is used when present.
const classifyType = (references) => {
  const refs = String(references || "").trim();
  if (/^QUO/i.test(refs)) return "Quotation";
  if (/^INV/i.test(refs)) return "Invoice";
  return "";
};

// Outstanding/Overdue/Paid keep one fixed meaning across both charts (blue/red/green),
// so these hues are kept out of the per-company trend palette below to avoid a company
// line reading as a status line.
const STATUS_COLORS = {
  outstanding: "#2563eb",
  overdue: "#ef4444",
  paid: "#3D8C4F",
};

// Order validated with the dataviz palette checker (adjacent CVD + normal-vision
// floors both pass against the card's light surface) — keep this order when adding hues.
const COLORS = [
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

// Maps to @PeriodDays on SP_GetCompanyReceivables (0 = no date filter)
// const PERIOD_OPTIONS = [
//   { label: "All Time", value: 0 },
//   { label: "Last 30 Days", value: 30 },
//   { label: "Last 60 Days", value: 60 },
//   { label: "Last 90 Days", value: 90 },
//   { label: "Last 6 Months", value: 180 },
//   { label: "Last 12 Months", value: 365 },
// ];

// Compact axis-tick currency, e.g. R 1.5M / R 250K — keeps big amounts inside the plot
const compactZar = (value) => {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `R ${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `R ${(n / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}K`;
  return `R ${Math.round(n)}`;
};

// Parse a period label ("June 2026", "Jun 2026", "2026-06", "06/2026") → {year, month}
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const parsePeriod = (raw) => {
  if (!raw) return null;
  const str = String(raw).trim();
  let m = str.match(/^([A-Za-z]+)\s+(\d{4})$/); // "June 2026"
  if (m) {
    const idx = MONTH_NAMES.findIndex((mo) => mo.startsWith(m[1].toLowerCase()));
    if (idx >= 0) return { year: Number(m[2]), month: idx };
  }
  m = str.match(/^(\d{4})[-/](\d{1,2})$/); // "2026-06"
  if (m) return { year: Number(m[1]), month: Number(m[2]) - 1 };
  m = str.match(/^(\d{1,2})[-/](\d{4})$/); // "06/2026"
  if (m) return { year: Number(m[2]), month: Number(m[1]) - 1 };
  return null;
};

// Full currency for tooltips
const fullZar = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="report-chart-tooltip">
      <p className="report-chart-tooltip-label">{label}</p>
      {payload.map((row) => (
        <p
          key={row.dataKey}
          className="report-chart-tooltip-value"
          style={{ color: row.color || row.fill }}
        >
          <span className="report-tooltip-dot" style={{ background: row.color || row.fill }} />
          {row.name}: {fullZar(row.value)}
        </p>
      ))}
    </div>
  );
};

// Trend tooltip — lists each company's receivable for the hovered period, largest first,
// with the period total and invoice count in the footer
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const bucket = payload[0]?.payload || {};

  const rows = payload
    .filter(
      (r) =>
        r.dataKey !== "__total" &&
        r.dataKey !== "__overdue" &&
        r.dataKey !== "__paid" &&
        Number(r.value) > 0
    )
    .sort((a, b) => Number(b.value) - Number(a.value));

  return (
    <div className="report-chart-tooltip">
      <p className="report-chart-tooltip-label">{label}</p>

      {rows.map((row) => (
        <p
          key={row.dataKey}
          className="report-chart-tooltip-value"
          style={{ color: row.color }}
        >
          <span
            className="report-tooltip-dot"
            style={{ background: row.color }}
          />

          {row.name}: {fullZar(row.value)}
        </p>
      ))}

      <p className="report-chart-tooltip-value">
        <span
          className="report-tooltip-dot"
          style={{ background: STATUS_COLORS.overdue }}
        />
        Overdue: {fullZar(bucket.__overdue)}
      </p>

      <p className="report-chart-tooltip-value">
        <span
          className="report-tooltip-dot"
          style={{ background: STATUS_COLORS.paid }}
        />
        Paid: {fullZar(bucket.__paid)}
      </p>

      <p className="report-chart-tooltip-total">
        Outstanding: {fullZar(bucket.__total)}
        {bucket.__invoices
          ? ` · ${bucket.__invoices} invoice${bucket.__invoices === 1 ? "" : "s"
          }`
          : ""}
      </p>
    </div>
  );
};

const ReportsDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roleName = sessionStorage.getItem("roleName") || "";
  const isSuperAdmin = roleName?.toLowerCase().replace(/\s+/g, "") === "superadmin";

  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState("");
  const [modalType, setModalType] = useState("Invoice");

  const companyList = useSelector((state) => {
    const fromCompanies = state.Customers?.companies || [];
    const fromCompaniesList = state.Customers?.companieslist || [];
    const fromWithoutRole = state.Customers?.comapnieswithoutRole || [];

    return fromCompanies.length > 0 ? fromCompanies : fromCompaniesList.length > 0 ? fromCompaniesList : fromWithoutRole;
  });
  const [selectedInvoiceData, setSelectedInvoiceData] = useState({
    companyName: "",
    receivingEntity: "",
    type: "",
    period: null,
  });
  const handleInvoiceClick = (status) => {
    setModalType("Invoice");
    setModalStatus(status);
    setShowModal(true);
  };

  const {
    outstandingAmounts,
    companyReceivables,
    loadingAmounts,
    loadingCompanyReceivables,
  } = useSelector((state) => state.reports);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [reportType, setReportType] = useState("All");
  const [periodDays, setPeriodDays] = useState(0);
  const [trendInterval, setTrendInterval] = useState("month");

  // Quotations carry an overdue balance; the invoice SP branch returns none
  const showOverdue = reportType !== "Invoice";
  const showpaid = reportType !== "Invoice";
  const showTypeColumn = reportType === "All";

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [outstandingPage, setOutstandingPage] = useState(1);
  const outstandingItemsPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      dispatch(fetchCompanieswithfilter());
      // Always the union — the Type toggle filters the rows on the client so the
      // Quotation / Invoice views stay a subset of the All view.
      dispatch(fetchOutstandingAmounts({ companyName: "" }));
      dispatch(fetchCompanyReceivables({ companyName: "", periodDays: 0 }));
    };

    loadData();
  }, [dispatch]);


  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString("en-ZA");
  };

  const handleCompanyChange = (event) => {
    const nextCompany = event.target.value;
    setSelectedCompany(nextCompany);
    setCurrentPage(1);
    setOutstandingPage(1);

    // Only the receivables SP takes a period; amounts stay all-time
    dispatch(fetchOutstandingAmounts({ companyName: nextCompany }));
    dispatch(fetchCompanyReceivables({ companyName: nextCompany, periodDays }));
  };

  // No refetch — both tables already hold the union, so the toggle is a filter.
  const handleTypeChange = (nextType) => {
    if (nextType === reportType) return;

    setReportType(nextType);
    setCurrentPage(1);
    setOutstandingPage(1);
  };

  const handlePeriodChange = (event) => {
    const nextPeriod = Number(event.target.value) || 0;
    setPeriodDays(nextPeriod);
    setCurrentPage(1);

    dispatch(
      fetchCompanyReceivables({
        companyName: selectedCompany,
        periodDays: nextPeriod,
      })
    );
  };

  // const activePeriodLabel =
  //   PERIOD_OPTIONS.find((option) => option.value === periodDays)?.label || "All Time";

  // The SP unions quotations and invoices, so a company can appear twice — once
  // per side. The API sends no Type column here, so it comes off the prefix.
  const allOutstandingRows = useMemo(() => {
    return (outstandingAmounts || []).map((item) => {
      const references =
        item.referenceNumbers ||
        item.ReferenceNumbers ||
        "";

      const rowType =
        item.type ||
        item.Type ||
        classifyType(references);

      return {
        company:
          item.companyName ||
          item.company ||
          "Company",

        receivableCompany:
          item.receivableCompany ||
          item.ReceivingCompany ||
          "ReceivableCompany",

        amount: Number(
          item.amountOutstanding ??
          item.outstandingAmount ??
          item.outstanding ??
          0
        ),

        invoices: Number(
          item.numberOfInvoices ??
          item.NumberOfInvoices ??
          item.invoices ??
          0
        ),

        overdue: Number(
          item.overdueAmount ??
          item.OverdueAmount ??
          item.overdue ??
          0
        ),

        // IMPORTANT
        paid: Number(
          item.paidAmount ??
          item.PaidAmount ??
          item.paid ??
          0
        ),

        type: rowType,
        references,
      };
    });
  }, [outstandingAmounts]);

  // The Quotation / Invoice views are a straight subset of the All view, so the
  // three counts always reconcile (All = Quotations + Invoices).
  const outstandingRows = useMemo(() => {
    if (reportType === "All") return allOutstandingRows;

    return allOutstandingRows.filter((row) => row.type === reportType);
  }, [allOutstandingRows, reportType]);

  const paginatedOutstandingAmounts = useMemo(() => {
    const startIndex = (outstandingPage - 1) * outstandingItemsPerPage;

    return outstandingRows.slice(startIndex, startIndex + outstandingItemsPerPage);
  }, [outstandingRows, outstandingPage]);

  // One bar per company — on "All" the quotation and invoice rows are merged so
  // the axis keeps a single tick per company.
  const chartData = useMemo(() => {
    const buckets = new Map();

    outstandingRows.forEach((row) => {
      let bucket = buckets.get(row.company);

      if (!bucket) {
        bucket = {
          name: row.company,
          amount: 0,
          overdue: 0,
          paid: 0,
        };

        buckets.set(row.company, bucket);
      }

      bucket.amount += row.amount;
      bucket.overdue += row.overdue;
      bucket.paid += row.paid;
    });

    return [...buckets.values()];
  }, [outstandingRows]);
  // Normalise the SP rows once — the API casing varies, so read both shapes and
  // prefer the numeric Year/MonthNo columns over parsing the display label.
  const allReceivableRows = useMemo(() => {
    return (companyReceivables || []).map((item) => {
      const label =
        item.month ||
        item.Month ||
        item.monthName ||
        item.MonthName ||
        "";

      const parsed = parsePeriod(label);
      const rawMonthNo = item.monthNo ?? item.MonthNo;

      const monthIndex =
        rawMonthNo != null && rawMonthNo !== ""
          ? Number(rawMonthNo) - 1
          : parsed?.month ?? null;

      const owedTo =
        item.companyOwedTo ||
        item.CompanyOwedTo ||
        "";

      const owedBy =
        item.owedByCompany ||
        item.OwedByCompany ||
        item.companyName ||
        item.CompanyName ||
        "";

      return {
        label,

        year: Number(
          item.year ??
          item.Year ??
          parsed?.year ??
          0
        ),

        monthIndex,

        monthNo:
          monthIndex == null
            ? null
            : monthIndex + 1,

        owedTo: owedTo || "Unknown",
        owedBy: owedBy || "Unknown",

        owedToName: owedTo,
        owedByName: owedBy,

        amount: Number(
          item.totalReceivableAmount ??
          item.TotalReceivableAmount ??
          0
        ),

        invoices: Number(
          item.numberOfInvoices ??
          item.NumberOfInvoices ??
          0
        ),

        // Overdue Amount
        overdue: Number(
          item.overdueAmount ??
          item.OverdueAmount ??
          0
        ),

        // Paid Amount
        paid: Number(
          item.paidAmount ??
          item.PaidAmount ??
          0
        ),

        type:
          item.type ||
          item.Type ||
          "",
      };
    });
  }, [companyReceivables]);

  // Same client-side split as the outstanding table
  const receivableRows = useMemo(() => {
    if (reportType === "All") return allReceivableRows;

    return allReceivableRows.filter((row) => row.type === reportType);
  }, [allReceivableRows, reportType]);

  // With a company selected every row shares the same CompanyOwedTo, so the
  // useful breakdown flips to who owes it.
  const seriesBy = selectedCompany ? "owedBy" : "owedTo";

  // Series ordered by size so the stack reads big-to-small and the legend matches
  const trendCompanies = useMemo(() => {
    const totals = new Map();

    receivableRows.forEach((row) => {
      const key = row[seriesBy];
      if (!key) return;
      totals.set(key, (totals.get(key) || 0) + row.amount);
    });

    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
  }, [receivableRows, seriesBy]);

  // Bucket into the selected interval (month / quarter / year), chronologically sorted
  const visibleTrendData = useMemo(() => {
    const buckets = new Map();

    receivableRows.forEach((row) => {
      let key;
      let order;

      if (row.monthIndex == null) {
        key = row.label || "Unknown";
        order = Number.MAX_SAFE_INTEGER;
      } else if (trendInterval === "quarter") {
        const quarter = Math.floor(row.monthIndex / 3) + 1;
        key = `Q${quarter} ${row.year}`;
        order = row.year * 100 + quarter * 3;
      } else if (trendInterval === "year") {
        key = `${row.year}`;
        order = row.year * 100;
      } else {
        key = row.label || `${row.year}-${row.monthIndex + 1}`;
        order = row.year * 100 + row.monthIndex;
      }

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { month: key, __order: order, __total: 0, __invoices: 0 };
        buckets.set(key, bucket);
      }

      const series = row[seriesBy];

      bucket[series] = (bucket[series] || 0) + row.amount;

      bucket.__total += row.amount;
      bucket.__overdue += row.overdue;
      bucket.__paid += row.paid;
      bucket.__invoices += row.invoices;
    });

    return [...buckets.values()].sort((a, b) => a.__order - b.__order);
  }, [receivableRows, seriesBy, trendInterval]);

  const periodTotals = useMemo(() => {
    const total = receivableRows.reduce((sum, row) => sum + row.amount, 0);
    const invoices = receivableRows.reduce((sum, row) => sum + row.invoices, 0);
    const periods = visibleTrendData.length;

    return {
      total,
      invoices,
      periods,
      average: periods ? total / periods : 0,
    };
  }, [receivableRows, visibleTrendData]);

  // Rolled up from the outstanding-amounts rows so the cards always agree with
  // the table below and follow the Type / Company filters.

  const summaryValues = useMemo(() => {
    return outstandingRows.reduce(
      (totals, row) => ({
        totalOwedToCompany:
          totals.totalOwedToCompany + row.amount,

        documentCount:
          totals.documentCount + row.invoices,

        totalOverdueAmount:
          totals.totalOverdueAmount + row.overdue,

        totalPaidAmount:
          totals.totalPaidAmount + row.paid,
      }),
      {
        totalOwedToCompany: 0,
        documentCount: 0,
        totalOverdueAmount: 0,
        totalPaidAmount: 0,
      }
    );
  }, [outstandingRows]);

  const documentCountLabel =
    reportType === "Quotation"
      ? "Total Quotations"
      : reportType === "Invoice"
        ? "Total Invoices"
        : "Total Quotations & Invoices";


  const paginatedReceivables = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return receivableRows.slice(startIndex, startIndex + itemsPerPage);
  }, [receivableRows, currentPage, itemsPerPage]);

  // Both report tables drill into the same modal — SP_GetOutstandingInvoiceDetails
  // is keyed by @CompanyName / @ReceivingEntity / @Type.
  const openDrilldown = ({ heading, companyName, receivingEntity, type, period }) => {
    setModalType(type || reportType);
    setModalStatus(heading);
    setSelectedInvoiceData({
      companyName,
      receivingEntity,
      type: type || reportType,
      period: period || null,
    });
    setShowModal(true);
  };

  if (!isSuperAdmin) {
    return (
      <div className="reportdashboard-wrapper">
        <div className="container-fluid reportdashboard-shell">
          <div className="reportdashboard-section reportdashboard-access-block">
            <h2>Access restricted</h2>
            <p>Only Super Admin users can view the reports dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reportdashboard-wrapper">
      <div className="container-fluid reportdashboard-shell">
        <div className="reportdashboard-header-card">
          <div className="reportdashboard-header-copy">
            <span className="reportdashboard-badge">Receivables Overview</span>
            <h2>Outstanding Receivables Report</h2>
            <p>Select a company to view outstanding amounts, receivables, and overdue invoices.</p>
          </div>

          <div className="reportdashboard-filter-section">
            <div className="report-filter-field">
              <span className="report-filter-label">Type</span>
              <div className="report-type-toggle">
                {REPORT_TYPES.map((option) => (
                  <HoloButton
                    key={option}
                    variant={reportType === option ? "primary" : "secondary"}
                    size="md"
                    onClick={() => handleTypeChange(option)}
                  >
                    {option}
                  </HoloButton>
                ))}
              </div>
            </div>

            <div className="report-filter-field">
              <span className="report-filter-label" htmlFor="report-company-filter">
                Companies Owed To
              </span>
              <select
                id="report-company-filter"
                className="report-period-select"
                value={selectedCompany}
                onChange={handleCompanyChange}
              >
                <option value="">All Companies</option>
                {(companyList || []).map((item, index) => {
                  const companyName = item.companyName || item.CompanyName || item.name || item.company || item.Company || "";
                  return (
                    <option key={`${companyName || "company"}-${index}`} value={companyName}>
                      {companyName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* <div className="report-filter-field">
              <label className="report-filter-label" htmlFor="report-period-filter">
                Period
              </label>
              <select
                id="report-period-filter"
                className="report-period-select is-compact"
                value={periodDays}
                onChange={handlePeriodChange}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>

        {loadingAmounts ? (
          <div className="reportdashboard-section reportdashboard-loading">
            <p>Loading summary...</p>
          </div>
        ) : (
          <div className="report-stat-cards">
            <div className="report-stat-card sc-quotation">
              <span className="sc-icon">R</span>
              <span className="sc-label">Total Owed To Company</span>
              <span className="sc-value">{formatCurrency(summaryValues.totalOwedToCompany)}</span>
            </div>

            <div className="report-stat-card sc-accepted">
              <span className="sc-icon">#</span>
              <span className="sc-label">{documentCountLabel}</span>
              <span className="sc-value">{formatNumber(summaryValues.documentCount)}</span>
            </div>

            {showOverdue && (
              <div className="report-stat-card sc-paid">
                <span className="sc-icon">R</span>
                <span className="sc-label">Total Overdue Amount</span>
                <span className="sc-value">{formatCurrency(summaryValues.totalOverdueAmount)}</span>
              </div>
            )}

            {/* {showpaid && (
              <div className="report-stat-card sc-paid">
                <span className="sc-icon">R</span>
                <span className="sc-label">Total Paid Amount</span>
                <span className="sc-value">{formatCurrency(summaryValues.totalPaidAmount)}</span>
              </div>
            )} */}
            {showpaid && (
              <div className="report-stat-card sc-paid">
                <span className="sc-icon">R</span>
                <span className="sc-label">Total Paid Amount</span>
                <span className="sc-value">
                  {formatCurrency(summaryValues.totalPaidAmount)}
                </span>
              </div>
            )}

          </div>
        )}

        <div className="reportdashboard-section">
          <div className="reportdashboard-section-header">
            <div>
              <h3 className="report-section-heading">Amounts Outstanding</h3>
              <p className="report-section-subtitle">Company-wise outstanding balance and overdue totals</p>
            </div>
          </div>

          <div className="reportdashboard-table-card">
            {loadingAmounts ? (
              <div className="reportdashboard-loading">
                Loading outstanding amounts...
              </div>
            ) : (
              <>
                <table className="reports-outstanding-table">
                  <thead>
                    <tr>
                      <th>Company Owed To</th>
                      <th>Owed By</th>
                      {showTypeColumn && <th>Type</th>}
                      <th>Amount Outstanding</th>
                      <th>{reportType === "Quotation" ? "Quotations" : "Invoices"}</th>
                      {showOverdue && <th>Overdue</th>}
                      {showpaid && <th>Paid</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedOutstandingAmounts.length > 0 ? (
                      paginatedOutstandingAmounts.map((item, index) => (
                        <tr key={index}>
                          <td>{item.company}</td>
                          <td>{item.receivableCompany}</td>
                          {showTypeColumn && <td>{item.type || "-"}</td>}
                          <td>{formatCurrency(item.amount)}</td>
                          <td>
                            <span
                              className="invoice-link reports-drilldown-link"
                              onClick={() =>
                                openDrilldown({
                                  heading:
                                    item.type === "Quotation"
                                      ? "Outstanding Quotations"
                                      : "Outstanding Invoices",
                                  companyName: item.company,
                                  receivingEntity: item.receivableCompany,
                                  // On "All" the row itself says which side it came from
                                  type: item.type,
                                })
                              }
                            >
                              {formatNumber(item.invoices)}
                            </span>
                          </td>
                          {showOverdue && <td>{formatCurrency(item.overdue)}</td>}
                          {showpaid && <td>{formatCurrency(item.paid)}</td>}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3 + (showTypeColumn ? 1 : 0) + (showOverdue ? 1 : 0)}
                          className="reportdashboard-empty-state"
                        >
                          No outstanding amounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {outstandingRows.length > outstandingItemsPerPage && (
                  <Pagination
                    currentPage={outstandingPage}
                    totalItems={outstandingRows.length}
                    itemsPerPage={outstandingItemsPerPage}
                    onPageChange={setOutstandingPage}
                  />
                )}
              </>
            )}
          </div>


        </div>

        <div className="reportdashboard-section">
          <div className="reportdashboard-section-header">
            <div>
              <h3 className="report-section-heading">
                Outstanding Analysis
              </h3>
              <p className="report-section-subtitle">
                Outstanding amounts and receivables trend over the selected period
              </p>
            </div>
            {/* <span className="report-period-chip">{activePeriodLabel}</span> */}
          </div>

          <div className="report-analysis-grid">
            {/* BAR CHART — Outstanding vs Overdue per company */}
            <div className="reportdashboard-chart-card">
              <div className="report-chart-head">
                <div>
                  <h5 className="report-chart-title">Outstanding Amounts</h5>
                  <p className="report-chart-hint">Outstanding vs. overdue balance by company</p>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="chart-no-data">No outstanding amounts to display.</div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 16, left: 22, bottom: 56 }}
                    barGap={2}
                    barCategoryGap="12%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-22}
                      textAnchor="end"
                      height={64}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Company",
                        position: "insideBottom",
                        offset: -6,
                        fill: "#475569",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />

                    <YAxis
                      width={64}
                      tickFormatter={compactZar}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      label={{
                        value: "Amount",
                        angle: -90,
                        position: "insideLeft",
                        offset: -8,
                        style: {
                          textAnchor: "middle",
                          fill: "#475569",
                          fontSize: 12,
                          fontWeight: 700,
                        },
                      }}
                    />

                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    />

                    <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />

                    <Bar
                      dataKey="amount"
                      name="Outstanding"
                      fill={STATUS_COLORS.outstanding}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      minPointSize={5}
                    />

                    <Bar
                      dataKey="overdue"
                      name="Overdue"
                      fill={STATUS_COLORS.overdue}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      minPointSize={5}
                    />

                    <Bar
                      dataKey="paid"
                      name="Paid"
                      fill={STATUS_COLORS.paid}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      minPointSize={5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* COMPOSED CHART — stacked receivables per period + total trend line */}
            <div className="reportdashboard-chart-card">
              <div className="report-chart-head">
                <div>
                  <h5 className="report-chart-title">Receivables by Period</h5>
                  {/* <p className="report-chart-hint">
                    {activePeriodLabel} · stacked by {selectedCompany ? "owing company" : "receiving entity"}
                  </p> */}
                </div>
                <select
                  className="report-trend-select"
                  value={trendInterval}
                  onChange={(e) => setTrendInterval(e.target.value)}
                  aria-label="Select trend interval"
                >
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              {loadingCompanyReceivables ? (
                <div className="chart-no-data">Loading receivables...</div>
              ) : visibleTrendData.length === 0 ? (
                <div className="chart-no-data">No receivables in the selected period.</div>
              ) : (
                <>
                  <div className="report-chart-meta">
                    <span>
                      <strong>{formatCurrency(periodTotals.total)}</strong> total
                    </span>
                    <span>
                      <strong>{formatNumber(periodTotals.invoices)}</strong> invoices
                    </span>
                    <span>
                      <strong>{formatCurrency(periodTotals.average)}</strong> avg / period
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                      data={visibleTrendData}
                      margin={{ top: 10, right: 20, left: 22, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="month"
                        interval={0}
                        angle={-22}
                        textAnchor="end"
                        height={56}
                        tickMargin={8}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        label={{
                          value: "Period",
                          position: "insideBottom",
                          offset: -4,
                          fill: "#475569",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />

                      <YAxis
                        width={64}
                        tickFormatter={compactZar}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        label={{
                          value: "Amount",
                          angle: -90,
                          position: "insideLeft",
                          offset: -8,
                          style: { textAnchor: "middle", fill: "#475569", fontSize: 12, fontWeight: 700 },
                        }}
                      />

                      <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} verticalAlign="bottom" height={28} />

                      {trendCompanies.map((company, index) => (
                        <Line
                          key={company}
                          type="monotone"
                          dataKey={company}
                          name={company}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: COLORS[index % COLORS.length],
                            stroke: "#fff",
                            strokeWidth: 1.5,
                          }}
                          activeDot={{
                            r: 6,
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                        />
                      ))}

                      {/* Overdue */}
                      <Line
                        type="monotone"
                        dataKey="__overdue"
                        name="Overdue"
                        stroke={STATUS_COLORS.overdue}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{
                          r: 3,
                          fill: STATUS_COLORS.overdue,
                          stroke: "#fff",
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                      />

                      {/* Paid */}
                      <Line
                        type="monotone"
                        dataKey="__paid"
                        name="Paid"
                        stroke={STATUS_COLORS.paid}
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{
                          r: 3,
                          fill: STATUS_COLORS.paid,
                          stroke: "#fff",
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                      />

                      {/* Total Outstanding */}
                      <Line
                        type="monotone"
                        dataKey="__total"
                        name="Total Outstanding"
                        stroke="#0f172a"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={{
                          r: 3,
                          fill: "#0f172a",
                          stroke: "#fff",
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          stroke: "#0f172a",
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="reportdashboard-section">
          <div className="reportdashboard-section-header">
            <div>
              <h3 className="report-section-heading">Company Receivables</h3>
              <p className="report-section-subtitle">Receivables grouped by period and customer</p>
            </div>
            {/* <span className="report-period-chip">{activePeriodLabel}</span> */}
          </div>

          <div className="reportdashboard-table-card">
            {loadingCompanyReceivables ? (
              <div className="reportdashboard-loading">Loading receivables...</div>
            ) : (
              <>
                <table className="reports-outstanding-table">

                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Company Owed To</th>
                      <th>Owed By</th>
                      {showTypeColumn && <th>Type</th>}
                      <th>{reportType === "Quotation" ? "No. Of Quotations" : "No. Of Invoices"}</th>
                      <th>Total Receivable</th>
                      {showOverdue && <th>Overdue Amount</th>}
                      {showpaid && <th>Paid Amount</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedReceivables.length > 0 ? (
                      paginatedReceivables.map((item, index) => (
                        <tr key={index}>
                          <td>{item.label || "-"}</td>
                          <td>{item.owedTo}</td>
                          <td>{item.owedBy}</td>
                          {showTypeColumn && <td>{item.type || "-"}</td>}
                          <td>
                            <span
                              className="invoice-link reports-drilldown-link"
                              onClick={() =>
                                openDrilldown({
                                  heading:
                                    item.type === "Quotation"
                                      ? "Receivable Quotations"
                                      : "Receivable Invoices",
                                  // Owed to = the issuing company, owed by = the
                                  // receiving entity on the quotation / invoice
                                  companyName: item.owedToName,
                                  receivingEntity: item.owedByName,
                                  type: item.type,
                                  period: item.monthNo
                                    ? {
                                      label: item.label,
                                      year: item.year,
                                      monthNo: item.monthNo,
                                    }
                                    : null,
                                })
                              }
                            >
                              {formatNumber(item.invoices)}
                            </span>
                          </td>
                          <td>{formatCurrency(item.amount)}</td>
                          {showOverdue && <td>{formatCurrency(item.overdue)}</td>}
                          {showpaid && <td>{formatCurrency(item.paid)}</td>}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5 + (showTypeColumn ? 1 : 0) + (showOverdue ? 1 : 0)}
                          className="reportdashboard-empty-state"
                        >
                          No receivables found for the selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {receivableRows.length > itemsPerPage && (
                  <Pagination
                    currentPage={currentPage}
                    totalItems={receivableRows.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <OutstandingInvoiceModal
          show={showModal}
          status={modalStatus || "Outstanding Invoices"}
          onClose={() => setShowModal(false)}
          companyList={companyList}
          companyName={selectedInvoiceData.companyName}
          receivingEntity={selectedInvoiceData.receivingEntity}
          type={selectedInvoiceData.type || reportType}
          period={selectedInvoiceData.period}
        />
      </div>
    </div>
  );
};

export default ReportsDashboard;