import React, { useState } from "react";
import alertify from "alertifyjs";
import { AxiosInstance, baseURL } from "../../services/api";

const EditEntityForm = ({ editItem, fetchItems, setShowEditScreen }) => {
  const [formData, setFormData] = useState(editItem);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showLogoPopup, setShowLogoPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => form.append(key, value));
      const response = await AxiosInstance.put(`/UpdateEntity/${formData.Id}`, form);
      alertify.alert("Updated", response.data.message || "Company updated successfully!");
      fetchItems();
      setShowEditScreen(false);
    } catch (error) {
      alertify.error("Failed to update company.");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = `${baseURL}/UploadedFiles/${formData.CompanyLogo?.split("\\").pop()}`;

  return (
    <div className="form-container">
      <h3>Edit Company</h3>
      <form onSubmit={handleSubmit} className="entity-form">
        {Object.keys(formData).map((key) => (
          key !== "CompanyLogo" && key !== "Id" && (
            <div key={key} className="form-group">
              <label>{key.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                name={key}
                value={formData[key]}
                onChange={handleChange}
              />
            </div>
          )
        ))}

        {/* Eye icon for logo preview */}
        <div className="form-group">
          <label>Company Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="file" name="CompanyLogo" onChange={handleChange} accept="image/*" />
            <i
              className="fas fa-eye"
              style={{ color: "blue", cursor: "pointer", fontSize: "20px" }}
              onClick={() => setShowLogoPopup(true)}
            ></i>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </button>
          <button type="button" onClick={() => setShowEditScreen(false)}>Cancel</button>
        </div>
      </form>

      {/* Logo Popup */}
      {showLogoPopup && (
        <div className="logo-popup-overlay" onClick={() => setShowLogoPopup(false)}>
          <div className="logo-popup" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageUrl}
              alt="Company Logo"
              style={{ width: "400px", height: "auto", borderRadius: "8px" }}
            />
            <button className="close-btn" onClick={() => setShowLogoPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEntityForm;
