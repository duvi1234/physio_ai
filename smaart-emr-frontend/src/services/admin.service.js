import api from './api';

const handleApiError = (error) => {
  const message = error?.response?.data?.message || error?.message || 'An error occurred';
  throw new Error(message);
};

export const adminService = {
  // ==================== PATIENTS ====================
  patients: {
    list: async (params = {}) => {
      try {
        const response = await api.get('/admin/patients', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    get: async (patientId) => {
      try {
        const response = await api.get(`/admin/patients/${patientId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    create: async (payload) => {
      try {
        const response = await api.post('/admin/patients', payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    update: async (patientId, payload) => {
      try {
        const response = await api.put(`/admin/patients/${patientId}`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    delete: async (patientId) => {
      try {
        const response = await api.delete(`/admin/patients/${patientId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    activate: async (patientId) => {
      try {
        const response = await api.patch(`/admin/patients/${patientId}/activate`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    getTimeline: async (patientId) => {
      try {
        const response = await api.get(`/admin/patients/${patientId}/timeline`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== APPOINTMENTS ====================
  appointments: {
    list: async (params = {}) => {
      try {
        const response = await api.get('/admin/appointments', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    get: async (appointmentId) => {
      try {
        const response = await api.get(`/admin/appointments/${appointmentId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    create: async (payload) => {
      try {
        const response = await api.post('/admin/appointments', payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    update: async (appointmentId, payload) => {
      try {
        const response = await api.put(`/admin/appointments/${appointmentId}`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    updateStatus: async (appointmentId, status) => {
      try {
        const response = await api.patch(`/admin/appointments/${appointmentId}/status`, { status });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    reassign: async (appointmentId, payload) => {
      try {
        const response = await api.patch(`/admin/appointments/${appointmentId}/reassign`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    delete: async (appointmentId) => {
      try {
        const response = await api.delete(`/admin/appointments/${appointmentId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    activate: async (appointmentId) => {
      try {
        const response = await api.patch(`/admin/appointments/${appointmentId}/activate`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== NURSES ====================
  nurses: {
    list: async (params = {}) => {
      try {
        const response = await api.get('/admin/nurses', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    get: async (nurseId) => {
      try {
        const response = await api.get(`/admin/nurses/${nurseId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    create: async (payload) => {
      try {
        const response = await api.post('/admin/nurses', payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    update: async (nurseId, payload) => {
      try {
        const response = await api.put(`/admin/nurses/${nurseId}`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    delete: async (nurseId) => {
      try {
        const response = await api.delete(`/admin/nurses/${nurseId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    resetPassword: async (nurseId) => {
      try {
        const response = await api.patch(`/admin/nurses/${nurseId}/reset-password`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    activate: async (nurseId) => {
      try {
        const response = await api.patch(`/admin/nurses/${nurseId}/activate`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== PHYSIOTHERAPISTS ====================
  physios: {
    list: async (params = {}) => {
      try {
        const response = await api.get('/admin/physios', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    get: async (physioId) => {
      try {
        const response = await api.get(`/admin/physios/${physioId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    create: async (payload) => {
      try {
        const response = await api.post('/admin/physios', payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    update: async (physioId, payload) => {
      try {
        const response = await api.put(`/admin/physios/${physioId}`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    delete: async (physioId) => {
      try {
        const response = await api.delete(`/admin/physios/${physioId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    activate: async (physioId) => {
      try {
        const response = await api.patch(`/admin/physios/${physioId}/activate`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    resetPassword: async (physioId) => {
      try {
        const response = await api.patch(`/admin/physios/${physioId}/reset-password`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== APPOINTMENT REQUESTS ====================
  requests: {
    list: async (params = {}) => {
      try {
        const response = await api.get('/admin/requests', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    get: async (requestId) => {
      try {
        const response = await api.get(`/admin/requests/${requestId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    approve: async (requestId, payload) => {
      try {
        const response = await api.patch(`/admin/requests/${requestId}/approve`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    reject: async (requestId) => {
      try {
        const response = await api.patch(`/admin/requests/${requestId}/reject`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    update: async (requestId, payload) => {
      try {
        const response = await api.put(`/admin/requests/${requestId}`, payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    delete: async (requestId) => {
      try {
        const response = await api.delete(`/admin/requests/${requestId}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    activate: async (requestId) => {
      try {
        const response = await api.patch(`/admin/requests/${requestId}/activate`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== REPORTS ====================
  reports: {
    patientGrowth: async (params = {}) => {
      try {
        const response = await api.get('/admin/reports/patients-growth', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    appointmentTrends: async (params = {}) => {
      try {
        const response = await api.get('/admin/reports/appointments-trends', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    physioWorkload: async (params = {}) => {
      try {
        const response = await api.get('/admin/reports/physio-workload', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    painAreas: async (params = {}) => {
      try {
        const response = await api.get('/admin/reports/pain-areas', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    treatmentCompletion: async (params = {}) => {
      try {
        const response = await api.get('/admin/reports/treatment-completion', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== SETTINGS ====================
  settings: {
    get: async () => {
      try {
        const response = await api.get('/admin/settings');
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    update: async (payload) => {
      try {
        const response = await api.put('/admin/settings', payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    updateRoles: async (payload) => {
      try {
        const response = await api.patch('/admin/settings/roles', payload);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  },

  // ==================== DASHBOARD ====================
  dashboard: {
    stats: async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
    activityLog: async (params = {}) => {
      try {
        const response = await api.get('/admin/dashboard/activity-log', { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    }
  }
};

export default adminService;
