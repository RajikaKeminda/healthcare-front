'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { usersAPI } from '../../../../../lib/api';
import { useAuth } from '../../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;

  useEffect(() => {
    if (!loading && user && user.role !== 'healthcare_manager') {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (id) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await usersAPI.getById(id as string);
      setFormData(res.data.data.user);
    } catch (err) {
      toast.error('Failed to load user');
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setFormData((prev: any) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload._id;
      delete payload.role; // role changes not allowed here
      delete payload.createdAt;
      delete payload.updatedAt;
      await usersAPI.update(id as string, payload);
      toast.success('User updated successfully');
      router.push(`/manager/users/${id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData) {
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
            <Link href={`/manager/users/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to User
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input name="userName" value={formData.userName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <input type="checkbox" name="isActive" checked={!!formData.isActive} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input name="address.street" value={formData.address?.street || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="address.city" value={formData.address?.city || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input name="address.state" value={formData.address?.state || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input name="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
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


