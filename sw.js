// 이 서비스워커는 더 이상 사용하지 않습니다.
// 폰에 이미 설치되어 있는 예전 서비스워커를 자동으로 제거하고,
// 페이지를 한 번 새로고침해서 서비스워커 없는 정상 상태로 되돌립니다.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 이 서비스워커가 관리하던 캐시를 전부 삭제
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // 자기 자신을 등록 해제
      await self.registration.unregister();

      // 이 서비스워커의 영향을 받던 모든 탭을 새로고침
      const allClients = await self.clients.matchAll({ type: "window" });
      allClients.forEach((client) => client.navigate(client.url));
    })()
  );
});
