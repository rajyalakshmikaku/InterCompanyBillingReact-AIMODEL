import React, { useState, useEffect } from "react";
import { AxiosInstance, baseURL } from "../../services/api";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import "./ReceivingEntities.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompaniesList, createReceivingEntity, resetEntityState, FetchupdateReceivingEntity, FetchdeleteEntity } from '../../redux/receivingEntitiesSlice';
import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";
import Pagination from "../../components/Common/Pagination";
import { FaEdit, FaTrash } from "react-icons/fa";
import HoloButton from "../../components/Common/HoloButton";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../../components/ui';

const ReceivingEntities = () => {
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { error, success } = useSelector((state) => state.receivingEntities);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [originalEditItem, setOriginalEditItem] = useState(null);
  const [recordsPerPage, setRecordsPerPage] = useState(5); // default page size
  const [currentPage, setCurrentPage] = useState(1);
  const companyList = useSelector((state) => state.Customers.companies);


  const [newItem, setNewItem] = useState({
    CompanyName: "",
    VatNumber: "",
    RegistrationNumber: "",
    CompanyAddress: "",
    CompanyWebsite: "",
    CompanyEmail: "",
    CompanyPhoneNumber: "",
    CompanyLogo: null,
    BankAccountNumber: "",
    BranchCode: "",
    BranchAddress: "",
    IFSCCode: "",
    AccountHolderName: "",
    BankName: "",
  });



  // Loaders
  // const [loading, setLoading] = useState(true); // for list fetch
  const [createLoading, setCreateLoading] = useState(false); // for create button
  const [updateLoading, setUpdateLoading] = useState(false); // for update button

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDeleteId, setCompanyToDeleteId] = useState(null);


  const { companies, loading } = useSelector(
    (state) => state.receivingEntities
  );

  useEffect(() => {
    dispatch(fetchCompaniesList());
  }, [dispatch]);

  useEffect(() => {
    setItems(companies);
  }, [companies]);
  const [deletedId, setDeletedId] = useState(null);


  const resetForm = () => {
    setNewItem({
      CompanyName: "",
      VatNumber: "",
      RegistrationNumber: "",
      CompanyAddress: "",
      CompanyWebsite: "",
      CompanyEmail: "",
      CompanyPhoneNumber: "",
      CompanyLogo: null,
      bankAccountNumber: "",
      branchCode: "",
      branchAddress: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: "",
    });
    setErrors({});
  };

  const handleFieldChange = (field, value) => {
    setNewItem({ ...newItem, [field]: value });

    // Clear the error for this field when typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setCreateLoading(true); // 🔹 Start loader

    const validationErrors = {};

    // ✅ Safe access with optional chaining
    // Company Name validation


    if (!(newItem.CompanyName?.trim())) validationErrors.CompanyName = "Company Name  is required";
    // Account Holder Name validation

    if (!(newItem.AccountHolderName?.trim())) validationErrors.AccountHolderName = "Account Holder Name is required";
    if (!(newItem.VatNumber?.trim())) validationErrors.VatNumber = "VAT Number is required";
    if (!(newItem.RegistrationNumber?.trim())) validationErrors.RegistrationNumber = "Registration Number is required";
    if (!(newItem.CompanyAddress?.trim())) validationErrors.CompanyAddress = "Company Address is required";
    // if (!(newItem.CompanyWebsite?.trim())) validationErrors.CompanyWebsite = "Company Website is required";
    if (!(newItem.CompanyEmail?.trim())) validationErrors.CompanyEmail = "Company Email is required";
    if (!(newItem.CompanyPhoneNumber?.trim())) validationErrors.CompanyPhoneNumber = "Phone Number is required";
    if (!(newItem.BankAccountNumber?.trim())) validationErrors.BankAccountNumber = "Account Number is required";
    // Branch Code

    if (!(newItem.BranchCode?.trim())) validationErrors.BranchCode = "Branch Code is required";
    if (!(newItem.BranchAddress?.trim())) validationErrors.BranchAddress = "Branch Address is required";

    if (!(newItem.BankName?.trim())) validationErrors.BankName = "Bank Name is required";
    //if (!(newItem.IFSCCode?.trim())) validationErrors.IFSCCode = "IFSC Code is required";


    // ✅ Email validation
    if (newItem.CompanyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newItem.CompanyEmail)) {
      validationErrors.CompanyEmail = "Invalid email format";
    }

    // ✅ Phone number validation
    if (
      newItem.CompanyPhoneNumber &&
      !/^\d{10}$/.test(newItem.CompanyPhoneNumber)
    ) {
      validationErrors.CompanyPhoneNumber = "Phone number must be exactly 10 digits";
    }

    // ✅ IFSC validation
    // if (newItem.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(newItem.ifscCode)) {
    //   validationErrors.ifscCode = "Invalid IFSC code format";
    // }

    // ✅ VAT and Registration basic alphanumeric check
    // if (newItem.VatNumber && !/^[A-Za-z0-9-]+$/.test(newItem.VatNumber)) {
    //   validationErrors.VatNumber = "Invalid VAT format";
    // }

    // if (newItem.RegistrationNumber && !/^[A-Za-z0-9-]+$/.test(newItem.RegistrationNumber)) {
    //   validationErrors.RegistrationNumber = "Invalid Registration Number format";
    // }
    if (newItem.VatNumber && !/^[0-9/]+$/.test(newItem.VatNumber)) {
      validationErrors.VatNumber = "Invalid VAT format";
    }

    if (
      newItem.RegistrationNumber &&
      !/^[0-9/]+$/.test(newItem.RegistrationNumber)
    ) {
      validationErrors.RegistrationNumber = "Invalid Registration Number format";
    }

    // ✅ Website validation
    // if (newItem.CompanyWebsite && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(newItem.CompanyWebsite)) {
    //   validationErrors.CompanyWebsite = "Invalid website URL";
    // }

    // ✅ File validation
    console.log("Logo file object:", newItem.CompanyLogo);

    // if (!newItem.CompanyLogo) {
    //   validationErrors.CompanyLogo = "Company Logo is required";
    // }
    // else {
    //   const fileName = newItem.CompanyLogo.name?.toLowerCase() || "";
    //   const validExtensions = [".png", ".jpg", ".jpeg"];
    //   const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    //   if (!isValid) {
    //     validationErrors.CompanyLogo = "Only JPG or PNG files are allowed";
    //   }
    // }




    setErrors(validationErrors);
    debugger;
    // Stop execution if validation fails
    if (Object.keys(validationErrors).length > 0) {
      alertify.alert('Warning', "Please enter all mandatory fields.");
      setCreateLoading(false);
      return;
    }



    try {
      const resultAction = await dispatch(createReceivingEntity(newItem));
      debugger
      if (createReceivingEntity.fulfilled.match(resultAction)) {
        // Action succeeded
        const message = resultAction.payload?.message || "Operation succeeded";

        alertify.alert('Success', message);  // show success message
        setShowCreateScreen(false);          // hide the create form
        dispatch(fetchCompaniesList());      // refresh the list
        resetForm();                          // reset form fields
        dispatch(resetEntityState());         // clear any temporary Redux state
      } else {
        // Action failed
        const errorMessage = resultAction.payload?.message || resultAction.error?.message || "Failed to save customer";
        alertify.alert('Error', errorMessage);
      }

    } catch (err) {
      alertify.alert("Error", err);
    } finally {
      setCreateLoading(false); // 🔹 Stop loader
    }
  };



  // Edit Entity state
  const [editItem, setEditItem] = useState(null);



  useEffect(() => {
    if (editItem && editItem.id) {
      setOriginalEditItem({
        companyName: editItem.companyName ?? "",
        vatNumber: editItem.vatNumber ?? "",
        registrationNumber: editItem.registrationNumber ?? "",
        companyWebsite: editItem.companyWebsite ?? "",
        companyEmail: editItem.companyEmail ?? "",
        companyPhoneNumber: editItem.companyPhoneNumber ?? "",
        companyAddress: editItem.companyAddress ?? "",
        companyLogo: editItem.companyLogo ?? null,
        bankAccountNumber: editItem.bankAccountNumber ?? "",
        branchCode: editItem.branchCode ?? "",
        branchAddress: editItem.branchAddress ?? "",
        ifscCode: editItem.ifscCode ?? "",
        accountHolderName: editItem.accountHolderName ?? "",
        status
          : editItem.status
          ?? "",
        bankName: editItem.bankName ?? ""
      });
    }
  }, [editItem]);

  const handleEditItem = async (e) => {
    debugger
    e.preventDefault();

    const validationEditerrors = {};

    // Basic required field checks



    if (!editItem.accountHolderName?.trim()) validationEditerrors.accountHolderName = "Account Holder Name is required";
    if (!editItem.companyName?.trim()) validationEditerrors.companyName = "Company Name is required";

    if (!editItem.vatNumber?.trim()) validationEditerrors.vatNumber = "VAT Number is required";
    if (!editItem.registrationNumber?.trim()) validationEditerrors.registrationNumber = "Registration Number is required";
    if (!editItem.companyEmail?.trim()) validationEditerrors.companyEmail = "Billing Email is required";
    if (!editItem.bankAccountNumber?.trim()) validationEditerrors.bankAccountNumber = "Account Number is required";
    if (!editItem.branchAddress?.trim()) validationEditerrors.branchAddress = "Branch Address is required";
    //if (!editItem.ifscCode?.trim()) validationEditerrors.ifscCode = "IFSC Code is required";
    if (!editItem.companyAddress?.trim()) validationEditerrors.companyAddress = "Company Address is required";
    // if (!editItem.companyWebsite?.trim()) validationEditerrors.companyWebsite = "Company Website is required";
    //if (!editItem.accountHolderName?.trim()) validationEditerrors.accountHolderName = "Account holder name is required";
    // Bank Name
    if (!editItem.bankName?.trim()) validationEditerrors.bankName = "Bank Name is required";
    if (!editItem.branchCode?.trim()) validationEditerrors.branchCode = "Branch Code is required";


    // Email validation (fixed: use companyEmail key, not CompanyEmail)
    if (editItem.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editItem.companyEmail)) {
      validationEditerrors.companyEmail = "Invalid email format";
    }

    // Phone number validation (ensure present and 10 digits)
    if (!editItem.companyPhoneNumber) {
      validationEditerrors.companyPhoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(editItem.companyPhoneNumber)) {
      validationEditerrors.companyPhoneNumber = "";
    }

    // VAT & registration format checks
    // if (editItem.vatNumber && !/^[A-Za-z0-9-]+$/.test(editItem.vatNumber)) {
    //   validationEditerrors.vatNumber = "Invalid VAT format";
    // }
    // if (editItem.registrationNumber && !/^[A-Za-z0-9-]+$/.test(editItem.registrationNumber)) {
    //   validationEditerrors.registrationNumber = "Invalid Registration Number format";
    // }
    if (editItem.VatNumber && !/^[0-9/]+$/.test(editItem.VatNumber)) {
      validationEditerrors.VatNumber = "Invalid VAT format";
    }

    if (
      editItem.RegistrationNumber &&
      !/^[0-9/]+$/.test(editItem.RegistrationNumber)
    ) {
      validationEditerrors.RegistrationNumber = "Invalid Registration Number format";
    }

    // Company website basic format validation (same regex as input)
    // if (editItem.companyWebsite && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(editItem.companyWebsite)) {
    //   validationEditerrors.companyWebsite = "Invalid website format";
    // }

    // Set validation errors state
    setErrors(validationEditerrors);

    // If any validation errors -> stop
    if (Object.keys(validationEditerrors).length > 0) {
      alertify.alert('Warning', "Please enter all mandatory fields.");
      return;
    }

    setUpdateLoading(true);

    const payload = {
      id: editItem.id,
      companyName: editItem.companyName,
      vatNumber: editItem.vatNumber,
      registrationNumber: editItem.registrationNumber,
      companyWebsite: editItem.companyWebsite,
      companyEmail: editItem.companyEmail,
      companyPhoneNumber: editItem.companyPhoneNumber,
      companyAddress: editItem.companyAddress,
      companyLogo: editItem.companyLogo,
      bankAccountNumber: editItem.bankAccountNumber,
      branchCode: editItem.branchCode,
      branchAddress: editItem.branchAddress,
      ifscCode: editItem.ifscCode,
      accountHolderName: editItem.accountHolderName,
      bankName: editItem.bankName,
      Status: editItem.status,
    };
    console.log("Company data", payload);
    try {
      const resultAction = await dispatch(FetchupdateReceivingEntity({
        id: editItem.id,
        payload
      }));

      if (FetchupdateReceivingEntity.fulfilled.match(resultAction)) {
        // Action succeeded
        const message = resultAction.payload?.message || "Company updated successfully";

        alertify.alert('Success', message);
        setShowEditScreen(false);
        setUpdateLoading(false);
        dispatch(fetchCompaniesList());
      } else {
        // Action failed
        const errorMessage = resultAction.payload?.message || resultAction.error?.message || "Failed to update company";
        alertify.alert('Error', errorMessage);
        setUpdateLoading(false);
      }

    } catch (error) {
      // Handle unexpected errors
      alertify.alert('Error', error.message || "Something went wrong while updating the company");
      setUpdateLoading(false);
    }
  };

  // When the user clicks the Delete
  const handleTriggerDelete = (id) => {
    setCompanyToDeleteId(id);
    setShowDeleteModal(true);
  };

  // When the user clicks Delete/Yes 
  const handleConfirmDelete = async () => {
    if (!companyToDeleteId) return;

    try {
      const result = await dispatch(
        FetchdeleteEntity(companyToDeleteId)
      ).unwrap();

      alertify.alert(
        "Success",
        result.message || "Company deleted successfully."
      );

      dispatch(fetchCompaniesList());
    } catch (error) {
      alertify.alert("Error", error || "Failed to delete company.");
    } finally {
      setCompanyToDeleteId(null);
      setShowDeleteModal(false);
    }
  };

  // Triggered if they click Cancel 
  const handleCancelDelete = () => {
    setCompanyToDeleteId(null);
    setShowDeleteModal(false);
  };


  // Filters
  const [filters, setFilters] = useState({
    companyName: "",
    bankAccountNumber: "",
    registrationNumber: "",
    companyEmail: "",
    status: "",
  });
  const [tempFilters, setTempFilters] = useState({
    companyName: "",
    bankAccountNumber: "",
    registrationNumber: "",
    companyEmail: "",
    status: "",

  });

  const handleApplyFilters = () => {
    setFilters({
      companyName: (tempFilters.companyName || "").trim(),
      registrationNumber: (tempFilters.registrationNumber || "").trim(),
      companyEmail: (tempFilters.companyEmail || "").trim(),
      status: tempFilters.status || "",
    });

    setCurrentPage(1);
  };
  const handleClearFilters = () => {
    const cleared = {
      companyName: "",
      registrationNumber: "",
      companyEmail: "",
      status: "",
    };

    setTempFilters(cleared);
    setFilters(cleared);
    setCurrentPage(1);
  };

  // Normalized filtering (safe against undefined & casing differences)
  const filteredData = (items || []).filter((row) => {
  const fn = (v) =>
    v === null || v === undefined
      ? ""
      : String(v).trim().toLowerCase();

  const fCompany = fn(filters.companyName);
  const fReg = fn(filters.registrationNumber);
  const fEmail = fn(filters.companyEmail);
  const fStatus = fn(filters.status);

  const get = (obj, key) =>
    fn(obj[key]) ||
    fn(obj[key.charAt(0).toLowerCase() + key.slice(1)]) ||
    fn(obj[key.charAt(0).toUpperCase() + key.slice(1)]);

  const dCompany = get(row, "companyName");
  const dReg = get(row, "registrationNumber");
  const dEmail = get(row, "companyEmail");
  const dStatus = get(row, "status");

  const matchCompany =
    !fCompany || dCompany.includes(fCompany);

  const matchReg =
    !fReg || dReg.includes(fReg);

  const matchEmail =
    !fEmail || dEmail.includes(fEmail);

  const matchStatus =
    !fStatus || dStatus === fStatus;

  return (
    matchCompany &&
    matchReg &&
    matchEmail &&
    matchStatus
  );
});

  // --- Local sorting (replace useSort hook to remove dependency issues) ---
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // helper to convert values for comparison
  const _getComparable = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "number") return val;
    const n = Number(val);
    if (!Number.isNaN(n) && String(val).trim() !== "") return n;
    return String(val).toLowerCase();
  };

  // compute sortedData from filteredData + sortConfig
  const sortedData = React.useMemo(() => {
    const list = Array.isArray(filteredData) ? filteredData.slice() : [];

    if (!sortConfig.key) return list;

    const key = sortConfig.key;

    const compareRow = (a, b) => {
      // try exact key, then camel/lower/upper fallbacks
      const getValue = (obj) =>
        obj[key] ?? obj[key.charAt(0).toLowerCase() + key.slice(1)] ?? obj[key.charAt(0).toUpperCase() + key.slice(1)] ?? "";
      const aVal = _getComparable(getValue(a));
      const bVal = _getComparable(getValue(b));

      if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    };

    list.sort(compareRow);
    if (sortConfig.direction === "desc") list.reverse();
    return list;
  }, [filteredData, sortConfig]);

  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
  const paginatedCustomers = sortedData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* LIST SCREEN */}
        {!showCreateScreen && !showEditScreen && (
          <div className="reports-section">
            {/* <h2 style={{ color: 'rgb(61, 140, 79)' }}>Companies</h2> */}
            <div className="list-header">
              <h3 className="customer-title"> Companies</h3>
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

  <select
    value={tempFilters.companyName}
    onChange={(e) =>
      setTempFilters({
        ...tempFilters,
        companyName: e.target.value,
      })
    }
    className="form-control"
  >
    <option value="">Select Company</option>

    {companyList.map((company) => (
      <option
        key={company.companyName}
        value={company.companyName}
      >
        {company.companyName}
      </option>
    ))}
  </select>

  <input
    type="text"
    value={tempFilters.registrationNumber}
    onChange={(e) =>
      setTempFilters({
        ...tempFilters,
        registrationNumber: e.target.value,
      })
    }
    placeholder="Registration Number"
  />

  <input
    type="text"
    value={tempFilters.companyEmail}
    onChange={(e) =>
      setTempFilters({
        ...tempFilters,
        companyEmail: e.target.value,
      })
    }
    placeholder="Company Email"
  />

  <select
    value={tempFilters.status}
    onChange={(e) =>
      setTempFilters({
        ...tempFilters,
        status: e.target.value,
      })
    }
    className="form-control"
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
    Filter
  </HoloButton>

  <HoloButton
    variant="secondary"
    size="md"
    onClick={handleClearFilters}
  >
    Clear
  </HoloButton>

</div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "10px 0",
              }}
            >


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
              <div style={{ margin: "10px 0" }}>
                <HoloButton
                  variant="primary"
                  size="md"
                  onClick={() => setShowCreateScreen(true)}
                >
                  + Add New
                </HoloButton>
              </div>
            </div>


            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort("name")}>
                    COMPANY NAME {""}
                    {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
                  </th>
                  {/* <th>ACCOUNT NUMBER</th> */}
                  <th>REG. NUMBER</th>
                  {/* <th>WEBSITE</th>  */}
                  <th>EMAIL</th>
                  <th>PHONE</th>
                   <th>STATUS</th>
                  {/* <th>ADDRESS</th> */}
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      <div className="loader"></div>
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      No Companies found.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((companies) => (
                    <tr key={companies.Id}>
                      <td className="service-cell">{companies.companyName}</td>
                      {/* <td className="service-cell">{companies.bankAccountNumber}</td> */}
                      <td className="service-cell">{companies.registrationNumber}</td>
                      {/* <td>{companies.bankName}</td> */}
                      <td className="service-cell">{companies.companyEmail}</td>
                      <td className="service-cell">{companies.companyPhoneNumber}</td>
                      {/* <td className="service-cell">{companies.companyAddress}</td> */}
                       <td className="service-cell">{companies.status}</td>
                      <td className="service-cell">
                        <FaEdit
                          style={{ cursor: 'pointer' }}
                          className="action-icon edit-icon"
                          title="Edit"
                          onClick={() => {
                            setEditItem(companies);
                            console.log('companies', companies);
                            setShowEditScreen(true);
                          }} />

                        {companies.isDeleted === "No" && (
                          <FaTrash
                            style={{ cursor: 'pointer' }}
                            className="action-icon cancel-icon"
                            title="Delete"
                            onClick={() => handleTriggerDelete(companies.id)}
                          />
                        )}
                        {/* <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => {
                            setEditItem(companies);
                            console.log('companies', companies);
                            setShowEditScreen(true);
                          }}
                        >
                          <i
                            className="fas fa-edit"
                            style={{ color: "blue" }}
                          ></i>
                        </button>
                        &nbsp;
                        {companies.isDeleted === "No" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(companies.id)}
                          >
                            <i
                              className="fas fa-trash"
                              style={{ color: "red" }}
                            ></i>
                          </button>
                        )} */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination */}
            {!loading && paginatedCustomers.length > 0 && (

              <Pagination
                currentPage={currentPage}
                totalItems={sortedData.length}        // correct total
                itemsPerPage={recordsPerPage}         // or rename as per your prop definition
                onPageChange={setCurrentPage}         // pass the function
              />
            )}

          </div>
        )}

        {/* CREATE ITEM SCREEN */}
        {showCreateScreen && (
          <div className="create-item-section">
            <div className="create-item-box">
              <br />
              <h3 className="role-title">Create New Company</h3>
              <h4 className="quotation-view-section-title">Company Information</h4>

              <form
                onSubmit={handleCreateItem}
                className="create-item-form-row"
              >

                <div className="formlabel-group">
                  <label>
                    Company Name <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={newItem.CompanyName || ""}
                    maxLength={100}
                    onChange={(e) => {
                      const value = e.target.value;

                      handleFieldChange("CompanyName", value);

                      setErrors((prev) => ({
                        ...prev,
                        CompanyName:
                          value.trim() === ""
                            ? "Company Name is required"
                            : "",
                      }));
                    }}
                    className={errors.CompanyName ? "input-error" : ""}
                  />

                  {errors.CompanyName && (
                    <p className="error-message">{errors.CompanyName}</p>
                  )}
                </div>

                {/* <div className="formlabel-group">
                  <label>
                    Vat Number<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={newItem.VatNumber || ""}
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();

                      // Allow only A-Z and 0-9
                      if (/^[A-Z0-9]*$/.test(value)) {
                        handleFieldChange("VatNumber", value);

                        // Live validation while typing
                        if (value.length < 10) {
                          setErrors(prev => ({
                            ...prev,
                            VatNumber: "VAT Number must 10 characters"
                          }));
                        } else {
                          setErrors(prev => ({ ...prev, VatNumber: "" }));
                        }
                      }
                    }}
                    onBlur={() => {
                      const value = newItem.VatNumber || "";
                      if (value.length !== 10) {
                        setErrors(prev => ({
                          ...prev,
                          VatNumber: "VAT Number must 10 characters"
                        }));
                      } else {
                        setErrors(prev => ({ ...prev, VatNumber: "" }));
                      }
                    }}
                    className={errors.VatNumber ? "input-error" : ""}
                  />

                  {errors.VatNumber && (
                    <p className="error-message">{errors.VatNumber}</p>
                  )}

                </div> */}
                <div className="formlabel-group">
                  <label>
                    Vat Number<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={newItem.VatNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only numbers and /
                      if (/^[0-9/]*$/.test(value)) {
                        handleFieldChange("VatNumber", value);

                        setErrors(prev => ({
                          ...prev,
                          VatNumber: ""
                        }));
                      }
                    }}
                    onBlur={() => {
                      const value = newItem.VatNumber || "";

                      if (!value) {
                        setErrors(prev => ({
                          ...prev,
                          VatNumber: "Vat Number is required"
                        }));
                      }
                    }}
                    className={errors.VatNumber ? "input-error" : ""}
                  />

                  {errors.VatNumber && (
                    <p className="error-message">{errors.VatNumber}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Registration Number <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder=""
                    value={newItem.RegistrationNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only numbers and /
                      if (/^[0-9/]*$/.test(value)) {
                        handleFieldChange("RegistrationNumber", value);

                        setErrors(prev => ({
                          ...prev,
                          RegistrationNumber: ""
                        }));
                      }
                    }}
                    onBlur={() => {
                      const value = newItem.RegistrationNumber || "";

                      if (!value) {
                        setErrors(prev => ({
                          ...prev,
                          RegistrationNumber: "Registration Number is required"
                        }));
                      }
                    }}
                    className={errors.RegistrationNumber ? "input-error" : ""}
                  />

                  {errors.RegistrationNumber && (
                    <p className="error-message">{errors.RegistrationNumber}</p>
                  )}
                </div>


                <div className="formlabel-group">
                  <label>
                    Company Website
                    {/* <span className="required">*</span> */}
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={newItem.CompanyWebsite}
                    onChange={(e) => {
                      const value = e.target.value;

                      handleFieldChange("CompanyWebsite", value);

                      const urlRegex =
                        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/;

                      // setErrors((prev) => ({
                      //   ...prev,
                      //   CompanyWebsite:
                      //     value.trim() === ""
                      //       ? "Company Website is required"
                      //       : !urlRegex.test(value)
                      //         ? "Invalid website format"
                      //         : ""
                      // }));
                    }}
                    onBlur={(e) => {
                      const value = newItem.CompanyWebsite || "";
                      const urlRegex =
                        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/;

                      // setErrors((prev) => ({
                      //   ...prev,
                      //   CompanyWebsite:
                      //     value.trim() === ""
                      //       ? "Company Website is required"
                      //       : !urlRegex.test(value)
                      //         ? "Invalid website format"
                      //         : ""
                      // }));
                    }}
                    className={
                      errors.CompanyWebsite
                        ? "input-error"
                        : newItem.CompanyWebsite &&
                          /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(newItem.CompanyWebsite)
                          ? "input-valid"
                          : ""
                    }
                  />

                  {errors.CompanyWebsite && (
                    <p className="error-message">{errors.CompanyWebsite}</p>
                  )}

                </div>
                <div className="formlabel-group">
                  <label>
                    Company Email<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={newItem.CompanyEmail}
                    onChange={(e) => handleFieldChange("CompanyEmail", e.target.value)}
                    className={errors.CompanyEmail ? "input-error" : ""}
                  />
                  {errors.CompanyEmail && (
                    <p className="error-message">{errors.CompanyEmail}</p>
                  )}
                </div>
                <div className="formlabel-group">
                  <label>
                    Company Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={newItem.CompanyPhoneNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only digits and max 10 characters
                      if (/^\d{0,10}$/.test(value)) {
                        handleFieldChange("CompanyPhoneNumber", value);

                        // Validation while typing
                        setErrors((prev) => ({
                          ...prev,
                          CompanyPhoneNumber:
                            value.length === 10
                              ? ""                                // valid
                              : "Phone number must be 10 digits"   // show message
                        }));
                      }
                    }}
                    className={errors.CompanyPhoneNumber ? "input-error" : ""}
                  />
                  {errors.CompanyPhoneNumber && (
                    <p className="error-message">{errors.CompanyPhoneNumber}</p>
                  )}

                </div>
                <div className="formlabel-group">
                  <label>
                    Company Address <span className="required">*</span>
                  </label>

                  <textarea
                    placeholder=""
                    value={newItem.CompanyAddress}
                    onChange={(e) => handleFieldChange("CompanyAddress", e.target.value)}
                    className={errors.CompanyAddress ? "input-error" : ""}

                  />

                  {errors.CompanyAddress && (
                    <p className="error-message">{errors.CompanyAddress}</p>
                  )}
                </div>
                <div className="formlabel-group"
                >
                  <label>Company Logo
                    {/* <span className="required">*</span> */}
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const allowedTypes = ["image/jpeg", "image/png"];

                      if (!allowedTypes.includes(file.type)) {
                        setErrors((prev) => ({
                          ...prev,
                          CompanyLogo: "Only JPG, JPEG, and PNG images are allowed",
                        }));
                        setNewItem((prev) => ({ ...prev, CompanyLogo: null }));
                        return;
                      }

                      // File is valid → clear error
                      setErrors((prev) => ({ ...prev, CompanyLogo: "" }));

                      setNewItem((prev) => ({
                        ...prev,
                        CompanyLogo: file,
                      }));
                    }}
                    className={errors.CompanyLogo ? "input-error" : ""}
                  />

                  {errors.CompanyLogo && (
                    <p className="error-message">{errors.CompanyLogo}</p>
                  )}


                </div>
                <div className="bank-info-section">
                  <h4 className="quotation-view-section-title">Bank Information</h4>

                  <div className="bank-info-grid">
                    {/* <div style={{ width: "100%" }}></div>

<h4
  className="Companysub-title"
  style={{
    color: "#1E7D4E",
    width: "100%",
    marginTop: "20px",
    marginBottom: "10px",
    marginRight:"200px",
  }}
>
  Bank Information
</h4> */}
                    {/* <h4 className="quotationsub-title" style={{ color: "green" }}>Bank Information</h4> */}
                    {/* <div className="formlabel-group">
                      <label>
                        Account Number <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={newItem.BankAccountNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Allow only digits and max 10 characters
                          if  (/^\d*$/.test(value)) {
                            handleFieldChange("BankAccountNumber", value);

                            // Validation conditions
                            if (value.length === 0) {
                              setErrors((prev) => ({
                                ...prev,
                                BankAccountNumber: "Bank Account Number is required"
                              }));
                            }
                            else {
                              setErrors((prev) => ({
                                ...prev,
                                BankAccountNumber: ""
                              }));
                            }
                          }
                        }}
                        className={errors.BankAccountNumber ? "input-error" : ""}
                      />

                      {errors.BankAccountNumber && (
                        <p className="error-message">{errors.BankAccountNumber}</p>
                      )}


                    </div> */}
                    <div className="formlabel-group">
                      <label>
                        Account Number <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        placeholder=""
                        value={newItem.BankAccountNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Allow only numbers and /
                          if (/^[0-9/]*$/.test(value)) {
                            handleFieldChange("BankAccountNumber", value);

                            setErrors(prev => ({
                              ...prev,
                              BankAccountNumber: ""
                            }));
                          }
                        }}
                        onBlur={() => {
                          const value = newItem.BankAccountNumber || "";

                          if (!value) {
                            setErrors(prev => ({
                              ...prev,
                              BankAccountNumber: "Account Number is required"
                            }));
                          }
                        }}
                        className={errors.BankAccountNumber ? "input-error" : ""}
                      />

                      {errors.BankAccountNumber && (
                        <p className="error-message">{errors.BankAccountNumber}</p>
                      )}
                    </div>
                    <div className="formlabel-group">
                      <label>
                        Bank Name <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        value={newItem.BankName || ""}
                        maxLength={50}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Allow only letters and spaces
                          if (/^[A-Za-z\s]*$/.test(value)) {
                            handleFieldChange("BankName", value);

                            setErrors((prev) => ({
                              ...prev,
                              BankName:
                                value.trim() === ""
                                  ? "Bank Name is required"
                                  : "",
                            }));
                          }
                        }}
                        className={errors.BankName ? "input-error" : ""}
                      />

                      {errors.BankName && (
                        <p className="error-message">{errors.BankName}</p>
                      )}
                    </div>

                    <div className="formlabel-group">
                      <label>
                        Account Holder Name <span className="required">*</span>
                      </label>



                      <input
                        type="text"
                        value={newItem.AccountHolderName || ""}
                        maxLength={100}
                        onChange={(e) => {
                          const value = e.target.value;

                          handleFieldChange("AccountHolderName", value);

                          setErrors((prev) => ({
                            ...prev,
                            AccountHolderName:
                              value.trim() === ""
                                ? "Account Holder Name is required"
                                : "",
                          }));
                        }}
                        className={errors.AccountHolderName ? "input-error" : ""}
                      />

                      {errors.AccountHolderName && (
                        <p className="error-message">{errors.AccountHolderName}</p>
                      )}
                    </div>
                    <div className="formlabel-group">
                      <label>
                        Branch Code <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={newItem.BranchCode || ""}
                        maxLength={100}
                        onChange={(e) => {
                          const value = e.target.value;

                          handleFieldChange("BranchCode", value);

                          setErrors((prev) => ({
                            ...prev,
                            BranchCode:
                              value.trim() === ""
                                ? "Branch Code is required"
                                : "",
                          }));
                        }}
                        className={errors.BranchCode ? "input-error" : ""}
                      />

                      {errors.BranchCode && (
                        <p className="error-message">
                          {errors.BranchCode}
                        </p>
                      )}
                    </div>
                    <div className="formlabel-group" style={{ display: "none" }}>
                      <label>
                        IFSC Code <span className="required"></span>
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={newItem.IFSCCode}
                        onChange={(e) => handleFieldChange("IFSCCode", e.target.value)}
                        className={errors.IFSCCode ? "input-error" : ""}
                      />
                      {errors.IFSCCode && (
                        <p className="error-message">{errors.IFSCCode}</p>
                      )}
                    </div>


                    <div className="formlabel-group">
                      <label>
                        Branch Address <span className="required">*</span>
                      </label>
                      <textarea
                        placeholder=""
                        value={newItem.BranchAddress}
                        onChange={(e) => handleFieldChange("BranchAddress", e.target.value)}
                        className={errors.BranchAddress ? "input-error" : ""}

                      />
                      {errors.BranchAddress && (
                        <p className="error-message">{errors.BranchAddress}</p>
                      )}
                    </div>
                  </div>
                </div>


                {errors.duplicate && (
                  <p className="error-message">{errors.duplicate}</p>
                )}

                <div className="receiv-actions">
                  <button type="submit" className="btn btn-succes" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        &nbsp;Save
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-lg"
                    onClick={() => {
                      setNewItem({
                        CompanyName: "",
                        VatNumber: "",
                        RegistrationNumber: "",
                        CompanyAddress: "",
                        CompanyWebsite: "",
                        CompanyEmail: "",
                        CompanyPhoneNumber: "",
                        CompanyLogo: null,
                        BankAccountNumber: "",
                        BranchCode: "",
                        BranchAddress: "",
                        IFSCCode: "",
                        AccountHolderName: "",
                      });

                      setErrors({});
                      setShowCreateScreen(false);
                    }}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>




                </div>

              </form>
            </div>
          </div>
        )}

        {/* EDIT ITEM SCREEN */}
        {showEditScreen && editItem && (
          <div className="create-item-section">
            <div className="create-item-box">
              <br />
              <h3 className="role-title">Edit Company</h3>
              <h4 className="quotation-view-section-title">Company Information</h4>
              <form onSubmit={handleEditItem} className="create-item-form-row">
                <div className="formlabel-group">
                  <label>
                    Company Name <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={editItem.companyName || ""}
                    maxLength={100}
                    onChange={(e) => {
                      const value = e.target.value;

                      setEditItem((prev) => ({
                        ...prev,
                        companyName: value,
                      }));

                      setErrors((prev) => ({
                        ...prev,
                        companyName:
                          value.trim() === ""
                            ? "Company Name is required"
                            : "",
                      }));
                    }}
                    className={errors.companyName ? "input-error" : ""}
                  />

                  {errors.companyName && (
                    <p className="error-message">
                      {errors.companyName}
                    </p>
                  )}
                </div>


                <div className="formlabel-group">
                  <label>
                    Vat Number <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={editItem.vatNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only numbers and /
                      if (/^[0-9/]*$/.test(value)) {
                        setEditItem(prev => ({
                          ...prev,
                          vatNumber: value
                        }));
                      }

                      // Validation while typing
                      let errorMessage = "";

                      if (value.trim() === "") {
                        errorMessage = "VAT Number is required";
                      } else if (!/^[0-9/]+$/.test(value)) {
                        errorMessage = "Only numbers and / are allowed";
                      }

                      setErrors(prev => ({
                        ...prev,
                        vatNumber: errorMessage
                      }));
                    }}
                    onBlur={() => {
                      const value = editItem?.vatNumber || "";

                      let errorMessage = "";

                      if (value.trim() === "") {
                        errorMessage = "VAT Number is required";
                      } else if (!/^[0-9/]+$/.test(value)) {
                        errorMessage = "Only numbers and / are allowed";
                      }

                      setErrors(prev => ({
                        ...prev,
                        vatNumber: errorMessage
                      }));
                    }}
                    className={
                      errors.vatNumber
                        ? "input-error"
                        : editItem?.vatNumber?.trim()
                          ? "input-valid"
                          : ""
                    }
                  />

                  {errors.vatNumber && (
                    <p className="error-message">{errors.vatNumber}</p>
                  )}
                </div>
                <div className="formlabel-group">
                  <label>
                    Registration Number <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    value={editItem.registrationNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only numbers and /
                      if (/^[0-9/]*$/.test(value)) {
                        setEditItem(prev => ({
                          ...prev,
                          registrationNumber: value
                        }));
                      }

                      // Validation while typing
                      let errorMessage = "";

                      if (value.trim() === "") {
                        errorMessage = "Registration Number is required";
                      } else if (!/^[0-9/]+$/.test(value)) {
                        errorMessage = "Only numbers and / are allowed";
                      }

                      setErrors(prev => ({
                        ...prev,
                        registrationNumber: errorMessage
                      }));
                    }}
                    onBlur={() => {
                      const value = editItem?.registrationNumber || "";

                      let errorMessage = "";

                      if (value.trim() === "") {
                        errorMessage = "Registration Number is required";
                      } else if (!/^[0-9/]+$/.test(value)) {
                        errorMessage = "Only numbers and / are allowed";
                      }

                      setErrors(prev => ({
                        ...prev,
                        registrationNumber: errorMessage
                      }));
                    }}
                    className={
                      errors.registrationNumber
                        ? "input-error"
                        : editItem?.registrationNumber?.trim()
                          ? "input-valid"
                          : ""
                    }
                  />

                  {errors.registrationNumber && (
                    <p className="error-message">{errors.registrationNumber}</p>
                  )}
                </div>

                <div className="formlabel-group">
                  <label>
                    Company Website
                    {/* <span className="required">*</span> */}
                  </label>

                  <input
                    type="text"
                    placeholder="Company Website"
                    value={editItem.companyWebsite || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditItem({ ...editItem, companyWebsite: value });
                    }}

                  />


                  {/* {errors.companyWebsite && (
                    <p className="error-message">{errors.companyWebsite}</p>
                  )} */}

                </div>
                <div className="formlabel-group">
                  <label>
                    Company Email<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={editItem.companyEmail || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      setEditItem((prev) => ({ ...prev, companyEmail: value }));

                      // Email validation regex
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                      setErrors((prev) => ({
                        ...prev,
                        companyEmail:
                          value.trim() === ""
                            ? "Company Email is required"
                            : !emailRegex.test(value)
                              ? "Invalid email format"
                              : ""
                      }));
                    }}
                    onBlur={() => {
                      const value = editItem?.companyEmail || "";
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                      setErrors((prev) => ({
                        ...prev,
                        companyEmail:
                          value.trim() === ""
                            ? "Company Email is required"
                            : !emailRegex.test(value)
                              ? "Invalid email format"
                              : ""
                      }));
                    }}
                    className={
                      errors.companyEmail
                        ? "input-error"
                        : editItem?.companyEmail &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editItem.companyEmail)
                          ? "input-valid"
                          : ""
                    }
                  />


                  {errors.companyEmail && <p className="error-message">{errors.companyEmail}</p>}
                </div>
                <div className="formlabel-group">
                  <label>
                    Company Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={editItem.companyPhoneNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow digits only and limit to 10
                      if (/^\d{0,10}$/.test(value)) {
                        setEditItem((prev) => ({ ...prev, companyPhoneNumber: value }));

                        // Live validation
                        setErrors((prev) => ({
                          ...prev,
                          companyPhoneNumber:
                            value.length === 0
                              ? "Company Phone Number is required"
                              : value.length < 10
                                ? "Phone Number must be 10 digits"
                                : ""
                        }));
                      }
                    }}
                    onBlur={() => {
                      const value = editItem?.companyPhoneNumber || "";

                      setErrors((prev) => ({
                        ...prev,
                        companyPhoneNumber:
                          value.length === 0
                            ? "Company Phone Number is required"
                            : value.length < 10
                              ? "Phone Number must be 10 digits"
                              : ""
                      }));
                    }}
                    className={
                      errors.companyPhoneNumber
                        ? "input-error"
                        : editItem.companyPhoneNumber?.length === 10
                          ? "input-valid"
                          : ""
                    }
                  />

                  {errors.companyPhoneNumber && (
                    <p className="error-message">{errors.companyPhoneNumber}</p>
                  )}


                </div>
                <div className="formlabel-group">
                  <label>
                    Company Address <span className="required">*</span>
                  </label>
                  <textarea
                    value={editItem.companyAddress || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Always update state
                      setEditItem(prev => ({ ...prev, companyAddress: value }));

                      // If empty -> set error, else clear error
                      setErrors(prev => ({
                        ...prev,
                        companyAddress: value.trim() ? "" : "Company Address is required"
                      }));
                    }}
                    onBlur={() => {
                      // ensure error shows on blur too
                      setErrors(prev => ({
                        ...prev,
                        companyAddress: (editItem?.companyAddress || "").trim()
                          ? ""
                          : "Company Address is required"
                      }));
                    }}
                    className={
                      errors.companyAddress
                        ? "input-error"
                        : editItem?.companyAddress?.trim()
                          ? "input-valid"
                          : ""
                    }
                  />

                  {errors.companyAddress && (
                    <p className="error-message">{errors.companyAddress}</p>
                  )}
                </div>

                                    <div className="formlabel-group">
                      <label>Status <span className="required">*</span></label>

                      <select
                        value={editItem.status ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditItem(prev => ({ ...prev, status: val }));
                          setErrors(prev => ({
                            ...prev,
                            status: val === "" ? "Please select status" : ""
                          }));
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          setErrors(prev => ({
                            ...prev,
                            status: val === "" ? "Please select status" : ""
                          }));
                        }}
                        className={errors.status ? "input-error" : ""}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>

                      {errors.status && (
                        <p className="error-message">{errors.status}</p>
                      )}
                    </div>

                <div className="formlabel-group">

                  <label>Company Logo</label>

                  <input
                    type="file"
                    name="companyLogo"
                    style={{ width: "250px" }}
                    // onChange={(e) => {
                    //   const file = e.target.files?.[0];
                    //   console.log("selected file:", file);
                    //   setEditItem(prev => ({ ...prev, companyLogo: file }));
                    // }}
                    accept="image/*"

                    onChange={(e) => {
                      const file = e.target.files[0];
                      setEditItem({ ...editItem, companyLogo: file });
                    }}

                  />
                  {editItem.companyLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        const imagePath = `${baseURL}/UploadedFiles/${editItem.companyLogo?.split("\\").pop()}`;
                        console.log("🖼️ Image URL:", imagePath);
                        setSelectedImage(imagePath);
                        setShowImagePopup(true);
                      }}

                      style={{
                        background: "none",
                        border: "none",
                        marginLeft: "196px",
                        marginTop: "-30px",
                        cursor: "pointer",
                      }}
                    >
                      <i className="fas fa-eye" style={{ color: "darkblue", fontSize: "18px" }}></i>
                    </button>
                  )}
                </div>
                <div className="bank-info-section">
                  <h4 className="quotation-view-section-title">Bank Information</h4>

                  <div className="bank-info-grid">

                    <div className="formlabel-group">
                      <label>
                        Account Number <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        value={editItem.bankAccountNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Allow only numbers and /
                          if (/^[0-9/]*$/.test(value)) {
                            setEditItem((prev) => ({
                              ...prev,
                              bankAccountNumber: value,
                            }));

                            // Required validation only
                            setErrors((prev) => ({
                              ...prev,
                              bankAccountNumber:
                                value.length === 0
                                  ? "Bank Account Number is required"
                                  : "",
                            }));
                          }
                        }}
                        onBlur={() => {
                          const value = editItem?.bankAccountNumber || "";

                          setErrors((prev) => ({
                            ...prev,
                            bankAccountNumber:
                              value.length === 0
                                ? "Bank Account Number is required"
                                : "",
                          }));
                        }}
                        className={
                          errors.bankAccountNumber
                            ? "input-error"
                            : editItem?.bankAccountNumber
                              ? "input-valid"
                              : ""
                        }
                      />

                      {errors.bankAccountNumber && (
                        <p className="error-message">
                          {errors.bankAccountNumber}
                        </p>
                      )}
                    </div>
                    <div className="formlabel-group">
                      <label>
                        Bank Name <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        value={editItem.bankName || ""}
                        maxLength={50}
                        onChange={(e) => {
                          const value = e.target.value;

                          setEditItem((prev) => ({
                            ...prev,
                            bankName: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            bankName:
                              value.trim() === ""
                                ? "Bank Name is required"
                                : "",
                          }));
                        }}
                        className={errors.bankName ? "input-error" : ""}
                      />

                      {errors.bankName && (
                        <p className="error-message">
                          {errors.bankName}
                        </p>
                      )}
                    </div>
                    <div className="formlabel-group">
                      <label>
                        Account Holder Name <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        value={editItem.accountHolderName || ""}
                        maxLength={50}
                        onChange={(e) => {
                          const value = e.target.value;

                          setEditItem((prev) => ({
                            ...prev,
                            accountHolderName: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            accountHolderName:
                              value.trim() === ""
                                ? "Account Holder Name is required"
                                : "",
                          }));
                        }}
                        className={
                          errors.accountHolderName
                            ? "input-error"
                            : ""
                        }
                      />

                      {errors.accountHolderName && (
                        <p className="error-message">
                          {errors.accountHolderName}
                        </p>
                      )}
                    </div>
                    <div className="formlabel-group">
                      <label>
                        Branch Code <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        value={editItem.branchCode || ""}
                        maxLength={10}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();

                          setEditItem((prev) => ({
                            ...prev,
                            branchCode: value,
                          }));

                          setErrors((prev) => ({
                            ...prev,
                            branchCode:
                              value.trim() === ""
                                ? "Branch Code is required"
                                : "",
                          }));
                        }}
                        className={
                          errors.branchCode
                            ? "input-error"
                            : ""
                        }
                      />

                      {errors.branchCode && (
                        <p className="error-message">
                          {errors.branchCode}
                        </p>
                      )}
                    </div>
                    <div className="formlabel-group" style={{ display: "none" }}>
                      <label>
                        IFSC Code <span className="required"></span>
                      </label>
                      <input
                        type="text"
                        value={editItem.ifscCode || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Allow only letters, numbers, spaces (max 50 chars)
                          if (/^[A-Za-z0-9\s]{0,50}$/.test(value)) {
                            setEditItem((prev) => ({ ...prev, ifscCode: value }));
                          }

                          // Validation: only check format if value is not empty
                          setErrors((prev) => ({
                            ...prev,
                            ifscCode:
                              value.trim() !== "" && !/^[A-Za-z0-9\s]+$/.test(value)
                                ? "Only letters and numbers are allowed"
                                : ""
                          }));
                        }}
                        onBlur={() => {
                          const value = editItem?.ifscCode || "";

                          setErrors((prev) => ({
                            ...prev,
                            ifscCode:
                              value.trim() !== "" && !/^[A-Za-z0-9\s]+$/.test(value)
                                ? "Only letters and numbers are allowed"
                                : ""
                          }));
                        }}
                        className={
                          errors.ifscCode
                            ? "input-error"
                            : editItem?.ifscCode?.trim()
                              ? "input-valid"
                              : ""
                        }
                      />
                      {errors.ifscCode && <p className="error-message">{errors.ifscCode}</p>}

                    </div>

                    <div className="formlabel-group">
                      <label>
                        Branch Address <span className="required">*</span>
                      </label>
                      <textarea
                        value={editItem.branchAddress || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Always update state
                          setEditItem(prev => ({ ...prev, branchAddress: value }));

                          // If empty -> set error, else clear error
                          setErrors(prev => ({
                            ...prev,
                            branchAddress: value.trim() ? "" : "Branch Address is required"
                          }));
                        }}
                        onBlur={() => {
                          // ensure error shows on blur too
                          setErrors(prev => ({
                            ...prev,
                            branchAddress: (editItem?.branchAddress || "").trim()
                              ? ""
                              : "Branch Address is required"
                          }));
                        }}
                        className={
                          errors.branchAddress
                            ? "input-error"
                            : editItem?.branchAddress?.trim()
                              ? "input-valid"
                              : ""
                        }
                      />
                      {errors.branchAddress && (
                        <p className="error-message">{errors.branchAddress}</p>
                      )}

                    </div>

                  </div>
                </div>

                {errors.duplicate && (
                  <p className="error-message">{errors.duplicate}</p>
                )}
                <div className="receiving-actions">
                  <button type="submit" className="btn btn-succes" disabled={updateLoading}>
                    {updateLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        &nbsp;Update
                      </>
                    ) : (
                      "Update"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      // setNewItem(initialCustomerState);
                      setErrors({});
                      setShowEditScreen(false);
                    }}

                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this Company? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <HelpModal show={showHelp} title="Companies - Help & Overview" screenName="Companies" onClose={() => setShowHelp(false)} />
        {showImagePopup && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              className="modal-content"
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "10px",
                position: "relative",
                maxWidth: "600px",
                width: "90%",
                textAlign: "center",
              }}
            >
              <button
                onClick={() => setShowImagePopup(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "15px",
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>

              <img
                src={selectedImage}
                alt="Company Logo"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ReceivingEntities;

