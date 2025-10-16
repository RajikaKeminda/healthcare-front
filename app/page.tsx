'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import PatientDashboard from '../components/dashboards/PatientDashboard';
import HealthcareProfessionalDashboard from '../components/dashboards/HealthcareProfessionalDashboard';
import HealthcareManagerDashboard from '../components/dashboards/HealthcareManagerDashboard';
import HospitalStaffDashboard from '../components/dashboards/HospitalStaffDashboard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'patient':
        return <PatientDashboard />;
      case 'healthcare_professional':
        return <HealthcareProfessionalDashboard />;
      case 'healthcare_manager':
        return <HealthcareManagerDashboard />;
      case 'hospital_staff':
        return <HospitalStaffDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Smart Healthcare System
              </h1>
              <p className="text-gray-600">
                Your role is not yet configured. Please contact administrator.
              </p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
}
