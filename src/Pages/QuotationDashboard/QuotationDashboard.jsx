import React, { useEffect, useState, useMemo } from "react";
import "./QuotationDashboard.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchcount, fetchLatestStatusRecords, } from "../../redux/DashboardSlice";
import { SummaryCards, KpiModal, ViewPopup } from "../../components/Dashboard";
import HelpModal from "../../components/Common/HelpModal";
import { fetchCompanieswithfilter } from "../../redux/CustomerSlice";
import HoloButton from "../../components/Common/HoloButton";
import { fetchQuotationdetailswithRefno, fetchInvoicedetailswithRefno } from "../../redux/QuotationTemplateSlice";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";
import {
  getStages,
  getStageResolver,
  readCount,
  stagesWithCounts,
} from "../../utility/statusPipelines";
import { normalizeViewPopupPayload } from "../../components/Dashboard/viewPopupPayload";

// const CustomPieTooltip = ({ active, payload }) => {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="db-tooltip">
//       <p className="db-tooltip-label">{payload[0].name}</p>
//       <p className="db-tooltip-value">{payload[0].value} records</p>
//     </div>
//   );
// };

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const status = payload[0].payload;

  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{status.name}</p>
      <p className="db-tooltip-value">{status.percentage}% <span>({status.value} records)</span></p>
    </div>
  );
};

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const getTimestamp = (record) => {
  const raw =
    record?.updatedAt ??
    record?.modifiedAt ??
    record?.createdAt ??
    record?.createdDate ??
    record?.invoiceDate ??
    record?.quotationDate ??
    record?.date ??
    record?.timestamp;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getRecordLabel = (record) =>
  record?.quotationReferenceNumber ||
  record?.invoiceReferenceNumber ||
  record?.referenceNumber ||
  record?.proformaReferenceNumber ||
  record?.id ||
  record?.name ||
  "Latest record";

const getRecordMeta = (record) => {
  if (!record) return "";
  const customer =
    record.customerName ||
    record.companyName ||
    record.clientName ||
    record.customer ||
    record.buyer;
  const date = getTimestamp(record);
  const dateLabel = date
    ? new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null;
  return [customer, dateLabel].filter(Boolean).join(" • ");
};

const QuotationDashboard = () => {
  const [type, setType] = useState("Quotation");
  const [showHelp, setShowHelp] = useState(false);

  const [showModal, setShowModal] = useState(false);       // KPI Modal
  const [showViewModal, setShowViewModal] = useState(false); // Latest Record ViewPopup
  const [modalStatus, setModalStatus] = useState(null);
  const [selectedLatestRecord, setSelectedLatestRecord] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [proformaLoading, setProformaLoading] = useState(false); // Proforma click loading
  const [latestRecordLoadingId, setLatestRecordLoadingId] = useState(null); // Track which latest record is loading


  const dispatch = useDispatch();
  const { counts, quotationOrInvoiceData, loading, latestStatusRecords, latestStatusLoading } = useSelector((state) => state.dashboardsData);

  const companyList = useSelector((state) => state.Customers.companies);

  const [selectedCompany, setSelectedCompany] = useState("");

  const { quotationDetails } = useSelector(
    (state) => state.quotationApprovalTemplate
  );

  useEffect(() => {
    dispatch(fetchCompanieswithfilter());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchcount(selectedCompany || null));
    dispatch(fetchLatestStatusRecords(selectedCompany || null));
  }, [dispatch, selectedCompany]);


  useEffect(() => {
    console.log("latestStatusRecords:", latestStatusRecords);
  }, [latestStatusRecords]);

  useEffect(() => {
    setShowModal(false);
    setModalStatus(null);
  }, [type]);

  const handleCardClick = (clickedStatus, clickedType = type) => {
    setModalStatus(clickedStatus);
    setModalType(clickedType);
    setShowModal(true);
  };

  const quotationCounts = useMemo(() => counts?.quotations || {}, [counts]);
  console.log("quotationCounts:", quotationCounts);
  const invoiceCounts = useMemo(() => counts?.invoices || {}, [counts]);
  console.log("invoiceCounts:", invoiceCounts);
  // Deleted quotations aren't a pipeline stage, but the count endpoint
  // reports them alongside the pipeline buckets - read it off there instead
  // of fetching the deleted list separately just to get its length.
  const deletedCount = useMemo(
    () => readCount(quotationCounts, ["deleted", "deletedCount", "Deleted"]),
    [quotationCounts]
  );

  const activeCounts = type === "Quotation" ? quotationCounts : invoiceCounts;
  const currentStages = useMemo(
    () =>
      getStages(type).filter(
        (stage) => stage.key !== "proforma" && stage.key !== "deleted"
      ),
    [type]
  );

  const pipelineSteps = useMemo(
    () => stagesWithCounts(currentStages, activeCounts),
    [currentStages, activeCounts]
  );

  // Deleted quotations sit outside the created→closed pipeline (hard-removed,
  // not a lifecycle stage) so they aren't in QUOTATION_STAGES, but the
  // pipeline track is exactly where "click a stage to drill into records"
  // lives - append it here rather than folding it into the count-endpoint
  // driven pipelineSteps. There's no Invoice equivalent.
  const pipelineDisplaySteps = useMemo(() => {
    if (type !== "Quotation") return pipelineSteps;

    return [
      ...pipelineSteps,
      {
        key: "deleted",
        label: "Deleted",
        short: "Deleted",
        color: "#dc2626",
        hint: "Quotation deleted",
        drillStatus: "Deleted",
        value: deletedCount,
      },
    ];
  }, [pipelineSteps, type, deletedCount]);

  const records = useMemo(
    () =>
      Array.isArray(quotationOrInvoiceData)
        ? quotationOrInvoiceData.map((item) => item?.header || item)
        : [],
    [quotationOrInvoiceData]
  );

  const stageResolver = useMemo(() => getStageResolver(type), [type]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Created":
        return "#2196f3";

      case "Updated":
        return "#ff9800";

      case "Approved":
        return "#4caf50";

      case "Closed":
        return "#f44336";

      case "Expired":
        return "#9c27b0";

      case "Overdue":
        return "#e91e63";

      case "Paid":
        return "#009688";

      case "Proforma Invoice Generated":
        return "#673ab7";

      case "Order Completed":
        return "#3f51b5";

      case "Refunded":
        return "#795548";

      case "Credit note Created":
        return "#607d8b";

      default:
        return "#666";
    }
  };

  const [selectedData, setSelectedData] = useState(null);

  const handleLatestRecordClick = async (record) => {
    // A latest record opens only the detailed ViewPopup. Do not leave the
    // KPI modal mounted underneath it, otherwise it becomes visible again
    // after ViewPopup is closed.
    setShowModal(false);
    setModalStatus(null);
    setModalType(null);
    setSelectedLatestRecord(null);

    try {
      const isProforma = record?.module === "Proforma";
      const recordId = record?.id || record?.referenceNumber;

      if (isProforma) {
        setProformaLoading(true);
      } else {
        setLatestRecordLoadingId(recordId);
      }

      let response;
      const moduleName = record?.module || type;

      if (moduleName === "Quotation" || moduleName === "Proforma") {
        response = await dispatch(
          fetchQuotationdetailswithRefno(
            // record?.referenceNumber || record?.quotationReferenceNumber
            { refNo: record?.referenceNumber || record?.quotationReferenceNumber, guId: null, type: "Proforma" }
          )
        ).unwrap();
      } else if (moduleName === "Invoice") {
        response = await dispatch(
          fetchInvoicedetailswithRefno(
            record?.id ||
            record?.invoiceId ||
            record?.referenceNumber ||
            record?.invoiceReferenceNumber
          )
        ).unwrap();
      }

      const normalized = normalizeViewPopupPayload(moduleName, response);

      setSelectedData({
        ...normalized,
        module:
          moduleName === "Invoice"
            ? "Invoice"
            : "Quotation", // Quotation & Proforma both open as Quotation
      });

      setShowViewModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProformaLoading(false);
      setLatestRecordLoadingId(null);
    }
  };

  const latestRecordsByStatus = useMemo(() => {
    if (!latestStatusRecords?.length) return [];

    const moduleName = type; // "Quotation" or "Invoice"

    return latestStatusRecords
      .filter(item => item.module === moduleName)
      .map(item => ({
        stage: {
          key: item.status,
          label: item.status,
          color: getStatusColor(item.status),
        },
        latestRecord: item,
      }));
  }, [latestStatusRecords, type]);


  const getRecordLabel = (record) => {
    return (
      record.referenceNumber ||
      record.invoiceReferenceNumber ||
      //record.quotationReferenceNumber ||
      record?.proformaReferenceNumber ||
      "-"
    );
  };
  // The proforma card must read as the proforma document (PI-…), not the
  // quotation it was raised from. The backend misspells the field as
  // `porforma...`; returns "" when the record carries no proforma number.
  const getProformaNumber = (record) =>
    record?.porformaReferenceNumber ||
    record?.PorformaReferenceNumber ||
    record?.proformaReferenceNumber ||
    record?.ProformaReferenceNumber ||
    record?.proformaReferenceNo ||
    record?.proformaRefNo ||
    "";

  const getRecordMeta = (record) => {
    return (
      <>
        <span>{record.companyName}</span>

        {" • "}


        <span>
          {record.modifiedDate
            ? new Date(record.modifiedDate).toLocaleDateString()
            : record.createdDate
              ? new Date(record.createdDate).toLocaleDateString()
              : ""}
        </span>
      </>
    );
  };

  const proformaCount = useMemo(() => {
    if (type !== "Invoice") return 0;
    return readCount(invoiceCounts, ["proforma", "proformaGenerated", "profroma"]);
  }, [invoiceCounts, type]);

  const proformaLatestRecord = useMemo(() => {
    if (type !== "Invoice") return null;

    return latestStatusRecords.find(
      (item) => item.module === "Proforma"
    ) || null;
  }, [latestStatusRecords, type]);

  // GetLatestStatusRecords returns only the quotation reference for a Proforma
  // record, so the proforma number is read off the quotation the card already
  // opens on click — the same call, made once up front, purely for the label.
  const [proformaRefNo, setProformaRefNo] = useState("");

  useEffect(() => {
    const quotationRef =
      proformaLatestRecord?.referenceNumber ||
      proformaLatestRecord?.quotationReferenceNumber;

    if (!quotationRef) {
      setProformaRefNo("");
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await dispatch(
          fetchQuotationdetailswithRefno({ refNo: quotationRef, guId: null, type: "Proforma" })
        ).unwrap();

        const { selectedInvoice } = normalizeViewPopupPayload("Proforma", response);

        if (!cancelled) setProformaRefNo(getProformaNumber(selectedInvoice));
      } catch (err) {
        console.error("Proforma reference lookup failed", err);
        if (!cancelled) setProformaRefNo("");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, proformaLatestRecord]);

  // The API total is authoritative. Lifecycle buckets can contain derived
  // or overlapping counts, so summing them produces a different headline.
  const total = readCount(activeCounts, ["total"]);

  // The headline rate: approved quotations, completed invoice orders.
  const headlineStage = useMemo(
    () =>
      pipelineSteps.find(
        (stage) =>
          stage.key ===
          (type === "Quotation" ? "paid" : "completed")
      ),
    [pipelineSteps, type]
  );

  const headlineValue = headlineStage?.value || 0;
  const approvalPct = total > 0 ? Math.round((headlineValue / total) * 100) : 0;

  const statusTotal = useMemo(
    () => pipelineDisplaySteps.reduce((sum, stage) => sum + stage.value, 0),
    [pipelineDisplaySteps]
  );

  const statusPieData = useMemo(
    () =>
      pipelineDisplaySteps.map((stage) => ({
        name: stage.label,
        value: stage.value,
        color: stage.color,
        percentage: statusTotal > 0 ? Math.round((stage.value / statusTotal) * 100) : 0,
      })),
    [pipelineDisplaySteps, statusTotal]
  );

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="qdb-root">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="qdb-page-header">
        <div className="qdb-page-header-left">
          <p className="qdb-greeting">{greeting} 👋</p>
          <h1 className="qdb-title">Dashboard</h1>
          <p className="qdb-subtitle">Here's what's happening with your {type.toLowerCase()}s today.</p>
        </div>
        <div className="qdb-page-header-right">

          <HoloButton
            variant={type === "Quotation" ? "primary" : "secondary"}
            size="md"
            onClick={() => setType("Quotation")}
          >
            Quotation
          </HoloButton>

          <HoloButton
            variant={type === "Invoice" ? "primary" : "secondary"}
            size="md"
            onClick={() => setType("Invoice")}
          >
            Invoice
          </HoloButton>

          {/* Companies Dropdown */}
          <div className="qdb-company-filter">
            <span className="qdb-company-label">
              COMPANIES
            </span>

            <select
              className="qdb-company-select"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >

              <option value="">All Companies</option>

              {(companyList || []).map((item, index) => {
                // console.log("Company item:", item);
                // const companyName =
                //   item.companyName ||
                //   item.CompanyName ||
                //   item.name ||
                //   item.company ||
                //   item.Company ||
                //   "";

                return (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.companyName}
                  </option>
                );
              })}
            </select>
          </div>

          <HoloButton
            variant="secondary"
            size="md"
            onClick={() => setShowHelp(true)}
          >
            <i className="fas fa-question-circle"></i> Help
          </HoloButton>

        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <SummaryCards
        type={type}
        counts={counts}
        onCardClick={handleCardClick}
        isLoading={loading}

      />

      {/* ── Insight Row — rate + latest-status view ───────────── */}
      <div className="qdb-charts-row">
        {/* Donut — the single headline rate (the one non-count insight) */}
        <div className="qdb-chart-card qdb-chart-donut">
          <div className="qdb-card-header">
            <div>
              <h3 className="qdb-card-title">Status Distribution</h3>
              <p className="qdb-card-sub">All {type.toLowerCase()} statuses by percentage</p>
            </div>
          </div>
          <div className="qdb-donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={0.5}
                  minAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {statusPieData.map((status) => (
                    <Cell key={status.name} fill={status.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomPieTooltip />}
                  wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="qdb-donut-center">
              <span className="qdb-donut-pct">{statusTotal}</span>
              <span className="qdb-donut-label">TOTAL</span>
            </div>
          </div>
          <div className="qdb-donut-legend">
            {statusPieData.map((status) => (
              <div key={status.name} className="qdb-donut-legend-item">
                <span className="qdb-donut-legend-dot" style={{ background: status.color }} />
                <span className="qdb-donut-legend-name">{status.name}</span>
                <span className="qdb-donut-legend-val">{status.percentage}% <small>({status.value})</small></span>
              </div>
            ))}
          </div>
        </div>

        <div className="qdb-chart-card qdb-chart-latest">
          <div className="qdb-card-header">
            <div>
              <h3 className="qdb-card-title">Latest Record by Status</h3>
              <p className="qdb-card-sub">Most recent item for each active status</p>
            </div>
          </div>
          <div className="qdb-latest-list">
            {latestStatusLoading ? (
              <div className="qdb-latest-loading-container">
                <div className="qdb-latest-spinner"></div>
                <span className="qdb-latest-loading-text">Loading records...</span>
              </div>
            ) : latestRecordsByStatus.length > 0 ? (
              latestRecordsByStatus.map(({ stage, latestRecord }) => {
                const isLoading = latestRecordLoadingId === (latestRecord?.id || latestRecord?.referenceNumber);
                return (
                  <div key={stage.key}
                    className={`qdb-latest-row${isLoading ? " qdb-latest-row-loading" : ""}`}
                    onClick={() => !isLoading && handleLatestRecordClick(latestRecord)}
                    style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}>
                    <div className="qdb-latest-meta">
                      <span
                        className="qdb-latest-status"
                        style={{ color: stage.color }}
                      >
                        {stage.label}
                      </span>

                      {isLoading ? (
                        <div className="qdb-latest-row-spinner">
                          <div className="qdb-spinner-small"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <span className="qdb-latest-title">
                          {getRecordLabel(latestRecord)}
                        </span>
                      )}
                    </div>

                    {!isLoading && (
                      <div className="qdb-latest-detail">
                        {getRecordMeta(latestRecord)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div>No records found</div>
            )}
          </div>
        </div>
      </div>

      {type === "Invoice" && (
        <div className="qdb-proforma-card">
          <div className="qdb-card-header">
            <div>
              <h3 className="qdb-card-title">Proforma Generated</h3>
              <p className="qdb-card-sub">Separated proforma summary above the Status</p>
            </div>
          </div>

          <div className="qdb-proforma-grid">
            <div
              className="qdb-proforma-count-card"
              onClick={() =>
                handleCardClick("Proforma Invoice Generated", "Quotation")
              }
            >
              <span className="qdb-proforma-count-label">Total Count</span>
              {latestStatusLoading ? (
                <div className="qdb-proforma-count-loading">
                  <div className="qdb-count-spinner-small"></div>
                </div>
              ) : (
                <span className="qdb-proforma-count-value">
                  {proformaCount ?? "--"}
                </span>
              )}
            </div>

            <div
              className={`qdb-proforma-record-card${proformaLatestRecord ? " qdb-proforma-card-clickable" : ""}${proformaLoading ? " qdb-proforma-loading" : ""}`}
              onClick={(event) => {
                event.stopPropagation();

                if (!proformaLatestRecord || proformaLoading) return;

                handleLatestRecordClick({
                  ...proformaLatestRecord,
                  module: "Proforma",
                });
              }}
              role={proformaLatestRecord ? "button" : undefined}
              tabIndex={proformaLatestRecord ? 0 : undefined}
              onKeyDown={(event) => {
                if (!proformaLatestRecord || proformaLoading) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleLatestRecordClick({ ...proformaLatestRecord, module: "Proforma" });
                }
              }}
            >
              <div className="qdb-proforma-record-head">
                <span className="qdb-proforma-record-title">Latest Record</span>
                <span className="qdb-proforma-record-badge">Latest</span>
              </div>
              {proformaLoading ? (
                <div className="qdb-proforma-spinner-container">
                  <div className="qdb-proforma-spinner"></div>
                  <span className="qdb-proforma-loading-text">Loading...</span>
                </div>
              ) : proformaLatestRecord ? (
                <>
                  <div className="qdb-proforma-record-title-value">
                    {proformaRefNo ||
                      getProformaNumber(proformaLatestRecord) ||
                      getRecordLabel(proformaLatestRecord)}
                  </div>
                  <div className="qdb-proforma-record-meta">
                    {getRecordMeta(proformaLatestRecord)}
                  </div>
                </>
              ) : (
                <div className="qdb-proforma-empty">No proforma generated record found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline ────────────────────────────────────────── */}
      <div className="qdb-pipeline-card">
        <div className="qdb-pipeline-header">
          <div>
            <h3 className="qdb-card-title">{type} Status</h3>
            <p className="qdb-card-sub">Select a stage to filter the records.</p>
          </div>
          <div className="qdb-pipeline-total-badge">
            <span className="qdb-pipeline-total-num">{total}</span>
            <span className="qdb-pipeline-total-lbl">total</span>
          </div>
        </div>

        <div className="qdb-pipeline-flow">
          {pipelineDisplaySteps.map((step, idx) => {
            const pct = total > 0 ? Math.round((step.value / total) * 100) : 0;
            const StepIcon = step.icon;
            return (
              <React.Fragment key={step.key}>
                <div
                  className="qdb-flow-node"
                  title={step.hint}
                  onClick={() => handleCardClick(step.drillStatus)}
                >
                  {/* Badge */}
                  <div className="qdb-flow-badge" style={{ background: `${step.color}15`, borderColor: `${step.color}40` }}>
                    <span className="qdb-flow-num" style={{ color: step.color }}>{step.value}</span>
                  </div>

                  {/* Label + pct */}
                  <div className="qdb-flow-meta">
                    <span className="qdb-flow-label">
                      {StepIcon && <StepIcon className="qdb-flow-icon" style={{ color: step.color }} />}
                      {step.label}
                    </span>
                    <span className="qdb-flow-pct" style={{ color: step.color }}>{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="qdb-flow-track">
                    <div
                      className="qdb-flow-fill"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${step.color}cc, ${step.color})` }}
                    />
                  </div>
                </div>


                {idx < pipelineDisplaySteps.length - 1 && (
                  <div className="qdb-flow-connector">

                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* <KpiModal
        show={showModal}
        status={modalStatus}
        type={type}
        data={quotationOrInvoiceData}
        onClose={() => { setShowModal(false); setModalStatus(null); }}
        companyList={companyList}
      /> */}

      <KpiModal
        show={showModal}
        status={modalStatus}
        type={modalType}
        data={quotationOrInvoiceData}
        companyList={companyList}
        selectedReference={selectedLatestRecord}
        companyId={selectedCompany || null}
        onClose={() => {
          setShowModal(false);
          setModalStatus(null);
          setSelectedLatestRecord(null);
        }}
      />
      {["Quotation", "Profroma"].includes(selectedData?.module) && (
        <ViewPopup
          show={showViewModal}
          type="Quotation"
          selectedInvoice={selectedData?.selectedInvoice}
          details={selectedData?.details}
          onClose={() => {
            setShowViewModal(false);
            setSelectedData(null);
          }}
        />
      )}

      {selectedData?.module === "Invoice" && (
        <ViewPopup
          show={showViewModal}
          type="Invoice"
          selectedInvoice={selectedData?.selectedInvoice}
          details={selectedData?.details}
          onClose={() => {
            setShowViewModal(false);
            setSelectedData(null);
          }}
        />
      )}


      <HelpModal show={showHelp} title="Dashboard - Help & Overview" screenName="Dashboard" onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default QuotationDashboard;