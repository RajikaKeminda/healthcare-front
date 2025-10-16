'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { hospitalsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ArrowLeft, Plus, Eye, Edit, Search, Building2, MapPin, Phone } from 'lucide-react';

export default function ManagerHospitalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'healthcare_manager') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await hospitalsAPI.getAll({ limit: 100 });
      setHospitals(res.data.data.hospitals);
    } catch (err) {
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch = !searchQuery || 
      hospital.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || hospital.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/manager/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
            </div>
            <Link
              href="/manager/hospitals/create"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Hospital
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or city"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="teaching">Teaching</option>
                <option value="specialty">Specialty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hospitals List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Hospitals ({filteredHospitals.length})
            </h2>
            {filteredHospitals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHospitals.map((hospital) => (
                  <div key={hospital._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <Building2 className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {hospital.name}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{hospital.address?.city}, {hospital.address?.state}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span>{hospital.contactInfo?.phone}</span>
                            </div>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                hospital.type === 'public' ? 'bg-blue-100 text-blue-800' :
                                hospital.type === 'private' ? 'bg-green-100 text-green-800' :
                                hospital.type === 'teaching' ? 'bg-purple-100 text-purple-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {hospital.type}
                              </span>
                              {!hospital.isActive && (
                                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-xs mt-2">
                              <span className="font-medium">{hospital.capacity?.totalBeds || 0}</span> total beds, 
                              <span className="font-medium ml-1">{hospital.capacity?.occupiedBeds || 0}</span> occupied
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Link
                          href={`/manager/hospitals/${hospital._id}`}
                          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-center whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          View
                        </Link>
                        <Link
                          href={`/manager/hospitals/${hospital._id}/edit`}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-center whitespace-nowrap"
                        >
                          <Edit className="w-3 h-3 inline mr-1" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                {searchQuery || typeFilter ? 'No hospitals found matching your filters' : 'No hospitals yet'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

