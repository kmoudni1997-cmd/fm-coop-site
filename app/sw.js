// FM Squadra — service worker (11/10/2026)
// Serve a mostrare le notifiche di sistema (entrate, chiusure, segnalazioni) ai responsabili
// e ad aprire l'app quando si tocca la notifica. Non mette niente in cache: l'app resta sempre aggiornata.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (L) {
    for (var i = 0; i < L.length; i++) { if (L[i].url.indexOf('/app/') >= 0 && 'focus' in L[i]) return L[i].focus(); }
    return self.clients.openWindow('/app/');
  }));
});
// pronto per le notifiche push vere (a app chiusa), se un giorno le attiviamo
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  // ogni avviso ha il suo tag e renotify: anche se c'è già una notifica con lo stesso tag, suona e compare di nuovo
  e.waitUntil(self.registration.showNotification(d.title || 'FM Squadra', { body: d.body || '', icon: '../assets/favicon-192.png?v=2', badge: '../assets/favicon-192.png?v=2', tag: (d.tag || 'fm') + '-' + Date.now(), renotify: true, timestamp: Date.now() }));
});
