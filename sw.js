const CACHE_NAME = "studygroup-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.ico",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // cache.addAll은 하나라도 실패하면 전체 설치가 실패한다.
      // 파일 하나가 없어도(404) 서비스워커 설치 자체는 계속 진행되도록 개별 처리한다.
      return Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch((err) => {
          console.warn("캐싱 실패(무시하고 계속):", url, err);
        }))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// 앱 쉘(HTML/manifest/아이콘)은 네트워크 우선, 실패 시 캐시로 폴백.
// 그 외(Supabase API, CDN 등)는 서비스워커가 관여하지 않고 그대로 통과시킴.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match("./index.html")))
  );
});
