import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../UsersList/UsersList.css';
import './UserVerification.css';

import {
  getUsersListforApproval,
  approveUser,
  declineUser,
  mapUserRoleCompanies,
  approveAndMapUser,
  fetchupdateUser
} from "../../redux/UserVerificationSlice";
import {  fetchActiveUrl } from '../../redux/RegistrationSlice';

import { fetchRoles } from "../../redux/EditProfileSlice";

import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";

import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";

import { fetchCompanieswithdeactivestatus } from "../../redux/CustomerSlice";

import Pagination from "../../components/Common/Pagination";
import HoloButton from "../../components/Common/HoloButton";
import { FaTimesCircle, FaCheckCircle, FaLink, FaEye, FaDownload, FaFileAlt, FaFileInvoiceDollar, FaMoneyCheckAlt, FaReceipt, FaFileInvoice, FaEdit } from "react-icons/fa";
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
const UserVerification = () => {
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
  const companyListwithstatus = useSelector(
    (state) => state.Customers.companieslist,
  );

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ── Role & Company mapping modal ──
  const [mappingUser, setMappingUser] = useState(null);
  const [mappingRoleId, setMappingRoleId] = useState("");
  const [mappingCompanyIds, setMappingCompanyIds] = useState([]);
  const [mappingCompanySearch, setMappingCompanySearch] = useState("");
  const [savingMapping, setSavingMapping] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionLoadingType, setActionLoadingType] = useState(null); // 'approve' | 'decline'

  // ── Decline with reason (Approved users) ──
  const [declineReasonUser, setDeclineReasonUser] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [decliningWithReason, setDecliningWithReason] = useState(false);
   const {activeurl } = useSelector((state) => state.registration);
   const roleName = sessionStorage.getItem('roleName') || '';
    const isSuperAdmin = roleName.toLowerCase().replace(/\s+/g, '') === 'superadmin';
  useEffect(() => {
    loadUsers();
  }, []);

const loadUsers = async () => {
  setLoadingTable(true);

  try {
    const result = await dispatch(
      getUsersListforApproval()
    ).unwrap();

    console.log("USERS LOADED IN COMPONENT:", result);
    console.log("USER COUNT:", result?.length);
  } catch (error) {
    console.error("Error loading approval users:", error);
  } finally {
    setLoadingTable(false);
  }
};

  const [filters, setFilters] = useState({
    name: "",
    status: "",
    username: "",
    email: "",
    activation: "",
  });

  const [tempFilters, setTempFilters] = useState({
    name: "",
    status: "",
    username: "",
    email: "",
    activation: "",
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
  loadUsers();

  dispatch(fetchRoles());
  dispatch(fetchCompanieswithdeactivestatus());
}, [dispatch]);



  const getUserRoleId = (user) => {
    if (user?.roleId !== undefined && user?.roleId !== null && user?.roleId !== "") {
      return user.roleId;
    }

    const roleId = user?.RoleId ?? user?.roleID ?? user?.role_id;
    if (roleId !== undefined && roleId !== null && roleId !== "") {
      return roleId;
    }

    const roleObj = roles.find(
      (r) =>
        String(r.id) === String(user?.id) ||
        r.roleName === user?.roleName ||
        r.roleName === user?.RoleName ||
        r.roleName?.toLowerCase() === user?.roleName?.toLowerCase() ||
        r.roleName?.toLowerCase() === user?.RoleName?.toLowerCase()
    );

    return roleObj?.id ?? "";
  };

  const getUserStatusValue = (user) => {
    const rawValue = user?.status 

    const value = String(rawValue ?? "").trim();

    if (!value) return "Active";
    if (["active", "yes", "true", "1", "y", "enabled", "enable"].includes(value.toLowerCase())) return "Active";
    if (["inactive", "no", "false", "0", "n", "disabled", "disable"].includes(value.toLowerCase())) return "Inactive";
    if (["approved", "approval", "verified"].includes(value.toLowerCase())) return "Approved";
    if (["declined", "rejected", "denied", "cancelled"].includes(value.toLowerCase())) return "Declined";

    return value;
  };



  const handleToggleEditCompany = (companyId) => {
    setFormData((prev) => {
      const currentCompanyIds = Array.isArray(prev.companyIds)
        ? prev.companyIds
        : prev.companyId
          ? [prev.companyId]
          : [];

      const nextCompanyIds = currentCompanyIds.includes(companyId)
        ? currentCompanyIds.filter((id) => id !== companyId)
        : [...currentCompanyIds, companyId];

      return {
        ...prev,
        companyIds: nextCompanyIds,
        companyId: nextCompanyIds[0] || "",
      };
    });

    setErrors((prev) => ({ ...prev, companyIds: "" }));
  };

  const handleEditClick = (user) => {
    debugger;

    console.log("User",user);
    const selectedCompanyIds = Array.isArray(user.companyMappings)
      ? user.companyMappings
          .map((mapping) => mapping.companyId ?? mapping.id)
          .filter((id) => id !== null && id !== undefined && id !== "")
      : user.companyId !== undefined && user.companyId !== null && user.companyId !== ""
        ? [user.companyId]
        : user.CompanyId !== undefined && user.CompanyId !== null && user.CompanyId !== ""
          ? [user.CompanyId]
          : [];

    const companyObj =
      companyListwithstatus.find(
        (c) =>
          String(c.id) === String(user?.companyId ?? user?.CompanyId) ||
          c.companyName === user?.companyName ||
          c.companyName === user?.CompanyName
      ) ||
      {};
    const roleObj = roles.find(
      (r) =>
        String(r.id) === String(user?.roleId ?? user?.RoleId) ||
        r.roleName === user?.roleName ||
        r.roleName === user?.RoleName
    ) || {};

    const mappedUser = {
      ...user,
      companyId: selectedCompanyIds[0] ?? companyObj.id ?? "",
      companyIds: selectedCompanyIds.length ? selectedCompanyIds : companyObj.id ? [companyObj.id] : [],
      roleId: getUserRoleId(user) || roleObj.id || "",
      title: user.title || user.Title || "",
      gender: user.gender || user.Gender || "",
      address: user.address || user.Address || "",
      IsActive: user.isActive || user.IsActive || "",
      IsDeleted: user.isDeleted || user.IsDeleted || "",
      status: user.status,
      activation : user.activation,
      password: "",
      confirmPassword: "",
    };

    setEditUser(mappedUser);
    setFormData(mappedUser);
    setErrors({});
  };

  const validateEditForm = () => {
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
    if (!formData.roleId) newErrors.roleId = "Role is required";
    if (!formData.status) newErrors.status = "Activation is required";
    if (!Array.isArray(formData.companyIds) || formData.companyIds.length === 0) {
      newErrors.companyIds = "Select at least one company";
    }

    return newErrors;
  };

  const handleEditSubmit = async (e) => {
  e.preventDefault();

  const newErrors = validateEditForm();
  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  const payload = {
    Id: Number(editUser.id),
    RoleId: formData.roleId ? Number(formData.roleId) : null,
    CompanyId: formData.companyId ? Number(formData.companyId) : null,
    CompanyIds: Array.isArray(formData.companyIds)
      ? formData.companyIds.map((c) => Number(c))
      : formData.companyId
      ? [Number(formData.companyId)]
      : [],
    Title: formData.title,
    Name: formData.name,
    SurName: formData.surName,
    Gender: formData.gender,
    Address: formData.address,
    Mobile: formData.mobile,
    UserName: formData.userName,
    Email: formData.email,
    Activation: formData.activation,
    Status: formData.status,
  };

  try {
    setLoadingUpdate(true);

    // Get API response
    const response = await dispatch(
      fetchupdateUser(payload)
    ).unwrap();

    console.log("Update User Response:", response);

    // Show success message from API
    alertify
      .alert(
        "Success",
        response?.message || "User updated successfully!"
      )
      .set("label", "OK")
      .set("transition", "fade")
      .set("closable", true);

    setEditUser(null);

    await dispatch(getUsersListforApproval()).unwrap();

    setErrors({});

  } catch (err) {
    console.error("Update User Error:", err);

    // Get message returned by API
    const errorMessage =
      typeof err === "string"
        ? err
        : err?.message || "Failed to update user.";

    alertify
      .alert("Error", errorMessage)
      .set("label", "OK")
      .set("transition", "fade")
      .set("closable", true);

  } finally {
    setLoadingUpdate(false);
  }
};

  useEffect(() => {
    dispatch(fetchActiveUrl());
  }, [dispatch]);

  const redirectUrl = `${activeurl?.[0] || ""}activation`;
   const registrationUrl = `${activeurl?.[0] || ""}register`;
  const handleApproveClick = (user) => {

  console.log("APPROVE CLICKED");
  console.log("USER:", user);

  alertify.confirm(
    "Confirm Approval",
    `Are you sure you want to approve ${user.name || "this user"}?`,

    async function () {

      try {

        setActionLoadingId(user.id);
        setActionLoadingType("approve");

        console.log("USER ID:", user.id);
        console.log("ACTIVATION URL:", redirectUrl);

        if (!user?.id) {
          alertify.error("User ID is missing.");
          return;
        }

        if (!redirectUrl) {
          alertify.error("Activation URL is missing.");
          return;
        }

        // ==========================================
        // CALL APPROVE API
        // ==========================================

        const result = await dispatch(
          approveUser({
            id: user.id,
            activationlink: redirectUrl,
          })
        ).unwrap();

        console.log("APPROVE SUCCESS:", result);


        // ==========================================
        // SUCCESS MESSAGE
        // ==========================================

        alertify
          .alert(
            "Success",
            result?.message || "User approved successfully."
          )
          .set("label", "OK")
          .set("transition", "fade")
          .set("closable", true);


        // ==========================================
        // REFRESH USER LIST
        // ==========================================

        await dispatch(
          getUsersListforApproval()
        ).unwrap();

      } catch (error) {

        console.error(
          "Approve failed:",
          error
        );

        alertify
          .alert(
            "Error",
            error || "Failed to approve user."
          )
          .set("label", "OK")
          .set("transition", "fade")
          .set("closable", true);

      } finally {

        setActionLoadingId(null);
        setActionLoadingType(null);

      }

    },

    function () {

      alertify
        .alert(
          "Cancelled",
          "Approval cancelled."
        )
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);

    }
  ).set("labels", {
    ok: "Yes, Approve",
    cancel: "Cancel",
  });
};
const handleDeclineClick = (user) => {

  console.log("DECLINE CLICKED:", user);

  alertify.confirm(
    "Confirm Decline",
    `Are you sure you want to decline ${user.name || "this user"}?`,

    async function () {

      alertify.prompt(
        "Decline User",
        `Reason for declining ${user.name || "this user"}.`,
        "",
        async function (_event, reason) {
          const declineReason = reason?.trim();

          if (!declineReason) {
            alertify.error("A decline reason is required.");
            return;
          }

          try {

            setActionLoadingId(user.id);
            setActionLoadingType("decline");

        if (!user?.id) {
          alertify.error("User ID is missing.");
          return;
        }

        const result = await dispatch(
          declineUser({ id: user.id })
        ).unwrap();

            console.log(
              "DECLINE SUCCESS:",
              result
            );

            alertify
              .alert(
                "Success",
                result?.message || "User declined successfully."
              )
              .set("label", "OK")
              .set("transition", "fade")
              .set("closable", true);


            await dispatch(
              getUsersListforApproval()
            ).unwrap();

          } catch (error) {

            console.error(
              "Decline failed:",
              error
            );

            alertify
              .alert(
                "Error",
                error || "Failed to decline user."
              )
              .set("label", "OK")
              .set("transition", "fade")
              .set("closable", true);

          } finally {

            setActionLoadingId(null);
            setActionLoadingType(null);

          }
        },
        function () {
          alertify.alert("Cancelled", "Decline cancelled.")
            .set("label", "OK")
            .set("transition", "fade")
            .set("closable", true);
        }
      ).set("labels", {
        ok: "Decline User",
        cancel: "Cancel",
      });

    },

    function () {

      alertify
        .alert(
          "Cancelled",
          "Decline cancelled."
        )
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);

    }
  ).set("labels", {
    ok: "Yes, Decline",
    cancel: "Cancel",
  });
};

const filteredData = userList.filter((user) => {
    const nameMatch =
      !filters.name ||
      user.name?.toLowerCase().includes(filters.name.toLowerCase());

    const statusMatch =
      !filters.status ||
      getUserStatusValue(user)?.toLowerCase() === filters.status.toLowerCase();

    const usernameMatch =
      !filters.username ||
      user.userName?.toLowerCase().includes(filters.username.toLowerCase());

    const emailMatch =
      !filters.email ||
      user.email?.toLowerCase().includes(filters.email.toLowerCase());

    const activationValue = String(
      user?.Activation ??
      user?.activation ??
      user?.isActive ??
      user?.IsActive ??
      user?.active ??
      "Active"
    ).trim().toLowerCase();

    const activationMatch =
      !filters.activation ||
      (filters.activation.toLowerCase() === "active"
        ? ["active", "yes", "true", "1", "y", "enabled", "enable"].includes(activationValue)
        : !["active", "yes", "true", "1", "y", "enabled", "enable"].includes(activationValue));

    return nameMatch && statusMatch && usernameMatch && emailMatch && activationMatch;
  });

  const statusOptions = Array.from(
    new Set(
      userList
        .map((user) => getUserStatusValue(user))
        .filter(Boolean)
    )
  );
  const hasDeclinedUsers = userList.some(
    (user) => getUserStatusValue(user)?.toLowerCase() === "declined"
  );
  const getDeclinedReason = (user) =>
    user.Reason ||
    user.reason ||
    user.declinedReason ||
    user.declineReason ||
    user.rejectionReason ||
    user.RejectionReason ||
    "-";

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

  const handleEditClose = () => {
    setEditUser(null);
    setErrors({});
  };

  const getStatusBadgeClass = (status) => {
    const normalized = String(status ?? "").trim().toLowerCase();
    if (["active", "yes", "true", "1", "y", "enabled", "enable"].includes(normalized)) return "status-badge status-active";
    if (["inactive", "no", "false", "0", "n", "disabled", "disable"].includes(normalized)) return "status-badge status-inactive";
    if (["approved", "approval", "verified"].includes(normalized)) return "status-badge status-approved";
    if (["declined", "rejected", "denied", "cancelled"].includes(normalized)) return "status-badge status-rejected";
    return "status-badge status-pending";
  };

  const handleMappingClick = (user) => {
    setMappingUser(user);
    setMappingRoleId(user.roleId ?? "");
    setMappingCompanyIds(
      Array.isArray(user.companyMappings)
        ? user.companyMappings.map((c) => c.companyId)
        : []
    );
    setMappingCompanySearch("");
  };

  const handleCloseMappingModal = () => {
    setMappingUser(null);
    setMappingRoleId("");
    setMappingCompanyIds([]);
    setMappingCompanySearch("");
  };

  const handleToggleMappingCompany = (companyId) => {
    setMappingCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSaveMapping = async () => {
    if (!mappingRoleId) {
      alertify.error("Please select a role.");
      return;
    }

    if (!mappingCompanyIds.length) {
      alertify.error("Please select at least one company.");
      return;
    }

    const needsApproval = mappingUser.status?.toLowerCase() !== "approved";

    if (needsApproval && !redirectUrl) {
      alertify.error("Activation URL is missing.");
      return;
    }

    setSavingMapping(true);

    try {
      const result = await dispatch(
        needsApproval
          ? approveAndMapUser({
              id: mappingUser.id,
              activationlink: redirectUrl,
              roleId: mappingRoleId,
              companyIds: mappingCompanyIds,
            })
          : mapUserRoleCompanies({
              id: mappingUser.id,
              roleId: mappingRoleId,
              companyIds: mappingCompanyIds,
            })
      ).unwrap();

      alertify
        .alert(
          "Success",
          result?.message ||
            (needsApproval
              ? "User approved and mapped successfully."
              : "Role and companies mapped successfully.")
        )
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);

      handleCloseMappingModal();

      await dispatch(getUsersListforApproval()).unwrap();
    } catch (error) {
      alertify
        .alert("Error", error || "Failed to save mapping.")
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);
    } finally {
      setSavingMapping(false);
    }
  };

  const handleOpenDeclineReasonPopup = (user) => {
    setDeclineReasonUser(user);
    setDeclineReason("");
  };

  const handleCloseDeclineReasonPopup = () => {
    if (decliningWithReason) return;
    setDeclineReasonUser(null);
    setDeclineReason("");
  };

  const handleSubmitDeclineWithReason = async () => {
    debugger;
    if (!declineReasonUser?.id) return;

    if (!declineReason.trim()) {
      alertify.error("Please enter a reason before declining.");
      return;
    }

    setDecliningWithReason(true);
    console.log("registrationUrl:", registrationUrl);
    try {
      const result = await dispatch(
        declineUser({ id: declineReasonUser.id, reason: declineReason.trim(), registrationUrl: registrationUrl })
      ).unwrap();

      alertify
        .alert("Success", result?.message || "User declined successfully.")
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);

      setDeclineReasonUser(null);
      setDeclineReason("");

      await dispatch(getUsersListforApproval()).unwrap();
    } catch (error) {
      alertify
        .alert("Error", error || "Failed to decline user.")
        .set("label", "OK")
        .set("transition", "fade")
        .set("closable", true);
    } finally {
      setDecliningWithReason(false);
    }
  };
  const getUserRoleName = (user) => {
  const roleId = user?.roleId ?? user?.RoleId ?? user?.roleID ?? user?.role_id;

  // RoleId 0 means role is not mapped
  if (
    roleId === undefined ||
    roleId === null ||
    roleId === "" ||
    Number(roleId) === 0
  ) {
    return "Not Mapped";
  }

  const role = roles.find(
    (r) => Number(r.id) === Number(roleId)
  );

  return role?.roleName || "Not Mapped";
};



  return (
    <div className="Userlist-container">
      {/* Header */}
      <div className="list-header">
        <h2 className="Userlisttitle">User Verification List</h2>

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
          value={tempFilters.status}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              status: e.target.value,
            })
          }
        >
          <option value="">Select Status</option>

          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={tempFilters.activation}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              activation: e.target.value,
            })
          }
        >
          <option value="">Select Activation</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
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
              status: "",
              username: "",
              email: "",
              activation: "",
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

            <th>USER NAME</th>
             <th>ROLE</th>
            <th>EMAIL</th>
            <th>MOBILE</th>
            <th>ACTIVATION</th>
            <th>STATUS</th>
            
            {hasDeclinedUsers && <th>DECLINED REASON</th>}
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {loadingTable ? (
            <tr>
              <td colSpan={hasDeclinedUsers ? 9 : 8}>
                <div className="table-loader-container">
                  <div className="table-loader"></div>
                </div>
              </td>
            </tr>
          ) : currentRecords.length ? (
            currentRecords.map((user) => {
              
              const userStatus = getUserStatusValue(user);

              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.userName}</td>
                   {/* <td>{user.roleId}</td> */}
                   <td>{getUserRoleName(user)}</td>
                  <td>{user.email}</td>
                  <td>{user.mobile}</td>
                   <td>{user.activation}</td>
                   <td>
                    <span className={getStatusBadgeClass(userStatus)}>
                      {userStatus || "-"}
                    </span>
                  </td>
                 
                  {hasDeclinedUsers && (
                    <td>
                      {userStatus?.toLowerCase() === "declined" ? (() => {
                        const declinedReason = getDeclinedReason(user);
                        return (
                          <span
                            className="declined-reason-preview"
                            title={declinedReason}
                            aria-label={`Decline reason: ${declinedReason}`}
                          >
                            {declinedReason}
                          </span>
                        );
                      })() : "-"}
                    </td>
                  )}

                  <td>
                    <div className="action-container">
                      {userStatus?.toLowerCase() !== "declined" && (
                        <div
                          onClick={() => handleEditClick(user)}
                          style={{ cursor: "pointer" }}
                          title="Edit User"
                        >
                          <FaEdit className="action-icon edit-icon" />
                        </div>
                      )}

                      {userStatus?.toLowerCase() === "approved" ? (
                        <>
                          <div
                            onClick={() => handleMappingClick(user)}
                            style={{ cursor: "pointer" }}
                          >
                            <FaLink title="Mapping" className="action-icon mapping-icon" />
                          </div>

                          <div
                            onClick={() =>
                              actionLoadingId ? null : handleOpenDeclineReasonPopup(user)
                            }
                            style={{ cursor: actionLoadingId ? "default" : "pointer" }}
                          >
                            <FaTimesCircle
                              title="Decline User"
                              className="action-icon invoicecancel-icon"
                            />
                          </div>
                        </>
                      ) : userStatus?.toLowerCase() === "declined" ? (
                        <span className="status-badge status-rejected">Declined</span>
                      ) : (
                        <>
                          <div
                            onClick={() =>
                              actionLoadingId ? null : handleMappingClick(user)
                            }
                            style={{ cursor: actionLoadingId ? "default" : "pointer" }}
                          >
                            <FaLink
                              title="Approve & Map Role/Companies"
                              className="action-icon mapping-icon"
                            />
                          </div>

                          <div
                            onClick={() =>
                              actionLoadingId ? null : handleOpenDeclineReasonPopup(user)
                            }
                            style={{ cursor: actionLoadingId ? "default" : "pointer" }}
                          >
                            {actionLoadingId === user.id && actionLoadingType === "decline" ? (
                              <span className="button-loader" title="Declining..."></span>
                            ) : (
                              <FaTimesCircle
                                title="User Declined"
                                className="action-icon invoicecancel-icon"
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={hasDeclinedUsers ? 9 : 8}>No records found</td>
            </tr>
          )}
        </tbody>
      </table>

      {!loading && totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalRecords}
          itemsPerPage={recordsPerPage}
          onPageChange={handlePageChange}
        />
      )}

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
              <div className="vp-section">
                <h4 className="user-view-section-title">Personal Information</h4>
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
                    <span>{selectedUser.status ?? selectedUser.Status ?? selectedUser.Activation ?? selectedUser.activation ?? "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mappingUser && (() => {
        const needsApproval = mappingUser.status?.toLowerCase() !== "approved";
        const filteredMappingCompanies = companyListwithstatus.filter(
          (company) =>
            company.companyName
              ?.toLowerCase()
              .includes(mappingCompanySearch.toLowerCase())
        );
        const allFilteredSelected =
          filteredMappingCompanies.length > 0 &&
          filteredMappingCompanies.every((company) =>
            mappingCompanyIds.includes(company.id)
          );

        const handleToggleSelectAllCompanies = () => {
          if (allFilteredSelected) {
            setMappingCompanyIds((prev) =>
              prev.filter(
                (id) => !filteredMappingCompanies.some((c) => c.id === id)
              )
            );
          } else {
            setMappingCompanyIds((prev) => {
              const merged = new Set(prev);
              filteredMappingCompanies.forEach((c) => merged.add(c.id));
              return Array.from(merged);
            });
          }
        };

        return (
          <div className="user-view-overlay viewpopup-modern">
            <div className="user-view-modal mapping-modal">
              <div className="user-view-header">
                <h3 className="user-view-title">
                  {needsApproval
                    ? "Approve & Map Role/Companies"
                    : "Map Role & Companies"}
                </h3>
                <button
                  className="user-view-close-btn"
                  onClick={handleCloseMappingModal}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="user-view-body">
                <div className="vp-section">
                  <h4 className="user-view-section-title">User</h4>
                  <div className="user-view-info">
                    <div>
                      <span className="label">Name</span>
                      <span>:</span>
                      <span>{mappingUser.name || "-"}</span>
                    </div>
                    <div>
                      <span className="label">Email</span>
                      <span>:</span>
                      <span>{mappingUser.email || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="vp-section">
                  <h4 className="user-view-section-title">Role</h4>
                  <select
                    className="mapping-role-select"
                    value={mappingRoleId}
                    onChange={(e) => setMappingRoleId(e.target.value)}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="vp-section">
                  <h4 className="user-view-section-title">
                    Companies{" "}
                    <span className="mapping-selected-count">
                      ({mappingCompanyIds.length} selected)
                    </span>
                  </h4>

                  <input
                    type="text"
                    className="mapping-company-search"
                    placeholder="Search company..."
                    value={mappingCompanySearch}
                    onChange={(e) => setMappingCompanySearch(e.target.value)}
                  />

                  <label className="mapping-select-all">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAllCompanies}
                      disabled={filteredMappingCompanies.length === 0}
                    />
                    <span>Select All</span>
                  </label>

                  <div className="mapping-company-grid">
                    {filteredMappingCompanies.map((company) => (
                      <label
                        key={company.id}
                        className="mapping-company-item"
                      >
                        <input
                          type="checkbox"
                          checked={mappingCompanyIds.includes(company.id)}
                          onChange={() =>
                            handleToggleMappingCompany(company.id)
                          }
                        />
                        <span>{company.companyName}</span>
                      </label>
                    ))}

                    {filteredMappingCompanies.length === 0 && (
                      <div className="mapping-no-companies">
                        No companies available.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mapping-modal-footer">
                <HoloButton
                  variant="secondary"
                  size="md"
                  onClick={handleCloseMappingModal}
                >
                  Cancel
                </HoloButton>

                <HoloButton
                  variant="primary"
                  size="md"
                  onClick={handleSaveMapping}
                  disabled={savingMapping}
                >
                  {savingMapping
                    ? "Saving..."
                    : needsApproval
                    ? "Approve & Save"
                    : "Save Mapping"}
                </HoloButton>
              </div>
            </div>
          </div>
        );
      })()}

      {declineReasonUser && (
        <div className="user-view-overlay viewpopup-modern">
          <div className="user-view-modal">
            <div className="user-view-header">
              <h3 className="user-view-title">Decline User</h3>
              <button
                className="user-view-close-btn"
                onClick={handleCloseDeclineReasonPopup}
                aria-label="Close"
                disabled={decliningWithReason}
              >
                &times;
              </button>
            </div>

            <div className="user-view-body">
              <div className="vp-section">
                <div className="user-view-info">
                  <div>
                    <span className="label">Name</span>
                    <span>:</span>
                    <span>{declineReasonUser.name || "-"}</span>
                  </div>
                  <div>
                    <span className="label">Email</span>
                    <span>:</span>
                    <span>{declineReasonUser.email || "-"}</span>
                  </div>
                </div>

                <h4 className="user-view-section-title" style={{ marginTop: "16px" }}>
                  Reason for Decline
                </h4>
                <textarea
                  placeholder="Enter decline reason..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                  style={{ width: "100%" }}
                  autoFocus
                  disabled={decliningWithReason}
                />
              </div>
            </div>

            <div className="mapping-modal-footer">
              <HoloButton
                variant="secondary"
                size="md"
                onClick={handleCloseDeclineReasonPopup}
                disabled={decliningWithReason}
              >
                Cancel
              </HoloButton>

              <HoloButton
                variant="primary"
                size="md"
                onClick={handleSubmitDeclineWithReason}
                disabled={decliningWithReason}
              >
                {decliningWithReason ? "Declining..." : "Decline"}
              </HoloButton>
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editUser && (
        <div className="useredit-modal-overlay">
          <div className="useredit-modal">
            <button className="useredit-close" onClick={handleEditClose}>
              &times;
            </button>
            <h3 className="useredit-title">Edit User</h3>

            <form onSubmit={handleEditSubmit} className="useredit-form">
              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const regex = /^[A-Za-z\s]*$/;
                      if (regex.test(value)) {
                        setFormData({ ...formData, name: value });
                        let error = "";
                        if (!value.trim()) {
                          error = "Name is required";
                        } else if (value.trim().length < 3) {
                          error = "Name must be at least 3 letters";
                        }
                        setErrors({ ...errors, name: error });
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
                      const regex = /^[A-Za-z\s]*$/;
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
                    <option value="Others">Others</option>
                  </select>
                  {errors.gender && (
                    <span className="error-text">{errors.gender}</span>
                  )}
                </div>
              </div>

              <div className="useredit-row">
                <div className="useredit-field">
                  <label>
                    Username <span className="required">*</span>
                  </label>
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
                      .filter((r) => /^[A-Za-z0-9\s_]+$/.test(r.roleName))
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
                    Activation <span className="required">*</span>
                  </label>
                  <select
                    name="activation"
                    value={formData.activation || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, activation: value });
                      setErrors({
                        ...errors,
                        activation: value ? "" : "Activation is required",
                      });
                    }}
                    className={errors.activation ? "invalid-input" : ""}
                  >
                    <option value="">Select Activation</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {errors.activation && (
                    <span className="error-text">{errors.activation}</span>
                  )}
                </div>
              </div>

              <div className="useredit-row">
                <div className="useredit-field" style={{ width: "100%" }}>
                  <label>
                    Assigned Companies <span className="required">*</span>
                  </label>
                  <div className="mapping-company-grid" style={{ maxHeight: "180px" }}>
                    {companyListwithstatus.map((company) => (
                      <label key={company.id} className="mapping-company-item">
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(formData.companyIds)
                              ? formData.companyIds.includes(company.id)
                              : formData.companyId === company.id
                          }
                          onChange={() => handleToggleEditCompany(company.id)}
                        />
                        <span>{company.companyName}</span>
                      </label>
                    ))}
                  </div>
                  {errors.companyIds && (
                    <span className="error-text">{errors.companyIds}</span>
                  )}
                </div>
              </div>

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
        title="User Verification List - Help & Overview"
        screenName="UserVerification"
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default UserVerification;
