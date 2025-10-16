'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { usersAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function ViewUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth() as any;
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);

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
      setData(res.data.data.user);
    } catch (err) {
      toast.error('Failed to load user');
    }
  };

  const deleteUser = async () => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      setBusy(true);
      await usersAPI.delete(id as string);
      toast.success('User deleted');
      router.push('/manager/users');
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) {
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
            <div className="flex items-center space-x-2">
              <Link href={`/manager/users/${id}/edit`} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Link>
              <button onClick={deleteUser} disabled={busy} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{data.userName}</h2>
            <p className="text-gray-600">{data.email}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Role</span>
              <p className="text-gray-900">{data.role}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <p className="text-gray-900">{data.isActive ? 'Active' : 'Inactive'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Phone</span>
              <p className="text-gray-900">{data.phone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Registered</span>
              <p className="text-gray-900">{new Date(data.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <span className="text-sm text-gray-500">Address</span>
            <p className="text-gray-900">
              {data.address?.street}, {data.address?.city}, {data.address?.state} {data.address?.zipCode}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


