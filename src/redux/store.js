import { configureStore } from '@reduxjs/toolkit';
import authReducer from './LoginSlice';
import registrationReducer from './RegistrationSlice';
import screenmappingReducer from './ScreenMappingSlice';
import QuotationApprovalReducer from './QuotationApprovalSlice';
import masterReducer from "./MasterSlice";
import QuotationTemplateReducer from "./QuotationTemplateSlice";
import receivingEntitiesReducer from "./receivingEntitiesSlice";
import QuotationInvoiceApprovalReducer from "./QuotationInvoiceApprovalSlice";
import CustomerReducer from "./CustomerSlice";
import DashboardReducer from "./DashboardSlice"; 
import EditProfileReducer from "./EditProfileSlice"; 
import AuditReducer from "./AuditSlice";
import userReducer from "./UsersListSlice";   
import changePasswordReducer from "./ChangePasswordSlice";
import creditNoteReducer from "./CreditNoteSlice";
import reportsReducer from "./ReportsDashboardSlice";
import UserVerificationReducer from "./UserVerificationSlice";
import AiReducer from "./aiSlice";

export const store = configureStore({
  reducer: {
        auth: authReducer,
        registration: registrationReducer,
        screenmapping :screenmappingReducer,
        quotationapproval :QuotationApprovalReducer,
        master: masterReducer,
        quotationApprovalTemplate: QuotationTemplateReducer,
        receivingEntities: receivingEntitiesReducer,
        quotationInvoiceapproval : QuotationInvoiceApprovalReducer,
        Customers : CustomerReducer,
        dashboardsData : DashboardReducer,
        editProfile:EditProfileReducer,
        audit: AuditReducer,
        users: userReducer,
        changePassword: changePasswordReducer,
        creditNote: creditNoteReducer,
        reports : reportsReducer,
        users: UserVerificationReducer,
        ai: AiReducer,

  },
});
