import {
  FaChartBar,
  FaCheckCircle,
  FaDatabase,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaHistory,
  FaTachometerAlt,
  FaTrashAlt,
  FaUpload,
  FaUserShield,
  FaUsers,
  FaUsersCog,
  FaBuilding,
  FaBoxOpen,
  FaComments
} from 'react-icons/fa';

export const allRoutes = [
  { path: '/quotationdashboard', label: 'Dashboard', group: 'General', icon: FaTachometerAlt },
  { path: '/ReportsDashboard', label: 'Reports Dashboard', group: 'General', icon: FaChartBar },
  { path: '/OrderCompletedList', label: 'Complete Order List', group: 'General', icon: FaChartBar },
  { path: '/quotation', label: 'Quotation', group: 'Billing', icon: FaFileInvoiceDollar },
  { path: '/quotationapproval', label: 'Quotation Approval', group: 'Billing', icon: FaCheckCircle },
  { path: '/quotationInvoiceapproval', label: 'Invoice Approval', group: 'Billing', icon: FaFileInvoice },
  { path: '/billingOverview', label: 'Billing Overview', group: 'Billing', icon: FaFileInvoice },
  { path: '/Deleted', label: 'Deleted', group: 'Billing', icon: FaTrashAlt },
  { path: '/bulk-upload', label: 'Bulk Upload', group: 'Billing', icon: FaUpload },
  { path: '/customers', label: 'Customers', group: 'Master Data', icon: FaUsers },
  { path: '/ReceivingEntities', label: 'Companies', group: 'Master Data', icon: FaBuilding },
  { path: '/Products', label: 'Products', group: 'Master Data', icon: FaBoxOpen },
  { path: '/masterdata', label: 'Master', group: 'Master Data', icon: FaDatabase },
  { path: '/Roles', label: 'Roles', group: 'Administration', icon: FaUserShield },
  { path: '/userverification', label: 'User Verification', group: 'Administration', icon: FaUsersCog },
  { path: '/screenmapping', label: 'User Management', group: 'Administration', icon: FaUsersCog },
  { path: '/Auditlog', label: 'Audit Log', group: 'Administration', icon: FaHistory },
  { path: '/aichat', label: 'Chat', group: 'General', icon: FaComments },
];

export const GROUP_ORDER = ['General', 'Billing', 'Master Data', 'Administration'];