import React, { useState, useEffect } from "react";
import { AxiosInstance } from "../../services/api";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import "./Roles.css";
import HelpModal from "../../components/Common/HelpModal";
import Pagination from "../../components/Common/Pagination";
import { FaEdit, FaTrash } from "react-icons/fa";
import HoloButton from "../../components/Common/HoloButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/AlertDialog";

const Roles = () => {
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [items, setItems] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const getRecordId = (row) => row?.id ?? row?.Id ?? row?.ID ?? "";

  const getStatusValue = (row) => {
    const rawValue =
      row?.Status ??
      row?.status ??
      row?.IsActive ??
      row?.isActive ??
      row?.IsDeleted ??
      row?.isDeleted;
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return "";
    }

    const normalized = String(rawValue).trim().toUpperCase();
    if (["Y", "YES", "TRUE", "1"].includes(normalized)) return "Y";
    if (["N", "NO", "FALSE", "0", "DELETE", "DELETED"].includes(normalized))
      return "N";
    return normalized;
  };

  const getStatusLabel = (value) => {
    const normalized = getStatusValue({ Status: value });
    if (normalized === "Y") return "Yes";
    if (normalized === "N") return "No";
    return value ?? "";
  };

  const getEditStatusValue = (value) => {
    const normalized = String(value ?? "").trim().toUpperCase();
    if (["Y", "YES", "TRUE", "1", "ACTIVE"].includes(normalized)) {
      return "Active";
    }
    if (["N", "NO", "FALSE", "0", "INACTIVE", "DELETE", "DELETED"].includes(normalized)) {
      return "Inactive";
    }
    return "";
  };

  const normalizeRoleForList = (row, fallback = {}) => {
    const idValue = getRecordId(row) || fallback.id || fallback.Id || fallback.ID || "";
    const normalizedStatus = getStatusValue(row) || getStatusValue(fallback) || "Y";

    return {
      ...row,
      ...fallback,
      id: idValue,
      Id: idValue,
      ID: idValue,
      RoleName: row?.RoleName ?? row?.roleName ?? fallback.RoleName ?? fallback.roleName ?? "",
      RoleDescription:
        row?.RoleDescription ?? row?.roleDescription ?? fallback.RoleDescription ?? fallback.roleDescription ?? "",
      Status: normalizedStatus,
      status: normalizedStatus,
    };
  };

  const mergeRoleIntoList = (prevItems, incomingRole) => {
    const normalizedIncoming = normalizeRoleForList(incomingRole);
    const incomingId = String(getRecordId(normalizedIncoming) ?? "");

    if (!incomingId) {
      return [...prevItems, normalizedIncoming];
    }

    const filtered = prevItems.filter(
      (item) => String(getRecordId(item) ?? "") !== incomingId,
    );

    return [...filtered, normalizedIncoming];
  };

  const isSuccessfulApiResponse = (response) => {
    const data = response?.data ?? {};

    if (typeof data === "object") {
      if (data?.success === true || data?.Success === true) return true;
      if (data?.isSuccess === true || data?.IsSuccess === true) return true;
      if (data?.status === true || data?.Status === true) return true;
    }

    return response?.status >= 200 && response?.status < 300;
  };

  const getApiMessage = (response, fallbackMessage) => {
    const data = response?.data ?? {};
    return (
      data?.message ||
      data?.Message ||
      data?.msg ||
      data?.Msg ||
      fallbackMessage
    );
  };

  // New Item state
  const [newItem, setNewItem] = useState({
    RoleName: "",
    RoleDescription: "",
    Status: "Active",
  });

  // Validation state
  const [errors, setErrors] = useState({
    RoleName: "",
    RoleDescription: "",
    Status: "",
    duplicate: "",
  });

  // Edit Item state
  const [editItem, setEditRole] = useState({
    Id: "",
    RoleName: "",
    RoleDescription: "",
    Status: "Active",
  });

  // Validation state for Edit form
  const [editErrors, setEditErrors] = useState({
    RoleName: "",
    RoleDescription: "",
    Status: "",
    duplicate: "",
  });

  // Filters (applied)
  const [filters, setFilters] = useState({
    RoleName: "",
    RoleDescription: "",
    Status: "",
  });

  // Temporary filter inputs (before Apply)
  const [tempFilters, setTempFilters] = useState({
    RoleName: "",
    RoleDescription: "",
    Status: "",
  });
  const resetCreateForm = () => {
    setNewItem({
      RoleName: "",
      RoleDescription: "",
      Status: "Active",
    });

    setErrors({
      RoleName: "",
      RoleDescription: "",
      Status: "",
      duplicate: "",
    });
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);

  // Sorting (only RoleName)
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get("/api/Roles/getRolesList");
      if (response.data && response.data.list) {
        setItems(Array.isArray(response.data.list) ? response.data.list : []);
      } else {
        setItems([]);
        console.error("List not found in response");
      }
    } catch (error) {
      console.error("Error fetching Roles:", error);
      alertify.error("Failed to load Roles");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // normalization helper
  const norm = (v) =>
    v === null || v === undefined ? "" : String(v).trim().toLowerCase();

  // Filtered data (applied filters)
  const filteredData = React.useMemo(() => {
    return items.filter((d) => {
      const fName = norm(filters.RoleName);
      const fDesc = norm(filters.RoleDescription);
      const fStatus = getEditStatusValue(filters.Status);

      const dName = norm(d.RoleName ?? d.roleName);
      const dDesc = norm(d.RoleDescription ?? d.roleDescription);
      const dStatus = getEditStatusValue(getStatusValue(d));

      const nameMatch = !fName || dName.includes(fName);
      const descMatch = !fDesc || dDesc.includes(fDesc);
      const statusMatch = !fStatus || dStatus === fStatus;

      return nameMatch && descMatch && statusMatch;
    });
  }, [items, filters]);

  // Sorted data (only when sorting by RoleName)
  const sortedData = React.useMemo(() => {
    if (!Array.isArray(filteredData)) return [];

    if (sortConfig.key !== "RoleName") return filteredData.slice();

    const direction = sortConfig.direction === "desc" ? -1 : 1;

    return filteredData.slice().sort((a, b) => {
      const aName = (a.RoleName ?? a.roleName ?? "")
        .toString()
        .trim()
        .toLowerCase();
      const bName = (b.RoleName ?? b.roleName ?? "")
        .toString()
        .trim()
        .toLowerCase();
      if (aName < bName) return -1 * direction;
      if (aName > bName) return 1 * direction;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination calculations (single source of truth)
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  // keep currentPage valid when totalPages or recordsPerPage change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(indexOfFirstRecord, indexOfLastRecord);

  // Pagination change handler
  const handlePageChange = (page) => {
    const p = Number(page) || 1;
    if (p < 1) setCurrentPage(1);
    else if (p > totalPages) setCurrentPage(totalPages);
    else setCurrentPage(p);
  };

  // Apply/Clear filters
  const handleApplyFilters = () => {
    setFilters({
      RoleName: tempFilters.RoleName?.trim() ?? "",
      RoleDescription: tempFilters.RoleDescription?.trim() ?? "",
      Status: tempFilters.Status ?? "",
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const cleared = {
      RoleName: "",
      RoleDescription: "",
      Status: "",
    };
    setTempFilters(cleared);
    setFilters(cleared);
    setCurrentPage(1);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    let newErrors = {};

    // Validation
    if (!newItem.RoleName?.trim()) {
      newErrors.RoleName = "Role Name is required";
    } else if (
      !/^[A-Za-z0-9&.,()\/\- ]{3,50}$/.test(newItem.RoleName.trim())
    ) {
      newErrors.RoleName =
        "Role Name must be 3 to 50 characters and can contain letters, numbers, spaces, &, ., -, /, commas and parentheses.";
    }

    if (!newItem.RoleDescription?.trim()) {
      newErrors.RoleDescription = "Role Description is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setCreateLoading(false);
      return;
    }

    try {
      const payload = {
        RoleName: newItem.RoleName.trim(),
        RoleDescription: newItem.RoleDescription.trim(),
        Status: "Active",
      };

      const response = await AxiosInstance.post(
        "/api/Roles/SaveRoles",
        payload
      );

      if (response.data.success) {
        alertify.alert(
          "Success",
          response.data.message || "Role saved successfully.",
          async () => {
            await fetchItems();

            setShowCreateModal(false);

            setNewItem({
              RoleName: "",
              RoleDescription: "",
              Status: "Y",
            });

            setErrors({
              RoleName: "",
              RoleDescription: "",
              Status: "",
              duplicate: "",
            });
          }
        );
      } else {
        alertify.alert(
          "Information",
          response.data.message || "Unable to save role."
        );
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.Message ||
        "Unable to save role.";

      alertify.alert("Information", message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();

    setUpdateLoading(true);

    let newErrors = {};

    // Validation
    if (!editItem.RoleName?.trim()) {
      newErrors.RoleName = "Role Name is required";
    } else if (
      !/^[A-Za-z0-9&.,()\/\- ]{3,50}$/.test(editItem.RoleName.trim())
    ) {
      newErrors.RoleName =
        "Role Name must be 3 to 50 characters and can contain letters, numbers, spaces, &, ., -, /, commas and parentheses.";
    }

    if (!editItem.RoleDescription?.trim()) {
      newErrors.RoleDescription = "Role Description is required";
    }

    if (!editItem.Status) {
      newErrors.Status = "Please select status";
    }

    setEditErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setUpdateLoading(false);
      return;
    }

    try {
      const payload = {
        Id: editItem.Id,
        RoleName: editItem.RoleName.trim(),
        RoleDescription: editItem.RoleDescription.trim(),
        Status: editItem.Status,
      };
      console.log("edit item", editItem)
      const response = await AxiosInstance.post(
        `/api/Roles/UpdateRoles/${editItem.Id}`,
        payload
      );

      if (response.data.success) {
        alertify.alert(
          "Success",
          response.data.message || "Role updated successfully.",
          async () => {
            await fetchItems();

            setShowEditModal(false);

            setEditRole({
              Id: "",
              RoleName: "",
              RoleDescription: "",
              Status: "Y",
            });

            setEditErrors({
              RoleName: "",
              RoleDescription: "",
              Status: "",
              duplicate: "",
            });
          }
        );
      } else {
        alertify.alert(
          "Information",
          response.data.message || "Unable to update role."
        );
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.Message ||
        "Unable to update role.";

      alertify.alert("Information", message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInitiateDelete = (id) => {
    setRoleToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleExecuteDelete = async () => {

    if (!roleToDelete) return;

    try {

      const response = await AxiosInstance.post(
        `/api/Roles/DeleteRoles/${roleToDelete}`
      );

      if (response.data.success) {

        alertify.alert("Success", "Role deleted successfully.", () => {
          fetchItems();
        });

      } else {

        alertify.alert("Error", response.data.message);

      }

    } catch (err) {

      alertify.alert("Error", "Delete failed.");

    }

    setIsDeleteOpen(false);
    setRoleToDelete(null);
  };
  return (
    <div className="role-container">
      <div className="role-content">
        {/* LIST SCREEN */}
        {!showCreateScreen && !showEditScreen && (
          <div className="role-section">
            <div className="list-header">
              <h3 className="customer-title">Roles</h3>

              <HoloButton
                variant="secondary"
                size="md"
                onClick={() => setShowHelp(true)}
              >
                <i className="fas fa-question-circle"></i> Help
              </HoloButton>
            </div>

            {/* Filters */}
            <div className="filter-section">
              <input
                type="text"
                style={{width:"200px"}}
                className="role-name-filter"
                value={tempFilters.RoleName}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, RoleName: e.target.value })
                }
                placeholder="Role Name"
              />
              {/* <input
                type="text"
                value={tempFilters.RoleDescription}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    RoleDescription: e.target.value,
                  })
                }
                placeholder="Role Description"
              /> */}
              <select
                className="role-status-filter"
                value={tempFilters.Status}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, Status: e.target.value })
                }
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <HoloButton
                variant="primary"
                size="md"
                onClick={handleApplyFilters}
              >
                <i className="fas fa-filter"></i>  Filter
              </HoloButton>

              <HoloButton
                variant="secondary"
                size="md"
                onClick={handleClearFilters}
              >
                <i className="fas fa-times-circle"></i> Clear 
              </HoloButton>
            </div>

            {/* Add New Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "10px 0",
              }}
            >
              {/* Records per page - Left */}
              <div className="records-per-page">
                Records per page:
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ marginLeft: "8px" }}
                >
                  {[2, 5, 10, 25].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Role Button - Right */}
              <HoloButton
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus-circle"></i> Add New
              </HoloButton>
            </div>
            <br />

            {/* Roles Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => requestSort("RoleName")}
                  >
                    ROLE NAME{" "}
                    {sortConfig.key === "RoleName"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : "↑"}
                  </th>
                  <th>ROLE DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      <div className="loader"></div>
                    </td>
                  </tr>
                ) : currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No roles found
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((dept) => {
                    const rowStatus = getStatusValue(dept);
                    const rowId = String(
                      getRecordId(dept) ??
                      `${dept.RoleName ?? dept.roleName ?? "role"}-${dept.RoleDescription ?? dept.roleDescription ?? "desc"}`,
                    );

                    return (
                      <tr key={rowId}>
                        <td>{dept.roleName ?? dept.RoleName}</td>
                        <td>{dept.roleDescription ?? dept.RoleDescription}</td>
                        {/* <td>{getStatusLabel(rowStatus)}</td> */}
                        <td style={{ textTransform: "capitalize" }}>
                          {getStatusLabel(rowStatus)?.toLowerCase()}
                        </td>
                        <td>
                          <FaEdit
                            style={{ cursor: "pointer" }}
                            className="action-icon edit-icon"
                            title="Edit"
                            onClick={() => {
                              setEditRole({
                                Id: getRecordId(dept),
                                RoleName: dept.roleName ?? dept.RoleName,
                                RoleDescription: dept.roleDescription ?? dept.RoleDescription,
                                Status: getEditStatusValue(rowStatus) || "Active",
                              });

                              setEditErrors({
                                RoleName: "",
                                RoleDescription: "",
                                Status: "",
                                duplicate: "",
                              });

                              setShowEditModal(true);
                            }}
                          />
                          &nbsp;

                          {/* {rowStatus === "Y" && (
                            <FaTrash
                              style={{ cursor: "pointer" }}
                              className="action-icon cancel-icon"
                              title="Delete"
                              onClick={() => handleInitiateDelete(getRecordId(dept))}
                            />
                          )} */}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loading && totalRecords > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={totalRecords}
                itemsPerPage={recordsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        {/* RENDER ALERT DIALOG */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this role? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRoleToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleExecuteDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CREATE ITEM SCREEN */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="role-modal">
              <div className="modal-header">
                <h3>Create Role</h3>
                {/* <button onClick={() => setShowCreateModal(false)}>✕</button> */}
                <button
                  onClick={() => {
                    resetCreateForm();
                    setShowCreateModal(false);
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateItem}>
                <div className="formlabel-group">
                  <label>
                    Role Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.RoleName || ""}
                    maxLength={50}
                    className={errors.RoleName ? "error-input" : ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow letters, numbers, spaces, &, ., -, /, comma, ()
                      if (/^[A-Za-z0-9&.,()\/\- ]*$/.test(value)) {
                        setNewItem({
                          ...newItem,
                          RoleName: value,
                        });

                        setErrors((prev) => ({
                          ...prev,
                          RoleName:
                            value.trim() === ""
                              ? "Role Name is required"
                              : value.trim().length < 3
                                ? "Role Name must be at least 3 characters"
                                : "",
                        }));
                      }
                    }}
                    onBlur={() => {
                      const value = newItem.RoleName || "";

                      setErrors((prev) => ({
                        ...prev,
                        RoleName:
                          value.trim() === ""
                            ? "Role Name is required"
                            : value.trim().length < 3
                              ? "Role Name must be at least 3 characters"
                              : "",
                      }));
                    }}
                  />

                  {errors.RoleName && (
                    <p className="error-message">{errors.RoleName}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Role Description <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={newItem.RoleDescription || ""}
                    maxLength={200}
                    className={errors.RoleDescription ? "error-input" : ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      setNewItem({
                        ...newItem,
                        RoleDescription: value,
                      });

                      setErrors((prev) => ({
                        ...prev,
                        RoleDescription: value.trim()
                          ? ""
                          : "Role Description is required",
                      }));
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({
                        ...prev,
                        RoleDescription: newItem.RoleDescription?.trim()
                          ? ""
                          : "Role Description is required",
                      }));
                    }}
                  />

                  {errors.RoleDescription && (
                    <p className="error-message">{errors.RoleDescription}</p>
                  )}
                </div>


                <div className="Role-actions">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={createLoading}
                  >
                    {createLoading ? (
                      <>
                        Saving
                        <span className="button-loader"></span>
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setNewItem({ RoleName: "", RoleDescription: "", Status: "Active" });
                      setErrors({ RoleName: "", RoleDescription: "", Status: "", duplicate: "" });
                      setShowCreateModal(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT ITEM SCREEN */}

        {showEditModal && (
          <div className="modal-overlay">
            <div className="role-modal">
              <div className="modal-header">
                <h3>Edit Role</h3>
                <button onClick={() => setShowEditModal(false)}>✕</button>
              </div>

              <form onSubmit={handleEditItem}>
                <div className="form-row">
                  <div className="formlabel-group">
                    <label>
                      Role Name <span className="required">*</span>
                    </label>

                    <input
                      type="text"
                      value={editItem.RoleName || ""}
                      maxLength={50}
                      className={editErrors.RoleName ? "input-error" : ""}
                      onChange={(e) => {
                        const value = e.target.value;

                        // Allow letters, numbers, spaces, &, ., -, /, commas, ()
                        if (/^[A-Za-z0-9&.,()\/\- ]*$/.test(value)) {
                          setEditRole({
                            ...editItem,
                            RoleName: value,
                          });

                          setEditErrors((prev) => ({
                            ...prev,
                            RoleName:
                              value.trim() === ""
                                ? "Role Name is required"
                                : value.trim().length < 3
                                  ? "Role Name must be at least 3 characters"
                                  : "",
                          }));
                        }
                      }}
                      onBlur={() => {
                        const value = editItem.RoleName || "";

                        setEditErrors((prev) => ({
                          ...prev,
                          RoleName:
                            value.trim() === ""
                              ? "Role Name is required"
                              : value.trim().length < 3
                                ? "Role Name must be at least 3 characters"
                                : "",
                        }));
                      }}
                    />

                    {editErrors.RoleName && (
                      <p className="error-message">{editErrors.RoleName}</p>
                    )}
                  </div>

                  <div className="formlabel-group">
                    <label>
                      Status <span className="required">*</span>
                    </label>
                    <select
                      value={editItem.Status ?? ""}
                      className={editErrors.Status ? "input-error" : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditRole({
                          ...editItem,
                          Status: value,
                        });
                        setEditErrors((prev) => ({
                          ...prev,
                          Status: value ? "" : "Please select status",
                        }));
                      }}
                      onBlur={() => {
                        setEditErrors((prev) => ({
                          ...prev,
                          Status: editItem.Status ? "" : "Please select status",
                        }));
                      }}
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    {editErrors.Status && (
                      <p className="error-message">{editErrors.Status}</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="formlabel-group">
                    <label>
                      Role Description <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={editItem.RoleDescription || ""}
                      className={editErrors.RoleDescription ? "input-error" : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditRole({
                          ...editItem,
                          RoleDescription: value,
                        });

                        setEditErrors((prev) => ({
                          ...prev,
                          RoleDescription: value.trim() ? "" : "Role Description is required",
                        }));
                      }}
                      onBlur={() => {
                        setEditErrors((prev) => ({
                          ...prev,
                          RoleDescription: editItem.RoleDescription?.trim()
                            ? ""
                            : "Role Description is required",
                        }));
                      }}
                    />

                    {editErrors.RoleDescription && (
                      <p className="error-message">{editErrors.RoleDescription}</p>
                    )}
                  </div>
                </div>

                <div className="Role-actions">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        Updating
                        <span className="button-loader"></span>
                      </>
                    ) : (
                      "Update"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-lg"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditErrors({ RoleName: "", RoleDescription: "", Status: "", duplicate: "" });
                      setEditRole({ Id: "", RoleName: "", RoleDescription: "", Status: "Y" });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <HelpModal
          show={showHelp}
          title="Roles - Help & Overview"
          screenName="Roles"
          onClose={() => setShowHelp(false)}
        />
      </div>
    </div>
  );
};

export default Roles;
