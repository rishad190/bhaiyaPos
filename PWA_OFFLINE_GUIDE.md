# 📱 PWA & Offline Capability Implementation Guide

## ✅ What's Been Implemented

Your POS system now has full Progressive Web App (PWA) capabilities with offline support!

### 🎯 Key Features

1. **Installable App** - Users can install the app on their device like a native app
2. **Offline Data Access** - View cached data (customers, transactions, etc.) when offline
3. **Automatic Sync** - Changes sync automatically when connection is restored
4. **Smart Caching** - Static assets and API responses are cached intelligently
5. **Visual Feedback** - Users see when they're offline and when they reconnect

---

## 🔧 Technical Implementation

### 1. PWA Configuration (`next.config.mjs`)

```javascript
- Uses next-pwa for service worker generation
- Caches Firebase/Firestore API calls with NetworkFirst strategy
- Caches images with CacheFirst strategy
- Disabled in development for easier debugging
```

**Caching Strategies**:
- **NetworkFirst**: Try network, fallback to cache (Firebase API calls)
- **CacheFirst**: Use cache, update in background (images, static assets)

### 2. Query Persistence (`src/lib/persistQueryClient.js`)

```javascript
- Saves React Query cache to IndexedDB (or localStorage fallback)
- Persists for 7 days
- Only caches successful queries
- Automatically restores on app load
```

### 3. Offline-First Network Mode

```javascript
// In queryClient.js
networkMode: 'offlineFirst'
```

This allows:
- Queries to return cached data immediately when offline
- Mutations to queue and execute when back online
- Seamless offline/online transitions

### 4. Offline Indicator Component

Visual feedback showing:
- 🔴 Orange banner when offline
- 🟢 Green banner when reconnected
- Auto-hides after 3 seconds when online

---

## 📦 Installed Packages

```bash
npm install @tanstack/react-query-persist-client idb-keyval next-pwa
```

- **@tanstack/react-query-persist-client**: Persist React Query cache
- **idb-keyval**: Simple IndexedDB wrapper for better storage
- **next-pwa**: PWA support for Next.js

---

## 🚀 How It Works

### Normal Operation (Online)
```
User opens app
  ↓
Loads from network
  ↓
Caches data in IndexedDB
  ↓
Shows fresh data
```

### Offline Operation
```
User opens app (offline)
  ↓
Loads from IndexedDB cache
  ↓
Shows cached data
  ↓
Displays "You're offline" banner
  ↓
User makes changes (queued)
  ↓
Connection restored
  ↓
Syncs queued changes
  ↓
Shows "Back online" banner
```

---

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit your app
2. Look for install icon in address bar
3. Click "Install"
4. App opens in standalone window

### Mobile (Android)
1. Visit your app
2. Tap browser menu (⋮)
3. Tap "Add to Home Screen"
4. App icon appears on home screen

### Mobile (iOS)
1. Visit your app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App icon appears on home screen

---

## 🎨 Customization

### Update App Icons

Replace these files in `/public`:
- `icon-192x192.png` - Small icon (192x192px)
- `icon-512x512.png` - Large icon (512x512px)

You can generate these from your logo using online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Update Manifest (`public/manifest.json`)

```json
{
  "name": "Your POS Name",
  "short_name": "POS",
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

### Adjust Cache Duration

In `src/lib/persistQueryClient.js`:
```javascript
maxAge: 1000 * 60 * 60 * 24 * 7, // Change 7 to desired days
```

---

## 🧪 Testing Offline Capability

### Chrome DevTools Method
1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Change "Online" dropdown to "Offline"
4. Test your app functionality

### Real Device Method
1. Install the PWA on your device
2. Turn on Airplane Mode
3. Open the installed app
4. Verify you can view cached data

### What to Test
- ✅ View customer list (should show cached data)
- ✅ View transactions (should show cached data)
- ✅ Add new customer (should queue until online)
- ✅ Offline indicator appears
- ✅ Changes sync when back online

---

## 📊 What Gets Cached

### Automatically Cached
- ✅ Customer list
- ✅ Transaction history
- ✅ Supplier list
- ✅ Fabric inventory
- ✅ Static assets (images, CSS, JS)
- ✅ Firebase API responses

### Not Cached (Requires Network)
- ❌ New data fetches (will use cache if offline)
- ❌ Real-time updates (will sync when online)
- ❌ Authentication (requires network)

---

## 🔒 Security Considerations

1. **Sensitive Data**: Cache is stored locally on device
   - Only cache non-sensitive data
   - Consider encryption for sensitive info

2. **Cache Invalidation**: Cache expires after 7 days
   - Update `buster` in persistQueryClient.js to force clear cache

3. **Authentication**: Users must be online to login
   - Session persists for offline use after login

---

## 🐛 Troubleshooting

### Service Worker Not Updating
```bash
# Clear service worker cache
1. Open DevTools → Application → Service Workers
2. Click "Unregister"
3. Hard refresh (Ctrl+Shift+R)
```

### Cache Not Persisting
```javascript
// Check browser console for errors
// IndexedDB might be disabled in private browsing
```

### PWA Not Installable
```bash
# Check PWA requirements in DevTools
1. Open DevTools → Lighthouse
2. Run PWA audit
3. Fix any issues listed
```

### Offline Indicator Not Showing
```javascript
// Check browser console
// Ensure OfflineIndicator is imported in ClientRoot
```

---

## 🎯 Benefits Achieved

| Feature | Before | After |
|---------|--------|-------|
| **Offline Access** | ❌ None | ✅ Full cache access |
| **Installation** | ❌ Browser only | ✅ Installable app |
| **Load Speed** | 🐌 Network dependent | ⚡ Instant from cache |
| **Data Persistence** | ❌ Lost on refresh | ✅ Persists 7 days |
| **User Experience** | 😐 Basic | 🎉 Native app feel |

---

## 📈 Performance Impact

- **First Load**: Slightly slower (caching setup)
- **Subsequent Loads**: Much faster (cache hit)
- **Offline**: Instant (no network wait)
- **Storage**: ~5-50MB depending on data size

---

## 🔄 Future Enhancements

Consider adding:
1. **Background Sync** - Sync data in background when online
2. **Push Notifications** - Notify users of updates
3. **Periodic Sync** - Auto-refresh data periodically
4. **Offline Queue UI** - Show pending changes to user
5. **Conflict Resolution** - Handle data conflicts better

---

## 📝 Usage in Components

### Check Online Status
```javascript
import { useOnlineStatus } from '@/components/OfflineIndicator';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {!isOnline && <p>You're offline - changes will sync later</p>}
    </div>
  );
}
```

### Disable Actions When Offline
```javascript
const isOnline = useOnlineStatus();

<Button disabled={!isOnline}>
  {isOnline ? 'Save' : 'Offline - Cannot Save'}
</Button>
```

---

## ✅ Checklist

Before deploying:
- [ ] Add custom app icons (192x192 and 512x512)
- [ ] Update manifest.json with your branding
- [ ] Test offline functionality thoroughly
- [ ] Test PWA installation on mobile devices
- [ ] Verify cache invalidation works
- [ ] Check service worker updates properly
- [ ] Test on slow/spotty connections
- [ ] Verify data syncs when reconnected

---

## 🎉 Summary

Your POS system now works offline! Users can:
- Install it like a native app
- View cached data without internet
- Make changes that sync automatically
- Get visual feedback about connection status

This provides a much better experience for retail environments where internet connectivity might be unreliable.
