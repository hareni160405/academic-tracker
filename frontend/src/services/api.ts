const API_BASE = '/api';

function getAuthHeaders(isFormData: boolean = false): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg = data?.detail || data?.message || 'An unexpected error occurred.';
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }
  return data as T;
}

export const api = {
  // Auth
  async register(body: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async login(body: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updateProfile(body: any) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async changePassword(body: any) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  // Tasks
  async getTasks(filterBy: string = 'all') {
    const res = await fetch(`${API_BASE}/tasks?filter_by=${filterBy}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async createTask(body: any) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async updateTask(id: string, body: any) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async toggleTask(id: string) {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async deleteTask(id: string) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getTaskStats() {
    const res = await fetch(`${API_BASE}/tasks/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Timer
  async getTimerStatus() {
    const res = await fetch(`${API_BASE}/timer/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async startTimer(subject: string = 'General Study') {
    const res = await fetch(`${API_BASE}/timer/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subject }),
    });
    return handleResponse<any>(res);
  },

  async stopTimer(reason: string = 'MANUAL_STOP', notes?: string) {
    const res = await fetch(`${API_BASE}/timer/stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, notes }),
    });
    return handleResponse<any>(res);
  },

  async sendHeartbeat(sessionId: string) {
    const res = await fetch(`${API_BASE}/timer/heartbeat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });
    return handleResponse<any>(res);
  },

  async getStudyAnalytics() {
    const res = await fetch(`${API_BASE}/timer/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Calendar
  async getCalendarEvents() {
    const res = await fetch(`${API_BASE}/calendar/events`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async createCalendarEvent(body: any) {
    const res = await fetch(`${API_BASE}/calendar/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async updateCalendarEvent(id: string, body: any) {
    const res = await fetch(`${API_BASE}/calendar/events/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async deleteCalendarEvent(id: string) {
    const res = await fetch(`${API_BASE}/calendar/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getVapidKey() {
    const res = await fetch(`${API_BASE}/calendar/vapid-key`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ vapid_public_key: string }>(res);
  },

  async savePushSubscription(subscription: PushSubscription) {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');
    if (!key || !auth) return;

    const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(key))));
    const authKey = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth))));

    const res = await fetch(`${API_BASE}/calendar/push-subscription`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh,
        auth: authKey,
      }),
    });
    return handleResponse<any>(res);
  },

  // Assessments
  async uploadStudyMaterial(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/assessments/upload-material`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse<any>(res);
  },

  async generateAssessment(body: any) {
    const res = await fetch(`${API_BASE}/assessments/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<any>(res);
  },

  async listAssessments() {
    const res = await fetch(`${API_BASE}/assessments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getAssessment(id: string) {
    const res = await fetch(`${API_BASE}/assessments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async submitAssessment(id: string, answers: any[], timeSpentSeconds: number) {
    const res = await fetch(`${API_BASE}/assessments/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        answers,
        time_spent_seconds: timeSpentSeconds,
      }),
    });
    return handleResponse<any>(res);
  },

  async getAttemptResult(attemptId: string) {
    const res = await fetch(`${API_BASE}/assessments/attempts/${attemptId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  // AI Assistant
  async sendChatMessage(message: string, conversationId?: string, includeWeakTopics: boolean = true) {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        include_weak_topics_context: includeWeakTopics,
      }),
    });
    return handleResponse<any>(res);
  },

  async getConversations() {
    const res = await fetch(`${API_BASE}/assistant/conversations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getStudySuggestions() {
    const res = await fetch(`${API_BASE}/assistant/suggestions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // Reports
  async getPerformanceReport() {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },
};
