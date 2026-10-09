// CompanyPopup.jsx
import React, { useState } from "react";
import Pagination from "../../components/Common/Pagination";

const CompanyPopup = ({ isOpen, companies = [], onSelect, onClose,popuploading}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  

  const itemsPerPage = 10; // you can change if needed

  if (!isOpen) return null;

  // FILTER LOGIC
  const filtered = companies.filter((item) => {
    if (!searchQuery.trim()) return true;
    const hay = (
      (item.companyName || "") +
      (item.companyPhoneNumber || "") +
      (item.companyEmail || "") +
      (item.companyAddress || "") +
      (item.registrationNumber || "") +
      (item.vatNumber || "") +
      (item.companyWebsite || "")
    ).toLowerCase();
    return hay.includes(searchQuery.toLowerCase());
  });

  // RESET TO PAGE 1 WHEN SEARCH CHANGES
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // PAGINATION SLICING
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10050,
      }}
    >
      <div
        className="popup"
        style={{
          position: "relative",
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "70%",
          maxHeight: "80%",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "red",
          }}
        >
          &times;
        </button>

        <h3>Select Company</h3>

        <input
          type="text"
          placeholder="Search Company"
          value={searchQuery}
          onChange={handleSearch}
          style={{ width: "60%", marginBottom: "10px", padding: "8px" }}
        />

        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>COMPANY NAME</th>    
              <th>EMAIL</th>
              <th>PHONE NO.</th>
              <th>ADDRESS</th>
              <th>REGISTRATION NO.</th>
              <th>VAT NO.</th>
              <th>WEBSITE</th>
            </tr>
          </thead>
          <tbody>
            {popuploading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  <div className="loader"></div>
                </td>
              </tr>
            ) :
            paginatedData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#666" }}>
                  No companies found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelect(item)}
                >
                  <td>{item.companyName}</td>                 
                  <td>{item.companyEmail}</td>
                  <td>{item.companyPhoneNumber}</td>
                  <td>{item.companyAddress}</td>
                  <td>{item.registrationNumber}</td>
                  <td>{item.vatNumber}</td>
                  <td>{item.companyWebsite}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION COMPONENT */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />

        {/* <button
          style={{
            width: "11%",
            marginTop: "20px",
            backgroundColor: "red",
            color: "white",
          }}
          onClick={onClose}
        >
          Close
        </button> */}
      </div>
    </div>
  );
};

export default CompanyPopup;
