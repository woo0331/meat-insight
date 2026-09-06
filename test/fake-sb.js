// 브라우저에 주입할 가짜 Supabase 클라이언트 (테스트 전용, 저장소에 포함되지 않음)
window.__FAKE_INIT = function(opts){
  opts = opts || {};
  var missing = opts.missingTables || [];
  var now = Date.now();
  var DB = {
    purchase_requests: [
      {id:'r1', request_number:'REQ-1', category:'소고기', category_main:'meat', title:'한우 등심 300kg 요청',
       status:'견적대기', quote_count:2, buyer_name:'김철수', buyer_phone:'010-1111-2222', buyer_company:'철수정육',
       region:'경기', description:'부위: 등심 / 수량: 300kg', detail:{species:['한우'],part:'등심',qty:'300',price:'65,000',temp:['냉장'],region:'경기'},
       deadline:'2026-09-20', priority:'가격,품질,납기', visibility:'all', user_id:'u1',
       created_at:new Date(now-3600000).toISOString()},
      {id:'r2', request_number:'REQ-2', category:'냉장물류', category_main:'logi', title:'냉동 정기배송 5톤',
       status:'견적대기', quote_count:0, buyer_name:'박영희', buyer_phone:'010-3333-4444',
       region:'부산', description:'부산 → 서울 주 2회', detail:{temp:['냉동'],from:'부산',to:'서울',volume:'5',cycle:'주 2~3회'},
       user_id:'u2', created_at:new Date(now-7200000).toISOString()},
      {id:'r3', request_number:'REQ-3', category:'구인구직', category_main:'job', title:'발골사 2명 채용',
       status:'견적대기', quote_count:0, buyer_name:'최사장', buyer_phone:'010-1111-2222', buyer_company:'대성정육',
       region:'경기', description:'발골사 채용', user_id:'u1',
       detail:{role:['발골사'],employment:'계약직',exp:'3년 이상',pay:'320',headcount:'2',region:'경기',company:'대성정육',etc:'4대보험, 숙소 제공'},
       created_at:new Date(now-1800000).toISOString()},
      {id:'r-old', request_number:'REQ-OLD', category:'소고기', category_main:'meat', title:'한우 안심 40kg (오래된 요청)',
       status:'견적대기', quote_count:0, buyer_name:'옛구매', buyer_phone:'010-7777-1111',
       region:'대전', description:'예전 요청', user_id:'u3',
       detail:{species:['한우'],part:'안심',qty:'40',temp:['냉장'],region:'대전'},
       created_at:new Date(now-45*864e5).toISOString()},
      {id:'r-ancient', request_number:'REQ-ANC', category:'소고기', category_main:'meat', title:'한우 채끝 20kg (아주 오래됨)',
       status:'견적대기', quote_count:0, buyer_name:'아주옛', buyer_phone:'010-7777-2222',
       region:'광주', description:'아주 예전 요청', user_id:'u4',
       detail:{species:['한우'],part:'채끝',qty:'20',temp:['냉장'],region:'전남·광주'},
       created_at:new Date(now-200*864e5).toISOString()}
    ],
    suppliers: [
      {id:'s1', name:'합신식 도축장', region:'경기 포천시', categories:['도축장','OEM·육가공'], category_mains:['process'],
       rating:4.9, lead_time:'15분', min_qty:'1두~', is_verified:true, haccp:true, brn_verified:true, deal_count:42,
       review_count:3, contact:'031-000-0000', description:'도축·발골 전문', items:['한우 지육','한돈 지육'],
       services:['도축','발골','정형'], user_id:'u9', regions:['경기','서울'], response_rate:82,
       avg_response_min:35, instant_quote:true, instant_note:'한우 지육 당일 출고 · 경기 무료배송',
       livestock_permit:true, notify_on:true, created_at:new Date(now-864e5).toISOString()},
      {id:'s2', name:'전국냉장물류', region:'경기 화성시', categories:['냉장물류'], category_mains:['logi'],
       rating:4.6, lead_time:'30분', min_qty:'1톤~', is_verified:true, haccp:false, deal_count:18,
       contact:'031-111-1111', description:'전국 냉장·냉동 배송', user_id:'u9', regions:['전국'],
       response_rate:64, avg_response_min:120, instant_quote:false, notify_on:true,
       created_at:new Date(now-172800000).toISOString()},
      {id:'s3', name:'대성기계', region:'대구 북구', categories:['기자재·장비'], category_mains:['equip'],
       rating:0, lead_time:'1일', is_verified:false, deal_count:0, contact:'053-222-2222', created_at:new Date(now-2592e5).toISOString()}
    ],
    jobs: [
      {id:'j1', kind:'hire', job_role:'발골사', employment:'정규직', pay:'월 340만원~', location:'경기 안양시',
       company:'안양 정육공장', contact:'010-5555-6666', detail:'4대보험', is_urgent:true, status:'모집중',
       created_at:new Date(now-3600000).toISOString()},
      {id:'j2', kind:'seek', job_role:'정형사', experience:'5년', pay:'협의', location:'부산',
       applicant_name:'이구직', contact:'010-9999-0000', detail:'즉시 근무 가능', status:'모집중',
       created_at:new Date(now-7200000).toISOString()}
    ],
    quotes: [
      {id:'q1', request_id:'r1', supplier_id:'s1', supplier_name:'합신식 도축장', user_id:'u9',
       price:19500000, price_unit:'총액', lead_time:'2일', delivery:'냉장 차량 무료 배송', region:'경기 포천시',
       conditions:'월 정기 계약 시 kg당 1,500원 인하', contact:'031-000-0000', valid_until:'2026-09-15',
       unit_price:65000, qty:300, qty_unit:'kg', total_amount:19500000, market_ref:64000,
       status:'대기', created_at:new Date(now-1800000).toISOString()},
      {id:'q2', request_id:'r1', supplier_id:'s2', supplier_name:'전국냉장물류', user_id:'u9',
       price:20100000, price_unit:'총액', lead_time:'1일', delivery:'착불', region:'경기 화성시',
       conditions:'당일 출고 가능', contact:'031-111-1111', unit_price:67000, qty:300, qty_unit:'kg',
       total_amount:20100000, status:'대기', created_at:new Date(now-900000).toISOString()}
    ],
    reviews: [
      {id:'rv1', target_type:'supplier', target_id:'s1', user_id:'u1', author_name:'김철수', rating:5,
       content:'납기 정확하고 손질 상태가 좋았습니다. 다음에도 거래할 예정입니다.', deal_summary:'한우 지육 10두',
       created_at:new Date(now-864e5).toISOString()}
    ],
    day_jobs: [
      {id:'d1', user_id:'u1', company:'안성 육가공', contact:'010-7777-8888', work_type:'발골',
       work_date:new Date(now+864e5).toISOString().slice(0,10), start_time:'08:00', end_time:'17:00',
       headcount:3, pay:180000, pay_type:'일당', region:'경기', experience:'1년 이상',
       detail:'식사 제공, 작업복 지참', status:'모집중', created_at:new Date(now-1800000).toISOString()}
    ],
    day_job_applications: [
      {id:'a1', day_job_id:'d1', user_id:'u5', worker_name:'이발골', contact:'010-9999-0000',
       experience_years:7, skills:['발골','정형'], message:'당일 8시까지 도착 가능합니다.', status:'지원',
       created_at:new Date(now-600000).toISOString()}
    ],
    worker_profiles: [
      {id:'w1', user_id:'u5', name:'이발골', contact:'010-9999-0000', experience_years:7,
       skills:['발골','정형'], rating:4.8, work_count:36, created_at:new Date(now-864e6).toISOString()}
    ],
    admins: [{email:'admin@test.com', name:'운영자'}],
    favorites: [],
    chat_rooms: [],
    chat_messages: [],
    supplier_prefs: [
      {id:'p1', supplier_id:'s1', user_id:'u9', category_mains:['process','meat'], regions:['경기','서울','전국'], notify_on:true}
    ],
    verifications: [
      {id:'v1', target_type:'supplier', target_id:'s2', user_id:'u9', kind:'brn', number:'220-81-62517',
       holder:'전국냉장물류 · 김대표', status:'심사중', created_at:new Date(now-7200000).toISOString()},
      {id:'v2', target_type:'supplier', target_id:'s3', user_id:'u7', kind:'haccp', number:'HACCP-2026-0912',
       holder:'대성기계', status:'심사중', created_at:new Date(now-3600000).toISOString()}
    ],
    orders: [],
    market_prices: [
      {id:'m1', category:'beef', item:'한우 지육 1등급', grade:'1등급', price:20500, unit:'원/kg', change:500, price_date:'2026-09-02'},
      {id:'m2', category:'beef', item:'한우 등심', grade:'1+', price:64000, unit:'원/kg', change:-800, price_date:'2026-09-02'},
      {id:'m3', category:'pork', item:'돼지 삼겹살', grade:'', price:22000, unit:'원/kg', change:400, price_date:'2026-09-02'}
    ],
    notifications: [
      {id:'n1', user_id:'u1', type:'quote', title:'새 견적이 도착했습니다', body:'합신식 도축장이 견적을 보냈습니다.',
       link:'req:r1', is_read:false, created_at:new Date(now-1800000).toISOString()}
    ]
  };
  (opts.emptyTables||[]).forEach(function(t){ DB[t]=[]; });
  /* seed: 기본 데이터에 없는 표를 테스트에서 채워 넣을 때 씁니다 */
  Object.keys(opts.seed||{}).forEach(function(t){ DB[t]=opts.seed[t]; });
  window.__DB = DB;
  var uid = 0;
  var RT = [];                       // 가짜 Realtime 구독 목록
  window.__RT = RT;
  function rtBroadcast(table, row){
    if(!opts.realtime) return;       // realtime:true 로 켤 때만 동작 (SQL 미실행 상태 재현용)
    RT.forEach(function(c){
      c.subs.forEach(function(s){
        var o = s.opt || {};
        if(o.table !== table) return;
        if(o.event && o.event !== 'INSERT' && o.event !== '*') return;
        if(o.filter){
          var m = /^([A-Za-z_]+)=eq\.(.*)$/.exec(o.filter);
          if(m && String(row[m[1]]) !== m[2]) return;
        }
        setTimeout(function(){ s.cb({ eventType:'INSERT', new: row }); }, 0);
      });
    });
  }
  function err(msg, code){ return { message: msg, code: code||'' }; }

  function Q(table, kind, payload){
    var self = { _f:[], _order:null, _limit:null, _wantSelect:(kind==='select') };
    function apply(rows){
      var out = rows.filter(function(r){
        return self._f.every(function(f){
          if(f.op==='eq') return String(r[f.k])===String(f.v);
          if(f.op==='in') return f.v.map(String).indexOf(String(r[f.k]))>=0;
          return true;
        });
      });
      if(self._order){ var k=self._order.k, asc=self._order.asc;
        out=out.slice().sort(function(a,b){ var x=a[k],y=b[k]; if(x===y) return 0; return (x>y?1:-1)*(asc?1:-1); }); }
      if(self._limit!=null) out=out.slice(0,self._limit);
      return out;
    }
    self.select=function(){ self._wantSelect=true; return self; };
    self.eq=function(k,v){ self._f.push({op:'eq',k:k,v:v}); return self; };
    self.in=function(k,v){ self._f.push({op:'in',k:k,v:v}); return self; };
    self.order=function(k,o){ self._order={k:k,asc:!o||o.ascending!==false}; return self; };
    self.limit=function(n){ self._limit=n; return self; };
    self.then=function(res,rej){
      var out;
      if(missing.indexOf(table)>=0){ out={ data:null, error:err("Could not find the table 'public."+table+"' in the schema cache",'PGRST205') }; }
      else if(kind==='select'){ out={ data:apply(DB[table]||[]), error:null }; }
      else if(kind==='insert'){
        var cols = Object.keys((DB[table]&&DB[table][0])||{});
        if(opts.legacyColumns && opts.legacyColumns[table]){
          var allowed=opts.legacyColumns[table];
          var bad=Object.keys(payload).find(function(k){ return allowed.indexOf(k)<0; });
          if(bad){ out={ data:null, error:err("Could not find the '"+bad+"' column of '"+table+"' in the schema cache","PGRST204") };
                   return Promise.resolve(out).then(res,rej); }
        }
        var row=Object.assign({ id:table[0]+'-new-'+(++uid), created_at:new Date().toISOString() }, payload);
        (DB[table]=DB[table]||[]).push(row);
        rtBroadcast(table, row);
        out={ data:[row], error:null };
      }
      else if(kind==='update'){ apply(DB[table]||[]).forEach(function(r){ Object.assign(r,payload); }); out={ data:null, error:null }; }
      else if(kind==='delete'){ var del=apply(DB[table]||[]); DB[table]=(DB[table]||[]).filter(function(r){ return del.indexOf(r)<0; }); out={ data:null, error:null }; }
      return Promise.resolve(out).then(res,rej);
    };
    return self;
  }

  var session = opts.user ? { user: opts.user } : null;
  var listeners = [];
  window.supabase = {
    createClient: function(){
      return {
        from: function(t){ return {
          select:function(){ return Q(t,'select').select(); },
          insert:function(p){ return Q(t,'insert',p); },
          update:function(p){ return Q(t,'update',p); },
          delete:function(){ return Q(t,'delete'); }
        };},
        channel: function(name){
          var subs = [];
          var ch = {
            on: function(ev, opt, cb){ subs.push({opt:opt, cb:cb}); return ch; },
            subscribe: function(cb){
              RT.push({name:name, subs:subs});
              if(cb) setTimeout(function(){ cb('SUBSCRIBED'); }, 0);
              return ch;
            },
            unsubscribe: function(){
              for(var i=RT.length-1;i>=0;i--) if(RT[i].subs===subs) RT.splice(i,1);
              return ch;
            }
          };
          return ch;
        },
        removeChannel: function(ch){ if(ch && ch.unsubscribe) ch.unsubscribe(); },
        storage: {
          from: function(bucket){ return {
            upload: function(path, blob, opts){
              if(opts && opts.__fail) return Promise.resolve({error:{message:'Bucket not found'}});
              if(window.__NO_BUCKET) return Promise.resolve({error:{message:'Bucket not found'}});
              (window.__UPLOADS = window.__UPLOADS || []).push({bucket:bucket, path:path,
                size:(blob&&blob.size)||0, type:(blob&&blob.type)||''});
              return Promise.resolve({data:{path:path}, error:null});
            },
            getPublicUrl: function(path){
              return {data:{publicUrl:'https://cdn.test/'+bucket+'/'+path}};
            }
          };}
        },
        auth: {
          getSession: function(){ return Promise.resolve({ data:{ session:session } }); },
          onAuthStateChange: function(cb){ listeners.push(cb); return { data:{ subscription:{ unsubscribe:function(){} } } }; },
          signInWithPassword: function(c){ session={ user:{ id:'u1', email:c.email, user_metadata:{ name:'김철수', role:'buyer' } } };
            listeners.forEach(function(f){ f('SIGNED_IN', session); }); return Promise.resolve({ data:{ user:session.user }, error:null }); },
          signUp: function(c){ session={ user:{ id:'u-new', email:c.email, user_metadata:(c.options&&c.options.data)||{} } };
            listeners.forEach(function(f){ f('SIGNED_IN', session); }); return Promise.resolve({ data:{ user:session.user }, error:null }); },
          signOut: function(){ session=null; listeners.forEach(function(f){ f('SIGNED_OUT', null); }); return Promise.resolve({ error:null }); }
        }
      };
    }
  };
};
