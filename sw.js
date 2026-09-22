/* ════════════════════════════════════════════════════════════════════
   해제 전용 서비스 워커

   예전 고리 사이트가 서비스 워커를 설치해 두었습니다. 사이트를
   ABOUTMEAT 부산물몰로 바꾸면서 그 워커는 더 이상 필요 없는데,
   ⚠️ **파일을 그냥 지우면 안 됩니다.** sw.js 가 404 가 되면 브라우저는
   "갱신 실패" 로 보고 이미 설치된 옛 워커를 **그대로 계속 씁니다.**
   그러면 다시 찾아온 손님은 옛 화면과 옛 캐시를 계속 받게 됩니다.

   그래서 파일은 남기되 하는 일을 "자기 자신을 지우는 것" 하나로
   바꿨습니다. 옛 워커가 갱신을 확인할 때 이 파일을 받아 가고,
   캐시를 전부 비운 뒤 스스로 등록을 해제합니다.

   새 사이트는 서비스 워커를 등록하지 않으므로, 한 번 해제되면 끝입니다.
   ════════════════════════════════════════════════════════════════════ */

self.addEventListener("install", function(){
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll({ type: "window" }); })
      .then(function(clients){
        /* 열려 있는 탭을 한 번 새로 고쳐 새 사이트를 받게 합니다 */
        clients.forEach(function(c){ if(c.navigate) c.navigate(c.url); });
      })
      .catch(function(){})
  );
});

/* fetch 를 가로채지 않습니다 — 모든 요청이 네트워크로 그대로 갑니다. */
