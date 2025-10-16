'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { hospitalsAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { ArrowLeft, Edit, Building2, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';

export default function ViewHospitalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);

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
      setHospital(res.data.data.hospital);
    } catch (err) {
      toast.error('Failed to load hospital');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || !hospital) {
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
            <Link href="/manager/hospitals" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Hospitals
            </Link>
            <Link
              href={`/manager/hospitals/${id}/edit`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <Building2 className="w-12 h-12 text-indigo-600" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Hospital ID: {hospital.hospitalID}</p>
              <div className="mt-3 flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  hospital.type === 'public' ? 'bg-blue-100 text-blue-800' :
                  hospital.type === 'private' ? 'bg-green-100 text-green-800' :
                  hospital.type === 'teaching' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {hospital.type.toUpperCase()}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  hospital.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
          </div>
          <p className="text-gray-700">
            {hospital.address?.street}<br />
            {hospital.address?.city}, {hospital.address?.state} {hospital.address?.zipCode}<br />
            {hospital.address?.country}
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-2" />
              <span>{hospital.contactInfo?.phone}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Mail className="w-4 h-4 mr-2" />
              <span>{hospital.contactInfo?.email}</span>
            </div>
            {hospital.contactInfo?.website && (
              <div className="flex items-center text-gray-700">
                <Globe className="w-4 h-4 mr-2" />
                <a href={hospital.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {hospital.contactInfo.website}
                </a>
              </div>
            )}
            {hospital.contactInfo?.emergencyHotline && (
              <div className="flex items-center text-gray-700">
                <Phone className="w-4 h-4 mr-2 text-red-600" />
                <span className="text-red-600 font-medium">Emergency: {hospital.contactInfo.emergencyHotline}</span>
              </div>
            )}
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{hospital.capacity?.totalBeds || 0}</p>
              <p className="text-sm text-gray-500">Total Beds</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{hospital.capacity?.occupiedBeds || 0}</p>
              <p className="text-sm text-gray-500">Occupied</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{hospital.capacity?.icuBeds || 0}</p>
              <p className="text-sm text-gray-500">ICU Beds</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{hospital.capacity?.emergencyBeds || 0}</p>
              <p className="text-sm text-gray-500">Emergency Beds</p>
            </div>
          </div>
        </div>

        {/* Facilities */}
        {hospital.facilities && hospital.facilities.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {hospital.facilities.map((facility: string) => (
                <span key={facility} className="inline-flex px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full capitalize">
                  {facility.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specializations */}
        {hospital.specializations && hospital.specializations.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {hospital.specializations.map((spec: string) => (
                <span key={spec} className="inline-flex px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Services */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Emergency Services</h3>
          </div>
          <p className="text-gray-700">
            {hospital.emergencyServices?.available ? (
              <span className="text-green-600 font-medium">✓ Available {hospital.emergencyServices.hours}</span>
            ) : (
              <span className="text-red-600">✗ Not Available</span>
            )}
          </p>
        </div>

        {/* Timestamps */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Record Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span> {new Date(hospital.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(hospital.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

