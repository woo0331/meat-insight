/* ════════════════════════════════════════════════════════════════════
   고리 서비스 워커
   방침: 항상 네트워크 먼저. 응답이 오면 그 응답을 쓰고 사본만 캐시에
   남깁니다. 네트워크가 끊겼을 때만 캐시를 꺼내 씁니다.
   → 배포한 새 파일이 캐시 때문에 안 보이는 일이 생기지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
var CACHE = "gori-v1";
var SHELL = ["/", "/index.html", "/gori-app.js", "/gori-app.css",
             "/site-info.js", "/icon-192.png", "/manifest.json"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL).catch(function(){ /* 일부 실패해도 설치는 진행 */ }); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.origin !== self.location.origin) return;        /* 외부 요청은 건드리지 않습니다 */
  if(url.pathname.indexOf("/rest/") === 0) return;       /* API 응답은 캐시하지 않습니다 */

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok && res.type === "basic"){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy).catch(function(){}); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        if(hit) return hit;
        if(req.mode === "navigate") return caches.match("/index.html");
        return new Response("", { status: 504, statusText: "오프라인" });
      });
    })
  );
});

/* 페이지에서 보내는 강제 해제 신호 (문제가 생겼을 때 탈출구) */
self.addEventListener("message", function(e){
  if(e.data === "gori-sw-off"){
    self.registration.unregister().then(function(){
      return caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); });
    });
  }
});
