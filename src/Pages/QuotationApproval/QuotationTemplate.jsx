import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import { fetchQuotationdetailswithRefno, fetchSaveQuotationApprovalorRejection } from '../../redux/QuotationTemplateSlice';
import './QuotationTemplate.css';
import { baseURL } from "../../services/api";
import { quotationStatusLabel } from "../../utility/statusPipelines";



const QuotationTemplate = () => {
    const location = useLocation();
    const dispatch = useDispatch();

    const queryParams = new URLSearchParams(location.search);
    const quotationId = queryParams.get('quotationId');
    const quotationState = useSelector((state) => state.quotationapprovalTemplate) || {};
    const type = queryParams.get('type'); 

console.log('Quotation ID:', quotationId);
console.log('Type:', type);

    const {
        quotationDetails,
        loading,
        error,
        actionLoading,
        message,
    } = useSelector((state) => state.quotationApprovalTemplate) || {};

    const quotation = quotationDetails?.list?.[0] || null;
 
    const [approveLoading, setApproveLoading] = useState(false);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (quotationId) {
            dispatch(fetchQuotationdetailswithRefno(quotationId));
        }
    }, [dispatch, quotationId]);
   
    

    const totalAmount =
    quotation?.details?.reduce((total, d) => {
    const qty = d.quotationQuantity || 0;
    const rate = d.unitRate || 0;
    const tax = d.tax || 0;

    const baseAmount = qty * rate;
    const taxAmount = baseAmount * (tax / 100);
    return total + baseAmount + taxAmount;
    }, 0) || 0;


    if (loading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
            </div>
        );
    }
    if (message) {
        return (
            <div className="error-message">
                {message}
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }


    if (!quotation) {
        return (
            <div className="error-message">
                Quotation not found.
            </div>
        );
    }


    // alertify.confirm(title, message, onOk, onCancel);

    const handleApprove = () => {
        alertify.confirm(
            'Confirmation',
            'Are you sure you want to approve this quotation?',
            function () {
                
                setApproveLoading(true);
                dispatch(fetchSaveQuotationApprovalorRejection({
                    quotationId: quotation.quotation,
                    type: "Approve",
                    reason: ""
                })).then((res) => {
                    setApproveLoading(false);
                    if (res.meta.requestStatus === 'fulfilled') {
                        alertify.alert("Success",res.payload.message, function() {
                        window.location.reload();
                    });
                    } else {
                        alertify.alert('error',"Approval failed.");
                    }
                });
            },
            function () {

                alertify.alert('error', 'Approval canceled.');
            }
        );


    };

    const handleReject = () => {
        alertify.confirm(
            'Confirmation',
            'Are you sure you want to reject this quotation?',
            function () {
                setShowRejectModal(true);
            },
            function () {
                alertify.error('Rejection cancelled.');
            }
        );
    };

    const handleRejectConfirm = () => {
        if (!rejectReason.trim()) {
            alertify.alert('Warning',"Please enter a rejection reason.");
            return;
        }
        setRejectLoading(true);
        dispatch(fetchSaveQuotationApprovalorRejection({
            quotationId: quotation.quotation,
            type: "Reject",
            reason: rejectReason
        })).then((res) => {
            setRejectLoading(false);
            if (res.meta.requestStatus === 'fulfilled') {
                alertify.alert('Success',res.payload.message, function() {
                        window.location.reload();
                        setShowRejectModal(false);
                        setRejectReason('');
                });
                
            } else {
                alertify.alert('error',"Rejection failed.");
            }
        });
    };

    // Get only the file name from full path
    const logoFileName = quotation.comapanyLogo
        ? quotation.comapanyLogo.split("\\").pop()  // Windows path (backslash)
        : null;



    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setRejectReason('');
    };

    return (
        <div className="quotationtemplate-wrapper">
            <div className="quotationtemplate-container">
                <h2 className="quotationtemplate-title">Quotation Approval</h2>
                <div className="map-info-section">
                    <h4 className="map-section-title">Company Information</h4>
                    <div className="company-logo">
                        {quotation.comapanyLogo && (
                            <img
                                src={`${baseURL}/UploadedFiles/${quotation.comapanyLogo.split("\\").pop()}`}
                                style={{ width: "250px", marginTop: "-50px", height: "auto" }}
                                alt="Company Logo"
                            />
                        )}
                    </div>

                    <div className="map-info-row">
                        <span className="map-value" hidden>{quotation.quotation}</span>
                        <span className="map-label">Company Name</span>
                        <span className="map-value">: {quotation.companyName}</span>

                    </div>
                    <div className="map-info-row">

                        <span className="map-label">Registration No</span>
                        <span className="map-value"> : {quotation.registrationNumber}</span>

                    </div>
                    <div className="map-info-row">

                        <span className="map-label">VAT Number</span>
                        <span className="map-value">: {quotation.vatNumber}</span>

                    </div>

                    <div className="map-info-row">
                        <span className="map-label">Email</span>
                        <span className="map-value">: {quotation.companyEmail}</span>
                    </div>

                    <div className="map-info-row">
                        <span className="map-label">Phone</span>
                        <span className="map-value">: {quotation.companyPhoneNumber}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Website</span>
                        <span className="map-value">: {quotation.companyPhoneNumber}</span>
                    </div>

                    <div className="map-info-row">
                        <span className="map-label">Address</span>
                        <span className="map-value"> : {quotation.companyAddress}</span>
                    </div>
                    <h4 className="map-section-title">Bank Details</h4>
                    <div className="map-info-row">
                        <span className="map-label">Account Number</span>
                        <span className="map-value">: {quotation.bankAccountNumber}</span>
                    </div>
                    
                    <div className="map-info-row">
                        <span className="map-label">Branch Code</span>
                        <span className="map-value">: {quotation.branchCode}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Branch Address</span>
                        <span className="map-value">: {quotation.branchAddress}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">IFSC Code</span>
                        <span className="map-value">: {quotation.ifscCode}</span>
                    </div>
                    <h4 className="map-section-title">Quotation Information</h4>
                    <div className="map-info-row">
                        <span className="map-label">Reference No</span>
                        <span className="map-value">: {quotation.referenceNumber}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Date</span>
                        <span className="map-value">: {quotation.invoiceDate}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Status</span>
                        <span className="map-value">: {quotationStatusLabel(quotation.quotationStatus)}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Currency</span>
                        <span className="map-value">: {quotation.currency}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Quotation Type</span>
                        <span className="map-value">: {quotation.quotationType}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Total Amount</span>
                        <span className="map-value">: {totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                        <h4 className="map-section-title">Quotation Details</h4>
                        <table className="data-table ">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit Rate excl VAT</th>
                                    <th>Tax %</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotation.details && quotation.details.length > 0 ? (
                                    quotation.details.map((item, index) => {
                                        const baseAmount = item.quotationQuantity * item.unitRate;
                                        const itemamount = baseAmount + (baseAmount * (item.tax / 100)); // if tax is percentage
                                        // const amount = baseAmount + item.tax; // if tax is already an amount
                                        return (
                                            <tr key={index}>
                                                <td>{item.description}</td>
                                                <td>{item.quotationQuantity}</td>
                                                <td>{item.unitRate}</td>
                                                <td>{item.tax}</td>
                                                <td>{itemamount.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5">No quotation details found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    </div>
                    <h4 className="map-section-title">Customer Information</h4>
                    <div className="map-info-row">
                        <span className="map-label">Name</span>
                        <span className="map-value">: {quotation.customerName}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Email</span>
                        <span className="map-value">: {quotation.customerEmail}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Address</span>
                        <span className="map-value">: {quotation.customerAddress}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Phone</span>
                        <span className="map-value">: {quotation.customerPhone}</span>
                    </div>
                    <div className="map-info-row">
                        <span className="map-label">Payment terms</span>
                        <span className="map-value">: {quotation.paymentTerms}</span>
                    </div>
                </div>


                {/* <div className="quotationtemplate-view-actions">
                    {quotation.quotationStatus === "Created" || quotation.quotationStatus === "Updated" ? (
                        <>
                            <button className="btn-approve" onClick={handleApprove} disabled={approveLoading || rejectLoading}>
                                {approveLoading && <div className="spinner"></div>}
                                Approve
                            </button>

                            <button className="btn-reject" onClick={handleReject} disabled={approveLoading || rejectLoading}>
                                {rejectLoading && <div className="spinner"></div>}
                                Reject
                            </button>


                        </>
                    ) : quotation.quotationStatus === "Approved" ? (
                        <p className="status-message">Quotation already approved</p>
                    ) : quotation.quotationStatus === "Rejected" ? (
                        <p className="status-message">Quotation already rejected</p>
                    ) : (
                        <p className="status-message">Quotation status: {quotation.quotationStatus}</p>
                    )}
                </div> */}

                <div className="quotationtemplate-view-actions">
                    {type === "customer" &&
                        (quotation.quotationStatus === "Created" ||
                            quotation.quotationStatus === "Updated") && (
                            <>
                                <button
                                    className="btn-approve"
                                    onClick={handleApprove}
                                    disabled={approveLoading || rejectLoading}
                                >
                                    {approveLoading && <div className="spinner"></div>}
                                    Approve
                                </button>

                                <button
                                    className="btn-reject"
                                    onClick={handleReject}
                                    disabled={approveLoading || rejectLoading}
                                >
                                    {rejectLoading && <div className="spinner"></div>}
                                    Reject
                                </button>
                            </>
                        )}
                </div>




                {showRejectModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>Rejection Reason</h3>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection"
                            />
                            <div className="modal-buttons">
                                <button onClick={handleRejectConfirm} className="btn-approve">Submit</button>
                                <button onClick={handleRejectCancel} className="btn-reject">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotationTemplate;




