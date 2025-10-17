import axios from 'axios';
import { authAPI, usersAPI, appointmentsAPI, paymentsAPI, medicalRecordsAPI, hospitalsAPI } from '../../../lib/api';
import Cookies from 'js-cookie';

jest.mock('axios');
jest.mock('js-cookie');

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Cookies.get.mockReturnValue('mock-token');
  });

  describe('Auth API', () => {
    it('should call register endpoint', async () => {
      const userData = {
        userName: 'Test User',
        email: 'test@test.com',
        password: 'Password123!',
      };

      const mockResponse = {
        data: { success: true, data: { user: userData } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.register(userData);

      expect(axios.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should call login endpoint', async () => {
      const credentials = {
        email: 'test@test.com',
        password: 'Password123!',
      };

      const mockResponse = {
        data: { success: true, data: { user: {} } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.login(credentials);

      expect(axios.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should call logout endpoint', async () => {
      const mockResponse = {
        data: { success: true },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.logout();

      expect(axios.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should call verifyToken endpoint', async () => {
      const mockResponse = {
        data: { success: true, data: { user: {} } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await authAPI.verifyToken();

      expect(axios.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Users API', () => {
    it('should get all users with params', async () => {
      const params = { role: 'patient', limit: 10 };
      const mockResponse = {
        data: { success: true, data: { users: [] } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await usersAPI.getAll(params);

      expect(axios.get).toHaveBeenCalledWith('/users', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should get user by ID', async () => {
      const userId = '123';
      const mockResponse = {
        data: { success: true, data: { user: {} } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await usersAPI.getById(userId);

      expect(axios.get).toHaveBeenCalledWith(`/users/${userId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should create user', async () => {
      const userData = { userName: 'New User', email: 'new@test.com' };
      const mockResponse = {
        data: { success: true, data: { user: userData } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await usersAPI.create(userData);

      expect(axios.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(mockResponse);
    });

    it('should update user', async () => {
      const userId = '123';
      const updates = { userName: 'Updated Name' };
      const mockResponse = {
        data: { success: true, data: { user: {} } },
      };

      axios.put.mockResolvedValue(mockResponse);

      const result = await usersAPI.update(userId, updates);

      expect(axios.put).toHaveBeenCalledWith(`/users/${userId}`, updates);
      expect(result).toEqual(mockResponse);
    });

    it('should delete user', async () => {
      const userId = '123';
      const mockResponse = {
        data: { success: true },
      };

      axios.delete.mockResolvedValue(mockResponse);

      const result = await usersAPI.delete(userId);

      expect(axios.delete).toHaveBeenCalledWith(`/users/${userId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Appointments API', () => {
    it('should get all appointments', async () => {
      const mockResponse = {
        data: { success: true, data: { appointments: [] } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await appointmentsAPI.getAll();

      expect(axios.get).toHaveBeenCalledWith('/appointments', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should create appointment', async () => {
      const appointmentData = {
        doctorID: '123',
        date: '2025-12-01',
        time: '10:00',
      };
      const mockResponse = {
        data: { success: true, data: { appointment: appointmentData } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await appointmentsAPI.create(appointmentData);

      expect(axios.post).toHaveBeenCalledWith('/appointments', appointmentData);
      expect(result).toEqual(mockResponse);
    });

    it('should cancel appointment', async () => {
      const appointmentId = '123';
      const reason = 'Patient request';
      const mockResponse = {
        data: { success: true },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await appointmentsAPI.cancel(appointmentId, reason);

      expect(axios.post).toHaveBeenCalledWith(`/appointments/${appointmentId}/cancel`, {
        cancellationReason: reason,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Payments API', () => {
    it('should process payment', async () => {
      const paymentData = {
        amount: 2000,
        method: 'cash',
      };
      const mockResponse = {
        data: { success: true, data: { payment: paymentData } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await paymentsAPI.process(paymentData);

      expect(axios.post).toHaveBeenCalledWith('/payments', paymentData);
      expect(result).toEqual(mockResponse);
    });

    it('should generate receipt', async () => {
      const paymentId = '123';
      const format = 'pdf';
      const mockResponse = {
        data: { success: true, data: { receipt: {} } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await paymentsAPI.generateReceipt(paymentId, format);

      expect(axios.post).toHaveBeenCalledWith(`/payments/${paymentId}/receipt`, { format });
      expect(result).toEqual(mockResponse);
    });

    it('should update payment', async () => {
      const paymentId = '123';
      const updates = { status: 'completed' };
      const mockResponse = {
        data: { success: true, data: { payment: {} } },
      };

      axios.put.mockResolvedValue(mockResponse);

      const result = await paymentsAPI.update(paymentId, updates);

      expect(axios.put).toHaveBeenCalledWith(`/payments/${paymentId}`, updates);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Medical Records API', () => {
    it('should get all medical records', async () => {
      const mockResponse = {
        data: { success: true, data: { medicalRecords: [] } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await medicalRecordsAPI.getAll();

      expect(axios.get).toHaveBeenCalledWith('/medical-records', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should create medical record', async () => {
      const recordData = {
        patientID: '123',
        chiefComplaint: 'Test complaint',
      };
      const mockResponse = {
        data: { success: true, data: { medicalRecord: recordData } },
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await medicalRecordsAPI.create(recordData);

      expect(axios.post).toHaveBeenCalledWith('/medical-records', recordData);
      expect(result).toEqual(mockResponse);
    });

    it('should update medical record', async () => {
      const recordId = '123';
      const updates = { chiefComplaint: 'Updated complaint' };
      const mockResponse = {
        data: { success: true, data: { medicalRecord: {} } },
      };

      axios.put.mockResolvedValue(mockResponse);

      const result = await medicalRecordsAPI.update(recordId, updates);

      expect(axios.put).toHaveBeenCalledWith(`/medical-records/${recordId}`, updates);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Hospitals API', () => {
    it('should get all hospitals', async () => {
      const mockResponse = {
        data: { success: true, data: { hospitals: [] } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await hospitalsAPI.getAll();

      expect(axios.get).toHaveBeenCalledWith('/hospitals', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should get hospital by ID', async () => {
      const hospitalId = '123';
      const mockResponse = {
        data: { success: true, data: { hospital: {} } },
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await hospitalsAPI.getById(hospitalId);

      expect(axios.get).toHaveBeenCalledWith(`/hospitals/${hospitalId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = {
        response: {
          status: 400,
          data: { success: false, message: 'Error' },
        },
      };

      axios.get.mockRejectedValue(error);

      await expect(usersAPI.getAll()).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      axios.get.mockRejectedValue(error);

      await expect(usersAPI.getAll()).rejects.toThrow('Network Error');
    });

    it('should handle 401 errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { success: false, message: 'Unauthorized' },
        },
      };

      axios.get.mockRejectedValue(error);

      await expect(usersAPI.getAll()).rejects.toEqual(error);
    });
  });
});

