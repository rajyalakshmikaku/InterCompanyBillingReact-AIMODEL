import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { checkUserApprovalStatus } from './services/api';
import Layout from './Layout/Layout';
import Login from './Pages/Login/Login';
import ReceivingEntities from './Pages/ReceivingEntities/ReceivingEntities';
import Roles from './Pages/Roles/Roles';
import Quotation from './Pages/Quotation/Quotation';
import Registration from './Pages/UserRegistration/Registration';
import Activation from './Pages/UserActivation/Activation';
import Products from './Pages/InventoryItem/InventoryItem';
import ScreenMapping from './Pages/RoleWiseScreenMapping/ScreenMapping';
import LandingPage from './Pages/LandingPage';
import MasterData from './Pages/MasterData/MasterData';
import Quotationapproval from './Pages/QuotationApproval/Quotationapproval';
import QuotationTemplate from './Pages/QuotationApproval/QuotationTemplate';
import QuotationInvoiceapproval from './Pages/QuotationApproval/QuotationInvoiceList';
import Customers from './Pages/Customers/Customer';
import QuotationDashboard from './Pages/QuotationDashboard/QuotationDashboard';
import AuditLogs from './Pages/AuditLogs/AuditLogs';
import PrivateRoute from './components/PrivateRoutes';
import EditProfile from './Pages/UserRegistration/EditProfile';
import ChangePassword from './Pages/ChangePassword/ChangePassword';
import Reports from './Pages/Reports/Reports';
import UsersList from './Pages/UsersList/UsersList';
import InvoiceTemplate from './Pages/QuotationApproval/InvoiceTemplate';
import QuotationTemplateModern from './Pages/QuotationApproval/QuotationTemplateModern';
import CreditNoteTemplate from './Pages/QuotationApproval/CreditNoteTemplate';
import CreditNoteViewTemplate from './Pages/QuotationApproval/CreditNoteViewTemplate';
import ReportsDashboard from './Pages/ReportsDashboard/ReportsDashboard';
import RejectedList from './Pages/RejectedList/RejectedList';
import BillingOverview from './Pages/BillingOverview/BillingOverview';
import BulkUploadHistoricalBacklog from './Pages/BulkUpload/BulkUploadHistoricalBacklog';
import ProformaInvoiceTemplate from './Pages/QuotationApproval/ProformaInvoiceTemplate';
import Deleted from './Pages/Deleted/Deleted';
import UserVerification from './Pages/UserVerification/UserVerification';
import AiChat from './Pages/Aichat/AiChat';

function App() {
  useEffect(() => {
    // Temporarily disabled — checkUserApprovalStatus() should not be called
    // for now. Re-enable this call (and the one in the axios interceptor in
    // src/services/api.js) to restore the declined-account block.
    // checkUserApprovalStatus();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/activation" element={<Activation />} />
        {/* AI chat is usable both signed in and signed out */}
        <Route path="/chat" element={<AiChat />} />
        <Route path="/quotationtemplate" element={<QuotationTemplate />} />
        <Route path="/Invoicetemplate" element={<InvoiceTemplate />} />
        <Route path="/QuotationTemplateModern" element={<QuotationTemplateModern />} />
        <Route path="/CreditNotetemplate/:id" element={<CreditNoteTemplate />} />
        <Route path="/CreditNoteViewtemplate" element={<CreditNoteViewTemplate />} />
        <Route path="/ProformaInvoicetemplate" element={<ProformaInvoiceTemplate />} />
        {/* Protected routes inside Layout */}
        <Route path="/" element={<Layout />}>
         
          <Route
            path="/aichat"
            element={
              <PrivateRoute requiredScreen="/aichat">
                <AiChat />
              </PrivateRoute>
            }
          />

          <Route
            path="/billingOverview"
            element={
              <PrivateRoute requiredScreen="/billingOverview">
                <BillingOverview />
              </PrivateRoute>
            }
          />

          <Route
            path="/receivingentities"
            element={
              <PrivateRoute requiredScreen="/receivingentities">
                <ReceivingEntities />
              </PrivateRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <PrivateRoute requiredScreen="/roles">
                <Roles />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotation"
            element={
              <PrivateRoute requiredScreen="/quotation">
                <Quotation />
              </PrivateRoute>
            }
          />
          {/* <Route
            path="/department"
            element={
              <PrivateRoute requiredScreen="/Products">
                <Department />
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/Products"
            element={
              <PrivateRoute requiredScreen="/Products">
                <Products />
              </PrivateRoute>
            }
          />
          <Route
            path="/screenmapping"
            element={
              <PrivateRoute requiredScreen="/screenmapping">
                <ScreenMapping />
              </PrivateRoute>
            }
          />
          <Route
            path="/landingpage"
            element={
              <PrivateRoute>
                <LandingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/masterdata"
            element={
              <PrivateRoute requiredScreen="/masterdata">
                <MasterData />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotationapproval"
            element={
              <PrivateRoute requiredScreen="/quotationapproval">
                <Quotationapproval />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotationinvoiceapproval"
            element={
              <PrivateRoute requiredScreen="/quotationinvoiceapproval">
                <QuotationInvoiceapproval />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute requiredScreen="/customers">
                <Customers />
              </PrivateRoute>
            }
          />
          <Route
            path="/quotationdashboard"
            element={
              <PrivateRoute requiredScreen="/quotationdashboard">
                <QuotationDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/Auditlog"
            element={
              <PrivateRoute requiredScreen="/Auditlog">
                <AuditLogs />
              </PrivateRoute>
            }
          />
          <Route

            path="/editprofile"
            element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            }
          />
          <Route

            path="/Reports"
            element={
              <PrivateRoute requiredScreen="/Reports">
                <Reports />
              </PrivateRoute>
            }
          />
          <Route

            path="/ReportsDashboard"
            element={
              <PrivateRoute requiredScreen="/ReportsDashboard">
                <ReportsDashboard />
              </PrivateRoute>
            }
          />
          <Route

            path="/ChangePassword"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />
          <Route
            path="/userslist"
            element={
              <PrivateRoute>
                <UsersList />
              </PrivateRoute>
            }
          />

          <Route
            path="/userverification"
            element={
              <PrivateRoute>
                <UserVerification />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/OrderCompletedList"
            element={
              <PrivateRoute requiredScreen="/OrderCompletedList">
                <RejectedList />
              </PrivateRoute>
            }
          />

           <Route
            path="/bulk-upload"
            element={
              <PrivateRoute>
                <BulkUploadHistoricalBacklog />
              </PrivateRoute>
            }
          />

          <Route
            path="/Deleted"
            element={
              <PrivateRoute requiredScreen="/Deleted">
                <Deleted />
              </PrivateRoute>
            }
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
