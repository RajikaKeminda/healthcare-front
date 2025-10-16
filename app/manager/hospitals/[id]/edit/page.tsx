'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { hospitalsAPI } from '../../../../../lib/api';
import { useAuth } from '../../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditHospitalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_manager') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && user) fetchHospital();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      const res = await hospitalsAPI.getById(id as string);
      setFormData(res.data.data.hospital);
    } catch (err) {
      toast.error('Failed to load hospital');
    } finally {
      setLoading(false);
    }
  };

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
    } else if (name === 'isActive') {
      setFormData((prev: any) => ({ ...prev, isActive: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload._id;
      delete payload.hospitalID;
      delete payload.createdAt;
      delete payload.updatedAt;
      await hospitalsAPI.update(id as string, payload);
      toast.success('Hospital updated successfully');
      router.push(`/manager/hospitals/${id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update hospital';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !formData) {
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
            <Link href={`/manager/hospitals/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Hospital</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
              <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={formData.type || 'public'} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="teaching">Teaching</option>
                <option value="specialty">Specialty</option>
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isActive" checked={!!formData.isActive} onChange={handleChange} className="rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="contactInfo.phone" value={formData.contactInfo?.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="contactInfo.email" value={formData.contactInfo?.email || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds</label>
              <input type="number" name="capacity.totalBeds" value={formData.capacity?.totalBeds || 0} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupied Beds</label>
              <input type="number" name="capacity.occupiedBeds" value={formData.capacity?.occupiedBeds || 0} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

