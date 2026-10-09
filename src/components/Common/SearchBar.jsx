import React from "react";

const SearchBar = ({ searchTerm, setSearchTerm ,placeholder="Search"}) => (
  <div className="quotation-dashboard-filters">
    <input
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
);

export default SearchBar;
