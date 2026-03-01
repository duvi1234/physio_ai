export default function StatusBadge({ status = '', variant = 'default' }) {
  const statusStyles = {
    // Appointment statuses
    'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    'CONFIRMED': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
    'ARRIVED': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Arrived' },
    'INTAKE_COMPLETED': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Intake Done' },
    'READY_FOR_PT': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Ready' },
    'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
    'CANCELLED': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Cancelled' },
    'NO_SHOW': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'No Show' },

    // Request statuses
    'PENDING_REQUEST': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    'APPROVED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
    'REJECTED': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Rejected' },
    'CONTACTED': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Contacted' },
    'CONVERTED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Converted' },

    // General statuses
    'ACTIVE': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
    'INACTIVE': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },

    // Pain/Health statuses
    'LOW': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Low' },
    'MEDIUM': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
    'HIGH': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' },
    'CRITICAL': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Critical' }
  };

  const style = statusStyles[status?.toUpperCase()] || statusStyles['INACTIVE'];
  const displayText = style.label || status || 'Unknown';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
      {displayText}
    </span>
  );
}
