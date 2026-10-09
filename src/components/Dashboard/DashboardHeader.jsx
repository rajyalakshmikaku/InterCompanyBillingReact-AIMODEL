import React from "react";

const DashboardHeader = ({ type, setType }) => (
  <div className="quotation-dashboard-header">
    <h1>Dashboard</h1>
    <div className="header-actions">
      <select
        className="type-select"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="Quotation">Quotation</option>
        <option value="Invoice">Invoice</option>
      </select>
    </div>
  </div>
);

export default DashboardHeader;
