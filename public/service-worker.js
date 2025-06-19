self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  // 기본적으로 네트워크 우선, 추후 필요시 캐싱 전략 추가 가능
}); 