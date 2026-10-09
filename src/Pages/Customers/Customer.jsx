import React, { useState, useEffect } from "react";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import "./Customers.css";
import { fetchcustomerlist, fetchCompanieswithfilter, createcustomer, updatecustomer, deletecustomer, fetchCompanieswithdeactivestatus } from '../../redux/CustomerSlice';
import { useDispatch, useSelector } from 'react-redux';
import HelpModal from "../../components/Common/HelpModal";
import useSort from "../../components/Common/useSort";
import Pagination from "../../components/Common/Pagination";
import { allowAlphaNumeric, isAlphaNumeric } from "../../validations/InputValdation";
import { FaEdit, FaTrash } from "react-icons/fa";
import HoloButton from "../../components/Common/HoloButton";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../../components/ui';

const Customer = () => {
    const [showCreateScreen, setShowCreateScreen] = useState(false);
    const [showEditScreen, setShowEditScreen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({});
    const [editItem, setEditItem] = useState(null);
    const dispatch = useDispatch();
    const [showHelp, setShowHelp] = useState(false);


    // Get customers and companies from Redux store
    // Make sure this matches your slice name in the store
    const customerList = useSelector((state) => state.Customers.Customerslist);
    const companieswithfilter = useSelector((state) => state.Customers.companies);
    const companyList = useSelector((state) => state.Customers.companieslist);
    //console.log('customerList',customerList)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // start loader
            try {
                await dispatch(fetchcustomerlist());
                await dispatch(fetchCompanieswithfilter());
                await dispatch(fetchCompanieswithdeactivestatus());
            } catch (err) {
                console.error("Error fetching customers/companies:", err);
            } finally {
                setLoading(false); // stop loader after fetch completes
            }
        };

        fetchData();
    }, [dispatch]);

    const [filters, setFilters] = useState({ name: "", customerRefNo: "", email: "", companyName: "", });



    useEffect(() => {
        if (showEditScreen && editItem && companyList.length > 0) {

            const selectedCompany = companyList.find(
                c => c.id === Number(editItem.companyId)
            );

            if (selectedCompany) {
                setEditItem(prev => ({
                    ...prev,
                    vatNumber: selectedCompany.vatNumber
                }));
            }
        }
    }, [showEditScreen, companyList]);
    // Pagination


    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(5);


    //Handling State for Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDeleteId, setCustomerToDeleteId] = useState(null);

    // Filtered + Paginated Data
    // 1️⃣ Filter
    const filteredCustomers = customerList.filter((customer) => {
        const fullName = `${customer.name} ${customer.surName}`.toLowerCase();
        return (
            (filters.name === "" || fullName.includes(filters.name.toLowerCase())) &&
            (filters.companyName === "" || customer.companyName?.toLowerCase().includes(filters.companyName.toLowerCase())) &&
            (filters.email === "" || customer.email?.toLowerCase().includes(filters.email.toLowerCase())) &&
            (filters.customerRefNo === "" || customer.customerRefNo?.toString().toLowerCase().includes(filters.customerRefNo.toLowerCase()))
        );
    });

    // 2️⃣ Sort (using your custom hook)
    const { sortedData, requestSort, sortConfig } = useSort(filteredCustomers);


    const totalPages = Math.ceil(sortedData.length / recordsPerPage);
    const paginatedCustomers = sortedData.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );


    const [buttonLoading, setButtonLoading] = useState(false);
    const [createErrors, setCreateErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});

    const handleCreateAlphaNumericInput = (
        e,
        fieldName,
        newItem,
        setNewItem,
        createErrors,
        setCreateErrors
    ) => {
        const rawValue = e.target.value;
        const cleanedValue = allowAlphaNumeric(rawValue);

        setNewItem({ ...newItem, [fieldName]: cleanedValue });

        if (cleanedValue.trim() === "") {
            setCreateErrors({ ...createErrors, [fieldName]: `${fieldName} is required` });
        } else if (!isAlphaNumeric(cleanedValue)) {
            setCreateErrors({
                ...createErrors,
                [fieldName]: "Only letters, numbers, and spaces are allowed",
            });
        } else {
            setCreateErrors({ ...createErrors, [fieldName]: "" });
        }
    };
    const handleEditAlphaNumericInput = (
        e,
        fieldName,
        editItem,
        setEditItem,
        editErrors,
        setEditErrors,
        messages = {}
    ) => {
        const rawValue = e.target.value;
        const cleanedValue = allowAlphaNumeric(rawValue);

        setEditItem({ ...editItem, [fieldName]: cleanedValue });

        if (cleanedValue.trim() === "") {
            setEditErrors({
                ...editErrors,
                [fieldName]: messages.required || `${fieldName} is required`,
            });
        } else if (!isAlphaNumeric(cleanedValue)) {
            setEditErrors({
                ...editErrors,
                [fieldName]:
                    messages.invalid || "Only letters, numbers, and spaces are allowed",
            });
        } else {
            setEditErrors({ ...editErrors, [fieldName]: "" });
        }
    };



    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validateTenDigits = (value) => {
        const regex = /^\d{10}$/; // exactly 10 digits
        return regex.test(value);
    };

    const validateName = (name) => {
        // Allows only letters and spaces, minimum 3 letters (spaces ignored)
        return /^[A-Za-z ]+$/.test(name) && name.replace(/\s/g, "").length >= 3;
    };
    const handleSaveCustomer = async (e) => {
        debugger
        e.preventDefault();
        setButtonLoading(true);

        // Reset errors

        let hasError = false;
        const newErrors = {};
        if (!newItem.title) {
            newErrors.title = "Title is required";
            hasError = true;
        }
        if (!newItem.gender) {
            newErrors.gender = "Gender is required";
            hasError = true;
        }
        // if (!newItem.username) {
        //     newErrors.username = "Username is required";
        //     hasError = true;
        // }
        // if (!newItem.name) {
        //     newErrors.name = "Name is required";
        //     hasError = true;
        // }
        if (!newItem.name?.trim()) {
            newErrors.name = "Name is required";
            hasError = true;
        } else if (!validateName(newItem.name)) {
            newErrors.name = "Name must contain at least 3 letters";
            hasError = true;
        }
        if (!newItem.surname) {
            newErrors.surname = "Surname is required";
            hasError = true;
        }
        if (!newItem.email || !validateEmail(newItem.email)) {
            newErrors.email = "Valid email is required";
            hasError = true;
        }
        if (!newItem.mobile || !validateTenDigits(newItem.mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
            hasError = true;
        }
        // if (!newItem.customerAccountNo || !validateTenDigits(newItem.customerAccountNo)) {
        //     newErrors.customerAccountNo = "Customer Account No must be 10 digits";
        //     hasError = true;
        // }
        if (!newItem.companyId) {
            newErrors.companyId = "Company is required";
            hasError = true;
        }
        if (!newItem.address) {
            newErrors.address = "Address is required";
            hasError = true;
        }
        if (hasError) {
            setCreateErrors(newErrors);
            setButtonLoading(false);
            return;
        }
        try {
            const resultAction = await dispatch(createcustomer(newItem));
            if (createcustomer.fulfilled.match(resultAction)) {
                const message = resultAction.payload.message; // get API message
                alertify.alert('Success', message);
                setShowCreateScreen(false);
                setNewItem({});
                dispatch(fetchcustomerlist());
            } else {
                alertify.alert('error', resultAction.payload || "Failed to save customer");
            }
        } catch (err) {
            console.log("Save error:", err);
            alertify.alert('error', "Something went wrong");
        } finally {
            setButtonLoading(false);
        }
    };

    const handleEditCustomer = async (e) => {
        debugger;
        e.preventDefault();
        setButtonLoading(true);
        let hasError = false;
        const newErrors = {};
        if (!editItem.title) {
            newErrors.title = "Title is required";
            hasError = true;
        }
        if (!editItem.gender) {
            newErrors.gender = "Gender is required";
            hasError = true;
        }
        if (!editItem.userName) {
            newErrors.userName = "Username is required";
            hasError = true;
        }
        // if (!editItem.name) {
        //     newErrors.name = "Name is required";
        //     hasError = true;
        // }
        if (!editItem.name?.trim()) {
            newErrors.name = "Name is required";
            hasError = true;
        } else if (!validateName(editItem.name)) {
            newErrors.name = "Name must contain at least 3 letters";
            hasError = true;
        }
        if (!editItem.surName) {
            newErrors.surName = "Surname is required";
            hasError = true;
        }
        if (!editItem.email || !validateEmail(editItem.email)) {
            newErrors.email = "Valid email is required";
            hasError = true;
        }
        if (!editItem.mobile || !validateTenDigits(editItem.mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
            hasError = true;
        }
        // if (!editItem.customerAccountNo || !validateTenDigits(editItem.customerAccountNo)) {
        //     newErrors.customerAccountNo = "Customer Account No must be 10 digits";
        //     hasError = true;
        // }
        if (!editItem.companyId) {
            newErrors.companyId = "Company is required";
            hasError = true;
        }
        if (!editItem.address) {
            newErrors.address = "Address is required";
            hasError = true;
        }
        if (!editItem.status) {
            newErrors.status = "Status is required";
            hasError = true;
        }
        // if (!editItem.isDeleted) {
        //     newErrors.isDeleted = "IsDeleted is required";
        //     hasError = true;
        // }

        if (hasError) {
            setEditErrors(newErrors);
            setButtonLoading(false);
            return;
        }

        try {
            const payload = { ...editItem };
            const resultAction = await dispatch(updatecustomer(payload));
            if (updatecustomer.fulfilled.match(resultAction)) {
                alertify.alert('Success', "Customer updated successfully!");
                setShowEditScreen(false);
                setEditItem(null);
                dispatch(fetchcustomerlist());
            } else {
                alertify.alert('error', resultAction.payload || "Failed to update customer");
            }
        } catch (err) {
            console.log("Edit error:", err);
            alertify.alert('error', "Something went wrong");
        } finally {
            setButtonLoading(false);
        }
    };

    //Triggered when the user clicks the Delete
    const handleTriggerDelete = (id) => {
        setCustomerToDeleteId(id);
        setShowDeleteModal(true);
    };

    // Triggered when the user clicks OK 
    // const handleConfirmDelete = async () => {
    //     if (!customerToDeleteId) return;
    //     const resultAction = await dispatch(deletecustomer(customerToDeleteId));

    //     if (deletecustomer.fulfilled.match(resultAction)) {
    //         dispatch(fetchcustomerlist());
    //     }

    //     // Reset state and close modal
    //     setCustomerToDeleteId(null);
    //     setShowDeleteModal(false);
    // };
  const handleConfirmDelete = async () => {
    if (!customerToDeleteId) return;

    const resultAction = await dispatch(deletecustomer(customerToDeleteId));

    // Close confirmation dialog first
    setShowDeleteModal(false);
    setCustomerToDeleteId(null);

    if (deletecustomer.fulfilled.match(resultAction)) {
        dispatch(fetchcustomerlist());

        alertify.alert(
            "Success",
            resultAction.payload.message || "Customer deleted successfully"
        );
    } else {
        alertify.alert(
            "Error",
            resultAction.payload || "Customer delete failed"
        );
    }
};
    // Triggered if they cancel 
    const handleCancelDelete = () => {
        setCustomerToDeleteId(null);
        setShowDeleteModal(false);
    };

    const [tempFilters, setTempFilters] = useState({
        name: "",
        email: "",
        customerRefNo: "",
        companyName: ""
    });

    // Example function that runs your filter logic
    const applyFilter = () => {
        setFilters(tempFilters); // Apply the filter
        setCurrentPage(1);       // Reset pagination if needed
    };

    const initialCustomerState = {
        title: "",
        name: "",
        surname: "",
        gender: "",
        mobile: "",
        email: "",
        //customerAccountNo: "",
        companyId: "",
        address: ""
    };





    return (
        <div className="custmer-container">
            <div className="custmer-content">
                {/* LIST SCREEN */}
                <div className="custmer-section">

                    <div className="list-header">
                        <h3 className="customer-title">Customers</h3>
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
                            value={tempFilters.name}
                            onChange={(e) => setTempFilters({ ...tempFilters, name: e.target.value })}
                            placeholder="Name"
                        />
                        <input
                            type="text"
                            value={tempFilters.email}
                            onChange={(e) => setTempFilters({ ...tempFilters, email: e.target.value })}
                            placeholder="Email"
                        />
                        <input
                            type="text"
                            value={tempFilters.customerRefNo}
                            onChange={(e) => setTempFilters({ ...tempFilters, customerRefNo: e.target.value })}
                            placeholder="Ref No"
                        />
                        {/* <input
                                type="text"
                                value={tempFilters.companyName}
                                onChange={(e) => setTempFilters({ ...tempFilters, companyName: e.target.value })}
                                placeholder="Company"
                            /> */}
                        <select
                            value={tempFilters.companyName}
                            onChange={(e) =>
                                setTempFilters({ ...tempFilters, companyName: e.target.value })
                            }
                            className="form-control"
                        >
                            <option value="">Select Company </option>
                            {companieswithfilter.map((company) => (
                                <option key={company.companyName} value={company.companyName}>
                                    {company.companyName}
                                </option>
                            ))}

                        </select>
                        <HoloButton
                            variant="primary"
                            size="md"
                            onClick={applyFilter}
                        >
                            Filter
                        </HoloButton>

                        <HoloButton
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                const clearedFilters = { name: "", email: "", customerRefNo: "", companyName: "" };
                                setTempFilters(clearedFilters); setFilters(clearedFilters); setCurrentPage(1);
                            }}
                        >
                            Clear
                        </HoloButton>

                         {/* <HoloButton
  variant="primary"
  size="md"
  onClick={applyFilter}
>
  <i className="fas fa-filter"></i> Apply Filters
</HoloButton>

<HoloButton
  variant="secondary"
  size="md"
  onClick={() => {
    const clearedFilters = {
      name: "",
      email: "",
      customerRefNo: "",
      companyName: "",
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setCurrentPage(1);
  }}
>
  <i className="fas fa-times-circle"></i> Clear Filters
</HoloButton> */}
                    </div>

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

                            className="btn_add"
                            // style={{ backgroundColor: "#1E7D4E", color: "white", border: "none" }}
                            onClick={() => setShowCreateScreen(true)}
                        >
                            + Add New
                        </HoloButton>
                    </div>

                    {/* <div style={{ margin: "10px 0" }}>
                            <button
                                className="btn_role"
                                style={{ backgroundColor: "darkorange", color: "white", border: "none" }}
                                onClick={() => setShowCreateScreen(true)}
                            >
                                + Add Customer
                            </button>
                        </div>

                     
                        {/* Customer Table */}
                    <table className="data-table">
                        <thead>
                            <tr>

                                <th onClick={() => requestSort("customerRefNo")}>
                                    REF NO
                                    {sortConfig.key === "customerRefNo" ?
                                        (sortConfig.direction === "asc" ? "↑" : "↓")
                                        : "↑"}
                                </th>
                                <th>
                                    FULL NAME
                                </th>
                                {/* <th>TITLE</th> */}
                                <th>EMAIL</th>
                                {/* <th>MOBILE</th> */}
                                {/* <th>ADDRESS</th> */}
                                <th>COMPANY</th>
                                <th>STATUS</th>
                                
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // <tr>
                                //     <td colSpan="11" style={{ textAlign: "center", padding: "20px" }}>
                                //         <div className="spinner-border text-primary" role="status">
                                //             <span className="visually-hidden"></span>
                                //         </div>
                                //     </td>

                                // </tr>
                                <tr><td colSpan={11} style={{ textAlign: "center" }}><div className="loader"></div></td></tr>
                            ) : paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: "center" }}>
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="service-cell">{customer.customerRefNo}</td>
                                        <td className="service-cell">{customer.name} {customer.surName}</td>
                                        {/* <td>{customer.title}</td> */}
                                        <td className="service-cell">{customer.email}</td>
                                        {/* <td className="service-cell">{customer.mobile}</td> */}
                                        {/* <td className="service-cell">{customer.address }</td> */}
                                        {/* <td title={customer.address}>
                                            {(customer.address || "").length > 50
                                            ? customer.address.slice(0, 50) + "..."
                                            : customer.address}</td> */}
                                        <td className="service-cell">{customer.companyName}</td>
                                        <td className="service-cell">{customer.status}</td>
                                        
                                        <td className="service-cell" style={{ textAlign: "biside" }}>
                                            <FaEdit
                                                style={{ cursor: 'pointer' }}
                                                className="action-icon edit-icon"
                                                title="Edit"
                                                onClick={() => {
                                                    console.log("Editing customer:", customer); // ← log the data
                                                    setEditItem(customer);
                                                    setShowEditScreen(true);
                                                }} />




                                            {/* {customer.status === "N" && (
                                                <FaTrash
                                                    style={{ cursor: 'pointer' }}
                                                    className="action-icon cancel-icon"
                                                    title="Delete"
                                                    onClick={() => {
                                                        console.log("Deleting customer:", customer);
                                                        handleTriggerDelete(customer.id);
                                                    }}
                                                />
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

                {/* CREATE CUSTOMER MODAL */}
                {showCreateScreen && (
                    <div className="customer-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setNewItem(initialCustomerState); setCreateErrors({}); setShowCreateScreen(false); } }}>
                        <div className="customer-modal">
                            <div className="customer-modal-header">
                                <h3>Create Customer</h3>
                                <button className="customer-modal-close" onClick={() => { setNewItem(initialCustomerState); setCreateErrors({}); setShowCreateScreen(false); }}>&times;</button>
                            </div>
                            <form className="create-item-form-grid" onSubmit={(e) => e.preventDefault()}>

                                {/* Title */}
                                <div className="form-group">
                                    <label>Title <span className="required">*</span></label>
                                    <select
                                        value={newItem.title || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewItem({ ...newItem, title: value });

                                            if (value.trim() === "") {
                                                setCreateErrors({ ...createErrors, title: "Title is required" });
                                            } else {
                                                setCreateErrors({ ...createErrors, title: "" });
                                            }
                                        }}
                                        className={createErrors.title ? "input-error" : ""}
                                    >
                                        <option value="">Select Title</option>
                                        <option value="Mr">Ms</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Mr</option>
                                        <option value="Dr">Dr</option>

                                    </select>
                                    {createErrors.title && <p className="error-message">{createErrors.title}</p>}
                                </div>

                                {/* Name */}
                                <div className="form-group">
                                    <label>Name <span className="required">*</span></label>
                                    <input
                                        type="text" value={newItem.name || ""}
                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     setNewItem({ ...newItem, name: value });

                                        //     if (value.trim() === "") {
                                        //         setCreateErrors({ ...createErrors, name: "Name is required" });
                                        //     } else {
                                        //         setCreateErrors({ ...createErrors, name: "" });
                                        //     }
                                        // }}

                                        // onChange={(e) =>
                                        //     handleCreateAlphaNumericInput(e, "name", newItem, setNewItem, createErrors, setCreateErrors)
                                        // }
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (/^[A-Za-z ]*$/.test(value)) {
                                                setNewItem({ ...newItem, name: value });

                                                if (!value.trim()) {
                                                    setCreateErrors({
                                                        ...createErrors,
                                                        name: "Name is required",
                                                    });
                                                } else if (value.replace(/\s/g, "").length < 3) {
                                                    setCreateErrors({
                                                        ...createErrors,
                                                        name: "Name must contain at least 3 letters",
                                                    });
                                                } else {
                                                    setCreateErrors({
                                                        ...createErrors,
                                                        name: "",
                                                    });
                                                }
                                            }
                                        }}

                                        className={createErrors.name ? "input-error" : ""}
                                    />
                                    {createErrors.name && <p className="error-message">{createErrors.name}</p>}
                                </div>

                                {/* Surname */}
                                <div className="form-group">
                                    <label>Surname <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={newItem.surname || ""}
                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     setNewItem({ ...newItem, surname: value });

                                        //     if (value.trim() === "") {
                                        //         setCreateErrors({ ...createErrors, surname: "Surname is required" });
                                        //     } else {
                                        //         setCreateErrors({ ...createErrors, surname: "" });
                                        //     }
                                        // }}
                                        onChange={(e) =>
                                            handleCreateAlphaNumericInput(e, "surname", newItem, setNewItem, createErrors, setCreateErrors)
                                        }
                                        className={createErrors.surname ? "input-error" : ""}
                                    />
                                    {createErrors.surname && <p className="error-message">{createErrors.surname}</p>}
                                </div>

                                {/* Gender */}
                                <div className="form-group">
                                    <label>Gender <span className="required">*</span></label>
                                    <select
                                        value={newItem.gender || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewItem({ ...newItem, gender: value });

                                            if (value.trim() === "") {
                                                setCreateErrors({ ...createErrors, gender: "Gender is required" });
                                            } else {
                                                setCreateErrors({ ...createErrors, gender: "" });
                                            }
                                        }}
                                        className={createErrors.gender ? "input-error" : ""}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {createErrors.gender && <p className="error-message">{createErrors.gender}</p>}
                                </div>

                                {/* Mobile */}
                                <div className="form-group">
                                    <label>Mobile <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={newItem.mobile || ""}
                                        maxLength={10}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (/^\d*$/.test(value)) {
                                                setNewItem({ ...newItem, mobile: value });

                                                if (value.trim() === "") {
                                                    setCreateErrors({ ...createErrors, mobile: "Mobile number is required" });
                                                } else if (value.length !== 10) {
                                                    setCreateErrors({ ...createErrors, mobile: "Mobile must be 10 digits" });
                                                } else {
                                                    setCreateErrors({ ...createErrors, mobile: "" });
                                                }
                                            }
                                        }}
                                        className={createErrors.mobile ? "input-error" : ""}
                                    />
                                    {createErrors.mobile && <p className="error-message">{createErrors.mobile}</p>}
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        value={newItem.email || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewItem({ ...newItem, email: value });

                                            // Only check if email is empty
                                            if (value.trim() === "") {
                                                setCreateErrors({ ...createErrors, email: "Email is required" });
                                            } else {
                                                setCreateErrors({ ...createErrors, email: "" });
                                            }
                                        }}
                                        className={createErrors.email ? "input-error" : ""}
                                    />

                                    {createErrors.email && <p className="error-message">{createErrors.email}</p>}
                                </div>

                                {/* Customer Account No */}
                                {/* <div className="form-group">
                                    <label>Customer Account No <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={newItem.customerAccountNo || ""}
                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     setNewItem({ ...newItem, customerAccountNo: value });

                                        //     if (value.trim() === "") {
                                        //         setCreateErrors({ ...createErrors, customerAccountNo: "Customer Account No is required" });
                                        //     } else {
                                        //         setCreateErrors({ ...createErrors, customerAccountNo: "" });
                                        //     }
                                        // }}
                                        onChange={(e) =>
                                            handleCreateAlphaNumericInput(e, "customerAccountNo", newItem, setNewItem, createErrors, setCreateErrors)
                                        }
                                        className={createErrors.customerAccountNo ? "input-error" : ""}
                                    />
                                    {createErrors.customerAccountNo && <p className="error-message">{createErrors.customerAccountNo}</p>}
                                </div> */}

                                {/* Company */}
                                <div className="form-group">
                                    <label>Company <span className="required">*</span></label>
                                    <select
                                        value={newItem.companyId || ""}
                                        onChange={(e) => {

                                            const selectedCompany = companyList.find(
                                                x => x.id === Number(e.target.value)
                                            );

                                            setNewItem({
                                                ...newItem,
                                                companyId: e.target.value,
                                                vatNumber: selectedCompany?.vatNumber || ""
                                            });

                                            setCreateErrors({
                                                ...createErrors,
                                                companyId: e.target.value ? "" : "Company is required"
                                            });

                                        }}
                                         className={createErrors.title ? "input-error" : ""}
                                    >
                                        <option value="">Select Company</option>
                                        {companyList.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.companyName}
                                            </option>
                                        ))}
                                    </select>
                                    {createErrors.companyId && <p className="error-message">{createErrors.companyId}</p>}
                                </div>
                        
                                <div className="form-group">
                                    <label>VAT Number</label>
                                    <input
                                        type="text"
                                        value={newItem.vatNumber || ""}
                                        readOnly
                                        disabled
                                        style={{
                                            backgroundColor: "#e9ecef",
                                            color: "#495057",
                                            cursor: "not-allowed",
                                            opacity: 1,
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>
                                {/* Address */}
                                <div className="form-group">
                                    <label>Address <span className="required">*</span></label>
                                    <textarea
                                        value={newItem.address || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewItem({ ...newItem, address: value });

                                            if (value.trim() === "") {
                                                setCreateErrors({ ...createErrors, address: "Address is required" });
                                            } else {
                                                setCreateErrors({ ...createErrors, address: "" });
                                            }
                                        }}
                                        className={createErrors.address ? "input-error" : ""}
                                    />
                                    {createErrors.address && <p className="error-message">{createErrors.address}</p>}
                                </div>

                                {/* Actions */}
                                <div className="service-actions">

                                    <button
                                        type="submit"
                                        className="btn btn-success btn-lg d-flex align-items-center justify-content-center"
                                        disabled={buttonLoading}
                                        onClick={handleSaveCustomer}
                                    >
                                        {buttonLoading && (
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                        )}
                                        Save
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger btn-lg"
                                        onClick={() => {
                                            setNewItem(initialCustomerState);
                                            setCreateErrors({});
                                            setShowCreateScreen(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT CUSTOMER MODAL */}
                {showEditScreen && editItem && (
                    <div className="customer-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setEditErrors({}); setShowEditScreen(false); } }}>
                        <div className="customer-modal">
                            <div className="customer-modal-header">
                                <h3>Edit Customer</h3>
                                <button className="customer-modal-close" onClick={() => { setEditErrors({}); setShowEditScreen(false); }}>&times;</button>
                            </div>
                            <form className="create-item-form-grid">
                                {/* Hidden ID */}
                                <input
                                    hidden
                                    value={editItem.id || ""}
                                    onChange={(e) => setEditItem({ ...editItem, id: e.target.value })}
                                />

                                {/* Title */}
                                <div className="form-group">
                                    <label>Title <span className="required">*</span></label>
                                    <select
                                        value={editItem.title || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditItem({ ...editItem, title: value });
                                            setEditErrors({
                                                ...editErrors,
                                                title: value ? "" : "Title is required",
                                            });
                                        }}
                                        className={editErrors.title ? "input-error" : ""}
                                    >
                                        <option value="">Select Title</option>
                                        <option value="Mr">Ms</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Mr</option>
                                        <option value="Dr">Dr</option>
                                    </select>
                                    {editErrors.title && <p className="error-message">{editErrors.title}</p>}
                                </div>

                                {/* Name */}
                                <div className="form-group">
                                    <label>Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={editItem.name || ""}
                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     setEditItem({ ...editItem, name: value });
                                        //     setEditErrors({
                                        //         ...editErrors,
                                        //         name: value.trim() ? "" : "Name is required",
                                        //     });
                                        // }}

                                        // onChange={(e) =>
                                        //     handleEditAlphaNumericInput(
                                        //         e,
                                        //         "name",
                                        //         editItem,
                                        //         setEditItem,
                                        //         editErrors,
                                        //         setEditErrors,
                                        //         {
                                        //             required: "Name is required",
                                        //             invalid: "Name can contain only letters and numbers",
                                        //         }
                                        //     )
                                        // }
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (/^[A-Za-z ]*$/.test(value)) {
                                                setEditItem({ ...editItem, name: value });

                                                if (!value.trim()) {
                                                    setEditErrors({
                                                        ...editErrors,
                                                        name: "Name is required",
                                                    });
                                                } else if (value.replace(/\s/g, "").length < 3) {
                                                    setEditErrors({
                                                        ...editErrors,
                                                        name: "Name must contain at least 3 letters",
                                                    });
                                                } else {
                                                    setEditErrors({
                                                        ...editErrors,
                                                        name: "",
                                                    });
                                                }
                                            }
                                        }}

                                        className={editErrors.name ? "input-error" : ""}
                                    />
                                    {editErrors.name && <p className="error-message">{editErrors.name}</p>}
                                </div>

                                {/* Surname */}
                                <div className="form-group">
                                    <label>Surname <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={editItem.surName || ""}
                                        // onChange={(e) => {
                                        //     const value = e.target.value;
                                        //     setEditItem({ ...editItem, surName: value });
                                        //     setEditErrors({
                                        //         ...editErrors,
                                        //         surName: value.trim() ? "" : "Surname is required",
                                        //     });
                                        // }}
                                        onChange={(e) =>
                                            handleEditAlphaNumericInput(
                                                e,
                                                "surName",
                                                editItem,
                                                setEditItem,
                                                editErrors,
                                                setEditErrors,
                                                {
                                                    required: "Surname is required",
                                                    invalid: "Surname can contain only letters and numbers",
                                                }
                                            )
                                        }

                                        className={editErrors.surName ? "input-error" : ""}
                                    />
                                    {editErrors.surName && <p className="error-message">{editErrors.surName}</p>}
                                </div>

                                {/* Gender */}
                                <div className="form-group">
                                    <label>Gender <span className="required">*</span></label>
                                    <select
                                        value={editItem.gender || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditItem({ ...editItem, gender: value });
                                            setEditErrors({
                                                ...editErrors,
                                                gender: value ? "" : "Gender is required",
                                            });
                                        }}
                                        className={editErrors.gender ? "input-error" : ""}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {editErrors.gender && <p className="error-message">{editErrors.gender}</p>}
                                </div>

                                {/* Mobile */}
                                <div className="form-group">
                                    <label>Mobile <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={editItem.mobile || ""}
                                        maxLength={10}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) {
                                                setEditItem({ ...editItem, mobile: value });
                                                if (!value.trim()) {
                                                    setEditErrors({ ...editErrors, mobile: "Mobile is required" });
                                                } else if (value.length !== 10) {
                                                    setEditErrors({ ...editErrors, mobile: "Mobile must be 10 digits" });
                                                } else {
                                                    setEditErrors({ ...editErrors, mobile: "" });
                                                }
                                            }
                                        }}
                                        className={editErrors.mobile ? "input-error" : ""}
                                    />
                                    {editErrors.mobile && <p className="error-message">{editErrors.mobile}</p>}
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        value={editItem.email || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditItem({ ...editItem, email: value });

                                            // Only check if email is empty
                                            if (!value.trim()) {
                                                setEditErrors({ ...editErrors, email: "Email is required" });
                                            } else {
                                                setEditErrors({ ...editErrors, email: "" });
                                            }
                                        }}
                                        className={editErrors.email ? "input-error" : ""}
                                    />

                                    {editErrors.email && <p className="error-message">{editErrors.email}</p>}
                                </div>

                                {/* Customer Account No */}
                                {/* <div className="form-group">
                                    <label>Customer Account No <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={editItem.customerAccountNo || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditItem({ ...editItem, customerAccountNo: value });
                                            setEditErrors({
                                                ...editErrors,
                                                customerAccountNo: value.trim()
                                                    ? ""
                                                    : "Customer Account No is required",
                                            });
                                        }}
                                        className={editErrors.customerAccountNo ? "input-error" : ""}
                                    />
                                    {editErrors.customerAccountNo && (
                                        <p className="error-message">{editErrors.customerAccountNo}</p>
                                    )}
                                </div> */}

                                {/* Company */}
                                <div className="form-group">
                                    <label>Company <span className="required">*</span></label>
                                    <select
                                        value={editItem.companyId || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            const selectedCompany = companyList.find(
                                                x => x.id === Number(value)
                                            );

                                            setEditItem({
                                                ...editItem,
                                                companyId: Number(value),
                                                vatNumber: selectedCompany?.vatNumber || ""
                                            });

                                            setEditErrors({
                                                ...editErrors,
                                                companyId: value ? "" : "Company is required"
                                            });
                                        }}
                                        className={editErrors.companyId ? "input-error" : ""}
                                    >
                                        <option value="">Select Company</option>
                                        {companyList.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.companyName}
                                            </option>
                                        ))}
                                    </select>
                                    {editErrors.companyId && <p className="error-message">{editErrors.companyId}</p>}
                                </div>

                                <div className="form-group">
                                    <label>VAT Number</label>

                                    <input
                                        type="text"
                                        value={editItem.vatNumber || ""}
                                        readOnly
                                        disabled
                                        style={{
                                            backgroundColor: "#e9ecef",
                                            color: "#495057",
                                            cursor: "not-allowed",
                                            opacity: 1,
                                             marginTop: "6px"
                                        }}
                                    />
                                </div>

                                {/* Address */}
                                <div className="form-group">
                                    <label>Address <span className="required">*</span></label>
                                    <textarea
                                        value={editItem.address || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditItem({ ...editItem, address: value });
                                            setEditErrors({
                                                ...editErrors,
                                                address: value.trim() ? "" : "Address is required",
                                            });
                                        }}
                                        className={editErrors.address ? "input-error" : ""}
                                    />
                                    {editErrors.address && <p className="error-message">{editErrors.address}</p>}
                                </div>
                                {/* Is Active */}
                                <div className="form-group">
                                    <label>Status <span className="required">*</span></label>
                                    <select
                                        value={editItem.status || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditItem({ ...editItem, status: value });

                                            if (value.trim() === "") {
                                                setEditErrors({ ...editErrors, status: "Status is required" });
                                            } else {
                                                setEditErrors({ ...editErrors, status: "" });
                                            }
                                        }}
                                        className={editErrors.status ? "input-error" : ""}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    {editErrors.status && <p className="error-message">{editErrors.status}</p>}
                                </div>

                               
                                {/* Actions */}
                                <div className="service-actions">
                                    <button
                                        type="button"
                                        className="btn btn-success btn-lg d-flex align-items-center justify-content-center"
                                        disabled={buttonLoading}
                                        onClick={handleEditCustomer}
                                    >
                                        {buttonLoading && (
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                        )}
                                        Update
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger btn-lg"
                                        onClick={() => {
                                            setEditErrors({});
                                            setShowEditScreen(false);
                                        }}
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
                            <AlertDialogTitle>Confirmation</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this customer? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete}>OK</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <HelpModal show={showHelp} title="Customers - Help & Overview" screenName="Customers" onClose={() => setShowHelp(false)} />

            </div>
        </div>
    );
};

export default Customer;