const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getConfig: () => request('/config/public'),
  getDashboard: () => request('/dashboard'),
  getBloodPressure: (days = 30) => request(`/blood-pressure?days=${days}`),
  createBloodPressure: (data) =>
    request('/blood-pressure', { method: 'POST', body: JSON.stringify(data) }),
  deleteBloodPressure: (id) => request(`/blood-pressure/${id}`, { method: 'DELETE' }),
  getActivity: (days = 30) => request(`/activity?days=${days}`),
  upsertActivity: (data) => request('/activity', { method: 'POST', body: JSON.stringify(data) }),
  subscribePush: (subscription) =>
    request('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) }),
  testPush: () => request('/push/test', { method: 'POST' }),
};

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(vapidPublicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const json = subscription.toJSON();
  await api.subscribePush({
    endpoint: json.endpoint,
    keys: json.keys,
  });
  return subscription;
}
