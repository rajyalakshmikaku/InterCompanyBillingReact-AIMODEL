import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getuserslist,
  fetchupdateUser,
  fetchDeleteUser,
} from "../../redux/UsersListSlice";
import { fetchRoles } from "../../redux/EditProfileSlice";
import "./UsersList.css";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
// import { isAction } from "@reduxjs/toolkit";
import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";
import {
  fetchCompanieswithfilter,
  fetchCompanieswithdeactivestatus,
} from "../../redux/CustomerSlice";
import { fetchRolesforfilter } from "../../redux/RegistrationSlice";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
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

const UsersList = () => {
  const dispatch = useDispatch();

  const {
    userList = [],
    loading,
    error,
  } = useSelector((state) => state.users || {});
  const { roles = [] } = useSelector((state) => state.editProfile || {});

  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const companiesforfilter = useSelector((state) => state.Customers.companies);
  const companyListwithstatus = useSelector(
    (state) => state.Customers.companieslist,
  );
  const roleslistwithfilter = useSelector(
    (state) => state.registration.filteredroles,
  );
  useEffect(() => {
    console.log("roleslistwithfilter:", roleslistwithfilter);
  }, [roleslistwithfilter]);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    debugger;
    setLoadingTable(true);
    try {
      await dispatch(getuserslist()).unwrap();
      // console.log(getuserslist);
    } finally {
      setLoadingTable(false);
    }
  };

  const [filters, setFilters] = useState({
    name: "",
    company: "",
    role: "",
    username: "",
    email: "",
  });

  // const [tempFilters, setTempFilters] = useState({
  //   name: "",
  //   company: "",
  //   role: "",
  //   username: "",
  //   email: ""
  // });

  const [tempFilters, setTempFilters] = useState({
    name: "",
    company: "",
    role: "",
    username: "",
    email: "",
  });

  const handleApplyFilters = () => {
    setFilters(tempFilters); // Apply only on button click
    setCurrentPage(1); // Reset pagination (if needed)
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({});
  // const [errors, setErrors] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(getuserslist());
    dispatch(fetchRoles());
    dispatch(fetchCompanieswithfilter());
    dispatch(fetchCompanieswithdeactivestatus());
    dispatch(fetchRolesforfilter());
  }, [dispatch]);

  // useEffect(() => {
  //   if (error)
  //     // alertify.error(error);

  // }, [error]);

  // const filteredData = userList.filter((user) => {
  //   const nameMatch = !filters.name || user.name?.toLowerCase().includes(filters.name.toLowerCase());
  //   const companyMatch = !filters.company || user.companyName?.toLowerCase().includes(filters.company.toLowerCase());
  //   const roleMatch = !filters.role || user.roleName?.toLowerCase().includes(filters.role.toLowerCase());
  //   const usernameMatch = !filters.username || user.userName?.toLowerCase().includes(filters.username.toLowerCase());
  //   const emailMatch = !filters.email || user.email?.toLowerCase().includes(filters.email.toLowerCase());
  //   return nameMatch && companyMatch && roleMatch && usernameMatch && emailMatch;
  // });

  const filteredData = userList.filter((user) => {
    const nameMatch =
      !filters.name ||
      user.name?.toLowerCase().includes(filters.name.toLowerCase());

    const companyMatch =
      !filters.company ||
      user.companyName?.toLowerCase() === filters.company.toLowerCase();

    const roleMatch =
      !filters.role ||
      user.roleName?.toLowerCase() === filters.role.toLowerCase();

    const usernameMatch =
      !filters.username ||
      user.userName?.toLowerCase().includes(filters.username.toLowerCase());

    const emailMatch =
      !filters.email ||
      user.email?.toLowerCase().includes(filters.email.toLowerCase());

    return (
      nameMatch && companyMatch && roleMatch && usernameMatch && emailMatch
    );
  });

  const { sortedData, requestSort, sortConfig } = useSort(filteredData);

  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(
    indexOfFirstRecord,
    indexOfLastRecord,
  );

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleFilterSubmit = () => setCurrentPage(1);
  const handleRecordsChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleViewClick = (user) => setSelectedUser(user);
  const handleCloseModal = () => setSelectedUser(null);

  const handleEditClick = (user) => {
    debugger;

    const companyObj =
      companyListwithstatus.find((c) => c.companyName === user?.companyName) ||
      {};
    const roleObj = roles.find((r) => r.roleName === user.roleName) || {};

    const mappedUser = {
      ...user,
      companyId: companyObj.id ?? "",
      roleId: roleObj.id ?? "",
      title: user.title || "",
      gender: user.gender || "",
      address: user.address || "",
      IsActive: user.isActive || "",
      IsDeleted: user.isDeleted || "",
      password: "",
      confirmPassword: "",
    };

    setEditUser(mappedUser);
    setFormData(mappedUser);
    setErrors({});
  };

  const handleEditClose = () => {
    setEditUser(null);
    setErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const mobileRegex = /^[0-9]{10}$/;

    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 letters";
    }
    if (!formData.surName) newErrors.surName = "Surname is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.userName) newErrors.userName = "Username is required";
    if (!formData.mobile) newErrors.mobile = "Mobile is required";
    else if (!mobileRegex.test(formData.mobile))
      newErrors.mobile = "Mobile must be 10 digits";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Enter a valid email (e.g. name@gmail.com)";

    if (!formData.address) newErrors.address = "Address is required";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    return newErrors;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Regex patterns
    const mobileRegex = /^[0-9]{10}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Validate fields
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 letters";
    }

    if (!formData.surName) newErrors.surName = "Surname is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.userName) newErrors.userName = "Username is required";
    if (!formData.address) newErrors.address = "Address is required";

    if (!formData.mobile || !mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "📱 Mobile number must be 10 digits";
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email =
        "📧 Please enter a valid email address (e.g., user@gmail.com)";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = " Password and Confirm Password do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const payload = {
      Id: editUser.id,
      Title: formData.title,
      Name: formData.name,
      SurName: formData.surName,
      Gender: formData.gender,
      Address: formData.address,
      Mobile: formData.mobile,
      UserName: formData.userName,
      Email: formData.email,
      Password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      setLoadingUpdate(true);
      await dispatch(fetchupdateUser(payload)).unwrap();

      alertify
        .alert("Success", "User updated successfully!")
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);

      setEditUser(null);
      dispatch(getuserslist());
      setErrors({});
    } catch (err) {
      console.error(err);

      alertify
        .alert("error", "No changes found.")
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const getInputClass = (field) => (errors[field] ? "invalid-input" : "");

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(fetchDeleteUser(deleteTargetId)).unwrap();
      dispatch(getuserslist());
      alertify
        .alert("Success", "User deleted successfully.")
        .set({ label: "OK", transition: "fade", closable: true });
    } catch (error) {
      alertify
        .alert("Error", "Failed to delete user.")
        .set({ label: "OK", transition: "fade", closable: true });
    } finally {
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    }
  };
  return (
    <div className="Userlist-container">
      {/* Header */}
      <div className="list-header">
        <h2 className="Userlisttitle">Users List</h2>

        <HoloButton
          variant="secondary"
          size="md"
          onClick={() => setShowHelp(true)}
        >
          <i className="fas fa-question-circle"></i> Help
        </HoloButton>
      </div>

      <hr className="section-divider" />

      {/* Filter Section */}
      <div className="filter-section">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={tempFilters.name}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              name: e.target.value,
            })
          }
        />

        <select
          value={tempFilters.company}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              company: e.target.value,
            })
          }
        >
          <option value="">Select Company</option>

          {companiesforfilter.map((company) => (
            <option key={company.companyName} value={company.companyName}>
              {company.companyName}
            </option>
          ))}
        </select>

        <select
          value={tempFilters.role}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              role: e.target.value,
            })
          }
        >
          <option value="">Select Role</option>

          {roleslistwithfilter.map((role) => (
            <option key={role.roleName} value={role.roleName}>
              {role.roleName}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Email"
          value={tempFilters.email}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              email: e.target.value,
            })
          }
        />

        <HoloButton variant="primary" size="md" onClick={handleApplyFilters}>
          <i className="fas fa-filter"></i> Filter
        </HoloButton>

        <HoloButton
          variant="secondary"
          size="md"
          onClick={() => {
            const clearedFilters = {
              name: "",
              company: "",
              role: "",
              username: "",
              email: "",
            };

            setTempFilters(clearedFilters);
            setFilters(clearedFilters);
            setCurrentPage(1);
          }}
        >
          <i className="fas fa-times-circle"></i> Clear
        </HoloButton>
      </div>

      {/* Records Per Page */}
      <div className="pagination-controls">
        <label>Records per page:</label>

        <select value={recordsPerPage} onChange={handleRecordsChange}>
          <option value={2}>2</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Table Card */}
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("name")}>
              NAME{" "}
              {sortConfig.key === "name"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : "↑"}
            </th>

            <th>ROLE</th>
            <th>USER NAME</th>
            <th>COMPANY</th>
            <th>EMAIL</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {loadingTable ? (
            <tr>
              <td colSpan={8}>
                <div className="table-loader-container">
                  <div className="table-loader"></div>
                </div>
              </td>
            </tr>
          ) : (
            currentRecords.length ? (
              currentRecords.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.roleName}</td>
                  <td>{user.userName}</td>
                  <td>{user.companyName}</td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>

                  <td>
                    <div className="actions-cell">
                      <FaEye
                        className="action-icon view-icon"
                        onClick={() => handleViewClick(user)}
                      />

                      <FaEdit
                        className="action-icon edit-icon"
                        onClick={() => handleEditClick(user)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>No records found</td>
              </tr>
            )
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

      {/* ── User View Modal ── */}
      {selectedUser && (
        <div className="user-view-overlay viewpopup-modern">
          <div className="user-view-modal">
            <div className="user-view-header">
              <h3 className="user-view-title">User Details</h3>
              <button
                className="user-view-close-btn"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="user-view-body">
              {/* ── Personal Information ── */}
              <div className="vp-section">
                <h4 className="user-view-section-title">
                  Personal Information
                </h4>
                <div className="user-view-info">
                  <div>
                    <span className="label">Title</span>
                    <span>:</span>
                    <span>{selectedUser.title || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Name</span>
                    <span>:</span>
                    <span>{selectedUser.name || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Surname</span>
                    <span>:</span>
                    <span>{selectedUser.surName || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Gender</span>
                    <span>:</span>
                    <span>{selectedUser.gender || "-"}</span>
                  </div>
                </div>
              </div>

              {/* ── Contact Information ── */}
              <div className="vp-section">
                <h4 className="user-view-section-title">Contact Information</h4>
                <div className="user-view-info">
                  <div>
                    <span className="label">Username</span>
                    <span>:</span>
                    <span>{selectedUser.userName || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Email</span>
                    <span>:</span>
                    <span>{selectedUser.email || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Mobile</span>
                    <span>:</span>
                    <span>{selectedUser.mobile || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Address</span>
                    <span>:</span>
                    <span>{selectedUser.address || "-"}</span>
                  </div>
                </div>
              </div>

              {/* ── Company Information ── */}
              <div className="vp-section">
                <h4 className="user-view-section-title">Company Information</h4>
                <div className="user-view-info">
                  <div>
                    <span className="label">Company</span>
                    <span>:</span>
                    <span>{selectedUser.companyName || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Role</span>
                    <span>:</span>
                    <span>{selectedUser.roleName || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Status</span>
                    <span>:</span>
                    <span>{selectedUser.status || "-"}</span>
                  </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      {editUser && (
        <div className="useredit-modal-overlay">
          <div className="useredit-modal">
            <button className="useredit-close" onClick={handleEditClose}>
              &times;
            </button>
            <h3 className="useredit-title">Edit User</h3>

            <form onSubmit={handleEditSubmit} className="useredit-form">
              {/* Name & Surname */}
              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    // onChange={(e) => {
                    //   const value = e.target.value;

                    //   // Allow only alphabets and spaces
                    //   const regex = /^[A-Za-z\s]*$/;

                    //   if (regex.test(value)) {
                    //     setFormData({ ...formData, name: value });
                    //     setErrors({
                    //       ...errors,
                    //       name: value.trim() ? "" : "Name is required",
                    //     });
                    //   }
                    // }}

                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only alphabets and spaces
                      const regex = /^[A-Za-z\s]*$/;

                      if (regex.test(value)) {
                        setFormData({ ...formData, name: value });

                        let error = "";

                        if (!value.trim()) {
                          error = "Name is required";
                        } else if (value.trim().length < 3) {
                          error = "Name must be at least 3 letters";
                        }

                        setErrors({
                          ...errors,
                          name: error,
                        });
                      }
                    }}
                    className={errors.name ? "invalid-input" : ""}
                  />
                  {errors.name && (
                    <span className="error-text">{errors.name}</span>
                  )}
                </div>

                <div className="useredit-field">
                  <label>
                    Surname <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="surName"
                    value={formData.surName || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const regex = /^[A-Za-z\s]*$/; // Allows only letters and spaces

                      if (regex.test(value)) {
                        setFormData({ ...formData, surName: value });
                        setErrors({
                          ...errors,
                          surName: value.trim() ? "" : "Surname is required",
                        });
                      }
                    }}
                    className={errors.surName ? "invalid-input" : ""}
                  />
                  {errors.surName && (
                    <span className="error-text">{errors.surName}</span>
                  )}
                </div>
              </div>

              {/* Title & Gender */}
              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Title <span className="required">*</span>
                  </label>
                  <select
                    name="title"
                    value={formData.title || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, title: value });
                      setErrors({
                        ...errors,
                        title: value ? "" : "Title is required",
                      });
                    }}
                    className={errors.title ? "invalid-input" : ""}
                  >
                    <option value="">Select Title</option>
                    <option value="Miss">Miss</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                  </select>
                  {errors.title && (
                    <span className="error-text">{errors.title}</span>
                  )}
                </div>

                <div className="useredit-field">
                  <label>
                    Gender <span className="required">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, gender: value });
                      setErrors({
                        ...errors,
                        gender: value ? "" : "Gender is required",
                      });
                    }}
                    className={errors.gender ? "invalid-input" : ""}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Female">Others</option>
                  </select>
                  {errors.gender && (
                    <span className="error-text">{errors.gender}</span>
                  )}
                </div>
              </div>

              {/* Username & Email */}
              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Username <span className="required">*</span>
                  </label>
                  {/* <input
                    type="text"
                    name="userName"
                    value={formData.userName || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // const regex = /^[A-Za-z0-9_]*$/; // Only letters, numbers, and underscores

                      if (regex.test(value)) {
                        setFormData({ ...formData, userName: value });
                        setErrors({
                          ...errors,
                          userName: value.trim() ? "" : "Username is required",
                        });
                      }
                    }}
                    className={errors.userName ? "invalid-input" : ""}
                  /> */}

                  <input
                    type="text"
                    name="userName"
                    value={formData.userName || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({ ...formData, userName: value });
                      setErrors({
                        ...errors,
                        userName: value.trim() ? "" : "Username is required",
                      });
                    }}
                    className={errors.userName ? "invalid-input" : ""}
                  />
                  {errors.userName && (
                    <span className="error-text">{errors.userName}</span>
                  )}
                </div>

                <div className="useredit-field">
                  <label>
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const emailRegex =
                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                      setFormData({ ...formData, email: value });
                      setErrors({
                        ...errors,
                        email: !value
                          ? "Email is required"
                          : !emailRegex.test(value)
                            ? "Invalid email"
                            : "",
                      });
                    }}
                    className={errors.email ? "invalid-input" : ""}
                    readOnly
                    style={{ backgroundColor: "rgb(233, 236, 239)" }}
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>
              </div>

              {/* Mobile & Address */}
              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Mobile <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow only digits (no alphabets or special characters)
                      if (/^[0-9]*$/.test(value)) {
                        setFormData({ ...formData, mobile: value });
                        setErrors({
                          ...errors,
                          mobile: !value
                            ? "Mobile number is required"
                            : value.length !== 10
                              ? "Mobile must be 10 digits"
                              : "",
                        });
                      }
                    }}
                    className={errors.mobile ? "invalid-input" : ""}
                  />
                  {errors.mobile && (
                    <span className="error-text">{errors.mobile}</span>
                  )}
                </div>

                <div className="useredit-field">
                  <label>
                    Address <span className="required">*</span>
                  </label>
                  <textarea
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, address: value });
                      setErrors({
                        ...errors,
                        address: value.trim() ? "" : "Address is required",
                      });
                    }}
                    className={errors.address ? "invalid-input" : ""}
                  />
                  {errors.address && (
                    <span className="error-text">{errors.address}</span>
                  )}
                </div>
              </div>

              {/* Role & Company */}
              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Role <span className="required">*</span>
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, roleId: value });
                      setErrors({
                        ...errors,
                        roleId: value ? "" : "Role is required",
                      });
                    }}
                    className={errors.roleId ? "invalid-input" : ""}
                  >
                    <option value="">Select Role</option>

                    {roles
                      .filter((r) => /^[A-Za-z0-9\s_]+$/.test(r.roleName)) // ✅ allows only letters, numbers, spaces, and underscore
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleName}
                        </option>
                      ))}
                  </select>

                  {errors.roleId && (
                    <span className="error-text">{errors.roleId}</span>
                  )}
                </div>

                <div className="useredit-field">
                  <label>
                    Company <span className="required">*</span>
                  </label>
                  <select
                    name="companyId"
                    value={formData.companyId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, companyId: value });
                      setErrors({
                        ...errors,
                        companyId: value ? "" : "Company is required",
                      });
                    }}
                    className={errors.companyId ? "invalid-input" : ""}
                  >
                    <option value="">Select Company</option>
                    {companyListwithstatus.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.companyId && (
                    <span className="error-text">{errors.companyId}</span>
                  )}
                </div>
              </div>

              {/* IsActive & IsDeleted */}
              <div className="useredit-row">
                 <div className="useredit-field">
                  <label>
                    Status <span className="required">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, status: value });
                      setErrors({
                        ...errors,
                        status: value ? "" : "Status is required",
                      });
                    }}
                    className={errors.status ? "invalid-input" : ""}
                  >
                    <option value="">Select Status</option>
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                  {errors.status && (
                    <span className="error-text">{errors.status}</span>
                  )}
                </div>

                <div className="useredit-field">
                </div>
              </div>

              {/* Buttons */}
              <div className="useredit-buttons">
                <button
                  type="submit"
                  className="useredit-update-btn"
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? <span className="button-loader"></span> : ""}{" "}
                  Update
                </button>
                <button
                  type="button"
                  className="useredit-cancel-btn"
                  onClick={handleEditClose}
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
        title="Users List - Help & Overview"
        screenName="UserSList"
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default UsersList;
