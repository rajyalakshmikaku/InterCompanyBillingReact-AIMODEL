import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMasterList,
  createmaster,
  updatemaster,
  deletemaster,
} from "../../redux/MasterSlice";
import "./MasterData.css";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import Pagination from "../../components/Common/Pagination";
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

const MasterData = () => {
  const dispatch = useDispatch();
  const {
    tableData = [],
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.master || {});

  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [showHelp, setShowHelp] = useState(false);
  const [quotationType, setQuotationType] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // errors are now stored as e.g. { "Currency_description": "msg", "Tax_taxPercentage": "msg" }
  const [errors, setErrors] = useState({});
  const { sortedData, requestSort, sortConfig } = useSort(tableData);
  const [searchTerm, setSearchTerm] = useState("");

 const normalizeSearchText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const getSearchableText = (item) => {
    if (!item || typeof item !== "object") return "";

    const values = [];

    const collect = (value) => {
      if (value === null || value === undefined) return;

      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        values.push(String(value));
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }

      if (typeof value === "object") {
        Object.values(value).forEach(collect);
      }
    };

    collect(item);
    return values.join(" ");
  };

const filteredData = React.useMemo(() => {
  const sourceData = selectedType === "Help"
    ? tableData
    : sortedData;

  if (!searchTerm.trim()) {
    return sourceData || [];
  }

  const searchText = normalizeSearchText(searchTerm);

  return (sourceData || []).filter((item) => {
  if (selectedType === "Help") {
  const screenName = normalizeSearchText(
    item?.screenName ?? item?.ScreenName ?? ""
  );

  return screenName.includes(searchText);
}

    // Other types - existing search
    const searchable = normalizeSearchText(
      getSearchableText(item)
    );

    return searchable.includes(searchText);
  });
}, [tableData, sortedData, searchTerm, selectedType]);
  const [originalData, setOriginalData] = useState(null);

  // Pagination

  const totalRecords = (filteredData || []).length;
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);

  const totalPages = Math.ceil(((filteredData?.length || 0) / recordsPerPage));

  const paginatedData = (filteredData || []).slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage,
  );

  // Pagination change handler
  const handlePageChange = (page) => {
    const p = Number(page) || 1;
    if (p < 1) setCurrentPage(1);
    else if (p > totalPages) setCurrentPage(totalPages);
    else setCurrentPage(p);
  };

  // Helpers for namespaced errors
  const errorKey = (field, type = selectedType) => `${type}_${field}`;
  const getError = (field, type = selectedType) =>
    errors[errorKey(field, type)] || "";
  const setFieldError = (field, message = "") => {
    setErrors((prev) => ({ ...prev, [errorKey(field)]: message }));
  };

  // When switching type, reset data & errors

  // useEffect(() => {
  //   if (selectedType) dispatch(getMasterList(selectedType));
  // }, [selectedType, dispatch]);


  useEffect(() => {
    if (!selectedType) return;

    if (selectedType === "Quotation Type") {
      dispatch(getMasterList("quotationtype"));
    } else if (selectedType === "Meter Type") {
      dispatch(getMasterList("metertype"));
    } else if (selectedType === "Help") {
      dispatch(getMasterList("help"));
    } else {
      dispatch(getMasterList(selectedType));
    }
  }, [selectedType, dispatch]);




  const handleTypeChange = (e) => {
    const value = e.target.value;
    setSelectedType(value);
    setSearchTerm("");
    setFormData({});
    setEditingItem(null);
    setCurrentPage(1);
    // Reset any previous validations (scoped keys)
    setErrors({});
    setShowHelp(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // clear field error when user types
    setFieldError(
      name,
      value && value.toString().trim()
        ? ""
        : getError(name)
          ? "This field is required"
          : "",
    );
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingItem(null);
    setFormData({});
    setErrors({});
    setShowModal(true);
  };

  // Date formatting
  const formatDateInput = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - userTimezoneOffset)
      .toISOString()
      .split("T")[0];

    return localISOTime;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // Validation
  const validateForm = () => {
    let newErrors = {};

    if (selectedType === "Currency") {
      if (!formData.currencyName?.trim()) {
        newErrors[errorKey("currencyName")] = "Currency  is required.";
      }

      if (!formData.description?.trim()) {
        newErrors[errorKey("description")] = "Description is required.";
      }

    }

    if (selectedType === "VAT") {
      if (!formData.taxPercentage && formData.taxPercentage !== 0) {
        newErrors[errorKey("taxPercentage")] = "Vat Percentage is required.";
      }

      if (!formData.description?.trim()) {
        newErrors[errorKey("description")] = "Description is required.";
      }

      if (!formData.status) {
        newErrors[errorKey("status")] = "Status is required.";
      }

    }

    if (selectedType === "Category") {
      if (!formData.categoryName?.trim()) {
        newErrors[errorKey("categoryName")] = "Category Name is required.";
      }

      if (modalMode === "edit") {
        if (!formData.status) {
          newErrors[errorKey("status")] = "Status is required.";
        }

      }
    }

      if (selectedType === "Help") {
        if (!formData.screenName?.trim()) {
          newErrors[errorKey("screenName")] =
            "Screen Name is required.";
        }

        if (!formData.description?.trim()) {
          newErrors[errorKey("description")] =
            "Description is required.";
        }

        // if (!formData.status) {
        //   newErrors[errorKey("status")] =
        //     "Status is required.";
        // }
      }

    if (selectedType === "Quotation Type") {
      if (!formData.quotationType?.trim()) {
        newErrors[errorKey("quotationType")] =
          "Quotation Type is required.";
      }

      if (modalMode === "edit") {
        if (!formData.status) {
          newErrors[errorKey("status")] = "Status is required.";
        }
      }
    }

    if (selectedType === "Meter Type") {
      if (!formData.meterType?.trim()) {
        newErrors[errorKey("meterType")] =
          "Meter Type is required.";
      }

      if (modalMode === "edit") {
        if (!formData.status) {
          newErrors[errorKey("status")] = "Status is required.";
        }
      }
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Duplicate check
  const validateDuplicates = () => {
    let duplicateError = false;

    if (selectedType === "Currency") {
      const exists = (tableData || []).some(
        (item) =>
          item.currencyName?.toLowerCase() ===
          formData.currencyName?.toLowerCase() &&
          (!editingItem || item.id !== editingItem.id),
      );
      if (exists) {
        alertify.alert("Duplicate Error", "Currency Name already exists!");
        duplicateError = true;
      }
    }

    if (selectedType === "VAT") {
      const exists = (tableData || []).some(
        (item) =>
          parseFloat(item.taxPercentage) ===
          parseFloat(formData.taxPercentage) &&
          (!editingItem || item.id !== editingItem.id),
      );
      if (exists) {
        alertify.alert("Duplicate Error", "Vat Percentage already exists!");
        duplicateError = true;
      }
    }

    if (selectedType === "Category") {
      const exists = (tableData || []).some(
        (item) =>
          item.name?.trim().toLowerCase() ===
          formData.categoryName?.trim().toLowerCase() &&
          (!editingItem || item.id !== editingItem.id),
      );

      if (exists) {
        alertify.alert("Duplicate Error", "Category already exists!");
        duplicateError = true;
      }
    }

    if (selectedType === "Quotation Type") {
      const exists = (tableData || []).some(
        (item) =>
          item.name?.trim().toLowerCase() ===
          formData.quotationType?.trim().toLowerCase() &&
          (!editingItem || item.id !== editingItem.id)
      );

      if (exists) {
        alertify.alert(
          "Duplicate Error",
          "Quotation Type already exists!"
        );
        duplicateError = true;
      }
    }

    if (selectedType === "Meter Type") {
      const exists = (tableData || []).some(
        (item) =>
          item.type?.trim().toLowerCase() ===
          formData.meterType?.trim().toLowerCase() &&
          (!editingItem || item.id !== editingItem.id)
      );

      if (exists) {
        alertify.alert("Duplicate Error", "Meter Type already exists!");
        duplicateError = true;
      }
    }

    return !duplicateError;
  };

  // CREATE
  const handleSubmit = (e) => {
    debugger
    e.preventDefault();

    if (!validateForm()) return;
    if (!validateDuplicates()) return;

    let payload = { EntityType: selectedType };

    if (selectedType === "Currency") {
      payload = {
        CurrencyName: formData.currencyName,
        Description: formData.description,
        Status: formData.status || "Y",
        EntityType: "Currency",
      };
    } else if (selectedType === "VAT") {
      payload = {
        TaxPercentage: parseFloat(formData.taxPercentage),
        StartDate: formData.startDate || formData.satrtDate || null,
        EndDate: formData.endDate || null,
        Description: formData.description,
        Status: formData.status || "Y",
        EntityType: "VAT",
      };
    } else if (selectedType === "Category") {
      payload = {
        CategoryName: formData.categoryName,
        Description: formData.description || "",
        Status: formData.status || "Y",
        EntityType: "Category",
      };

    } else if (selectedType === "Quotation Type") {
      payload = {
        EntityType: "QuotationType",
        Typename: formData.quotationType,
      };

    } else if (selectedType === "Help") {
      payload = {
        EntityType: "Help",
        ScreenName: formData.screenName,
        Description: formData.description,
        Status: "Active",
      };

    } else if (selectedType === "Meter Type") {
      payload = {
        EntityType: "MeterType",
        Typename: formData.meterType,
      };
      console.log("Meter Type Payload:", payload);
    }

    setCreateLoading(true);

    dispatch(createmaster(payload))
      .unwrap()
      .then((res) => {
        alertify.alert("Success", `${selectedType} saved successfully!`, () => {
          dispatch(
            getMasterList(
              selectedType === "Quotation Type"
                ? "quotationtype"
                : selectedType === "Meter Type"
                  ? "metertype"
                  : selectedType
            )
          );

          setFormData({});
          setErrors({});
          setEditingItem(null);

          setShowModal(false); // Popup close
          setModalMode(null); // Reset mode
        });
      })
      // .catch((err) => {
      //   console.error("Error saving record:", err);
      //   alertify.alert(
      //     "Error",
      //     err || `Failed to save ${selectedType} record.`,
      //   );
      // })
      .catch((err) => {
        console.error("Meter Type Save Error:", err);

        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          err ||
          `Failed to save ${selectedType} record.`;

        alertify.alert("Error", errorMessage);
      })
      .finally(() => {
        setCreateLoading(false);
      });
  };

  // EDIT
  const handleEdit = (item) => {
    setModalMode("edit");
    setEditingItem(item);
    setShowModal(true);

    let mappedData = {};
    if (selectedType === "Currency") {
      mappedData = {
        currencyName: item.currencyName || "",
        description: item.description || "",
        status: item.status,

      };
    } else if (selectedType === "VAT") {
      mappedData = {
        taxPercentage: item.vatPercentage || "",
        satrtDate: formatDateInput(item.satrtDate || item.startDate),
        endDate: formatDateInput(item.endDate),
        description: item.description || "",
        status: item.status,

      };
    } else if (selectedType === "Category") {
      mappedData = {
        categoryName: item.name || "",
        description: item.description || "",
        status: item.status,

      };

    } else if (selectedType === "Quotation Type") {
      mappedData = {
        quotationType: item.name || "",
        status: item.status || "",
      };

    } else if (selectedType === "Meter Type") {
      mappedData = {
        meterType: item.type || "",
        status: item.status || "",
      };
    } else if (selectedType === "Help") {
      mappedData = {
        screenName: item.screenName || "",
        description: item.description || "",
        status: item.status || "",
      };
    }


    setFormData(mappedData);
    setOriginalData(mappedData);

    // Clear only fields for this type
    if (selectedType === "Currency") {
      setErrors((prev) => ({
        ...prev,
        [errorKey("currencyName")]: "",
        [errorKey("description")]: "",
      }));
    } else if (selectedType === "VAT") {
      setErrors((prev) => ({
        ...prev,
        [errorKey("taxPercentage")]: "",
        [errorKey("satrtDate")]: "",
        [errorKey("description")]: "",
      }));
    }
  };

  const getApiEntityType = () => {
    if (selectedType === "Quotation Type") {
      return "QuotationType";
    }
    if (selectedType === "Meter Type") {
      return "MeterType";
    }

    return selectedType;
  };

  // UPDATE
  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedType || !editingItem) return;

    if (JSON.stringify(originalData) === JSON.stringify(formData)) {
      alertify.alert("Warning", "No changes found.");
      return;
    }
    if (!validateForm()) return;
    if (!validateDuplicates()) return;

    // let payload = { EntityType: selectedType, Id: editingItem.id };

    let payload = {
      EntityType: getApiEntityType(),
      Id: editingItem.id,
    };

    if (selectedType === "Currency") {
      payload.CurrencyName = formData.currencyName;
      payload.Description = formData.description;
      payload.Status = formData.status;
    } else if (selectedType === "VAT") {
      payload.TaxPercentage = parseFloat(formData.taxPercentage);
      payload.StartDate = formData.startDate || formData.satrtDate || null;
      payload.EndDate = formData.endDate || null;
      payload.Description = formData.description;
      payload.Status = formData.status;
    } else if (selectedType === "Category") {
      payload.CategoryName = formData.categoryName;
      payload.Description = formData.description;
      payload.Status = formData.status;
    } else if (selectedType === "Quotation Type") {
      payload.QuotationType = formData.quotationType;
      payload.Status = formData.status;
    } else if (selectedType === "Meter Type") {
      payload.MeterType = formData.meterType;
      payload.Status = formData.status;
    } else if (selectedType === "Help") {
      payload.ScreenName = formData.screenName;
      payload.Description = formData.description;
      payload.Status = formData.status;
    }


    setUpdateLoading(true);
    dispatch(updatemaster(payload))
      .unwrap()
      .then((res) => {
        debugger;
        if (res?.message?.toLowerCase().includes("no changes")) {
          alertify.alert("warning", res?.message);
        } else {
          alertify.alert("Update", res?.message);
        }

        dispatch(
          getMasterList(
            selectedType === "Quotation Type"
              ? "quotationtype"
              : selectedType === "Meter Type"
                ? "metertype"
                : selectedType
          )
        );
        setFormData({});
        setEditingItem(null);
        setShowModal(false);
        setModalMode(null); // add this
        setErrors({});
      })
      .catch((err) => {
        alertify.alert("Error", err);
        console.error(err);
      })
      .finally(() => setUpdateLoading(false));
  };

  const handleInitiateDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  // DELETE (Soft delete)
  const handleExecuteDelete = (item) => {
    debugger;
    alertify.confirm(
      "Delete Confirmation",
      `Are you sure you want to delete this ${selectedType}?`,
      () => {
        const payload = {
          EntityType: selectedType === "Meter Type" ? "MeterType" : selectedType,
          Id: item.id,
          // IsDeleted: "Yes",
          // IsActive: "No",
          // Description: item.description,
        };

        // if (selectedType === "Currency") {
        //   payload.CurrencyName = item.currencyName;
        // } else if (selectedType === "VAT") {
        //   payload.TaxPercentage = item.taxPercentage;
        //   payload.SatrtDate = item.satrtDate;
        //   payload.EndDate = item.endDate;
        // }

        dispatch(deletemaster(payload))
          .unwrap()
          .then((res) => {
            if (res?.message?.toLowerCase().includes("no changes")) {
              alertify.alert("warning", res?.message);
            } else {
              alertify.alert("Update", res?.message);
            }
            alertify.alert("Deleted", " Deleted successfully");
            dispatch(getMasterList(selectedType === "Meter Type" ? "metertype" : selectedType));
          })
          .catch((err) => {
            alertify.alert("error", err);
          })
          .finally(() => {
            setIsDeleteOpen(false);
            setItemToDelete(null);
          });
      },
      () => {
        alertify.alert("Cancelled", "Delete cancelled");
      },
    );
  };

  // const getColSpan = () => {
  //   if (selectedType === "Currency") return 5;
  //   if (selectedType === "VAT") return 5;
  //   if (selectedType === "Category") return 4;
  //   return 1;
  // };

  const getColSpan = () => {
    if (selectedType === "Currency") return 4;
    if (selectedType === "VAT") return 4;
    if (selectedType === "Category") return 3;
    if (selectedType === "Quotation Type") return 3;
    if (selectedType === "Meter Type") return 3;
    if (selectedType === "Help") return 4;
    return 1;
  };

  return (
    <div className="master-container">
      <div className="list-header">
        <h2 className="master-title">Master Screen</h2>

        <HoloButton
          variant="secondary"
          size="md"
          onClick={() => {
            if (!selectedType) {
              alertify.alert(
                "Help",
                "Please select a screen type (Category,VAT or Quotation Type,MeterType,Help) first.",
              );
              return;
            }
            setShowHelp(true);
          }}
        >
          <i className="fas fa-question-circle"></i> Help
        </HoloButton>
      </div>
      <div className="masterfilters-row">
        <div className="master-filter">
          <label className="filter-label">Select Type</label>
          <select
            value={selectedType}
            onChange={handleTypeChange}
            className="filter-select"
          >
            <option value="">Make Selection</option>
            {/* <option value="Currency">Currency</option> */}
            <option value="Category">Category</option>
            <option value="VAT">VAT</option>
            <option value="Quotation Type">Quotation Type</option>
            <option value="Meter Type">Meter Type</option>
            <option value="Help">Help</option>

          </select>
        </div>
      </div>

      {showHelp && selectedType && (
        <HelpModal
          show={showHelp}
          title={`${selectedType === "VAT" ? "VAT" : selectedType} - Help & Overview`}
          screenName={selectedType}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* TABLE */}
      {selectedType && (
        <div className="master-table-container">
          <div className="table-toolbar">

            {/* Search - Top Row */}
            <div className="master-search-row" style={{ marginBottom: 10 }}>
              <div className="master-search-box">
                <FaSearch className="master-search-icon" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search"
                  className="master-search-input"
                />
              </div>
            </div>

            {/* Records Per Page + Add New - Bottom Row */}
            <div
              className="master-toolbar-bottom"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}
            >

              <div className="records-per-page" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label>Records per page:</label>

                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  {[2, 5, 10, 25].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ transform: 'translateY(-6px)' }}>
                {selectedType && selectedType !== "VAT" && (
                  <HoloButton
                    variant="primary"
                    size="md"
                    onClick={openCreateModal}
                  >
                    + Add New
                  </HoloButton>
                )}
              </div>

            </div>

          </div>
          <table className="data-table">
            <thead>
              <tr>
                {selectedType === "Currency" && (
                  <>
                    <th onClick={() => requestSort("currencyName")}>
                      CURRENCY{" "}
                      {sortConfig.key === "currencyName"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↑"}
                    </th>
                    {/* <th>CURRENCY NAME</th> */}
                    <th>DESCRIPTION</th>
                    {/* <th>CREATED DATE</th>
                    <th>MODIFIED DATE</th> */}
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </>
                )}
                {selectedType === "Category" && (
                  <>
                    <th onClick={() => requestSort("name")}>
                      CATEGORY NAME{" "}
                      {sortConfig.key === "name"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↑"}
                    </th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </>
                )}
                {selectedType === "VAT" && (
                  <>
                    <th onClick={() => requestSort("taxPercentage")}>
                      VAT %{" "}
                      {sortConfig.key === "taxPercentage"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↑"}
                    </th>
                    {/* <th>TAX %</th> */}
                    <th>DESCRIPTION</th>
                    {/* <th>START DATE</th>
                    <th>END DATE</th> */}
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </>
                )}

                {selectedType === "Quotation Type" && (
                  <>
                    <th onClick={() => requestSort("name")}>
                      QUOTATION TYPE{" "}
                      {sortConfig.key === "name"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↑"}
                    </th>

                    <th>STATUS</th>
                    <th>ACTION</th>
                  </>
                )}
                {selectedType === "Meter Type" && (
                  <>
                    <th onClick={() => requestSort("name")}>
                      METER TYPE{" "}
                      {sortConfig.key === "name"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↑"}
                    </th>

                    <th>STATUS</th>
                    <th>ACTION</th>
                  </>
                )}

                {selectedType === "Help" && (
                  <>
                    <th>SCREEN NAME</th>
                    <th>DESCRIPTION</th>
                    {/* <th>STATUS</th> */}
                    <th>ACTION</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={getColSpan()}
                    style={{ textAlign: "center" }}
                  >
                    <div className="loader"></div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={getColSpan()} style={{ textAlign: "center" }}>
                    No records found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={index}>
                    {selectedType === "Currency" && (
                      <>
                        <td>{item.currencyName}</td>
                        <td>{item.description}</td>
                        {/* <td>{formatDateDisplay(item.createdDate)}</td>
                        <td>{formatDateDisplay(item.modifiedDate)}</td> */}
                        <td>{item.status}</td>

                        <td className="actions-cell">
                          <div className="action-master">
                            <FaEdit
                              style={{ cursor: "pointer" }}
                              className="action-icon edit-icon"
                              title="Edit"
                              onClick={() => handleEdit(item)}
                            />

                            {/* {item.isDeleted !== "Yes" && (
                              <button
                                className="action-icon cancel-icon"
                                title="Delete"
                                onClick={() => handleInitiateDelete(item)}
                              >
                                <FaTrash />
                              </button>
                            )} */}
                          </div>
                        </td>
                      </>
                    )}
                    {selectedType === "VAT" && (
                      <>
                        <td style={{ width: "6%", textAlign: "right" }}>
                          {item.vatPercentage}
                        </td>
                        <td>{item.description}</td>
                        {/* <td>{formatDateDisplay(item.satrtDate)}</td>
                        <td>{formatDateDisplay(item.endDate)}</td> */}
                        <td>{item.status}</td>


                        <td className="actions-cell">
                          <div className="action-master">
                            <button
                              className="action-icon edit-icon"
                              onClick={() => handleEdit(item)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {/* {item.isDeleted === "No" && (
                              <button
                                className="action-icon cancel-icon"
                                onClick={() => handleInitiateDelete(item)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )} */}
                          </div>
                        </td>
                      </>
                    )}
                    {selectedType === "Category" && (
                      <>
                        <td>{item.name}</td>
                        <td>{item.status}</td>

                        <td className="actions-cell">
                          <div className="action-master">
                            <FaEdit
                              style={{ cursor: "pointer" }}
                              className="action-icon edit-icon"
                              title="Edit"
                              onClick={() => handleEdit(item)}
                            />

                            {/* {item.isDeleted !== "Yes" && (
                              <button
                                className="action-icon cancel-icon"
                                title="Delete"
                                onClick={() => handleInitiateDelete(item)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )} */}
                          </div>
                        </td>
                      </>
                    )}
                    {selectedType === "Quotation Type" && (
                      <>
                        <td>{item.name}</td>
                        <td>{item.status}</td>

                        <td className="actions-cell">
                          <div className="action-master">
                            <FaEdit
                              style={{ cursor: "pointer" }}
                              className="action-icon edit-icon"
                              title="Edit"
                              onClick={() => handleEdit(item)}
                            />
                          </div>
                        </td>
                      </>
                    )}
                    {selectedType === "Meter Type" && (
                      <>
                        <td>{item.type}</td>
                        <td>{item.status}</td>

                        <td className="actions-cell">
                          <div className="action-master">
                            <FaEdit
                              style={{ cursor: "pointer" }}
                              className="action-icon edit-icon"
                              title="Edit"
                              onClick={() => handleEdit(item)}
                            />
                          </div>
                        </td>
                      </>
                    )}

                    {selectedType === "Help" && (
                      <>
                        <td>{item.screenName}</td>
                        <td>{item.description}</td>
                        {/* <td>{item.status}</td> */}

                        <td className="actions-cell">
                          <div className="action-master">
                            <FaEdit
                              style={{ cursor: "pointer" }}
                              className="action-icon edit-icon"
                              title="Edit"
                              onClick={() => handleEdit(item)}
                            />
                          </div>
                        </td>
                      </>
                    )}

                  </tr>
                ))
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
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleExecuteDelete(itemToDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL */}
      {showModal && (
        <div className="mastermodal-overlay">
          <div className="mastermodal-content" style={{ width: "40%" }}>
            <div
              className="modal-close-btn"
              onClick={() => {
                setShowModal(false);
                setEditingItem(null);
                setFormData({});
                setErrors({});
              }}
            >
              &times;
            </div>
            <h3>
              {modalMode === "create"
                ? `Add ${selectedType}`
                : `Edit ${selectedType}`}
            </h3>

            <form
              onSubmit={modalMode === "create" ? handleSubmit : handleUpdate}
            >
              {selectedType === "Currency" && (
                <>
                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Currency Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="currencyName"
                        value={formData.currencyName || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const regex = /^[A-Za-z\s]*$/;
                          if (regex.test(value)) {
                            setFormData({ ...formData, currencyName: value });
                            setErrors((prev) => ({
                              ...prev,
                              [errorKey("currencyName")]: value.trim()
                                ? ""
                                : "Currency is required",
                            }));
                          }
                        }}
                        className={
                          getError("currencyName") ? "error-input" : ""
                        }
                      />
                      {getError("currencyName") && (
                        <p className="error-message">
                          {getError("currencyName")}
                        </p>
                      )}
                    </div>

                    <div className="typeform-group">
                      <label>
                        Description <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, description: value });
                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("description")]: value.trim()
                              ? ""
                              : "Description is required",
                          }));
                        }}
                        className={getError("description") ? "error-input" : ""}
                      />
                      {getError("description") && (
                        <p className="error-message">
                          {getError("description")}
                        </p>
                      )}
                    </div>
                  </div>
                  {modalMode === "edit" && (
                    <div className="typeform-row">
                      <div className="typeform-group">
                        <label>
                          Status <span className="required">*</span>
                        </label>
                        <select
                          name="status"
                          value={formData.status || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, status: value });
                            setFieldError(
                              "status",
                              value ? "" : "Status is required",
                            );
                          }}
                          className={getError("status") ? "input-error" : ""}
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                        {getError("status") && (
                          <p className="error-message">
                            {getError("status")}
                          </p>
                        )}
                      </div>
                      {/* 
                      <div className="typeform-group">
                        <label>
                          Is Deleted <span className="required">*</span>
                        </label>
                        <select
                          name="isDeleted"
                          value={formData.isDeleted || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, isDeleted: value });
                            setFieldError(
                              "isDeleted",
                              value ? "" : "Is Deleted is required",
                            );
                          }}
                          className={getError("isDeleted") ? "input-error" : ""}
                        >
                          <option value="">Select Is Deleted</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                        {getError("isDeleted") && (
                          <p className="error-message">
                            {getError("isDeleted")}
                          </p>
                        )}
                      </div> */}
                    </div>
                  )}
                </>
              )}

              {selectedType === "VAT" && (
                <>
                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        VAT Percentage(%) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="taxPercentage"
                        value={formData.taxPercentage || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const regex = /^(?:\d{1,2}(?:\.\d{0,2})?)?$/;
                          if (value === "" || regex.test(value)) {
                            setFormData({ ...formData, taxPercentage: value });
                            setErrors((prev) => ({
                              ...prev,
                              [errorKey("taxPercentage")]: value.trim()
                                ? ""
                                : "Vat Percentage is required",
                            }));
                          }
                        }}
                        className={
                          getError("taxPercentage") ? "error-input" : ""
                        }
                        placeholder="Enter tax percentage"
                      />
                      {getError("taxPercentage") && (
                        <p className="error-message">
                          {getError("taxPercentage")}
                        </p>
                      )}
                    </div>

                    <div className="typeform-group">
                      <label>
                        Description<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, description: value });
                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("description")]: value.trim()
                              ? ""
                              : "Description is required",
                          }));
                        }}
                        className={getError("description") ? "error-input" : ""}
                      />
                      {getError("description") && (
                        <p className="error-message">
                          {getError("description")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Status <span className="required">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, status: value });
                          setFieldError(
                            "status",
                            value ? "" : "Status is required",
                          );
                        }}
                        className={getError("status") ? "input-error" : ""}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      {getError("status") && (
                        <p className="error-message">{getError("status")}</p>
                      )}

                      {getError.status && (
                        <p className="error-message">{getError.status}</p>
                      )}
                    </div>



                  </div>
                </>
              )}

              {selectedType === "Category" && (
                <>
                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Category Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="categoryName"
                        value={formData.categoryName || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, categoryName: value });
                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("categoryName")]: value.trim()
                              ? ""
                              : "Category Name is required",
                          }));
                        }}
                        className={
                          getError("categoryName") ? "error-input" : ""
                        }
                      />
                      {getError("categoryName") && (
                        <p className="error-message">
                          {getError("categoryName")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Show only in Edit Mode */}
                  {modalMode === "edit" && (
                    <div className="typeform-row">
                      <div className="typeform-group">
                        <label>
                          Status <span className="required">*</span>
                        </label>
                        <select
                          name="status"
                          value={formData.status || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, status: value });
                            setFieldError(
                              "status",
                              value ? "" : "Status is required",
                            );
                          }}
                          className={getError("status") ? "input-error" : ""}
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                        {getError("status") && (
                          <p className="error-message">
                            {getError("status")}
                          </p>
                        )}
                      </div>


                    </div>
                  )}
                </>
              )}


              {selectedType === "Quotation Type" && (
                <>
                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Quotation Type <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        name="quotationType"
                        value={formData.quotationType || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((prev) => ({
                            ...prev,
                            quotationType: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("quotationType")]: value.trim()
                              ? ""
                              : "Quotation Type is required",
                          }));
                        }}
                        className={
                          getError("quotationType") ? "error-input" : ""
                        }
                        placeholder="Enter quotation type"
                      />

                      {getError("quotationType") && (
                        <p className="error-message">
                          {getError("quotationType")}
                        </p>
                      )}
                    </div>
                  </div>

                  {modalMode === "edit" && (
                    <div className="typeform-row">
                      <div className="typeform-group">
                        <label>
                          Status <span className="required">*</span>
                        </label>

                        <select
                          name="status"
                          value={formData.status || ""}
                          onChange={(e) => {
                            const value = e.target.value;

                            setFormData((prev) => ({
                              ...prev,
                              status: value,
                            }));

                            setFieldError(
                              "status",
                              value ? "" : "Status is required"
                            );
                          }}
                          className={
                            getError("status") ? "input-error" : ""
                          }
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>

                        {getError("status") && (
                          <p className="error-message">
                            {getError("status")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedType === "Meter Type" && (
                <>
                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Meter Type <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        name="meterType"
                        value={formData.meterType || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((prev) => ({
                            ...prev,
                            meterType: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("meterType")]: value.trim()
                              ? ""
                              : "Meter Type is required",
                          }));
                        }}
                        className={
                          getError("meterType") ? "error-input" : ""
                        }
                        placeholder="Enter meter type"
                      />

                      {getError("meterType") && (
                        <p className="error-message">
                          {getError("meterType")}
                        </p>
                      )}
                    </div>
                  </div>

                  {modalMode === "edit" && (
                    <div className="typeform-row">
                      <div className="typeform-group">
                        <label>
                          Status <span className="required">*</span>
                        </label>

                        <select
                          name="status"
                          value={formData.status || ""}
                          onChange={(e) => {
                            const value = e.target.value;

                            setFormData((prev) => ({
                              ...prev,
                              status: value,
                            }));

                            setFieldError(
                              "status",
                              value ? "" : "Status is required"
                            );
                          }}
                          className={
                            getError("status") ? "input-error" : ""
                          }
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>

                        {getError("status") && (
                          <p className="error-message">
                            {getError("status")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedType === "Help" && (
                <>
                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>Screen Name</label>
                      <input
                        type="text"
                        name="screenName"
                        value={formData.screenName || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((prev) => ({
                            ...prev,
                            screenName: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("screenName")]: value.trim()
                              ? ""
                              : "Screen Name is required",
                          }));
                        }}
                        className={
                          getError("screenName") ? "error-input" : ""
                        }
                        placeholder="Enter screen name"
                      />

                      {getError("screenName") && (
                        <p className="error-message">
                          {getError("screenName")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Description <span className="required">*</span>
                      </label>

                      <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((prev) => ({
                            ...prev,
                            description: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            [errorKey("description")]: value.trim()
                              ? ""
                              : "Description is required",
                          }));
                        }}
                        className={
                          getError("description") ? "error-input" : ""
                        }
                        rows="6"
                        placeholder="Enter help description"
                      />

                      {getError("description") && (
                        <p className="error-message">
                          {getError("description")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* <div className="typeform-row">
                    <div className="typeform-group">
                      <label>
                        Status <span className="required">*</span>
                      </label>

                      <select
                        name="status"
                        value={formData.status || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((prev) => ({
                            ...prev,
                            status: value,
                          }));

                          setFieldError(
                            "status",
                            value ? "" : "Status is required"
                          );
                        }}
                        className={
                          getError("status") ? "input-error" : ""
                        }
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>

                      {getError("status") && (
                        <p className="error-message">
                          {getError("status")}
                        </p>
                      )}
                    </div>
                  </div> */}
                </>
              )}

              <div className="master-buttons">
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  disabled={
                    modalMode === "create" ? createLoading : updateLoading
                  }
                >
                  {(modalMode === "create" ? createLoading : updateLoading) && (
                    <span className="spinner"></span>
                  )}
                  {modalMode === "create" ? " Save" : " Update"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-lg"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({});
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
