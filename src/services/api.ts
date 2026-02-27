import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get token from zustand persist store
const getToken = (): string | null => {
  try {
    const authData = localStorage.getItem('goalflow-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      // Zustand persist stores state under 'state' key - get token from there
      return parsed.state?.token || null;
    }
  } catch (e) {
    console.error('Error getting token from storage:', e);
  }
  return null;
};

// Helper function to get refresh token from zustand persist store
const getRefreshToken = (): string | null => {
  try {
    const authData = localStorage.getItem('goalflow-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.state?.refreshToken || null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

// Update token in storage
const updateToken = (accessToken: string): void => {
  try {
    const authData = localStorage.getItem('goalflow-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      const newAuthData = {
        ...parsed,
        state: {
          ...parsed.state,
          token: accessToken,
        },
      };
      localStorage.setItem('goalflow-auth', JSON.stringify(newAuthData));
    }
  } catch (e) {
    console.error('Error updating token:', e);
  }
};

// Clear auth data on logout
const clearAuth = (): void => {
  localStorage.removeItem('goalflow-auth');
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors and auto-refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        
        // Update token in store
        updateToken(accessToken);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

export const goalsAPI = {
  getVisions: () => api.get('/goals/visions'),
  createVision: (data: { title: string; description?: string; icon?: string; targetDate?: string }) =>
    api.post('/goals/visions', data),
  updateVision: (id: string, data: { title?: string; description?: string; icon?: string; targetDate?: string }) =>
    api.put(`/goals/visions/${id}`, data),
  deleteVision: (id: string) => api.delete(`/goals/visions/${id}`),

  getMilestones: () => api.get('/goals/milestones'),
  createMilestone: (data: { visionId: string; title: string; description?: string; icon?: string; targetDate?: string }) =>
    api.post('/goals/milestones', data),
  updateMilestone: (id: string, data: { title?: string; description?: string; icon?: string; targetDate?: string; status?: string }) =>
    api.put(`/goals/milestones/${id}`, data),
  deleteMilestone: (id: string) => api.delete(`/goals/milestones/${id}`),

  getHabits: () => api.get('/goals/habits'),
  getHabitsStats: () => api.get('/goals/habits/stats'),
  getHabitActivity: (id: string, days?: number) => api.get(`/goals/habits/activity/${id}`, { params: { days } }),
  createHabit: (data: { milestoneId?: string; title: string; description?: string; frequency?: { targetCount: number; period: 'day' | 'week' | 'month' }; reminder?: string; icon?: string; color?: string; estimatedTime?: number }) =>
    api.post('/goals/habits', data),
  updateHabit: (id: string, data: { title?: string; description?: string; frequency?: { targetCount: number; period: 'day' | 'week' | 'month' }; reminder?: string; isActive?: boolean; icon?: string; color?: string; estimatedTime?: number; streak?: number; completedToday?: boolean; milestoneId?: string }) =>
    api.put(`/goals/habits/${id}`, data),
  toggleHabitComplete: (id: string) => api.put(`/goals/habits/${id}/complete`),
  deleteHabit: (id: string) => api.delete(`/goals/habits/${id}`),
};

export const tasksAPI = {
  getTasks: () => api.get('/tasks'),
  createTask: (data: { title: string; description?: string; habitId?: string; milestoneId?: string; dueDate?: string }) =>
    api.post('/tasks', data),
  updateTask: (id: string, data: { title?: string; description?: string; status?: string; dueDate?: string }) =>
    api.put(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  completeTask: (id: string) => api.patch(`/tasks/${id}/complete`),
  updateTaskStatus: (id: string, status: string) =>
    api.patch(`/tasks/${id}/status`, { status }),
  getTodayTasks: () => api.get('/tasks/today'),
  getPendingTasks: () => api.get('/tasks/pending'),
  getOverdueTasks: () => api.get('/tasks/overdue'),
  getFutureTasks: () => api.get('/tasks/future'),
  getCompletedTasks: () => api.get('/tasks/completed'),
  filterTasks: (params: { status?: string; time?: string; startDate?: string; endDate?: string; milestoneId?: string; habitId?: string; sortBy?: string; order?: string }) =>
    api.get('/tasks/filtered', { params }),
};

export const analyticsAPI = {
  getStats: (visionId?: string) => api.get('/analytics', { params: { visionId } }),
  getStreak: () => api.get('/analytics/streak'),
  getCompletionRate: () => api.get('/analytics/completion-rate'),
  getProductiveHours: () => api.get('/analytics/productive-hours'),
  getWeeklyProgress: () => api.get('/analytics/weekly-progress'),
  getDaily: () => api.get('/analytics/daily'),
  getWeekly: () => api.get('/analytics/weekly'),
  getMonthly: (year: number, month: number) => api.get(`/analytics/monthly?year=${year}&month=${month}`),
  getStreaks: () => api.get('/analytics/streaks'),
};

export const focusAPI = {
  getSessions: () => api.get('/focus/sessions'),
  createSession: (data: { duration: number; type: string }) =>
    api.post('/focus/sessions', data),
  getTodayFocus: () => api.get('/focus/today'),
};

export const aiAPI = {
  analyzeProductivity: (data: { journal?: string }) =>
    api.post('/ai/analyze', data),
  suggestTasks: () => api.get('/ai/suggestions'),
};

export const disciplineAPI = {
  getJournals: () => api.get('/discipline/journals'),
  createJournal: (data: { reason: string }) =>
    api.post('/discipline/journals', data),
  getStreak: () => api.get('/discipline/streak'),
  checkIn: () => api.post('/discipline/check-in'),
};

export const settingsAPI = {
  getSettings: () => api.get('/users/settings'),
  updateSettings: (data: { dailyGoal?: number; pomodoroWork?: number; pomodoroBreak?: number; soundEnabled?: boolean; theme?: string }) =>
    api.put('/users/settings', data),
};

export default api;
