// import React, { useState, useEffect } from "react";
// import "./ServiceRender.css";
// import HelpModal from "../../components/Common/HelpModal";
// import useSort from "../../components/Common/useSort";
// import { useDispatch, useSelector } from "react-redux";
// import alertify from "alertifyjs";
// import "alertifyjs/build/css/alertify.css";
// import "alertifyjs/build/css/themes/default.css";
// import { fetchCompanieswithfilter } from "../../redux/CustomerSlice";
// import { fetchServiceRenderedlist, createservicerendered, updateService, deleteService } from '../../redux/ServicesRenderedSlice';

// const ServiceRender = () => {
//   const dispatch = useDispatch();

//   const [loading, setLoading] = useState(false);
//   const [showCreateScreen, setShowCreateScreen] = useState(false);
//   const [showEditScreen, setShowEditScreen] = useState(false);
//   const [editItem, setEditItem] = useState(null);
//   const [showHelp, setShowHelp] = useState(false);
//   const applyFilter = () => {
//     setFilters(tempFilters);
//   };

//   const [newItem, setNewItem] = useState({
//     name: "",
//     description: "",
//     companyId: null,
//     unitOfMeasure: "",
//     rate: null,
//   });
//   const initialCustomerState = {
//     name: "",
//     description: "",
//     companyId: null,
//     unitOfMeasure: "",
//     rate: null,
//   };



//   // Get Redux list
//   const servicesList = useSelector((state) => state.ServicesRendered.Serviceslist || []);
//   const companyList = useSelector((state) => state.Customers.companies || []);
//   console.log('serivcesList', servicesList);
//   // Keep local state for sorting/filtering/pagination
//   const [serviceList, setServiceList] = useState([]);
//   const [filters, setFilters] = useState({ name: "", description: "", companyName: "", unitOfMeasure: "" });
//   const [tempFilters, setTempFilters] = useState({ name: "", description: "", companyName: "", unitOfMeasure: "" });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [recordsPerPage, setRecordsPerPage] = useState(5);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         await dispatch(fetchCompanieswithfilter());
//         await dispatch(fetchServiceRenderedlist());
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       }
//       setLoading(false);
//     };

//     fetchData();
//   }, [dispatch]);

//   // Bind Redux list to local state whenever it updates
//   useEffect(() => {
//     setServiceList(servicesList);
//   }, [servicesList]);

//   // Apply filters
//   const filteredData = serviceList.filter(item =>
//     item.name?.toLowerCase().includes(filters.name.toLowerCase()) &&
//     item.description?.toLowerCase().includes(filters.description.toLowerCase()) &&
//     item.companyName?.toLowerCase().includes(filters.companyName.toLowerCase()) &&
//     item.unitOfMeasure?.toLowerCase().includes(filters.unitOfMeasure.toLowerCase())
//   );

//   // Sorting using your useSort hook
//   const { sortedData, requestSort, sortConfig } = useSort(filteredData);

//   // Pagination
//   const totalPages = Math.max(1, Math.ceil(sortedData.length / recordsPerPage));
//   const paginatedData = sortedData.slice(
//     (currentPage - 1) * recordsPerPage,
//     currentPage * recordsPerPage
//   );

//   const [buttonLoading, setButtonLoading] = useState(false);
//   const [createErrors, setCreateErrors] = useState({});
//   const [editErrors, setEditErrors] = useState({});

//   const handleSaveservice = async (e) => {
//     debugger
//     e.preventDefault();
//     setButtonLoading(true);

//     // Reset errors

//     let hasError = false;
//     const newErrors = {};
//     if (!newItem.name) {
//       newErrors.name = "Name is required";
//       hasError = true;
//     }
//     if (!newItem.description) {
//       newErrors.description = "Description is required";
//       hasError = true;
//     }
//     if (!newItem.unitOfMeasure) {
//       newErrors.unitOfMeasure = "Unit Of Measure is required";
//       hasError = true;
//     }
//     if (!newItem.rate) {
//       newErrors.rate = "Rate is required";
//       hasError = true;
//     }

//     if (!newItem.companyId) {
//       newErrors.companyId = "Company is required";
//       hasError = true;
//     }

//     if (hasError) {
//       setCreateErrors(newErrors);
//       setButtonLoading(false);
//       return;
//     }
//     try {
//       const resultAction = await dispatch(createservicerendered(newItem));
//       if (createservicerendered.fulfilled.match(resultAction)) {
//         const message = resultAction.payload.message;
//         alertify.alert('Success', message);
//         setShowCreateScreen(false);
//         setNewItem({});
//         dispatch(fetchServiceRenderedlist());
//       } else {
//         alertify.alert('error', resultAction.payload || "Failed to save customer");
//       }
//     } catch (err) {
//       console.log("Save error:", err);
//       alertify.alert('error', "Something went wrong");
//     } finally {
//       setButtonLoading(false);
//     }
//   };

//   const handleEditSerivce = async (e) => {
//     debugger;
//     e.preventDefault();
//     setButtonLoading(true);
//     let hasError = false;
//     const newErrors = {};
//     if (!editItem.name) {
//       newErrors.name = "Name is required";
//       hasError = true;
//     }
//     if (!editItem.description) {
//       newErrors.description = "Description is required";
//       hasError = true;
//     }
//     if (!editItem.unitOfMeasure) {
//       newErrors.unitOfMeasure = "Unit Of Measure is required";
//       hasError = true;
//     }
//     if (!editItem.rate) {
//       newErrors.rate = "Rate is required";
//       hasError = true;
//     }

//     if (!editItem.companyId) {
//       newErrors.companyId = "Company is required";
//       hasError = true;
//     }
//     if (!editItem.isActive) {
//       newErrors.isActive = "Is Active is required";
//       hasError = true;
//     }
//     if (!editItem.isDeleted) {
//       newErrors.isDeleted = "Is Deleted is required";
//       hasError = true;
//     }

//     try {
//       const payload = { ...editItem };
//       const resultAction = await dispatch(updateService(payload));
//       if (updateService.fulfilled.match(resultAction)) {
//         const message = resultAction.payload.message;
//         alertify.alert('Success', message);

//         setShowEditScreen(false);
//         setEditItem(null);
//         dispatch(fetchServiceRenderedlist());
//       } else {
//         alertify.alert('error', resultAction.payload || "Failed to update customer");
//       }
//     } catch (err) {
//       console.log("Edit error:", err);
//       alertify.alert('error', "Something went wrong");
//     } finally {
//       setButtonLoading(false);
//     }
//   };

//   const handleDeleteService = async (id) => {
//     alertify.confirm(
//       "Confirmation",
//       "Are you sure you want to delete this service?",
//       async function () {

//         const resultAction = await dispatch(deleteService(id));

//         if (deleteService.fulfilled.match(resultAction)) {
//           const message = resultAction.payload.message;
//           alertify.alert('Success', message);
//           dispatch(fetchServiceRenderedlist());
//         } else {
//           alertify.alert('error', resultAction.payload || "Failed to delete service");
//         }
//       },
//       function () {

//         alertify.alert('error', "Delete cancelled");
//       }
//     );
//   };



//   return (
//     <div className="custmer-container">
//       <div className="custmer-content">
//         {!showCreateScreen && !showEditScreen && (
//           <div className="custmer-section">
//             <div className="list-header">
//               <h3 className="customer-title">Service Rendered</h3>
//               <button className="help-btn" onClick={() => setShowHelp(true)}>
//                 <i className="fas fa-question-circle"></i> Help
//               </button>
//             </div>

//             {/* FILTERS */}
//             <div className="filter-section">
//               <input
//                 type="text"
//                 placeholder="Name"
//                 value={tempFilters.name}
//                 onChange={(e) =>
//                   setTempFilters({ ...tempFilters, name: e.target.value })
//                 }
//               />
//               <input
//                 type="text"
//                 placeholder="Description"
//                 value={tempFilters.description}
//                 onChange={(e) =>
//                   setTempFilters({
//                     ...tempFilters,
//                     description: e.target.value,
//                   })
//                 }
//               />
//               <input
//                 type="text"
//                 placeholder="Company"
//                 value={tempFilters.companyName}
//                 onChange={(e) =>
//                   setTempFilters({
//                     ...tempFilters,
//                     companyName: e.target.value,
//                   })
//                 }
//               />
//               <input
//                 type="text"
//                 placeholder="Unit of Measure"
//                 value={tempFilters.unitOfMeasure}
//                 onChange={(e) =>
//                   setTempFilters({ ...tempFilters, unitOfMeasure: e.target.value })
//                 }
//               />

//               <button className="filter-btn" onClick={applyFilter}>
//                 Filter
//               </button>
//               <button
//                 className="clear-btn"
//                 onClick={() => {
//                   const empty = { name: "", description: "", companyName: "", unitOfMeasure: "" };
//                   setTempFilters(empty);
//                   setFilters(empty);
//                 }}
//               >
//                 Clear
//               </button>
//             </div>

//             <div style={{ margin: "10px 0" }}>
//               <button
//                 className="btn_role"
//                 style={{ backgroundColor: "darkorange", color: "white", border: "none" }}
//                 onClick={() => setShowCreateScreen(true)}
//               >
//                 + Add Service Render
//               </button>
//             </div>

//             <div className="records-per-page">
//               Records per page:
//               <select
//                 value={recordsPerPage}
//                 onChange={(e) => {
//                   setRecordsPerPage(Number(e.target.value));
//                   setCurrentPage(1);
//                 }}
//               >
//                 {[2, 5, 10, 25].map((n) => (
//                   <option key={n} value={n}>
//                     {n}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <br />

//             {/* TABLE */}
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th onClick={() => requestSort("name")}>
//                     NAME {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑"}
//                   </th>
//                   <th>DESCRIPTION</th>
//                   <th>COMPANY</th>
//                   <th>UNIT OF MEASURE</th>
//                   <th>RATE</th>
//                   <th>IS ACTIVE</th>
//                   <th>IS DELETED</th>
//                   <th>ACTION</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading ? (

//                   <tr><td colSpan={11} style={{ textAlign: "center" }}><div className="spinner"></div></td></tr>
//                 ) : paginatedData.length === 0 ? (
//                   <tr>
//                     <td colSpan="11" style={{ textAlign: "center" }}>
//                       No Data found
//                     </td>
//                   </tr>
//                 ) : (
//                   paginatedData.map((item) => (
//                     <tr key={item.id}>
//                       <td>{item.name}</td>
//                       <td>{item.description}</td>
//                       <td>{item.companyName}</td>
//                       <td>{item.unitOfMeasure}</td>
//                       <td>{item.rate}</td>
//                       <td>{item.isActive}</td>
//                       <td>{item.isDeleted}</td>
//                       <td>

//                         <button
//                           className="btn btn-sm btn-outline-primary me-2"
//                           style={{ color: "blue", cursor: "pointer" }}
//                           onClick={() => {
//                             console.log("Editing item:", item);
//                             setEditItem(item);
//                             setShowEditScreen(true);
//                           }}


//                         >
//                           <i className="fas fa-edit"></i>
//                         </button>
//                         {item.isDeleted === "No" && (
//                           <button
//                             className="btn btn-sm btn-outline-danger"
//                             onClick={() => handleDeleteService(item.id)}
//                             style={{ color: "red", cursor: "pointer" }}
//                           >
//                             <i className="fas fa-trash"></i>
//                           </button>
//                         )}

//                       </td>
//                     </tr>
//                   ))
//                 )}


//                 {/* {paginatedData.length === 0 && (
//                   <tr>
//                     <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
//                       No Records Found
//                     </td>
//                   </tr>
//                 )} */}
//               </tbody>

//             </table>

//             {/* PAGINATION */}
//             <div className="pagination">
//               <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
//                 Prev
//               </button>

//               {Array.from({ length: totalPages }, (_, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setCurrentPage(i + 1)}
//                   className={currentPage === i + 1 ? "active" : ""}
//                 >
//                   {i + 1}
//                 </button>
//               ))}

//               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
//                 Next
//               </button>
//             </div>
//           </div>
//         )}

//         {/* CREATE SCREEN */}
//         {showCreateScreen && (
//           <div className="create-item-section">
//             <div className="create-item-card">
//               <h3 className="role-title">Create Service Rendered</h3>

//               <form className="create-item-form-grid">
//                 <div className="form-group">
//                   <label>Name<span className="required">*</span></label>
//                   {/* <input
//                     type="text"
//                     value={newItem.name}
//                     onChange={(e) =>
//                       setNewItem({ ...newItem, name: e.target.value })
//                     }
//                   /> */}
//                   <input
//                     type="text"
//                     value={newItem.name || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setNewItem({ ...newItem, name: value });

//                       if (value.trim() === "") {
//                         setCreateErrors({ ...createErrors, name: "Name is required" });
//                       } else {
//                         setCreateErrors({ ...createErrors, name: "" });
//                       }
//                     }}

//                     className={createErrors.name ? "input-error" : ""}
//                   />
//                   {createErrors.name && <p className="error-message">{createErrors.name}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Description<span className="required">*</span></label>
//                   <input
//                     type="text"
//                     value={newItem.description || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setNewItem({ ...newItem, description: value });

//                       if (value.trim() === "") {
//                         setCreateErrors({ ...createErrors, description: "Description is required" });
//                       } else {
//                         setCreateErrors({ ...createErrors, description: "" });
//                       }
//                     }}

//                     className={createErrors.description ? "input-error" : ""}
//                   />
//                   {createErrors.description && <p className="error-message">{createErrors.description}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Company Name<span className="required">*</span></label>

//                   <select type="number"
//                     value={newItem.companyId || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setNewItem({ ...newItem, companyId: value });

//                       if (value.trim() === "") {
//                         setCreateErrors({ ...createErrors, companyId: "Company is required" });
//                       } else {
//                         setCreateErrors({ ...createErrors, companyId: "" });
//                       }
//                     }}
//                     className={createErrors.companyId ? "input-error" : ""}
//                   >
//                     <option value="">Select option</option>
//                     {companyList.map((company) => (
//                       <option key={company.id} value={company.id}>
//                         {company.companyName}
//                       </option>
//                     ))}
//                   </select>
//                   {createErrors.companyId && <p className="error-message">{createErrors.companyId}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Unit of Measure<span className="required">*</span></label>
                 


//                    <select
//                     value={newItem.unitOfMeasure || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setNewItem({ ...newItem, unitOfMeasure: value });

//                       if (value.trim() === "") {
//                         setCreateErrors({ ...createErrors, unitOfMeasure: "Unit Of Measure is required" });
//                       } else {
//                         setCreateErrors({ ...createErrors, unitOfMeasure: "" });
//                       }
//                     }}
//                     className={createErrors.unitOfMeasure ? "input-error" : ""}
//                   >
//                     <option value="">Select option</option>
//                     <option value="Hour">Hour</option>
//                     <option value="Unit">Unit</option>
//                   </select>
//                   {createErrors.unitOfMeasure && <p className="error-message">{createErrors.unitOfMeasure}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Rate<span className="required">*</span></label>
//                   <input
//                     type="number"
//                     value={newItem.rate || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setNewItem({ ...newItem, rate: value });

//                       if (value.trim() === "") {
//                         setCreateErrors({ ...createErrors, rate: "Rate is required" });
//                       } else {
//                         setCreateErrors({ ...createErrors, rate: "" });
//                       }
//                     }}

//                     className={createErrors.rate ? "input-error" : ""}
//                   />
//                   {createErrors.rate && <p className="error-message">{createErrors.rate}</p>}
//                 </div>

//                 <div className="service-actions">
//                   <button
//                     type="submit"
//                     className="btn btn-success btn-lg d-flex align-items-center justify-content-center"
//                     disabled={buttonLoading}
//                     onClick={handleSaveservice}
//                   >
//                     {buttonLoading && (
//                       <span
//                         className="spinner-border spinner-border-sm me-2"
//                         role="status"
//                         aria-hidden="true"
//                       ></span>
//                     )}
//                     {""}Save
//                   </button>

//                   <button
//                     type="button"
//                     className="btn btn-danger btn-lg"
//                     onClick={() => {
//                       setNewItem(initialCustomerState);
//                         setCreateErrors({}); 
//                       setShowCreateScreen(false);
//                     }}

//                   >
//                     Cancel
//                   </button>

//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//         {/* EDIT ITEM SCREEN */}
//         {showEditScreen && editItem && (
//           <div className="create-item-section">
//             <div className="create-item-card">
//               <h3 className="role-title">Edit Customer</h3>


//               <form className="create-item-form-grid">
//                 <div className="form-group">
//                   <label>Name<span className="required">*</span></label>

//                   <input
//                     type="text"
//                     value={editItem.name || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, name: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, name: "Name is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, name: "" });
//                       }
//                     }}

//                     className={editErrors.name ? "input-error" : ""}
//                   />
//                   {/* {editErrors.name && <p editErrors="error-message">{editErrors.name}</p>} */}

//                   {editErrors.name && <p className="error-message">{editErrors.name}</p>}

//                 </div>

//                 <div className="form-group">
//                   <label>Description<span className="required">*</span></label>
//                   <input
//                     type="text"
//                     value={editItem.description || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, description: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, description: "Description is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, description: "" });
//                       }
//                     }}

//                     className={editErrors.description ? "input-error" : ""}
//                   />
//                   {editErrors.description && <p className="error-message">{editErrors.description}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Company Name<span className="required">*</span></label>

//                   <select type="number"
//                     value={editItem.companyId || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, companyId: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, companyId: "Company is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, companyId: "" });
//                       }
//                     }}
//                     className={editErrors.companyId ? "input-error" : ""}
//                   >
//                     <option value="">Select option</option>
//                     {companyList.map((company) => (
//                       <option key={company.id} value={company.id}>
//                         {company.companyName}
//                       </option>
//                     ))}
//                   </select>
//                   {editErrors.companyId && <p className="error-message">{editErrors.companyId}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Unit of Measure<span className="required">*</span></label>
                 

//                     <select
//                     value={editItem.unitOfMeasure || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, unitOfMeasure: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, unitOfMeasure: "Unit Of Measure is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, unitOfMeasure: "" });
//                       }
//                     }}
//                     className={editErrors.unitOfMeasure ? "input-error" : ""}
//                   >
//                     <option value="">Select option</option>
//                     <option value="Hour">Hour</option>
//                     <option value="Unit">Unit</option>
//                   </select>
                    
                  
//                   {editErrors.unitOfMeasure && <p className="error-message">{editErrors.unitOfMeasure}</p>}
//                 </div>

//                 <div className="form-group">
//                   <label>Rate<span className="required">*</span></label>
//                   <input
//                     type="number"
//                     value={editItem.rate || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, rate: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, rate: "Rate is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, rate: "" });
//                       }
//                     }}

//                     className={editErrors.rate ? "input-error" : ""}
//                   />
//                   {editErrors.rate && <p className="error-message">{editErrors.rate}</p>}
//                 </div>
//                 <div className="form-group">
//                   <label>Is Active <span className="required">*</span></label>
//                   <select
//                     value={editItem.isActive || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, isActive: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, isActive: "Is Active is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, isActive: "" });
//                       }
//                     }}
//                     className={editErrors.isActive ? "input-error" : ""}
//                   >
//                     <option value="">Select option</option>
//                     <option value="Yes">Yes</option>
//                     <option value="No">No</option>
//                   </select>
//                   {editErrors.isActive && <p className="error-message">{editErrors.isActive}</p>}
//                 </div>

//                 {/* Is Deleted */}
//                 <div className="form-group">
//                   <label>Is Deleted <span className="required">*</span></label>
//                   <select
//                     value={editItem.isDeleted || ""}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setEditItem({ ...editItem, isDeleted: value });

//                       if (value.trim() === "") {
//                         setEditErrors({ ...editErrors, isDeleted: "Is Deleted is required" });
//                       } else {
//                         setEditErrors({ ...editErrors, isDeleted: "" });
//                       }
//                     }}
//                     className={editErrors.isDeleted ? "input-error" : ""}
//                   >
//                     <option value="">Select option</option>
//                     <option value="Yes">Yes</option>
//                     <option value="No">No</option>
//                   </select>
//                   {editErrors.isDeleted && <p className="error-message">{editErrors.isDeleted}</p>}
//                 </div>

//                  <div className="service-actions">
//                   <button
//                     type="button"
//                     className="btn btn-success btn-lg d-flex align-items-center justify-content-center"
//                     disabled={buttonLoading}
//                     onClick={handleEditSerivce}
//                   >
//                     {buttonLoading && (
//                       <span
//                         className="spinner-border spinner-border-sm me-2"
//                         role="status"
//                         aria-hidden="true"
//                       ></span> 
//                     )}
//                     {""} Update
//                   </button>

//                   <button
//                     type="button"
//                     className="btn btn-danger btn-lg"
//                     onClick={() => {
//                       setNewItem(initialCustomerState);
//                       setEditErrors({});
//                       setShowEditScreen(false);
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         <HelpModal
//           show={showHelp}
//           title="Service Rendered - Help & Overview"
//           screenName="ServiceRendered"
//           onClose={() => setShowHelp(false)}
//         />
//       </div>
//     </div>
//   );
// };

// export default ServiceRender;
