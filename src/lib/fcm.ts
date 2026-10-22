import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';

export async function requestNotificationPermission(orderNumber: string, mobile: string) {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BM6j-s_Z_4vH-l_9e_vF-p_q_r_s_t_u_v_w_x_y_z' // This is a placeholder, you should ideally get this from Firebase Console
      });

      if (token) {
        await fetch(`/api/orders/${orderNumber}/fcm-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token, mobile })
        });
        return true;
      }
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
  }
  return false;
}
