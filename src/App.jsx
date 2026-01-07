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

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
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
  const [newProperty, setNewProperty] = useState({ address: '', units: '', type: '', occupied: '', monthlyRevenue: '', photo: null, ownerName: '', ownerEmail: '' });
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
  
  // Settings tab navigation
  const [settingsTab, setSettingsTab] = useState('profile');
  
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
    ownerEmail: row.owner_email || ''
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
    owner_email: property.ownerEmail || null
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
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Please check your Supabase connection.');
    } finally {
      setLoading(false);
    }
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
    return date.toLocaleDateString();
  };

  // Get priority badge style
  const getPriorityBadgeStyle = (priority) => {
    const priorityLower = (priority || 'medium').toLowerCase();
    const styles = {
      low: { background: '#f3f4f6', color: '#4b5563' },
      medium: { background: '#fef3c7', color: '#92400e' },
      high: { background: '#ffedd5', color: '#c2410c' },
      urgent: { background: '#fee2e2', color: '#991b1b' }
    };
    return styles[priorityLower] || styles.medium;
  };

  // Get status badge style
  const getMaintenanceStatusBadgeStyle = (status) => {
    const statusLower = (status || 'open').toLowerCase();
    // Map 'open' to 'Pending', 'in_progress' to 'Active', 'closed'/'completed' to 'Completed'
    let mappedStatus = statusLower;
    if (statusLower === 'open') mappedStatus = 'pending';
    if (statusLower === 'in_progress' || statusLower === 'in progress') mappedStatus = 'active';
    if (statusLower === 'closed' || statusLower === 'completed') mappedStatus = 'completed';
    
    const styles = {
      pending: { background: '#fef3c7', color: '#92400e' },
      active: { background: '#dbeafe', color: '#1e40af' },
      completed: { background: '#dcfce7', color: '#166534' }
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
    // Return sample data for all 6 months
    return [
      { month: 'Jan', revenue: 4000, expenses: 800 },
      { month: 'Feb', revenue: 4000, expenses: 650 },
      { month: 'Mar', revenue: 4000, expenses: 1200 },
      { month: 'Apr', revenue: 4000, expenses: 500 },
      { month: 'May', revenue: 4000, expenses: 750 },
      { month: 'Jun', revenue: 4000, expenses: 600 }
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
      } else {
        matchesStatus = t.status === filterStatus;
      }
    }
    
    // Search filter
    const matchesSearch = !tenantSearchQuery || tenantSearchQuery.trim() === '' || 
      (t.name && t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())) ||
      (t.property && t.property.toLowerCase().includes(tenantSearchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
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
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  });

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
      ownerEmail: newProperty.ownerEmail || ''
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
    setNewProperty({ address: '', units: '', type: '', occupied: '', monthlyRevenue: '', photo: null, ownerName: '', ownerEmail: '' });
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
      ownerEmail: editingProperty.ownerEmail || ''
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

  return (
    <div className="app google-style">
      {/* Top Header - Google Workspace Style */}
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

      {/* Sidebar Navigation - Google Workspace Style */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button 
            className={activeTab === 'tenants' ? 'active' : ''} 
            onClick={() => setActiveTab('tenants')}
            title="Tenants"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {!sidebarCollapsed && <span>Tenants</span>}
          </button>
          <button 
            className={activeTab === 'properties' ? 'active' : ''} 
            onClick={() => setActiveTab('properties')}
            title="Properties"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            {!sidebarCollapsed && <span>Properties</span>}
          </button>
          <button 
            className={activeTab === 'maintenance' ? 'active' : ''} 
            onClick={() => setActiveTab('maintenance')}
            title="Maintenance"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            {!sidebarCollapsed && <span>Maintenance</span>}
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''} 
            onClick={() => setActiveTab('reports')}
            title="Reports"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            {!sidebarCollapsed && <span>Reports</span>}
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
            </svg>
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <main className="main-content">
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
                                  onClick={() => {
                                    setSelectedTenant(tenant);
                                    setSearchQuery('');
                                    setActiveTab('tenants');
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
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setSearchQuery('');
                                    setActiveTab('properties');
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
                          background: 'none',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#5f6368',
                          fontSize: '14px'
                        }}
                        title="Toggle dark mode"
                      >
                        {darkMode ? (
                          <>
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
                            Light
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                            Dark
                          </>
                        )}
                      </button>
                    </div>
                  </div>

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
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
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
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
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
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
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
                          <div style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '8px',
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
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
                          />
                          <Tooltip 
                            contentStyle={{ 
                              background: '#fff', 
                              border: '1px solid #dadce0', 
                              borderRadius: '4px',
                              padding: '8px'
                            }}
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
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px 0',
                            borderBottom: index < getRecentTenants().length - 1 ? '1px solid #e5e7eb' : 'none'
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
                              ${tenant.rentAmount.toLocaleString()}
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
              {stats.latePayments > 0 && activeTab !== 'dashboard' && (
                <div className="alert-banner" style={{ background: '#fee2e2', borderColor: '#fecaca' }}>
                <div className="alert-content">
                  <span className="alert-icon">💰</span>
                  <div className="alert-text">
                    <strong>You have {stats.latePayments} tenant{stats.latePayments > 1 ? 's' : ''} with late payments</strong>
                  </div>
                </div>
                <button 
                  className="alert-action"
                  onClick={() => {
                    setActiveTab('tenants');
                    setFilterStatus('late');
                  }}
                >
                  View Late Tenants
                </button>
              </div>
            )}

            {expiringLeases.length > 0 && (
              <div className="alert-banner">
                <div className="alert-content">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-text">
                    <strong>{expiringLeases.length} lease{expiringLeases.length > 1 ? 's' : ''} expiring within 90 days:</strong>
                    <span className="alert-tenants">
                      {expiringLeases.map(t => t.name).join(', ')}
                    </span>
                  </div>
                </div>
                <button 
                  className="alert-action"
                  onClick={() => {
                    setActiveTab('tenants');
                    setFilterStatus('current');
                  }}
                >
                  View Tenants
                </button>
              </div>
            )}

              {activeTab === 'tenants' && (
                <div className="content-section">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Tenants</h1>
                        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Manage your tenant directory</p>
                      </div>
                      <button 
                        className="btn-primary" 
                        onClick={() => setShowAddModal(true)}
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
                        + Add Tenant
                      </button>
                    </div>
                  </div>

                  {/* Search and Filter Bar */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '24px',
                    alignItems: 'center'
                  }}>
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
                      </select>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#5f6368" 
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          right: '12px',
                          pointerEvents: 'none'
                        }}
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                    </div>
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

                  {/* Table */}
                  <div style={{
                    background: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: '400', color: '#202124', marginBottom: '2px' }}>
                                      {tenant.name}
                                    </div>
                                    {tenant.email && (
                                      <div style={{ fontSize: '12px', color: '#5f6368' }}>
                                        {tenant.email}
                                      </div>
                                    )}
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
                                marginBottom: '12px',
                                fontSize: '14px',
                                color: '#5f6368'
                              }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>{property.type || 'Property'}</span>
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
                        <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Maintenance</h1>
                        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Track and manage maintenance requests</p>
                      </div>
                      <button 
                        className="btn-primary" 
                        onClick={() => setShowAddMaintenanceModal(true)}
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
                              <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '4px' }}>Pending</div>
                              <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124' }}>{pending}</div>
                            </div>
                          </div>

                          {/* In Progress Card */}
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
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '4px' }}>In Progress</div>
                              <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124' }}>{inProgress}</div>
                            </div>
                          </div>

                          {/* Completed Card */}
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
                              <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '4px' }}>Completed</div>
                              <div style={{ fontSize: '32px', fontWeight: '400', color: '#202124' }}>{completed}</div>
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
                    <button
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
                      Filter
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  <div style={{
                    display: 'flex',
                    gap: '0',
                    borderBottom: '1px solid #dadce0',
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
                            color: isActive ? '#1a73e8' : '#5f6368',
                            cursor: 'pointer',
                            borderBottom: isActive ? '2px solid #1a73e8' : '2px solid transparent',
                            marginBottom: '-1px',
                            textTransform: 'capitalize'
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
                        
                        return matchesStatus && matchesSearch;
                      })
                      .map(request => {
                        const priorityStyle = getPriorityBadgeStyle(request.priority);
                        const statusStyle = getMaintenanceStatusBadgeStyle(request.status);
                        const statusDisplay = getMaintenanceStatusDisplay(request.status);
                        const unit = extractUnitNumber(request.property);
                        const propertyName = request.property ? request.property.replace(/\s*(?:Unit|Apt|Apartment|#)\s*[A-Z0-9]+/i, '').trim() : request.property;
                        
                        return (
                          <div
                            key={request.id}
                            onClick={() => {
                              setSelectedMaintenanceRequest(request);
                            }}
                            style={{
                              background: '#fff',
                              borderRadius: '8px',
                              padding: '16px',
                              marginBottom: '12px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              {/* Issue Title with Priority Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <h3 style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: '#202124',
                                  margin: 0
                                }}>
                                  {request.issue}
                                </h3>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '500',
                                    ...priorityStyle
                                  }}
                                >
                                  {(request.priority || 'medium').toUpperCase()}
                                </span>
                              </div>

                              {/* Description */}
                              {request.description && (
                                <p style={{
                                  fontSize: '14px',
                                  color: '#5f6368',
                                  margin: '0 0 12px 0',
                                  lineHeight: '1.5'
                                }}>
                                  {request.description}
                                </p>
                              )}

                              {/* Details Row */}
                              <div style={{
                                display: 'flex',
                                gap: '16px',
                                fontSize: '13px',
                                color: '#5f6368',
                                marginBottom: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <span>{propertyName || 'N/A'}</span>
                                {unit && unit !== request.property && <span>• {unit}</span>}
                                {request.tenantName && <span>• {request.tenantName}</span>}
                                <span>• {formatTimeAgo(request.date)}</span>
                              </div>

                              {/* Assigned to */}
                              {request.assignedTo && (
                                <div style={{
                                  fontSize: '13px',
                                  color: '#5f6368',
                                  marginTop: '4px'
                                }}>
                                  Assigned to: {request.assignedTo}
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontWeight: '500',
                                  display: 'inline-block',
                                  ...statusStyle
                                }}
                              >
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
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
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
                            <Tooltip />
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
                                <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#202124'}}>{'$' + property.propertyRevenue.toLocaleString()}</p>
                              </div>
                            );
                          })}
                          {properties.length === 0 && (
                            <p style={{color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '24px'}}>No properties yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                    {['profile', 'notifications', 'security', 'billing', 'company'].map((tab) => (
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
                         tab === 'billing' ? 'Billing' : 'Company'}
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
        </main>
      </div>

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
            <div className="modal-content">
              <form onSubmit={editingTenant ? handleUpdateTenant : handleAddTenant}>
                <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editingTenant ? editingTenant.name : newTenant.name}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, name: e.target.value})
                      : setNewTenant({...newTenant, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editingTenant ? editingTenant.phone : newTenant.phone}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, phone: e.target.value})
                      : setNewTenant({...newTenant, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editingTenant ? editingTenant.email : newTenant.email}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, email: e.target.value})
                      : setNewTenant({...newTenant, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
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
                <div className="form-group full-width">
                  <label>Property / Unit</label>
                  <select
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
                <div className="form-group">
                  <label>Monthly Rent</label>
                  <input
                    type="number"
                    value={editingTenant ? editingTenant.rentAmount : newTenant.rentAmount}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, rentAmount: e.target.value})
                      : setNewTenant({...newTenant, rentAmount: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Security Deposit</label>
                  <input
                    type="number"
                    value={editingTenant ? editingTenant.securityDeposit : newTenant.securityDeposit}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, securityDeposit: e.target.value})
                      : setNewTenant({...newTenant, securityDeposit: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Lease Start</label>
                  <input
                    type="date"
                    value={editingTenant ? editingTenant.leaseStart : newTenant.leaseStart}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, leaseStart: e.target.value})
                      : setNewTenant({...newTenant, leaseStart: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Lease End</label>
                  <input
                    type="date"
                    value={editingTenant ? editingTenant.leaseEnd : newTenant.leaseEnd}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, leaseEnd: e.target.value})
                      : setNewTenant({...newTenant, leaseEnd: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Move-In Date</label>
                  <input
                    type="date"
                    value={editingTenant ? editingTenant.moveInDate : newTenant.moveInDate || ''}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, moveInDate: e.target.value})
                      : setNewTenant({...newTenant, moveInDate: e.target.value})}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Move-In Condition Notes</label>
                  <textarea
                    value={editingTenant ? editingTenant.moveInNotes : newTenant.moveInNotes || ''}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, moveInNotes: e.target.value})
                      : setNewTenant({...newTenant, moveInNotes: e.target.value})}
                    rows="2"
                    placeholder="Describe the condition of the property at move-in..."
                  />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select
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
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={editingTenant ? editingTenant.notes : newTenant.notes}
                    onChange={e => editingTenant 
                      ? setEditingTenant({...editingTenant, notes: e.target.value})
                      : setNewTenant({...newTenant, notes: e.target.value})}
                    rows="3"
                    placeholder="Pet info, preferences, move-in notes..."
                  />
                </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => {
                    setShowAddModal(false);
                    setEditingTenant(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingTenant ? 'Update Tenant' : 'Add Tenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedTenant && (
        <div className="modal-overlay" onClick={() => setSelectedTenant(null)}>
          <div className="modal tenant-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-fixed">
              <div className="modal-header-content">
                <h2>{selectedTenant.name}</h2>
                <div className="header-badges">
                  <span className="badge" style={getStatusBadge(selectedTenant.status)}>
                    {selectedTenant.status}
                  </span>
                  {selectedTenant.status === 'current' && (
                    <span className="badge" style={getPaymentBadge(selectedTenant.paymentStatus)}>
                      {selectedTenant.paymentStatus === 'paid' ? 'Rent Paid' : 'Rent Late'}
                    </span>
                  )}
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedTenant(null)}>×</button>
            </div>
            <div className="tenant-detail-view modal-content-scrollable">
              <div className="detail-section">
                <h4>Contact</h4>
                <div className="contact-grid">
                  {selectedTenant.phone && (
                    <div className="contact-item">
                      <span className="contact-label">Phone</span>
                      <span className="contact-value">{selectedTenant.phone}</span>
                    </div>
                  )}
                  {selectedTenant.email && (
                    <div className="contact-item">
                      <span className="contact-label">Email</span>
                      <span className="contact-value">{selectedTenant.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="detail-section">
                <h4>Property</h4>
                <p>{selectedTenant.property || 'Not assigned'}</p>
              </div>

              <div className="section-divider"></div>

              {selectedTenant.rentAmount > 0 && (
                <>
                  <div className="detail-section">
                    <h4>Lease Details</h4>
                    <div className="lease-details-list">
                      <p><span className="lease-label">Monthly Rent:</span> <span className="lease-value">${selectedTenant.rentAmount.toLocaleString()}</span></p>
                      {selectedTenant.securityDeposit > 0 && (
                        <p><span className="lease-label">Security Deposit:</span> <span className="lease-value">${selectedTenant.securityDeposit.toLocaleString()}</span></p>
                      )}
                      <p>
                        <span className="lease-label">Lease Period:</span>{' '}
                        <span className="lease-value">
                          {selectedTenant.leaseStart ? new Date(selectedTenant.leaseStart).toLocaleDateString() : 'N/A'} - {selectedTenant.leaseEnd ? new Date(selectedTenant.leaseEnd).toLocaleDateString() : 'N/A'}
                        </span>
                      </p>
                      {selectedTenant.paymentDate && selectedTenant.status === 'current' && (
                        <p><span className="lease-label">Payment Status:</span> <span className="lease-value">{selectedTenant.paymentStatus === 'paid' ? 'Paid' : 'Late'} on {new Date(selectedTenant.paymentDate).toLocaleDateString()}</span></p>
                      )}
                      {selectedTenant.leaseEnd && selectedTenant.status === 'current' && (() => {
                        const endDate = new Date(selectedTenant.leaseEnd);
                        const today = new Date();
                        const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                        if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
                          return <p className="lease-warning">⚠️ Lease expires in {daysUntilExpiry} days</p>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="section-divider"></div>
                </>
              )}

              {/* Move-In/Move-Out Tracking Section */}
              <div className="detail-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4>Move-In / Move-Out Tracking</h4>
                  {selectedTenant.status === 'current' && (
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setShowMoveOutModal(selectedTenant.id);
                        setMoveOutData({ 
                          date: new Date().toISOString().split('T')[0], 
                          notes: '', 
                          deductions: [{ description: '', amount: '' }] 
                        });
                      }}
                    >
                      Record Move-Out
                    </button>
                  )}
                </div>

                {/* Move-In Information */}
                <div className="move-info-section">
                  <h5>Move-In</h5>
                  {selectedTenant.moveInDate ? (
                    <>
                      <p><strong>Date:</strong> {new Date(selectedTenant.moveInDate).toLocaleDateString()}</p>
                      {selectedTenant.moveInNotes && (
                        <p><strong>Condition Notes:</strong> {selectedTenant.moveInNotes}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted">No move-in date recorded</p>
                  )}
                </div>

                {/* Security Deposit */}
                {selectedTenant.securityDeposit > 0 && (
                  <div className="move-info-section">
                    <p><strong>Security Deposit:</strong> ${selectedTenant.securityDeposit.toLocaleString()}</p>
                  </div>
                )}

                {/* Move-Out Information (only for past tenants) */}
                {selectedTenant.status === 'past' && selectedTenant.moveOutDate && (
                  <div className="move-info-section">
                    <h5>Move-Out</h5>
                    <p><strong>Date:</strong> {new Date(selectedTenant.moveOutDate).toLocaleDateString()}</p>
                    {selectedTenant.moveOutNotes && (
                      <p><strong>Condition Notes:</strong> {selectedTenant.moveOutNotes}</p>
                    )}

                    {/* Deposit Deductions */}
                    {selectedTenant.depositDeductions && selectedTenant.depositDeductions.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <p><strong>Deposit Deductions:</strong></p>
                        <div className="deductions-list">
                          {selectedTenant.depositDeductions.map((deduction, index) => (
                            <div key={deduction.id || index} className="deduction-item">
                              <span>{deduction.description}</span>
                              <span>${deduction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                        <p style={{ marginTop: '0.5rem' }}>
                          <strong>Total Deductions:</strong> ${selectedTenant.depositDeductions.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    {/* Refund Information */}
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <p><strong>Deposit Refund Amount:</strong> ${selectedTenant.depositRefundAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p style={{ marginTop: '0.5rem' }}>
                        <strong>Refund Status:</strong>{' '}
                        <span className={`refund-status refund-status-${selectedTenant.refundStatus}`}>
                          {selectedTenant.refundStatus.charAt(0).toUpperCase() + selectedTenant.refundStatus.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="section-divider"></div>

              <div className="detail-section">
                <h4>Lease Documents</h4>
                {(selectedTenant.leaseDocuments && selectedTenant.leaseDocuments.length > 0) ? (
                  <div className="lease-documents-list">
                    {selectedTenant.leaseDocuments.map((doc) => (
                      <div key={doc.id} className="lease-document-item">
                        <div className="document-info">
                          <span className="document-name">{doc.name}</span>
                          <span className="document-date">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                          {doc.size && (
                            <span className="document-size">
                              ({(doc.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                        <div className="document-actions">
                          <a 
                            href={doc.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary btn-small"
                          >
                            View
                          </a>
                          <a 
                            href={doc.url} 
                            download={doc.name}
                            className="btn-secondary btn-small"
                          >
                            Download
                          </a>
                          <button
                            className="btn-danger btn-small"
                            onClick={() => handleDeleteLeaseDocument(selectedTenant.id, doc.id, doc.path)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No lease documents uploaded</p>
                )}
                <label className="file-upload-label" style={{ marginTop: '1rem' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleLeaseDocumentUpload(selectedTenant.id, e)}
                    style={{ display: 'none' }}
                    id="lease-document-upload"
                  />
                  <span className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                    + Upload PDF Document
                  </span>
                </label>
              </div>

              <div className="section-divider"></div>

              {selectedTenant.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedTenant.notes}</p>
                </div>
              )}

              {(selectedTenant.paymentLog || []).length > 0 && (
                <div className="detail-section">
                  <h4>Payment History</h4>
                  <div className="payment-log-list">
                    {selectedTenant.paymentLog.slice().reverse().map(payment => (
                      <div key={payment.id} className="payment-log-item">
                        <span>${payment.amount.toLocaleString()}</span>
                        <span>{payment.method}</span>
                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            <div className="modal-footer modal-footer-fixed">
              <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedTenant.accessCode) {
                      const portalUrl = `${window.location.origin}/tenant-portal?code=${selectedTenant.accessCode}`;
                      navigator.clipboard.writeText(portalUrl).then(() => {
                        alert('Portal link copied to clipboard!');
                      }).catch(() => {
                        const textArea = document.createElement('textarea');
                        textArea.value = portalUrl;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        alert('Portal link copied to clipboard!');
                      });
                    } else {
                      alert('Access code not available. Please update the tenant to generate an access code.');
                    }
                  }}
                >
                  Copy Portal Link
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setEditingTenant({...selectedTenant});
                    setSelectedTenant(null);
                  }}
                >
                  Edit Tenant
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowPaymentLog(selectedTenant.id);
                    setSelectedTenant(null);
                  }}
                >
                  Payment Log
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowActivityLog(selectedTenant.id);
                    setSelectedTenant(null);
                  }}
                >
                  Activity Log
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setPaymentRequest({
                      amount: selectedTenant.rentAmount || '',
                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
                      note: ''
                    });
                    setShowPaymentRequestModal(selectedTenant.id);
                    setSelectedTenant(null);
                  }}
                >
                  Request Payment
                </button>
                <button className="btn-primary">Send Message</button>
              </div>
            </div>
          </div>
        </div>
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
              <button className="close-btn" onClick={() => setShowPaymentLog(null)}>×</button>
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
              <button className="close-btn" onClick={() => setShowActivityLog(null)}>×</button>
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
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowExpenseModal(null)}>
          <div className="modal" style={{ zIndex: 3001 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense - {properties.find(p => p.id === showExpenseModal)?.address}</h2>
              <button className="close-btn" onClick={() => setShowExpenseModal(null)}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={(e) => handleAddExpense(showExpenseModal, e)}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Description</label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                      placeholder="e.g., Plumbing repair"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                      <option value="repair">Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
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
            <div className="modal-content">
              <form onSubmit={handleUpdateProperty}>
                <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    value={editingProperty.address}
                    onChange={e => setEditingProperty({...editingProperty, address: e.target.value})}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select
                    value={editingProperty.type || ''}
                    onChange={e => setEditingProperty({...editingProperty, type: e.target.value})}
                  >
                    <option value="">Select Type</option>
                    <option value="Single Family">Single Family</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Apartment Complex">Apartment Complex</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Units</label>
                  <input
                    type="number"
                    value={editingProperty.units}
                    onChange={e => setEditingProperty({...editingProperty, units: e.target.value})}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Occupied Units</label>
                  <input
                    type="number"
                    value={editingProperty.occupied}
                    onChange={e => setEditingProperty({...editingProperty, occupied: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Revenue</label>
                  <input
                    type="number"
                    value={editingProperty.monthlyRevenue}
                    onChange={e => setEditingProperty({...editingProperty, monthlyRevenue: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Owner Name</label>
                  <input
                    type="text"
                    value={editingProperty.ownerName || ''}
                    onChange={e => setEditingProperty({...editingProperty, ownerName: e.target.value})}
                    placeholder="Property owner name"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Owner Email</label>
                  <input
                    type="email"
                    value={editingProperty.ownerEmail || ''}
                    onChange={e => setEditingProperty({...editingProperty, ownerEmail: e.target.value})}
                    placeholder="owner@example.com"
                  />
                </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditingProperty(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Property</h2>
              <button className="close-btn" onClick={() => setShowAddPropertyModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleAddProperty}>
                <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    value={newProperty.address}
                    onChange={e => setNewProperty({...newProperty, address: e.target.value})}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select
                    value={newProperty.type}
                    onChange={e => setNewProperty({...newProperty, type: e.target.value})}
                  >
                    <option value="">Select Type</option>
                    <option value="Single Family">Single Family</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Apartment Complex">Apartment Complex</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Units</label>
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
                  <label>Occupied Units</label>
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
                  <label>Owner Name</label>
                  <input
                    type="text"
                    value={newProperty.ownerName}
                    onChange={e => setNewProperty({...newProperty, ownerName: e.target.value})}
                    placeholder="Property owner name"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Owner Email</label>
                  <input
                    type="email"
                    value={newProperty.ownerEmail}
                    onChange={e => setNewProperty({...newProperty, ownerEmail: e.target.value})}
                    placeholder="owner@example.com"
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
            <div className="modal-content">
              <form onSubmit={handleAddMaintenanceRequest}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Issue</label>
                  <input
                    type="text"
                    value={newMaintenanceRequest.issue}
                    onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, issue: e.target.value})}
                    placeholder="e.g., Leaky faucet"
                    required
                  />
                </div>
                  <div className="form-group full-width">
                    <label>Property / Unit</label>
                    <input
                      type="text"
                      value={newMaintenanceRequest.property}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, property: e.target.value})}
                      placeholder="e.g., 1420 Oak Street, Unit 3B"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tenant Name</label>
                    <input
                      type="text"
                      value={newMaintenanceRequest.tenantName}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, tenantName: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newMaintenanceRequest.priority}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newMaintenanceRequest.date}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={newMaintenanceRequest.description}
                      onChange={e => setNewMaintenanceRequest({...newMaintenanceRequest, description: e.target.value})}
                      rows="3"
                      placeholder="Detailed description of the issue..."
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddMaintenanceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
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
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal property-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProperty.address}</h2>
              <button className="close-btn" onClick={() => setSelectedProperty(null)}>×</button>
            </div>
            <div className="property-detail-view modal-content-scrollable">
              {/* Photo Section with Drag and Drop */}
              <div className="property-photo-section">
                <div 
                  className="property-photo-upload"
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
                      handlePropertyPhotoUpdate(selectedProperty.id, file);
                    }
                  }}
                >
                  {selectedProperty.photoUrl ? (
                    <div className="property-photo-wrapper">
                      <img 
                        src={selectedProperty.photoUrl} 
                        alt={selectedProperty.address}
                        className="property-photo-modal"
                      />
                      <div className="property-photo-overlay">
                        <button
                          className="property-photo-change-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('property-photo-input').click();
                          }}
                          title="Change Photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </button>
                        <button
                          className="property-photo-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePropertyPhoto(selectedProperty.id);
                          }}
                          title="Remove Photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="property-photo-placeholder">
                      <span>📷</span>
                      <p>Drop photo here or click to upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handlePropertyPhotoUpdate(selectedProperty.id, file);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="property-photo-input"
                  />
                  {!selectedProperty.photoUrl && (
                    <label htmlFor="property-photo-input" className="photo-upload-label">
                      {propertyPhotoUploading ? 'Uploading...' : 'Upload Photo'}
                    </label>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="property-detail-info">
                <div className="detail-section">
                  <h4>Property Information</h4>
                  <div className="property-info-grid">
                    <div className="info-item">
                      <span className="info-label">Address: </span>
                      <span className="info-value">{selectedProperty.address}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type: </span>
                      <span className="info-value">{selectedProperty.type || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total Units: </span>
                      <span className="info-value">{selectedProperty.units}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Occupied: </span>
                      <span className="info-value">{selectedProperty.occupied}/{selectedProperty.units}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Monthly Revenue: </span>
                      <span className="info-value">${selectedProperty.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    {selectedProperty.ownerName && (
                      <div className="info-item">
                        <span className="info-label">Owner Name: </span>
                        <span className="info-value">{selectedProperty.ownerName}</span>
                      </div>
                    )}
                    {selectedProperty.ownerEmail && (
                      <div className="info-item">
                        <span className="info-label">Owner Email: </span>
                        <span className="info-value">{selectedProperty.ownerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenants at this property */}
                <div className="detail-section">
                  <h4>Current Tenants</h4>
                  {tenants.filter(t => 
                    t.property && t.property.toLowerCase().includes(selectedProperty.address.toLowerCase()) && 
                    t.status === 'current'
                  ).length > 0 ? (
                    <div className="property-tenants-list">
                      {tenants
                        .filter(t => 
                          t.property && t.property.toLowerCase().includes(selectedProperty.address.toLowerCase()) && 
                          t.status === 'current'
                        )
                        .map(tenant => (
                          <div key={tenant.id} className="property-tenant-card">
                            <div className="property-tenant-card-header">
                              <div>
                                <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: '500' }}>{tenant.name}</h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>{tenant.property}</p>
                              </div>
                              <span className="badge" style={getPaymentBadge(tenant.paymentStatus)}>
                                {tenant.paymentStatus === 'paid' ? 'Paid' : 'Late'}
                              </span>
                            </div>
                            <div className="property-tenant-card-details">
                              <div className="property-tenant-detail-item">
                                <span className="property-tenant-label">Rent:</span>
                                <span className="property-tenant-value">${tenant.rentAmount.toLocaleString()}/mo</span>
                              </div>
                              {tenant.paymentDate && (
                                <div className="property-tenant-detail-item">
                                  <span className="property-tenant-label">Last Payment:</span>
                                  <span className="property-tenant-value">{new Date(tenant.paymentDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted">No current tenants at this property</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
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
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProperty(null);
                      setActiveTab('tenants');
                      // Filter tenants by property
                      setFilterStatus('all');
                      setTenantSearchQuery(selectedProperty.address);
                    }}
                  >
                    View Tenants
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      const propertyId = selectedProperty.id;
                      setSelectedProperty(null); // Close property detail modal
                      // Use setTimeout to ensure modal closes before opening expense modal
                      setTimeout(() => {
                        setShowExpenseModal(propertyId);
                      }, 100);
                    }}
                  >
                    + Add Expense
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeletePropertyConfirm(selectedProperty.id);
                    }}
                    style={{ color: '#d93025', borderColor: '#d93025' }}
                  >
                    Delete Property
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
