import React from "react";
import { motion } from "framer-motion";
import {
  FaFileInvoice,
  FaMoneyBillWave,
  FaCheckCircle,
  FaBan,
  FaUndoAlt,
  FaReceipt,
} from "react-icons/fa";
import { INVOICE_STAGES, readCount } from "../../utility/statusPipelines";

// One card per invoice status, in the same order as the pipeline track.
const STAGE_ICONS = {
  generated: FaMoneyBillWave,
  completed: FaCheckCircle,
  refund: FaUndoAlt,
  creditnote: FaReceipt,
  cancelled: FaBan,
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

const InvoiceSummaryCards = ({ counts, onCardClick, isLoading }) => {
  const bucket = counts?.invoices;
  const cards = [
    {
      key: "total",
      label: "Total Invoices",
      accent: "total",
      icon: FaFileInvoice,
      value: readCount(bucket, ["total"]),
      drillStatus: "Total",
      type: "Invoice",
    },
    ...INVOICE_STAGES.filter((stage) => stage.key !== "proforma").map((stage) => ({
      key: stage.key,
      label: stage.label,
      accent: stage.accent,
      icon: STAGE_ICONS[stage.key] || FaFileInvoice,
      value: readCount(bucket, stage.countKeys),
      drillStatus: stage.drillStatus,
      type: stage.key === "proforma" ? "Quotation" : "Invoice",
    })),
  ];

  return (
    <div className="summary-cards-row summary-cards-row-invoice">
      {cards.map(({ key, label, accent, icon: Icon, value, drillStatus ,type}, index) => (
        <motion.div
          key={key}
          className={`stat-card stat-${accent}`}
          onClick={() => !isLoading && onCardClick(drillStatus, type)}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.10)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="stat-card-icon">
            <Icon />
          </span>
          <div className="stat-card-body">
            <span className="stat-card-label">{label}</span>
            <span className="stat-card-value">
              {isLoading ? <span className="qdb-summary-spinner" aria-label="Loading" /> : value}
            </span>
          </div>
          <span className="stat-card-hint">View details →</span>
        </motion.div>
      ))}
    </div>
  );
};

export default InvoiceSummaryCards;
