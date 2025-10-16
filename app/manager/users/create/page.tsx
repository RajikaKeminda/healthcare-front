'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { usersAPI, hospitalsAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();
  const { user, loading } = useAuth() as any;
  const [submitting, setSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    userName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    role: 'patient',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka',
    },
    // Patient fields
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    bloodType: '',
    height: '',
    weight: '',
    // Healthcare Professional fields
    specialization: '',
    licenseNumber: '',
    department: '',
    yearsOfExperience: '',
    consultationFee: '',
    hospitalID: '',
    bio: '',
    // Hospital Staff fields
    staffRole: '',
    employeeID: '',
    hireDate: '',
    salary: '',
    workingHours: {
      start: '',
      end: ''
    },
    shift: 'morning'
  });

  useEffect(() => {
    if (!loading && user && user.role !== 'healthcare_manager') {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await hospitalsAPI.getAll({ limit: 100 });
      setHospitals(res.data.data.hospitals);
    } catch (err) {
      console.error('Failed to load hospitals');
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else if (name.startsWith('emergencyContact.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [key]: value } }));
    } else if (name.startsWith('workingHours.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, workingHours: { ...prev.workingHours, [key]: value } }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersAPI.create(formData);
      toast.success('User created successfully');
      router.push('/manager/users');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (user && user.role !== 'healthcare_manager')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/manager/users" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Users
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input name="userName" value={formData.userName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="patient">Patient</option>
                <option value="healthcare_professional">Healthcare Professional</option>
                <option value="hospital_staff">Hospital Staff</option>
                <option value="healthcare_manager">Healthcare Manager</option>
              </select>
            </div>
          </div>

          {/* Patient-specific fields */}
          {formData.role === 'patient' && (
            <>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type *</label>
                    <select name="bloodType" value={formData.bloodType} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                    <input name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="emergencyContact.email" value={formData.emergencyContact.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Healthcare Professional fields */}
          {formData.role === 'healthcare_professional' && (
            <>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                    <select name="specialization" value={formData.specialization} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Specialization</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Surgery">Surgery</option>
                      <option value="Urology">Urology</option>
                      <option value="Emergency Medicine">Emergency Medicine</option>
                      <option value="Anesthesiology">Anesthesiology</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Physical Therapy">Physical Therapy</option>
                      <option value="Nursing">Nursing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                    <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input name="department" value={formData.department} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (LKR) *</label>
                    <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <select name="hospitalID" value={formData.hospitalID} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Hospital (Optional)</option>
                      {hospitals.map((h) => (
                        <option key={h._id} value={h._id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Hospital Staff fields */}
          {formData.role === 'hospital_staff' && (
            <>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Role *</label>
                    <select name="staffRole" value={formData.staffRole} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Staff Role</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="nurse">Nurse</option>
                      <option value="lab_technician">Lab Technician</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="administrator">Administrator</option>
                      <option value="security">Security</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="accountant">Accountant</option>
                      <option value="it_support">IT Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input name="department" value={formData.department} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input name="employeeID" value={formData.employeeID} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                    <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary (LKR)</label>
                    <input type="number" name="salary" value={formData.salary} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                    <select name="shift" value={formData.shift} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="night">Night</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours Start *</label>
                    <input type="time" name="workingHours.start" value={formData.workingHours.start} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours End *</label>
                    <input type="time" name="workingHours.end" value={formData.workingHours.end} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input name="address.street" value={formData.address.street} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="address.city" value={formData.address.city} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input name="address.state" value={formData.address.state} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input name="address.country" value={formData.address.country} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}


