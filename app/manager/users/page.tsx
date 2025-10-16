'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../lib/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Users, User, ArrowLeft, Plus, Eye, Edit, Trash2, Filter, Search } from 'lucide-react';
import Link from 'next/link';

export default function UserManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    isActive: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage]);

  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.search) {
      filtered = filtered.filter(user => 
        user.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.isActive !== '') {
      filtered = filtered.filter(user => user.isActive === (filters.isActive === 'true'));
    }

    setFilteredUsers(filtered);
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await usersAPI.update(userId, { isActive: !isActive });
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient':
        return 'Patient';
      case 'healthcare_professional':
        return 'Healthcare Professional';
      case 'hospital_staff':
        return 'Hospital Staff';
      case 'healthcare_manager':
        return 'Healthcare Manager';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'patient':
        return 'bg-blue-100 text-blue-800';
      case 'healthcare_professional':
        return 'bg-green-100 text-green-800';
      case 'hospital_staff':
        return 'bg-yellow-100 text-yellow-800';
      case 'healthcare_manager':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/manager/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <Link
              href="/manager/users/create"
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="patient">Patient</option>
                <option value="healthcare_professional">Healthcare Professional</option>
                <option value="hospital_staff">Hospital Staff</option>
                <option value="healthcare_manager">Healthcare Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name or email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ role: '', search: '', isActive: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Users ({filteredUsers.length})
            </h2>
            
            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((userItem) => (
                  <div key={userItem._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {userItem.userName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {userItem.email}
                            </p>
                            <div className="mt-2 flex items-center space-x-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
                                {getRoleDisplayName(userItem.role)}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {userItem.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Phone: {userItem.phone}</p>
                              <p>Registered: {new Date(userItem.createdAt).toLocaleDateString()}</p>
                              {userItem.specialization && (
                                <p>Specialization: {userItem.specialization}</p>
                              )}
                              {userItem.staffRole && (
                                <p>Staff Role: {userItem.staffRole}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/manager/users/${userItem._id}`}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/manager/users/${userItem._id}/edit`}
                            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 flex items-center"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => toggleUserStatus(userItem._id, userItem.isActive)}
                            className={`text-xs px-3 py-1 rounded flex items-center ${
                              userItem.isActive 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {userItem.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteUser(userItem._id)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {users.length === 0 
                    ? "No users have been registered yet."
                    : "No users match your current filters."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                  </span> of{' '}
                  <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

