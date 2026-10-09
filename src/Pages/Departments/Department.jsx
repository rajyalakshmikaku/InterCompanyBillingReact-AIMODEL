import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../services/api";
import { FaEdit, FaTrash } from "react-icons/fa";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import "./Department.css";

const Department = () => {
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(true); // for list fetch
  const [createLoading, setCreateLoading] = useState(false); // for create button
  const [updateLoading, setUpdateLoading] = useState(false); // for update button

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);

  // New Department state
  const [newDepartment, setNewDepartment] = useState({
    DeparmentName: "",
    Description: "",
    // Status: "",
  });

  // Edit Department state
  const [editDepartment, setEditDepartment] = useState({
    id: "",
    deparmentName: "",
    description: "",
    // status: "",
  });

  const [errors, setErrors] = useState({});

  // ✅ Validation with duplicate check
  const validate = (checkForDuplicate = true) => {
    const newErrors = {};

    if (!newDepartment.DeparmentName.trim()) {
      newErrors.DeparmentName = "Department Name is required";
    } else if (
      checkForDuplicate &&
      departments.some(
        (dept) =>
          dept.deparmentName.toLowerCase() ===
          newDepartment.DeparmentName.trim().toLowerCase()
      )
    ) {
      newErrors.DeparmentName = "Department Name already exists";
    }

    if (!newDepartment.Description.trim()) {
      newErrors.Description = "Description is required";
    }
    // if (!newDepartment.Status.trim()) {
    //   newErrors.Status = "Status is required";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (validate(true)) {
      handleCreate();
    }
  };

  // 🔥 Fetch Departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get("api/Department/getdepartmentList");
      if (response.data && response.data.list) {
        setDepartments(response.data.list);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching department list:", error);
      alertify.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filters
  const [filters, setFilters] = useState({
    DeparmentName: "",
    Description: "",
    // Status: "",
  });

  const filteredDepartments = departments.filter((dept) => {
    return (
      (filters.DeparmentName === "" ||
        dept.deparmentName?.toLowerCase().includes(filters.DeparmentName.toLowerCase())) &&
      (filters.Description === "" ||
        dept.description?.toLowerCase().includes(filters.Description.toLowerCase())) 
      
    );
  });

  // Paginated list
  const totalPages = Math.ceil(filteredDepartments.length / recordsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // ✅ Handle Create Department
  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      const response = await AxiosInstance.post(
        "/api/Department/saveDepartment",
        newDepartment
      );
      if (response.data.success) {
        alertify.alert("Create", "Department created successfully!").show();
        setShowCreateScreen(false);
        setNewDepartment({ DeparmentName: "", Description: "", Status: "" });
        fetchDepartments();
      } else {
        alertify.error(response.data.message || "Failed to create department");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      alertify.error("Failed to create department");
    } finally {
      setCreateLoading(false);
    }
  };

  // ✅ Handle Update Department
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Prevent duplicates when updating
    if (
      departments.some(
        (dept) =>
          dept.deparmentName.toLowerCase() ===
            editDepartment.deparmentName.trim().toLowerCase() &&
          dept.id !== editDepartment.id
      )
    ) {
      alertify.error("Another department with this name already exists");
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await AxiosInstance.put(
        `/api/Department/UpdateDepartment/${editDepartment.id}`,
        editDepartment
      );

      if (response.data.success) {
        alertify.alert("Update", "Department updated successfully!").show();
        setShowEditScreen(false);
        fetchDepartments();
      } else {
        alertify.error("Failed to update department");
      }
    } catch (error) {
      console.error("Error updating department:", error);
      alertify.error("Failed to update department");
    } finally {
      setUpdateLoading(false);
    }
  };

  // ✅ Handle Delete Department
  const handleDelete = async (id) => {
    alertify.confirm(
      "Delete Department",
      "Are you sure you want to delete this department?",
      async function () {
        try {
          const response = await AxiosInstance.delete(
            `/api/Department/DeleteDepartment/${id}`
          );

          if (response.data.success) {
            setDepartments((prev) => prev.filter((d) => d.id !== id));
            alertify.alert("Delete", "Department deleted successfully!").show();
          } else {
            alertify.error(response.data.message || "Failed to delete department");
          }
        } catch (error) {
          console.error("Error deleting department:", error);
          alertify.error("Error while deleting department");
        }
      },
      function () {
        alertify.message("Delete cancelled");
      }
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* ✅ LIST SCREEN */}
        {!showCreateScreen && !showEditScreen && (
          <div className="reports-section">
            <h3 className="department-title">Department</h3>

            {/* Filters */}
            <div className="filter-group">
              <input
                type="text"
                value={filters.DeparmentName}
                onChange={(e) =>
                  setFilters({ ...filters, DeparmentName: e.target.value })
                }
                placeholder="Department Name"
              />
              <input
                type="text"
                value={filters.Description}
                onChange={(e) =>
                  setFilters({ ...filters, Description: e.target.value })
                }
                placeholder="Description"
              />
              {/* <input
                type="text"
                value={filters.Status}
                onChange={(e) =>
                  setFilters({ ...filters, Status: e.target.value })
                }
                placeholder="Status"
              /> */}
              <button
                className="Inventory-filter-btn"
                onClick={() => setCurrentPage(1)}
              >
                Filter
              </button>
            </div>

            {/* Add New Button */}
            <div style={{ margin: "10px 0" }}>
              <button
                className="btn_department"
                onClick={() => setShowCreateScreen(true)}
              >
                + Add Department
              </button>
            </div>

            {/* Records per page */}
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

            {/* Table */}
            <table className="department-table">
              <thead>
                <tr>
                  <th>DEPARTMENT NAME</th>
                  <th>DESCRIPTION</th>
                  <th>IS ACTIVE</th>
                  <th>IS DELETED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      <span className="spinner"></span>
                    </td>
                  </tr>
                ) : paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No departments found
                    </td>
                  </tr>
                ) : (
                  paginatedDepartments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.deparmentName}</td>
                      <td>{dept.description}</td>
                       <td>{dept.isActive}</td>
                        <td>{dept.isDeleted}</td>
                      <td>
                        <button
                          className="action-icon edit-icon"
                          title="Edit"
                          onClick={() => {
                            setEditDepartment(dept);
                            setShowEditScreen(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-icon cancel-icon"
                          title="Delete"
                          onClick={() => handleDelete(dept.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
           <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
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
        )}

        {/* ✅ CREATE SCREEN */}
        {showCreateScreen && (
          <div className="create-item-section">
            <div className="createdepart-item-box">
              <h3 className="create-title">Create Department</h3>
              <form onSubmit={onSubmit} className="createdepart-item-form-row">
                {/* Department Name */}
                <div className="formlabel-group">
                  <label>
                    Department Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.DeparmentName ? "input-error" : ""
                    }`}
                    placeholder="Enter Department Name"
                    value={newDepartment.DeparmentName}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        DeparmentName: e.target.value,
                      })
                    }
                  />
                  {errors.DeparmentName && (
                    <p className="error-message">{errors.DeparmentName}</p>
                  )}
                </div>

                {/* Description */}
                <div className="formlabel-group">
                  <label>
                    Description <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.Description ? "input-error" : ""
                    }`}
                    placeholder="Enter Description"
                    value={newDepartment.Description}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        Description: e.target.value,
                      })
                    }
                  />
                  {errors.Description && (
                    <p className="error-message">{errors.Description}</p>
                  )}
                </div>

                {/* Status */}
                {/* <div className="formlabel-group">
                  <label>
                    Status <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.Status ? "input-error" : ""
                    }`}
                    placeholder="Enter Status"
                    value={newDepartment.Status}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        Status: e.target.value,
                      })
                    }
                  />
                  {errors.Status && (
                    <p className="error-message">{errors.Status}</p>
                  )}
                </div> */}

                <div className="departform-actions">
                  <button
                    type="submit"
                    disabled={createLoading}
                   className="btn btn-success btn-lg"
                  >
                    {createLoading && <span className="spinner"></span>}
                    Save
                  </button>
                  <button
                    type="button"
                       className="btn btn-danger btn-lg"

                    onClick={() => setShowCreateScreen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ EDIT SCREEN */}
     {showEditScreen && (
  <div className="create-item-section">
    <div className="createdepart-item-box">
      <h3 className="Edit-title">Edit Department</h3>
      <form onSubmit={handleUpdate} className="createdepart-item-form-row">
        
        <div className="formlabel-group">
          <label>Department Name</label>
          <input
            type="text"
            placeholder="Department Name"
            value={editDepartment.deparmentName}
            onChange={(e) =>
              setEditDepartment({
                ...editDepartment,
                deparmentName: e.target.value,
              })
            }
            required
          />
        </div>

        <div className="formlabel-group">
          <label>Description</label>
          <input
            type="text"
            placeholder="Description"
            value={editDepartment.description}
            onChange={(e) =>
              setEditDepartment({
                ...editDepartment,
                description: e.target.value,
              })
            }
            required
          />
        </div>


       <div className="radio-group-row">
  <div className="radio-group">
    <label>Is Active</label>
    <br/>
    <div>
      <label><input type="radio" name="isActive" value="Yes"  checked={editDepartment.isActive === "Yes"} onChange={setEditDepartment}/> Yes</label>
      <label><input type="radio" name="isActive" value="No"  checked={editDepartment.isActive === "No"} onChange={setEditDepartment}/> No</label>
    </div>
  </div>
 &nbsp; 
  <div className="radio-group">
    <label>Is Deleted</label>
    <br/>
    <div>
      <label><input type="radio" name="isDeleted" value="Yes"  checked={editDepartment.isDeleted === "Yes"} onChange={setEditDepartment}/> Yes</label>
      <label><input type="radio" name="isDeleted" value="No"  checked={editDepartment.isDeleted === "No"}  onChange={setEditDepartment}/> No</label>
    </div>
  </div>
</div>

        {/* <div className="formlabel-group">
          <label>Status</label>
          <input
            type="text"
            placeholder="Status"
            value={editDepartment.status}
            onChange={(e) =>
              setEditDepartment({
                ...editDepartment,
                status: e.target.value,
              })
            }
            required
          />
        </div> */}




        <div className="departform-actions">
          <button
            type="submit"
            disabled={updateLoading}
            className="btn btn-success btn-lg"
          >
            {updateLoading && <span className="spinner"></span>}
            Update
          </button>

          <button
            type="button"
            className="btn btn-danger btn-lg"
            onClick={() => setShowEditScreen(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default Department;
