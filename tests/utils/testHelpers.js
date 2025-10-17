import { render } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock user data
export const mockPatient = {
  _id: '507f1f77bcf86cd799439011',
  userName: 'Test Patient',
  email: 'patient@test.com',
  role: 'patient',
  phone: '+94771234567',
  bloodType: 'O+',
  isActive: true,
};

export const mockDoctor = {
  _id: '507f1f77bcf86cd799439012',
  userName: 'Dr. Test',
  email: 'doctor@test.com',
  role: 'healthcare_professional',
  phone: '+94771234568',
  specialization: 'Cardiology',
  consultationFee: 3000,
  isActive: true,
};

export const mockStaff = {
  _id: '507f1f77bcf86cd799439013',
  userName: 'Staff User',
  email: 'staff@test.com',
  role: 'hospital_staff',
  phone: '+94771234569',
  staffRole: 'receptionist',
  isActive: true,
};

export const mockManager = {
  _id: '507f1f77bcf86cd799439014',
  userName: 'Manager User',
  email: 'manager@test.com',
  role: 'healthcare_manager',
  phone: '+94771234570',
  isActive: true,
};

// Mock appointment data
export const mockAppointment = {
  _id: '607f1f77bcf86cd799439011',
  appointmentID: 'APT001',
  patientID: mockPatient,
  doctorID: mockDoctor,
  hospitalID: {
    _id: '707f1f77bcf86cd799439011',
    name: 'Test Hospital',
  },
  date: '2025-12-01',
  time: '10:00',
  type: 'consultation',
  status: 'scheduled',
  symptoms: 'Test symptoms',
};

// Mock payment data
export const mockPayment = {
  _id: '707f1f77bcf86cd799439021',
  paymentID: 'PAY001',
  patientID: mockPatient,
  hospitalID: {
    _id: '707f1f77bcf86cd799439011',
    name: 'Test Hospital',
  },
  amount: 2000,
  method: 'cash',
  status: 'completed',
  transactionReference: 'TXN001',
  createdAt: '2024-01-01T10:00:00.000Z',
  billingDetails: {
    services: [{
      serviceName: 'Consultation',
      unitPrice: 2000,
      quantity: 1,
      totalPrice: 2000,
    }],
    subtotal: 2000,
    tax: 0,
    discount: 0,
    total: 2000,
  },
};

// Mock medical record data
export const mockMedicalRecord = {
  _id: '807f1f77bcf86cd799439031',
  recordID: 'MR001',
  patientID: mockPatient,
  doctorID: mockDoctor,
  hospitalID: {
    _id: '707f1f77bcf86cd799439011',
    name: 'Test Hospital',
  },
  visitDate: '2024-01-01',
  chiefComplaint: 'Test complaint',
  diagnosis: [{
    description: 'Test diagnosis',
    code: 'ICD10-TEST',
  }],
  treatmentPlan: {
    medications: [{
      name: 'Test Medicine',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '7 days',
    }],
  },
};

// Custom render with providers
export const renderWithAuth = (ui, { user = mockPatient, ...options } = {}) => {
  // Mock the AuthContext
  const Wrapper = ({ children }) => (
    <AuthProvider value={{ user, isAuthenticated: true, loading: false }}>
      {children}
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock axios responses
export const mockAxiosSuccess = (data) => ({
  data: {
    success: true,
    data,
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const mockAxiosError = (message = 'Error', status = 400) => ({
  response: {
    data: {
      success: false,
      message,
    },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
});

// Wait for async updates
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

// Mock window.print
export const mockPrint = () => {
  window.print = jest.fn();
};

// Mock window.open
export const mockWindowOpen = () => {
  window.open = jest.fn().mockReturnValue({
    document: {
      write: jest.fn(),
      close: jest.fn(),
    },
    focus: jest.fn(),
    print: jest.fn(),
  });
};

