importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBL6ijCX-bEUHObmC96CKvCyqJ4RFFL1sw",
  authDomain: "root-cosine-qpthm.firebaseapp.com",
  projectId: "root-cosine-qpthm",
  storageBucket: "root-cosine-qpthm.firebasestorage.app",
  messagingSenderId: "770061873766",
  appId: "1:770061873766:web:9be5adae89d5db5ccfb3a7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Adjust if you have a logo
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
