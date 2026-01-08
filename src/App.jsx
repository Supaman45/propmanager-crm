import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './supabase';
import Auth from './Auth';
import TenantPortal from './TenantPortal';
import PaymentPage from './PaymentPage';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const initialTenants = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    phone: '(555) 234-5678',
    email: 'sarah.m@email.com',
    property: '1420 Oak Street, Unit 3B',
    rentAmount: 1850,
    securityDeposit: 1850,
    leaseStart: '2024-03-01',
    leaseEnd: '2025-02-28',
    status: 'current',
    paymentStatus: 'paid',
    notes: 'Prefers email communication'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    phone: '(555) 876-5432',
    email: 'mjohnson@email.com',
    property: '892 Pine Avenue, Unit 12',
    rentAmount: 2200,
    securityDeposit: 2200,
    leaseStart: '2024-01-15',
    leaseEnd: '2025-01-14',
    status: 'current',
    paymentStatus: 'late',
    notes: 'Has 2 pets (cats), pet deposit paid'
  },
  {
    id: 3,
    name: 'Emily Chen',
    phone: '(555) 345-6789',
    email: 'echen@email.com',
    property: '456 Maple Drive',
    rentAmount: 3200,
    securityDeposit: 3200,
    leaseStart: '2023-06-01',
    leaseEnd: '2024-05-31',
    status: 'past',
    paymentStatus: 'paid',
    notes: 'Moved out, full deposit returned'
  },
  {
    id: 4,
    name: 'David Williams',
    phone: '(555) 987-6543',
    email: 'dwilliams@email.com',
    property: 'Unassigned',
    rentAmount: 0,
    securityDeposit: 0,
    leaseStart: '',
    leaseEnd: '',
    status: 'prospect',
    paymentStatus: 'n/a',
    notes: 'Interested in 2BR units, move-in date: Feb 2025'
  }
];

const initialProperties = [
  { id: 1, address: '1420 Oak Street', units: 8, type: 'Multi-Family', occupied: 7, monthlyRevenue: 14200 },
  { id: 2, address: '892 Pine Avenue', units: 24, type: 'Apartment Complex', occupied: 22, monthlyRevenue: 48400 },
  { id: 3, address: '456 Maple Drive', units: 1, type: 'Single Family', occupied: 0, monthlyRevenue: 0 },
  { id: 4, address: '789 Cedar Lane', units: 4, type: 'Multi-Family', occupied: 4, monthlyRevenue: 7600 }
];

const initialMaintenanceRequests = [
  {
    id: 1,
    tenantId: 1,
    tenantName: 'Sarah Mitchell',
    property: '1420 Oak Street, Unit 3B',
    issue: 'Leaky faucet in kitchen',
    priority: 'medium',
    status: 'open',
    date: '2024-12-15',
    description: 'Kitchen faucet has been dripping for 3 days'
  },
  {
    id: 2,
    tenantId: 2,
    tenantName: 'Marcus Johnson',
    property: '892 Pine Avenue, Unit 12',
    issue: 'Broken heating unit',
    priority: 'high',
    status: 'open',
    date: '2024-12-18',
    description: 'Heating not working, urgent during winter'
  },
  {
    id: 3,
    tenantId: 1,
    tenantName: 'Sarah Mitchell',
    property: '1420 Oak Street, Unit 3B',
    issue: 'Window lock broken',
    priority: 'low',
    status: 'open',
    date: '2024-12-20',
    description: 'Bedroom window lock needs repair'
  }
];

// Demo data for Pacific Northwest properties
const demoProperties = [
  { address: 'Maple Heights Apartments, 1420 N 45th St, Seattle, WA 98103', type: 'Multi-family', units: 12, occupied: 5, monthlyRevenue: 9250 },
  { address: 'Cedar Park Townhomes, 3305 SE Hawthorne Blvd, Portland, OR 97214', type: 'Townhouse', units: 8, occupied: 3, monthlyRevenue: 6600 },
  { address: 'Evergreen Commons, 742 E Holly St, Bellingham, WA 98225', type: 'Multi-family', units: 6, occupied: 3, monthlyRevenue: 4950 },
  { address: 'Olympic View Duplex, 892 Ruston Way, Tacoma, WA 98402', type: 'Duplex', units: 2, occupied: 2, monthlyRevenue: 3900 },
  { address: 'Cascade Studio Lofts, 2100 Westlake Ave N, Seattle, WA 98109', type: 'Multi-family', units: 10, occupied: 2, monthlyRevenue: 2800 },
  { address: 'Willamette River House, 456 SW River Dr, Portland, OR 97201', type: 'Single-family', units: 1, occupied: 1, monthlyRevenue: 3200 }
];

const demoTenants = [
  { name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '206-555-0142', property: 'Maple Heights Apartments, Unit 4B', rentAmount: 1850, securityDeposit: 1850, status: 'current', paymentStatus: 'paid', leaseStart: '2025-03-01', leaseEnd: '2026-02-28', notes: '' },
  { name: 'Marcus Johnson', email: 'mjohnson@email.com', phone: '206-555-0187', property: 'Maple Heights Apartments, Unit 2A', rentAmount: 1850, securityDeposit: 1850, status: 'current', paymentStatus: 'late', leaseStart: '2024-08-01', leaseEnd: '2025-07-31', notes: '' },
  { name: 'Emily Nakamura', email: 'enakamura@email.com', phone: '503-555-0156', property: 'Cedar Park Townhomes, Unit 3', rentAmount: 2200, securityDeposit: 2200, status: 'current', paymentStatus: 'paid', leaseStart: '2025-01-15', leaseEnd: '2026-01-14', notes: '' },
  { name: 'David Okonkwo', email: 'dokonkwo@email.com', phone: '503-555-0198', property: 'Cedar Park Townhomes, Unit 7', rentAmount: 2200, securityDeposit: 2200, status: 'current', paymentStatus: 'paid', leaseStart: '2024-11-01', leaseEnd: '2025-10-31', notes: '' },
  { name: 'Lisa Tran', email: 'ltran@email.com', phone: '360-555-0134', property: 'Evergreen Commons, Unit 1', rentAmount: 1650, securityDeposit: 1650, status: 'current', paymentStatus: 'paid', leaseStart: '2025-02-01', leaseEnd: '2026-01-31', notes: '' },
  { name: 'James Rodriguez', email: 'jrodriguez@email.com', phone: '253-555-0176', property: 'Olympic View Duplex, Unit A', rentAmount: 1950, securityDeposit: 1950, status: 'current', paymentStatus: 'late', leaseStart: '2024-06-01', leaseEnd: '2025-05-31', notes: '' },
  { name: 'Rachel Kim', email: 'rkim@email.com', phone: '206-555-0145', property: 'Cascade Studio Lofts, Unit 8', rentAmount: 1400, securityDeposit: 1400, status: 'current', paymentStatus: 'paid', leaseStart: '2025-04-01', leaseEnd: '2026-03-31', notes: '' },
  { name: 'Michael Foster', email: 'mfoster@email.com', phone: '503-555-0167', property: 'Willamette River House, Unit Main', rentAmount: 3200, securityDeposit: 3200, status: 'current', paymentStatus: 'paid', leaseStart: '2024-09-01', leaseEnd: '2025-08-31', notes: '' },
  { name: 'Amanda Peters', email: 'apeters@email.com', phone: '206-555-0123', property: 'Maple Heights Apartments, Unit 6C', rentAmount: 1850, securityDeposit: 1850, status: 'current', paymentStatus: 'paid', leaseStart: '2024-12-01', leaseEnd: '2025-11-30', notes: '' },
  { name: 'Kevin Liu', email: 'kliu@email.com', phone: '360-555-0189', property: 'Unassigned', rentAmount: 0, securityDeposit: 0, status: 'prospect', paymentStatus: null, leaseStart: null, leaseEnd: null, notes: 'Interested in 2BR, moving from Vancouver BC' },
  { name: 'Jennifer Walsh', email: 'jwalsh@email.com', phone: '253-555-0112', property: 'Olympic View Duplex, Unit B', rentAmount: 1950, securityDeposit: 1950, status: 'current', paymentStatus: 'paid', leaseStart: '2025-01-01', leaseEnd: '2025-12-31', notes: '' },
  { name: 'Robert Nguyen', email: 'rnguyen@email.com', phone: '206-555-0154', property: 'Cascade Studio Lofts, Unit 3', rentAmount: 1400, securityDeposit: 1400, status: 'past', paymentStatus: null, leaseStart: '2024-01-01', leaseEnd: '2024-12-31', notes: 'Moved to California' },
  { name: 'Christina Martinez', email: 'cmartinez@email.com', phone: '503-555-0143', property: 'Unassigned', rentAmount: 0, securityDeposit: 0, status: 'prospect', paymentStatus: null, leaseStart: null, leaseEnd: null, notes: 'Application pending, excellent credit' },
  { name: 'Daniel Park', email: 'dpark@email.com', phone: '206-555-0198', property: 'Maple Heights Apartments, Unit 10D', rentAmount: 1850, securityDeposit: 1850, status: 'current', paymentStatus: 'paid', leaseStart: '2024-07-01', leaseEnd: '2025-06-30', notes: '' },
  { name: 'Samantha Brooks', email: 'sbrooks@email.com', phone: '360-555-0165', property: 'Evergreen Commons, Unit 2', rentAmount: 1650, securityDeposit: 1650, status: 'current', paymentStatus: 'late', leaseStart: '2024-10-01', leaseEnd: '2025-09-30', notes: '' }
];

const demoMaintenanceRequests = [
  { property: 'Maple Heights Apartments, Unit 4B', issue: 'Leaky faucet in bathroom', priority: 'low', status: 'closed', date: '2025-12-15', description: 'Leaky faucet in bathroom' },
  { property: 'Cedar Park Townhomes, Unit 3', issue: 'Furnace not heating properly', priority: 'high', status: 'in_progress', date: '2026-01-02', description: 'Furnace not heating properly' },
  { property: 'Evergreen Commons, Unit 1', issue: 'Garbage disposal jammed', priority: 'medium', status: 'open', date: '2026-01-05', description: 'Garbage disposal jammed' },
  { property: 'Olympic View Duplex, Unit A', issue: 'Front door lock sticking', priority: 'medium', status: 'open', date: '2026-01-04', description: 'Front door lock sticking' },
  { property: 'Cascade Studio Lofts, Unit 8', issue: 'Window seal broken, drafty', priority: 'high', status: 'in_progress', date: '2025-12-28', description: 'Window seal broken, drafty' },
  { property: 'Willamette River House, Unit Main', issue: 'Annual HVAC maintenance', priority: 'low', status: 'open', date: '2026-01-06', description: 'Annual HVAC maintenance' },
  { property: 'Maple Heights Apartments, Unit 2A', issue: 'Smoke detector beeping', priority: 'urgent', status: 'open', date: '2026-01-06', description: 'Smoke detector beeping' },
  { property: 'Cedar Park Townhomes, Unit 7', issue: 'Dishwasher not draining', priority: 'medium', status: 'closed', date: '2025-12-20', description: 'Dishwasher not draining' }
];

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    const savedTab = localStorage.getItem('propli_activeTab');
    return savedTab || 'dashboard';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Restore dark mode from localStorage on mount
    const savedDarkMode = localStorage.getItem('propli_darkMode');
    return savedDarkMode === 'true';
  });
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [tags, setTags] = useState([]);
  const [recordTags, setRecordTags] = useState([]); // Tag assignments
  const [tagHistory, setTagHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [dismissedBanners, setDismissedBanners] = useState(() => {
    // Restore dismissed banners from localStorage
    const saved = localStorage.getItem('propli_dismissedBanners');
    return saved ? JSON.parse(saved) : [];
  });
  const [expiringLeaseIds, setExpiringLeaseIds] = useState([]); // Track IDs of expiring leases for filtering
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [maintenanceSearchQuery, setMaintenanceSearchQuery] = useState('');
  const [maintenanceFilterTab, setMaintenanceFilterTab] = useState('all');
  const [confirmPaymentChange, setConfirmPaymentChange] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPaymentLog, setShowPaymentLog] = useState(null);
  const [showSelectTenantForPayment, setShowSelectTenantForPayment] = useState(false);
  const [paymentTenantSearch, setPaymentTenantSearch] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(null);
  const [newPayment, setNewPayment] = useState({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0] });
  const [newActivityNote, setNewActivityNote] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(null);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'repair' });
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [newProperty, setNewProperty] = useState({ address: '', units: '', type: '', occupied: '', monthlyRevenue: '', photo: null, ownerName: '', ownerEmail: '', ownerId: null });
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyPhotoUploading, setPropertyPhotoUploading] = useState(false);
  const [showDeletePropertyConfirm, setShowDeletePropertyConfirm] = useState(null);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [newMaintenanceRequest, setNewMaintenanceRequest] = useState({ tenantId: '', tenantName: '', property: '', issue: '', priority: 'medium', description: '', date: new Date().toISOString().split('T')[0] });
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [propertySortField, setPropertySortField] = useState(null);
  const [propertySortDirection, setPropertySortDirection] = useState('asc');
  const [editingTenant, setEditingTenant] = useState(null);
  const [ownerStatementProperty, setOwnerStatementProperty] = useState('');
  const [ownerStatementMonth, setOwnerStatementMonth] = useState('');
  const [showMoveOutModal, setShowMoveOutModal] = useState(null);
  const [moveOutData, setMoveOutData] = useState({ date: new Date().toISOString().split('T')[0], notes: '', deductions: [{ description: '', amount: '' }] });
  const [showReminderModal, setShowReminderModal] = useState(null);
  const [auditLogExpanded, setAuditLogExpanded] = useState(false);
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState({ amount: '', dueDate: '', note: '' });
  const [paymentLinkCopied, setPaymentLinkCopied] = useState(false);
  const [createdPaymentLink, setCreatedPaymentLink] = useState('');
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [tenantFiles, setTenantFiles] = useState([]);
  const [propertyFiles, setPropertyFiles] = useState([]);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Schedule state
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'general',
    description: '',
    property_id: null,
    tenant_id: null
  });
  
  // Onboarding Wizard state
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    property: null,
    unit: '',
    tenant: {
      name: '',
      email: '',
      phone: '',
      isExisting: false,
      existingId: null
    },
    lease: {
      monthlyRent: '',
      securityDeposit: '',
      startDate: '',
      endDate: '',
      leaseType: 'fixed' // fixed, month-to-month
    },
    documents: [],
    moveInDate: '',
    moveInNotes: ''
  });
  
  // Offboarding Wizard state
  const [showOffboardingWizard, setShowOffboardingWizard] = useState(false);
  const [offboardingStep, setOffboardingStep] = useState(1);
  const [offboardingData, setOffboardingData] = useState({
    tenant: null,
    moveOutDate: '',
    reason: '',
    forwardingAddress: '',
    inspectionChecklist: {
      wallsClean: false,
      floorsClean: false,
      appliancesWorking: false,
      plumbingWorking: false,
      keysReturned: false,
      smokeDetectorsWorking: false,
      noMissingItems: false
    },
    inspectionNotes: '',
    inspectionPhotos: [],
    depositDeductions: [],
    finalStatement: null
  });
  
  // Settings tab navigation
  const [settingsTab, setSettingsTab] = useState('profile');
  
  // Mobile navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Listen for resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Security form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Company form state
  const [companyData, setCompanyData] = useState({
    name: '',
    address: ''
  });
  
  // Email notification preferences
  const [emailNotifications, setEmailNotifications] = useState({
    lateRentReminders: true,
    newTenantAdded: true,
    maintenanceRequests: true,
    paymentReceived: true
  });
  
  // SMS/Twilio settings state
  const [twilioSettings, setTwilioSettings] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: ''
  });
  const [twilioSettingsLoading, setTwilioSettingsLoading] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsSending, setTestSmsSending] = useState(false);
  const [smsSending, setSmsSending] = useState({});
  
  // Tag management state
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: 'blue' });
  const [tagPickerOpen, setTagPickerOpen] = useState({ recordType: null, recordId: null });
  const [tagPickerSearch, setTagPickerSearch] = useState('');
  const [selectedTagFilters, setSelectedTagFilters] = useState([]);
  const [quickTagMenu, setQuickTagMenu] = useState({ recordType: null, recordId: null, x: 0, y: 0 });
  const [tagAnalysisDateRange, setTagAnalysisDateRange] = useState('all');
  const [selectedTagForTrend, setSelectedTagForTrend] = useState(null);
  const [expandedTagRow, setExpandedTagRow] = useState(null);
  
  // Owner Portal state
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);
  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    managementFeePercent: 10,
    portalEnabled: false
  });
  
  // CSV Import state
  const [tenantCsvFile, setTenantCsvFile] = useState(null);
  const [tenantCsvData, setTenantCsvData] = useState(null);
  const [tenantCsvPreview, setTenantCsvPreview] = useState(null);
  const [tenantColumnMapping, setTenantColumnMapping] = useState({});
  const [tenantImportProgress, setTenantImportProgress] = useState(null);
  
  const [propertyCsvFile, setPropertyCsvFile] = useState(null);
  const [propertyCsvData, setPropertyCsvData] = useState(null);
  const [propertyCsvPreview, setPropertyCsvPreview] = useState(null);
  const [propertyColumnMapping, setPropertyColumnMapping] = useState({});
  const [propertyImportProgress, setPropertyImportProgress] = useState(null);

  // Generate unique access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Helper function to transform database row to app format
  const transformTenant = (row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    property: row.property || '',
    rentAmount: parseFloat(row.rent_amount) || 0,
    securityDeposit: parseFloat(row.security_deposit) || 0,
    leaseStart: row.lease_start || '',
    leaseEnd: row.lease_end || '',
    status: row.status || 'prospect',
    paymentStatus: row.payment_status || 'n/a',
    paymentDate: row.payment_date || null,
    paymentLog: row.payment_log || [],
    activityLog: row.activity_log || [],
    auditLog: row.audit_log || [],
    leaseDocuments: row.lease_documents || [],
    notes: row.notes || '',
    moveInDate: row.move_in_date || '',
    moveInNotes: row.move_in_notes || '',
    moveOutDate: row.move_out_date || '',
    moveOutNotes: row.move_out_notes || '',
    depositDeductions: row.deposit_deductions || [],
    depositRefundAmount: parseFloat(row.deposit_refund_amount) || 0,
    refundStatus: row.refund_status || 'pending',
    accessCode: row.access_code || ''
  });

  // Helper function to transform app format to database format
  const transformTenantForDB = (tenant) => ({
    user_id: user?.id,
    name: tenant.name,
    phone: tenant.phone || null,
    email: tenant.email || null,
    property: tenant.property || null,
    rent_amount: tenant.rentAmount || 0,
    security_deposit: tenant.securityDeposit || 0,
    lease_start: tenant.leaseStart || null,
    lease_end: tenant.leaseEnd || null,
    status: tenant.status || 'prospect',
    payment_status: tenant.paymentStatus || 'n/a',
    payment_date: tenant.paymentDate || null,
    payment_log: tenant.paymentLog || [],
    activity_log: tenant.activityLog || [],
    audit_log: tenant.auditLog || [],
    lease_documents: tenant.leaseDocuments || [],
    notes: tenant.notes || null,
    move_in_date: tenant.moveInDate || null,
    move_in_notes: tenant.moveInNotes || null,
    move_out_date: tenant.moveOutDate || null,
    move_out_notes: tenant.moveOutNotes || null,
    deposit_deductions: tenant.depositDeductions || [],
    deposit_refund_amount: tenant.depositRefundAmount || null,
    refund_status: tenant.refundStatus || 'pending',
    access_code: tenant.accessCode || null
  });

  const transformProperty = (row) => ({
    id: row.id,
    address: row.address,
    units: row.units || 0,
    type: row.type || '',
    occupied: row.occupied || 0,
    monthlyRevenue: parseFloat(row.monthly_revenue) || 0,
    photoUrl: row.photo_url || null,
    expenses: row.expenses || [],
    ownerName: row.owner_name || '',
    ownerEmail: row.owner_email || '',
    ownerId: row.owner_id || null
  });

  const transformPropertyForDB = (property) => ({
    user_id: user?.id,
    address: property.address,
    units: property.units || 0,
    type: property.type || null,
    occupied: property.occupied || 0,
    monthly_revenue: property.monthlyRevenue || 0,
    photo_url: property.photoUrl || null,
    expenses: property.expenses || [],
    owner_name: property.ownerName || null,
    owner_email: property.ownerEmail || null,
    owner_id: property.ownerId || null
  });

  const transformMaintenanceRequest = (row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name || '',
    property: row.property || '',
    issue: row.issue,
    priority: row.priority || 'medium',
    status: row.status || 'open',
    date: row.date || new Date().toISOString().split('T')[0],
    description: row.description || ''
  });

  const transformMaintenanceRequestForDB = (request) => ({
    user_id: user?.id,
    tenant_id: request.tenantId || null,
    tenant_name: request.tenantName || null,
    property: request.property || null,
    issue: request.issue,
    priority: request.priority || 'medium',
    status: request.status || 'open',
    date: request.date || new Date().toISOString().split('T')[0],
    description: request.description || null
  });

  const transformOwner = (owner) => ({
    id: owner.id,
    name: owner.name,
    email: owner.email,
    phone: owner.phone || '',
    address: owner.address || '',
    managementFeePercent: owner.management_fee_percent || owner.managementFeePercent || 10,
    portalEnabled: owner.portal_enabled || false,
    portalToken: owner.portal_token,
    lastLogin: owner.last_login,
    createdAt: owner.created_at
  });

  // Upload utility functions
  // Upload photo to Supabase storage
  const uploadPhoto = async (file, recordType, recordId) => {
    if (!user) throw new Error('User not logged in');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordType}/${recordId}/photo_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  // Upload document
  const uploadDocument = async (file, recordType, recordId, category = 'general') => {
    if (!user) throw new Error('User not logged in');
    
    const fileName = `${recordType}/${recordId}/${Date.now()}_${file.name}`;
    
    const { error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: fileRecord } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        record_type: recordType,
        record_id: String(recordId),
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        category
      })
      .select()
      .single();
    
    return fileRecord;
  };

  // Load files for a record
  const loadFilesForRecord = async (recordType, recordId) => {
    if (!user) return [];
    
    try {
      const { data } = await supabase
        .from('files')
        .select('*')
        .eq('record_type', recordType)
        .eq('record_id', String(recordId))
        .order('uploaded_at', { ascending: false });
      return data || [];
    } catch (error) {
      console.error('Error loading files:', error);
      return [];
    }
  };

  // Get download URL
  const getDocumentUrl = async (storagePath) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600);
      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  };

  // Delete file
  const deleteFile = async (fileId, storagePath) => {
    try {
      await supabase.storage.from('documents').remove([storagePath]);
      await supabase.from('files').delete().eq('id', fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  // Load Twilio settings
  const loadTwilioSettings = async () => {
    if (!user || !user.id) {
      // User not loaded yet, don't try to load settings
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no row exists

      if (error) {
        // Only log if it's not a "no rows" error
        if (error.code !== 'PGRST116') {
          console.error('Error loading Twilio settings:', error);
        }
        return;
      }

      if (data) {
        setTwilioSettings({
          accountSid: data.twilio_account_sid || '',
          authToken: data.twilio_auth_token || '',
          phoneNumber: data.twilio_phone_number || ''
        });
      }
    } catch (error) {
      console.error('Error loading Twilio settings:', error);
      // Don't throw - just log the error, settings page should still work
      // This prevents the error from bubbling up and causing logout
    }
  };

  // Save Twilio settings
  const saveTwilioSettings = async () => {
    if (!user) return;
    
    setTwilioSettingsLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          twilio_account_sid: twilioSettings.accountSid,
          twilio_auth_token: twilioSettings.authToken,
          twilio_phone_number: twilioSettings.phoneNumber
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      alert('Twilio settings saved successfully!');
    } catch (error) {
      console.error('Error saving Twilio settings:', error);
      alert('Error saving Twilio settings. Please make sure the settings table exists.');
    } finally {
      setTwilioSettingsLoading(false);
    }
  };

  // Send test SMS
  const sendTestSMS = async () => {
    if (!testSmsPhone || !twilioSettings.accountSid || !twilioSettings.authToken || !twilioSettings.phoneNumber) {
      alert('Please fill in all Twilio settings and a test phone number');
      return;
    }

    setTestSmsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: testSmsPhone,
          message: 'This is a test message from Propli. SMS notifications are working!',
          accountSid: twilioSettings.accountSid,
          authToken: twilioSettings.authToken,
          fromNumber: twilioSettings.phoneNumber
        }
      });

      if (error) throw error;
      
      if (data.success) {
        alert('Test SMS sent successfully!');
        setTestSmsPhone('');
      } else {
        alert(`Error sending test SMS: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      alert('Error sending test SMS. Please check your Twilio credentials and try again.');
    } finally {
      setTestSmsSending(false);
    }
  };

  // Send SMS reminder to tenant
  const sendSMSReminder = async (tenant) => {
    if (!tenant.phone) {
      alert('Tenant does not have a phone number on file');
      return;
    }

    if (!twilioSettings.accountSid || !twilioSettings.authToken || !twilioSettings.phoneNumber) {
      alert('Please configure Twilio settings in Settings page first');
      return;
    }

    setSmsSending({ ...smsSending, [tenant.id]: true });
    
    try {
      const daysLate = tenant.daysLate || 0;
      const message = `Hi ${tenant.name}, this is a reminder that your rent of $${tenant.rentAmount.toLocaleString()} is past due. Please submit payment at your earliest convenience. Questions? Reply to this message. - Property Manager`;

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: tenant.phone.replace(/\D/g, ''), // Remove non-digits
          message: message,
          accountSid: twilioSettings.accountSid,
          authToken: twilioSettings.authToken,
          fromNumber: twilioSettings.phoneNumber,
          tenantId: tenant.id,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        alert('SMS reminder sent successfully!');
      } else {
        alert(`Error sending SMS: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending SMS reminder:', error);
      alert('Error sending SMS reminder. Please check your Twilio settings and try again.');
    } finally {
      setSmsSending({ ...smsSending, [tenant.id]: false });
    }
  };

  // Load data from Supabase
  const loadData = async (currentUser = null) => {
    const userToUse = currentUser || user;
    if (!userToUse) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Load tenants (RLS will automatically filter by user_id)
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;
      setTenants((tenantsData || []).map(transformTenant));

      // Load properties (RLS will automatically filter by user_id)
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties((propertiesData || []).map(transformProperty));

      // Load maintenance requests (RLS will automatically filter by user_id)
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (maintenanceError) throw maintenanceError;
      setMaintenanceRequests((maintenanceData || []).map(transformMaintenanceRequest));

      // Load tags
      await loadTags(userToUse);

      // Load owners
      try {
        const { data: ownersData, error: ownersError } = await supabase
          .from('owners')
          .select('*')
          .order('created_at', { ascending: false });

        if (ownersError) {
          // If table doesn't exist, don't error - just return empty array
          if (ownersError.code === '42P01') {
            setOwners([]);
          } else {
            throw ownersError;
          }
        } else {
          const transformedOwners = (ownersData || []).map(transformOwner);
          setOwners(transformedOwners);
          
          // Seed demo owners if none exist - COMMENTED OUT: function not implemented yet
          // if (transformedOwners.length === 0) {
          //   await seedDemoOwners(userToUse);
          //   // Reload owners after seeding
          //   const { data: reloadedOwners } = await supabase
          //     .from('owners')
          //     .select('*')
          //     .order('created_at', { ascending: false });
          //   if (reloadedOwners) {
          //     setOwners(reloadedOwners.map(transformOwner));
          //   }
          // }
        }
      } catch (error) {
        console.error('Error loading owners:', error);
        setOwners([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Please check your Supabase connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load tags from Supabase
  const loadTags = async (currentUser = null) => {
    const userToUse = currentUser || user;
    if (!userToUse) return;

    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (tagsError) {
        // If table doesn't exist or any other error, fail silently
        console.error('Error loading tags:', tagsError);
        setTags([]);
        setRecordTags([]);
        setTagHistory([]);
        return;
      }
      
      // If no tags exist, seed default tags
      if (!tagsData || tagsData.length === 0) {
        try {
          await seedDefaultTags(userToUse);
          // Reload tags after seeding
          const { data: reloadedTags, error: reloadError } = await supabase
            .from('tags')
            .select('*')
            .order('created_at', { ascending: false });
          if (!reloadError && reloadedTags) {
            setTags(reloadedTags);
          } else if (reloadError) {
            console.error('Error reloading tags after seeding:', reloadError);
            setTags([]);
          }
        } catch (seedError) {
          console.error('Error seeding default tags:', seedError);
          setTags([]);
        }
      } else {
        setTags(tagsData || []);
      }

      // Load record tags (tag assignments)
      try {
        const { data: recordTagsData, error: recordTagsError } = await supabase
          .from('record_tags')
          .select('*');

        if (recordTagsError) {
          console.error('Error loading record tags:', recordTagsError);
          setRecordTags([]);
        } else {
          setRecordTags(recordTagsData || []);
        }
      } catch (error) {
        console.error('Error loading record tags:', error);
        setRecordTags([]);
      }

      // Load tag history - COMMENTED OUT: table doesn't exist yet
      // try {
      //   const { data: tagHistoryData, error: tagHistoryError } = await supabase
      //     .from('tag_history')
      //     .select('*')
      //     .order('action_at', { ascending: false });

      //   if (tagHistoryError) {
      //     console.error('Error loading tag history:', tagHistoryError);
      //     setTagHistory([]);
      //   } else {
      //     setTagHistory(tagHistoryData || []);
      //   }
      // } catch (error) {
      //   console.error('Error loading tag history:', error);
      //   setTagHistory([]);
      // }
      setTagHistory([]); // Set empty for now
    } catch (error) {
      console.error('Error loading tags:', error);
      // Fail silently - don't block app load
      setTags([]);
      setRecordTags([]);
      setTagHistory([]);
    }
  };

  // Get tag history for a specific record - COMMENTED OUT: table doesn't exist yet
  const getTagHistoryForRecord = (recordType, recordId) => {
    // return tagHistory
    //   .filter(th => th.record_type === recordType && th.record_id === recordId)
    //   .sort((a, b) => new Date(b.action_at) - new Date(a.action_at));
    return []; // Return empty array for now
  };

  // Get tag analysis data for Reports page
  const getTagAnalysisData = (dateRange = 'all') => {
    const now = new Date();
    let startDate = null;
    
    if (dateRange === '30') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '90') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '12months') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
    
    // Filter record tags by date range if specified
    let filteredRecordTags = recordTags;
    if (startDate) {
      filteredRecordTags = recordTags.filter(rt => {
        const addedDate = new Date(rt.added_at);
        return addedDate >= startDate;
      });
    }
    
    // Group by tag
    const tagStats = {};
    
    tags.forEach(tag => {
      const tagRecords = filteredRecordTags.filter(rt => rt.tag_id === tag.id);
      const tenantCount = tagRecords.filter(rt => rt.record_type === 'tenant').length;
      const propertyCount = tagRecords.filter(rt => rt.record_type === 'property').length;
      const maintenanceCount = tagRecords.filter(rt => rt.record_type === 'maintenance').length;
      
      // Calculate total rent affected (for tenant tags)
      let totalRent = 0;
      if (tenantCount > 0) {
        tagRecords
          .filter(rt => rt.record_type === 'tenant')
          .forEach(rt => {
            const tenant = tenants.find(t => t.id === rt.record_id);
            if (tenant && tenant.rentAmount) {
              totalRent += tenant.rentAmount;
            }
          });
      }
      
      // For maintenance tags, calculate total cost
      let totalCost = 0;
      if (maintenanceCount > 0) {
        // This would require maintenance cost data - placeholder for now
        totalCost = 0;
      }
      
      if (tagRecords.length > 0) {
        tagStats[tag.id] = {
          tag,
          totalRecords: tagRecords.length,
          tenants: tenantCount,
          properties: propertyCount,
          maintenance: maintenanceCount,
          totalRent: totalRent,
          totalCost: totalCost
        };
      }
    });
    
    // Convert to array and sort by total records
    return Object.values(tagStats).sort((a, b) => b.totalRecords - a.totalRecords);
  };

  // Get tag trend data for a specific tag
  const getTagTrendData = (tagId, dateRange = '12months') => {
    const now = new Date();
    let startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    if (dateRange === '30') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '90') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    
    // Get tag history for this tag within date range
    const tagHistoryFiltered = tagHistory
      .filter(th => th.tag_id === tagId && th.action === 'added' && new Date(th.action_at) >= startDate)
      .sort((a, b) => new Date(a.action_at) - new Date(b.action_at));
    
    // Group by month
    const monthlyData = {};
    tagHistoryFiltered.forEach(th => {
      const date = new Date(th.action_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey]++;
    });
    
    // Convert to array format for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.keys(monthlyData)
      .sort()
      .map(monthKey => {
        const [year, month] = monthKey.split('-');
        return {
          month: monthNames[parseInt(month) - 1],
          count: monthlyData[monthKey]
        };
      });
  };

  // Seed default tags
  const seedDefaultTags = async (currentUser = null) => {
    const userToUse = currentUser || user;
    if (!userToUse) return;

    const defaultTags = [
      { name: 'late_payment', color: 'red' },
      { name: 'payment_plan', color: 'yellow' },
      { name: 'roof_repair', color: 'orange' },
      { name: 'hvac_issue', color: 'orange' },
      { name: 'plumbing', color: 'blue' },
      { name: 'pest_control', color: 'purple' },
      { name: 'lease_violation', color: 'red' },
      { name: 'noise_complaint', color: 'yellow' },
      { name: 'section_8', color: 'teal' },
      { name: 'month_to_month', color: 'gray' },
      { name: 'high_priority', color: 'red' },
      { name: 'resolved', color: 'green' }
    ];

    try {
      const tagsToInsert = defaultTags.map(tag => ({
        user_id: userToUse.id,
        name: tag.name,
        color: tag.color
      }));

      const { error } = await supabase
        .from('tags')
        .insert(tagsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Error seeding default tags:', error);
    }
  };

  // Create a new tag
  const createTag = async (name, color) => {
    console.log('createTag called:', { name, color, userId: user?.id });
    
    if (!user || !name || !name.trim()) {
      console.error('Cannot create tag: user not logged in or name is empty', { user: !!user, name });
      return null;
    }

    // Normalize name: lowercase, replace spaces with underscores
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '_');
    console.log('Normalized tag name:', normalizedName);

    try {
      const insertData = {
        user_id: user.id,
        name: normalizedName,
        color: color || 'blue'
      };
      console.log('Inserting tag:', insertData);
      
      const { data, error } = await supabase
        .from('tags')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        if (error.code === '23505') { // Unique constraint violation
          console.error('A tag with this name already exists');
        }
        return null;
      }
      
      console.log('Tag created successfully:', data);
      setTags([...tags, data]);
      return data;
    } catch (error) {
      console.error('Error creating tag (catch):', error);
      return null;
    }
  };

  // Delete a tag
  const deleteTag = async (tagId) => {
    if (!user || !tagId) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;
      setTags(tags.filter(t => t.id !== tagId));
      
      // Also delete all record_tags associated with this tag
      await supabase
        .from('record_tags')
        .delete()
        .eq('tag_id', tagId);
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Error deleting tag: ' + error.message);
      throw error;
    }
  };

  // Get record count for a tag
  const getTagRecordCount = (tagId) => {
    return recordTags.filter(rt => rt.tag_id === tagId).length;
  };

  // Get tags for a specific record (deduplicated by tag_id)
  const getTagsForRecord = (recordType, recordId) => {
    const tagIds = [...new Set(
      recordTags
        .filter(rt => rt.record_type === recordType && String(rt.record_id) === String(recordId))
        .map(rt => rt.tag_id)
    )];
    return tagIds.map(id => tags.find(t => t.id === id)).filter(Boolean);
  };

  // Get tag color styles
  const getTagColor = (color) => {
    const colorMap = {
      blue: { bg: '#e8f0fe', text: '#1a73e8' },
      green: { bg: '#e6f4ea', text: '#1e8e3e' },
      yellow: { bg: '#fef7e0', text: '#f9ab00' },
      orange: { bg: '#feefe3', text: '#e8710a' },
      red: { bg: '#fce8e6', text: '#d93025' },
      purple: { bg: '#f3e8fd', text: '#9334e6' },
      teal: { bg: '#e4f7fb', text: '#0891b2' },
      gray: { bg: '#f1f3f4', text: '#5f6368' }
    };
    return colorMap[color] || colorMap.blue;
  };

  // Add tag to a record
  const addTagToRecord = async (tagId, recordType, recordId) => {
    console.log('Adding tag:', { tagId, recordType, recordId, userId: user?.id });
    
    if (!user) {
      console.error('Cannot add tag: user not logged in');
      return;
    }

    // Check if tag is already applied (using String comparison for record_id)
    const existing = recordTags.find(
      rt => rt.tag_id === tagId && 
            rt.record_type === recordType && 
            String(rt.record_id) === String(recordId)
    );
    if (existing) {
      console.log('Tag already applied, skipping');
      return; // Tag already applied
    }

    try {
      const tag = tags.find(t => t.id === tagId);
      const tagName = tag ? tag.name : '';

      const insertData = {
        tag_id: tagId,
        record_type: recordType,
        record_id: recordId, // UUID type, no conversion needed
        added_by: user.id
      };
      
      console.log('Inserting record tag:', insertData);

      // Insert record tag
      const { data, error } = await supabase
        .from('record_tags')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting record tag:', error);
        throw error;
      }
      
      console.log('Record tag inserted successfully:', data);
      
      // Reload record tags from database to ensure consistency and avoid duplicates
      try {
        const { data: allRecordTags, error: reloadError } = await supabase
          .from('record_tags')
          .select('*');
        if (!reloadError && allRecordTags) {
          setRecordTags(allRecordTags);
          console.log('Record tags reloaded:', allRecordTags.length, 'total tags');
        } else if (reloadError) {
          console.error('Error reloading record tags:', reloadError);
          // Fallback: update state with new tag if reload fails
          setRecordTags([...recordTags, data]);
        }
      } catch (reloadErr) {
        console.error('Error reloading record tags:', reloadErr);
        // Fallback: update state with new tag if reload fails
        setRecordTags([...recordTags, data]);
      }

      // Log to tag history - COMMENTED OUT: table doesn't exist yet
      // try {
      //   await supabase
      //     .from('tag_history')
      //     .insert([{
      //       tag_id: tagId,
      //       tag_name: tagName,
      //       record_type: recordType,
      //       record_id: recordId,
      //       action: 'added',
      //       action_by: user.id,
      //       user_id: user.id
      //     }]);
      //   console.log('Tag history logged successfully');
      // } catch (historyError) {
      //   // Don't fail if history logging fails
      //   console.error('Error logging tag history:', historyError);
      // }
    } catch (error) {
      console.error('Error adding tag to record:', error);
      // Fail silently - don't show alert or throw
      return null;
    }
  };

  // Remove tag from a record
  const removeTagFromRecord = async (tagId, recordType, recordId) => {
    if (!user) return;

    try {
      const tag = tags.find(t => t.id === tagId);
      const tagName = tag ? tag.name : '';

      const { error } = await supabase
        .from('record_tags')
        .delete()
        .eq('tag_id', tagId)
        .eq('record_type', recordType)
        .eq('record_id', recordId);

      if (error) throw error;
      setRecordTags(recordTags.filter(
        rt => !(rt.tag_id === tagId && rt.record_type === recordType && rt.record_id === recordId)
      ));

      // Log to tag history - COMMENTED OUT: table doesn't exist yet
      // try {
      //   await supabase
      //     .from('tag_history')
      //     .insert([{
      //       tag_id: tagId,
      //       tag_name: tagName,
      //       record_type: recordType,
      //       record_id: recordId,
      //       action: 'removed',
      //       action_by: user.id,
      //       user_id: user.id
      //     }]);
      // } catch (historyError) {
      //   // Don't fail if history logging fails
      //   console.error('Error logging tag history:', historyError);
      // }
    } catch (error) {
      console.error('Error removing tag from record:', error);
      alert('Error removing tag: ' + error.message);
      throw error;
    }
  };

  // Get most recently used tags (for quick-tag)
  const getMostRecentTags = () => {
    if (recordTags.length === 0) return tags.slice(0, 5);
    
    // Get unique tag IDs from recent record_tags, ordered by most recent
    const recentTagIds = [...new Set(
      recordTags
        .sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
        .map(rt => rt.tag_id)
        .slice(0, 5)
    )];
    
    return recentTagIds.map(id => tags.find(t => t.id === id)).filter(Boolean);
  };

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (session && currentUser) {
        loadData(currentUser);
        loadTwilioSettings();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (session && currentUser) {
        loadData(currentUser);
        loadTwilioSettings();
      } else {
        setTenants([]);
        setProperties([]);
        setMaintenanceRequests([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Twilio settings when Settings tab is opened
  useEffect(() => {
    if (activeTab === 'settings' && user && user.id) {
      loadTwilioSettings();
    }
  }, [activeTab, user]);

  // Apply dark mode class to body element
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('propli_darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('propli_darkMode', 'false');
    }
  }, [darkMode]);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('propli_activeTab', activeTab);
  }, [activeTab]);

  // Load tags when tenant modal opens
  useEffect(() => {
    if (selectedTenant && selectedTenant.id) {
      // Reload record tags to ensure we have the latest tags for this tenant
      const loadTenantTags = async () => {
        try {
          const { data: allRecordTags } = await supabase
            .from('record_tags')
            .select('*');
          if (allRecordTags) {
            setRecordTags(allRecordTags);
          }
        } catch (error) {
          console.error('Error loading tenant tags:', error);
        }
      };
      loadTenantTags();
    }
  }, [selectedTenant]);

  const handleAuthSuccess = () => {
    // Auth state change will trigger loadData automatically
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

  // Refresh data function (reloads without page refresh)
  const refreshData = async () => {
    if (user) {
      await loadData(user);
    }
  };

  // Extract unit number from property address
  const extractUnitNumber = (propertyAddress) => {
    if (!propertyAddress) return 'N/A';
    // Try to extract unit number from patterns like "Unit 3B", "Unit 12", "Apt 5", etc.
    const unitMatch = propertyAddress.match(/(?:Unit|Apt|Apartment|#)\s*([A-Z0-9]+)/i);
    if (unitMatch) {
      return unitMatch[1];
    }
    // If no unit found, return the full address
    return propertyAddress;
  };

  // Extract property address without unit
  const extractPropertyAddress = (propertyAddress) => {
    if (!propertyAddress) return 'N/A';
    // Remove unit information
    return propertyAddress.replace(/\s*(?:Unit|Apt|Apartment|#)\s*[A-Z0-9]+/i, '').trim() || propertyAddress;
  };

  // Get rent roll data for current tenants
  const getRentRollData = () => {
    return tenants
      .filter(t => t.status === 'current' && t.rentAmount > 0)
      .map(tenant => {
        const propertyAddress = extractPropertyAddress(tenant.property);
        const unit = extractUnitNumber(tenant.property);
        
        // Get last payment date from payment log
        let lastPaymentDate = null;
        if (tenant.paymentLog && tenant.paymentLog.length > 0) {
          const sortedPayments = [...tenant.paymentLog].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          lastPaymentDate = sortedPayments[0].date;
        } else if (tenant.paymentDate) {
          lastPaymentDate = tenant.paymentDate;
        }

        // Determine payment status for the selected month
        let paymentStatus = tenant.paymentStatus || 'unpaid';
        if (reportMonth) {
          const [year, month] = reportMonth.split('-');
          const reportDate = new Date(year, month - 1, 1);
          const lastPayment = lastPaymentDate ? new Date(lastPaymentDate) : null;
          
          if (lastPayment) {
            const paymentMonth = lastPayment.getFullYear() + '-' + String(lastPayment.getMonth() + 1).padStart(2, '0');
            if (paymentMonth === reportMonth) {
              paymentStatus = tenant.paymentStatus || 'paid';
            } else if (paymentMonth < reportMonth) {
              paymentStatus = 'unpaid';
            }
          } else {
            paymentStatus = 'unpaid';
          }
        }

        return {
          propertyAddress,
          unit,
          tenantName: tenant.name,
          leaseStart: tenant.leaseStart,
          leaseEnd: tenant.leaseEnd,
          monthlyRent: tenant.rentAmount,
          paymentStatus,
          lastPaymentDate
        };
      })
      .sort((a, b) => {
        // Sort by property address, then by unit
        if (a.propertyAddress !== b.propertyAddress) {
          return a.propertyAddress.localeCompare(b.propertyAddress);
        }
        return a.unit.localeCompare(b.unit);
      });
  };

  // Calculate rent roll totals
  const getRentRollTotals = () => {
    const rentRollData = getRentRollData();
    const totalUnits = rentRollData.length;
    const totalRent = rentRollData.reduce((sum, row) => sum + row.monthlyRent, 0);
    const paidCount = rentRollData.filter(row => row.paymentStatus === 'paid').length;
    const collectionRate = totalUnits > 0 ? Math.round((paidCount / totalUnits) * 100) : 0;
    
    return {
      totalUnits,
      totalRent,
      collectionRate
    };
  };

  // Export rent roll to CSV
  const exportRentRollToCSV = () => {
    const rentRollData = getRentRollData();
    const totals = getRentRollTotals();
    
    const headers = ['Property Address', 'Unit', 'Tenant Name', 'Lease Start', 'Lease End', 'Monthly Rent', 'Payment Status', 'Last Payment Date'];
    const rows = rentRollData.map(row => [
      row.propertyAddress,
      row.unit,
      row.tenantName,
      row.leaseStart || '',
      row.leaseEnd || '',
      row.monthlyRent,
      row.paymentStatus === 'paid' ? 'Paid' : row.paymentStatus === 'late' ? 'Late' : 'Unpaid',
      row.lastPaymentDate || ''
    ]);

    // Add totals row
    rows.push(['', '', '', '', 'TOTALS', totals.totalRent, '', '']);
    rows.push(['Total Units', totals.totalUnits, '', '', 'Collection Rate', `${totals.collectionRate}%`, '', '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rent_roll_${reportMonth || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get late tenants with days late calculation
  // Dashboard helper functions
  const getDashboardMetrics = () => {
    const totalUnits = stats.totalUnits;
    const occupiedUnits = stats.occupiedUnits;
    const occupancyPercentage = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    // Calculate monthly revenue collected vs expected
    const expectedRevenue = tenants
      .filter(t => t.status === 'current' && t.rentAmount > 0)
      .reduce((sum, t) => sum + t.rentAmount, 0);
    
    const collectedRevenue = tenants
      .filter(t => t.status === 'current' && t.paymentStatus === 'paid')
      .reduce((sum, t) => sum + t.rentAmount, 0);
    
    // Outstanding balances (late rent)
    const outstandingBalances = tenants
      .filter(t => t.status === 'current' && t.paymentStatus === 'late')
      .reduce((sum, t) => sum + t.rentAmount, 0);
    
    // Leases expiring
    const today = new Date();
    const leasesExpiring30 = tenants.filter(t => {
      if (!t.leaseEnd || t.status !== 'current') return false;
      const endDate = new Date(t.leaseEnd);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;
    
    const leasesExpiring60 = tenants.filter(t => {
      if (!t.leaseEnd || t.status !== 'current') return false;
      const endDate = new Date(t.leaseEnd);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 60 && daysUntilExpiry > 30;
    }).length;
    
    const leasesExpiring90 = tenants.filter(t => {
      if (!t.leaseEnd || t.status !== 'current') return false;
      const endDate = new Date(t.leaseEnd);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 90 && daysUntilExpiry > 60;
    }).length;
    
    return {
      totalUnits,
      occupiedUnits,
      occupancyPercentage,
      expectedRevenue,
      collectedRevenue,
      outstandingBalances,
      leasesExpiring30,
      leasesExpiring60,
      leasesExpiring90
    };
  };

  // Get revenue data for last 6 months (Jan-Jun)
  const getRevenueData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const months = [];
    
    // Always return Jan-Jun data
    for (let i = 0; i < 6; i++) {
      const monthName = monthNames[i];
      
      // Calculate revenue for this month if we have payment data
      let revenue = 0;
      const currentYear = new Date().getFullYear();
      const monthIndex = i; // Jan=0, Feb=1, etc.
      
      tenants
        .filter(t => t.status === 'current' && t.paymentStatus === 'paid')
        .forEach(tenant => {
          if (tenant.paymentLog && tenant.paymentLog.length > 0) {
            tenant.paymentLog.forEach(payment => {
              const paymentDate = new Date(payment.date);
              if (paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === currentYear) {
                revenue += payment.amount;
              }
            });
          }
        });
      
      // If no revenue data, use sample data: 0 for first 5 months, actual or 4000 for June
      if (i < 5) {
        months.push({ month: monthName, revenue: revenue || 0 });
      } else {
        // June: use actual data if available, otherwise 4000
        months.push({ month: monthName, revenue: revenue || 4000 });
      }
    }
    
    return months;
  };

  // Get occupancy rate data over time (Jan-Jun)
  const getOccupancyData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const months = [];
    
    // Calculate current occupancy rate
    const totalUnits = stats.totalUnits;
    const occupiedUnits = stats.occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 50;
    
    // Always return Jan-Jun data with current occupancy rate (or 50% as default)
    for (let i = 0; i < 6; i++) {
      months.push({ month: monthNames[i], occupancy: occupancyRate || 50 });
    }
    
    return months;
  };

  // Currency formatter function
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // TagPicker Component (inline function component)
  const TagPicker = ({ recordType, recordId, existingTags = [], onTagsChange }) => {
    const recordTags = getTagsForRecord(recordType, recordId);
    const isOpen = tagPickerOpen.recordType === recordType && tagPickerOpen.recordId === recordId;
    const searchValue = isOpen ? tagPickerSearch : '';

    const availableTags = tags.filter(tag => {
      // Filter out already applied tags
      if (recordTags.some(rt => rt.id === tag.id)) return false;
      // Filter by search
      if (searchValue && !tag.name.toLowerCase().includes(searchValue.toLowerCase())) return false;
      return true;
    });

    const handleAddTag = async (tagId) => {
      console.log('TagPicker handleAddTag called:', { tagId, recordType, recordId });
      try {
        await addTagToRecord(tagId, recordType, recordId);
        // Close dropdown immediately
        setTagPickerOpen({ recordType: null, recordId: null });
        setTagPickerSearch('');
        // Note: addTagToRecord already reloads record tags, so we don't need to reload again
        // But we can call onTagsChange if provided for any additional side effects
        if (onTagsChange) {
          onTagsChange();
        }
      } catch (error) {
        console.error('Error in handleAddTag:', error);
        // Error already handled in addTagToRecord
      }
    };

    const handleRemoveTag = async (tagId) => {
      try {
        await removeTagFromRecord(tagId, recordType, recordId);
        // Refresh tags immediately
        if (onTagsChange) {
          onTagsChange();
        } else {
          // If no onTagsChange callback, reload record tags manually
          try {
            const { data: allRecordTags } = await supabase
              .from('record_tags')
              .select('*');
            if (allRecordTags) {
              setRecordTags(allRecordTags);
            }
          } catch (err) {
            console.error('Error reloading record tags:', err);
          }
        }
      } catch (error) {
        // Error already handled
      }
    };

    const handleCreateAndAddTag = async () => {
      if (!searchValue.trim()) return;
      console.log('handleCreateAndAddTag called:', searchValue);
      try {
        const newTagData = await createTag(searchValue, 'blue');
        console.log('New tag created:', newTagData);
        if (newTagData) {
          console.log('Adding tag to record:', newTagData.id);
          await handleAddTag(newTagData.id);
        } else {
          console.error('Failed to create tag, newTagData is null');
        }
      } catch (error) {
        console.error('Error in handleCreateAndAddTag:', error);
        // Error already handled
      }
    };

    const colorMap = {
      blue: '#1a73e8',
      green: '#10b981',
      yellow: '#fbbf24',
      orange: '#f97316',
      red: '#ef4444',
      purple: '#a855f7',
      teal: '#14b8a6',
      gray: '#6b7280'
    };

    return (
      <div style={{ position: 'relative' }}>
        {/* Existing Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {recordTags.map(tag => (
            <span
              key={tag.id}
              className={`tag-pill ${tag.color}`}
              style={{ cursor: 'default' }}
            >
              {tag.name}
              <span
                className="tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag.id);
                }}
                title="Remove tag"
              >
                ×
              </span>
            </span>
          ))}
        </div>

        {/* Add Tag Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTagPickerOpen({ recordType, recordId });
            setTagPickerSearch('');
          }}
          style={{
            background: 'none',
            border: '1px dashed #dadce0',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#5f6368',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#1a73e8';
            e.target.style.color = '#1a73e8';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#dadce0';
            e.target.style.color = '#5f6368';
          }}
        >
          + Add Tag
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
              onClick={() => {
                setTagPickerOpen({ recordType: null, recordId: null });
                setTagPickerSearch('');
              }}
            />
            <div
              className="tag-picker-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setTagPickerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchValue.trim() && availableTags.length === 0) {
                      handleCreateAndAddTag();
                    }
                  }}
                  placeholder="Search or create tag..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Tag List */}
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {availableTags.length > 0 ? (
                  availableTags.map(tag => (
                    <div
                      key={tag.id}
                      onClick={() => handleAddTag(tag.id)}
                      className="tag-picker-dropdown-item"
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: colorMap[tag.color] || colorMap.blue,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#202124' }}>{tag.name}</span>
                    </div>
                  ))
                ) : searchValue.trim() ? (
                  <div
                    onClick={handleCreateAndAddTag}
                    className="tag-picker-dropdown-item"
                    style={{ color: '#1a73e8' }}
                  >
                    <span style={{ fontSize: '14px' }}>+ Create "{searchValue}"</span>
                  </div>
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#5f6368', fontSize: '14px' }}>
                    No tags available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Get recent tenants (last 5)
  const getRecentTenants = () => {
    return tenants
      .filter(t => t.status === 'current')
      .sort((a, b) => {
        // Sort by most recent activity or creation
        const aDate = a.activityLog && a.activityLog.length > 0 
          ? new Date(a.activityLog[a.activityLog.length - 1].timestamp)
          : new Date(0);
        const bDate = b.activityLog && b.activityLog.length > 0
          ? new Date(b.activityLog[b.activityLog.length - 1].timestamp)
          : new Date(0);
        return bDate - aDate;
      })
      .slice(0, 5);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Avatar colors: blue, teal, green, slate
  const avatarColors = ['#1a73e8', '#0891b2', '#059669', '#475569'];
  const getAvatarColor = (index) => {
    return avatarColors[index % avatarColors.length];
  };
  
  // Get avatar color based on tenant name (for consistent colors)
  const getAvatarColorByName = (name) => {
    if (!name) return avatarColors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  };
  
  // Format lease end date
  const formatLeaseEndDate = (leaseEnd, status) => {
    if (!leaseEnd || status === 'prospect') return 'Pending';
    const date = new Date(leaseEnd);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  // EventCard component
  const EventCard = ({ event, type, compact }) => {
    const typeColors = {
      'move-in': { bg: '#d1fae5', text: '#065f46', icon: '📦' },
      'move-out': { bg: '#fee2e2', text: '#991b1b', icon: '🚚' },
      'maintenance': { bg: '#fef3c7', text: '#92400e', icon: '🔧' },
      'inspection': { bg: '#e0f2fe', text: '#0369a1', icon: '🔍' },
      'vendor': { bg: '#f3e8ff', text: '#6b21a8', icon: '👷' },
      'lease-expiration': { bg: '#fef3c7', text: '#92400e', icon: '📋' },
      'general': { bg: '#f3f4f6', text: '#374151', icon: '📅' }
    };
    
    const colors = typeColors[event.type || type] || typeColors.general;
    
    if (compact) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: colors.bg,
          borderRadius: 6,
          marginBottom: 6
        }}>
          <span>{colors.icon}</span>
          <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{event.title}</span>
          {event.time && <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>{event.time}</span>}
        </div>
      );
    }
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        background: colors.bg,
        borderRadius: 8,
        marginBottom: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{colors.icon}</span>
          <div>
            <p style={{ fontWeight: 500, color: colors.text, marginBottom: 2, margin: 0 }}>{event.title}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              {event.description || event.property_name || ''}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 600, color: colors.text, marginBottom: 2, margin: 0 }}>
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          {event.time && <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{event.time}</p>}
        </div>
      </div>
    );
  };

  // Schedule helper functions
  const getTodayEvents = () => {
    const today = new Date().toDateString();
    const events = [];
    
    // Get scheduled events
    scheduleEvents.forEach(e => {
      if (new Date(e.date).toDateString() === today) {
        events.push(e);
      }
    });
    
    // Get move-ins for today
    tenants.forEach(t => {
      const moveInDate = t.moveInDate || t.move_in_date;
      if (moveInDate && new Date(moveInDate).toDateString() === today) {
        const property = properties.find(p => p.id === t.property_id || p.address === t.property);
        events.push({
          title: `${t.name} - Move-In`,
          type: 'move-in',
          date: moveInDate,
          property_name: property?.name || property?.address || t.property,
          tenant_id: t.id
        });
      }
    });
    
    // Get move-outs for today
    tenants.forEach(t => {
      const moveOutDate = t.moveOutDate || t.move_out_date;
      if (moveOutDate && new Date(moveOutDate).toDateString() === today) {
        const property = properties.find(p => p.id === t.property_id || p.address === t.property);
        events.push({
          title: `${t.name} - Move-Out`,
          type: 'move-out',
          date: moveOutDate,
          property_name: property?.name || property?.address || t.property,
          tenant_id: t.id
        });
      }
    });
    
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getUpcomingMoveIns = () => {
    const events = [];
    tenants.forEach(t => {
      const moveInDate = t.moveInDate || t.move_in_date;
      if (moveInDate) {
        try {
          const date = new Date(moveInDate);
          if (date >= new Date()) {
            const property = properties.find(p => p.id === t.property_id || p.address === t.property);
            events.push({
              title: `${t.name} - Move-In`,
              type: 'move-in',
              date: moveInDate,
              property_name: property?.name || property?.address || t.property,
              tenant_id: t.id
            });
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    return events.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  };

  const getUpcomingMoveOuts = () => {
    const events = [];
    tenants.forEach(t => {
      const moveOutDate = t.moveOutDate || t.move_out_date;
      if (moveOutDate) {
        try {
          const date = new Date(moveOutDate);
          if (date >= new Date()) {
            const property = properties.find(p => p.id === t.property_id || p.address === t.property);
            events.push({
              title: `${t.name} - Move-Out`,
              type: 'move-out',
              date: moveOutDate,
              property_name: property?.name || property?.address || t.property,
              tenant_id: t.id
            });
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    return events.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  };

  const getExpiringLeases = () => {
    const today = new Date();
    const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    return tenants
      .filter(t => (t.status === 'Current' || t.status === 'current') && (t.leaseEnd || t.lease_end))
      .filter(t => {
        try {
          const leaseEnd = new Date(t.leaseEnd || t.lease_end);
          return leaseEnd >= today && leaseEnd <= in90Days;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.leaseEnd || a.lease_end || 0);
        const dateB = new Date(b.leaseEnd || b.lease_end || 0);
        return dateA - dateB;
      });
  };

  const getAllEventsForDate = (date) => {
    const dateStr = date.toDateString();
    const events = [];
    
    // Get scheduled events
    scheduleEvents.forEach(e => {
      if (new Date(e.date).toDateString() === dateStr) {
        events.push(e);
      }
    });
    
    // Get move-ins for this date
    tenants.forEach(t => {
      const moveInDate = t.moveInDate || t.move_in_date;
      if (moveInDate && new Date(moveInDate).toDateString() === dateStr) {
        const property = properties.find(p => p.id === t.property_id || p.address === t.property);
        events.push({
          title: `${t.name} - Move-In`,
          type: 'move-in',
          date: moveInDate,
          property_name: property?.name || property?.address || t.property,
          tenant_id: t.id
        });
      }
    });
    
    // Get move-outs for this date
    tenants.forEach(t => {
      const moveOutDate = t.moveOutDate || t.move_out_date;
      if (moveOutDate && new Date(moveOutDate).toDateString() === dateStr) {
        const property = properties.find(p => p.id === t.property_id || p.address === t.property);
        events.push({
          title: `${t.name} - Move-Out`,
          type: 'move-out',
          date: moveOutDate,
          property_name: property?.name || property?.address || t.property,
          tenant_id: t.id
        });
      }
    });
    
    // Add lease expirations for this date
    tenants.forEach(t => {
      const leaseEnd = t.leaseEnd || t.lease_end;
      if (leaseEnd && new Date(leaseEnd).toDateString() === dateStr) {
        const property = properties.find(p => p.id === t.property_id || p.address === t.property);
        events.push({
          title: `${t.name} - Lease Expires`,
          type: 'lease-expiration',
          date: leaseEnd,
          property_name: property?.name || property?.address || t.property,
          tenant_id: t.id
        });
      }
    });
    
    return events;
  };

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for first day (0 = Sunday, 6 = Saturday)
    const startDay = firstDay.getDay();
    
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    // Previous month's days to fill the grid
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days = [];
    
    // Add previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month's leading days to fill the grid (42 cells = 6 weeks)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get priority badge style (kept for backward compatibility, but using CSS classes now)
  const getPriorityBadgeStyle = (priority) => {
    const priorityLower = (priority || 'medium').toLowerCase();
    const styles = {
      low: { background: '#f3f4f6', color: '#6b7280' },
      medium: { background: '#dbeafe', color: '#2563eb' },
      high: { background: '#fef3c7', color: '#d97706' },
      urgent: { background: '#fee2e2', color: '#dc2626' }
    };
    return styles[priorityLower] || styles.medium;
  };

  // Get status badge style (kept for backward compatibility, but using CSS classes now)
  const getMaintenanceStatusBadgeStyle = (status) => {
    const statusLower = (status || 'open').toLowerCase();
    // Map 'open' to 'Pending', 'in_progress' to 'Active', 'closed'/'completed' to 'Completed'
    let mappedStatus = statusLower;
    if (statusLower === 'open') mappedStatus = 'pending';
    if (statusLower === 'in_progress' || statusLower === 'in progress') mappedStatus = 'active';
    if (statusLower === 'closed' || statusLower === 'completed') mappedStatus = 'completed';
    
    const styles = {
      pending: { background: 'transparent', border: '1px solid #f59e0b', color: '#d97706' },
      active: { background: 'transparent', border: '1px solid #10b981', color: '#059669' },
      completed: { background: '#dcfce7', border: '1px solid #dcfce7', color: '#166534' }
    };
    return styles[mappedStatus] || styles.pending;
  };

  // Get status display name
  const getMaintenanceStatusDisplay = (status) => {
    const statusLower = (status || 'open').toLowerCase();
    if (statusLower === 'open') return 'Pending';
    if (statusLower === 'in_progress' || statusLower === 'in progress') return 'Active';
    if (statusLower === 'closed' || statusLower === 'completed') return 'Completed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Reports helper functions
  const getReportsStats = () => {
    try {
      // Calculate total revenue (from all current tenants' rent)
      const totalRevenue = (tenants || [])
        .filter(t => t && t.status === 'current' && (t.rentAmount || 0) > 0)
        .reduce((sum, t) => sum + (t.rentAmount || 0), 0);
      
      // Calculate total expenses (from all properties)
      const totalExpenses = (properties || []).reduce((sum, p) => {
        if (!p) return sum;
        const propertyExpenses = (p.expenses || []).reduce((expSum, exp) => expSum + (exp?.amount || 0), 0);
        return sum + propertyExpenses;
      }, 0);
      
      // Calculate net profit
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
      
      // Calculate average occupancy
      const totalUnits = (properties || []).reduce((sum, p) => sum + ((p?.units) || 0), 0);
      const totalOccupied = (properties || []).reduce((sum, p) => sum + ((p?.occupied) || 0), 0);
      const avgOccupancy = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 85;
      
      // Calculate revenue change (simplified - using current vs previous period)
      const revenueChange = totalRevenue > 0 ? 5 : 0; // Placeholder - would need historical data
      
      // Calculate expenses as percentage of revenue
      const expensesPercent = totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0;
      
      return {
        totalRevenue: totalRevenue || 0,
        totalExpenses: totalExpenses || 0,
        netProfit: netProfit || 0,
        profitMargin: profitMargin || 0,
        avgOccupancy: avgOccupancy || 85,
        revenueChange: revenueChange || 0,
        expensesPercent: expensesPercent || 0
      };
    } catch (error) {
      console.error('Error calculating reports stats:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        avgOccupancy: 85,
        revenueChange: 0,
        expensesPercent: 0
      };
    }
  };

  // Get revenue vs expenses data for last 6 months
  const getRevenueVsExpensesData = () => {
    // Use demo payment history if available, otherwise return sample data
    const hasDemoData = tenants.length > 10 && properties.length > 5;
    
    if (hasDemoData) {
      // Calculate from actual tenant payment logs and property expenses
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const months = [];
      
      for (let i = 0; i < 6; i++) {
        const monthIndex = i;
        const currentYear = 2026; // Demo data year
        
        // Calculate revenue from payment logs
        let revenue = 0;
        tenants
          .filter(t => t.status === 'current')
          .forEach(tenant => {
            if (tenant.paymentLog && tenant.paymentLog.length > 0) {
              tenant.paymentLog.forEach(payment => {
                try {
                  const paymentDate = new Date(payment.date);
                  if (paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === currentYear) {
                    revenue += payment.amount || 0;
                  }
                } catch (e) {
                  // Skip invalid dates
                }
              });
            }
          });
        
        // Calculate expenses from property expenses
        let expenses = 0;
        properties.forEach(property => {
          if (property && property.expenses && property.expenses.length > 0) {
            property.expenses.forEach(expense => {
              try {
                const expenseDate = new Date(expense.date);
                if (expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === currentYear) {
                  expenses += expense.amount || 0;
                }
              } catch (e) {
                // Skip invalid dates
              }
            });
          }
        });
        
        months.push({
          month: monthNames[i],
          revenue: Math.round(revenue) || 0,
          expenses: Math.round(expenses) || 0
        });
      }
      
      return months;
    }
    
    // Return demo payment history data
    return [
      { month: 'Jan', revenue: 28400, expenses: 4200 },
      { month: 'Feb', revenue: 28400, expenses: 3100 },
      { month: 'Mar', revenue: 29250, expenses: 6800 },
      { month: 'Apr', revenue: 29250, expenses: 2900 },
      { month: 'May', revenue: 30100, expenses: 3500 },
      { month: 'Jun', revenue: 30100, expenses: 4100 }
    ];
  };

  // Get occupancy trend data for last 6 months
  const getOccupancyTrendData = () => {
    // Return sample data with variation
    return [
      { month: 'Jan', occupancy: 45 },
      { month: 'Feb', occupancy: 50 },
      { month: 'Mar', occupancy: 52 },
      { month: 'Apr', occupancy: 50 },
      { month: 'May', occupancy: 55 },
      { month: 'Jun', occupancy: 50 }
    ];
  };

  // Get revenue by property data for pie chart
  const getRevenueByPropertyData = () => {
    try {
      // Calculate revenue per property from tenants
      const revenueMap = new Map();
      
      (tenants || [])
        .filter(t => t && t.status === 'current' && (t.rentAmount || 0) > 0)
        .forEach(tenant => {
          if (tenant.property) {
            const propertyName = tenant.property.split(',')[0] || tenant.property; // Get property address
            const currentRevenue = revenueMap.get(propertyName) || 0;
            revenueMap.set(propertyName, currentRevenue + (tenant.rentAmount || 0));
          }
        });
      
      // If we have properties but no tenant revenue, use property monthlyRevenue
      if (revenueMap.size === 0 && (properties || []).length > 0) {
        (properties || []).forEach(property => {
          if (property && property.address) {
            const revenue = property.monthlyRevenue || 0;
            if (revenue > 0) {
              revenueMap.set(property.address, revenue);
            }
          }
        });
      }
      
      // Convert map to array
      const data = Array.from(revenueMap.entries()).map(([name, value]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        value: Math.round(value) || 0
      }));
      
      // If no data, return placeholder
      if (data.length === 0) {
        return [
          { name: 'Property A', value: 3000 },
          { name: 'Property B', value: 2500 },
          { name: 'Property C', value: 2000 }
        ];
      }
      
      return data;
    } catch (error) {
      console.error('Error calculating revenue by property data:', error);
      return [
        { name: 'Property A', value: 3000 },
        { name: 'Property B', value: 2500 },
        { name: 'Property C', value: 2000 }
      ];
    }
  };

  // Pie chart colors
  const pieChartColors = ['#1a73e8', '#0891b2', '#10b981', '#f59e0b', '#8b5cf6'];

  const getActionItems = () => {
    const latePayments = tenants
      .filter(t => t.status === 'current' && t.paymentStatus === 'late')
      .slice(0, 5)
      .map(t => ({ type: 'late_payment', tenant: t, id: t.id }));
    
    const openMaintenance = maintenanceRequests
      .filter(r => r.status === 'open')
      .slice(0, 5)
      .map(r => ({ type: 'maintenance', request: r, id: r.id }));
    
    const leasesExpiringSoon = expiringLeases.slice(0, 5).map(t => ({
      type: 'lease_expiring',
      tenant: t,
      id: t.id
    }));
    
    // Move-outs scheduled this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const moveOutsScheduled = tenants
      .filter(t => {
        if (!t.moveOutDate || t.status !== 'current') return false;
        const moveOutDate = new Date(t.moveOutDate);
        return moveOutDate.getMonth() === currentMonth && moveOutDate.getFullYear() === currentYear;
      })
      .slice(0, 5)
      .map(t => ({ type: 'move_out', tenant: t, id: t.id }));
    
    return [...latePayments, ...openMaintenance, ...leasesExpiringSoon, ...moveOutsScheduled];
  };

  const getRecentActivity = () => {
    const activities = [];
    
    // Get recent payments
    tenants.forEach(tenant => {
      if (tenant.paymentLog && tenant.paymentLog.length > 0) {
        tenant.paymentLog.forEach(payment => {
          activities.push({
            type: 'payment',
            description: `Payment received: $${payment.amount.toLocaleString()} from ${tenant.name}`,
            timestamp: payment.date,
            tenantId: tenant.id
          });
        });
      }
    });
    
    // Get maintenance completed
    maintenanceRequests
      .filter(r => r.status !== 'open')
      .forEach(request => {
        activities.push({
          type: 'maintenance',
          description: `Maintenance completed: ${request.issue}`,
          timestamp: request.date,
          requestId: request.id
        });
      });
    
    // Get tenants added (from activity log)
    tenants.forEach(tenant => {
      if (tenant.activityLog && tenant.activityLog.length > 0) {
        tenant.activityLog.forEach(activity => {
          if (activity.note.toLowerCase().includes('added') || activity.note.toLowerCase().includes('created')) {
            activities.push({
              type: 'tenant_added',
              description: activity.note,
              timestamp: activity.timestamp,
              tenantId: tenant.id
            });
          }
        });
      }
    });
    
    // Sort by timestamp and return last 10
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  };

  // Global search function
  const performGlobalSearch = (query) => {
    if (!query || !query.trim()) return { tenants: [], properties: [] };
    
    const lowerQuery = query.toLowerCase().trim();
    const matchingTenants = tenants.filter(t => {
      if (!t) return false;
      const nameMatch = t.name && t.name.toLowerCase().includes(lowerQuery);
      const propertyMatch = t.property && t.property.toLowerCase().includes(lowerQuery);
      const emailMatch = t.email && t.email.toLowerCase().includes(lowerQuery);
      return nameMatch || propertyMatch || emailMatch;
    });
    
    const matchingProperties = properties.filter(p => {
      if (!p) return false;
      const addressMatch = p.address && p.address.toLowerCase().includes(lowerQuery);
      const typeMatch = p.type && p.type.toLowerCase().includes(lowerQuery);
      return addressMatch || typeMatch;
    });
    
    return { tenants: matchingTenants, properties: matchingProperties };
  };

  const getLateTenants = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return tenants
      .filter(t => t.status === 'current' && t.paymentStatus === 'late')
      .map(tenant => {
        // Calculate days late from the 1st of current month
        const daysLate = Math.floor((today - firstOfMonth) / (1000 * 60 * 60 * 24));
        
        return {
          ...tenant,
          daysLate
        };
      })
      .sort((a, b) => b.daysLate - a.daysLate);
  };

  // Generate email reminder for a tenant
  const generateReminderEmail = (tenant) => {
    const subject = encodeURIComponent(`Rent Payment Reminder - ${tenant.property}`);
    const body = encodeURIComponent(
      `Dear ${tenant.name},\n\n` +
      `This is a reminder that your rent payment for ${tenant.property} is currently overdue.\n\n` +
      `Amount Due: $${tenant.rentAmount.toLocaleString()}\n` +
      `Property: ${tenant.property}\n\n` +
      `Please remit payment as soon as possible to avoid any additional fees.\n\n` +
      `Thank you,\nProperty Management`
    );
    return `mailto:${tenant.email}?subject=${subject}&body=${body}`;
  };

  // Send reminder email for a single tenant
  const handleSendReminder = (tenant) => {
    const mailtoLink = generateReminderEmail(tenant);
    window.location.href = mailtoLink;
  };

  // Send reminders to all late tenants
  const handleSendAllReminders = () => {
    const lateTenants = getLateTenants();
    if (lateTenants.length === 0) {
      alert('No late tenants to send reminders to');
      return;
    }

    // Get all email addresses for BCC
    const bccEmails = lateTenants
      .filter(t => t.email)
      .map(t => t.email)
      .join(',');

    if (!bccEmails) {
      alert('No email addresses found for late tenants');
      return;
    }

    // Create a summary email
    const subject = encodeURIComponent('Rent Payment Reminders - Multiple Properties');
    const body = encodeURIComponent(
      `Dear Tenants,\n\n` +
      `This is a reminder that your rent payments are currently overdue.\n\n` +
      `Please remit payment as soon as possible to avoid any additional fees.\n\n` +
      `Thank you,\nProperty Management`
    );

    // Use mailto with BCC (note: BCC support varies by email client)
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(bccEmails)}&subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  // Get all audit logs from all tenants
  const getAllAuditLogs = () => {
    const allAuditLogs = [];
    tenants.forEach(tenant => {
      if (tenant.auditLog && tenant.auditLog.length > 0) {
        tenant.auditLog.forEach(audit => {
          allAuditLogs.push({
            ...audit,
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantProperty: tenant.property
          });
        });
      }
    });
    // Sort by timestamp, most recent first
    return allAuditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Get owner statement data for a property and month
  const getOwnerStatementData = () => {
    if (!ownerStatementProperty || !ownerStatementMonth) return null;

    const property = properties.find(p => p.id === parseInt(ownerStatementProperty));
    if (!property) return null;

    const [year, month] = ownerStatementMonth.split('-');
    const statementDate = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);

    // Get income: rent payments from tenants at this property
    const propertyAddress = property.address.toLowerCase();
    const incomeItems = [];
    let totalIncome = 0;

    tenants
      .filter(t => t.status === 'current' && t.property && t.property.toLowerCase().includes(propertyAddress))
      .forEach(tenant => {
        // Check payment log for payments in the selected month
        if (tenant.paymentLog && tenant.paymentLog.length > 0) {
          tenant.paymentLog.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate >= statementDate && paymentDate < nextMonth) {
              incomeItems.push({
                tenantName: tenant.name,
                unit: extractUnitNumber(tenant.property),
                amount: payment.amount,
                date: payment.date,
                method: payment.method
              });
              totalIncome += payment.amount;
            }
          });
        }
        // Also check paymentDate if it's in the selected month
        if (tenant.paymentDate) {
          const paymentDate = new Date(tenant.paymentDate);
          if (paymentDate >= statementDate && paymentDate < nextMonth) {
            // Check if not already in incomeItems
            const exists = incomeItems.some(item => 
              item.tenantName === tenant.name && 
              item.date === tenant.paymentDate
            );
            if (!exists && tenant.paymentStatus === 'paid') {
              incomeItems.push({
                tenantName: tenant.name,
                unit: extractUnitNumber(tenant.property),
                amount: tenant.rentAmount,
                date: tenant.paymentDate,
                method: 'Recorded'
              });
              totalIncome += tenant.rentAmount;
            }
          }
        }
      });

    // Get expenses for the selected month
    const expenseItems = [];
    let totalExpenses = 0;

    if (property.expenses && property.expenses.length > 0) {
      property.expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= statementDate && expenseDate < nextMonth) {
          expenseItems.push({
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            category: expense.category || 'Other'
          });
          totalExpenses += expense.amount;
        }
      });
    }

    // Calculate management fee (10% of collected rent)
    const managementFee = totalIncome * 0.1;
    const netProfit = totalIncome - totalExpenses - managementFee;

    return {
      property,
      month: ownerStatementMonth,
      monthName: statementDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      incomeItems: incomeItems.sort((a, b) => new Date(a.date) - new Date(b.date)),
      expenseItems: expenseItems.sort((a, b) => new Date(a.date) - new Date(b.date)),
      totalIncome,
      totalExpenses,
      managementFee,
      netProfit
    };
  };

  // Export owner statement to PDF
  const exportOwnerStatementToPDF = () => {
    const statementData = getOwnerStatementData();
    if (!statementData) {
      alert('Please select a property and month');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('OWNER STATEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Property and Owner Info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    doc.text(`Property: ${statementData.property.address}`, margin, yPos);
    yPos += 7;
    if (statementData.property.ownerName) {
      doc.text(`Owner: ${statementData.property.ownerName}`, margin, yPos);
      yPos += 7;
    }
    if (statementData.property.ownerEmail) {
      doc.text(`Email: ${statementData.property.ownerEmail}`, margin, yPos);
      yPos += 7;
    }
    doc.text(`Statement Period: ${statementData.monthName}`, margin, yPos);
    yPos += 10;

    // Income Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INCOME', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    if (statementData.incomeItems.length > 0) {
      const incomeTableData = statementData.incomeItems.map(item => [
        item.tenantName,
        item.unit || 'N/A',
        `$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        new Date(item.date).toLocaleDateString()
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Tenant', 'Unit', 'Amount', 'Date']],
        body: incomeTableData,
        theme: 'striped',
        headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });

      yPos = doc.lastAutoTable.finalY + 5;
    } else {
      doc.text('No income recorded for this period', margin, yPos);
      yPos += 7;
    }

    doc.setFont(undefined, 'bold');
    doc.text(`Total Income: $${statementData.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
    yPos += 10;

    // Expenses Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('EXPENSES', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    if (statementData.expenseItems.length > 0) {
      const expenseTableData = statementData.expenseItems.map(item => [
        item.description,
        item.category || 'Other',
        `$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        new Date(item.date).toLocaleDateString()
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Description', 'Category', 'Amount', 'Date']],
        body: expenseTableData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });

      yPos = doc.lastAutoTable.finalY + 5;
    } else {
      doc.text('No expenses recorded for this period', margin, yPos);
      yPos += 7;
    }

    doc.setFont(undefined, 'bold');
    doc.text(`Total Expenses: $${statementData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
    yPos += 10;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Income: $${statementData.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
    yPos += 7;
    doc.text(`Total Expenses: $${statementData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
    yPos += 7;
    doc.text(`Management Fee (10%): $${statementData.managementFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
    yPos += 7;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`Net Profit: $${statementData.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });

    doc.save(`owner_statement_${statementData.property.address.replace(/\s+/g, '_')}_${statementData.month.replace('-', '_')}.pdf`);
  };

  // Export rent roll to PDF
  const exportRentRollToPDF = () => {
    const rentRollData = getRentRollData();
    const totals = getRentRollTotals();
    const monthName = reportMonth ? new Date(reportMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All Time';
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Rent Roll Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Report Period: ${monthName}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Table data
    const tableData = rentRollData.map(row => [
      row.propertyAddress,
      row.unit,
      row.tenantName,
      row.leaseStart ? new Date(row.leaseStart).toLocaleDateString() : 'N/A',
      row.leaseEnd ? new Date(row.leaseEnd).toLocaleDateString() : 'N/A',
      `$${row.monthlyRent.toLocaleString()}`,
      row.paymentStatus === 'paid' ? 'Paid' : row.paymentStatus === 'late' ? 'Late' : 'Unpaid',
      row.lastPaymentDate ? new Date(row.lastPaymentDate).toLocaleDateString() : 'N/A'
    ]);

    // Add totals row
    tableData.push([
      '',
      '',
      '',
      '',
      'TOTALS',
      `$${totals.totalRent.toLocaleString()}`,
      '',
      ''
    ]);

    doc.autoTable({
      head: [['Property Address', 'Unit', 'Tenant Name', 'Lease Start', 'Lease End', 'Monthly Rent', 'Payment Status', 'Last Payment']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // Add summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Units: ${totals.totalUnits}`, 14, finalY);
    doc.text(`Total Monthly Rent: $${totals.totalRent.toLocaleString()}`, 14, finalY + 6);
    doc.text(`Collection Rate: ${totals.collectionRate}%`, 14, finalY + 12);

    doc.save(`rent_roll_${reportMonth || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const [newTenant, setNewTenant] = useState({
    name: '',
    phone: '',
    email: '',
    property: '',
    rentAmount: '',
    securityDeposit: '',
    leaseStart: '',
    leaseEnd: '',
    status: 'prospect',
    paymentStatus: 'n/a',
    notes: '',
    moveInDate: '',
    moveInNotes: ''
  });

  const filteredTenants = tenants.filter(t => {
    // Status filter
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      if (filterStatus === 'late') {
        matchesStatus = t.paymentStatus === 'late';
      } else if (filterStatus === 'expiring') {
        // Filter to show only expiring leases
        matchesStatus = expiringLeaseIds.includes(t.id);
      } else {
        matchesStatus = t.status === filterStatus;
      }
    }
    
    // Search filter
    const matchesSearch = !tenantSearchQuery || tenantSearchQuery.trim() === '' || 
      (t.name && t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())) ||
      (t.property && t.property.toLowerCase().includes(tenantSearchQuery.toLowerCase()));
    
    // Tag filter
    let matchesTags = true;
    if (selectedTagFilters.length > 0) {
      const tenantTagIds = getTagsForRecord('tenant', t.id).map(tag => tag.id);
      matchesTags = selectedTagFilters.every(filterTagId => tenantTagIds.includes(filterTagId));
    }
    
    return matchesStatus && matchesSearch && matchesTags;
  });

  const handleTogglePaymentStatus = async (tenantId, e) => {
    e.stopPropagation();
    const tenant = tenants.find(t => t.id === tenantId);
    const newStatus = tenant.paymentStatus === 'paid' ? 'late' : 'paid';
    
    // Show confirmation only when marking as late
    if (newStatus === 'late') {
      setConfirmPaymentChange({ tenantId, tenantName: tenant.name, newStatus });
    } else {
      // Mark as paid immediately without confirmation
      const updatedTenant = { ...tenant, paymentStatus: 'paid', paymentDate: new Date().toISOString().split('T')[0] };
      const { error } = await supabase
        .from('tenants')
        .update({ 
          payment_status: 'paid', 
          payment_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', tenantId);
      
      if (!error) {
        setTenants(tenants.map(t => t.id === tenantId ? updatedTenant : t));
      } else {
        console.error('Error updating payment status:', error);
        alert('Error updating payment status');
      }
    }
  };

  const confirmPaymentChangeAction = async () => {
    if (confirmPaymentChange) {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          payment_status: confirmPaymentChange.newStatus, 
          payment_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', confirmPaymentChange.tenantId);
      
      if (!error) {
        setTenants(tenants.map(t => 
          t.id === confirmPaymentChange.tenantId 
            ? { ...t, paymentStatus: confirmPaymentChange.newStatus, paymentDate: new Date().toISOString().split('T')[0] }
            : t
        ));
        setConfirmPaymentChange(null);
      } else {
        console.error('Error updating payment status:', error);
        alert('Error updating payment status');
      }
    }
  };

  const handleDeleteTenant = (tenantId, e) => {
    e.stopPropagation();
    const tenant = tenants.find(t => t.id === tenantId);
    setConfirmDelete({ tenantId, tenantName: tenant.name });
  };

  const confirmDeleteAction = async () => {
    if (confirmDelete) {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', confirmDelete.tenantId);
      
      if (!error) {
        setTenants(tenants.filter(t => t.id !== confirmDelete.tenantId));
        setConfirmDelete(null);
        if (selectedTenant && selectedTenant.id === confirmDelete.tenantId) {
          setSelectedTenant(null);
        }
      } else {
        console.error('Error deleting tenant:', error);
        alert('Error deleting tenant');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Property', 'Rent Amount', 'Security Deposit', 'Status', 'Payment Status', 'Payment Date', 'Lease Start', 'Lease End', 'Notes'];
    const rows = tenants.map(tenant => [
      tenant.name,
      tenant.phone,
      tenant.email,
      tenant.property,
      tenant.rentAmount || '',
      tenant.securityDeposit || '',
      tenant.status,
      tenant.paymentStatus,
      tenant.paymentDate || '',
      tenant.leaseStart || '',
      tenant.leaseEnd || '',
      tenant.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tenants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get leases expiring within 90 days
  const expiringLeases = tenants.filter(t => {
    if (!t.leaseEnd || t.status !== 'current') return false;
    const endDate = new Date(t.leaseEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  });

  // Update expiring lease IDs when expiringLeases changes
  useEffect(() => {
    const ids = expiringLeases.map(t => t.id);
    const idsString = ids.sort().join(',');
    const currentIdsString = expiringLeaseIds.sort().join(',');
    if (idsString !== currentIdsString) {
      setExpiringLeaseIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiringLeases.length, expiringLeases.map(t => `${t.id}-${t.leaseEnd}`).join(',')]);

  // Save dismissed banners to localStorage
  useEffect(() => {
    localStorage.setItem('propli_dismissedBanners', JSON.stringify(dismissedBanners));
  }, [dismissedBanners]);

  const stats = {
    totalTenants: tenants.filter(t => t.status === 'current').length,
    prospects: tenants.filter(t => t.status === 'prospect').length,
    latePayments: tenants.filter(t => t.paymentStatus === 'late').length,
    totalUnits: properties.reduce((acc, p) => acc + p.units, 0),
    occupiedUnits: properties.reduce((acc, p) => acc + p.occupied, 0),
    monthlyRevenue: properties.reduce((acc, p) => acc + p.monthlyRevenue, 0),
    expiringLeases: expiringLeases.length
  };

  const handleAddPayment = async (tenantId, e) => {
    e?.stopPropagation();
    if (!newPayment.amount) return;
    const tenant = tenants.find(t => t.id === tenantId);
    const payment = {
      id: Date.now(),
      amount: Number(newPayment.amount),
      method: newPayment.method,
      date: newPayment.date,
      timestamp: new Date().toISOString()
    };
    const updatedPaymentLog = [...(tenant.paymentLog || []), payment];
    
    const { error } = await supabase
      .from('tenants')
      .update({ 
        payment_log: updatedPaymentLog,
        payment_status: 'paid',
        payment_date: newPayment.date
      })
      .eq('id', tenantId);
    
    if (!error) {
      setTenants(tenants.map(t => 
        t.id === tenantId 
          ? { 
              ...t, 
              paymentLog: updatedPaymentLog,
              paymentStatus: 'paid',
              paymentDate: newPayment.date
            }
          : t
      ));
      setNewPayment({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0] });
      setShowPaymentLog(null);
    } else {
      console.error('Error adding payment:', error);
      alert('Error adding payment');
    }
  };

  const handleAddActivity = async (tenantId, e) => {
    e?.stopPropagation();
    if (!newActivityNote.trim()) return;
    const tenant = tenants.find(t => t.id === tenantId);
    const activity = {
      id: Date.now(),
      note: newActivityNote,
      timestamp: new Date().toISOString()
    };
    const updatedActivityLog = [...(tenant.activityLog || []), activity];
    
    const { error } = await supabase
      .from('tenants')
      .update({ activity_log: updatedActivityLog })
      .eq('id', tenantId);
    
    if (!error) {
      setTenants(tenants.map(t => 
        t.id === tenantId 
          ? { ...t, activityLog: updatedActivityLog }
          : t
      ));
      setNewActivityNote('');
      setShowActivityLog(null);
    } else {
      console.error('Error adding activity:', error);
      alert('Error adding activity');
    }
  };

  const handleLeaseDocumentUpload = async (tenantId, e) => {
    e?.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant || !user) return;

    try {
      // Create file path: user_id/tenant_id/filename
      const filePath = `${user.id}/${tenantId}/${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lease-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading lease document:', uploadError);
        alert(`Error uploading lease document: ${uploadError.message}`);
        return;
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('lease-documents')
        .getPublicUrl(filePath);

      // Create document record
      const document = {
        id: Date.now() + Math.random(),
        name: file.name,
        path: filePath,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
        size: file.size
      };

      // Update tenant's lease_documents array
      const updatedDocuments = [...(tenant.leaseDocuments || []), document];
      
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ lease_documents: updatedDocuments })
        .eq('id', tenantId);

      if (updateError) {
        console.error('Error updating tenant documents:', updateError);
        alert('Error saving document record');
        // Try to delete the uploaded file
        await supabase.storage.from('lease-documents').remove([filePath]);
        return;
      }

      // Add activity log entry
      const activity = {
        id: Date.now(),
        note: `Lease document "${file.name}" uploaded`,
        timestamp: new Date().toISOString()
      };
      const updatedActivityLog = [...(tenant.activityLog || []), activity];
      
      await supabase
        .from('tenants')
        .update({ activity_log: updatedActivityLog })
        .eq('id', tenantId);

      // Update local state
      setTenants(tenants.map(t => 
        t.id === tenantId 
          ? { ...t, leaseDocuments: updatedDocuments, activityLog: updatedActivityLog }
          : t
      ));

      // Update selectedTenant if it's the same tenant
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant({ ...selectedTenant, leaseDocuments: updatedDocuments, activityLog: updatedActivityLog });
      }

      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading lease document:', error);
      alert('Error uploading lease document');
    }
  };

  const handleDeleteLeaseDocument = async (tenantId, documentId, documentPath) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    try {
      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('lease-documents')
        .remove([documentPath]);

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        alert('Error deleting file from storage');
        return;
      }

      // Remove document from tenant's lease_documents array
      const updatedDocuments = (tenant.leaseDocuments || []).filter(doc => doc.id !== documentId);
      
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ lease_documents: updatedDocuments })
        .eq('id', tenantId);

      if (updateError) {
        console.error('Error updating tenant documents:', updateError);
        alert('Error updating document list');
        return;
      }

      // Add activity log entry
      const deletedDoc = tenant.leaseDocuments.find(doc => doc.id === documentId);
      const activity = {
        id: Date.now(),
        note: `Lease document "${deletedDoc?.name || 'document'}" deleted`,
        timestamp: new Date().toISOString()
      };
      const updatedActivityLog = [...(tenant.activityLog || []), activity];
      
      await supabase
        .from('tenants')
        .update({ activity_log: updatedActivityLog })
        .eq('id', tenantId);

      // Update local state
      setTenants(tenants.map(t => 
        t.id === tenantId 
          ? { ...t, leaseDocuments: updatedDocuments, activityLog: updatedActivityLog }
          : t
      ));

      // Update selectedTenant if it's the same tenant
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant({ ...selectedTenant, leaseDocuments: updatedDocuments, activityLog: updatedActivityLog });
      }
    } catch (error) {
      console.error('Error deleting lease document:', error);
      alert('Error deleting lease document');
    }
  };

  const handleMoveOut = async (tenantId, e) => {
    e?.preventDefault();
    if (!moveOutData.date) {
      alert('Please enter a move-out date');
      return;
    }

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    try {
      // Calculate total deductions
      const totalDeductions = moveOutData.deductions
        .filter(d => d.description && d.amount)
        .reduce((sum, d) => sum + Number(d.amount) || 0, 0);

      // Calculate refund amount
      const refundAmount = Math.max(0, tenant.securityDeposit - totalDeductions);

      // Prepare deductions array (only include valid entries)
      const validDeductions = moveOutData.deductions
        .filter(d => d.description && d.amount)
        .map(d => ({
          id: Date.now() + Math.random(),
          description: d.description,
          amount: Number(d.amount) || 0,
          date: new Date().toISOString()
        }));

      // Update tenant with move-out information
      const updatedTenant = {
        ...tenant,
        status: 'past',
        moveOutDate: moveOutData.date,
        moveOutNotes: moveOutData.notes || '',
        depositDeductions: validDeductions,
        depositRefundAmount: refundAmount,
        refundStatus: 'pending'
      };

      const { data, error } = await supabase
        .from('tenants')
        .update(transformTenantForDB(updatedTenant))
        .eq('id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('Error recording move-out:', error);
        alert('Error recording move-out');
        return;
      }

      // Add activity log entry
      const activity = {
        id: Date.now(),
        note: `Move-out recorded on ${new Date(moveOutData.date).toLocaleDateString()}. Refund: $${refundAmount.toLocaleString()}`,
        timestamp: new Date().toISOString()
      };
      const updatedActivityLog = [...(tenant.activityLog || []), activity];
      
      await supabase
        .from('tenants')
        .update({ activity_log: updatedActivityLog })
        .eq('id', tenantId);

      // Update local state
      const transformedTenant = transformTenant({ ...data, activity_log: updatedActivityLog });
      setTenants(tenants.map(t => t.id === tenantId ? transformedTenant : t));

      // Update selectedTenant if it's the same tenant
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(transformedTenant);
      }

      // Reset form and close modal
      setMoveOutData({ date: new Date().toISOString().split('T')[0], notes: '', deductions: [{ description: '', amount: '' }] });
      setShowMoveOutModal(null);
    } catch (error) {
      console.error('Error recording move-out:', error);
      alert('Error recording move-out');
    }
  };

  // Owner management functions
  const handleAddOwner = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (!newOwner.name || !newOwner.email) {
      alert('Name and Email are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('owners')
        .insert([{
          user_id: user.id,
          name: newOwner.name,
          email: newOwner.email,
          phone: newOwner.phone || null,
          address: newOwner.address || null,
          management_fee_percent: newOwner.managementFeePercent || 10,
          portal_enabled: newOwner.portalEnabled || false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding owner:', error);
        alert('Error adding owner: ' + error.message);
        return;
      }

      setOwners([transformOwner(data), ...owners]);
      setNewOwner({ name: '', email: '', phone: '', address: '', managementFeePercent: 10, portalEnabled: false });
      setShowAddOwnerModal(false);
    } catch (error) {
      console.error('Error adding owner:', error);
      alert('Error adding owner');
    }
  };

  const handleUpdateOwner = async (e) => {
    e.preventDefault();
    if (!user || !selectedOwner) return;

    try {
      const { data, error } = await supabase
        .from('owners')
        .update({
          name: selectedOwner.name,
          email: selectedOwner.email,
          phone: selectedOwner.phone || null,
          address: selectedOwner.address || null,
          management_fee_percent: selectedOwner.managementFeePercent || 10,
          portal_enabled: selectedOwner.portalEnabled || false
        })
        .eq('id', selectedOwner.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating owner:', error);
        alert('Error updating owner: ' + error.message);
        return;
      }

      setOwners(owners.map(o => o.id === selectedOwner.id ? transformOwner(data) : o));
      setShowEditOwnerModal(false);
      setSelectedOwner(transformOwner(data));
    } catch (error) {
      console.error('Error updating owner:', error);
      alert('Error updating owner');
    }
  };

  const handleDeleteOwner = async (ownerId) => {
    if (!confirm('Are you sure you want to delete this owner? This will unassign all their properties.')) return;

    try {
      // Unassign properties from this owner
      await supabase
        .from('properties')
        .update({ owner_id: null })
        .eq('owner_id', ownerId);

      // Delete owner
      const { error } = await supabase
        .from('owners')
        .delete()
        .eq('id', ownerId);

      if (error) throw error;

      setOwners(owners.filter(o => o.id !== ownerId));
      setSelectedOwner(null);
      // Update properties to remove owner reference
      setProperties(properties.map(p => p.ownerId === ownerId ? { ...p, ownerId: null } : p));
    } catch (error) {
      console.error('Error deleting owner:', error);
      alert('Error deleting owner: ' + error.message);
    }
  };

  const handleToggleOwnerPortal = async (ownerId, enabled) => {
    try {
      const { data, error } = await supabase
        .from('owners')
        .update({ portal_enabled: enabled })
        .eq('id', ownerId)
        .select()
        .single();

      if (error) throw error;

      setOwners(owners.map(o => o.id === ownerId ? transformOwner(data) : o));
      if (selectedOwner && selectedOwner.id === ownerId) {
        setSelectedOwner(transformOwner(data));
      }
    } catch (error) {
      console.error('Error toggling owner portal:', error);
      alert('Error updating portal access');
    }
  };

  const getOwnerPortalLink = (owner) => {
    if (!owner || !owner.portalToken) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/tenant-portal?owner=${owner.portalToken}`;
  };

  const sendOwnerPortalInvite = (owner) => {
    const link = getOwnerPortalLink(owner);
    const subject = encodeURIComponent('Owner Portal Access - Propli');
    const body = encodeURIComponent(`Hello ${owner.name},\n\nYou now have access to the Propli Owner Portal. Click the link below to access your account:\n\n${link}\n\nBest regards,\nPropli Team`);
    window.location.href = `mailto:${owner.email}?subject=${subject}&body=${body}`;
  };

  const handleAddExpense = async (propertyId, e) => {
    e?.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    const property = properties.find(p => p.id === propertyId);
    const expense = {
      id: Date.now(),
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: newExpense.date,
      category: newExpense.category,
      timestamp: new Date().toISOString()
    };
    const updatedExpenses = [...(property.expenses || []), expense];
    
    const { error } = await supabase
      .from('properties')
      .update({ expenses: updatedExpenses })
      .eq('id', propertyId);
    
    if (!error) {
      setProperties(properties.map(p => 
        p.id === propertyId 
          ? { ...p, expenses: updatedExpenses }
          : p
      ));
      setNewExpense({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'repair' });
      setShowExpenseModal(null);
    } else {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    }
  };

  const uploadPropertyPhoto = async (file, propertyId = null) => {
    if (!file || !user) return null;
    
    setPropertyPhotoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = propertyId 
        ? `${user.id}/${propertyId}.${fileExt}`
        : `${user.id}/temp_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
      return null;
    } finally {
      setPropertyPhotoUploading(false);
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    
    let photoUrl = null;
    if (newProperty.photo) {
      photoUrl = await uploadPropertyPhoto(newProperty.photo);
      if (!photoUrl) return; // Stop if photo upload failed
    }
    
    const propertyData = {
      address: newProperty.address,
      units: Number(newProperty.units) || 0,
      type: newProperty.type || null,
      occupied: Number(newProperty.occupied) || 0,
      monthlyRevenue: Number(newProperty.monthlyRevenue) || 0,
      photoUrl: photoUrl,
      expenses: [],
      ownerName: newProperty.ownerName || '',
      ownerEmail: newProperty.ownerEmail || '',
      ownerId: newProperty.ownerId || null
    };
    
    const { data, error } = await supabase
      .from('properties')
      .insert([transformPropertyForDB(propertyData)])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding property:', error);
      alert('Error adding property');
      return;
    }
    
    // Rename temp photo file to use property ID
    if (photoUrl && data.id) {
      const tempFileName = photoUrl.split('/').pop();
      const fileExt = tempFileName.split('.').pop();
      const newFileName = `${user.id}/${data.id}.${fileExt}`;
      const oldFileName = `${user.id}/${tempFileName}`;
      
      // Copy to new name and delete old
      const { data: copyData } = await supabase.storage
        .from('property-photos')
        .copy(oldFileName, newFileName);
      
      if (copyData) {
        await supabase.storage
          .from('property-photos')
          .remove([oldFileName]);
        
        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(newFileName);
        
        // Update property with correct URL
        await supabase
          .from('properties')
          .update({ photo_url: publicUrl })
          .eq('id', data.id);
        
        propertyData.photoUrl = publicUrl;
      }
    }
    
    setProperties([transformProperty({ ...data, photo_url: propertyData.photoUrl }), ...properties]);
    setNewProperty({ address: '', units: '', type: '', occupied: '', monthlyRevenue: '', photo: null, ownerName: '', ownerEmail: '', ownerId: null });
    setShowAddPropertyModal(false);
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    
    if (!editingProperty) return;
    
    let photoUrl = editingProperty.photoUrl;
    if (editingProperty.photo && editingProperty.photo instanceof File) {
      photoUrl = await uploadPropertyPhoto(editingProperty.photo);
      if (!photoUrl) return; // Stop if photo upload failed
      
      // Rename temp photo file to use property ID
      if (photoUrl && editingProperty.id) {
        const tempFileName = photoUrl.split('/').pop();
        const fileExt = tempFileName.split('.').pop();
        const newFileName = `${user.id}/${editingProperty.id}.${fileExt}`;
        const oldFileName = `${user.id}/${tempFileName}`;
        
        // Copy to new name and delete old
        const { data: copyData } = await supabase.storage
          .from('property-photos')
          .copy(oldFileName, newFileName);
        
        if (copyData) {
          await supabase.storage
            .from('property-photos')
            .remove([oldFileName]);
          
          const { data: { publicUrl } } = supabase.storage
            .from('property-photos')
            .getPublicUrl(newFileName);
          
          photoUrl = publicUrl;
        }
      }
    }
    
    const propertyData = {
      address: editingProperty.address,
      units: Number(editingProperty.units) || 0,
      type: editingProperty.type || null,
      occupied: Number(editingProperty.occupied) || 0,
      monthlyRevenue: Number(editingProperty.monthlyRevenue) || 0,
      photoUrl: photoUrl,
      ownerName: editingProperty.ownerName || '',
      ownerEmail: editingProperty.ownerEmail || '',
      ownerId: editingProperty.ownerId || null
    };
    
    const { data, error } = await supabase
      .from('properties')
      .update(transformPropertyForDB(propertyData))
      .eq('id', editingProperty.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating property:', error);
      alert('Error updating property');
      return;
    }
    
    setProperties(properties.map(p => p.id === editingProperty.id ? transformProperty({ ...data, photo_url: photoUrl }) : p));
    setEditingProperty(null);
    setSelectedProperty(null);
  };

  const handleDeleteProperty = async (propertyId) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    
    if (error) {
      console.error('Error deleting property:', error);
      alert('Error deleting property');
    } else {
      setProperties(properties.filter(p => p.id !== propertyId));
      setSelectedProperty(null);
      setShowDeletePropertyConfirm(null);
    }
  };

  const handleRemovePropertyPhoto = async (propertyId) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    
    const property = properties.find(p => p.id === propertyId);
    if (property && property.photoUrl) {
      // Extract filename from URL
      const urlParts = property.photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const fullPath = `${user.id}/${fileName}`;
      
      // Delete from storage
      await supabase.storage
        .from('property-photos')
        .remove([fullPath]);
      
      // Update property
      const { data, error } = await supabase
        .from('properties')
        .update({ photo_url: null })
        .eq('id', propertyId)
        .select()
        .single();
      
      if (!error) {
        setProperties(properties.map(p => p.id === propertyId ? transformProperty({ ...data, photo_url: null }) : p));
        if (selectedProperty && selectedProperty.id === propertyId) {
          setSelectedProperty({ ...selectedProperty, photoUrl: null });
        }
      }
    }
  };

  const handlePropertyPhotoUpdate = async (propertyId, file) => {
    if (!file || !user) return;
    
    setPropertyPhotoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${propertyId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        alert('Error uploading photo');
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('properties')
        .update({ photo_url: publicUrl })
        .eq('id', propertyId);
      
      if (updateError) {
        console.error('Error updating property:', updateError);
        alert('Error updating property');
        return;
      }
      
      setProperties(properties.map(p => 
        p.id === propertyId 
          ? { ...p, photoUrl: publicUrl }
          : p
      ));
      
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty({ ...selectedProperty, photoUrl: publicUrl });
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Error updating photo');
    } finally {
      setPropertyPhotoUploading(false);
    }
  };

  // Load demo data function
  const loadDemoData = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    if (!confirm('This will replace all existing data with demo data. Are you sure?')) {
      return;
    }

    setLoading(true);
    try {
      // First, delete all existing data
      await supabase.from('tenants').delete().eq('user_id', user.id);
      await supabase.from('properties').delete().eq('user_id', user.id);
      await supabase.from('maintenance_requests').delete().eq('user_id', user.id);

      // Add demo properties with expenses for charts
      const totalExpenses = [4200, 3100, 6800, 2900, 3500, 4100]; // Jan-Jun total expenses
      const propertiesWithExpenses = demoProperties.map((prop, index) => {
        // Distribute expenses across properties (each property gets a portion)
        const expenses = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const expensePerProperty = totalExpenses.map(total => Math.round(total / demoProperties.length));
        
        monthNames.forEach((month, monthIndex) => {
          expenses.push({
            description: `${month} maintenance and utilities`,
            amount: expensePerProperty[monthIndex],
            date: `2026-${String(monthIndex + 1).padStart(2, '0')}-15`,
            category: monthIndex % 2 === 0 ? 'maintenance' : 'utilities'
          });
        });

        return {
          ...prop,
          expenses
        };
      });

      // Insert properties
      const { data: insertedProperties, error: propertiesError } = await supabase
        .from('properties')
        .insert(propertiesWithExpenses.map(transformPropertyForDB))
        .select();

      if (propertiesError) throw propertiesError;

      // Add demo tenants with payment logs for charts
      const tenantsWithPayments = demoTenants.map((tenant, index) => {
        const paymentLog = [];
        
        // Only add payment logs for current tenants with paid status
        if (tenant.status === 'current' && tenant.paymentStatus === 'paid') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          monthNames.forEach((month, monthIndex) => {
            // Add payment for this month
            paymentLog.push({
              amount: tenant.rentAmount,
              date: `2026-${String(monthIndex + 1).padStart(2, '0')}-01`,
              method: 'check',
              notes: `${month} rent payment`
            });
          });
        }

        return {
          ...tenant,
          paymentLog,
          accessCode: generateAccessCode()
        };
      });

      // Insert tenants
      const { error: tenantsError } = await supabase
        .from('tenants')
        .insert(tenantsWithPayments.map(transformTenantForDB));

      if (tenantsError) throw tenantsError;

      // Add maintenance requests
      const { error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .insert(demoMaintenanceRequests.map(req => transformMaintenanceRequestForDB({
          ...req,
          tenantId: null,
          tenantName: req.property.split(',')[0] || ''
        })));

      if (maintenanceError) throw maintenanceError;

      // Reload data
      await loadData(user);
      alert('Demo data loaded successfully!');
    } catch (error) {
      console.error('Error loading demo data:', error);
      alert('Error loading demo data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenanceRequest = async (e) => {
    e.preventDefault();
    if (!newMaintenanceRequest.issue) return;
    
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([transformMaintenanceRequestForDB(newMaintenanceRequest)])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding maintenance request:', error);
      alert('Error adding maintenance request');
      return;
    }
    
    setMaintenanceRequests([transformMaintenanceRequest(data), ...maintenanceRequests]);
    setNewMaintenanceRequest({ tenantId: '', tenantName: '', property: '', issue: '', priority: 'medium', description: '', date: new Date().toISOString().split('T')[0] });
    setShowAddMaintenanceModal(false);
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    const tenantData = {
      ...newTenant,
      rentAmount: Number(newTenant.rentAmount) || 0,
      securityDeposit: Number(newTenant.securityDeposit) || 0,
      paymentLog: [],
      activityLog: [],
      leaseDocuments: [],
      moveInDate: '',
      moveInNotes: '',
      moveOutDate: '',
      moveOutNotes: '',
      depositDeductions: [],
      depositRefundAmount: 0,
      refundStatus: 'pending',
      accessCode: generateAccessCode() // Generate unique access code
    };
    
    const { data, error } = await supabase
      .from('tenants')
      .insert([transformTenantForDB(tenantData)])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding tenant:', error);
      alert('Error adding tenant');
      return;
    }
    
    setTenants([transformTenant(data), ...tenants]);
    setNewTenant({
      name: '',
      phone: '',
      email: '',
      property: '',
      rentAmount: '',
      securityDeposit: '',
      leaseStart: '',
      leaseEnd: '',
      status: 'prospect',
      paymentStatus: 'n/a',
      notes: '',
      moveInDate: '',
      moveInNotes: ''
    });
    setShowAddModal(false);
  };

  // Toast helper function
  const showToast = (message, type = 'error') => {
    const toast = { message, type, id: Date.now() };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  };

  // RequiredLabel component
  const RequiredLabel = ({ children, required = true }) => (
    <label className='form-label'>
      {children}
      {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
    </label>
  );

  // Get available units for a property
  const getAvailableUnits = (property) => {
    if (!property) return [];
    
    // Get all units that are currently occupied by tenants
    const occupiedUnits = tenants
      .filter(t => {
        // Check if tenant's property matches (could be by ID or address)
        const tenantProperty = t.property || '';
        const propertyMatch = property.id ? 
          (t.property_id === property.id || tenantProperty.includes(property.address)) :
          tenantProperty.includes(property.address);
        return propertyMatch && (t.status === 'current' || t.status === 'Current');
      })
      .map(t => {
        // Extract unit from property string (e.g., "123 Main St, Unit 4B" -> "4B")
        const unitMatch = t.property?.match(/Unit\s+([A-Z0-9]+)/i);
        return unitMatch ? unitMatch[1] : null;
      })
      .filter(Boolean);
    
    // Generate unit list based on total units
    const totalUnits = property.units || property.total_units || 1;
    const allUnits = [];
    
    // Generate unit names (numbers for most properties)
    for (let i = 1; i <= totalUnits; i++) {
      const unitName = String(i);
      if (!occupiedUnits.includes(unitName)) {
        allUnits.push(unitName);
      }
    }
    
    return allUnits;
  };

  // Validate and continue onboarding
  const validateAndContinue = () => {
    // Step 1 validation
    if (onboardingStep === 1) {
      if (!onboardingData.property) {
        showToast('Please select a property', 'error');
        return;
      }
      const isMultiUnit = (onboardingData.property.units || onboardingData.property.total_units || 0) > 1 ||
        ['Multi-Family', 'Multi-family', 'Townhouse', 'Duplex', 'Apartment Complex'].includes(onboardingData.property.type || onboardingData.property.property_type);
      if (isMultiUnit && !onboardingData.unit) {
        showToast('Please select an available unit', 'error');
        return;
      }
      // Auto-set unit for single-family
      if (!isMultiUnit && !onboardingData.unit) {
        setOnboardingData({ ...onboardingData, unit: 'Main' });
      }
      setOnboardingStep(2);
      return;
    }
    
    // Step 2 validation
    if (onboardingStep === 2) {
      if (onboardingData.tenant.isExisting) {
        if (!onboardingData.tenant.existingId) {
          showToast('Please select a prospect', 'error');
          return;
        }
      } else {
        if (!onboardingData.tenant.name) {
          showToast('Full name is required', 'error');
          return;
        }
        if (!onboardingData.tenant.email) {
          showToast('Email is required', 'error');
          return;
        }
      }
      setOnboardingStep(3);
      return;
    }
    
    // Step 3 validation
    if (onboardingStep === 3) {
      if (!onboardingData.lease.monthlyRent) {
        showToast('Monthly rent is required', 'error');
        return;
      }
      if (!onboardingData.lease.startDate) {
        showToast('Lease start date is required', 'error');
        return;
      }
      if (onboardingData.lease.leaseType === 'fixed' && !onboardingData.lease.endDate) {
        showToast('Lease end date is required for fixed-term leases', 'error');
        return;
      }
      setOnboardingStep(4);
      return;
    }
    
    // Step 4 - documents optional, can continue
    if (onboardingStep === 4) {
      setOnboardingStep(5);
      return;
    }
    
    // Step 5 validation
    if (onboardingStep === 5) {
      if (!onboardingData.moveInDate) {
        showToast('Move-in date is required', 'error');
        return;
      }
      setOnboardingStep(6);
      return;
    }
    
    // Step 6 - complete
    if (onboardingStep === 6) {
      completeOnboarding();
    }
  };

  // Complete onboarding wizard
  const completeOnboarding = async () => {
    if (!user) {
      alert('Please log in to complete onboarding');
      return;
    }

    try {
      // Create or update tenant
      let tenantId;
      const propertyAddress = onboardingData.property?.address || onboardingData.property?.name || '';
      const fullProperty = onboardingData.unit ? `${propertyAddress}, Unit ${onboardingData.unit}` : propertyAddress;

      if (onboardingData.tenant.isExisting && onboardingData.tenant.existingId) {
        // Update existing prospect to current tenant
        tenantId = onboardingData.tenant.existingId;
        const existingTenant = tenants.find(t => t.id === tenantId);
        const updatedTenant = {
          ...existingTenant,
          status: 'current',
          property: fullProperty,
          rentAmount: parseFloat(onboardingData.lease.monthlyRent) || 0,
          securityDeposit: parseFloat(onboardingData.lease.securityDeposit) || 0,
          leaseStart: onboardingData.lease.startDate || '',
          leaseEnd: onboardingData.lease.endDate || null,
          moveInDate: onboardingData.moveInDate || '',
          moveInNotes: onboardingData.moveInNotes || '',
          paymentStatus: 'n/a',
          paymentLog: existingTenant?.paymentLog || [],
          activityLog: existingTenant?.activityLog || [],
          leaseDocuments: existingTenant?.leaseDocuments || []
        };

        const { error: updateError } = await supabase
          .from('tenants')
          .update(transformTenantForDB(updatedTenant))
          .eq('id', tenantId);

        if (updateError) throw updateError;
      } else {
        // Create new tenant
        const newTenantData = {
          name: onboardingData.tenant.name,
          email: onboardingData.tenant.email || '',
          phone: onboardingData.tenant.phone || '',
          property: fullProperty,
          rentAmount: parseFloat(onboardingData.lease.monthlyRent) || 0,
          securityDeposit: parseFloat(onboardingData.lease.securityDeposit) || 0,
          leaseStart: onboardingData.lease.startDate || '',
          leaseEnd: onboardingData.lease.endDate || null,
          status: 'current',
          paymentStatus: 'n/a',
          paymentLog: [],
          activityLog: [],
          leaseDocuments: [],
          notes: '',
          moveInDate: onboardingData.moveInDate || '',
          moveInNotes: onboardingData.moveInNotes || '',
          accessCode: generateAccessCode()
        };

        const { data: newTenant, error: insertError } = await supabase
          .from('tenants')
          .insert([transformTenantForDB(newTenantData)])
          .select()
          .single();

        if (insertError) throw insertError;
        tenantId = newTenant.id;
      }

      // Upload documents
      for (const doc of onboardingData.documents) {
        try {
          await uploadDocument(doc, 'tenant', tenantId, 'lease');
        } catch (docError) {
          console.error('Error uploading document:', docError);
          // Continue with other documents even if one fails
        }
      }

      // Refresh data and close wizard
      await loadData();
      setShowOnboardingWizard(false);
      setOnboardingStep(1);
      setOnboardingData({
        property: null,
        unit: '',
        tenant: {
          name: '',
          email: '',
          phone: '',
          isExisting: false,
          existingId: null
        },
        lease: {
          monthlyRent: '',
          securityDeposit: '',
          startDate: '',
          endDate: '',
          leaseType: 'fixed'
        },
        documents: [],
        moveInDate: '',
        moveInNotes: ''
      });

      alert('Tenant onboarded successfully!');
    } catch (err) {
      console.error('Onboarding failed:', err);
      alert('Failed to complete onboarding: ' + (err.message || 'Unknown error'));
    }
  };

  // Validate and continue offboarding
  const validateAndContinueOffboarding = () => {
    // Step 1 validation
    if (offboardingStep === 1) {
      if (!offboardingData.tenant) {
        showToast('Please select a tenant', 'error');
        return;
      }
      setOffboardingStep(2);
      return;
    }
    
    // Step 2 validation
    if (offboardingStep === 2) {
      if (!offboardingData.moveOutDate) {
        showToast('Move-out date is required', 'error');
        return;
      }
      setOffboardingStep(3);
      return;
    }
    
    // Step 3 - inspection optional, can continue
    if (offboardingStep === 3) {
      setOffboardingStep(4);
      return;
    }
    
    // Step 4 - deposit optional, can continue
    if (offboardingStep === 4) {
      setOffboardingStep(5);
      return;
    }
    
    // Step 5 - statement review, can continue
    if (offboardingStep === 5) {
      setOffboardingStep(6);
      completeOffboarding();
      return;
    }
  };

  // Complete offboarding wizard
  const completeOffboarding = async () => {
    if (!user || !offboardingData.tenant) {
      showToast('Please log in and select a tenant', 'error');
      return;
    }

    try {
      // Update tenant status to Past
      await supabase.from('tenants').update({
        status: 'Past',
        move_out_date: offboardingData.moveOutDate,
        move_out_reason: offboardingData.reason,
        move_out_notes: offboardingData.inspectionNotes,
        forwarding_address: offboardingData.forwardingAddress,
        deposit_deductions: offboardingData.depositDeductions,
        deposit_refund_amount: Math.max(0, (offboardingData.tenant.security_deposit || 0) - offboardingData.depositDeductions.reduce((sum, d) => sum + (d.amount || 0), 0)),
        refund_status: 'pending'
      }).eq('id', offboardingData.tenant.id);
      
      // Upload inspection photos
      for (const photo of offboardingData.inspectionPhotos) {
        try {
          await uploadDocument(photo, 'tenant', offboardingData.tenant.id, 'move-out-inspection');
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          // Continue with other photos even if one fails
        }
      }
      
      // Refresh data
      await loadData();
      showToast('Tenant offboarded successfully', 'success');
      setOffboardingStep(6);
    } catch (err) {
      console.error('Offboarding failed:', err);
      showToast('Failed to complete offboarding: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  // Helper function to create audit log entry
  const createAuditEntry = (field, oldValue, newValue) => {
    return {
      id: Date.now() + Math.random(),
      field,
      oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : '',
      newValue: newValue !== null && newValue !== undefined ? String(newValue) : '',
      timestamp: new Date().toISOString(),
      changedBy: user?.email || 'Unknown'
    };
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    const originalTenant = tenants.find(t => t.id === editingTenant.id);
    if (!originalTenant) return;

    // Merge with original tenant to preserve all fields (paymentLog, activityLog, leaseDocument, etc.)
    const updatedTenant = {
      ...originalTenant,
      ...editingTenant,
      rentAmount: Number(editingTenant.rentAmount) || 0,
      securityDeposit: Number(editingTenant.securityDeposit) || 0,
      // Preserve these fields from original
      paymentLog: originalTenant.paymentLog || [],
      activityLog: originalTenant.activityLog || [],
      leaseDocuments: originalTenant.leaseDocuments || [],
      paymentDate: originalTenant.paymentDate || null,
      accessCode: originalTenant.accessCode || generateAccessCode() // Preserve or generate access code
    };

    // Track changes for audit log
    const auditEntries = [];
    const fieldMappings = {
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      property: 'Property',
      rentAmount: 'Monthly Rent',
      securityDeposit: 'Security Deposit',
      leaseStart: 'Lease Start',
      leaseEnd: 'Lease End',
      status: 'Status',
      paymentStatus: 'Payment Status',
      notes: 'Notes'
    };

    Object.keys(fieldMappings).forEach(key => {
      const oldValue = originalTenant[key];
      const newValue = updatedTenant[key];
      
      // Compare values (handle different types)
      if (oldValue !== newValue) {
        // Format values for display
        let displayOldValue = oldValue;
        let displayNewValue = newValue;
        
        if (key === 'rentAmount' || key === 'securityDeposit') {
          displayOldValue = oldValue ? `$${Number(oldValue).toLocaleString()}` : '';
          displayNewValue = newValue ? `$${Number(newValue).toLocaleString()}` : '';
        } else if (key === 'leaseStart' || key === 'leaseEnd') {
          displayOldValue = oldValue ? new Date(oldValue).toLocaleDateString() : '';
          displayNewValue = newValue ? new Date(newValue).toLocaleDateString() : '';
        }
        
        auditEntries.push(createAuditEntry(fieldMappings[key], displayOldValue, displayNewValue));
      }
    });

    // Add audit entries to existing audit log
    const updatedAuditLog = [...(originalTenant.auditLog || []), ...auditEntries];

    const tenantData = {
      ...updatedTenant,
      auditLog: updatedAuditLog
    };

    const { data, error } = await supabase
      .from('tenants')
      .update(transformTenantForDB(tenantData))
      .eq('id', editingTenant.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      alert(`Error updating tenant: ${error.message}`);
      return;
    }

    setTenants(tenants.map(t => t.id === editingTenant.id ? transformTenant(data) : t));
    setEditingTenant(null);
    
    // Update selectedTenant if it's the same tenant
    if (selectedTenant && selectedTenant.id === editingTenant.id) {
      setSelectedTenant(transformTenant(data));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      current: { background: '#dcfce7', color: '#166534' },
      past: { background: '#f3f4f6', color: '#4b5563' },
      prospect: { background: '#dbeafe', color: '#1e40af' }
    };
    return styles[status] || styles.prospect;
  };

  const getPaymentBadge = (status) => {
    const styles = {
      paid: { background: '#dcfce7', color: '#166534' },
      late: { background: '#fee2e2', color: '#991b1b' },
      'n/a': { background: '#f3f4f6', color: '#6b7280' }
    };
    return styles[status] || styles['n/a'];
  };

  // Auto-detect column mapping for tenants
  const autoDetectTenantColumns = (headers) => {
    const mapping = {};
    const headerLower = headers.map(h => h.toLowerCase().trim());
    
    // Common AppFolio and other header variations
    const patterns = {
      name: ['tenant name', 'name', 'tenant', 'full name', 'tenant full name'],
      phone: ['phone number', 'phone', 'telephone', 'mobile', 'cell'],
      email: ['email address', 'email', 'e-mail', 'email address'],
      property: ['unit', 'property', 'property/unit', 'address', 'property address', 'unit number'],
      rentAmount: ['rent amount', 'rent', 'monthly rent', 'rental amount', 'rent amount'],
      securityDeposit: ['deposit', 'security deposit', 'deposit amount', 'security'],
      leaseStart: ['lease from', 'lease start', 'start date', 'lease start date', 'from'],
      leaseEnd: ['lease to', 'lease end', 'end date', 'lease end date', 'to'],
      status: ['status', 'tenant status', 'current status']
    };

    Object.keys(patterns).forEach(field => {
      const found = headerLower.findIndex(h => patterns[field].some(p => h.includes(p)));
      if (found !== -1) {
        mapping[field] = headers[found];
      }
    });

    return mapping;
  };

  // Auto-detect column mapping for properties
  const autoDetectPropertyColumns = (headers) => {
    const mapping = {};
    const headerLower = headers.map(h => h.toLowerCase().trim());
    
    const patterns = {
      address: ['property address', 'address', 'property', 'street address'],
      type: ['type', 'property type', 'unit type', 'building type'],
      units: ['units', 'total units', 'unit count', 'number of units'],
      ownerName: ['owner', 'owner name', 'property owner', 'owner name'],
      ownerEmail: ['owner email', 'owner e-mail', 'email', 'owner email address']
    };

    Object.keys(patterns).forEach(field => {
      const found = headerLower.findIndex(h => patterns[field].some(p => h.includes(p)));
      if (found !== -1) {
        mapping[field] = headers[found];
      }
    });

    return mapping;
  };

  // Handle tenant CSV upload
  const handleTenantCsvUpload = (file) => {
    setTenantCsvFile(file);
    setTenantImportProgress(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          alert('Error parsing CSV: ' + results.errors.map(e => e.message).join(', '));
          return;
        }

        const headers = Object.keys(results.data[0] || {});
        const rows = results.data.filter(row => Object.values(row).some(v => v));
        
        setTenantCsvData(results.data);
        
        // Create preview
        const previewRows = rows.slice(0, 5).map(row => {
          const previewRow = {};
          headers.forEach(header => {
            previewRow[header] = row[header] || '';
          });
          return previewRow;
        });
        
        setTenantCsvPreview({
          headers,
          rows: previewRows
        });

        // Auto-detect columns
        const autoMapping = autoDetectTenantColumns(headers);
        setTenantColumnMapping(autoMapping);
      },
      error: (error) => {
        alert('Error reading CSV file: ' + error.message);
        setTenantCsvFile(null);
      }
    });
  };

  // Handle property CSV upload
  const handlePropertyCsvUpload = (file) => {
    setPropertyCsvFile(file);
    setPropertyImportProgress(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          alert('Error parsing CSV: ' + results.errors.map(e => e.message).join(', '));
          return;
        }

        const headers = Object.keys(results.data[0] || {});
        const rows = results.data.filter(row => Object.values(row).some(v => v));
        
        setPropertyCsvData(results.data);
        
        // Create preview
        const previewRows = rows.slice(0, 5).map(row => {
          const previewRow = {};
          headers.forEach(header => {
            previewRow[header] = row[header] || '';
          });
          return previewRow;
        });
        
        setPropertyCsvPreview({
          headers,
          rows: previewRows
        });

        // Auto-detect columns
        const autoMapping = autoDetectPropertyColumns(headers);
        setPropertyColumnMapping(autoMapping);
      },
      error: (error) => {
        alert('Error reading CSV file: ' + error.message);
        setPropertyCsvFile(null);
      }
    });
  };

  // Import tenants from CSV
  const handleImportTenants = async () => {
    if (!tenantCsvData || !tenantColumnMapping.name) {
      alert('Please map at least the Name column');
      return;
    }

    const progress = {
      total: tenantCsvData.length,
      processed: 0,
      success: 0,
      errors: 0,
      duplicates: 0,
      complete: false
    };
    setTenantImportProgress(progress);

    const existingEmails = new Set(tenants.filter(t => t.email).map(t => t.email.toLowerCase()));

    for (let i = 0; i < tenantCsvData.length; i++) {
      const row = tenantCsvData[i];
      
      try {
        // Map CSV columns to tenant fields
        const tenantData = {
          name: row[tenantColumnMapping.name] || '',
          phone: row[tenantColumnMapping.phone] || '',
          email: row[tenantColumnMapping.email] || '',
          property: row[tenantColumnMapping.property] || '',
          rentAmount: parseFloat(row[tenantColumnMapping.rentAmount] || 0) || 0,
          securityDeposit: parseFloat(row[tenantColumnMapping.securityDeposit] || 0) || 0,
          leaseStart: row[tenantColumnMapping.leaseStart] || '',
          leaseEnd: row[tenantColumnMapping.leaseEnd] || '',
          status: (row[tenantColumnMapping.status] || 'prospect').toLowerCase(),
          paymentStatus: 'n/a',
          paymentLog: [],
          activityLog: [],
          auditLog: [],
          leaseDocuments: [],
          notes: '',
          moveInDate: '',
          moveInNotes: '',
          depositDeductions: [],
          depositRefundAmount: null,
          refundStatus: 'pending'
        };

        // Skip if name is missing
        if (!tenantData.name.trim()) {
          progress.errors++;
          progress.processed++;
          setTenantImportProgress({...progress});
          continue;
        }

        // Check for duplicates by email
        if (tenantData.email && existingEmails.has(tenantData.email.toLowerCase())) {
          progress.duplicates++;
          progress.processed++;
          setTenantImportProgress({...progress});
          continue;
        }

        // Add to Supabase
        const { error } = await supabase
          .from('tenants')
          .insert([transformTenantForDB(tenantData)]);

        if (error) {
          console.error('Error importing tenant:', error);
          progress.errors++;
        } else {
          progress.success++;
          if (tenantData.email) {
            existingEmails.add(tenantData.email.toLowerCase());
          }
        }
      } catch (error) {
        console.error('Error processing tenant row:', error);
        progress.errors++;
      }

      progress.processed++;
      setTenantImportProgress({...progress});
    }

    // Reload tenants
    await loadData();
    
    progress.complete = true;
    setTenantImportProgress({...progress});
  };

  // Import properties from CSV
  const handleImportProperties = async () => {
    if (!propertyCsvData || !propertyColumnMapping.address) {
      alert('Please map at least the Address column');
      return;
    }

    const progress = {
      total: propertyCsvData.length,
      processed: 0,
      success: 0,
      errors: 0,
      duplicates: 0,
      complete: false
    };
    setPropertyImportProgress(progress);

    const existingAddresses = new Set(properties.map(p => p.address.toLowerCase()));

    for (let i = 0; i < propertyCsvData.length; i++) {
      const row = propertyCsvData[i];
      
      try {
        // Map CSV columns to property fields
        const propertyData = {
          address: row[propertyColumnMapping.address] || '',
          type: row[propertyColumnMapping.type] || '',
          units: parseInt(row[propertyColumnMapping.units] || 0) || 0,
          occupied: 0,
          monthlyRevenue: 0,
          photoUrl: null,
          expenses: [],
          ownerName: row[propertyColumnMapping.ownerName] || '',
          ownerEmail: row[propertyColumnMapping.ownerEmail] || ''
        };

        // Skip if address is missing
        if (!propertyData.address.trim()) {
          progress.errors++;
          progress.processed++;
          setPropertyImportProgress({...progress});
          continue;
        }

        // Check for duplicates by address
        if (existingAddresses.has(propertyData.address.toLowerCase())) {
          progress.duplicates++;
          progress.processed++;
          setPropertyImportProgress({...progress});
          continue;
        }

        // Add to Supabase
        const { error } = await supabase
          .from('properties')
          .insert([transformPropertyForDB(propertyData)]);

        if (error) {
          console.error('Error importing property:', error);
          progress.errors++;
        } else {
          progress.success++;
          existingAddresses.add(propertyData.address.toLowerCase());
        }
      } catch (error) {
        console.error('Error processing property row:', error);
        progress.errors++;
      }

      progress.processed++;
      setPropertyImportProgress({...progress});
    }

    // Reload properties
    await loadData();
    
    progress.complete = true;
    setPropertyImportProgress({...progress});
  };

  // Check if we're on the tenant portal route
  useEffect(() => {
    if (window.location.pathname === '/tenant-portal') {
      // Tenant portal handles its own routing
    }
  }, []);

  // Show tenant portal if on that route
  if (window.location.pathname === '/tenant-portal') {
    return <TenantPortal />;
  }

  // Show payment page if on /pay route (public, no auth required)
  if (window.location.pathname.startsWith('/pay/')) {
    return <PaymentPage />;
  }

  // Show auth screen if not authenticated
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Mobile Header Component
  const MobileHeader = () => (
    <div className='mobile-header'>
      <button className='hamburger-btn' onClick={() => setMobileMenuOpen(true)} type="button">
        ☰
      </button>
      <span style={{ fontWeight: 700, fontSize: 18, color: '#1a73e8' }}>Propli</span>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a73e8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
        {user?.email?.[0]?.toUpperCase() || 'U'}
      </div>
    </div>
  );

  return (
    <div className="app google-style">
      {/* Mobile Header - only show on mobile */}
      {isMobile && <MobileHeader />}
      
      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '12px 16px',
              background: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#d1fae5' : '#e0f2fe',
              color: toast.type === 'error' ? '#dc2626' : toast.type === 'success' ? '#059669' : '#0284c7',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 300,
              animation: 'slideIn 0.3s ease'
            }}
          >
            <span style={{ fontSize: 18 }}>{toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✓' : 'ℹ️'}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button 
              onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))} 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: 20,
                color: 'inherit',
                padding: 0,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Top Header - Google Workspace Style - hide on mobile */}
      {!isMobile && (
      <header className="top-header">
        <div className="header-left">
          <a href="#" className="header-logo" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Propli</span>
          </a>
        </div>
        <div className="header-search">
          <input 
            type="text" 
            id="global-search"
            name="global-search"
            placeholder="Search tenants, properties..." 
            className="search-bar" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tenants, properties"
          />
        </div>
        <div className="header-right">
          <div className="user-profile">
            <div 
              className="user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-item" style={{ padding: '16px', borderBottom: '1px solid #dadce0' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{user?.email || 'User'}</div>
                  <div style={{ fontSize: '12px', color: '#5f6368' }}>Property Manager</div>
                </div>
                <button className="user-menu-item" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className='mobile-overlay' onClick={() => setMobileMenuOpen(false)} />
          <aside className={`sidebar mobile-open`}>
            <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 20, color: '#1a73e8' }}>Propli</span>
              <button 
                type="button"
                onClick={() => setMobileMenuOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#4b5563', padding: 4 }}
              >
                ×
              </button>
            </div>
            <nav style={{ padding: 16 }}>
              {[
                { id: 'dashboard', icon: '📊', label: 'Dashboard' },
                { id: 'tenants', icon: '👥', label: 'Tenants' },
                { id: 'properties', icon: '🏠', label: 'Properties' },
                { id: 'owners', icon: '👤', label: 'Owners' },
                { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
                { id: 'schedule', icon: '📅', label: 'Schedule' },
                { id: 'reports', icon: '📈', label: 'Reports' },
                { id: 'settings', icon: '⚙️', label: 'Settings' }
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: activeTab === item.id ? '#e8f0fe' : 'transparent',
                    color: activeTab === item.id ? '#1a73e8' : '#4b5563',
                    fontWeight: activeTab === item.id ? 600 : 400,
                    marginBottom: 4
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper" style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 220) }}>
        <main className="main-content">
          {/* Mobile Pull to Refresh Hint */}
          {isMobile && (
            <div style={{ textAlign: 'center', padding: 8, fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
              Pull down to refresh
            </div>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* Global Search Results */}
              {searchQuery && searchQuery.trim() && (() => {
                const searchResults = performGlobalSearch(searchQuery);
                const hasResults = searchResults.tenants.length > 0 || searchResults.properties.length > 0;
                
                return (
                  <div className="search-results-overlay" onClick={() => setSearchQuery('')}>
                    <div className="search-results" onClick={(e) => e.stopPropagation()}>
                      <div className="search-results-header">
                        <h3>Search Results</h3>
                        <button 
                          className="close-btn"
                          onClick={() => setSearchQuery('')}
                          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#5f6368', padding: '0', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                      {!hasResults ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#5f6368' }}>
                          <p>No results found for "{searchQuery}"</p>
                        </div>
                      ) : (
                        <>
                          {searchResults.tenants.length > 0 && (
                            <div className="search-results-section">
                              <h4>Tenants ({searchResults.tenants.length})</h4>
                              {searchResults.tenants.map(tenant => (
                                <div 
                                  key={tenant.id} 
                                  className="search-result-item"
                                  onClick={async () => {
                                    setSelectedTenant(tenant);
                                    setSearchQuery('');
                                    setActiveTab('tenants');
                                    // Load files for this tenant
                                    const files = await loadFilesForRecord('tenant', tenant.id);
                                    setTenantFiles(files);
                                  }}
                                >
                                  <strong>{tenant.name || 'Unnamed'}</strong>
                                  <span>{tenant.property || 'No property'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.properties.length > 0 && (
                            <div className="search-results-section">
                              <h4>Properties ({searchResults.properties.length})</h4>
                              {searchResults.properties.map(property => (
                                <div 
                                  key={property.id} 
                                  className="search-result-item"
                                  onClick={async () => {
                                    setSelectedProperty(property);
                                    setSearchQuery('');
                                    setActiveTab('properties');
                                    // Load files for this property
                                    const files = await loadFilesForRecord('property', property.id);
                                    setPropertyFiles(files);
                                  }}
                                >
                                  <strong>{property.address || 'Unnamed'}</strong>
                                  <span>{property.type || 'No type'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="dashboard-container">
                  {/* Dashboard Header */}
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Dashboard</h1>
                        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Welcome back! Here's what's happening with your properties.</p>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                          background: darkMode ? '#303134' : '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '8px',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          color: darkMode ? '#e8eaed' : '#5f6368',
                          transition: 'all 0.2s'
                        }}
                        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = darkMode ? '#3c4043' : '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = darkMode ? '#303134' : '#fff';
                        }}
                      >
                        {darkMode ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tag Alerts */}
                  {(() => {
                    const highPriorityTag = tags.find(t => t.name === 'high_priority');
                    if (highPriorityTag) {
                      const highPriorityRecords = recordTags.filter(rt => rt.tag_id === highPriorityTag.id);
                      const highPriorityCount = highPriorityRecords.length;
                      
                      if (highPriorityCount > 0) {
                        return (
                          <div
                            className="alert-banner"
                            style={{
                              background: '#fff7ed',
                              borderColor: '#fed7aa',
                              color: '#c2410c',
                              marginBottom: '16px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setSelectedTagFilters([highPriorityTag.id]);
                              setActiveTab('tenants');
                            }}
                          >
                            <div className="alert-content" style={{ flex: 1, minWidth: 0 }}>
                              <span className="alert-icon">⚠️</span>
                              <div className="alert-text" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                <strong>{highPriorityCount} record{highPriorityCount > 1 ? 's' : ''} tagged high_priority need attention</strong>
                                <span className="alert-tenants" style={{ display: 'block', marginTop: '4px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                  Click to view all high priority records
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTagFilters([highPriorityTag.id]);
                                setActiveTab('tenants');
                              }}
                              className="alert-action"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#1a73e8',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                padding: '0',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                              View Records
                            </button>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  {/* Stats Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {(() => {
                      const metrics = getDashboardMetrics();
                      const currentMonth = new Date().getMonth();
                      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                      const revenueData = getRevenueData();
                      const lastMonthRevenue = revenueData.length > 1 ? revenueData[revenueData.length - 2].revenue : 0;
                      const thisMonthRevenue = revenueData.length > 0 ? revenueData[revenueData.length - 1].revenue : 0;
                      const revenueChange = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;
                      
                      // Calculate units added this month (simplified - using current data)
                      const unitsThisMonth = 0; // This would need historical data
                      
                      // Count overdue payments
                      const overdueCount = tenants.filter(t => t.status === 'current' && t.paymentStatus === 'late').length;
                      
                      // Count leases expiring soon
                      const leasesExpiringSoon = metrics.leasesExpiring30 + metrics.leasesExpiring60 + metrics.leasesExpiring90;
                      
                      return (
                        <>
                          {/* Total Units Card */}
                          <div 
                            onClick={() => setActiveTab('properties')}
                            style={{
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              padding: '20px',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.2s, transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1 }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                            </div>
                            <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '8px' }}>Total Units</div>
                            <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124', marginBottom: '8px' }}>{metrics.totalUnits}</div>
                            <div style={{ fontSize: '14px', color: '#10b981' }}>+{unitsThisMonth} this month</div>
                          </div>

                          {/* Monthly Revenue Card */}
                          <div 
                            onClick={() => setActiveTab('reports')}
                            style={{
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              padding: '20px',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.2s, transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1 }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                              </svg>
                            </div>
                            <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '8px' }}>Monthly Revenue</div>
                            <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124', marginBottom: '8px' }}>
                              ${metrics.collectedRevenue.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '14px', color: '#10b981' }}>
                              {revenueChange > 0 ? '+' : ''}{revenueChange}% from last month
                            </div>
                          </div>

                          {/* Active Tenants Card */}
                          <div 
                            onClick={() => setActiveTab('tenants')}
                            style={{
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              padding: '20px',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.2s, transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1 }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                            </div>
                            <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '8px' }}>Active Tenants</div>
                            <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124', marginBottom: '8px' }}>{metrics.occupiedUnits}</div>
                            <div style={{ fontSize: '14px', color: '#5f6368' }}>{leasesExpiringSoon} leases expiring soon</div>
                          </div>

                          {/* Outstanding Card */}
                          <div 
                            onClick={() => {
                              setActiveTab('tenants');
                              setFilterStatus('late');
                            }}
                            style={{
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              padding: '20px',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.2s, transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1 }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <path d="M10.29 3.86L1 20h18.5l-9.21-16.14z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                              </svg>
                            </div>
                            <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '8px' }}>Outstanding</div>
                            <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124', marginBottom: '8px' }}>
                              ${metrics.outstandingBalances.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '14px', color: '#ef4444' }}>{overdueCount} overdue payments</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Charts Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    {/* Revenue Overview Chart */}
                    <div style={{
                      background: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      padding: '24px'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '400', color: '#202124', margin: '0 0 4px 0' }}>Revenue Overview</h3>
                      <p style={{ fontSize: '14px', color: '#5f6368', margin: '0 0 24px 0' }}>Monthly rental income</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getRevenueData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#5f6368"
                            tick={{ fill: '#5f6368', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#5f6368"
                            tick={{ fill: '#5f6368', fontSize: 12 }}
                            tickFormatter={(value) => formatCurrency(value)}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              background: '#fff', 
                              border: '1px solid #dadce0', 
                              borderRadius: '4px',
                              padding: '8px'
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="revenue" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Occupancy Rate Chart */}
                    <div style={{
                      background: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      padding: '24px'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '400', color: '#202124', margin: '0 0 4px 0' }}>Occupancy Rate</h3>
                      <p style={{ fontSize: '14px', color: '#5f6368', margin: '0 0 24px 0' }}>Property occupancy over time</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getOccupancyData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#5f6368"
                            tick={{ fill: '#5f6368', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#5f6368" 
                            domain={[0, 100]}
                            tick={{ fill: '#5f6368', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              background: '#fff', 
                              border: '1px solid #dadce0', 
                              borderRadius: '4px',
                              padding: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="occupancy" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Tenants Section */}
                  <div style={{
                    background: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: '8px',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '400', color: '#202124', margin: 0 }}>Recent Tenants</h3>
                      <button
                        onClick={() => setActiveTab('tenants')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1a73e8',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: 0,
                          textDecoration: 'none'
                        }}
                      >
                        View All
                      </button>
                    </div>
                    <div>
                      {getRecentTenants().map((tenant, index) => (
                        <div
                          key={tenant.id}
                          onClick={async () => {
                            setSelectedTenant(tenant);
                            // Load files for this tenant
                            const files = await loadFilesForRecord('tenant', tenant.id);
                            setTenantFiles(files);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px 0',
                            borderBottom: index < getRecentTenants().length - 1 ? '1px solid #e5e7eb' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: getAvatarColor(index),
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '500',
                              marginRight: '16px'
                            }}
                          >
                            {getInitials(tenant.name)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '400', color: '#202124', marginBottom: '4px' }}>
                              {tenant.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#5f6368' }}>
                              {tenant.property}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginRight: '16px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '400', color: '#202124', marginBottom: '4px' }}>
                              {formatCurrency(tenant.rentAmount)}
                            </div>
                            <span
                              style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: tenant.paymentStatus === 'paid' ? '#d1fae5' : '#fee2e2',
                                color: tenant.paymentStatus === 'paid' ? '#065f46' : '#991b1b'
                              }}
                            >
                              {tenant.paymentStatus === 'paid' ? 'Current' : 'Late'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {getRecentTenants().length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#5f6368' }}>
                          No tenants found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Late Payments Banner */}
              {stats.latePayments > 0 && activeTab !== 'dashboard' && !dismissedBanners.includes('late-payments') && (
                <div className="alert-banner" style={{ background: '#fee2e2', borderColor: '#fecaca', marginBottom: '16px' }}>
                <div className="alert-content" style={{ flex: 1, minWidth: 0 }}>
                  <span className="alert-icon">💰</span>
                  <div className="alert-text" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <strong>You have {stats.latePayments} tenant{stats.latePayments > 1 ? 's' : ''} with late payments</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                  <button 
                    className="alert-action"
                    onClick={() => {
                      setActiveTab('tenants');
                      setFilterStatus('late');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '0',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    View Late Tenants
                  </button>
                  <button
                    onClick={() => {
                      setDismissedBanners([...dismissedBanners, 'late-payments']);
                      // Reset filter if currently on late filter
                      if (filterStatus === 'late' && activeTab === 'tenants') {
                        setFilterStatus('all');
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5f6368',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                    title="Dismiss"
                    aria-label="Dismiss alert"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {expiringLeases.length > 0 && !dismissedBanners.includes('expiring-leases') && (
              <div className="alert-banner" style={{ marginBottom: '16px' }}>
                <div className="alert-content" style={{ flex: 1, minWidth: 0 }}>
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-text" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <strong>{expiringLeases.length} lease{expiringLeases.length > 1 ? 's' : ''} expiring within 90 days:</strong>
                    <span className="alert-tenants" style={{ display: 'block', marginTop: '4px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {expiringLeases.map(t => t.name).join(', ')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                  <button 
                    className="alert-action"
                    onClick={() => {
                      setActiveTab('tenants');
                      setFilterStatus('expiring');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '0',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    View Expiring Leases
                  </button>
                  <button
                    onClick={() => {
                      setDismissedBanners([...dismissedBanners, 'expiring-leases']);
                      // Reset filter if currently on expiring filter
                      if (filterStatus === 'expiring' && activeTab === 'tenants') {
                        setFilterStatus('all');
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5f6368',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                    title="Dismiss"
                    aria-label="Dismiss alert"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}

              {activeTab === 'tenants' && (
                <div className="content-section">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }} className="page-header">
                    <div>
                      <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Tenants</h1>
                      <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Manage your tenant directory</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }} className="page-header-actions">
                        <button 
                          className="btn btn-primary" 
                          onClick={() => setShowAddModal(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          + Add Tenant
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => {
                            setShowOnboardingWizard(true);
                            setOnboardingStep(1);
                            setOnboardingData({
                              property: null,
                              unit: '',
                              tenant: {
                                name: '',
                                email: '',
                                phone: '',
                                isExisting: false,
                                existingId: null
                              },
                              lease: {
                                monthlyRent: '',
                                securityDeposit: '',
                                startDate: '',
                                endDate: '',
                                leaseType: 'fixed'
                              },
                              documents: [],
                              moveInDate: '',
                              moveInNotes: ''
                            });
                          }}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          Onboard Tenant
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => {
                            setShowOffboardingWizard(true);
                            setOffboardingStep(1);
                            setOffboardingData({
                              tenant: null,
                              moveOutDate: '',
                              reason: '',
                              forwardingAddress: '',
                              inspectionChecklist: {
                                wallsClean: false,
                                floorsClean: false,
                                appliancesWorking: false,
                                plumbingWorking: false,
                                keysReturned: false,
                                smokeDetectorsWorking: false,
                                noMissingItems: false
                              },
                              inspectionNotes: '',
                              inspectionPhotos: [],
                              depositDeductions: [],
                              finalStatement: null
                            });
                          }}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          Offboard Tenant
                        </button>
                      </div>
                    </div>

                  {/* Mobile Search Bar - Only show on mobile */}
                  {isMobile && (
                    <div className="mobile-search" style={{ position: 'relative', marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="Search tenants..."
                        value={tenantSearchQuery}
                        onChange={(e) => setTenantSearchQuery(e.target.value)}
                        aria-label="Search tenants"
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 16px 0 40px',
                          border: '1px solid #dadce0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#202124'
                        }}
                      />
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#5f6368" 
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '12px',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                  )}

                  {/* Search and Filter Bar - Desktop Only */}
                  {!isMobile && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '24px',
                    alignItems: 'center'
                  }} className="filter-row">
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                      <input
                        type="text"
                        placeholder="Search tenants..."
                        value={tenantSearchQuery}
                        onChange={(e) => setTenantSearchQuery(e.target.value)}
                        aria-label="Search tenants"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 16px 0 40px',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: '#202124'
                        }}
                      />
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#5f6368" 
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                          height: '40px',
                          padding: '0 40px 0 16px',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          background: '#fff',
                          color: '#202124',
                          fontSize: '14px',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          paddingRight: '40px'
                        }}
                      >
                        <option value="all">All Tenants</option>
                        <option value="current">Current</option>
                        <option value="prospect">Prospects</option>
                        <option value="past">Past</option>
                        <option value="late">Late Payments</option>
                        {expiringLeases.length > 0 && <option value="expiring">Expiring Leases</option>}
                      </select>
                    </div>
                    {/* Tag Filter */}
                    {tags.length > 0 && (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => {
                              const dropdown = document.getElementById('tag-filter-dropdown');
                              if (dropdown) {
                                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                              }
                            }}
                            style={{
                              height: '40px',
                              padding: '0 16px',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#202124',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            Tags {selectedTagFilters.length > 0 && `(${selectedTagFilters.length})`}
                          </button>
                          <div
                            id="tag-filter-dropdown"
                            style={{
                              display: 'none',
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '4px',
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              padding: '8px',
                              minWidth: '200px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              zIndex: 1000
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tags.map(tag => (
                              <div
                                key={tag.id}
                                onClick={() => {
                                  if (selectedTagFilters.includes(tag.id)) {
                                    setSelectedTagFilters(selectedTagFilters.filter(id => id !== tag.id));
                                  } else {
                                    setSelectedTagFilters([...selectedTagFilters, tag.id]);
                                  }
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  background: selectedTagFilters.includes(tag.id) ? '#e8f0fe' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => {
                                  if (!selectedTagFilters.includes(tag.id)) {
                                    e.currentTarget.style.background = '#f9fafb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!selectedTagFilters.includes(tag.id)) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTagFilters.includes(tag.id)}
                                  onChange={() => {}}
                                  style={{ margin: 0 }}
                                />
                                <span className={`tag-pill ${tag.color}`} style={{ fontSize: '12px' }}>
                                  {tag.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Search and Filter Bar - Desktop Only */}
                  {!isMobile && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '24px',
                    alignItems: 'center'
                  }} className="filter-row">
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <input
                          type="text"
                          placeholder="Search tenants..."
                          value={tenantSearchQuery}
                          onChange={(e) => setTenantSearchQuery(e.target.value)}
                          aria-label="Search tenants"
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 16px 0 40px',
                            border: '1px solid #dadce0',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: '#202124'
                          }}
                        />
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#5f6368" 
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                          height: '40px',
                          padding: '0 40px 0 16px',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          background: '#fff',
                          color: '#202124',
                          fontSize: '14px',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          paddingRight: '40px'
                        }}
                      >
                        <option value="all">All Tenants</option>
                        <option value="current">Current</option>
                        <option value="prospect">Prospects</option>
                        <option value="past">Past</option>
                        <option value="late">Late Payments</option>
                        {expiringLeases.length > 0 && <option value="expiring">Expiring Leases</option>}
                      </select>
                    </div>
                    {/* Tag Filter */}
                    {tags.length > 0 && (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => {
                              const dropdown = document.getElementById('tag-filter-dropdown');
                              if (dropdown) {
                                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                              }
                            }}
                            style={{
                              height: '40px',
                              padding: '0 16px',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#202124',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                              <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            Filter by Tag
                            {selectedTagFilters.length > 0 && (
                              <span style={{
                                background: '#1a73e8',
                                color: '#fff',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                {selectedTagFilters.length}
                              </span>
                            )}
                          </button>
                          <div
                            id="tag-filter-dropdown"
                            style={{
                              display: 'none',
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              marginTop: '4px',
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              zIndex: 1000,
                              minWidth: '200px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              padding: '8px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tags.map(tag => {
                              const isSelected = selectedTagFilters.includes(tag.id);
                              const colorMap = {
                                blue: '#1a73e8',
                                green: '#10b981',
                                yellow: '#fbbf24',
                                orange: '#f97316',
                                red: '#ef4444',
                                purple: '#a855f7',
                                teal: '#14b8a6',
                                gray: '#6b7280'
                              };
                              return (
                                <label
                                  key={tag.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTagFilters([...selectedTagFilters, tag.id]);
                                      } else {
                                        setSelectedTagFilters(selectedTagFilters.filter(id => id !== tag.id));
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      background: colorMap[tag.color] || colorMap.blue,
                                      flexShrink: 0
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#202124' }}>{tag.name}</span>
                                </label>
                              );
                            })}
                            {selectedTagFilters.length > 0 && (
                              <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb', marginTop: '4px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedTagFilters([]);
                                    document.getElementById('tag-filter-dropdown').style.display = 'none';
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px',
                                    background: 'none',
                                    border: '1px solid #dadce0',
                                    borderRadius: '4px',
                                    color: '#5f6368',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Clear filters
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedTagFilters.length > 0 && (
                          <button
                            onClick={() => setSelectedTagFilters([])}
                            style={{
                              marginLeft: '8px',
                              background: 'none',
                              border: 'none',
                              color: '#5f6368',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Clear tag filters"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {selectedTagFilters.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#5f6368', whiteSpace: 'nowrap' }}>
                        {filteredTenants.length} result{filteredTenants.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    <button
                      onClick={exportToCSV}
                      style={{
                        height: '40px',
                        padding: '0 16px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        background: '#fff',
                        color: '#202124',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Export
                    </button>
                  </div>
                  )}

                  {/* Mobile Card View */}
                  {isMobile ? (
                    <div className='mobile-cards'>
                      {filteredTenants.map(tenant => {
                        const property = properties.find(p => p.id === tenant.property_id || p.address === tenant.property);
                        const isLate = tenant.status === 'current' && tenant.paymentStatus === 'late';
                        const statusBadge = tenant.status === 'current' 
                          ? (isLate ? 'Late' : 'Current')
                          : tenant.status === 'prospect' 
                          ? 'Prospect'
                          : 'Past';
                        
                        return (
                          <div
                            key={tenant.id}
                            className='mobile-card'
                            onClick={() => {
                              setSelectedTenant(tenant);
                              loadFilesForRecord('tenant', tenant.id).then(files => {
                                setTenantFiles(files);
                              });
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: getAvatarColorByName(tenant.name),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: 16
                              }}>
                                {getInitials(tenant.name)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, marginBottom: 2, margin: 0, fontSize: 16 }}>{tenant.name}</p>
                                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{tenant.email || ''}</p>
                              </div>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 500,
                                background: statusBadge === 'Current' ? '#d1fae5' : 
                                          statusBadge === 'Late' ? '#fee2e2' : 
                                          statusBadge === 'Prospect' ? '#dbeafe' : '#f3f4f6',
                                color: statusBadge === 'Current' ? '#065f46' : 
                                      statusBadge === 'Late' ? '#991b1b' : 
                                      statusBadge === 'Prospect' ? '#1e40af' : '#6b7280'
                              }}>
                                {statusBadge}
                              </span>
                            </div>
                            
                            <div style={{ fontSize: 14, color: '#4b5563', marginBottom: 12 }}>
                              <p style={{ margin: '4px 0' }}>
                                📍 {property?.name || property?.address || tenant.property || 'Unassigned'}{tenant.unit ? `, Unit ${tenant.unit}` : ''}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <span>💰 ${tenant.rentAmount || tenant.rent || 0}/mo</span>
                                <span>📅 {tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'MTM'}</span>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                              <a 
                                href={`mailto:${tenant.email}`} 
                                onClick={(e) => e.stopPropagation()}
                                style={{ flex: 1, textAlign: 'center', padding: 10, background: '#f3f4f6', borderRadius: 8, textDecoration: 'none', color: '#4b5563', fontSize: 14, fontWeight: 500 }}
                              >
                                ✉️ Email
                              </a>
                              <a 
                                href={`tel:${tenant.phone}`} 
                                onClick={(e) => e.stopPropagation()}
                                style={{ flex: 1, textAlign: 'center', padding: 10, background: '#f3f4f6', borderRadius: 8, textDecoration: 'none', color: '#4b5563', fontSize: 14, fontWeight: 500 }}
                              >
                                📞 Call
                              </a>
                            </div>
                          </div>
                        );
                      })}
                      {filteredTenants.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#5f6368' }}>
                          No tenants found
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Desktop Table View */
                    <div style={{
                      background: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <table className="tenant-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#5f6368' 
                          }}>Tenant</th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#5f6368' 
                          }}>Property</th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#5f6368' 
                          }}>Rent</th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#5f6368' 
                          }}>Lease End</th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#5f6368' 
                          }}>Status</th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#5f6368' 
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTenants.map((tenant, index) => {
                          const isLate = tenant.status === 'current' && tenant.paymentStatus === 'late';
                          const statusBadge = tenant.status === 'current' 
                            ? (isLate ? 'Late' : 'Current')
                            : tenant.status === 'prospect' 
                            ? 'Prospect'
                            : 'Past';
                          
                          return (
                            <tr
                              key={tenant.id}
                              onClick={(e) => {
                                // Don't open modal if clicking on action icons
                                if (e.target.closest('.action-icon')) return;
                                setSelectedTenant(tenant);
                                // Load files for this tenant
                                loadFilesForRecord('tenant', tenant.id).then(files => {
                                  setTenantFiles(files);
                                });
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setQuickTagMenu({
                                  recordType: 'tenant',
                                  recordId: tenant.id,
                                  x: e.clientX,
                                  y: e.clientY
                                });
                              }}
                              style={{
                                borderBottom: index < filteredTenants.length - 1 ? '1px solid #e5e7eb' : 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                background: '#fff'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f9fafb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                              }}
                            >
                              {/* Tenant Column */}
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      background: getAvatarColorByName(tenant.name),
                                      color: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      flexShrink: 0
                                    }}
                                  >
                                    {getInitials(tenant.name)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '400', color: '#202124', marginBottom: '2px' }}>
                                      {tenant.name}
                                    </div>
                                    {tenant.email && (
                                      <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                                        {tenant.email}
                                      </div>
                                    )}
                                    {/* Tags */}
                                    {(() => {
                                      const tenantTags = getTagsForRecord('tenant', tenant.id);
                                      const maxVisible = 2;
                                      const visibleTags = tenantTags.slice(0, maxVisible);
                                      const remainingCount = tenantTags.length - maxVisible;
                                      
                                      if (tenantTags.length === 0) return null;
                                      
                                      return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', alignItems: 'center' }}>
                                          {visibleTags.map(tag => (
                                            <span
                                              key={tag.id}
                                              className={`tag-pill ${tag.color} clickable`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!selectedTagFilters.includes(tag.id)) {
                                                  setSelectedTagFilters([...selectedTagFilters, tag.id]);
                                                }
                                              }}
                                              title={`Filter by ${tag.name}`}
                                            >
                                              {tag.name}
                                            </span>
                                          ))}
                                          {remainingCount > 0 && (
                                            <span
                                              className="tag-pill gray clickable"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Show all tags for this tenant
                                                const allTagIds = tenantTags.map(t => t.id);
                                                setSelectedTagFilters([...new Set([...selectedTagFilters, ...allTagIds])]);
                                              }}
                                              title={`${remainingCount} more tag${remainingCount > 1 ? 's' : ''}`}
                                              style={{ fontSize: '10px', padding: '2px 6px' }}
                                            >
                                              +{remainingCount} more
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Property Column */}
                              <td style={{ padding: '12px 16px' }}>
                                <div>
                                  {(() => {
                                    if (!tenant.property) {
                                      return <div style={{ fontSize: '14px', color: '#202124' }}>N/A</div>;
                                    }
                                    
                                    const unit = extractUnitNumber(tenant.property);
                                    // Extract property name by removing unit information
                                    let propertyName = tenant.property;
                                    const unitPatterns = [
                                      /\s*Unit\s+[A-Z0-9]+/i,
                                      /\s*Apt\s+[A-Z0-9]+/i,
                                      /\s*Apartment\s+[A-Z0-9]+/i,
                                      /\s*#\s*[A-Z0-9]+/i
                                    ];
                                    
                                    for (const pattern of unitPatterns) {
                                      propertyName = propertyName.replace(pattern, '').trim();
                                    }
                                    
                                    const hasUnit = unit && unit !== tenant.property && unit !== 'N/A';
                                    
                                    return (
                                      <>
                                        <div style={{ fontSize: '14px', color: '#202124', marginBottom: hasUnit ? '2px' : '0' }}>
                                          {propertyName || 'N/A'}
                                        </div>
                                        {hasUnit && (
                                          <div style={{ fontSize: '12px', color: '#5f6368' }}>
                                            {unit.includes('Unit') || unit.includes('Apt') || unit.includes('#') ? unit : `Unit ${unit}`}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </td>
                              
                              {/* Rent Column */}
                              <td style={{ padding: '12px 16px' }}>
                                <div>
                                  <div style={{ fontSize: '14px', color: '#202124', marginBottom: '2px' }}>
                                    ${tenant.rentAmount > 0 ? tenant.rentAmount.toLocaleString() : '0'}
                                  </div>
                                  {isLate && (
                                    <div style={{ fontSize: '12px', color: '#ef4444' }}>
                                      -${tenant.rentAmount.toLocaleString()} due
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              {/* Lease End Column */}
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: '14px', color: '#202124' }}>
                                  {formatLeaseEndDate(tenant.leaseEnd, tenant.status)}
                                </div>
                              </td>
                              
                              {/* Status Column */}
                              <td style={{ padding: '12px 16px' }}>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    display: 'inline-block',
                                    background: statusBadge === 'Current' 
                                      ? '#dcfce7' 
                                      : statusBadge === 'Late' 
                                      ? '#fee2e2' 
                                      : statusBadge === 'Prospect'
                                      ? '#fef3c7'
                                      : '#f3f4f6',
                                    color: statusBadge === 'Current' 
                                      ? '#166534' 
                                      : statusBadge === 'Late' 
                                      ? '#991b1b' 
                                      : statusBadge === 'Prospect'
                                      ? '#92400e'
                                      : '#4b5563'
                                  }}
                                >
                                  {statusBadge}
                                </span>
                              </td>
                              
                              {/* Actions Column */}
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                  {tenant.email && (
                                    <a
                                      href={`mailto:${tenant.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="action-icon"
                                      style={{
                                        color: '#5f6368',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#1a73e8';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#5f6368';
                                      }}
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                      </svg>
                                    </a>
                                  )}
                                  {(() => {
                                    const phoneNumber = tenant.phone ? tenant.phone.trim() : '';
                                    const hasPhone = phoneNumber && phoneNumber.replace(/\D/g, '').length > 0;
                                    return hasPhone ? (
                                      <a
                                        href={`tel:${phoneNumber.replace(/\D/g, '')}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="action-icon"
                                        style={{
                                          color: '#5f6368',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#1a73e8';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#5f6368';
                                        }}
                                      >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                      </a>
                                    ) : null;
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredTenants.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#5f6368' }}>
                              No tenants found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'properties' && (
                <div className="content-section">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Properties</h1>
                        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Manage your property portfolio</p>
                      </div>
                      <button 
                        className="btn-primary" 
                        onClick={() => setShowAddPropertyModal(true)}
                        style={{
                          background: '#1a73e8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '10px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        + Add Property
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {(() => {
                      const totalProperties = properties.length;
                      const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
                      const totalOccupied = properties.reduce((sum, p) => sum + (p.occupied || 0), 0);
                      const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;
                      
                      return (
                        <>
                          {/* Total Properties Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#e8f0fe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '4px' }}>Total Properties</div>
                              <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124' }}>{totalProperties}</div>
                            </div>
                          </div>

                          {/* Total Units Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#e8f0fe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '4px' }}>Total Units</div>
                              <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124', marginBottom: '4px' }}>{totalUnits}</div>
                              <div style={{ fontSize: '14px', color: '#5f6368' }}>{totalOccupied} occupied</div>
                            </div>
                          </div>

                          {/* Occupancy Rate Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="#1a73e8"
                                  strokeWidth="4"
                                  strokeDasharray={`${2 * Math.PI * 28}`}
                                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - occupancyRate / 100)}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '16px',
                                fontWeight: '500',
                                color: '#202124'
                              }}>
                                {occupancyRate}%
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '4px' }}>Occupancy Rate</div>
                              <div style={{ fontSize: '20px', fontWeight: '400', color: '#202124' }}>{occupancyRate}%</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Search and Export Bar */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '24px',
                    alignItems: 'center'
                  }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={propertySearchQuery}
                        onChange={(e) => setPropertySearchQuery(e.target.value)}
                        aria-label="Search properties"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 16px 0 40px',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: '#202124'
                        }}
                      />
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#5f6368" 
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    {/* Tag Filter for Properties */}
                    {tags.length > 0 && (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => {
                              const dropdown = document.getElementById('property-tag-filter-dropdown');
                              if (dropdown) {
                                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                              }
                            }}
                            style={{
                              height: '40px',
                              padding: '0 16px',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#202124',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                              <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            Filter by Tag
                            {selectedTagFilters.length > 0 && (
                              <span style={{
                                background: '#1a73e8',
                                color: '#fff',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                {selectedTagFilters.length}
                              </span>
                            )}
                          </button>
                          <div
                            id="property-tag-filter-dropdown"
                            style={{
                              display: 'none',
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              marginTop: '4px',
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              zIndex: 1000,
                              minWidth: '200px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              padding: '8px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tags.map(tag => {
                              const isSelected = selectedTagFilters.includes(tag.id);
                              const colorMap = {
                                blue: '#1a73e8',
                                green: '#10b981',
                                yellow: '#fbbf24',
                                orange: '#f97316',
                                red: '#ef4444',
                                purple: '#a855f7',
                                teal: '#14b8a6',
                                gray: '#6b7280'
                              };
                              return (
                                <label
                                  key={tag.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTagFilters([...selectedTagFilters, tag.id]);
                                      } else {
                                        setSelectedTagFilters(selectedTagFilters.filter(id => id !== tag.id));
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      background: colorMap[tag.color] || colorMap.blue,
                                      flexShrink: 0
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#202124' }}>{tag.name}</span>
                                </label>
                              );
                            })}
                            {selectedTagFilters.length > 0 && (
                              <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb', marginTop: '4px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedTagFilters([]);
                                    document.getElementById('property-tag-filter-dropdown').style.display = 'none';
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px',
                                    background: 'none',
                                    border: '1px solid #dadce0',
                                    borderRadius: '4px',
                                    color: '#5f6368',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Clear filters
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedTagFilters.length > 0 && (
                          <button
                            onClick={() => setSelectedTagFilters([])}
                            style={{
                              marginLeft: '8px',
                              background: 'none',
                              border: 'none',
                              color: '#5f6368',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Clear tag filters"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        // Export properties to CSV
                        const csvData = properties.map(p => ({
                          Address: p.address,
                          Type: p.type || '',
                          Units: p.units,
                          Occupied: p.occupied,
                          'Monthly Revenue': p.monthlyRevenue,
                          'Owner Name': p.ownerName || '',
                          'Owner Email': p.ownerEmail || ''
                        }));
                        const csv = Papa.unparse(csvData);
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'properties.csv';
                        a.click();
                      }}
                      style={{
                        height: '40px',
                        padding: '0 16px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        background: '#fff',
                        color: '#202124',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Export
                    </button>
                  </div>

                  {/* Property Cards Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px'
                  }}>
                    {properties
                      .filter(property => {
                        if (!propertySearchQuery || !propertySearchQuery.trim()) return true;
                        const search = propertySearchQuery.toLowerCase();
                        return (property.address && property.address.toLowerCase().includes(search)) ||
                               (property.type && property.type.toLowerCase().includes(search));
                      })
                      .map(property => {
                        const available = (property.units || 0) - (property.occupied || 0);
                        const isFull = available === 0;
                        const occupancyPercentage = property.units > 0 
                          ? Math.round(((property.occupied || 0) / property.units) * 100) 
                          : 0;
                        
                        return (
                          <div
                            key={property.id}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setQuickTagMenu({
                                recordType: 'property',
                                recordId: property.id,
                                x: e.clientX,
                                y: e.clientY
                              });
                            }}
                            style={{
                              background: '#fff',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'box-shadow 0.2s, transform 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {/* Property Photo */}
                            <div
                              onClick={() => setSelectedProperty(property)}
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: '180px',
                                overflow: 'hidden',
                                background: property.photoUrl 
                                  ? 'transparent' 
                                  : 'linear-gradient(135deg, #e0f2fe 0%, #1a73e8 100%)',
                                cursor: 'pointer'
                              }}
                            >
                              {property.photoUrl ? (
                                <img
                                  src={property.photoUrl}
                                  alt={property.address}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" opacity={0.8}>
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                  </svg>
                                </div>
                              )}
                              
                              {/* Availability Badge */}
                              <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                background: isFull ? '#fee2e2' : '#dcfce7',
                                color: isFull ? '#991b1b' : '#166534'
                              }}>
                                {isFull ? 'Full' : `${available} Available`}
                              </div>
                            </div>

                            {/* Card Content */}
                            <div style={{ padding: '16px' }}>
                              {/* Property Name */}
                              <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#202124',
                                margin: '0 0 8px 0'
                              }}>
                                {property.address}
                              </h3>

                              {/* Address with Location Icon */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '8px',
                                fontSize: '14px',
                                color: '#5f6368'
                              }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>{property.type || 'Property'}</span>
                              </div>

                              {/* Tags */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                                {getTagsForRecord('property', property.id).map(tag => (
                                  <span
                                    key={tag.id}
                                    className={`tag-pill ${tag.color} clickable`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Filter by this tag
                                      if (!selectedTagFilters.includes(tag.id)) {
                                        setSelectedTagFilters([...selectedTagFilters, tag.id]);
                                        setActiveTab('properties');
                                      }
                                    }}
                                    title={`Filter by ${tag.name}`}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>

                              {/* Stats Row */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '16px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid #e5e7eb'
                              }}>
                                <div>
                                  <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '2px' }}>Units</div>
                                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                                    {property.occupied || 0}/{property.units || 0}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '2px' }}>Revenue</div>
                                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                                    ${(property.monthlyRevenue || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* View Details Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProperty(property);
                                  // Load files for this property
                                  loadFilesForRecord('property', property.id).then(files => {
                                    setPropertyFiles(files);
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#202124',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s, border-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f8f9fa';
                                  e.currentTarget.style.borderColor = '#1a73e8';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fff';
                                  e.currentTarget.style.borderColor = '#dadce0';
                                }}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {properties.filter(property => {
                      if (!propertySearchQuery || !propertySearchQuery.trim()) return true;
                      const search = propertySearchQuery.toLowerCase();
                      return (property.address && property.address.toLowerCase().includes(search)) ||
                             (property.type && property.type.toLowerCase().includes(search));
                    }).length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: '#5f6368'
                      }}>
                        No properties found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="content-section">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#202124', margin: '0 0 8px 0' }}>Maintenance</h1>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Track and manage maintenance requests</p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => setShowAddMaintenanceModal(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        + New Request
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {(() => {
                      const pending = maintenanceRequests.filter(r => {
                        const status = (r.status || 'open').toLowerCase();
                        return status === 'open';
                      }).length;
                      
                      const inProgress = maintenanceRequests.filter(r => {
                        const status = (r.status || '').toLowerCase();
                        return status === 'in_progress' || status === 'in progress';
                      }).length;
                      
                      const completed = maintenanceRequests.filter(r => {
                        const status = (r.status || '').toLowerCase();
                        return status === 'closed' || status === 'completed';
                      }).length;
                      
                      return (
                        <>
                          {/* Pending Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#fff7ed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Pending</div>
                              <div style={{ fontSize: '32px', fontWeight: '600', color: '#111827' }}>{pending}</div>
                            </div>
                          </div>

                          {/* In Progress Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#e8f0fe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>In Progress</div>
                              <div style={{ fontSize: '32px', fontWeight: '600', color: '#111827' }}>{inProgress}</div>
                            </div>
                          </div>

                          {/* Completed Card */}
                          <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#dcfce7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Completed</div>
                              <div style={{ fontSize: '32px', fontWeight: '600', color: '#111827' }}>{completed}</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Search and Filter Bar */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '16px',
                    alignItems: 'center'
                  }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                      <input
                        type="text"
                        placeholder="Search requests..."
                        value={maintenanceSearchQuery}
                        onChange={(e) => setMaintenanceSearchQuery(e.target.value)}
                        aria-label="Search maintenance requests"
                        className="form-input"
                        style={{
                          paddingLeft: '40px'
                        }}
                      />
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#6b7280" 
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      Filter
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  <div style={{
                    display: 'flex',
                    gap: '0',
                    borderBottom: '1px solid #e5e7eb',
                    marginBottom: '24px'
                  }}>
                    {['all', 'pending', 'active', 'completed'].map(tab => {
                      const isActive = maintenanceFilterTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setMaintenanceFilterTab(tab)}
                          style={{
                            padding: '12px 24px',
                            border: 'none',
                            background: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: isActive ? '#1a73e8' : '#6b7280',
                            cursor: 'pointer',
                            borderBottom: isActive ? '2px solid #1a73e8' : '2px solid transparent',
                            marginBottom: '-1px',
                            textTransform: 'capitalize',
                            transition: 'color 0.15s'
                          }}
                        >
                          {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : tab === 'active' ? 'Active' : 'Completed'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Request Cards */}
                  <div>
                    {maintenanceRequests
                      .filter(request => {
                        // Status filter
                        const status = (request.status || 'open').toLowerCase();
                        let matchesStatus = true;
                        if (maintenanceFilterTab === 'pending') {
                          matchesStatus = status === 'open';
                        } else if (maintenanceFilterTab === 'active') {
                          matchesStatus = status === 'in_progress' || status === 'in progress';
                        } else if (maintenanceFilterTab === 'completed') {
                          matchesStatus = status === 'closed' || status === 'completed';
                        }
                        
                        // Search filter
                        const matchesSearch = !maintenanceSearchQuery || !maintenanceSearchQuery.trim() ||
                          (request.issue && request.issue.toLowerCase().includes(maintenanceSearchQuery.toLowerCase())) ||
                          (request.description && request.description.toLowerCase().includes(maintenanceSearchQuery.toLowerCase())) ||
                          (request.property && request.property.toLowerCase().includes(maintenanceSearchQuery.toLowerCase())) ||
                          (request.tenantName && request.tenantName.toLowerCase().includes(maintenanceSearchQuery.toLowerCase()));
                        
                        // Tag filter
                        let matchesTags = true;
                        if (selectedTagFilters.length > 0) {
                          const requestTagIds = getTagsForRecord('maintenance', request.id).map(tag => tag.id);
                          matchesTags = selectedTagFilters.every(filterTagId => requestTagIds.includes(filterTagId));
                        }
                        
                        return matchesStatus && matchesSearch && matchesTags;
                      })
                      .map(request => {
                        const priority = (request.priority || 'medium').toLowerCase();
                        const status = (request.status || 'open').toLowerCase();
                        const statusDisplay = getMaintenanceStatusDisplay(request.status);
                        const unit = extractUnitNumber(request.property);
                        const propertyName = request.property ? request.property.replace(/\s*(?:Unit|Apt|Apartment|#)\s*[A-Z0-9]+/i, '').trim() : request.property;
                        
                        // Map priority to CSS class
                        const priorityClass = priority === 'low' ? 'priority-low' :
                                             priority === 'medium' ? 'priority-medium' :
                                             priority === 'high' ? 'priority-high' :
                                             priority === 'urgent' ? 'priority-urgent' : 'priority-medium';
                        
                        // Map status to CSS class
                        let statusClass = 'maintenance-status-pending';
                        if (status === 'in_progress' || status === 'in progress') {
                          statusClass = 'maintenance-status-active';
                        } else if (status === 'closed' || status === 'completed') {
                          statusClass = 'maintenance-status-completed';
                        }
                        
                        return (
                          <div
                            key={request.id}
                            className="maintenance-card"
                            onClick={() => {
                              setSelectedMaintenanceRequest(request);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setQuickTagMenu({
                                recordType: 'maintenance',
                                recordId: request.id,
                                x: e.clientX,
                                y: e.clientY
                              });
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              {/* Card Header: Title + Priority Badge */}
                              <div className="maintenance-card-header">
                                <h3 className="maintenance-card-title">
                                  {request.issue}
                                </h3>
                                <span className={`priority-badge ${priorityClass}`}>
                                  {(request.priority || 'medium').toUpperCase()}
                                </span>
                                {/* Tags */}
                                {getTagsForRecord('maintenance', request.id).map(tag => (
                                  <span
                                    key={tag.id}
                                    className={`tag-pill ${tag.color} clickable`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!selectedTagFilters.includes(tag.id)) {
                                        setSelectedTagFilters([...selectedTagFilters, tag.id]);
                                        setActiveTab('maintenance');
                                      }
                                    }}
                                    title={`Filter by ${tag.name}`}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>

                              {/* Description */}
                              {request.description && (
                                <p className="maintenance-card-description">
                                  {request.description}
                                </p>
                              )}

                              {/* Meta Information: 4 columns */}
                              <div className="maintenance-card-meta">
                                <div className="maintenance-card-meta-item">
                                  <span className="maintenance-card-meta-label">Property</span>
                                  <span className="maintenance-card-meta-value">{propertyName || 'N/A'}</span>
                                </div>
                                <div className="maintenance-card-meta-item">
                                  <span className="maintenance-card-meta-label">Unit</span>
                                  <span className="maintenance-card-meta-value">{unit && unit !== request.property ? unit : 'N/A'}</span>
                                </div>
                                <div className="maintenance-card-meta-item">
                                  <span className="maintenance-card-meta-label">Tenant</span>
                                  <span className="maintenance-card-meta-value">{request.tenantName || 'N/A'}</span>
                                </div>
                                <div className="maintenance-card-meta-item">
                                  <span className="maintenance-card-meta-label">Created</span>
                                  <span className="maintenance-card-meta-value">
                                    {request.date ? new Date(request.date).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* Assigned to */}
                              {request.assignedTo && (
                                <div style={{
                                  fontSize: '13px',
                                  color: '#6b7280',
                                  marginTop: '12px'
                                }}>
                                  Assigned to: <strong>{request.assignedTo}</strong>
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                              <span className={`maintenance-status-badge ${statusClass}`}>
                                {statusDisplay}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {maintenanceRequests.filter(request => {
                      const status = (request.status || 'open').toLowerCase();
                      let matchesStatus = true;
                      if (maintenanceFilterTab === 'pending') {
                        matchesStatus = status === 'open';
                      } else if (maintenanceFilterTab === 'active') {
                        matchesStatus = status === 'in_progress' || status === 'in progress';
                      } else if (maintenanceFilterTab === 'completed') {
                        matchesStatus = status === 'closed' || status === 'completed';
                      }
                      const matchesSearch = !maintenanceSearchQuery || !maintenanceSearchQuery.trim() ||
                        (request.issue && request.issue.toLowerCase().includes(maintenanceSearchQuery.toLowerCase())) ||
                        (request.description && request.description.toLowerCase().includes(maintenanceSearchQuery.toLowerCase())) ||
                        (request.property && request.property.toLowerCase().includes(maintenanceSearchQuery.toLowerCase())) ||
                        (request.tenantName && request.tenantName.toLowerCase().includes(maintenanceSearchQuery.toLowerCase()));
                      return matchesStatus && matchesSearch;
                    }).length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#5f6368'
                      }}>
                        No maintenance requests found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'owners' && (
                <div className="content-section">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Owners</h1>
                        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Manage property owners and statements</p>
                      </div>
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          console.log('Add Owner clicked');
                          setNewOwner({ name: '', email: '', phone: '', address: '', managementFeePercent: 10, portalEnabled: false });
                          setShowAddOwnerModal(true);
                        }}
                        style={{
                          background: '#1a73e8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '10px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        + Add Owner
                      </button>
                    </div>
                  </div>

                  {/* Owners Table */}
                  <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #dadce0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#5f6368' }}>Owner Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#5f6368' }}>Email</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368' }}>Properties</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#5f6368' }}>Portal Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#5f6368' }}>Last Login</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {owners.map(owner => {
                          const ownerProperties = properties.filter(p => p.ownerId === owner.id);
                          return (
                            <tr
                              key={owner.id}
                              style={{
                                borderBottom: '1px solid #e5e7eb',
                                cursor: 'pointer'
                              }}
                              onClick={() => setSelectedOwner(owner)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f9fafb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                              }}
                            >
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>{owner.name}</div>
                                {owner.phone && (
                                  <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>{owner.phone}</div>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#202124' }}>{owner.email}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#202124' }}>{ownerProperties.length}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontWeight: '500',
                                    display: 'inline-block',
                                    background: owner.portalEnabled ? '#dcfce7' : '#f3f4f6',
                                    color: owner.portalEnabled ? '#166534' : '#6b7280'
                                  }}
                                >
                                  {owner.portalEnabled ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#5f6368' }}>
                                {owner.lastLogin ? new Date(owner.lastLogin).toLocaleDateString() : 'Never'}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="btn-secondary"
                                    onClick={() => {
                                      setSelectedOwner(owner);
                                      setShowEditOwnerModal(true);
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      border: '1px solid #dadce0',
                                      borderRadius: '4px',
                                      background: '#fff',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View
                                  </button>
                                  {owner.portalEnabled && (
                                    <button
                                      className="btn-secondary"
                                      onClick={() => {
                                        const link = getOwnerPortalLink(owner);
                                        navigator.clipboard.writeText(link);
                                        alert('Portal link copied to clipboard!');
                                      }}
                                      style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        border: '1px solid #dadce0',
                                        borderRadius: '4px',
                                        background: '#fff',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Copy Link
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {owners.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#5f6368' }}>
                              No owners found. Click '+ Add Owner' to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (() => {
                const stats = getReportsStats();
                const totalUnits = properties.reduce((sum, p) => sum + (p.units || 1), 0);
                const totalOccupied = properties.reduce((sum, p) => sum + (p.occupied || 0), 0);
                const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 85;
                const profitMargin = stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0;
                const expensesPercent = stats.totalRevenue > 0 ? Math.round((stats.totalExpenses / stats.totalRevenue) * 100) : 0;
                
                // Calculate property performance data
                const propertyPerformanceData = properties.map(property => {
                  const propertyTenants = tenants.filter(t => t.status === 'current' && t.property && property.address && t.property.includes(property.address));
                  const propertyRevenue = propertyTenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0) || property.monthlyRevenue || 0;
                  const propertyUnits = property.units || 1;
                  const propertyOccupied = property.occupied || propertyTenants.length;
                  
                  return {
                    ...property,
                    propertyRevenue,
                    propertyUnits,
                    propertyOccupied
                  };
                });
                
                // Get revenue by property data for pie chart
                const revenueByPropertyData = getRevenueByPropertyData();
                const pieColors = ['#1a73e8', '#0891b2', '#10b981', '#f97316'];
                const totalRevenueForPie = revenueByPropertyData.reduce((sum, item) => sum + item.value, 0);
                
                // Helper function to get short property name
                const getShortPropertyName = (name) => {
                  if (!name) return 'Unknown';
                  // Extract first part before comma or take first 15 chars
                  const shortName = name.split(',')[0].trim();
                  return shortName.length > 15 ? shortName.substring(0, 15) + '...' : shortName;
                };
                
                return (
                  <div className="content-section" style={{padding: '24px'}}>
                    {/* Header */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px'}}>
                      <div>
                        <h1 style={{margin: 0, fontSize: '32px', fontWeight: '400', color: '#202124'}}>Reports</h1>
                        <p style={{margin: '8px 0 0', fontSize: '14px', color: '#5f6368'}}>Financial insights and analytics</p>
                      </div>
                      <button className="btn-primary" onClick={() => exportRentRollToCSV()} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export Reports
                      </button>
                    </div>
                    
                    {/* Stats Cards */}
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px'}}>
                      {/* Total Revenue */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative'}}>
                        <div style={{position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                        </div>
                        <p style={{margin: 0, fontSize: '14px', color: '#5f6368', marginBottom: '12px'}}>Total Revenue</p>
                        <p style={{margin: 0, fontSize: '32px', fontWeight: '500', color: '#202124', marginBottom: '8px'}}>
                          {'$' + stats.totalRevenue.toLocaleString()}
                        </p>
                        <p style={{margin: 0, fontSize: '12px', color: '#10b981'}}>+12.5% from last period</p>
                      </div>
                      
                      {/* Total Expenses */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative'}}>
                        <div style={{position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <polyline points="22 6 13.5 14.5 8.5 9.5 2 16"></polyline>
                            <polyline points="16 6 22 6 22 12"></polyline>
                          </svg>
                        </div>
                        <p style={{margin: 0, fontSize: '14px', color: '#5f6368', marginBottom: '12px'}}>Total Expenses</p>
                        <p style={{margin: 0, fontSize: '32px', fontWeight: '500', color: '#202124', marginBottom: '8px'}}>
                          {'$' + stats.totalExpenses.toLocaleString()}
                        </p>
                        <p style={{margin: 0, fontSize: '12px', color: '#6b7280'}}>{expensesPercent}% of revenue</p>
                      </div>
                      
                      {/* Net Profit */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative'}}>
                        <div style={{position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                        </div>
                        <p style={{margin: 0, fontSize: '14px', color: '#5f6368', marginBottom: '12px'}}>Net Profit</p>
                        <p style={{margin: 0, fontSize: '32px', fontWeight: '500', color: '#202124', marginBottom: '8px'}}>
                          {'$' + stats.netProfit.toLocaleString()}
                        </p>
                        <p style={{margin: 0, fontSize: '12px', color: '#10b981'}}>{profitMargin}% margin</p>
                      </div>
                      
                      {/* Avg. Occupancy */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative'}}>
                        <div style={{position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <p style={{margin: 0, fontSize: '14px', color: '#5f6368', marginBottom: '12px'}}>Avg. Occupancy</p>
                        <p style={{margin: 0, fontSize: '32px', fontWeight: '500', color: '#202124', marginBottom: '8px'}}>
                          {occupancyRate}%
                        </p>
                        <p style={{margin: 0, fontSize: '12px', color: '#6b7280'}}>Last 6 months</p>
                      </div>
                    </div>
                    
                    {/* Charts Section */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
                      {/* Revenue vs Expenses Chart */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <h3 style={{margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124'}}>Revenue vs Expenses</h3>
                        <p style={{margin: '0 0 24px', fontSize: '14px', color: '#5f6368'}}>Monthly comparison</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getRevenueVsExpensesData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis 
                              stroke="#6b7280" 
                              tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip 
                              formatter={(value, name) => [formatCurrency(value), name]}
                            />
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            <Bar dataKey="revenue" fill="#1a73e8" name="Revenue" />
                            <Bar dataKey="expenses" fill="#f97316" name="Expenses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Occupancy Trend Chart */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <h3 style={{margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124'}}>Occupancy Trend</h3>
                        <p style={{margin: '0 0 24px', fontSize: '14px', color: '#5f6368'}}>6-month trend</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={getOccupancyTrendData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" domain={[40, 60]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Occupancy %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Bottom Section */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                      {/* Revenue by Property Pie Chart */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <h3 style={{margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124'}}>Revenue by Property</h3>
                        <p style={{margin: '0 0 24px', fontSize: '14px', color: '#5f6368'}}>Distribution</p>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={revenueByPropertyData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {revenueByPropertyData.map((entry, index) => {
                                const color = pieColors[index % pieColors.length];
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
                          {revenueByPropertyData.map((entry, index) => {
                            const percent = totalRevenueForPie > 0 ? ((entry.value / totalRevenueForPie) * 100).toFixed(0) : 0;
                            return (
                              <div key={index} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <div style={{width: '12px', height: '12px', borderRadius: '50%', background: pieColors[index % pieColors.length], flexShrink: 0}}></div>
                                <span style={{fontSize: '14px', color: '#202124'}}>{getShortPropertyName(entry.name)}</span>
                                <span style={{fontSize: '14px', color: '#5f6368', marginLeft: 'auto'}}>{percent}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Property Performance List */}
                      <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <h3 style={{margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124'}}>Property Performance</h3>
                        <p style={{margin: '0 0 24px', fontSize: '14px', color: '#5f6368'}}>Key metrics by property</p>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                          {propertyPerformanceData.map((property, index) => {
                            // Match property to pie chart color by finding matching property name in revenue data
                            const propertyName = property.name || property.address || '';
                            const matchingPieIndex = revenueByPropertyData.findIndex(item => {
                              const itemName = item.name.toLowerCase();
                              const propName = propertyName.toLowerCase();
                              return itemName.includes(propName) || propName.includes(itemName) || 
                                     itemName === propName || 
                                     (item.name && property.address && item.name.includes(property.address)) ||
                                     (property.address && item.name && property.address.includes(item.name));
                            });
                            // Use matching index if found, otherwise use property index
                            const colorIndex = matchingPieIndex >= 0 ? matchingPieIndex : index;
                            const dotColor = pieColors[colorIndex % pieColors.length];
                            return (
                              <div key={property.id} style={{display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: index < propertyPerformanceData.length - 1 ? '1px solid #e5e7eb' : 'none'}}>
                                <div style={{width: '12px', height: '12px', borderRadius: '50%', background: dotColor, flexShrink: 0}}></div>
                                <div style={{flex: 1}}>
                                  <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#202124'}}>{property.name || property.address}</p>
                                  <p style={{margin: '4px 0 0', fontSize: '12px', color: '#5f6368'}}>{property.propertyOccupied}/{property.propertyUnits} units occupied</p>
                                </div>
                                <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#202124'}}>{formatCurrency(property.propertyRevenue)}</p>
                              </div>
                            );
                          })}
                          {properties.length === 0 && (
                            <p style={{color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '24px'}}>No properties yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tag Analysis Section */}
                    <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px'}}>
                        <div>
                          <h3 style={{margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124'}}>Tag Analysis</h3>
                          <p style={{margin: 0, fontSize: '14px', color: '#5f6368'}}>Track patterns across your portfolio</p>
                        </div>
                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                          <select
                            value={tagAnalysisDateRange}
                            onChange={(e) => setTagAnalysisDateRange(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#202124',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="all">All time</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="12months">Last 12 months</option>
                          </select>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              const tagAnalysisData = getTagAnalysisData(tagAnalysisDateRange);
                              const csvData = [];
                              
                              // Header
                              csvData.push(['Record Type', 'Record Name', 'Tag', 'Date Added']);
                              
                              // Get all record tags within date range
                              const now = new Date();
                              let startDate = null;
                              if (tagAnalysisDateRange === '30') {
                                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                              } else if (tagAnalysisDateRange === '90') {
                                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                              } else if (tagAnalysisDateRange === '12months') {
                                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                              }
                              
                              recordTags.forEach(rt => {
                                if (startDate) {
                                  const addedDate = new Date(rt.added_at);
                                  if (addedDate < startDate) return;
                                }
                                
                                const tag = tags.find(t => t.id === rt.tag_id);
                                if (!tag) return;
                                
                                let recordName = 'Unknown';
                                if (rt.record_type === 'tenant') {
                                  const tenant = tenants.find(t => t.id === rt.record_id);
                                  recordName = tenant ? tenant.name : 'Unknown Tenant';
                                } else if (rt.record_type === 'property') {
                                  const property = properties.find(p => p.id === rt.record_id);
                                  recordName = property ? property.address : 'Unknown Property';
                                } else if (rt.record_type === 'maintenance') {
                                  const maintenance = maintenanceRequests.find(m => m.id === rt.record_id);
                                  recordName = maintenance ? maintenance.issue : 'Unknown Request';
                                }
                                
                                csvData.push([
                                  rt.record_type.charAt(0).toUpperCase() + rt.record_type.slice(1),
                                  recordName,
                                  tag.name,
                                  new Date(rt.added_at).toLocaleDateString()
                                ]);
                              });
                              
                              const csv = Papa.unparse(csvData);
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `tag_report_${tagAnalysisDateRange}_${new Date().toISOString().split('T')[0]}.csv`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                            style={{
                              padding: '8px 16px',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#202124',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export Tag Report
                          </button>
                        </div>
                      </div>

                      {/* Tag Summary Table */}
                      <div style={{marginBottom: '24px'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                          <thead>
                            <tr style={{background: '#f8f9fa', borderBottom: '1px solid #dadce0'}}>
                              <th style={{padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#5f6368'}}>Tag</th>
                              <th style={{padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368'}}>Records</th>
                              <th style={{padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368'}}>Tenants</th>
                              <th style={{padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368'}}>Properties</th>
                              <th style={{padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368'}}>Maintenance</th>
                              <th style={{padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#5f6368'}}>Total Rent Affected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getTagAnalysisData(tagAnalysisDateRange).map((tagStat, index) => {
                              const colorMap = {
                                blue: '#1a73e8',
                                green: '#10b981',
                                yellow: '#fbbf24',
                                orange: '#f97316',
                                red: '#ef4444',
                                purple: '#a855f7',
                                teal: '#14b8a6',
                                gray: '#6b7280'
                              };
                              const isExpanded = expandedTagRow === tagStat.tag.id;
                              const tagRecords = recordTags.filter(rt => rt.tag_id === tagStat.tag.id);
                              
                              return (
                                <React.Fragment key={tagStat.tag.id}>
                                  <tr
                                    style={{
                                      borderBottom: '1px solid #e5e7eb',
                                      cursor: 'pointer',
                                      background: isExpanded ? '#f8f9fa' : '#fff'
                                    }}
                                    onClick={() => setExpandedTagRow(isExpanded ? null : tagStat.tag.id)}
                                    onMouseEnter={(e) => {
                                      if (!isExpanded) e.currentTarget.style.background = '#f9fafb';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isExpanded) e.currentTarget.style.background = '#fff';
                                    }}
                                  >
                                    <td style={{padding: '12px'}}>
                                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <div
                                          style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: colorMap[tagStat.tag.color] || colorMap.blue,
                                            flexShrink: 0
                                          }}
                                        />
                                        <span style={{fontSize: '14px', color: '#202124', fontWeight: '500'}}>{tagStat.tag.name}</span>
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          style={{
                                            marginLeft: '4px',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            color: '#5f6368'
                                          }}
                                        >
                                          <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                      </div>
                                    </td>
                                    <td style={{padding: '12px', textAlign: 'right', fontSize: '14px', color: '#202124'}}>{tagStat.totalRecords}</td>
                                    <td style={{padding: '12px', textAlign: 'right', fontSize: '14px', color: '#202124'}}>{tagStat.tenants}</td>
                                    <td style={{padding: '12px', textAlign: 'right', fontSize: '14px', color: '#202124'}}>{tagStat.properties}</td>
                                    <td style={{padding: '12px', textAlign: 'right', fontSize: '14px', color: '#202124'}}>{tagStat.maintenance}</td>
                                    <td style={{padding: '12px', textAlign: 'right', fontSize: '14px', color: '#202124', fontWeight: '500'}}>
                                      {tagStat.totalRent > 0 ? formatCurrency(tagStat.totalRent) : '-'}
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan="6" style={{padding: '16px', background: '#f8f9fa', borderBottom: '1px solid #e5e7eb'}}>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                          {tagRecords.map(rt => {
                                            let recordName = 'Unknown';
                                            let recordLink = null;
                                            
                                            if (rt.record_type === 'tenant') {
                                              const tenant = tenants.find(t => t.id === rt.record_id);
                                              if (tenant) {
                                                recordName = tenant.name;
                                                recordLink = () => {
                                                  setSelectedTenant(tenant);
                                                  setActiveTab('tenants');
                                                };
                                              }
                                            } else if (rt.record_type === 'property') {
                                              const property = properties.find(p => p.id === rt.record_id);
                                              if (property) {
                                                recordName = property.address;
                                                recordLink = () => {
                                                  setSelectedProperty(property);
                                                  setActiveTab('properties');
                                                };
                                              }
                                            } else if (rt.record_type === 'maintenance') {
                                              const maintenance = maintenanceRequests.find(m => m.id === rt.record_id);
                                              if (maintenance) {
                                                recordName = maintenance.issue;
                                                recordLink = () => {
                                                  setSelectedMaintenanceRequest(maintenance);
                                                  setActiveTab('maintenance');
                                                };
                                              }
                                            }
                                            
                                            return (
                                              <div
                                                key={rt.id}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '12px',
                                                  padding: '8px',
                                                  background: '#fff',
                                                  borderRadius: '4px',
                                                  cursor: recordLink ? 'pointer' : 'default'
                                                }}
                                                onClick={recordLink}
                                                onMouseEnter={(e) => {
                                                  if (recordLink) e.currentTarget.style.background = '#f0f0f0';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (recordLink) e.currentTarget.style.background = '#fff';
                                                }}
                                              >
                                                <span style={{
                                                  fontSize: '12px',
                                                  padding: '2px 8px',
                                                  borderRadius: '4px',
                                                  background: rt.record_type === 'tenant' ? '#e8f0fe' : rt.record_type === 'property' ? '#e6f4ea' : '#fef3c7',
                                                  color: rt.record_type === 'tenant' ? '#1a73e8' : rt.record_type === 'property' ? '#166534' : '#92400e',
                                                  fontWeight: '500',
                                                  textTransform: 'capitalize'
                                                }}>
                                                  {rt.record_type}
                                                </span>
                                                <span style={{fontSize: '14px', color: '#202124', flex: 1}}>{recordName}</span>
                                                <span style={{fontSize: '12px', color: '#5f6368'}}>
                                                  {new Date(rt.added_at).toLocaleDateString()}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            {getTagAnalysisData(tagAnalysisDateRange).length === 0 && (
                              <tr>
                                <td colSpan="6" style={{padding: '40px', textAlign: 'center', color: '#5f6368'}}>
                                  No tags found for the selected date range
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Tag Trend Chart */}
                      <div style={{marginTop: '32px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                          <div>
                            <h4 style={{margin: '0 0 4px', fontSize: '16px', fontWeight: '500', color: '#202124'}}>Tag Trend</h4>
                            <p style={{margin: 0, fontSize: '14px', color: '#5f6368'}}>Track tag frequency over time</p>
                          </div>
                          <select
                            value={selectedTagForTrend || ''}
                            onChange={(e) => setSelectedTagForTrend(e.target.value || null)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#202124',
                              fontSize: '14px',
                              cursor: 'pointer',
                              minWidth: '200px'
                            }}
                          >
                            <option value="">Select a tag...</option>
                            {tags.map(tag => (
                              <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                          </select>
                        </div>
                        {selectedTagForTrend && (() => {
                          const trendData = getTagTrendData(selectedTagForTrend, tagAnalysisDateRange);
                          return trendData.length > 0 ? (
                            <div style={{height: '300px'}}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis dataKey="month" stroke="#5f6368" />
                                  <YAxis stroke="#5f6368" />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={2} dot={{ fill: '#1a73e8', r: 4 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div style={{padding: '40px', textAlign: 'center', color: '#5f6368', background: '#f8f9fa', borderRadius: '8px'}}>
                              No data available for this tag in the selected date range
                            </div>
                          );
                        })()}
                        {!selectedTagForTrend && (
                          <div style={{padding: '40px', textAlign: 'center', color: '#5f6368', background: '#f8f9fa', borderRadius: '8px'}}>
                            Select a tag to view its trend
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>Schedule</h1>
                      <p style={{ color: '#6b7280', margin: 0 }}>View and manage upcoming events, move-ins, and move-outs</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className='btn btn-secondary' onClick={() => setShowCalendarSync(true)}>
                        🔗 Connect Calendar
                      </button>
                      <button className='btn btn-primary' onClick={() => setShowAddEventModal(true)}>
                        + Add Event
                      </button>
                    </div>
                  </div>
                  
                  {/* Main content - two columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
                    
                    {/* Left Column - Event Lists */}
                    <div>
                      {/* Today's Events */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                          Today - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        {getTodayEvents().length > 0 ? (
                          getTodayEvents().map((event, i) => (
                            <EventCard key={i} event={event} />
                          ))
                        ) : (
                          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No events scheduled for today</p>
                        )}
                      </div>
                      
                      {/* Upcoming Move-Ins */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                          Upcoming Move-Ins
                        </h3>
                        {getUpcomingMoveIns().length > 0 ? (
                          getUpcomingMoveIns().map((event, i) => (
                            <EventCard key={i} event={event} type='move-in' />
                          ))
                        ) : (
                          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No upcoming move-ins</p>
                        )}
                      </div>
                      
                      {/* Upcoming Move-Outs */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                          Upcoming Move-Outs
                        </h3>
                        {getUpcomingMoveOuts().length > 0 ? (
                          getUpcomingMoveOuts().map((event, i) => (
                            <EventCard key={i} event={event} type='move-out' />
                          ))
                        ) : (
                          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No upcoming move-outs</p>
                        )}
                      </div>
                      
                      {/* Lease Expirations */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                          Lease Expirations (Next 90 Days)
                        </h3>
                        {getExpiringLeases().length > 0 ? (
                          getExpiringLeases().map((tenant, i) => {
                            const leaseEnd = tenant.leaseEnd || tenant.lease_end;
                            const daysUntil = Math.ceil((new Date(leaseEnd) - new Date()) / (1000 * 60 * 60 * 24));
                            const property = properties.find(p => p.id === tenant.property_id || p.address === tenant.property);
                            return (
                              <div 
                                key={i} 
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setActiveTab('tenants');
                                }}
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  padding: 12,
                                  background: daysUntil <= 30 ? '#fef2f2' : '#fffbeb',
                                  borderRadius: 8,
                                  marginBottom: 8,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = daysUntil <= 30 ? '#fee2e2' : '#fef3c7';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = daysUntil <= 30 ? '#fef2f2' : '#fffbeb';
                                }}
                              >
                                <div>
                                  <p style={{ fontWeight: 500, color: daysUntil <= 30 ? '#dc2626' : '#b45309', marginBottom: 2, margin: 0 }}>
                                    {tenant.name} - Lease Expires
                                  </p>
                                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                                    {property?.name || property?.address || tenant.property || 'Unknown'}, Unit {tenant.unit || 'N/A'}
                                  </p>
                                </div>
                                <span style={{ 
                                  fontWeight: 600, 
                                  color: daysUntil <= 30 ? '#dc2626' : '#b45309',
                                  fontSize: 14
                                }}>
                                  {daysUntil} days
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No lease expirations in the next 90 days</p>
                        )}
                      </div>
                      
                      {/* Maintenance Appointments */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                          Scheduled Maintenance
                        </h3>
                        {scheduleEvents.filter(e => e.type === 'maintenance' && new Date(e.date) >= new Date()).length > 0 ? (
                          scheduleEvents
                            .filter(e => e.type === 'maintenance' && new Date(e.date) >= new Date())
                            .slice(0, 5)
                            .map((event, i) => <EventCard key={i} event={event} type='maintenance' />)
                        ) : (
                          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No scheduled maintenance</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Column - Calendar Widget */}
                    <div>
                      {/* Mini Calendar */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <button 
                            type="button"
                            onClick={() => {
                              const newDate = new Date(calendarDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setCalendarDate(newDate);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', padding: 4 }}
                          >
                            ‹
                          </button>
                          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                            {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </h3>
                          <button 
                            type="button"
                            onClick={() => {
                              const newDate = new Date(calendarDate);
                              newDate.setMonth(newDate.getMonth() + 1);
                              setCalendarDate(newDate);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', padding: 4 }}
                          >
                            ›
                          </button>
                        </div>
                        
                        {/* Day Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8 }}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', padding: 4 }}>
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                          {generateCalendarDays(calendarDate).map((day, i) => {
                            const isToday = day?.toDateString() === new Date().toDateString();
                            const isSelected = day?.toDateString() === selectedCalendarDate?.toDateString();
                            const dayEvents = day ? getAllEventsForDate(day) : [];
                            const hasEvents = dayEvents.length > 0;
                            
                            return (
                              <div
                                key={i}
                                onClick={() => day && setSelectedCalendarDate(day)}
                                style={{
                                  aspectRatio: '1',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 8,
                                  cursor: day ? 'pointer' : 'default',
                                  background: isSelected ? '#1a73e8' : isToday ? '#e8f0fe' : 'transparent',
                                  color: isSelected ? 'white' : !day ? '#d1d5db' : '#1f2937',
                                  fontWeight: isToday || isSelected ? 600 : 400,
                                  fontSize: 14,
                                  position: 'relative'
                                }}
                              >
                                {day?.getDate()}
                                {hasEvents && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    display: 'flex',
                                    gap: 2
                                  }}>
                                    {dayEvents.slice(0, 3).map((e, j) => (
                                      <div key={j} style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: e.type === 'move-in' ? '#10b981' : 
                                                   e.type === 'move-out' ? '#ef4444' :
                                                   e.type === 'maintenance' ? '#f59e0b' : 
                                                   e.type === 'lease-expiration' ? '#f59e0b' : '#6b7280'
                                      }} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Legend */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                            <span>Move-In</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            <span>Move-Out</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                            <span>Maintenance</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280' }} />
                            <span>Other</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Selected Day Events */}
                      {selectedCalendarDate && (
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                            {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h4>
                          {getAllEventsForDate(selectedCalendarDate).length > 0 ? (
                            getAllEventsForDate(selectedCalendarDate).map((event, i) => (
                              <EventCard key={i} event={event} compact />
                            ))
                          ) : (
                            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No events on this day</p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setNewEvent({ ...newEvent, date: selectedCalendarDate.toISOString().split('T')[0] });
                              setShowAddEventModal(true);
                            }}
                            className='btn btn-text'
                            style={{ marginTop: 8, fontSize: 13 }}
                          >
                            + Add event for this day
                          </button>
                        </div>
                      )}
                      
                      {/* Calendar Integrations */}
                      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Calendar Sync</h4>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, margin: '0 0 16px' }}>
                          Connect your calendar to sync events automatically
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button 
                            type="button"
                            onClick={() => showToast('Google Calendar integration coming soon', 'info')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              background: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <span style={{ fontSize: 24 }}>📅</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>Google Calendar</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Sync with Gmail</p>
                            </div>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>Connect</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => showToast('Outlook integration coming soon', 'info')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              background: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <span style={{ fontSize: 24 }}>📆</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>Outlook Calendar</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Sync with Microsoft 365</p>
                            </div>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>Connect</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => showToast('iCal export coming soon', 'info')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              background: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <span style={{ fontSize: 24 }}>📅</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>Export iCal Feed</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Subscribe in any calendar app</p>
                            </div>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>Export</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="content-section">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Settings</h1>
                    <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Manage your account and application preferences</p>
                  </div>

                  {/* Tab Navigation */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '32px', 
                    borderBottom: '1px solid #dadce0',
                    marginBottom: '32px'
                  }}>
                    {['profile', 'notifications', 'security', 'billing', 'company', 'tags', 'integrations'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSettingsTab(tab)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '12px 0',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: settingsTab === tab ? '#1a73e8' : '#5f6368',
                          cursor: 'pointer',
                          borderBottom: settingsTab === tab ? '2px solid #1a73e8' : '2px solid transparent',
                          marginBottom: '-1px',
                          textTransform: 'capitalize'
                        }}
                      >
                        {tab === 'profile' ? 'Profile' : 
                         tab === 'notifications' ? 'Notifications' :
                         tab === 'security' ? 'Security' :
                         tab === 'billing' ? 'Billing' : 
                         tab === 'company' ? 'Company' : 'Tags'}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="settings-content">
                    {/* Profile Tab */}
                    {settingsTab === 'profile' && (
                      <>
                        {/* Personal Information Section */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Personal Information</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>First Name</label>
                              <input
                                type="text"
                                value={profileData.firstName}
                                onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter your first name"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Last Name</label>
                              <input
                                type="text"
                                value={profileData.lastName}
                                onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter your last name"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Email</label>
                              <input
                                type="email"
                                value={profileData.email || (user?.email || '')}
                                onChange={e => setProfileData({...profileData, email: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter your email"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Phone</label>
                              <input
                                type="tel"
                                value={profileData.phone}
                                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter your phone number"
                              />
                            </div>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                // Save profile data
                                alert('Profile saved successfully');
                              }}
                              style={{
                                background: '#1a73e8',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                alignSelf: 'flex-start'
                              }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>

                        {/* Profile Picture Section */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Profile Picture</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              background: '#1a73e8',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                              fontWeight: '500'
                            }}>
                              {getInitials(user?.email || 'User')}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button
                                className="btn-secondary"
                                style={{
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  padding: '8px 16px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  background: '#fff'
                                }}
                              >
                                Upload New
                              </button>
                              <button
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#1a73e8',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  padding: '8px 16px'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Notifications Tab */}
                    {settingsTab === 'notifications' && (
                      <>
                        {/* SMS Notifications Section */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 8px 0' }}>SMS Notifications</h3>
                          <p style={{ fontSize: '14px', color: '#5f6368', margin: '0 0 24px 0' }}>Configure Twilio to send SMS reminders to tenants</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Twilio Account SID</label>
                              <input
                                type="text"
                                value={twilioSettings.accountSid}
                                onChange={e => setTwilioSettings({...twilioSettings, accountSid: e.target.value})}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Twilio Auth Token</label>
                              <input
                                type="password"
                                value={twilioSettings.authToken}
                                onChange={e => setTwilioSettings({...twilioSettings, authToken: e.target.value})}
                                placeholder="Enter your Twilio Auth Token"
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Twilio Phone Number</label>
                              <input
                                type="text"
                                value={twilioSettings.phoneNumber}
                                onChange={e => setTwilioSettings({...twilioSettings, phoneNumber: e.target.value})}
                                placeholder="+1234567890"
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                              />
                            </div>
                            <button
                              className="btn-primary"
                              onClick={saveTwilioSettings}
                              disabled={twilioSettingsLoading}
                              style={{
                                background: '#1a73e8',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                alignSelf: 'flex-start',
                                opacity: twilioSettingsLoading ? 0.6 : 1
                              }}
                            >
                              {twilioSettingsLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                          </div>

                          {/* Test SMS */}
                          <div style={{ marginTop: '32px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '500', color: '#202124' }}>Test SMS</h4>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Phone Number</label>
                                <input
                                  type="tel"
                                  value={testSmsPhone}
                                  onChange={e => setTestSmsPhone(e.target.value)}
                                  placeholder="+1234567890"
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #dadce0',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    color: '#202124'
                                  }}
                                />
                              </div>
                              <button
                                className="btn-secondary"
                                onClick={sendTestSMS}
                                disabled={testSmsSending || !testSmsPhone}
                                style={{
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  padding: '10px 24px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  background: '#fff',
                                  opacity: (testSmsSending || !testSmsPhone) ? 0.6 : 1
                                }}
                              >
                                {testSmsSending ? 'Sending...' : 'Send Test SMS'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Email Notification Preferences */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Email Notification Preferences</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                              { key: 'lateRentReminders', label: 'Late Rent Reminders' },
                              { key: 'newTenantAdded', label: 'New Tenant Added' },
                              { key: 'maintenanceRequests', label: 'Maintenance Requests' },
                              { key: 'paymentReceived', label: 'Payment Received' }
                            ].map(pref => (
                              <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '14px', color: '#202124' }}>{pref.label}</label>
                                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                  <input
                                    type="checkbox"
                                    checked={emailNotifications[pref.key]}
                                    onChange={e => setEmailNotifications({...emailNotifications, [pref.key]: e.target.checked})}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                  />
                                  <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: emailNotifications[pref.key] ? '#1a73e8' : '#ccc',
                                    borderRadius: '24px',
                                    transition: '0.3s'
                                  }}>
                                    <span style={{
                                      position: 'absolute',
                                      content: '""',
                                      height: '18px',
                                      width: '18px',
                                      left: emailNotifications[pref.key] ? '22px' : '3px',
                                      bottom: '3px',
                                      backgroundColor: 'white',
                                      borderRadius: '50%',
                                      transition: '0.3s'
                                    }}></span>
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Security Tab */}
                    {settingsTab === 'security' && (
                      <>
                        {/* Change Password Section */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Change Password</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Current Password</label>
                              <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter current password"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>New Password</label>
                              <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter new password"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Confirm New Password</label>
                              <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Confirm new password"
                              />
                            </div>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                if (passwordData.newPassword !== passwordData.confirmPassword) {
                                  alert('Passwords do not match');
                                  return;
                                }
                                alert('Password changed successfully');
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                              style={{
                                background: '#1a73e8',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                alignSelf: 'flex-start'
                              }}
                            >
                              Update Password
                            </button>
                          </div>
                        </div>

                        {/* Two-Factor Authentication Section */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 4px 0' }}>Two-Factor Authentication</h3>
                              <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Add an extra layer of security to your account</p>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                              <input
                                type="checkbox"
                                checked={twoFactorEnabled}
                                onChange={e => setTwoFactorEnabled(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: twoFactorEnabled ? '#1a73e8' : '#ccc',
                                borderRadius: '24px',
                                transition: '0.3s'
                              }}>
                                <span style={{
                                  position: 'absolute',
                                  content: '""',
                                  height: '18px',
                                  width: '18px',
                                  left: twoFactorEnabled ? '22px' : '3px',
                                  bottom: '3px',
                                  backgroundColor: 'white',
                                  borderRadius: '50%',
                                  transition: '0.3s'
                                }}></span>
                              </span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Billing Tab */}
                    {settingsTab === 'billing' && (
                      <>
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Current Plan</h3>
                          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '16px', fontWeight: '500', color: '#202124' }}>Pro Plan</span>
                              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a73e8' }}>$29/month</span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Includes all features and unlimited properties</p>
                          </div>
                        </div>

                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Payment Method</h3>
                          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}>
                            <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Stripe integration coming soon</p>
                          </div>
                          <button
                            className="btn-secondary"
                            style={{
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              padding: '10px 24px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              background: '#fff'
                            }}
                          >
                            Update Payment Method
                          </button>
                        </div>
                      </>
                    )}

                    {/* Company Tab */}
                    {settingsTab === 'company' && (
                      <>
                        {/* Company Information */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 24px 0' }}>Company Information</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Company Name</label>
                              <input
                                type="text"
                                value={companyData.name}
                                onChange={e => setCompanyData({...companyData, name: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter company name"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Company Address</label>
                              <input
                                type="text"
                                value={companyData.address}
                                onChange={e => setCompanyData({...companyData, address: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  color: '#202124'
                                }}
                                placeholder="Enter company address"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Company Logo</label>
                              <button
                                className="btn-secondary"
                                style={{
                                  border: '1px solid #dadce0',
                                  borderRadius: '4px',
                                  padding: '10px 24px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  background: '#fff'
                                }}
                              >
                                Upload Logo
                              </button>
                            </div>
                            <button
                              className="btn-primary"
                              onClick={() => alert('Company information saved')}
                              style={{
                                background: '#1a73e8',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                alignSelf: 'flex-start'
                              }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>

                        {/* Demo Data Section */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 16px 0' }}>Demo Data</h3>
                          <p style={{ fontSize: '14px', color: '#5f6368', margin: '0 0 20px 0' }}>
                            Load sample data for Propli based in the Pacific Northwest. This includes 6 properties, 15 tenants, 8 maintenance requests, and 6 months of payment history.
                          </p>
                          <button
                            className="btn-primary"
                            onClick={loadDemoData}
                            disabled={loading}
                            style={{
                              background: '#1a73e8',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '10px 24px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1
                            }}
                          >
                            {loading ? 'Loading...' : 'Load Demo Data'}
                          </button>
                        </div>

                        {/* Import/Export Section */}
                        <div className="import-section">
                      <div className="import-section-header">
                        <div className="import-section-title">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <h3>Import Tenants</h3>
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => {
                            const sampleData = [
                              ['Tenant Name', 'Phone Number', 'Email Address', 'Unit', 'Rent Amount', 'Deposit', 'Lease From', 'Lease To', 'Status'],
                              ['John Doe', '555-0101', 'john@example.com', 'Unit 1A', '1200', '1200', '2024-01-01', '2024-12-31', 'current'],
                              ['Jane Smith', '555-0102', 'jane@example.com', 'Unit 2B', '1500', '1500', '2024-02-01', '2025-01-31', 'current']
                            ];
                            const csv = Papa.unparse(sampleData);
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'tenant_import_template.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          Download Sample CSV
                        </button>
                      </div>
                      <p className="section-description">Upload a CSV file to import multiple tenants at once</p>

                      {/* File Upload */}
                      {!tenantCsvFile && (
                        <div 
                          className="csv-upload-area"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('drag-over');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('drag-over');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('drag-over');
                            const file = e.dataTransfer.files[0];
                            if (file && file.name.endsWith('.csv')) {
                              handleTenantCsvUpload(file);
                            }
                          }}
                        >
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <p style={{ marginBottom: '16px' }}>Drag and drop CSV file here, or click to browse</p>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleTenantCsvUpload(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="tenant-csv-input"
                          />
                          <label htmlFor="tenant-csv-input" className="btn-secondary">
                            Select CSV File
                          </label>
                        </div>
                      )}

                      {/* CSV Preview and Mapping */}
                      {tenantCsvPreview && (
                        <div className="csv-preview-section">
                          <div className="preview-header">
                            <h4>CSV Preview (First 5 rows)</h4>
                            <button 
                              className="btn-secondary btn-small"
                              onClick={() => {
                                setTenantCsvFile(null);
                                setTenantCsvData(null);
                                setTenantCsvPreview(null);
                                setTenantColumnMapping({});
                              }}
                            >
                              Clear
                            </button>
                          </div>
                          
                          {/* Column Mapping */}
                          <div className="column-mapping">
                            <h4>Column Mapping</h4>
                            <div className="mapping-grid">
                              {['name', 'phone', 'email', 'property', 'rentAmount', 'securityDeposit', 'leaseStart', 'leaseEnd', 'status'].map(field => (
                                <div key={field} className="mapping-item">
                                  <label>{field === 'rentAmount' ? 'Monthly Rent' : field === 'securityDeposit' ? 'Security Deposit' : field === 'leaseStart' ? 'Lease Start' : field === 'leaseEnd' ? 'Lease End' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                  <select
                                    value={tenantColumnMapping[field] || ''}
                                    onChange={(e) => {
                                      setTenantColumnMapping({
                                        ...tenantColumnMapping,
                                        [field]: e.target.value
                                      });
                                    }}
                                  >
                                    <option value="">Select column...</option>
                                    {tenantCsvPreview.headers.map(header => (
                                      <option key={header} value={header}>{header}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Preview Table */}
                          <div className="preview-table-container">
                            <table className="preview-table">
                              <thead>
                                <tr>
                                  {tenantCsvPreview.headers.map(header => (
                                    <th key={header}>{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tenantCsvPreview.rows.slice(0, 5).map((row, idx) => (
                                  <tr key={idx}>
                                    {tenantCsvPreview.headers.map(header => (
                                      <td key={header}>{row[header] || ''}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Import Button */}
                          <div className="import-button-section">
                            <button
                              className="btn-primary"
                              onClick={handleImportTenants}
                              disabled={!Object.values(tenantColumnMapping).some(v => v) || tenantImportProgress}
                            >
                              {tenantImportProgress ? `Importing... ${tenantImportProgress.processed}/${tenantImportProgress.total}` : 'Import Tenants'}
                            </button>
                          </div>

                          {/* Progress Bar */}
                          {tenantImportProgress && (
                            <div className="import-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill"
                                  style={{ width: `${(tenantImportProgress.processed / tenantImportProgress.total) * 100}%` }}
                                ></div>
                              </div>
                              <div className="progress-stats">
                                <span>Processed: {tenantImportProgress.processed}/{tenantImportProgress.total}</span>
                                <span>Success: {tenantImportProgress.success}</span>
                                <span>Errors: {tenantImportProgress.errors}</span>
                                <span>Duplicates: {tenantImportProgress.duplicates}</span>
                              </div>
                              {tenantImportProgress.complete && (
                                <div className="import-results">
                                  <p className="success-message">
                                    Import complete! {tenantImportProgress.success} tenants imported successfully.
                                    {tenantImportProgress.errors > 0 && ` ${tenantImportProgress.errors} errors.`}
                                    {tenantImportProgress.duplicates > 0 && ` ${tenantImportProgress.duplicates} duplicates skipped.`}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CSV Import - Properties */}
                    <div className="import-section" style={{ marginTop: '24px' }}>
                      <div className="import-section-header">
                        <div className="import-section-title">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          <h3>Import Properties</h3>
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => {
                            const sampleData = [
                              ['Property Address', 'Type', 'Units', 'Owner', 'Owner Email'],
                              ['123 Main Street', 'Single Family', '1', 'John Owner', 'owner@example.com'],
                              ['456 Oak Avenue', 'Multi-Family', '4', 'Jane Owner', 'jane@example.com']
                            ];
                            const csv = Papa.unparse(sampleData);
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'property_import_template.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          Download Sample CSV
                        </button>
                      </div>
                      <p className="section-description">Upload a CSV file to import multiple properties at once</p>

                      {/* File Upload */}
                      {!propertyCsvFile && (
                        <div 
                          className="csv-upload-area"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('drag-over');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('drag-over');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('drag-over');
                            const file = e.dataTransfer.files[0];
                            if (file && file.name.endsWith('.csv')) {
                              handlePropertyCsvUpload(file);
                            }
                          }}
                        >
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <p style={{ marginBottom: '16px' }}>Drag and drop CSV file here, or click to browse</p>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handlePropertyCsvUpload(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="property-csv-input"
                          />
                          <label htmlFor="property-csv-input" className="btn-secondary">
                            Select CSV File
                          </label>
                        </div>
                      )}

                      {/* CSV Preview and Mapping */}
                      {propertyCsvPreview && (
                        <div className="csv-preview-section">
                          <div className="preview-header">
                            <h4>CSV Preview (First 5 rows)</h4>
                            <button 
                              className="btn-secondary btn-small"
                              onClick={() => {
                                setPropertyCsvFile(null);
                                setPropertyCsvData(null);
                                setPropertyCsvPreview(null);
                                setPropertyColumnMapping({});
                              }}
                            >
                              Clear
                            </button>
                          </div>
                          
                          {/* Column Mapping */}
                          <div className="column-mapping">
                            <h4>Column Mapping</h4>
                            <div className="mapping-grid">
                              {['address', 'type', 'units', 'ownerName', 'ownerEmail'].map(field => (
                                <div key={field} className="mapping-item">
                                  <label>{field === 'ownerName' ? 'Owner Name' : field === 'ownerEmail' ? 'Owner Email' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                  <select
                                    value={propertyColumnMapping[field] || ''}
                                    onChange={(e) => {
                                      setPropertyColumnMapping({
                                        ...propertyColumnMapping,
                                        [field]: e.target.value
                                      });
                                    }}
                                  >
                                    <option value="">Select column...</option>
                                    {propertyCsvPreview.headers.map(header => (
                                      <option key={header} value={header}>{header}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Preview Table */}
                          <div className="preview-table-container">
                            <table className="preview-table">
                              <thead>
                                <tr>
                                  {propertyCsvPreview.headers.map(header => (
                                    <th key={header}>{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {propertyCsvPreview.rows.slice(0, 5).map((row, idx) => (
                                  <tr key={idx}>
                                    {propertyCsvPreview.headers.map(header => (
                                      <td key={header}>{row[header] || ''}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Import Button */}
                          <div className="import-button-section">
                            <button
                              className="btn-primary"
                              onClick={handleImportProperties}
                              disabled={!Object.values(propertyColumnMapping).some(v => v) || propertyImportProgress}
                            >
                              {propertyImportProgress ? `Importing... ${propertyImportProgress.processed}/${propertyImportProgress.total}` : 'Import Properties'}
                            </button>
                          </div>

                          {/* Progress Bar */}
                          {propertyImportProgress && (
                            <div className="import-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill"
                                  style={{ width: `${(propertyImportProgress.processed / propertyImportProgress.total) * 100}%` }}
                                ></div>
                              </div>
                              <div className="progress-stats">
                                <span>Processed: {propertyImportProgress.processed}/{propertyImportProgress.total}</span>
                                <span>Success: {propertyImportProgress.success}</span>
                                <span>Errors: {propertyImportProgress.errors}</span>
                                <span>Duplicates: {propertyImportProgress.duplicates}</span>
                              </div>
                              {propertyImportProgress.complete && (
                                <div className="import-results">
                                  <p className="success-message">
                                    Import complete! {propertyImportProgress.success} properties imported successfully.
                                    {propertyImportProgress.errors > 0 && ` ${propertyImportProgress.errors} errors.`}
                                    {propertyImportProgress.duplicates > 0 && ` ${propertyImportProgress.duplicates} duplicates skipped.`}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      </>
                    )}

                    {/* Tags Tab */}
                    {settingsTab === 'tags' && (
                      <>
                        {/* Tags Header */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#202124', margin: '0 0 4px 0' }}>Manage Tags</h3>
                              <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Create tags to track and categorize records</p>
                            </div>
                            <button
                              className="btn-primary"
                              onClick={() => setShowCreateTagModal(true)}
                              style={{
                                background: '#1a73e8',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              + Create Tag
                            </button>
                          </div>

                          {/* Tags Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '16px',
                            marginTop: '24px'
                          }}>
                            {tags.map(tag => {
                              const recordCount = getTagRecordCount(tag.id);
                              const colorMap = {
                                blue: '#1a73e8',
                                green: '#10b981',
                                yellow: '#fbbf24',
                                orange: '#f97316',
                                red: '#ef4444',
                                purple: '#a855f7',
                                teal: '#14b8a6',
                                gray: '#6b7280'
                              };
                              const tagColor = colorMap[tag.color] || colorMap.blue;

                              return (
                                <div
                                  key={tag.id}
                                  style={{
                                    background: '#f8f9fa',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        background: tagColor,
                                        color: '#fff',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                      }}
                                    >
                                      {tag.name}
                                    </div>
                                    <span style={{ fontSize: '14px', color: '#5f6368', whiteSpace: 'nowrap' }}>
                                      ({recordCount})
                                    </span>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to delete the tag "${tag.name}"? This will remove it from all records.`)) {
                                        try {
                                          await deleteTag(tag.id);
                                        } catch (error) {
                                          // Error already handled in deleteTag
                                        }
                                      }
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px',
                                      flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.target.style.background = 'none'}
                                    title="Delete tag"
                                    aria-label="Delete tag"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {tags.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#5f6368' }}>
                              <p>No tags yet. Create your first tag to get started.</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Integrations Tab */}
                    {settingsTab === 'integrations' && (
                      <>
                        <div style={{
                          background: '#fff',
                          border: '1px solid #dadce0',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginBottom: '20px'
                        }}>
                          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Integrations</h2>
                          <p style={{ color: '#6b7280', marginBottom: 24, margin: '0 0 24px' }}>Connect Propli with your favorite apps</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                            {/* Accounting */}
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>💰</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>QuickBooks</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Sync income, expenses, and invoices</p>
                                </div>
                              </div>
                            </div>
                            
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>📊</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Xero</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Accounting and bookkeeping</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Communication */}
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>📧</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Gmail</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Send emails directly from Propli</p>
                                </div>
                              </div>
                            </div>
                            
                            <div
                              onClick={() => setShowTwilioSetup && setShowTwilioSetup(true)}
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#1a73e8';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(26, 115, 232, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>📱</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Twilio SMS</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Available
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Two-way text messaging with tenants</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Calendar */}
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>📅</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Google Calendar</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Sync events and appointments</p>
                                </div>
                              </div>
                            </div>
                            
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>📆</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Outlook Calendar</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Sync with Microsoft 365</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Payments */}
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>💳</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Stripe</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Accept online rent payments</p>
                                </div>
                              </div>
                            </div>
                            
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>🏦</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Plaid</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Bank account verification</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Automation */}
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>⚡</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Zapier</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Connect 5,000+ apps</p>
                                </div>
                              </div>
                            </div>
                            
                            <div
                              style={{
                                padding: 20,
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <span style={{ fontSize: 32 }}>🔄</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ fontWeight: 600, margin: 0 }}>Webhooks</h4>
                                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                                      Coming Soon
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Custom API integrations</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Old Settings sections removed - now in tabs above */}
              {false && activeTab === 'settings' && (
                <div className="content-section">
                  {/* This section is intentionally disabled - content moved to tabs */}
                  <div className="settings-content">
                    {/* CSV Import - Properties */}
                    <div className="import-section" style={{ marginTop: '24px' }}>
                      <div className="import-section-header">
                        <div className="import-section-title">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          <h3>Import Properties</h3>
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => {
                            const sampleData = [
                              ['Property Address', 'Type', 'Units', 'Owner', 'Owner Email'],
                              ['123 Main Street', 'Single Family', '1', 'John Owner', 'owner@example.com'],
                              ['456 Oak Avenue', 'Multi-Family', '4', 'Jane Owner', 'jane@example.com']
                            ];
                            const csv = Papa.unparse(sampleData);
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'property_import_template.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          Download Sample CSV
                        </button>
                      </div>
                      <p className="section-description">Upload a CSV file to import multiple properties at once</p>

                      {/* File Upload */}
                      {!propertyCsvFile && (
                        <div 
                          className="csv-upload-area"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('drag-over');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('drag-over');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('drag-over');
                            const file = e.dataTransfer.files[0];
                            if (file && file.name.endsWith('.csv')) {
                              handlePropertyCsvUpload(file);
                            }
                          }}
                        >
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <p style={{ marginBottom: '16px' }}>Drag and drop CSV file here, or click to browse</p>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handlePropertyCsvUpload(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="property-csv-input"
                          />
                          <label htmlFor="property-csv-input" className="btn-secondary">
                            Select CSV File
                          </label>
                        </div>
                      )}

                      {/* CSV Preview and Mapping */}
                      {propertyCsvPreview && (
                        <div className="csv-preview-section">
                          <div className="preview-header">
                            <h4>CSV Preview (First 5 rows)</h4>
                            <button 
                              className="btn-secondary btn-small"
                              onClick={() => {
                                setPropertyCsvFile(null);
                                setPropertyCsvData(null);
                                setPropertyCsvPreview(null);
                                setPropertyColumnMapping({});
                              }}
                            >
                              Clear
                            </button>
                          </div>
                          
                          {/* Column Mapping */}
                          <div className="column-mapping">
                            <h4>Column Mapping</h4>
                            <div className="mapping-grid">
                              {['address', 'type', 'units', 'ownerName', 'ownerEmail'].map(field => (
                                <div key={field} className="mapping-item">
                                  <label>{field === 'ownerName' ? 'Owner Name' : field === 'ownerEmail' ? 'Owner Email' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                  <select
                                    value={propertyColumnMapping[field] || ''}
                                    onChange={(e) => {
                                      setPropertyColumnMapping({
                                        ...propertyColumnMapping,
                                        [field]: e.target.value
                                      });
                                    }}
                                  >
                                    <option value="">Select column...</option>
                                    {propertyCsvPreview.headers.map(header => (
                                      <option key={header} value={header}>{header}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Preview Table */}
                          <div className="preview-table-container">
                            <table className="preview-table">
                              <thead>
                                <tr>
                                  {propertyCsvPreview.headers.map(header => (
                                    <th key={header}>{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {propertyCsvPreview.rows.slice(0, 5).map((row, idx) => (
                                  <tr key={idx}>
                                    {propertyCsvPreview.headers.map(header => (
                                      <td key={header}>{row[header] || ''}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Import Button */}
                          <div className="import-button-section">
                            <button
                              className="btn-primary"
                              onClick={handleImportProperties}
                              disabled={!Object.values(propertyColumnMapping).some(v => v) || propertyImportProgress}
                            >
                              {propertyImportProgress ? `Importing... ${propertyImportProgress.processed}/${propertyImportProgress.total}` : 'Import Properties'}
                            </button>
                          </div>

                          {/* Progress Bar */}
                          {propertyImportProgress && (
                            <div className="import-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill"
                                  style={{ width: `${(propertyImportProgress.processed / propertyImportProgress.total) * 100}%` }}
                                ></div>
                              </div>
                              <div className="progress-stats">
                                <span>Processed: {propertyImportProgress.processed}/{propertyImportProgress.total}</span>
                                <span>Success: {propertyImportProgress.success}</span>
                                <span>Errors: {propertyImportProgress.errors}</span>
                                <span>Duplicates: {propertyImportProgress.duplicates}</span>
                              </div>
                              {propertyImportProgress.complete && (
                                <div className="import-results">
                                  <p className="success-message">
                                    Import complete! {propertyImportProgress.success} properties imported successfully.
                                    {propertyImportProgress.errors > 0 && ` ${propertyImportProgress.errors} errors.`}
                                    {propertyImportProgress.duplicates > 0 && ` ${propertyImportProgress.duplicates} duplicates skipped.`}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SMS Notifications Section */}
                    <div className="import-section" style={{ marginTop: '48px' }}>
                      <div className="import-section-header">
                        <div className="import-section-title">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <h3>SMS Notifications</h3>
                        </div>
                      </div>
                      <p className="section-description">Configure Twilio to send SMS reminders to tenants</p>

                      <div className="form-grid" style={{ marginTop: '24px' }}>
                        <div className="form-group full-width">
                          <label>Twilio Account SID</label>
                          <input
                            type="text"
                            value={twilioSettings.accountSid}
                            onChange={e => setTwilioSettings({...twilioSettings, accountSid: e.target.value})}
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Twilio Auth Token</label>
                          <input
                            type="password"
                            value={twilioSettings.authToken}
                            onChange={e => setTwilioSettings({...twilioSettings, authToken: e.target.value})}
                            placeholder="Enter your Twilio Auth Token"
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Twilio Phone Number</label>
                          <input
                            type="text"
                            value={twilioSettings.phoneNumber}
                            onChange={e => setTwilioSettings({...twilioSettings, phoneNumber: e.target.value})}
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>

                      <div className="modal-actions" style={{ marginTop: '24px', justifyContent: 'flex-start' }}>
                        <button
                          className="btn-primary"
                          onClick={saveTwilioSettings}
                          disabled={twilioSettingsLoading}
                        >
                          {twilioSettingsLoading ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>

                      {/* Test SMS */}
                      <div style={{ marginTop: '32px', padding: '24px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '500', color: '#202124' }}>Test SMS</h4>
                        <div className="form-grid">
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Phone Number</label>
                            <input
                              type="tel"
                              value={testSmsPhone}
                              onChange={e => setTestSmsPhone(e.target.value)}
                              placeholder="+1234567890"
                            />
                          </div>
                          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              className="btn-secondary"
                              onClick={sendTestSMS}
                              disabled={testSmsSending || !testSmsPhone}
                            >
                              {testSmsSending ? 'Sending...' : 'Send Test SMS'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

      {(showAddModal || editingTenant) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingTenant(null);
        }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</h2>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                setEditingTenant(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={editingTenant ? handleUpdateTenant : handleAddTenant}>
                <div className="two-col">
                  <div className="form-group">
                    <RequiredLabel>Full Name</RequiredLabel>
                    <input
                      type="text"
                      className="form-input"
                      value={editingTenant ? editingTenant.name : newTenant.name}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, name: e.target.value})
                        : setNewTenant({...newTenant, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <RequiredLabel required={false}>Phone</RequiredLabel>
                    <input
                      type="tel"
                      className="form-input"
                      value={editingTenant ? editingTenant.phone : newTenant.phone}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, phone: e.target.value})
                        : setNewTenant({...newTenant, phone: e.target.value})}
                      placeholder="(optional)"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <RequiredLabel>Email</RequiredLabel>
                  <input
                    type="email"
                    className="form-input"
                    value={editingTenant ? editingTenant.email : newTenant.email}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, email: e.target.value})
                      : setNewTenant({...newTenant, email: e.target.value})}
                    required
                  />
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editingTenant ? editingTenant.status : newTenant.status}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, status: e.target.value})
                        : setNewTenant({...newTenant, status: e.target.value})}
                    >
                      <option value="prospect">Prospect</option>
                      <option value="current">Current Tenant</option>
                      <option value="past">Past Tenant</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select
                      className="form-select"
                      value={editingTenant ? editingTenant.paymentStatus : newTenant.paymentStatus}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, paymentStatus: e.target.value})
                        : setNewTenant({...newTenant, paymentStatus: e.target.value})}
                    >
                      <option value="n/a">N/A</option>
                      <option value="paid">Paid</option>
                      <option value="late">Late</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Property / Unit</label>
                  <select
                    className="form-select"
                    value={editingTenant ? editingTenant.property : newTenant.property}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, property: e.target.value})
                      : setNewTenant({...newTenant, property: e.target.value})}
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.address}>{prop.address}</option>
                    ))}
                  </select>
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <RequiredLabel required={(editingTenant ? editingTenant.status : newTenant.status) === 'current'}>Monthly Rent</RequiredLabel>
                    <input
                      type="number"
                      className="form-input"
                      value={editingTenant ? editingTenant.rentAmount : newTenant.rentAmount}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, rentAmount: e.target.value})
                        : setNewTenant({...newTenant, rentAmount: e.target.value})}
                      placeholder="0"
                      required={(editingTenant ? editingTenant.status : newTenant.status) === 'current'}
                    />
                  </div>
                  <div className="form-group">
                    <RequiredLabel required={false}>Security Deposit</RequiredLabel>
                    <input
                      type="number"
                      className="form-input"
                      value={editingTenant ? editingTenant.securityDeposit : newTenant.securityDeposit}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, securityDeposit: e.target.value})
                        : setNewTenant({...newTenant, securityDeposit: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <RequiredLabel required={(editingTenant ? editingTenant.status : newTenant.status) === 'current'}>Lease Start</RequiredLabel>
                    <input
                      type="date"
                      className="form-input"
                      value={editingTenant ? editingTenant.leaseStart : newTenant.leaseStart}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, leaseStart: e.target.value})
                        : setNewTenant({...newTenant, leaseStart: e.target.value})}
                      required={(editingTenant ? editingTenant.status : newTenant.status) === 'current'}
                    />
                  </div>
                  <div className="form-group">
                    <RequiredLabel required={false}>Lease End</RequiredLabel>
                    <input
                      type="date"
                      className="form-input"
                      value={editingTenant ? editingTenant.leaseEnd : newTenant.leaseEnd}
                      onChange={e => editingTenant 
                        ? setEditingTenant({...editingTenant, leaseEnd: e.target.value})
                        : setNewTenant({...newTenant, leaseEnd: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Move-In Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingTenant ? editingTenant.moveInDate : newTenant.moveInDate || ''}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, moveInDate: e.target.value})
                      : setNewTenant({...newTenant, moveInDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Move-In Condition Notes</label>
                  <textarea
                    className="form-textarea"
                    value={editingTenant ? editingTenant.moveInNotes : newTenant.moveInNotes || ''}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, moveInNotes: e.target.value})
                      : setNewTenant({...newTenant, moveInNotes: e.target.value})}
                    rows="2"
                    placeholder="Describe the condition of the property at move-in..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={editingTenant ? editingTenant.notes : newTenant.notes}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, notes: e.target.value})
                      : setNewTenant({...newTenant, notes: e.target.value})}
                    rows="3"
                    placeholder="Pet info, preferences, move-in notes..."
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowAddModal(false);
                    setEditingTenant(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTenant ? 'Update Tenant' : 'Add Tenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedTenant && (
        <>
          {/* Backdrop/Overlay */}
          <div 
            className="panel-overlay" 
            onClick={() => {
              setSelectedTenant(null);
              setTagsExpanded(false); // Reset tags expanded when closing panel
            }}
          />
          {/* Right-side slide-out panel */}
          <div className="tenant-detail-panel open" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Tenant Details</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setEditingTenant({...selectedTenant});
                    setSelectedTenant(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#1a73e8',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  Edit
                </button>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setSelectedTenant(null);
                    setTagsExpanded(false); // Reset tags expanded when closing panel
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#6b7280',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - 73px)' }}>
              {/* Avatar with Photo Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <div
                  onClick={() => document.getElementById('tenant-photo-input').click()}
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    background: selectedTenant.photo_url 
                      ? `url(${selectedTenant.photo_url}) center/cover`
                      : getAvatarColorByName(selectedTenant.name),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {!selectedTenant.photo_url && (
                    <span>{getInitials(selectedTenant.name)}</span>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#1a73e8',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <span style={{ color: 'white', fontSize: '14px' }}>📷</span>
                  </div>
                </div>
                <input
                  id='tenant-photo-input'
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const photoUrl = await uploadPhoto(file, 'tenant', selectedTenant.id);
                      await supabase.from('tenants').update({ photo_url: photoUrl }).eq('id', selectedTenant.id);
                      setSelectedTenant({ ...selectedTenant, photo_url: photoUrl });
                      setTenants(tenants.map(t => t.id === selectedTenant.id ? { ...t, photo_url: photoUrl } : t));
                    } catch (err) {
                      console.error('Upload failed:', err);
                      alert('Failed to upload photo');
                    }
                    e.target.value = ''; // Reset input
                  }}
                />
                
                {/* Name */}
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 8px 0',
                  textAlign: 'center'
                }}>
                  {selectedTenant.name}
                </h2>
                
                {/* Status Badge */}
                <span 
                  className="badge" 
                  style={{
                    ...getStatusBadge(selectedTenant.status),
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}
                >
                  {selectedTenant.status === 'current' ? 'Current' : selectedTenant.status === 'prospect' ? 'Prospect' : 'Past'}
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              {/* Email Section */}
              {selectedTenant.email && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Email
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    {selectedTenant.email}
                  </div>
                </div>
              )}

              {/* Phone Section */}
              {selectedTenant.phone && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Phone
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    {selectedTenant.phone}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              {/* Property Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  Property
                </div>
                <div style={{ fontSize: '14px', color: '#1f2937' }}>
                  {selectedTenant.property || 'Not assigned'}
                </div>
              </div>

              {/* Monthly Rent and Balance - Two Columns */}
              {selectedTenant.rentAmount > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Monthly Rent
                    </div>
                    <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      ${selectedTenant.rentAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Balance
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: selectedTenant.paymentStatus === 'paid' ? '#10b981' : '#1f2937',
                      fontWeight: '500'
                    }}>
                      {selectedTenant.paymentStatus === 'paid' ? '$0' : `$${selectedTenant.rentAmount.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Lease Period */}
              {selectedTenant.leaseStart && selectedTenant.leaseEnd && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Lease Period
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    {new Date(selectedTenant.leaseStart).toLocaleDateString()} - {new Date(selectedTenant.leaseEnd).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              {/* Tags Section */}
              <div style={{ marginBottom: '24px' }}>
                {(() => {
                  const tenantTags = getTagsForRecord('tenant', selectedTenant.id);
                  const displayedTags = tagsExpanded ? tenantTags : tenantTags.slice(0, 3);
                  
                  return (
                    <div>
                      <div 
                        onClick={() => setTagsExpanded(!tagsExpanded)} 
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}
                      >
                        <span className="section-label">TAGS</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {tagsExpanded ? '▼' : '▶'} {tenantTags.length}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {displayedTags.map(tag => {
                          const tagColor = getTagColor(tag.color);
                          return (
                            <span
                              key={tag.id}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                background: tagColor.bg,
                                color: tagColor.text,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {tag.name}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await removeTagFromRecord(tag.id, 'tenant', selectedTenant.id);
                                  // Reload record tags
                                  try {
                                    const { data: allRecordTags } = await supabase
                                      .from('record_tags')
                                      .select('*');
                                    if (allRecordTags) {
                                      setRecordTags(allRecordTags);
                                    }
                                  } catch (error) {
                                    console.error('Error reloading record tags:', error);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: tagColor.text,
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '0',
                                  margin: '0',
                                  lineHeight: '1',
                                  opacity: 0.7
                                }}
                                title="Remove tag"
                                onMouseEnter={(e) => e.target.style.opacity = '1'}
                                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                        {!tagsExpanded && tenantTags.length > 3 && (
                          <span style={{ fontSize: '12px', color: '#6b7280', alignSelf: 'center' }}>
                            +{tenantTags.length - 3} more
                          </span>
                        )}
                      </div>
                      {tagsExpanded && (
                        <div style={{ marginTop: '8px' }}>
                          <TagPicker
                            recordType="tenant"
                            recordId={selectedTenant.id}
                            onTagsChange={async () => {
                              // Reload record tags for this tenant
                              try {
                                const { data: allRecordTags } = await supabase
                                  .from('record_tags')
                                  .select('*');
                                if (allRecordTags) {
                                  setRecordTags(allRecordTags);
                                }
                              } catch (error) {
                                console.error('Error reloading record tags:', error);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              {/* Files Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="section-label">FILES</span>
                  <button
                    onClick={() => document.getElementById('tenant-file-input').click()}
                    className="btn-text"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    + Add File
                  </button>
                </div>
                <input
                  id='tenant-file-input'
                  type='file'
                  multiple
                  accept='.pdf,.doc,.docx,.jpg,.png,.jpeg'
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    try {
                      for (const file of files) {
                        await uploadDocument(file, 'tenant', selectedTenant.id, 'document');
                      }
                      const updated = await loadFilesForRecord('tenant', selectedTenant.id);
                      setTenantFiles(updated);
                    } catch (err) {
                      console.error('Upload failed:', err);
                      alert('Failed to upload file(s)');
                    }
                    e.target.value = ''; // Reset input
                  }}
                />
                {tenantFiles.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No files uploaded</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tenantFiles.map(file => (
                      <div 
                        key={file.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>📄</span>
                          <span style={{ fontSize: '14px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.file_name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                            {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const url = await getDocumentUrl(file.storage_path);
                                window.open(url, '_blank');
                              } catch (err) {
                                console.error('Error downloading file:', err);
                                alert('Failed to download file');
                              }
                            }} 
                            className="btn-text"
                            style={{ padding: '4px 8px', fontSize: '14px' }}
                            title="Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this file?')) {
                                try {
                                  await deleteFile(file.id, file.storage_path);
                                  setTenantFiles(tenantFiles.filter(f => f.id !== file.id));
                                } catch (err) {
                                  console.error('Error deleting file:', err);
                                  alert('Failed to delete file');
                                }
                              }
                            }} 
                            className="btn-text"
                            style={{ padding: '4px 8px', fontSize: '14px', color: '#dc2626' }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }}></div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                {selectedTenant.email && (
                  <a
                    href={`mailto:${selectedTenant.email}`}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Email
                  </a>
                )}
                {selectedTenant.phone && (
                  <a
                    href={`tel:${selectedTenant.phone}`}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showPaymentRequestModal && (() => {
        const tenant = tenants.find(t => t.id === showPaymentRequestModal);
        if (!tenant) return null;
        
        return (
          <div className="modal-overlay" onClick={() => {
            setShowPaymentRequestModal(null);
            setPaymentRequest({ amount: '', dueDate: '', note: '' });
            setPaymentLinkCopied(false);
            setCreatedPaymentLink('');
          }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>Request Payment - {tenant.name}</h2>
                <button className="close-btn" onClick={() => {
                  setShowPaymentRequestModal(null);
                  setPaymentRequest({ amount: '', dueDate: '', note: '' });
                  setPaymentLinkCopied(false);
                  setCreatedPaymentLink('');
                }}>×</button>
              </div>
              <div className="modal-content">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!paymentRequest.amount || !paymentRequest.dueDate) {
                    alert('Please fill in amount and due date');
                    return;
                  }

                  // Create payment request in Supabase
                  const { data, error } = await supabase
                    .from('payment_requests')
                    .insert([{
                      user_id: user.id,
                      tenant_id: tenant.id,
                      amount: parseFloat(paymentRequest.amount),
                      due_date: paymentRequest.dueDate,
                      note: paymentRequest.note || null,
                      status: 'pending'
                    }])
                    .select()
                    .single();

                  if (error) {
                    console.error('Error creating payment request:', error);
                    alert('Error creating payment request. Please make sure the payment_requests table exists. Run the add-payment-requests-migration.sql file in your Supabase SQL editor.');
                    return;
                  }

                  // Generate payment link using the created record's timestamp
                  const timestamp = new Date(data.created_at).getTime();
                  const paymentLink = `${window.location.origin}/pay/${tenant.id}/${parseFloat(paymentRequest.amount)}/${timestamp}`;
                  
                  // Store the link
                  setCreatedPaymentLink(paymentLink);

                  // Copy link to clipboard
                  try {
                    await navigator.clipboard.writeText(paymentLink);
                    setPaymentLinkCopied(true);
                    setTimeout(() => {
                      setPaymentLinkCopied(false);
                      setCreatedPaymentLink('');
                    }, 10000);
                  } catch (err) {
                    const textArea = document.createElement('textarea');
                    textArea.value = paymentLink;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    setPaymentLinkCopied(true);
                    setTimeout(() => {
                      setPaymentLinkCopied(false);
                      setCreatedPaymentLink('');
                    }, 10000);
                  }
                }}>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Amount</label>
                      <input
                        type="number"
                        value={paymentRequest.amount}
                        onChange={e => setPaymentRequest({...paymentRequest, amount: e.target.value})}
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={paymentRequest.dueDate}
                        onChange={e => setPaymentRequest({...paymentRequest, dueDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Note (Optional)</label>
                      <textarea
                        value={paymentRequest.note}
                        onChange={e => setPaymentRequest({...paymentRequest, note: e.target.value})}
                        placeholder="Add a note for the tenant..."
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => {
                        setShowPaymentRequestModal(null);
                        setPaymentRequest({ amount: '', dueDate: '', note: '' });
                        setPaymentLinkCopied(false);
                        setCreatedPaymentLink('');
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {paymentLinkCopied ? 'Link Copied!' : 'Create Payment Link'}
                    </button>
                  </div>
                </form>
                {paymentLinkCopied && createdPaymentLink && (
                  <div style={{ marginTop: '24px', padding: '16px', background: '#e8f5e9', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '12px', color: '#1e8e3e', fontWeight: '500' }}>
                      ✓ Payment link created and copied to clipboard!
                    </p>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', color: '#5f6368', display: 'block', marginBottom: '4px' }}>
                        Payment Link:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={createdPaymentLink}
                          readOnly
                          style={{ 
                            flex: 1, 
                            padding: '8px 12px', 
                            border: '1px solid #dadce0', 
                            borderRadius: '4px',
                            fontSize: '13px',
                            background: '#ffffff'
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(createdPaymentLink);
                              alert('Link copied again!');
                            } catch (err) {
                              const textArea = document.createElement('textarea');
                              textArea.value = createdPaymentLink;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              alert('Link copied again!');
                            }
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    {tenant.email && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => {
                          const subject = encodeURIComponent(`Payment Request - $${parseFloat(paymentRequest.amount).toLocaleString()}`);
                          const body = encodeURIComponent(
                            `Dear ${tenant.name},\n\n` +
                            `This is a payment request for ${tenant.property || 'your property'}.\n\n` +
                            `Amount Due: $${parseFloat(paymentRequest.amount).toLocaleString()}\n` +
                            `Due Date: ${new Date(paymentRequest.dueDate).toLocaleDateString()}\n` +
                            (paymentRequest.note ? `\nNote: ${paymentRequest.note}\n` : '') +
                            `\nPlease use the following link to make your payment:\n${createdPaymentLink}\n\n` +
                            `Thank you,\nProperty Management`
                          );
                          window.location.href = `mailto:${tenant.email}?subject=${subject}&body=${body}`;
                        }}
                      >
                        Send via Email
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {confirmPaymentChange && (
        <div className="modal-overlay" onClick={() => setConfirmPaymentChange(null)}>
          <div className="modal confirmation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Payment Status Change</h2>
              <button className="close-btn" onClick={() => setConfirmPaymentChange(null)}>×</button>
            </div>
            <div className="confirmation-content">
              <p>Are you sure you want to mark <strong>{confirmPaymentChange.tenantName}</strong> as <strong>late</strong>?</p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setConfirmPaymentChange(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={confirmPaymentChangeAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirmation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Tenant</h2>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <div className="confirmation-content">
              <p>Are you sure you want to delete <strong>{confirmDelete.tenantName}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={confirmDeleteAction}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSelectTenantForPayment && (
        <div className="modal-overlay" onClick={() => {
          setShowSelectTenantForPayment(false);
          setPaymentTenantSearch('');
        }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Select Tenant for Payment</h2>
              <button className="close-btn" onClick={() => {
                setShowSelectTenantForPayment(false);
                setPaymentTenantSearch('');
              }}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group full-width">
                <label>Search Tenant</label>
                <input
                  type="text"
                  placeholder="Search by name, property, or email..."
                  value={paymentTenantSearch}
                  onChange={(e) => setPaymentTenantSearch(e.target.value)}
                  className="search-bar"
                  autoFocus
                />
              </div>
              <div className="tenant-selection-list" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px' }}>
                {(() => {
                  const filteredTenants = tenants.filter(t => {
                    if (!paymentTenantSearch || !paymentTenantSearch.trim()) return true;
                    const search = paymentTenantSearch.toLowerCase();
                    return (t.name && t.name.toLowerCase().includes(search)) ||
                           (t.property && t.property.toLowerCase().includes(search)) ||
                           (t.email && t.email.toLowerCase().includes(search));
                  });
                  
                  if (filteredTenants.length === 0) {
                    return (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#5f6368' }}>
                        <p>No tenants found</p>
                      </div>
                    );
                  }
                  
                  return filteredTenants.map(tenant => (
                    <div
                      key={tenant.id}
                      className="tenant-selection-item"
                      onClick={() => {
                        setShowSelectTenantForPayment(false);
                        setPaymentTenantSearch('');
                        setShowPaymentLog(tenant.id);
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#202124' }}>
                          {tenant.name || 'Unnamed'}
                        </strong>
                        <span style={{ fontSize: '13px', color: '#5f6368' }}>
                          {tenant.property || 'No property'}
                        </span>
                        {tenant.email && (
                          <span style={{ fontSize: '13px', color: '#5f6368', display: 'block', marginTop: '2px' }}>
                            {tenant.email}
                          </span>
                        )}
                      </div>
                      {tenant.status === 'current' && (
                        <span className="badge" style={getPaymentBadge(tenant.paymentStatus)}>
                          {tenant.paymentStatus === 'paid' ? 'Paid' : 'Late'}
                        </span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentLog && (
        <div className="modal-overlay" onClick={() => setShowPaymentLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Log - {tenants.find(t => t.id === showPaymentLog)?.name}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await refreshData();
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Refresh data"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Refresh
                </button>
                <button className="close-btn" onClick={() => setShowPaymentLog(null)}>×</button>
              </div>
            </div>
            <div className="modal-content">
              <form onSubmit={(e) => handleAddPayment(showPaymentLog, e)}>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={newPayment.method}
                    onChange={e => setNewPayment({...newPayment, method: e.target.value})}
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="Venmo">Venmo</option>
                    <option value="Zelle">Zelle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Received</label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={e => setNewPayment({...newPayment, date: e.target.value})}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowPaymentLog(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Payment
                  </button>
                </div>
              </form>
              <div className="payment-log-list" style={{ marginTop: '1.5rem' }}>
                <h4>Payment History</h4>
                {tenants.find(t => t.id === showPaymentLog)?.paymentLog?.length > 0 ? (
                  tenants.find(t => t.id === showPaymentLog).paymentLog.slice().reverse().map(payment => (
                    <div key={payment.id} className="payment-log-item">
                      <span>${payment.amount.toLocaleString()}</span>
                      <span>{payment.method}</span>
                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No payments recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showActivityLog && (
        <div className="modal-overlay" onClick={() => setShowActivityLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Activity Log - {tenants.find(t => t.id === showActivityLog)?.name}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await refreshData();
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Refresh data"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Refresh
                </button>
                <button className="close-btn" onClick={() => setShowActivityLog(null)}>×</button>
              </div>
            </div>
            <div className="modal-content">
              <form onSubmit={(e) => handleAddActivity(showActivityLog, e)}>
                <div className="form-group full-width">
                  <label>Add Note</label>
                  <textarea
                    value={newActivityNote}
                    onChange={e => setNewActivityNote(e.target.value)}
                    rows="3"
                    placeholder="Enter activity note..."
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowActivityLog(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Note
                  </button>
                </div>
              </form>
              <div className="activity-log-list" style={{ marginTop: '1.5rem' }}>
                <h4>Activity History</h4>
                {tenants.find(t => t.id === showActivityLog)?.activityLog?.length > 0 ? (
                  tenants.find(t => t.id === showActivityLog).activityLog.slice().reverse().map(activity => (
                    <div key={activity.id} className="activity-log-item">
                      <p className="activity-note">{activity.note}</p>
                      <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No activity recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense - {properties.find(p => p.id === showExpenseModal)?.address}</h2>
              <button className="close-btn" onClick={() => setShowExpenseModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => handleAddExpense(showExpenseModal, e)}>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="e.g., Plumbing repair"
                    required
                  />
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newExpense.amount}
                      onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                      <option value="repair">Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editingProperty && (
        <div className="modal-overlay" onClick={() => setEditingProperty(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Property</h2>
              <button className="close-btn" onClick={() => setEditingProperty(null)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateProperty}>
                <div className="form-group">
                  <RequiredLabel>Address</RequiredLabel>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProperty.address}
                    onChange={e => setEditingProperty({...editingProperty, address: e.target.value})}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="form-group">
                  <RequiredLabel>Property Type</RequiredLabel>
                  <select
                    className="form-select"
                    value={editingProperty.type || ''}
                    onChange={e => setEditingProperty({...editingProperty, type: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Single Family">Single Family</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Apartment Complex">Apartment Complex</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <RequiredLabel>Total Units</RequiredLabel>
                    <input
                      type="number"
                      className="form-input"
                      value={editingProperty.units}
                      onChange={e => setEditingProperty({...editingProperty, units: e.target.value})}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Occupied Units</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingProperty.occupied}
                      onChange={e => setEditingProperty({...editingProperty, occupied: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Revenue</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingProperty.monthlyRevenue}
                    onChange={e => setEditingProperty({...editingProperty, monthlyRevenue: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner</label>
                  <select
                    className="form-select"
                    value={editingProperty.ownerId || ''}
                    onChange={e => {
                      const ownerId = e.target.value || null;
                      const selectedOwnerObj = ownerId ? owners.find(o => o.id === ownerId) : null;
                      setEditingProperty({
                        ...editingProperty,
                        ownerId: ownerId,
                        ownerName: selectedOwnerObj ? selectedOwnerObj.name : '',
                        ownerEmail: selectedOwnerObj ? selectedOwnerObj.email : ''
                      });
                    }}
                  >
                    <option value="">Self-managed</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingProperty(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Property
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeletePropertyConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeletePropertyConfirm(null)}>
          <div className="modal confirmation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Property</h2>
              <button className="close-btn" onClick={() => setShowDeletePropertyConfirm(null)}>×</button>
            </div>
            <div className="confirmation-content">
              <p>Are you sure you want to delete this property?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowDeletePropertyConfirm(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => handleDeleteProperty(showDeletePropertyConfirm)}
                style={{ background: '#d93025', borderColor: '#d93025' }}
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPropertyModal && (
        <div className="modal-overlay" onClick={() => setShowAddPropertyModal(false)}>
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Property</h2>
              <button className="close-btn" onClick={() => setShowAddPropertyModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleAddProperty}>
                <div className="form-grid">
                <div className="form-group full-width">
                  <RequiredLabel>Address</RequiredLabel>
                  <input
                    type="text"
                    value={newProperty.address}
                    onChange={e => setNewProperty({...newProperty, address: e.target.value})}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="form-group">
                  <RequiredLabel>Property Type</RequiredLabel>
                  <select
                    value={newProperty.type}
                    onChange={e => setNewProperty({...newProperty, type: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Single Family">Single Family</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Apartment Complex">Apartment Complex</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="form-group">
                  <RequiredLabel>Total Units</RequiredLabel>
                  <input
                    type="number"
                    value={newProperty.units}
                    onChange={e => setNewProperty({...newProperty, units: e.target.value})}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <RequiredLabel required={false}>Occupied Units</RequiredLabel>
                  <input
                    type="number"
                    value={newProperty.occupied}
                    onChange={e => setNewProperty({...newProperty, occupied: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Revenue</label>
                  <input
                    type="number"
                    value={newProperty.monthlyRevenue}
                    onChange={e => setNewProperty({...newProperty, monthlyRevenue: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Owner</label>
                  <select
                    value={newProperty.ownerId || ''}
                    onChange={e => {
                      const ownerId = e.target.value || null;
                      const selectedOwnerObj = ownerId ? owners.find(o => o.id === ownerId) : null;
                      setNewProperty({
                        ...newProperty,
                        ownerId: ownerId,
                        ownerName: selectedOwnerObj ? selectedOwnerObj.name : '',
                        ownerEmail: selectedOwnerObj ? selectedOwnerObj.email : ''
                      });
                    }}
                  >
                    <option value="">Self-managed</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Owner Name (Legacy)</label>
                  <input
                    type="text"
                    value={newProperty.ownerName}
                    onChange={e => setNewProperty({...newProperty, ownerName: e.target.value})}
                    placeholder="Property owner name (for backward compatibility)"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Owner Email (Legacy)</label>
                  <input
                    type="email"
                    value={newProperty.ownerEmail}
                    onChange={e => setNewProperty({...newProperty, ownerEmail: e.target.value})}
                    placeholder="owner@example.com (for backward compatibility)"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Property Photo</label>
                  <div 
                    className="photo-upload-area"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('drag-over');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('drag-over');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        setNewProperty({...newProperty, photo: file});
                      }
                    }}
                  >
                    {newProperty.photo ? (
                      <div className="photo-preview">
                        <img 
                          src={URL.createObjectURL(newProperty.photo)} 
                          alt="Preview"
                          className="photo-preview-img"
                        />
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={() => setNewProperty({...newProperty, photo: null})}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-placeholder">
                        <span>📷</span>
                        <p>Drop photo here or click to select</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setNewProperty({...newProperty, photo: file});
                        }
                      }}
                      style={{ display: 'none' }}
                      id="new-property-photo-input"
                    />
                    <label htmlFor="new-property-photo-input" className="photo-upload-label">
                      {newProperty.photo ? 'Change Photo' : 'Select Photo'}
                    </label>
                  </div>
                </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddPropertyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Property
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddMaintenanceModal && (
        <div className="modal-overlay" onClick={() => setShowAddMaintenanceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Maintenance Request</h2>
              <button className="close-btn" onClick={() => setShowAddMaintenanceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddMaintenanceRequest}>
                <div className="form-group">
                  <RequiredLabel>Issue</RequiredLabel>
                  <input
                    type="text"
                    className="form-input"
                    value={newMaintenanceRequest.issue}
                    onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, issue: e.target.value})}
                    placeholder="e.g., Leaky faucet"
                    required
                  />
                </div>
                <div className="form-group">
                  <RequiredLabel>Property / Unit</RequiredLabel>
                  <input
                    type="text"
                    className="form-input"
                    value={newMaintenanceRequest.property}
                    onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, property: e.target.value})}
                    placeholder="e.g., 1420 Oak Street, Unit 3B"
                    required
                  />
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <RequiredLabel required={false}>Tenant Name</RequiredLabel>
                    <input
                      type="text"
                      className="form-input"
                      value={newMaintenanceRequest.tenantName}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, tenantName: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <RequiredLabel>Priority</RequiredLabel>
                    <select
                      className="form-select"
                      value={newMaintenanceRequest.priority}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, priority: e.target.value})}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newMaintenanceRequest.date}
                    onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={newMaintenanceRequest.description}
                    onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, description: e.target.value})}
                    rows="3"
                    placeholder="Detailed description of the issue..."
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddMaintenanceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showMoveOutModal && (
        <div className="modal-overlay" onClick={() => setShowMoveOutModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Move-Out - {tenants.find(t => t.id === showMoveOutModal)?.name}</h2>
              <button className="close-btn" onClick={() => setShowMoveOutModal(null)}>×</button>
            </div>
            <form onSubmit={(e) => handleMoveOut(showMoveOutModal, e)}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Move-Out Date</label>
                  <input
                    type="date"
                    value={moveOutData.date}
                    onChange={e => setMoveOutData({...moveOutData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Move-Out Condition Notes</label>
                  <textarea
                    value={moveOutData.notes}
                    onChange={e => setMoveOutData({...moveOutData, notes: e.target.value})}
                    rows="3"
                    placeholder="Describe the condition of the property at move-out..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Deposit Deductions</label>
                  {moveOutData.deductions.map((deduction, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 2 }}>
                        <input
                          type="text"
                          value={deduction.description}
                          onChange={e => {
                            const newDeductions = [...moveOutData.deductions];
                            newDeductions[index].description = e.target.value;
                            setMoveOutData({...moveOutData, deductions: newDeductions});
                          }}
                          placeholder="Description (e.g., Carpet cleaning, Wall repair)"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          value={deduction.amount}
                          onChange={e => {
                            const newDeductions = [...moveOutData.deductions];
                            newDeductions[index].amount = e.target.value;
                            setMoveOutData({...moveOutData, deductions: newDeductions});
                          }}
                          placeholder="Amount"
                          step="0.01"
                          min="0"
                          style={{ width: '100%' }}
                        />
                      </div>
                      {moveOutData.deductions.length > 1 && (
                        <button
                          type="button"
                          className="btn-danger btn-small"
                          onClick={() => {
                            const newDeductions = moveOutData.deductions.filter((_, i) => i !== index);
                            setMoveOutData({...moveOutData, deductions: newDeductions});
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setMoveOutData({...moveOutData, deductions: [...moveOutData.deductions, { description: '', amount: '' }]})}
                    style={{ marginTop: '0.5rem' }}
                  >
                    + Add Deduction
                  </button>
                </div>
                {(() => {
                  const tenant = tenants.find(t => t.id === showMoveOutModal);
                  if (!tenant) return null;
                  const totalDeductions = moveOutData.deductions
                    .filter(d => d.description && d.amount)
                    .reduce((sum, d) => sum + Number(d.amount) || 0, 0);
                  const refundAmount = Math.max(0, tenant.securityDeposit - totalDeductions);
                  return (
                    <div className="form-group full-width" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', marginTop: '1rem' }}>
                      <p><strong>Security Deposit:</strong> ${tenant.securityDeposit.toLocaleString()}</p>
                      <p><strong>Total Deductions:</strong> ${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        <strong>Refund Amount:</strong> ${refundAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMoveOutModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Move-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Rent Reminder</h2>
              <button className="close-btn" onClick={() => setShowReminderModal(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="reminder-email-preview">
                <div className="email-field">
                  <label><strong>To:</strong></label>
                  <span>{showReminderModal.email}</span>
                </div>
                <div className="email-field">
                  <label><strong>Subject:</strong></label>
                  <span>Rent Payment Reminder - {showReminderModal.property}</span>
                </div>
                <div className="email-field">
                  <label><strong>Body:</strong></label>
                  <div className="email-body-preview">
                    <p>Dear {showReminderModal.name},</p>
                    <p>This is a reminder that your rent payment for {showReminderModal.property} is currently overdue.</p>
                    <p><strong>Amount Due:</strong> ${showReminderModal.rentAmount.toLocaleString()}</p>
                    <p><strong>Property:</strong> {showReminderModal.property}</p>
                    <p>Please remit payment as soon as possible to avoid any additional fees.</p>
                    <p>Thank you,<br />Property Management</p>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowReminderModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => {
                    handleSendReminder(showReminderModal);
                    setShowReminderModal(null);
                  }}
                >
                  Open Email Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProperty && (
        <>
          <div className="panel-overlay" onClick={() => setSelectedProperty(null)}></div>
          <div className="slide-panel" onClick={e => e.stopPropagation()}>
            <div className="slide-panel-header">
              <h2>Property Details</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="btn-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProperty({
                      ...selectedProperty,
                      units: String(selectedProperty.units || ''),
                      occupied: String(selectedProperty.occupied || ''),
                      monthlyRevenue: String(selectedProperty.monthlyRevenue || ''),
                      photo: null
                    });
                    setSelectedProperty(null);
                  }}
                >
                  Edit
                </button>
                <button className="close-btn" onClick={() => setSelectedProperty(null)}>×</button>
              </div>
            </div>
            <div className="slide-panel-body">
              {/* Property Avatar/Icon with Photo Upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div 
                  onClick={() => document.getElementById('property-photo-input-detail').click()}
                  className="avatar avatar-lg"
                  style={{ 
                    background: selectedProperty.photoUrl ? 'transparent' : getAvatarColorByName(selectedProperty.address),
                    backgroundImage: selectedProperty.photoUrl ? `url(${selectedProperty.photoUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {!selectedProperty.photoUrl && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#1a73e8',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <span style={{ color: 'white', fontSize: '14px' }}>📷</span>
                  </div>
                </div>
                <input
                  id='property-photo-input-detail'
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      await handlePropertyPhotoUpdate(selectedProperty.id, file);
                      // Reload property data
                      const { data: propertyData } = await supabase
                        .from('properties')
                        .select('*')
                        .eq('id', selectedProperty.id)
                        .single();
                      if (propertyData) {
                        setSelectedProperty(transformProperty(propertyData));
                      }
                    } catch (err) {
                      console.error('Upload failed:', err);
                      alert('Failed to upload photo');
                    }
                    e.target.value = ''; // Reset input
                  }}
                />
              </div>

              {/* Property Name */}
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: '12px' }}>
                {selectedProperty.address}
              </h2>

              {/* Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <span className={`badge ${(selectedProperty.units || 0) - (selectedProperty.occupied || 0) === 0 ? 'badge-late' : 'badge-current'}`}>
                  {(selectedProperty.units || 0) - (selectedProperty.occupied || 0) === 0 ? 'Full' : 'Available'}
                </span>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* ADDRESS */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">ADDRESS</span>
                <div className="section-value">{selectedProperty.address}</div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* TYPE */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">TYPE</span>
                <div className="section-value">{selectedProperty.type || 'Not specified'}</div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* UNITS */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">UNITS</span>
                <div className="section-value">
                  {selectedProperty.occupied || 0} / {selectedProperty.units || 0} occupied
                </div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* MONTHLY REVENUE */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">MONTHLY REVENUE</span>
                <div className="section-value">${(selectedProperty.monthlyRevenue || 0).toLocaleString()}</div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* TAGS */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">TAGS</span>
                <div style={{ marginTop: '8px' }}>
                  <TagPicker
                    recordType="property"
                    recordId={selectedProperty.id}
                    onTagsChange={async () => {
                      await refreshData();
                      const { data: propertyData } = await supabase
                        .from('properties')
                        .select('*')
                        .eq('id', selectedProperty.id)
                        .single();
                      if (propertyData) {
                        setSelectedProperty(transformProperty(propertyData));
                      }
                    }}
                  />
                </div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* Files Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="section-label">FILES</span>
                  <button
                    onClick={() => document.getElementById('property-file-input').click()}
                    className="btn-text"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    + Add File
                  </button>
                </div>
                <input
                  id='property-file-input'
                  type='file'
                  multiple
                  accept='.pdf,.doc,.docx,.jpg,.png,.jpeg'
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    try {
                      for (const file of files) {
                        await uploadDocument(file, 'property', selectedProperty.id, 'document');
                      }
                      const updated = await loadFilesForRecord('property', selectedProperty.id);
                      setPropertyFiles(updated);
                    } catch (err) {
                      console.error('Upload failed:', err);
                      alert('Failed to upload file(s)');
                    }
                    e.target.value = ''; // Reset input
                  }}
                />
                {propertyFiles.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No files uploaded</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {propertyFiles.map(file => (
                      <div 
                        key={file.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>📄</span>
                          <span style={{ fontSize: '14px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.file_name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                            {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const url = await getDocumentUrl(file.storage_path);
                                window.open(url, '_blank');
                              } catch (err) {
                                console.error('Error downloading file:', err);
                                alert('Failed to download file');
                              }
                            }} 
                            className="btn-text"
                            style={{ padding: '4px 8px', fontSize: '14px' }}
                            title="Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this file?')) {
                                try {
                                  await deleteFile(file.id, file.storage_path);
                                  setPropertyFiles(propertyFiles.filter(f => f.id !== file.id));
                                } catch (err) {
                                  console.error('Error deleting file:', err);
                                  alert('Failed to delete file');
                                }
                              }
                            }} 
                            className="btn-text"
                            style={{ padding: '4px 8px', fontSize: '14px', color: '#dc2626' }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="slide-panel-footer">
              <button 
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProperty({
                    ...selectedProperty,
                    units: String(selectedProperty.units || ''),
                    occupied: String(selectedProperty.occupied || ''),
                    monthlyRevenue: String(selectedProperty.monthlyRevenue || ''),
                    photo: null
                  });
                  setSelectedProperty(null);
                }}
              >
                Edit Property
              </button>
              <button 
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProperty(null);
                  setActiveTab('tenants');
                  setFilterStatus('all');
                  setTenantSearchQuery(selectedProperty.address);
                }}
              >
                View Tenants
              </button>
            </div>
          </div>
        </>
      )}

      {/* Maintenance Request Detail Panel */}
      {selectedMaintenanceRequest && (
        <>
          <div className="panel-overlay" onClick={() => setSelectedMaintenanceRequest(null)}></div>
          <div className="slide-panel" onClick={e => e.stopPropagation()}>
            <div className="slide-panel-header">
              <div>
                <h2>{selectedMaintenanceRequest.issue}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span className="badge" style={getPriorityBadgeStyle(selectedMaintenanceRequest.priority)}>
                    {(selectedMaintenanceRequest.priority || 'medium').toUpperCase()}
                  </span>
                  <span className="badge" style={getMaintenanceStatusBadgeStyle(selectedMaintenanceRequest.status)}>
                    {getMaintenanceStatusDisplay(selectedMaintenanceRequest.status)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn-text" onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open edit modal
                }}>
                  Edit
                </button>
                <button className="close-btn" onClick={() => setSelectedMaintenanceRequest(null)}>×</button>
              </div>
            </div>
            <div className="slide-panel-body">
              {/* PROPERTY */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">PROPERTY</span>
                <div className="section-value">{selectedMaintenanceRequest.property || 'Not specified'}</div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* TENANT */}
              {selectedMaintenanceRequest.tenantName && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <span className="section-label">TENANT</span>
                    <div className="section-value">{selectedMaintenanceRequest.tenantName}</div>
                  </div>
                  <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>
                </>
              )}

              {/* CREATED */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">CREATED</span>
                <div className="section-value">
                  {selectedMaintenanceRequest.date ? new Date(selectedMaintenanceRequest.date).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>

              {/* DESCRIPTION */}
              {selectedMaintenanceRequest.description && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <span className="section-label">DESCRIPTION</span>
                    <div className="section-value" style={{ marginTop: '8px', lineHeight: '1.5' }}>
                      {selectedMaintenanceRequest.description}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }}></div>
                </>
              )}

              {/* TAGS */}
              <div style={{ marginBottom: '24px' }}>
                <span className="section-label">TAGS</span>
                <div style={{ marginTop: '8px' }}>
                  <TagPicker
                    recordType="maintenance"
                    recordId={selectedMaintenanceRequest.id}
                    onTagsChange={async () => {
                      await refreshData();
                      const { data: maintenanceData } = await supabase
                        .from('maintenance_requests')
                        .select('*')
                        .eq('id', selectedMaintenanceRequest.id)
                        .single();
                      if (maintenanceData) {
                        setSelectedMaintenanceRequest(transformMaintenanceRequest(maintenanceData));
                      }
                    }}
                  />
                </div>
              </div>

            </div>
            <div className="slide-panel-footer">
              <button className="btn btn-secondary" onClick={(e) => {
                e.stopPropagation();
                // TODO: Update status
              }}>
                Update Status
              </button>
              <button className="btn btn-secondary" onClick={(e) => {
                e.stopPropagation();
                // TODO: Assign vendor
              }}>
                Assign Vendor
              </button>
              <button className="btn btn-primary" onClick={(e) => {
                e.stopPropagation();
                // TODO: Edit
              }}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this maintenance request?')) {
                  // TODO: Delete
                }
              }}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Owner Modal */}
      {showAddOwnerModal && (
        <div className="modal-overlay" onClick={() => setShowAddOwnerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Owner</h2>
              <button className="close-btn" onClick={() => setShowAddOwnerModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddOwner}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newOwner.name}
                    onChange={e => setNewOwner({...newOwner, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newOwner.email}
                    onChange={e => setNewOwner({...newOwner, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newOwner.phone}
                    onChange={e => setNewOwner({...newOwner, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Management Fee %</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newOwner.managementFeePercent}
                    onChange={e => setNewOwner({...newOwner, managementFeePercent: parseFloat(e.target.value) || 10})}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mailing Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newOwner.address}
                    onChange={e => setNewOwner({...newOwner, address: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={newOwner.portalEnabled}
                      onChange={e => setNewOwner({...newOwner, portalEnabled: e.target.checked})}
                      style={{ cursor: 'pointer' }}
                    />
                    Enable Owner Portal
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddOwnerModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Owner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Owner Modal */}
      {showEditOwnerModal && selectedOwner && (
        <div className="modal-overlay" onClick={() => {
          setShowEditOwnerModal(false);
          setSelectedOwner(null);
        }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Owner</h2>
              <button className="close-btn" onClick={() => {
                setShowEditOwnerModal(false);
                setSelectedOwner(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateOwner}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedOwner.name}
                    onChange={e => setSelectedOwner({...selectedOwner, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={selectedOwner.email}
                    onChange={e => setSelectedOwner({...selectedOwner, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={selectedOwner.phone}
                    onChange={e => setSelectedOwner({...selectedOwner, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Management Fee %</label>
                  <input
                    type="number"
                    className="form-input"
                    value={selectedOwner.managementFeePercent}
                    onChange={e => setSelectedOwner({...selectedOwner, managementFeePercent: parseFloat(e.target.value) || 10})}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mailing Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedOwner.address}
                    onChange={e => setSelectedOwner({...selectedOwner, address: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={selectedOwner.portalEnabled}
                      onChange={e => handleToggleOwnerPortal(selectedOwner.id, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Enable Owner Portal
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowEditOwnerModal(false);
                    setSelectedOwner(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Owner Detail Modal */}
      {selectedOwner && !showEditOwnerModal && (
        <div className="modal-overlay" onClick={() => setSelectedOwner(null)}>
          <div className="modal tenant-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-fixed">
              <div className="modal-header-content">
                <h2>{selectedOwner.name}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditOwnerModal(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Edit
                </button>
                <button className="close-btn" onClick={() => setSelectedOwner(null)}>×</button>
              </div>
            </div>
            <div className="tenant-detail-view modal-content-scrollable">
              <div className="detail-section">
                <h4>Owner Information</h4>
                <div className="property-info-grid">
                  <div className="info-item">
                    <span className="info-label">Email: </span>
                    <span className="info-value">{selectedOwner.email}</span>
                  </div>
                  {selectedOwner.phone && (
                    <div className="info-item">
                      <span className="info-label">Phone: </span>
                      <span className="info-value">{selectedOwner.phone}</span>
                    </div>
                  )}
                  {selectedOwner.address && (
                    <div className="info-item">
                      <span className="info-label">Address: </span>
                      <span className="info-value">{selectedOwner.address}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Management Fee: </span>
                    <span className="info-value">{selectedOwner.managementFeePercent}%</span>
                  </div>
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="detail-section">
                <h4>Properties</h4>
                {properties.filter(p => p.ownerId === selectedOwner.id).length > 0 ? (
                  <div className="property-tenants-list">
                    {properties
                      .filter(p => p.ownerId === selectedOwner.id)
                      .map(property => (
                        <div key={property.id} className="property-tenant-card">
                          <div className="property-tenant-card-header">
                            <div>
                              <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: '500' }}>{property.address}</h4>
                              <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>{property.type || 'Property'}</p>
                            </div>
                          </div>
                          <div className="property-tenant-card-details">
                            <div className="property-tenant-detail-item">
                              <span className="property-tenant-label">Units:</span>
                              <span className="property-tenant-value">{property.units}</span>
                            </div>
                            <div className="property-tenant-detail-item">
                              <span className="property-tenant-label">Monthly Revenue:</span>
                              <span className="property-tenant-value">${property.monthlyRevenue.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p style={{ color: '#5f6368', fontSize: '14px' }}>No properties assigned to this owner.</p>
                )}
              </div>

              <div className="section-divider"></div>

              <div className="detail-section">
                <h4>Portal Access</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#202124', marginBottom: '4px' }}>Owner Portal</div>
                      <div style={{ fontSize: '12px', color: '#5f6368' }}>
                        {selectedOwner.portalEnabled ? 'Portal is enabled' : 'Portal is disabled'}
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedOwner.portalEnabled}
                        onChange={e => handleToggleOwnerPortal(selectedOwner.id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#202124' }}>Enable</span>
                    </label>
                  </div>
                  {selectedOwner.portalEnabled && (
                    <>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            const link = getOwnerPortalLink(selectedOwner);
                            navigator.clipboard.writeText(link);
                            alert('Portal link copied to clipboard!');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            fontSize: '14px'
                          }}
                        >
                          Copy Portal Link
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => sendOwnerPortalInvite(selectedOwner)}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            fontSize: '14px'
                          }}
                        >
                          Send Portal Invite
                        </button>
                      </div>
                      {selectedOwner.lastLogin && (
                        <div style={{ fontSize: '12px', color: '#5f6368' }}>
                          Last login: {new Date(selectedOwner.lastLogin).toLocaleString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Tag Modal */}
      {showCreateTagModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateTagModal(false);
          setNewTag({ name: '', color: 'blue' });
        }}>
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Tag</h2>
              <button className="close-btn" onClick={() => {
                setShowCreateTagModal(false);
                setNewTag({ name: '', color: 'blue' });
              }}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const tagData = await createTag(newTag.name, newTag.color);
                if (tagData) {
                  setShowCreateTagModal(false);
                  setNewTag({ name: '', color: 'blue' });
                }
                // If tagData is null, error was already logged in createTag
              }}>
                <div className="form-group full-width">
                  <label>Tag name</label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => {
                      // Auto-convert spaces to underscores and lowercase
                      const value = e.target.value.toLowerCase().replace(/\s+/g, '_');
                      setNewTag({ ...newTag, name: value });
                    }}
                    placeholder="e.g., late_payment"
                    required
                    pattern="[a-z0-9_]+"
                    title="Tag name must be lowercase letters, numbers, and underscores only"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#202124'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#5f6368', margin: '4px 0 0 0' }}>
                    Use lowercase letters, numbers, and underscores only. Spaces will be converted to underscores.
                  </p>
                </div>

                <div className="form-group full-width">
                  <label>Color</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '8px' }}>
                    {[
                      { name: 'blue', hex: '#1a73e8' },
                      { name: 'green', hex: '#10b981' },
                      { name: 'yellow', hex: '#fbbf24' },
                      { name: 'orange', hex: '#f97316' },
                      { name: 'red', hex: '#ef4444' },
                      { name: 'purple', hex: '#a855f7' },
                      { name: 'teal', hex: '#14b8a6' },
                      { name: 'gray', hex: '#6b7280' }
                    ].map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setNewTag({ ...newTag, color: color.name })}
                        style={{
                          width: '100%',
                          height: '48px',
                          background: newTag.color === color.name ? color.hex : '#f8f9fa',
                          border: newTag.color === color.name ? `3px solid ${color.hex}` : '2px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (newTag.color !== color.name) {
                            e.currentTarget.style.borderColor = color.hex;
                            e.currentTarget.style.background = color.hex + '20';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (newTag.color !== color.name) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#f8f9fa';
                          }
                        }}
                        title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                      >
                        {newTag.color === color.name && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Preview */}
                <div className="form-group full-width" style={{ marginTop: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#5f6368', marginBottom: '8px', display: 'block' }}>Preview</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {newTag.name ? (
                      <>
                        <div
                          style={{
                            background: (() => {
                              const colorMap = {
                                blue: '#1a73e8',
                                green: '#10b981',
                                yellow: '#fbbf24',
                                orange: '#f97316',
                                red: '#ef4444',
                                purple: '#a855f7',
                                teal: '#14b8a6',
                                gray: '#6b7280'
                              };
                              return colorMap[newTag.color] || colorMap.blue;
                            })(),
                            color: '#fff',
                            padding: '6px 16px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'inline-block'
                          }}
                        >
                          {newTag.name}
                        </div>
                        <span style={{ fontSize: '12px', color: '#5f6368' }}>(0)</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '14px', color: '#9aa0a6', fontStyle: 'italic' }}>Enter a tag name to see preview</span>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateTagModal(false);
                      setNewTag({ name: '', color: 'blue' });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Tag
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tag Menu */}
      {quickTagMenu.recordType && quickTagMenu.recordId && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setQuickTagMenu({ recordType: null, recordId: null, x: 0, y: 0 })}
          />
          <div
            style={{
              position: 'fixed',
              top: quickTagMenu.y,
              left: quickTagMenu.x,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '200px',
              maxWidth: '300px',
              padding: '8px 0',
              transform: 'translateY(-100%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e5e7eb', marginBottom: '4px' }}>
              Quick Tag
            </div>
            {getMostRecentTags().length > 0 ? (
              <>
                {getMostRecentTags().map(tag => {
                  const existingTags = getTagsForRecord(quickTagMenu.recordType, quickTagMenu.recordId);
                  const isApplied = existingTags.some(t => t.id === tag.id);
                  const colorMap = {
                    blue: '#1a73e8',
                    green: '#10b981',
                    yellow: '#fbbf24',
                    orange: '#f97316',
                    red: '#ef4444',
                    purple: '#a855f7',
                    teal: '#14b8a6',
                    gray: '#6b7280'
                  };
                  return (
                    <div
                      key={tag.id}
                      onClick={async () => {
                        if (isApplied) {
                          await removeTagFromRecord(tag.id, quickTagMenu.recordType, quickTagMenu.recordId);
                        } else {
                          await addTagToRecord(tag.id, quickTagMenu.recordType, quickTagMenu.recordId);
                        }
                        setQuickTagMenu({ recordType: null, recordId: null, x: 0, y: 0 });
                        await refreshData();
                      }}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#1f2937',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: colorMap[tag.color] || colorMap.blue,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ flex: 1 }}>{tag.name}</span>
                      {isApplied && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px', paddingTop: '4px' }}>
                  <div
                    onClick={() => {
                      // Open the detail modal to show full tag picker
                      if (quickTagMenu.recordType === 'tenant') {
                        const tenant = tenants.find(t => t.id === quickTagMenu.recordId);
                        if (tenant) {
                          setSelectedTenant(tenant);
                          loadFilesForRecord('tenant', tenant.id).then(files => {
                            setTenantFiles(files);
                          });
                        }
                      } else if (quickTagMenu.recordType === 'property') {
                        const property = properties.find(p => p.id === quickTagMenu.recordId);
                        if (property) {
                          setSelectedProperty(property);
                          loadFilesForRecord('property', property.id).then(files => {
                            setPropertyFiles(files);
                          });
                        }
                      } else if (quickTagMenu.recordType === 'maintenance') {
                        const request = maintenanceRequests.find(r => r.id === quickTagMenu.recordId);
                        if (request) setSelectedMaintenanceRequest(request);
                      }
                      setQuickTagMenu({ recordType: null, recordId: null, x: 0, y: 0 });
                    }}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#1a73e8',
                      fontWeight: '500',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    More...
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '8px 16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                No tags available
              </div>
            )}
          </div>
        </>
      )}

      {/* Onboarding Wizard */}
      {showOnboardingWizard && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'white',
          zIndex: 2000,
          overflow: 'auto'
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
            {/* Step Indicator */}
            {(() => {
              const steps = [
                { num: 1, title: 'Property' },
                { num: 2, title: 'Tenant' },
                { num: 3, title: 'Lease' },
                { num: 4, title: 'Documents' },
                { num: 5, title: 'Move-In' },
                { num: 6, title: 'Review' }
              ];

              return (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                  {steps.map((step, i) => (
                    <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: onboardingStep >= step.num ? '#1a73e8' : '#e5e7eb',
                        color: onboardingStep >= step.num ? 'white' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 14,
                        flexShrink: 0
                      }}>
                        {onboardingStep > step.num ? '✓' : step.num}
                      </div>
                      <span style={{ marginLeft: 8, fontSize: 14, color: onboardingStep >= step.num ? '#1f2937' : '#9ca3af', whiteSpace: 'nowrap' }}>
                        {step.title}
                      </span>
                      {i < steps.length - 1 && (
                        <div style={{ width: 40, height: 2, background: onboardingStep > step.num ? '#1a73e8' : '#e5e7eb', marginLeft: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Step Content */}
            <div style={{ minHeight: '400px' }}>
              {/* Step 1 - Select Property */}
              {onboardingStep === 1 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Select Property & Unit</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Choose where the tenant will live</p>
                  
                  {/* Property Dropdown */}
                  <div className='form-group'>
                    <RequiredLabel>Property</RequiredLabel>
                    <select
                      className='form-select'
                      value={onboardingData.property?.id || ''}
                      onChange={(e) => {
                        const selectedProperty = properties.find(p => String(p.id) === e.target.value);
                        setOnboardingData({
                          ...onboardingData,
                          property: selectedProperty || null,
                          unit: '' // Reset unit when property changes
                        });
                      }}
                      style={{ padding: '12px', fontSize: 15 }}
                    >
                      <option value=''>Select a property...</option>
                      {properties.map(property => {
                        const availableUnits = (property.units || property.total_units || 1) - (property.occupied || property.occupied_units || 0);
                        const propertyType = property.type || property.property_type || 'Single-family';
                        return (
                          <option key={property.id} value={property.id}>
                            {property.address} ({propertyType}) - {availableUnits} available
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {/* Conditional Unit Selection */}
                  {onboardingData.property && (
                    <div className='form-group' style={{ marginTop: 20 }}>
                      {/* Check if multi-unit property */}
                      {((onboardingData.property.units || onboardingData.property.total_units || 0) > 1 || 
                        ['Multi-Family', 'Multi-family', 'Townhouse', 'Duplex', 'Apartment Complex'].includes(onboardingData.property.type || onboardingData.property.property_type)) ? (
                        <>
                          <RequiredLabel>Select Unit</RequiredLabel>
                          <select
                            className='form-select'
                            value={onboardingData.unit}
                            onChange={(e) => setOnboardingData({ ...onboardingData, unit: e.target.value })}
                            style={{ padding: '12px', fontSize: 15 }}
                          >
                            <option value=''>Select an available unit...</option>
                            {getAvailableUnits(onboardingData.property).map(unit => (
                              <option key={unit} value={unit}>
                                Unit {unit}
                              </option>
                            ))}
                          </select>
                          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                            {getAvailableUnits(onboardingData.property).length} unit(s) available
                          </p>
                        </>
                      ) : (
                        <>
                          {/* Single-family - auto-assign */}
                          <div style={{ 
                            padding: 16, 
                            background: '#f0fdf4', 
                            borderRadius: 8,
                            border: '1px solid #bbf7d0'
                          }}>
                            <p style={{ color: '#166534', margin: 0 }}>
                              ✓ Single-family property selected. Unit will be assigned automatically.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Property Preview Card */}
                  {onboardingData.property && (
                    <div style={{ 
                      marginTop: 24, 
                      padding: 16, 
                      background: '#f9fafb', 
                      borderRadius: 8,
                      border: '1px solid #e5e7eb'
                    }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Selected Property</h4>
                      <p style={{ margin: 0, fontWeight: 500 }}>{onboardingData.property.address}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                        {onboardingData.property.type || onboardingData.property.property_type || 'Single-family'} • 
                        ${(onboardingData.property.monthlyRevenue || 0).toLocaleString()}/mo
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 - Tenant Info */}
              {onboardingStep === 2 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Tenant Information</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Enter new tenant details or select existing prospect</p>
                  
                  {/* Toggle between new and existing */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <button
                      type="button"
                      onClick={() => setOnboardingData({ ...onboardingData, tenant: { ...onboardingData.tenant, isExisting: false } })}
                      className={onboardingData.tenant.isExisting ? 'btn btn-secondary' : 'btn btn-primary'}
                    >
                      New Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingData({ ...onboardingData, tenant: { ...onboardingData.tenant, isExisting: true } })}
                      className={onboardingData.tenant.isExisting ? 'btn btn-primary' : 'btn btn-secondary'}
                    >
                      Existing Prospect
                    </button>
                  </div>
                  
                  {onboardingData.tenant.isExisting ? (
                    <div className='form-group'>
                      <RequiredLabel>Select Prospect</RequiredLabel>
                      <select
                        className='form-select'
                        value={onboardingData.tenant.existingId || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const prospect = tenants.find(t => String(t.id) === selectedId && t.status === 'prospect');
                          
                          if (prospect) {
                            setOnboardingData({
                              ...onboardingData,
                              tenant: {
                                ...onboardingData.tenant,
                                isExisting: true,
                                existingId: selectedId,
                                name: prospect.name || '',
                                email: prospect.email || '',
                                phone: prospect.phone || ''
                              }
                            });
                          } else if (!selectedId) {
                            // Clear selection
                            setOnboardingData({
                              ...onboardingData,
                              tenant: {
                                ...onboardingData.tenant,
                                existingId: null,
                                name: '',
                                email: '',
                                phone: ''
                              }
                            });
                          }
                        }}
                      >
                        <option value=''>Select a prospect...</option>
                        {tenants.filter(t => t.status === 'prospect').map(t => (
                          <option key={t.id} value={t.id}>{t.name} - {t.email || t.phone || 'No contact'}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className='two-col'>
                      <div className='form-group'>
                        <RequiredLabel>Full Name</RequiredLabel>
                        <input
                          type='text'
                          className='form-input'
                          value={onboardingData.tenant.name}
                          onChange={(e) => setOnboardingData({
                            ...onboardingData,
                            tenant: { ...onboardingData.tenant, name: e.target.value }
                          })}
                          placeholder='Enter tenant name'
                        />
                      </div>
                      <div className='form-group'>
                        <RequiredLabel required={false}>Phone</RequiredLabel>
                        <input
                          type='tel'
                          className='form-input'
                          value={onboardingData.tenant.phone}
                          onChange={(e) => setOnboardingData({
                            ...onboardingData,
                            tenant: { ...onboardingData.tenant, phone: e.target.value }
                          })}
                          placeholder='(optional)'
                        />
                      </div>
                      <div className='form-group' style={{ gridColumn: 'span 2' }}>
                        <RequiredLabel>Email</RequiredLabel>
                        <input
                          type='email'
                          className='form-input'
                          value={onboardingData.tenant.email}
                          onChange={(e) => setOnboardingData({
                            ...onboardingData,
                            tenant: { ...onboardingData.tenant, email: e.target.value }
                          })}
                          placeholder='tenant@email.com'
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 - Lease Details */}
              {onboardingStep === 3 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Lease Details</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Set the terms of the lease agreement</p>
                  
                  <div style={{ marginBottom: 24 }}>
                    <label className='form-label'>Lease Type</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setOnboardingData({ ...onboardingData, lease: { ...onboardingData.lease, leaseType: 'fixed' } })}
                        className={onboardingData.lease.leaseType === 'fixed' ? 'btn btn-primary' : 'btn btn-secondary'}
                      >
                        Fixed Term
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnboardingData({ ...onboardingData, lease: { ...onboardingData.lease, leaseType: 'month-to-month' } })}
                        className={onboardingData.lease.leaseType === 'month-to-month' ? 'btn btn-primary' : 'btn btn-secondary'}
                      >
                        Month-to-Month
                      </button>
                    </div>
                  </div>
                  
                  <div className='two-col'>
                    <div className='form-group'>
                      <RequiredLabel>Monthly Rent</RequiredLabel>
                      <input
                        type='number'
                        className='form-input'
                        placeholder='0.00'
                        step='0.01'
                        value={onboardingData.lease.monthlyRent}
                        onChange={(e) => setOnboardingData({
                          ...onboardingData,
                          lease: { ...onboardingData.lease, monthlyRent: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div className='form-group'>
                      <RequiredLabel required={false}>Security Deposit</RequiredLabel>
                      <input
                        type='number'
                        className='form-input'
                        placeholder='0.00'
                        step='0.01'
                        value={onboardingData.lease.securityDeposit}
                        onChange={(e) => setOnboardingData({
                          ...onboardingData,
                          lease: { ...onboardingData.lease, securityDeposit: e.target.value }
                        })}
                      />
                    </div>
                    <div className='form-group'>
                      <RequiredLabel>Lease Start Date</RequiredLabel>
                      <input
                        type='date'
                        className='form-input'
                        value={onboardingData.lease.startDate}
                        onChange={(e) => setOnboardingData({
                          ...onboardingData,
                          lease: { ...onboardingData.lease, startDate: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div className='form-group'>
                      <RequiredLabel required={onboardingData.lease.leaseType === 'fixed'}>Lease End Date</RequiredLabel>
                      <input
                        type='date'
                        className='form-input'
                        value={onboardingData.lease.endDate}
                        onChange={(e) => setOnboardingData({
                          ...onboardingData,
                          lease: { ...onboardingData.lease, endDate: e.target.value }
                        })}
                        disabled={onboardingData.lease.leaseType === 'month-to-month'}
                        required={onboardingData.lease.leaseType === 'fixed'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 - Documents */}
              {onboardingStep === 4 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Upload Documents</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Add lease agreement and other required documents</p>
                  
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                    <input
                      type='file'
                      id='onboarding-docs'
                      multiple
                      accept='.pdf,.doc,.docx,.jpg,.png'
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setOnboardingData({
                          ...onboardingData,
                          documents: [...onboardingData.documents, ...files]
                        });
                        e.target.value = ''; // Reset input
                      }}
                    />
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                    <p style={{ marginBottom: 16, color: '#6b7280' }}>Drag and drop files here, or</p>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('onboarding-docs').click()} 
                      className='btn btn-primary'
                    >
                      Browse Files
                    </button>
                  </div>
                  
                  {onboardingData.documents.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Uploaded Documents</h3>
                      {onboardingData.documents.map((doc, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 14 }}>📄 {doc.name}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setOnboardingData({
                                ...onboardingData,
                                documents: onboardingData.documents.filter((_, idx) => idx !== i)
                              });
                            }} 
                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5 - Move-In */}
              {onboardingStep === 5 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Schedule Move-In</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Set the move-in date and add any notes</p>
                  
                  <div className='form-group'>
                    <RequiredLabel>Move-In Date</RequiredLabel>
                    <input
                      type='date'
                      className='form-input'
                      value={onboardingData.moveInDate}
                      onChange={(e) => setOnboardingData({ ...onboardingData, moveInDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className='form-group'>
                    <label className='form-label'>Move-In Condition Notes</label>
                    <textarea
                      className='form-textarea'
                      rows={4}
                      placeholder='Document the condition of the unit at move-in...'
                      value={onboardingData.moveInNotes}
                      onChange={(e) => setOnboardingData({ ...onboardingData, moveInNotes: e.target.value })}
                    />
                  </div>
                  
                  <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, marginTop: 24 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: 8 }}>📋 Move-In Checklist</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#78350f' }}>
                      <li>Take photos of unit condition</li>
                      <li>Test all appliances</li>
                      <li>Check smoke detectors</li>
                      <li>Provide keys and access codes</li>
                      <li>Review lease terms with tenant</li>
                      <li>Collect first month rent and deposit</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 6 - Review & Complete */}
              {onboardingStep === 6 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Review & Complete</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Confirm all details before onboarding the tenant</p>
                  
                  <div style={{ background: '#f9fafb', padding: 24, borderRadius: 12 }}>
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Property</h4>
                      <p style={{ fontWeight: 600 }}>{onboardingData.property?.address || 'Not selected'}, {onboardingData.unit ? `Unit ${onboardingData.unit}` : 'No unit specified'}</p>
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Tenant</h4>
                      <p style={{ fontWeight: 600 }}>{onboardingData.tenant.name || 'Not specified'}</p>
                      {(onboardingData.tenant.email || onboardingData.tenant.phone) && (
                        <p style={{ fontSize: 14, color: '#6b7280' }}>
                          {onboardingData.tenant.email || ''} {onboardingData.tenant.email && onboardingData.tenant.phone ? '•' : ''} {onboardingData.tenant.phone || ''}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Lease Terms</h4>
                      <p><strong>Rent:</strong> ${parseFloat(onboardingData.lease.monthlyRent || 0).toLocaleString()}/month</p>
                      <p><strong>Deposit:</strong> ${parseFloat(onboardingData.lease.securityDeposit || 0).toLocaleString()}</p>
                      <p><strong>Period:</strong> {onboardingData.lease.startDate || 'Not set'} to {onboardingData.lease.endDate || (onboardingData.lease.leaseType === 'month-to-month' ? 'Month-to-Month' : 'Not set')}</p>
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Move-In</h4>
                      <p>{onboardingData.moveInDate || 'Not scheduled'}</p>
                    </div>
                    
                    <div>
                      <h4 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Documents</h4>
                      <p>{onboardingData.documents.length} file(s) uploaded</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={() => onboardingStep === 1 ? setShowOnboardingWizard(false) : setOnboardingStep(onboardingStep - 1)}
                className='btn btn-secondary'
              >
                {onboardingStep === 1 ? 'Cancel' : 'Back'}
              </button>
              
              <button
                type="button"
                onClick={validateAndContinue}
                className='btn btn-primary'
              >
                {onboardingStep === 6 ? 'Complete Onboarding' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offboarding Wizard */}
      {showOffboardingWizard && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'white',
          zIndex: 2000,
          overflow: 'auto'
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
            {/* Step Indicator */}
            {(() => {
              const offboardingSteps = [
                { num: 1, title: 'Select Tenant' },
                { num: 2, title: 'Move-Out Date' },
                { num: 3, title: 'Inspection' },
                { num: 4, title: 'Deposit' },
                { num: 5, title: 'Statement' },
                { num: 6, title: 'Complete' }
              ];
              
              return (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                  {offboardingSteps.map((step, i) => (
                    <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: offboardingStep >= step.num ? '#ef4444' : '#e5e7eb', color: offboardingStep >= step.num ? 'white' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                        {offboardingStep > step.num ? '✓' : step.num}
                      </div>
                      <span style={{ marginLeft: 8, fontSize: 14, color: offboardingStep >= step.num ? '#1f2937' : '#9ca3af' }}>
                        {step.title}
                      </span>
                      {i < offboardingSteps.length - 1 && (
                        <div style={{ width: 40, height: 2, background: offboardingStep > step.num ? '#ef4444' : '#e5e7eb', marginLeft: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Step Content */}
            <div style={{ minHeight: '400px' }}>
              {/* Step 1 - Select Tenant */}
              {offboardingStep === 1 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Select Tenant to Move Out</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Choose which tenant is moving out</p>
                  
                  <div className='form-group'>
                    <RequiredLabel>Tenant</RequiredLabel>
                    <select
                      className='form-select'
                      value={offboardingData.tenant?.id || ''}
                      onChange={(e) => {
                        const selected = tenants.find(t => String(t.id) === e.target.value && (t.status === 'current' || t.status === 'Current'));
                        if (selected) {
                          const property = properties.find(p => p.id === selected.property_id || p.address === selected.property);
                          setOffboardingData({
                            ...offboardingData,
                            tenant: {
                              ...selected,
                              property_name: property?.name || property?.address || selected.property || 'Unknown',
                              security_deposit: selected.securityDeposit || selected.security_deposit || 0,
                              rent: selected.rentAmount || selected.rent || 0,
                              lease_end: selected.leaseEnd || selected.lease_end || null,
                              unit: selected.unit || ''
                            }
                          });
                        }
                      }}
                    >
                      <option value=''>Select a current tenant...</option>
                      {tenants.filter(t => t.status === 'current' || t.status === 'Current').map(t => {
                        const property = properties.find(p => p.id === t.property_id || p.address === t.property);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} - {property?.name || property?.address || t.property || 'Unknown'}, Unit {t.unit || 'N/A'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {offboardingData.tenant && (
                    <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, marginTop: 16, border: '1px solid #fecaca' }}>
                      <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#991b1b' }}>Tenant Selected for Move-Out</h4>
                      <p style={{ margin: 0, fontWeight: 500 }}>{offboardingData.tenant.name}</p>
                      <p style={{ margin: '4px 0', fontSize: 14, color: '#6b7280' }}>{offboardingData.tenant.email}</p>
                      <p style={{ margin: '4px 0', fontSize: 14, color: '#6b7280' }}>
                        {offboardingData.tenant.property_name}, Unit {offboardingData.tenant.unit}
                      </p>
                      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                        <div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Monthly Rent</span>
                          <p style={{ margin: 0, fontWeight: 600 }}>${offboardingData.tenant.rent || 0}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Security Deposit</span>
                          <p style={{ margin: 0, fontWeight: 600 }}>${offboardingData.tenant.security_deposit || 0}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Lease End</span>
                          <p style={{ margin: 0, fontWeight: 600 }}>{offboardingData.tenant.lease_end || 'Month-to-month'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 - Move-Out Date & Reason */}
              {offboardingStep === 2 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Set Move-Out Date</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>When is the tenant moving out?</p>
                  
                  <div className='two-col'>
                    <div className='form-group'>
                      <RequiredLabel>Move-Out Date</RequiredLabel>
                      <input
                        type='date'
                        className='form-input'
                        value={offboardingData.moveOutDate}
                        onChange={(e) => setOffboardingData({ ...offboardingData, moveOutDate: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className='form-group'>
                      <label className='form-label'>Reason for Moving</label>
                      <select
                        className='form-select'
                        value={offboardingData.reason}
                        onChange={(e) => setOffboardingData({ ...offboardingData, reason: e.target.value })}
                      >
                        <option value=''>Select reason...</option>
                        <option value='lease-end'>Lease ended - not renewing</option>
                        <option value='relocation'>Job relocation</option>
                        <option value='purchase'>Purchased a home</option>
                        <option value='upgrade'>Moving to larger space</option>
                        <option value='downgrade'>Moving to smaller space</option>
                        <option value='eviction'>Eviction</option>
                        <option value='mutual'>Mutual agreement - early termination</option>
                        <option value='other'>Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className='form-group'>
                    <label className='form-label'>Forwarding Address (for deposit refund)</label>
                    <textarea
                      className='form-textarea'
                      rows={2}
                      placeholder='Enter the address where the deposit check should be mailed...'
                      value={offboardingData.forwardingAddress}
                      onChange={(e) => setOffboardingData({ ...offboardingData, forwardingAddress: e.target.value })}
                    />
                  </div>
                  
                  {offboardingData.moveOutDate && (
                    <div style={{ background: '#fef7e0', padding: 16, borderRadius: 8, marginTop: 16 }}>
                      <p style={{ margin: 0, fontSize: 14 }}>
                        <strong>Note:</strong> You have until {new Date(new Date(offboardingData.moveOutDate).getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString()} (21 days) to return the security deposit with an itemized statement.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 - Move-Out Inspection */}
              {offboardingStep === 3 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Move-Out Inspection</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Document the condition of the unit</p>
                  
                  <div style={{ background: '#f9fafb', padding: 20, borderRadius: 8, marginBottom: 24 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Inspection Checklist</h4>
                    
                    {[
                      { key: 'wallsClean', label: 'Walls are clean, no holes or major marks' },
                      { key: 'floorsClean', label: 'Floors are clean, no stains or damage' },
                      { key: 'appliancesWorking', label: 'All appliances are working' },
                      { key: 'plumbingWorking', label: 'Plumbing fixtures working, no leaks' },
                      { key: 'keysReturned', label: 'All keys and access devices returned' },
                      { key: 'smokeDetectorsWorking', label: 'Smoke detectors working' },
                      { key: 'noMissingItems', label: 'No missing fixtures or items' }
                    ].map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <input
                          type='checkbox'
                          id={item.key}
                          checked={offboardingData.inspectionChecklist[item.key]}
                          onChange={(e) => setOffboardingData({
                            ...offboardingData,
                            inspectionChecklist: {
                              ...offboardingData.inspectionChecklist,
                              [item.key]: e.target.checked
                            }
                          })}
                          style={{ width: 20, height: 20 }}
                        />
                        <label htmlFor={item.key} style={{ fontSize: 14, cursor: 'pointer' }}>{item.label}</label>
                      </div>
                    ))}
                  </div>
                  
                  <div className='form-group'>
                    <label className='form-label'>Inspection Notes & Damages Found</label>
                    <textarea
                      className='form-textarea'
                      rows={4}
                      placeholder='Document any damage, excessive wear, cleaning needed, or issues found...'
                      value={offboardingData.inspectionNotes}
                      onChange={(e) => setOffboardingData({ ...offboardingData, inspectionNotes: e.target.value })}
                    />
                  </div>
                  
                  <div className='form-group'>
                    <label className='form-label'>Inspection Photos</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 24, textAlign: 'center' }}>
                      <input
                        type='file'
                        id='inspection-photos'
                        multiple
                        accept='image/*'
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setOffboardingData({
                            ...offboardingData,
                            inspectionPhotos: [...offboardingData.inspectionPhotos, ...files]
                          });
                          e.target.value = '';
                        }}
                      />
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                      <p style={{ marginBottom: 12, color: '#6b7280' }}>Take photos of any damage or issues</p>
                      <button type="button" onClick={() => document.getElementById('inspection-photos').click()} className='btn btn-secondary'>
                        Upload Photos
                      </button>
                    </div>
                    
                    {offboardingData.inspectionPhotos.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                        {offboardingData.inspectionPhotos.map((photo, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Inspection ${i + 1}`}
                              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
                            />
                            <button
                              type="button"
                              onClick={() => setOffboardingData({
                                ...offboardingData,
                                inspectionPhotos: offboardingData.inspectionPhotos.filter((_, idx) => idx !== i)
                              })}
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14
                              }}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4 - Deposit Calculation */}
              {offboardingStep === 4 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Calculate Deposit Return</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Add any deductions from the security deposit</p>
                  
                  <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Security Deposit Held</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
                        ${offboardingData.tenant?.security_deposit || 0}
                      </span>
                    </div>
                  </div>
                  
                  <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Deductions</h4>
                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                    Add itemized deductions for damages, cleaning, or unpaid rent
                  </p>
                  
                  {offboardingData.depositDeductions.map((deduction, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 2 }}>
                        <input
                          type='text'
                          className='form-input'
                          placeholder='Description (e.g., Wall repair, Carpet cleaning)'
                          value={deduction.description || ''}
                          onChange={(e) => {
                            const updated = [...offboardingData.depositDeductions];
                            updated[i] = { ...updated[i], description: e.target.value };
                            setOffboardingData({ ...offboardingData, depositDeductions: updated });
                          }}
                        />
                      </div>
                      <div style={{ width: 120 }}>
                        <input
                          type='number'
                          className='form-input'
                          placeholder='Amount'
                          value={deduction.amount || ''}
                          onChange={(e) => {
                            const updated = [...offboardingData.depositDeductions];
                            updated[i] = { ...updated[i], amount: parseFloat(e.target.value) || 0 };
                            setOffboardingData({ ...offboardingData, depositDeductions: updated });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setOffboardingData({
                          ...offboardingData,
                          depositDeductions: offboardingData.depositDeductions.filter((_, idx) => idx !== i)
                        })}
                        style={{ padding: 8, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}
                      >🗑️</button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setOffboardingData({
                      ...offboardingData,
                      depositDeductions: [...offboardingData.depositDeductions, { description: '', amount: 0 }]
                    })}
                    className='btn btn-secondary'
                    style={{ marginBottom: 24 }}
                  >
                    + Add Deduction
                  </button>
                  
                  <div style={{ background: '#f9fafb', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span>Security Deposit</span>
                      <span>${offboardingData.tenant?.security_deposit || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#dc2626' }}>
                      <span>Total Deductions</span>
                      <span>-${offboardingData.depositDeductions.reduce((sum, d) => sum + (d.amount || 0), 0)}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '2px solid #1f2937', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700 }}>
                      <span>Refund Due</span>
                      <span style={{ color: '#059669' }}>
                        ${Math.max(0, (offboardingData.tenant?.security_deposit || 0) - offboardingData.depositDeductions.reduce((sum, d) => sum + (d.amount || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 - Final Statement Preview */}
              {offboardingStep === 5 && (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Final Move-Out Statement</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>Review before completing</p>
                  
                  <div style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Security Deposit Statement</h3>
                      <p style={{ color: '#6b7280', fontSize: 14 }}>Generated {new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                      <div>
                        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Tenant</p>
                        <p style={{ fontWeight: 600, margin: 0 }}>{offboardingData.tenant?.name}</p>
                        <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>{offboardingData.tenant?.email}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Property</p>
                        <p style={{ fontWeight: 600, margin: 0 }}>{offboardingData.tenant?.property_name}</p>
                        <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>Unit {offboardingData.tenant?.unit}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Move-Out Date</p>
                        <p style={{ fontWeight: 600, margin: 0 }}>{offboardingData.moveOutDate}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Reason</p>
                        <p style={{ fontWeight: 600, margin: 0 }}>{offboardingData.reason || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 0' }}>Security Deposit Held</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>${offboardingData.tenant?.security_deposit || 0}</td>
                        </tr>
                        {offboardingData.depositDeductions.map((d, i) => (
                          <tr key={i} style={{ color: '#dc2626' }}>
                            <td style={{ padding: '8px 0' }}>{d.description || 'Deduction'}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>-${d.amount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: 700, fontSize: 18 }}>
                          <td style={{ padding: '16px 0', borderTop: '2px solid #1f2937' }}>Amount Due to Tenant</td>
                          <td style={{ padding: '16px 0', borderTop: '2px solid #1f2937', textAlign: 'right', color: '#059669' }}>
                            ${Math.max(0, (offboardingData.tenant?.security_deposit || 0) - offboardingData.depositDeductions.reduce((sum, d) => sum + (d.amount || 0), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    {offboardingData.forwardingAddress && (
                      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Mail Refund To</p>
                        <p style={{ margin: 0 }}>{offboardingData.forwardingAddress}</p>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <button type="button" className='btn btn-secondary' style={{ flex: 1 }}>
                      📄 Download PDF
                    </button>
                    <button type="button" className='btn btn-secondary' style={{ flex: 1 }}>
                      ✉️ Email to Tenant
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6 - Complete */}
              {offboardingStep === 6 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    background: '#d1fae5', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: 40
                  }}>
                    ✓
                  </div>
                  
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Move-Out Complete</h2>
                  <p style={{ color: '#6b7280', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                    {offboardingData.tenant?.name} has been successfully moved out. The unit is now marked as available.
                  </p>
                  
                  <div style={{ background: '#f9fafb', padding: 24, borderRadius: 12, textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Tenant</p>
                        <p style={{ fontWeight: 500, margin: 0 }}>{offboardingData.tenant?.name}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Move-Out Date</p>
                        <p style={{ fontWeight: 500, margin: 0 }}>{offboardingData.moveOutDate}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Refund Amount</p>
                        <p style={{ fontWeight: 500, margin: 0, color: '#059669' }}>
                          ${Math.max(0, (offboardingData.tenant?.security_deposit || 0) - offboardingData.depositDeductions.reduce((sum, d) => sum + (d.amount || 0), 0))}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Unit Status</p>
                        <p style={{ fontWeight: 500, margin: 0, color: '#059669' }}>Available</p>
                      </div>
                    </div>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />
                    
                    <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Next Steps</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#4b5563' }}>
                      <li>Mail deposit refund check within 21 days</li>
                      <li>Schedule unit turnover (cleaning, repairs)</li>
                      <li>Update property listing as available</li>
                      <li>Begin marketing for new tenant</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={() => {
                  if (offboardingStep === 1) {
                    setShowOffboardingWizard(false);
                  } else if (offboardingStep === 6) {
                    setShowOffboardingWizard(false);
                    setOffboardingStep(1);
                    setOffboardingData({
                      tenant: null,
                      moveOutDate: '',
                      reason: '',
                      forwardingAddress: '',
                      inspectionChecklist: {
                        wallsClean: false,
                        floorsClean: false,
                        appliancesWorking: false,
                        plumbingWorking: false,
                        keysReturned: false,
                        smokeDetectorsWorking: false,
                        noMissingItems: false
                      },
                      inspectionNotes: '',
                      inspectionPhotos: [],
                      depositDeductions: [],
                      finalStatement: null
                    });
                  } else {
                    setOffboardingStep(offboardingStep - 1);
                  }
                }}
                className='btn btn-secondary'
              >
                {offboardingStep === 1 ? 'Cancel' : offboardingStep === 6 ? 'Close' : 'Back'}
              </button>
              
              <button
                type="button"
                onClick={validateAndContinueOffboarding}
                className='btn btn-primary'
                disabled={offboardingStep === 6}
              >
                {offboardingStep === 5 ? 'Complete Offboarding' : offboardingStep === 6 ? 'Done' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
      </div>
    </div>
  );
}

export default App;
