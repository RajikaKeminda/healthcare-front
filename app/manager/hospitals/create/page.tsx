'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { hospitalsAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateHospitalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'public',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    },
    contactInfo: {
      phone: '',
      email: '',
      website: '',
      emergencyHotline: ''
    },
    capacity: {
      totalBeds: 0,
      occupiedBeds: 0,
      icuBeds: 0,
      emergencyBeds: 0
    },
    facilities: [],
    specializations: [],
    emergencyServices: {
      available: true,
      hours: '24/7'
    }
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_manager') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else if (name.startsWith('contactInfo.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, contactInfo: { ...prev.contactInfo, [key]: value } }));
    } else if (name.startsWith('capacity.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, capacity: { ...prev.capacity, [key]: parseInt(value) || 0 } }));
    } else if (name === 'emergencyServices.available') {
      setFormData((prev: any) => ({ ...prev, emergencyServices: { ...prev.emergencyServices, available: checked } }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    setFormData((prev: any) => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hospitalsAPI.create(formData);
      toast.success('Hospital created successfully');
      router.push('/manager/hospitals');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create hospital';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const facilities = ['emergency', 'icu', 'surgery', 'radiology', 'laboratory', 'pharmacy', 'physiotherapy', 'dental', 'mental_health', 'maternity', 'pediatrics', 'cardiology', 'oncology', 'orthopedics'];
  const specializations = ['Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'General Medicine', 'Gynecology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology', 'Emergency Medicine', 'Anesthesiology', 'Pathology', 'Physical Therapy', 'Nursing'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/manager/hospitals" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Hospitals
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Hospital</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="teaching">Teaching</option>
                  <option value="specialty">Specialty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street *</label>
                <input name="address.street" value={formData.address.street} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input name="address.city" value={formData.address.city} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input name="address.state" value={formData.address.state} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                <input name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input name="contactInfo.phone" value={formData.contactInfo.phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="contactInfo.email" value={formData.contactInfo.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input name="contactInfo.website" value={formData.contactInfo.website} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Hotline</label>
                <input name="contactInfo.emergencyHotline" value={formData.contactInfo.emergencyHotline} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds *</label>
                <input type="number" name="capacity.totalBeds" value={formData.capacity.totalBeds} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICU Beds</label>
                <input type="number" name="capacity.icuBeds" value={formData.capacity.icuBeds} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Beds</label>
                <input type="number" name="capacity.emergencyBeds" value={formData.capacity.emergencyBeds} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {facilities.map((facility) => (
                <label key={facility} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleArrayChange('facilities', facility)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="capitalize">{facility.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specializations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {specializations.map((spec) => (
                <label key={spec} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(spec)}
                    onChange={() => handleArrayChange('specializations', spec)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{spec}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Emergency Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Services</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="emergencyServices.available"
                checked={formData.emergencyServices.available}
                onChange={handleChange}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">24/7 Emergency Services Available</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Creating...' : 'Create Hospital'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

