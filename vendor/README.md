# vendor

`supabase-js-2.116.0.min.js` — @supabase/supabase-js v2.116.0 의 UMD 빌드를
`npm pack @supabase/supabase-js@2` 로 받아 `dist/umd/supabase.js` 를 그대로 옮긴 것입니다.
고치지 마세요. 올릴 때는 다시 받아서 통째로 바꾸고 파일 이름의 버전도 같이 올립니다.

## 왜 CDN 을 안 쓰고 여기 두는가

예전에는 `cdn.jsdelivr.net` 에서 바로 받았습니다. 그런데 이 한 줄이 막히거나
느리면 `window.supabase` 가 안 생기고, `sb` 가 null 이 되어 **사이트 전체가**
"서버에 연결할 수 없습니다" 가 됩니다. 로그인·요청·견적·업체 목록이 한꺼번에
죽는데 원인은 우리 서버도 DB 도 아닙니다.

같은 도메인에서 내보내면 그 고리가 사라집니다. jsdelivr 은 그래도 못 받았을
때를 위한 예비로만 남겨 뒀습니다 (index.html 의 fallback).
