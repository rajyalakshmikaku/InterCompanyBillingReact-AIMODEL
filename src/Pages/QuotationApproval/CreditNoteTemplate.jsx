import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import { fetchInvoicedetailswithRefno } from '../../redux/QuotationTemplateSlice';
import './CreditNoteTemplate.css';
import { baseURL } from "../../services/api";
import { updateCreditNote } from '../../redux/CreditNoteSlice';
import { fetchActiveUrl } from '../../redux/RegistrationSlice';

const CreditNoteTemplate = ({ invoiceId, closeModal, onSaved }) => {
    debugger
    const dispatch = useDispatch();


    const { loading: saveLoading, success, error: saveError, message: saveMessage } = useSelector((state) => state.creditNote);
    const LOCAL_LOGO = "/mnt/data/bc2c1b92-1579-4906-8ac1-ef8ace38394b.png";
    const [editableInvoice, setEditableInvoice] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch((fetchActiveUrl()));

    }, [dispatch]);

    const { activeurl, error } = useSelector((state) => state.registration);
    console.log("activeurl (raw):", activeurl);
    const activationUrl = `${activeurl?.[0] || ''}CreditNoteViewtemplate`;
    console.log('activationUrl:', activationUrl);

    const {
        invoiceDetails,
        invoiceloading,
        message
    } = useSelector((state) => state.quotationApprovalTemplate) || {};

    const invoice = invoiceDetails?.list?.[0] || null;



    useEffect(() => {

        if (invoice) {

            console.log("API INVOICE OBJECT:", invoice);

            const today = new Date();

            setEditableInvoice({
                ...invoice,

                creditDate: today,

                dueDate: invoice.dueDate
                    ? new Date(invoice.dueDate)
                    : today,

                details: (invoice.details || []).map(d => ({
                    ...d,

                    quotationQuantity: d.quotationQuantity ?? 0,
                    unitRate: d.unitRate ?? 0,
                    discount: d.discount ?? 0,
                    tax: d.tax ?? 0,

                    isSelected: true
                }))
            });

        }

    }, [invoice]);
    const formatDateDisplay = (date) => {
        if (!date) return '-';

        const d = new Date(date);

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const getTodayFormatted = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}${mm}${yyyy}`;
    };
    const fullCreditNoteNumber = `${editableInvoice?.creditNoteNumber || ''}/${getTodayFormatted()}`;
    useEffect(() => {
        console.log("Received invoiceId:", invoiceId);
        if (invoiceId) {
            dispatch(fetchInvoicedetailswithRefno(invoiceId));
        }
    }, [dispatch, invoiceId]);

    const validateForm = () => {
        // if (!editableInvoice?.creditNoteNumber) {
        //     alertify.alert('error', "Credit Note Number is required");
        //     return false;
        // }

        // // Format validation: 2 letters + 4 digits
        // if (!/^[A-Z]{2}[0-9]{4}$/.test(editableInvoice.creditNoteNumber)) {
        //     alertify.alert('error', "Credit Note must be like CN0001");
        //     return false;
        // }

        if (!editableInvoice?.customerName) {
            alertify.alert('error', "Customer Name is required");
            return false;
        }

        if (!editableInvoice?.customerEmail) {
            alertify.alert('error', "Email is required");
            return false;
        }

        // simple email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(editableInvoice.customerEmail)) {
            alertify.alert('error', "Enter a valid email (must include @ and domain)");
            return false;
        }

        if (!editableInvoice?.customerPhone) {
            alertify.alert('error', "Phone is required");
            return false;
        }
        if (!/^[0-9]{10}$/.test(editableInvoice.customerPhone)) {
            alertify.alert('error', "Phone must be exactly 10 digits");
            return false;
        }

        if (!editableInvoice?.customerAddress) {
            alertify.alert('error', "Address is required");
            return false;
        }

        return true;
    };


    // ─── Helpers ─────────────────────────────────────────────────────────────────

    const formatCurrency = (n) => {
        if (n == null) return '-';
        return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const finalLogo = editableInvoice?.comapanyLogo
        ? `${baseURL}/UploadedFiles/${editableInvoice.comapanyLogo.split('\\').pop()}`
        : LOCAL_LOGO;

    const logoFileName = editableInvoice?.comapanyLogo
        ? editableInvoice.comapanyLogo
            .replace(/\\/g, "/")
            .split("/")
            .pop()
            ?.trim()
        : "";
    const logoUrl = logoFileName
        ? `${baseURL}/UploadedFiles/${logoFileName}`
        : LOCAL_LOGO;

    // ─── Handlers ────────────────────────────────────────────────────────────────

    const handleChange = (field, value) =>
        setEditableInvoice(prev => ({ ...prev, [field]: value }));

    const handleItemChange = (index, field, value) => {
        console.log("Changing", index, field, value);

        setEditableInvoice(prev => {
            const updated = {
                ...prev,
                details: prev.details.map((item, i) =>
                    i === index
                        ? { ...item, [field]: value }
                        : item
                )
            };

            console.log(updated.details[index]);

            return updated;
        });
    };

    const addRow = () =>
        setEditableInvoice(prev => ({
            ...prev,
            details: [...prev.details, { itemCode: '', category: '', itemName: '', quotationQuantity: 0, unitRate: 0, discount: 0, tax: 0 }]
        }));

    const removeRow = (index) =>
        setEditableInvoice(prev => ({ ...prev, details: prev.details.filter((_, i) => i !== index) }));

    // ─── Derived totals ───────────────────────────────────────────────────────────

    const derivedSubtotal = (editableInvoice?.details || []).reduce((sum, d) => {
        if (!d.isSelected) return sum;

        const qty = Number(d.quotationQuantity) || 0;
        const rate = Number(d.unitRate) || 0;
        const disc = Number(d.discount) || 0;

        const base = qty * rate;
        const validDiscount = Math.min(disc, base);

        return sum + (base - validDiscount);
    }, 0);

    const derivedVat = (editableInvoice?.details || []).reduce((sum, d) => {
        if (!d.isSelected) return sum;

        const qty = Number(d.quotationQuantity) || 0;
        const rate = Number(d.unitRate) || 0;
        const disc = Number(d.discount) || 0;
        const vat = Number(d.vat) || 0;

        const base = qty * rate;
        const validDiscount = Math.min(disc, base);
        const taxable = base - validDiscount;

        return sum + (taxable * vat) / 100;
    }, 0);

    const derivedTotal = derivedSubtotal + derivedVat;

    // ─── Save ─────────────────────────────────────────────────────────────────────



    const handleSave = async () => {
        debugger;
        if (!validateForm()) return;

        if (derivedTotal <= 0) {
            alertify.alert(
                "Warning",
                "Total Amount Incl. VAT must be greater than 0 before saving."
            );
            return;
        }
        for (const d of editableInvoice.details) {
            const amount =
                (Number(d.quotationQuantity) || 0) *
                (Number(d.unitRate) || 0);

            if (Number(d.discount) > amount) {
                alertify.alert(
                    'Warning',
                    `${d.itemCode}: Discount cannot exceed Amount (${amount})`
                );
                return;
            }
        }

        const formatDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            return isNaN(d.getTime()) ? null : d.toISOString();
        };
        console.log("editableInvoice", editableInvoice)

        // const payload = {
        //     header: {

        //         creditNoteReferenceNumber: fullCreditNoteNumber || null,
        //         creditNoteDate: formatDate(editableInvoice.creditDate) || new Date().toISOString(),
        //         dueDate: formatDate(editableInvoice.dueDate) || new Date().toISOString(),

        //         inoviceReferenceNumber: editableInvoice.invoiceReferenceNumber, // match backend typo

        //         companyName: editableInvoice.companyName,
        //         vatNumber: editableInvoice.vatNumber,
        //         registrationNumber: editableInvoice.registrationNumber,
        //         companyAddress: editableInvoice.companyAddress,
        //         companyWebsite: editableInvoice.companyWebsite || "-",
        //         companyEmail: editableInvoice.companyEmail,
        //         companyPhoneNumber: editableInvoice.companyPhoneNumber,
        //         accountHolderName: editableInvoice.accountHolderName,
        //         bankAccountNumber: editableInvoice.bankAccountNumber,
        //         branchCode: editableInvoice.branchCode,
        //         BrannchAddress: editableInvoice.brannchAddress,
        //         Currency: editableInvoice.currency,
        //         IFSCCode: editableInvoice.ifscCode,
        //         PaymentTerms: editableInvoice.paymentTerms,
        //         QuotationType: editableInvoice.quotationType,
        //         customerName: editableInvoice.customerName,
        //         customerEmail: editableInvoice.customerEmail,
        //         customerPhone: editableInvoice.customerPhone,
        //         customerAddress: editableInvoice.customerAddress,
        //         customerRefno: editableInvoice.customerRefno,

        //         subTotal: derivedSubtotal,
        //         taxAmount: derivedVat,
        //         totalAmount: derivedTotal,
        //         activationUrl: activationUrl
        //     },

        //     details: editableInvoice.details
        //         .filter(d => d.isSelected)
        //         .map(d => {
        //             const qty = Number(d.quotationQuantity) || 0;
        //             const rate = Number(d.unitRate) || 0;
        //             const discount = Number(d.discount) || 0;

        //             const base = qty * rate;

        //             const validDiscount = Math.min(discount, base);
        //             const discountedAmount = base - validDiscount;


        //             return {
        //                 itemCode: d.itemCode,
        //                 category: d.category,
        //                 itemName: d.itemName,
        //                 itemQuantity: qty,
        //                 unitRate: rate,
        //                 discount: discount,
        //                 DiscountValue: discountedAmount, // ✅ correct
        //                 VAT: Number(d.tax),
        //                 itemAmount: base,
        //                 DiscountType: "Amount",
        //             };
        //         })
        // };

        const payload = {
            header: {
                referenceNumber: fullCreditNoteNumber || null,
                creditNoteNumber: editableInvoice.creditNoteNumber,
                creditNoteReferenceNumber: fullCreditNoteNumber || null,
                creditNoteDate: formatDate(editableInvoice.creditDate) || new Date().toISOString(),
                dueDate: formatDate(editableInvoice.dueDate) || new Date().toISOString(),
                inoviceReferenceNumber: editableInvoice.invoiceReferenceNumber,
                companyName: editableInvoice.companyName,
                vatNumber: editableInvoice.vatNumber,
                registrationNumber: editableInvoice.registrationNumber,
                companyAddress: editableInvoice.companyAddress,
                companyWebsite: editableInvoice.companyWebsite || "-",
                companyEmail: editableInvoice.companyEmail,
                companyPhoneNumber: editableInvoice.companyPhoneNumber,
                accountHolderName: editableInvoice.accountHolderName,
                bankAccountNumber: editableInvoice.bankAccountNumber,
                branchCode: editableInvoice.branchCode,
                branchAddress: editableInvoice.branchAddress || editableInvoice.brannchAddress,
                BrannchAddress: editableInvoice.brannchAddress || editableInvoice.branchAddress,
                bankName: editableInvoice.bankName,
                currency: editableInvoice.currency,
                Currency: editableInvoice.currency,
                IFSCCode: editableInvoice.ifscCode,
                PaymentTerms: editableInvoice.paymentTerms,
                QuotationType: editableInvoice.quotationType,
                customerName: editableInvoice.customerName,
                customerEmail: editableInvoice.customerEmail,
                customerPhone: editableInvoice.customerPhone,
                customerAddress: editableInvoice.customerAddress,
                customerRefno: editableInvoice.customerRefno,
                invoiceDate: formatDate(editableInvoice.invoiceDate) || undefined,
                subTotal: derivedSubtotal,
                taxAmount: derivedVat,
                totalAmount: derivedTotal,
                activationUrl: activationUrl
            },

            details: editableInvoice.details
                .filter(d => d.isSelected)
                .map(d => {
                    const qty = Number(d.quotationQuantity) || 0;
                    const rate = Number(d.unitRate) || 0;
                    const discount = Number(d.discount) || 0;
                    const tax = Number(d.vat) || 0;

                    const base = qty * rate;
                    const validDiscount = Math.min(discount, base);
                    const discountedAmount = base - validDiscount;

                    return {
                        itemCode: d.itemCode,
                        category: d.category,
                        itemName: d.itemName,
                        itemQuantity: qty,
                        unitRate: rate,
                        discount: discount,
                        DiscountValue: discountedAmount,
                        VAT: tax,
                        vat: tax,
                        itemAmount: base,
                        DiscountType: "Amount",
                    };
                })
        };



        try {
            debugger
            const res = await dispatch(updateCreditNote(payload)).unwrap();


            console.log("SUCCESS:", res);
            if (res.success === false) {
                alertify.alert("Error", res.message);
                return;
            }
            alertify.alert("SUCCESS", res.message || "Saved successfully", () => {
                // ✅ Close popup
                closeModal && closeModal();

                // ✅ Notify parent to update status
                onSaved && onSaved();
            });

        } catch (err) {

            console.error("ERROR:", err);
            alertify.error("ERROR", err || "Failed to save");
        }
    };

    // ─── Guards ───────────────────────────────────────────────────────────────────

    if (invoiceloading || (!editableInvoice && !error)) {
        return (
            <div className="cn-spinner-container">
                <div className="cn-spinner"></div>
            </div>
        );
    }

    if (error) return <div className="cn-error-message">Failed to load credit note. Please try again.</div>;
    if (!editableInvoice) return <div className="cn-error-message">Data not found.</div>;

    // ─── Render ───────────────────────────────────────────────────────────────────

    return (
        <div className="cn-wrapper">
            <div className="cn-card">
                {message && <div className="cn-banner success">{message}</div>}
                {error && <div className="cn-banner error">{error}</div>}

                {/* ── Header ── */}
                <header className="cn-header">
                    <div className="cn-header-left">
                        {editableInvoice.comapanyLogo && (() => {
                            const logoFileName = editableInvoice.comapanyLogo.split(/[/\\]/).pop();
                            // console.log('logoFileName', logoFileName);
                            return (
                                <img
                                    src={`${baseURL}/UploadedFiles/${logoFileName}`}
                                    alt="Company Logo"
                                    className="cn-logo"
                                />
                            );
                        })()}

                        {/* <img
                            src={logoUrl}
                            alt="Company Logo"
                            className="cn-logo"
                            crossOrigin="anonymous"
                            onLoad={() => console.log("Logo Loaded:", logoUrl)}
                            onError={(e) => {
                                console.log("Logo Failed:", logoUrl);

                                e.target.onerror = null;
                                e.target.src = LOCAL_LOGO;
                            }}
                        /> */}
                        {/* <img src={finalLogo} alt="Company Logo" className="cn-logo" /> */}
                    </div>

                    <div className="cn-header-center">
                        <h1 className="cn-title">CREDIT NOTE</h1>
                    </div>
                    <div className="cn-header-right">
                        <div className="cn-company-name">{editableInvoice.companyName}</div>
                        <div className="cn-company-small">{editableInvoice.companyAddress}</div>
                        <div className="cn-company-small">{editableInvoice.companyPhoneNumber}</div>
                        <div className="cn-company-small">{editableInvoice.companyEmail}</div>
                    </div>
                </header>

                {/* ── Body ── */}
                <section className="cn-body">

                    {/* ── Info Row ── */}
                    <div className="cn-row">

                        {/* Company (read-only) + Customer (editable) */}
                        <div className="cn-block">
                            <h4 className="cn-block-title">Company Information</h4>
                            <KVReadOnly label="Registration No" value={editableInvoice.registrationNumber} />
                            <KVReadOnly label="VAT Number" value={editableInvoice.vatNumber} />
                            <KVReadOnly label="Phone" value={editableInvoice.companyPhoneNumber} />
                            <KVReadOnly label="Website" value={editableInvoice.companyWebsite} />
                            {/* <KVReadOnly label="Address" value={editableInvoice.companyAddress} /> */}

                            <div style={{ height: 10 }} />
                            <h4 className="cn-block-title">Bank Account Information</h4>
                            <KVReadOnly label="Account Holder" value={editableInvoice.accountHolderName} />

                            <KVReadOnly label="Bank Name" value={editableInvoice.bankName} />
                            <KVReadOnly label="Account Holder" value={editableInvoice.accountHolderName} />

                            <KVReadOnly label="Branch Code" value={editableInvoice.branchCode} />
                            <KVReadOnly label="Branch Address" value={editableInvoice.brannchAddress} />
                            <KVReadOnly label="Account Number" value={editableInvoice.bankAccountNumber} />

                        </div>

                        {/* Credit Note Details (editable) */}
                        <div className="cn-block">

                            <h4 className="cn-block-title">Credit Note Details</h4>
                            <KVReadOnly label="Invoice Ref" value={editableInvoice.invoiceReferenceNumber} />
                            <KVReadOnly label="Credit Note No " value="Auto generated on submit" />
                           
                            <KVReadOnly
                                label="Credit Date"
                                value={formatDateDisplay(editableInvoice.creditDate)}
                            />

                            <KVReadOnly
                                label="Due Date"
                                value={formatDateDisplay(editableInvoice.dueDate)}
                            />
                            {/* <KVEdit label="Invoice Ref"   value={editableInvoice.invoiceReferenceNumber} onChange={v => handleChange('invoiceReferenceNumber', v)} /> */}
                            <div style={{ height: 10 }} />
                            <h4 className="cn-block-title">Customer Information</h4>

                            <div className="cn-form-grid">
                                {/* <KVEdit label="Reference No" value={editableInvoice.customerRefno} onChange={v => handleChange('customerRefno', v)} /> */}
                                <KVReadOnly label="Credit Note Addressed To." value={editableInvoice.receivingEntity} />
                                <KVEdit label="Name" value={editableInvoice.customerName} onChange={v => handleChange('customerName', v)} />

                                <KVEdit label="Email" value={editableInvoice.customerEmail} onChange={v => handleChange('customerEmail', v)} />
                                <KVEdit
                                    label="Phone"
                                    value={editableInvoice.customerPhone}
                                    onChange={v => {
                                        // allow only numbers & max 10 digits
                                        const cleaned = v.replace(/\D/g, '').slice(0, 10);
                                        handleChange('customerPhone', cleaned);
                                    }}
                                />

                                {/* Full width */}
                                <div className="full-width">
                                    <KVEdit
                                        label="Address"
                                        value={editableInvoice.customerAddress}
                                        onChange={v => handleChange('customerAddress', v)}
                                        type="textarea"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Line Items (editable) ── */}
                    <div className="cn-row">
                        <div className="cn-block full">
                            <h4 className="cn-block-title">Quotation Details</h4>
                            <div className="cn-table-wrap">
                                <table className="cn-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>ITEM CODE</th>
                                            <th>CATEGORY</th>
                                            <th>NAME</th>
                                            <th>QTY</th>
                                            <th>UNIT RATE EXCL VAT</th>
                                            <th>AMOUNT</th>
                                            <th>DISCOUNT</th>
                                            <th>DISCOUNTED TOTAL</th>
                                            <th>VAT %</th>
                                            <th>NET</th>
                                            {/* <th></th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editableInvoice.details.map((d, i) => {

                                            const tax = Number(d.tax) || 0;

                                            const qty = Number(d.quotationQuantity) || 0;
                                            const rate = Number(d.unitRate) || 0;
                                            const disc = Number(d.discount) || 0;

                                            const base = qty * rate;
                                            const validDiscount = Math.min(disc, base);
                                            const discountedAmount = base - validDiscount;

                                            const net = discountedAmount + (discountedAmount * tax / 100);

                                            console.log("Row:", i, {
                                                quotationQuantity: d.quotationQuantity,
                                                discount: d.discount,
                                                unitRate: d.unitRate,
                                                itemCode: d.itemCode
                                            });
                                            return (
                                                <tr key={i}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={d.isSelected}
                                                            onChange={e => handleItemChange(i, 'isSelected', e.target.checked)}
                                                        />
                                                    </td>

                                                    <td>{d.itemCode || '-'}</td>
                                                    <td>{d.category || '-'}</td>
                                                    <td>{d.itemName || '-'}</td>

                                                    {/* QTY */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        <input
                                                            type="number"
                                                            min="1" step="1"
                                                            value={d.quotationQuantity ?? ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;

                                                                if (value === "" || /^\d+$/.test(value)) {
                                                                    handleItemChange(
                                                                        i,
                                                                        "quotationQuantity",
                                                                        value === "" ? "" : Number(value)
                                                                    );
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if ([".", ",", "-", "+", "e", "E"].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                    </td>

                                                    {/* RATE */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={d.unitRate ?? 0}
                                                            style={{ textAlign: 'right' }}
                                                            onChange={e => {
                                                                let val = Number(e.target.value);
                                                                if (val < 0) val = 0;
                                                                handleItemChange(i, 'unitRate', val);
                                                            }}
                                                        />
                                                    </td>

                                                    {/* AMOUNT */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        {formatCurrency(base)}
                                                    </td>

                                                    {/* DISCOUNT */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={d.discount ?? ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;

                                                                handleItemChange(
                                                                    i,
                                                                    "discount",
                                                                    value === "" ? "" : Number(value)
                                                                );
                                                            }}
                                                        />
                                                    </td>

                                                    {/* DISCOUNTED AMOUNT */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        {formatCurrency(discountedAmount)}
                                                    </td>

                                                    {/* VAT */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        {d.vat || '0'}
                                                    </td>

                                                    {/* NET */}
                                                    <td style={{ textAlign: 'right' }}>
                                                        {formatCurrency(net)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* <button className="cn-add-row" onClick={addRow}>+ Add Row</button> */}
                        </div>
                    </div>

                    {/* ── Bank (read-only) + Totals ── */}
                    <div className="cn-row">
                        {/* <div className="cn-block">
                            <h4 className="cn-block-title">Bank Account Information</h4>
                            <KVReadOnly label="Account Holder" value={editableInvoice.accountHolderName} />
                            <KVReadOnly label="Branch Code" value={editableInvoice.branchCode} />
                            <KVReadOnly label="Branch Address" value={editableInvoice.brannchAddress}/>
                            <KVReadOnly label="Account Number" value={editableInvoice.bankAccountNumber} />
                            <KVReadOnly label="Bank Name"      value={editableInvoice.bankName} /> 
                        </div> */}

                        <div className="cn-block totals">
                            <div className="cn-totals-card">
                                <div className="cn-totals-row">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(derivedSubtotal)}</span>
                                </div>
                                <div className="cn-totals-row">
                                    <span>VAT</span>
                                    <span>{formatCurrency(derivedVat)}</span>
                                </div>
                                <div className="cn-totals-row grand">
                                    <span>Total Amount Incl. VAT</span>
                                    <span>{formatCurrency(derivedTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Notes ── */}
                    {/* <div className="cn-row">
                        <div className="cn-block full">
                            <h4 className="cn-block-title">Notes / Payment Terms</h4>
                            <textarea
                                className="cn-notes"
                                rows={3}
                                value={editableInvoice.notes || ''}
                                onChange={e => handleChange('notes', e.target.value)}
                                placeholder="Enter any additional notes or payment terms..."
                            />
                        </div>
                    </div> */}
                </section>

                {/* ── Save ── */}
                <div className="cn-save-wrapper">
                    <button
                        className="cn-save-btn"
                        onClick={handleSave}
                        disabled={saveLoading}
                    >
                        {saveLoading ? "Saving..." : "Save Credit Note"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KVReadOnly = ({ label, value }) => (
    <div className="cn-kv">
        <span>{label}</span>
        <span className="cn-kv-value">{value || '-'}</span>
    </div>
);



const KVEdit = ({ label, value, onChange, type = 'text' }) => (
    <div className="cn-kv">
        <span>{label}</span>

        {type === 'textarea' ? (
            <textarea
                className="cn-textarea"
                rows={3}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
            />
        ) : (
            <input
                type={type}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
            />
        )}
    </div>
);

export default CreditNoteTemplate;
