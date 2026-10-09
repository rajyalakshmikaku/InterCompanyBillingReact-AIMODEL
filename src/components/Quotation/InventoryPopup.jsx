import React, { useState, useEffect } from "react";
import Pagination from "../../components/Common/Pagination";
import { FiCheck, FiX } from "react-icons/fi";

// Vatable comes back as a boolean, "true"/"false", "Y"/"N" or 1/0 depending on
// the source, so read every shape the same way.
const isVatableValue = (value) => {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null) return false;

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "y" || normalized === "yes";
};

const InventoryPopup = ({
  show,
  onClose,
  inventoryItems = [],
  searchQuery,
  setSearchQuery,
  handleItemSelect,
  popupMode,
  quotationDetails = [],
  selectedQuotation = { details: [] },
  selectedRowIndex,
  popuploading
}) => {
  // Hooks MUST come first — ALWAYS RUN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredItems = inventoryItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return !searchQuery
      ? true
      : Object.values(item).some((val) =>
        String(val).toLowerCase().includes(query)
      );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Only AFTER hooks, you can conditional return
  if (!show) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
          maxHeight: "90%",
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

        <h3>Select Inventory Item</h3>

        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "60%", marginBottom: "10px", padding: "8px" }}
        />

        <table className="data-table">
          <thead>
            <tr>
              <th>COMPANY NAME</th>
              <th>ITEM CODE</th>
              <th>ITEM NAME</th>
              <th>CATEGORY</th>
              <th>DESCRIPTION</th>
              {/* <th>Quantity</th> */}
              <th> UNIT RATE EXCL VAT</th>
              <th>IS VATABLE</th>

            </tr>
          </thead>
          <tbody>
            {popuploading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  <div className="loader"></div>
                </td>
              </tr>
            ) : paginatedItems.map((item) => {

              let alreadyAdded = false;

              if (popupMode === "create") {
                alreadyAdded = quotationDetails.some(
                  (q) => q.itemCode === item.itemCode
                );
              } else if (popupMode === "edit") {
                alreadyAdded = selectedQuotation.details.some(
                  (q, idx) =>
                    idx !== selectedRowIndex &&
                    q.itemCode === item.itemCode
                );
              }



              return (
                <tr
                  key={item.id}
                  style={{
                    cursor: alreadyAdded ? "not-allowed" : "pointer",
                    opacity: alreadyAdded ? 0.5 : 1,
                  }}
                  onClick={() => !alreadyAdded && handleItemSelect(item)}
                >
                  <td>{item.companyName}</td>
                  <td>{item.itemCode}</td>
                  <td>{item.itemName}</td>
                  <td>{item.category}</td>
                  <td>{item.description}</td>
                  {/* <td style={{ textAlign: "right" }}>{item.quantity}</td> */}
                  <td
                    style={{ width: "170px", textAlign: "center",}} >
                    <span
                      style={{
                        display: "inline-block",
                        width: "70px",
                        textAlign: "right",
                      }}
                    >
                      {item.price}
                    </span>
                  </td>
                  <td hidden style={{ textAlign: "right" }}>{item.taxRate}</td>
                  <td style={{ textAlign: "center" }}>
                    {isVatableValue(item.vatableStatus ?? item.isVatable) ? (
                      <FiCheck style={{ color: "green", marginLeft: "6px", fontSize: "20px" }} />
                    ) : (
                      <FiX style={{ color: "red", marginLeft: "6px", fontSize: "20px" }} />
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>


        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
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

export default InventoryPopup;
