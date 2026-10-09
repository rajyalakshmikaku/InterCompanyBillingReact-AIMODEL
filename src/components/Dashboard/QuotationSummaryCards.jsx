import React from "react";
import { motion } from "framer-motion";
import {
  FaFileInvoiceDollar,
  FaPlusCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaFileInvoice,
  FaTrashAlt,
} from "react-icons/fa";
import { QUOTATION_STAGES, readCount } from "../../utility/statusPipelines";

// The cards mirror the pipeline stages exactly — one card per status — with
// Total pinned in front. Counts, colours and drill-down filters all come from
// the shared stage list, so the cards can never disagree with the track.
const STAGE_ICONS = {
  created: FaPlusCircle,
  approved: FaCheckCircle,
  proforma: FaFileAlt,
  invoiced: FaFileInvoice,
  closed: FaTimesCircle,
  expired: FaClock,
  overdue: FaExclamationTriangle,
  // unpaid : FaExclamationTriangle,
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

const QuotationSummaryCards = ({ counts, onCardClick, isLoading }) => {
  const bucket = counts?.quotations;

  const cards = [
    {
      key: "total",
      label: "Total Quotations",
      accent: "total",
      icon: FaFileInvoiceDollar,
      value: readCount(bucket, ["total"]),
      drillStatus: "Total",
    },
    ...QUOTATION_STAGES.map((stage) => ({
      key: stage.key,
      label: stage.label,
      accent: stage.accent,
      icon: STAGE_ICONS[stage.key] || FaFileInvoiceDollar,
      value: readCount(bucket, stage.countKeys),
      drillStatus: stage.drillStatus,
    })),
   
  ];

  return (
    <div className="summary-cards-row summary-cards-row-quotation">
      {cards.map(({ key, label, accent, icon: Icon, value, drillStatus }, index) => (
        <motion.div
          key={key}
          className={`stat-card stat-${accent}`}
          onClick={() => !isLoading && onCardClick(drillStatus)}
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

export default QuotationSummaryCards;
