import React, { useState, useEffect } from "react";
import Pagination from "../../components/Common/Pagination";

const CustomerPopup = ({
  show,
  onClose,
  customers = [],
  searchQuery,
  setSearchQuery,
  popupCustomerMode,
  setSelectedQuotation,
  clearValidation,
  setReceivingEntity,
  setCustomerName,
  setCustomerPhone,
  setCustomerEmail,
  setCustomerAddress,
  setReceivingCompany,
  setCustomerRefNo,
  popuploading
}) => {

  // Hooks must ALWAYS run
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // FILTER RESULTS
  const filteredCustomers = customers.filter((item) =>
    !searchQuery
      ? true
      : Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
  );

  // RESET PAGE WHEN SEARCH CHANGES
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // PAGINATION
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Return null AFTER hooks
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        {/* CLOSE BUTTON */}
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

        <h3>Select Customers</h3>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search Customer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "60%", marginBottom: "10px", padding: "8px" }}
        />

        {/* TABLE */}
        <table className="data-table">
          <thead>
            <tr>
              <th>CUSTOMER REF NO.</th>
              <th>COMPANY NAME</th>
              <th>CUSTOMER NAME</th>
              <th>PHONE NO.</th>
              <th>EMAIL</th>
              <th>ADDRESS</th>
              
            </tr>
          </thead>
          <tbody>
             {popuploading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  <div className="loader"></div>
                </td>
              </tr>
            ) :paginatedCustomers.map((item) => (
              <tr
                key={item.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (popupCustomerMode === "create") {
                    setReceivingEntity(item.receivingCompany);
                    setCustomerName(item.name || "");
                    setCustomerPhone(item.mobile || "");
                    setCustomerEmail(item.email || "");
                    setCustomerAddress(item.address || "");
                    setReceivingCompany(item.receivingCompany || "");
                    setCustomerRefNo(item.customerRefNo || "");
                  } else if (popupCustomerMode === "edit") {
                    setSelectedQuotation((prev) => ({
                      ...prev,
                      receiving: item.receivingCompany || "",
                      customerName: item.name || "",
                      customerEmail: item.email || "",
                      customerPhone: item.mobile || "",
                      customerAddress: item.address || "",
                    }));
                  }

                  clearValidation([
                    "CustomerName",
                    "CustomerPhone",
                    "CustomerEmail",
                    "CustomerAddress",
                    "ReceivingEntity",
                    "ReceivingCompany",
                    "receivingEntity",
                  ]);

                  onClose();
                  setSearchQuery("");
                }}
              >
                <td>{item.customerRefNo}</td>
                <td>{item.receivingCompany}</td>
                <td>{item.name}</td>
                <td>{item.mobile}</td>
                <td>{item.email}</td>
                <td>{item.address}</td>
                
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        {/* CLOSE BUTTON */}
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

export default CustomerPopup;
