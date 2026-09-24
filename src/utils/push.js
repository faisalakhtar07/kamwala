import { api } from '../api/client';

// Converts the VAPID public key (base64url, from the backend) into the
// Uint8Array format the PushManager API expects.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

let cachedPublicKey = null;
async function getVapidPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const data = await api.get('/push/vapid-public-key');
  cachedPublicKey = data?.publicKey || null;
  return cachedPublicKey;
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPushPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// Requests permission (if needed) and registers this device for real
// push notifications - the kind that show on the lock screen / tray even
// with the app fully closed. Safe to call repeatedly; no-ops quietly on
// unsupported browsers or when the backend hasn't configured VAPID keys.
export async function enablePushNotifications() {
  try {
    if (!isPushSupported()) return false;
    if (Notification.permission === 'denied') return false;

    const publicKey = await getVapidPublicKey();
    if (!publicKey) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await api.post('/push/subscribe', { subscription: subscription.toJSON() });
    return true;
  } catch (err) {
    console.warn('Push subscription failed:', err);
    return false;
  }
}

export async function disablePushNotifications() {
  try {
    if (!isPushSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await api.post('/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
    await subscription.unsubscribe();
  } catch (err) {
    console.warn('Push unsubscribe failed:', err);
  }
}
