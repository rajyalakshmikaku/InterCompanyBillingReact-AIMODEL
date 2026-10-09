import React, { useState } from "react";

const EntityList = ({
  items,
  loading,
  setShowCreateScreen,
  setEditItem,
  setShowEditScreen,
  handleDelete,
}) => {
  const [filters, setFilters] = useState({
    CompanyName: "",
    VatNumber: "",
    RegistrationNumber: "",
    CompanyWebsite: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);

  const filteredEntities = items.filter((entity) =>
    Object.keys(filters).every((key) =>
      filters[key] === "" ||
      entity[key]?.toLowerCase().includes(filters[key].toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredEntities.length / recordsPerPage);
  const paginatedEntities = filteredEntities.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="reports-section">
      <h2>Companies</h2>

      <div className="filter-group">
        {Object.keys(filters).map((key) => (
          <input
            key={key}
            type="text"
            value={filters[key]}
            onChange={(e) =>
              setFilters({ ...filters, [key]: e.target.value })
            }
            placeholder={key.replace(/([A-Z])/g, " $1")}
          />
        ))}
        <button
          className="receiving-filter-btn"
          type="button"
          onClick={() => setCurrentPage(1)}
        >
          Filter
        </button>
      </div>

      <div style={{ margin: "10px 0" }}>
        <button
          className="btn_receiving"
          style={{ backgroundColor: "darkorange", color: "white", border: "none" }}
          onClick={() => setShowCreateScreen(true)}
        >
          + Add New Company
        </button>
      </div>

      <div className="records-per-page">
        Records per page:
        <select
          value={recordsPerPage}
          onChange={(e) => {
            setRecordsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {[2, 5, 10, 25].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>
      <br />

      <table className="recon-table">
        <thead>
          <tr>
            <th>COMPANY NAME</th>
            <th>VAT NUMBER</th>
            <th>REG. NUMBER</th>
            <th>WEBSITE</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th>ADDRESS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                <div className="loader"></div>
              </td>
            </tr>
          ) : paginatedEntities.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                No entities found.
              </td>
            </tr>
          ) : (
            paginatedEntities.map((entity) => (
              <tr key={entity.Id}>
                <td>{entity.CompanyName}</td>
                <td>{entity.VatNumber}</td>
                <td>{entity.RegistrationNumber}</td>
                <td>{entity.CompanyWebsite}</td>
                <td>{entity.CompanyEmail}</td>
                <td>{entity.CompanyPhoneNumber}</td>
                <td>{entity.CompanyAddress}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => {
                      setEditItem(entity);
                      setShowEditScreen(true);
                    }}
                  >
                    <i className="fas fa-edit" style={{ color: "blue" }}></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(entity.Id)}
                  >
                    <i className="fas fa-trash" style={{ color: "red" }}></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default EntityList;
