import React from "react";
import { baseURL } from "../../services/api";
import "./ViewPopup.css";
import { quotationStatusLabel } from "../../utility/statusPipelines";
const CreditNotePopup = ({ selectedCreditNote, onClose }) => {

    return (

        <div className="quotation-view-overlay viewpopup-modern">
            <div className="quotation-view-modal">
                <div className="quotation-view-header">
                    <h3 className="quotation-view-title">View Credit Note Details</h3>

                    {selectedCreditNote.comapanyLogo && (() => {
                        const logoFileName = selectedCreditNote.comapanyLogo.split(/[/\\]/).pop();
                        return (
                            <img
                                src={`${baseURL}/UploadedFiles/${logoFileName}`}
                                alt="Company Logo"
                                className="company-logo-corner"
                            />
                        );
                    })()}


                    <button
                        className="quotation-view-close-btn"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="quotation-view-body">

                    {/* Company Information */}
                    <h4 className="quotation-view-section-title">Company Information</h4>


                    <div className="quotation-view-info">
                        <div><span className="label">Company Name</span> : <span>{selectedCreditNote.companyName}</span></div>
                        <div><span className="label">Company Vat Number</span> :<span>{selectedCreditNote.vatNumber}</span></div>
                        <div><span className="label">Company Reg Number</span>: <span>{selectedCreditNote.registrationNumber}</span></div>
                        <div><span className="label">Company Address</span> :<span>{selectedCreditNote.companyAddress}</span></div>
                        {/* <div><span className="label">Company Website</span>: <span>{selectedCreditNote.companyWebsite}</span></div> */}
                        <div><span className="label">Company Email</span>: <span>{selectedCreditNote.companyEmail}</span></div>
                        <div><span className="label">Company Phone Number</span> :<span>{selectedCreditNote.companyPhoneNumber}</span></div>
                    </div>

                    {/* Banking Details */}
                    <h4 className="quotation-view-section-title">Banking Details</h4>
                    <div className="quotation-view-info">
                        <div><span className="label">Bank Name</span> : <span>{selectedCreditNote.bankName}</span></div>
                        <div><span className="label">Account Holder Name</span> : <span>{selectedCreditNote.accountHolderName}</span></div>

                        <div><span className="label">Account Number</span> : <span>{selectedCreditNote.bankAccountNumber}</span></div>
                        <div><span className="label">Branch Code</span> :<span>{selectedCreditNote.branchCode}</span></div>
                        <div><span className="label">Branch Address</span>:
                            <span>
                                {selectedCreditNote?.branchAddress ||
                                    selectedCreditNote?.brannchAddress ||
                                    "-"}
                            </span>
                        </div>
                        {/* <div><span className="label">IFSC Code</span> :<span>{selectedCreditNote.ifscCode}</span></div> */}
                    </div>

                    {/* Quotation Information */}
                    <h4 className="quotation-view-section-title">Quotation Information</h4>
                    <div className="quotation-view-info">
                        <div><span className="label">Quotation ID</span> : <span>
                            {selectedCreditNote.quotationReferenceNumber || selectedCreditNote.quotationRefno}</span></div>
                        <div><span className="label">Date</span> :<span>
                            {selectedCreditNote?.invoiceDate
                                ? (() => {
                                    const d = new Date(selectedCreditNote.invoiceDate);
                                    const day = String(d.getDate()).padStart(2, "0");
                                    const month = String(d.getMonth() + 1).padStart(2, "0");
                                    const year = d.getFullYear();
                                    return `${day}/${month}/${year}`;
                                })()
                                : "/"}

                        </span></div>

                        <div><span className="label">Status</span>: <span>{quotationStatusLabel(selectedCreditNote.invoiceStatus)}</span></div>
                        <div><span className="label">Due Date</span> :<span>
                            {selectedCreditNote?.dueDate
                                ? (() => {
                                    const d = new Date(selectedCreditNote.dueDate);
                                    const day = String(d.getDate()).padStart(2, "0");
                                    const month = String(d.getMonth() + 1).padStart(2, "0");
                                    const year = d.getFullYear();
                                    return `${day}/${month}/${year}`;
                                })()
                                : "/"}

                        </span></div>

                        <div><span className="label">Total Amount</span> :<span>{selectedCreditNote.totalAmount?.toFixed(2)}</span></div>

                        {selectedCreditNote.Status === "Rejected" && (
                            <div className="info-row">
                                <span className="label">Reason</span>
                                <span className="colon">:</span>
                                <span className="values" style={{ marginInlineStart: '-1px' }}>{selectedCreditNote.reason}</span>
                            </div>

                        )}
                    </div>


                    <h4 className="quotation-view-section-title">Invoice Information</h4>

                    <div className="quotation-view-info">
                        <div>
                            <span className="label">Invoice Id</span> :
                            <span>{selectedCreditNote.invoiceReferenceNumber}</span>
                        </div>

                        <div>
                            <span className="label">Invoice Date</span> :
                            <span>
                                {selectedCreditNote?.invoiceDate
                                    ? (() => {
                                        const d = new Date(selectedCreditNote.invoiceDate);
                                        const day = String(d.getDate()).padStart(2, "0");
                                        const month = String(d.getMonth() + 1).padStart(2, "0");
                                        const year = d.getFullYear();
                                        return `${day}/${month}/${year}`;
                                    })()
                                    : "/"}
                            </span>
                        </div>
                        <div>
                            <span className="label">Due Date</span>:
                            <span>


                                {selectedCreditNote?.dueDate
                                    ? (() => {

                                        const d = new Date(
                                            selectedCreditNote.dueDate
                                        );

                                        const day = String(
                                            d.getDate()
                                        ).padStart(2, "0");

                                        const month = String(
                                            d.getMonth() + 1
                                        ).padStart(2, "0");

                                        const year = d.getFullYear();

                                        return `${day}/${month}/${year}`;

                                    })()
                                    : "/"}
                            </span>
                        </div>

                        <div>
                            <span className="label">Invoice Status</span> :
                            <span>{selectedCreditNote.invoiceStatus}</span>
                        </div>

                        {selectedCreditNote.invoiceStatus === "Cancelled" && (
                            <div className="info-row">
                                <span className="label">Reason</span>
                                <span className="colon">:</span>
                                <span className="values">{selectedCreditNote.reason}</span>
                            </div>
                        )}
                    </div>



                    <h4 className="quotation-view-section-title">
                        Credit Note Information
                    </h4>

                    <div className="quotation-view-info">

                        <div>
                            <span className="label">
                                Credit Note Refno.
                            </span>:
                            <span>{selectedCreditNote.referenceNumber}</span>
                        </div>

                        <div>
                            <span className="label">
                                Credit Note Date
                            </span>:
                            <span>
                                {selectedCreditNote?.creditNoteDate
                                    ? (() => {

                                        const d = new Date(
                                            selectedCreditNote.creditNoteDate
                                        );

                                        const day = String(
                                            d.getDate()
                                        ).padStart(2, "0");

                                        const month = String(
                                            d.getMonth() + 1
                                        ).padStart(2, "0");

                                        const year = d.getFullYear();

                                        return `${day}/${month}/${year}`;

                                    })()
                                    : "/"}</span>
                        </div>



                    </div>

                  
                    {/* Quotation Details Table */}
                    <h4 className="quotation-view-section-title">Quotation Details</h4>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ITEM CODE</th>
                                <th>CATEGORY</th>
                                <th>NAME</th>
                                <th>QUANTITY</th>
                                <th>UNIT RATE EXCL VAT</th>
                                <th>AMOUNT</th>
                                <th>DISCOUNT</th>
                                <th>DISCOUNTED TOTAL</th>
                                <th>VAT %</th>
                                <th>NET AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(selectedCreditNote.details || []).map((d, i) => {
                                const qty = Number(d.quotationQuantity ?? d.itemQuantity ?? 0);
                                const vat = Number(d.tax ?? d.vat ?? 0);
                                const unitRate = Number(d.unitRate ?? 0);
                                const discount = Number(d.discount ?? 0);

                                const amount = qty * unitRate;
                                const discountedTotal = amount - discount;
                                const netAmount = discountedTotal + (discountedTotal * vat) / 100;

                                return (
                                    <tr key={i}>
                                        <td>{d.itemCode}</td>
                                        <td>{d.category}</td>
                                        <td>{d.itemName}</td>

                                        <td style={{ textAlign: "right" }}>
                                            {qty}
                                        </td>

                                        <td style={{ textAlign: "right" }}>
                                            {unitRate.toFixed(2)}
                                        </td>

                                        <td style={{ textAlign: "right" }}>
                                            {amount.toFixed(2)}
                                        </td>

                                        <td style={{ textAlign: "right" }}>
                                            {discount.toFixed(2)}
                                        </td>

                                        <td style={{ textAlign: "right" }}>
                                            {discountedTotal.toFixed(2)}
                                        </td>

                                        <td style={{ textAlign: "right" }}>
                                            {vat}
                                        </td>

                                        <td style={{ textAlign: "right" }}>
                                            {netAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Customer Information */}
                    <h4 className="quotation-view-section-title">Customer Information</h4>
                    <div className="quotation-view-info">
                        <div><span className="label">Company Name</span> : <span>{selectedCreditNote.receivingEntity}</span></div>
                        <div><span className="label">Name</span> : <span>{selectedCreditNote.customerName}</span></div>
                        <div><span className="label">Phone</span> :<span>{selectedCreditNote.customerPhone}</span></div>
                        <div><span className="label">Email</span>: <span>{selectedCreditNote.customerEmail}</span></div>
                        <div><span className="label">Address</span> :<span>{selectedCreditNote.customerAddress}</span></div>
                        <div><span className="label">Payment Terms</span> :<span>{selectedCreditNote.paymentTerms}</span></div>

                    </div>


                </div>
            </div>
        </div>
    );
};

export default CreditNotePopup;