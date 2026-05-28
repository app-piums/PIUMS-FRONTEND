# Push Notifications — Implementación

## Stack

- **Firebase Cloud Messaging (FCM)** — delivery de mensajes push
- **Web Push API** — estándar del browser para recibir pushes en background
- **Service Worker (`sw.js`)** — intercepta pushes cuando la app está cerrada o minimizada
- **Firebase Admin SDK** — usado por el backend para enviar pushes

---

## Flujo completo

```
Firebase Console / Backend
        │
        ▼
   FCM Servers
        │  (Web Push Protocol, encriptado)
        ▼
   Chrome / Browser
        │
        ▼
   sw.js — push event handler
        │
        ▼
   showNotification() → el OS muestra la notificación
```

---

## Archivos involucrados

### Frontend (web-client y web-artist)

| Archivo | Rol |
|---|---|
| `public/sw.js` | SW principal: caching PWA + push handler |
| `public/firebase-messaging-sw.js` | Stub de Firebase (compatibilidad, no es el SW activo) |
| `src/hooks/usePushNotifications.ts` | Hook: pide permiso, obtiene token FCM, lo registra en backend |
| `src/components/PWAInitializer.tsx` | Monta el hook en el layout raíz |

### Backend

| Servicio | Archivo | Rol |
|---|---|---|
| notifications-service | `src/routes/notification.routes.ts` | `POST /push-token` guarda el token; `POST /internal/push` envía push |
| notifications-service | `src/providers/push.provider.ts` | Wrapper sobre Firebase Admin SDK |
| auth-service | `src/controller/auth.controller.ts` | `PATCH /fcm-token` guarda el token en `User.fcmToken` |

---

## Cómo funciona el registro del token

1. `PWAInitializer` monta `PushNotificationManager` en el layout raíz
2. Si `Notification.permission === 'default'` → pide permiso automáticamente a los 3 segundos
3. Si `Notification.permission === 'granted'` → auto-registra el token en silencio al cargar
4. `usePushNotifications` llama a `getToken(messaging, { vapidKey, serviceWorkerRegistration })` usando `/sw.js` como SW
5. El token FCM se envía a `POST /api/notifications/push-token` con `credentials: 'include'`
6. Se cachea en `localStorage` (`fcm_token` en client, `fcm_token_artist` en artist) para evitar re-registros innecesarios

### Cadena backend para guardar el token

```
POST /api/notifications/push-token
  → Next.js fallback rewrite → gateway
    → notifications-service
      → auth-service PATCH /auth/fcm-token
        → User.fcmToken en base de datos
```

---

## Cómo se envía un push desde el backend

### Entre servicios (inter-service)

```http
POST /api/notifications/internal/push
x-internal-secret: <INTERNAL_SERVICE_SECRET>
Content-Type: application/json

{
  "fcmToken": "<token del usuario>",
  "title": "Título",
  "body": "Cuerpo del mensaje",
  "data": { "url": "/ruta-destino", "tag": "tipo-notificacion" }
}
```

### Para obtener el token de un usuario desde otro servicio

```http
GET /auth/internal/fcm-token/:userId
x-internal-secret: <INTERNAL_SERVICE_SECRET>
```

---

## Manejo de mensajes en foreground

Cuando la pestaña está abierta, `onMessage` de Firebase SDK intercepta el mensaje antes de que llegue al SW:

```ts
// en usePushNotifications.ts
onMessage(messaging, (payload) => {
  new Notification(payload.notification?.title ?? 'Piums', {
    body: payload.notification?.body ?? '',
    icon: '/icons/icon-192x192.png',
  });
});
```

---

## Push handler en sw.js

El SW activo es `/sw.js`. Maneja el formato de FCM (`{notification:{title,body}}`) y el formato directo (`{title,body}`):

```js
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }

  // FCM envía {notification:{title,body}, data:{...}}
  // Directo envía {title, body}
  const notif = payload.notification ?? payload;
  const extra = payload.data ?? {};
  const title = notif.title ?? extra.title ?? 'Piums';
  const body  = notif.body  ?? extra.body  ?? 'Tienes una nueva notificación';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: extra.tag ?? 'piums-push',
      data: extra.url ?? '/',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Ver' },
        { action: 'close', title: 'Cerrar' },
      ],
    })
  );
});
```

> **Nota:** El try/catch es crítico. `event.data.json()` lanza excepción si el payload no es JSON válido. Sin él, la excepción ocurre antes de `event.waitUntil()` y la notificación nunca se muestra.

---

## Variables de entorno requeridas

### Frontend (build-time — baked into el bundle de Next.js)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Clave VAPID para obtener el FCM token |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Config de Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Config de Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Config de Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Config de Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Config de Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Config de Firebase |

### Backend (runtime)

| Variable | Servicio | Descripción |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | notifications-service | Service account para Firebase Admin SDK |
| `INTERNAL_SERVICE_SECRET` | todos los servicios | Secret para llamadas inter-servicio |

---

## CI/CD

El workflow `ci.yml` pasa todas las variables de Firebase como build-args al construir las imágenes Docker, leyéndolas desde GitHub Secrets:

```yaml
build-args: |
  NEXT_PUBLIC_FIREBASE_VAPID_KEY=${{ secrets.NEXT_PUBLIC_FIREBASE_VAPID_KEY }}
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
  NEXT_PUBLIC_FIREBASE_API_KEY=${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
  NEXT_PUBLIC_FIREBASE_APP_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
```

---

## Diagnóstico rápido

```js
// 1. Ver permiso actual
Notification.permission  // 'granted' | 'denied' | 'default'

// 2. Ver service workers registrados
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(regs.map(r => r.scope)));

// 3. Ver token FCM cacheado (client)
localStorage.getItem('fcm_token')

// 4. Forzar re-registro del token
localStorage.removeItem('fcm_token')
location.reload()

// 5. Probar showNotification directamente
navigator.serviceWorker.ready
  .then(reg => reg.showNotification('Test', { body: 'prueba' }))
  .then(() => console.log('OK'))
  .catch(e => console.error('ERROR:', e));

// 6. Forzar actualización del SW
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.update()))
  .then(() => location.reload());
```
