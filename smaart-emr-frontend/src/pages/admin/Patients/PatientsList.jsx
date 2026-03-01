import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, RotateCcw, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../../../layouts/AdminLayout';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';
import ConfirmationModal from '../../../components/admin/ConfirmationModal';
import { Toast } from '../../../components/admin/Toast';
import StatusBadge from '../../../components/admin/StatusBadge';
import SearchBar from '../../../components/admin/SearchBar';
import LoadingSkeleton from '../../../components/admin/LoadingSkeleton';
import EmptyState from '../../../components/admin/EmptyState';
import Pagination from '../../../components/admin/Pagination';
import adminService from '../../../services/admin.service';
import { Users } from 'lucide-react';

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const countryOptions = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Australia', 'Canada', 'Other'];

const emptyForm = {
  firstName: '', lastName: '', gender: '', dateOfBirth: '', phone: '', email: '',
  bloodGroup: '', addressLine1: '', addressLine2: '', city: '', state: '',
  postalCode: '', country: '', emergencyContactName: '',
  emergencyContactRelationship: '', emergencyContactPhone: ''
};

export default function PatientsList() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, data: null });
  const [restoreConfirm, setRestoreConfirm] = useState({ open: false, id: null });

  const [toast, setToast] = useState(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await adminService.patients.list();
      const data = Array.isArray(response.data) ? response.data : response;
      setPatients(data || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    let filtered = patients;
    if (filter === 'active') filtered = filtered.filter(p => p.isActive !== false);
    if (filter === 'inactive') filtered = filtered.filter(p => p.isActive === false);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.patientId?.toLowerCase().includes(q) ||
        p.firstName?.toLowerCase().includes(q) ||
        p.lastName?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      );
    }
    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [patients, search, filter]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(age, 0);
  };

  const handleCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (patient) => {
    setForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      gender: patient.gender || '',
      dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
      phone: patient.phone || '',
      email: patient.email || '',
      bloodGroup: patient.bloodGroup || '',
      addressLine1: patient.addressLine1 || '',
      addressLine2: patient.addressLine2 || '',
      city: patient.city || '',
      state: patient.state || '',
      postalCode: patient.postalCode || '',
      country: patient.country || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactRelationship: patient.emergencyContactRelationship || '',
      emergencyContactPhone: patient.emergencyContactPhone || ''
    });
    setEditingId(patient._id || patient.patientId);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.gender || !form.dateOfBirth) {
      setToast({ type: 'error', message: 'Fill all required fields' });
      return;
    }
    if (!form.emergencyContactName || !form.emergencyContactRelationship || !form.emergencyContactPhone) {
      setToast({ type: 'error', message: 'Emergency contact details required' });
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await adminService.patients.update(editingId, form);
        setToast({ type: 'success', message: 'Patient updated successfully' });
      } else {
        await adminService.patients.create(form);
        setToast({ type: 'success', message: 'Patient created successfully' });
      }
      setModalOpen(false);
      loadPatients();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await adminService.patients.delete(deleteConfirm.id);
      setToast({ type: 'success', message: 'Patient deactivated' });
      setDeleteConfirm({ open: false, id: null, data: null });
      loadPatients();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setSubmitting(true);
      await adminService.patients.activate(restoreConfirm.id);
      setToast({ type: 'success', message: 'Patient reactivated' });
      setRestoreConfirm({ open: false, id: null });
      loadPatients();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'patientId',
      label: 'Patient ID',
      sortable: true,
      render: (value) => <span className="font-semibold text-cyan-700">{value || '-'}</span>
    },
    { key: 'firstName', label: 'First Name', sortable: true },
    { key: 'lastName', label: 'Last Name', sortable: true },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value || '-'
    },
    {
      key: 'gender',
      label: 'Gender',
      render: (value) => value || '-'
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => <StatusBadge status={value === false ? 'INACTIVE' : 'ACTIVE'} />
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 transition"
          >
            <Edit2 size={14} />
          </button>
          {row.isActive !== false ? (
            <button
              onClick={() => setDeleteConfirm({ open: true, id: row._id || row.patientId, data: row })}
              className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200 transition"
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => setRestoreConfirm({ open: true, id: row._id || row.patientId })}
              className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Patients Management"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Patients', href: '#' }]}
    >
      <div className="space-y-6">
        {/* Header & Controls */}
        <motion.div
          className="rounded-2xl border border-white/20 bg-white/90 backdrop-blur-md p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                <Users className="text-cyan-700" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">All Patients</h2>
                <p className="text-sm text-slate-500">{filteredPatients.length} patients</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
            >
              <Plus size={18} /> Add Patient
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SearchBar
              placeholder="Search by ID, name, or phone..."
              onSearch={setSearch}
              onClear={() => setSearch('')}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="active">Active Patients</option>
              <option value="inactive">Inactive Patients</option>
              <option value="all">All Patients</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </motion.div>

        {/* Data or Loading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loading ? (
            <LoadingSkeleton count={5} type="table" />
          ) : paginatedPatients.length > 0 ? (
            <DataTable
              columns={columns}
              data={paginatedPatients}
              sortable={true}
              paginate={false}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No patients found"
              message="Start by creating a new patient record"
              action={{ label: 'Create Patient', onClick: handleCreate }}
            />
          )}
        </motion.div>

        {/* Pagination */}
        {filteredPatients.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredPatients.length / pageSize)}
            totalItems={filteredPatients.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        title={editingId ? 'Edit Patient' : 'Create New Patient'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="First Name *"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="tel"
              placeholder="Phone Number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">Select Blood Group</option>
              {bloodGroupOptions.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input
              type="text"
              placeholder="Postal Code"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <input
            type="text"
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />

          <input
            type="text"
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">Select Country</option>
            {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-3 font-semibold text-slate-900">Emergency Contact *</h4>
            <input
              type="text"
              placeholder="Emergency Contact Name *"
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="Relationship *"
              value={form.emergencyContactRelationship}
              onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="tel"
              placeholder="Emergency Phone *"
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.open}
        title="Deactivate Patient?"
        message={`Are you sure you want to deactivate ${deleteConfirm.data?.firstName} ${deleteConfirm.data?.lastName}? They can be reactivated later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null, data: null })}
        danger={true}
        loading={submitting}
      />

      {/* Restore Confirmation */}
      <ConfirmationModal
        isOpen={restoreConfirm.open}
        title="Reactivate Patient?"
        message="Restore this patient record?"
        onConfirm={handleRestore}
        onCancel={() => setRestoreConfirm({ open: false, id: null })}
        loading={submitting}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={4000}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </AdminLayout>
  );
}
