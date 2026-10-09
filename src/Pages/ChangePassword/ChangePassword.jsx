import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import alertify from "alertifyjs";
import "./ChangePassword.css";
import { changePassword, resetChangePasswordState } from "../../redux/ChangePasswordSlice";

const ChangePassword = () => {
    const dispatch = useDispatch();
    const { loading, success, error } = useSelector(
        (state) => state.changePassword
    );

    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        const storedUserName = sessionStorage.getItem("userName");
        const storedUserId = sessionStorage.getItem("userId");
        // const storedpassword = sessionStorage.getItem("password");

        if (storedUserName) setUsername(storedUserName);
        if (storedUserId) setUserId(storedUserId);
        // if (storedpassword) setOldPassword(storedpassword);
    }, []);

    // ✅ Handle success / error
    useEffect(() => {
        if (success) {
            alertify.alert('Success', "Password changed successfully!", function () {
                setNewPassword("");
                setOldPassword("");
                setConfirmPassword("");
                setShowPassword(false)
                dispatch(resetChangePasswordState());
            });
        }

        if (error) {
            alertify.alert('error',error);
            dispatch(resetChangePasswordState());
        }
    }, [success, error, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!oldPassword) {
            alertify.alert('Warning',"Please enter your old password");
            return;
        }

        if (!newPassword) {
            alertify.alert('Warning',"Please enter new password");
            return;
        }

        if (!confirmPassword) {
            alertify.alert('Warning',"Please confirm new password");
            return;
        }

        if (newPassword !== confirmPassword) {
            alertify.alert('Warning',"New password and Confirm password do not match");
            return;
        }

        dispatch(
            changePassword({
                userId: userId,
                newPassword: newPassword,
                oldPassword: oldPassword,
            })
        );
    };

    const getPasswordStrength = (password) => {
        const requirements = [
            { label: "At least 8 characters", valid: password.length >= 8 },
            { label: "At least 1 uppercase letter", valid: /[A-Z]/.test(password) },
            { label: "At least 1 lowercase letter", valid: /[a-z]/.test(password) },
            { label: "At least 1 number", valid: /[0-9]/.test(password) },
            { label: "At least 1 special character", valid: /[^A-Za-z0-9]/.test(password) },
        ];

        const score = requirements.reduce((acc, req) => acc + (req.valid ? 1 : 0), 0);

        let label = "";
        let color = "#16a34a";

        if (!password) {
            label = "";
        } else if (score <= 2) {
            label = "Weak";
            color = "#dc2626";
        } else if (score <= 4) {
            label = "Medium";
            color = "#f59e0b";
        } else {
            label = "Strong";
            color = "#16a34a";
        }

        return { label, score, color, requirements };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    return (
        <div className="change-password-page">
            <div className="change-password-container">
                <div className="change-password-card-header">
                    <div className="change-password-icon">
                        <i className="fas fa-lock"></i>
                    </div>
                    <h2>Change Password</h2>
                    <p>Secure your account by updating your password with a clean, modern interface.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <input type="hidden" value={userId} readOnly />

                    <div className="form-row">
                        <label>User Name</label>
                        <input type="text" value={username} readOnly className="read-only-field" />
                    </div>

                <div className="form-row">
                    <label>
                        Passcode/Old Password <span className="required">*</span>
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Passcode/Old Password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-row">
                    <label>
                        New Password <span className="required">*</span>
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="password-strength">
                    <div className="strength-track">
                        <div
                            className="strength-fill"
                            style={{
                                width: `${(passwordStrength.score / 5) * 100}%`,
                                backgroundColor: passwordStrength.color,
                            }}
                        />
                    </div>
                    {passwordStrength.label ? (
                        <span className={`strength-label strength-${passwordStrength.label.toLowerCase()}`}>
                            {passwordStrength.label}
                        </span>
                    ) : (
                        <span className="strength-label">Enter a password to see strength</span>
                    )}
                </div>
                <div className="password-requirements">
                    {passwordStrength.requirements.map((req) => (
                        <div key={req.label} className="requirement-item">
                            <span className={`requirement-icon ${req.valid ? "valid" : "invalid"}`}>
                                <i className={`fas ${req.valid ? "fa-check-circle" : "fa-circle"}`} />
                            </span>
                            <span className={`requirement-text ${req.valid ? "valid" : "invalid"}`}>
                                {req.label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="form-row">
                    <label>
                        Confirm Password <span className="required">*</span>
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>


                <div className="toggle-password">
                    
                    <input
                        type="checkbox"
                        id="showPassword"
                        checked={showPassword}
                        onChange={() => setShowPassword(prev => !prev)}
                    />

                    <label htmlFor="showPassword">Show Password</label>
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading && <span className="spinner"></span>}
                        Change Password
                    </button>
                </div>
            </form>
        </div>
    </div>
    );
};

export default ChangePassword;
