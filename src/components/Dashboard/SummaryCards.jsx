import React from "react";
import QuotationSummaryCards from "./QuotationSummaryCards";
import InvoiceSummaryCards from "./InvoiceSummaryCards";

const SummaryCards = ({ type, counts, onCardClick, isLoading, deletedCount }) => {
  if (type === "Quotation") {
    return (
      <QuotationSummaryCards
        counts={counts}
        onCardClick={onCardClick}
        isLoading={isLoading}
      />
    );
  }

  return <InvoiceSummaryCards counts={counts} onCardClick={onCardClick} isLoading={isLoading} />;
};

export default SummaryCards;
