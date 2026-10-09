import React, { useState } from "react";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";
import { AxiosInstance } from "../../services/api";

const CreateEntityForm = ({ dispatch, setShowCreateScreen, fetchItems }) => {
  const [newItem, setNewItem] = useState({
    CompanyName: "",
    VatNumber: "",
    RegistrationNumber: "",
    CompanyWebsite: "",
    CompanyEmail: "",
    CompanyPhoneNumber: "",
    CompanyAddress: "",
    CompanyLogo: null,
    BankAccountNumber: "",
    BranchCode: "",
    BranchAddress: "",
    IFSCCode: "",
    AccountHolderName: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setNewItem({ ...newItem, [name]: files[0] });
    } else {
      setNewItem({ ...newItem, [name]: value });
    }
  };

  const validate = () => {
    const errors = {};
    if (!newItem.CompanyName.trim()) errors.CompanyName = "Company Name is required";
    if (!newItem.VatNumber.trim()) errors.VatNumber = "VAT Number is required";
    if (!newItem.RegistrationNumber.trim()) errors.RegistrationNumber = "Registration Number is required";
    if (!newItem.CompanyEmail.trim()) errors.CompanyEmail = "Email is required";
    if (!newItem.CompanyAddress.trim()) errors.CompanyAddress = "Address is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      alertify.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(newItem).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await AxiosInstance.post("/CreateEntity", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alertify.alert("Success", response.data.message || "Company created successfully!");
      fetchItems();
      setShowCreateScreen(false);
    } catch (err) {
      alertify.error("Failed to create company. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Create New Company</h3>
      <form onSubmit={handleSubmit} className="entity-form">
        {Object.keys(newItem).map((key) => (
          key !== "CompanyLogo" && (
            <div key={key} className="form-group">
              <label>{key.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                name={key}
                value={newItem[key]}
                onChange={handleChange}
                className={validationErrors[key] ? "error" : ""}
              />
              {validationErrors[key] && <small className="error-text">{validationErrors[key]}</small>}
            </div>
          )
        ))}

        <div className="form-group">
          <label>Company Logo</label>
          <input type="file" name="CompanyLogo" onChange={handleChange} accept="image/*" />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setShowCreateScreen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateEntityForm;
