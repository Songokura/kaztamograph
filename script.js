(function(){
'use strict';
var SCRIPT_V=(function(){var s=document.currentScript;var m=s&&s.src.match(/[?&]v=([^&]+)/);return m?m[1]:'1'})();
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

// progress bar + header background
var zbar=document.getElementById('zbar'),hud=document.getElementById('hud'),ticking=false;
function onScroll(){
  if(ticking)return;ticking=true;
  requestAnimationFrame(function(){
    var h=document.documentElement,y=h.scrollTop;
    zbar.style.width=(y/(h.scrollHeight-h.clientHeight||1)*100)+'%';
    hud.classList.toggle('solid',y>40);
    ticking=false;
  });
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

// marquee: copies enough to cover the screen, shift = one copy
var mqt=document.getElementById('mqt'),mqSrc=mqt.innerHTML,mqW=0;
function buildMarquee(){
  var w=innerWidth;if(w===mqW)return;mqW=w;
  mqt.innerHTML=mqSrc;
  var one=mqt.scrollWidth||1,copies=Math.max(2,Math.ceil(w/one)+1),html='';
  for(var i=0;i<copies;i++)html+=mqSrc;
  mqt.innerHTML=html;
  mqt.style.setProperty('--mqw',one+'px');
  mqt.style.setProperty('--mqd',Math.round(one/80)+'s');
}
buildMarquee();addEventListener('resize',buildMarquee);

// beam reveal
var io=new IntersectionObserver(function(es){
  es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}});
},{threshold:.15});
document.querySelectorAll('section.slice').forEach(function(s){io.observe(s)});

// counters
if(!reduce){
  var cio=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;cio.unobserve(e.target);
      var el=e.target,target=+el.dataset.cnt,suf=el.dataset.suf||'',t0=performance.now();
      (function f(t){
        var p=Math.min((t-t0)/1400,1),v=Math.round(target*(1-Math.pow(1-p,3)));
        el.textContent=v+suf;
        if(p<1)requestAnimationFrame(f);
      })(t0);
    });
  },{threshold:.6});
  document.querySelectorAll('[data-cnt]').forEach(function(el){el.textContent='0'+(el.dataset.suf||'');cio.observe(el)});
}

// sticky CTA appears after hero
var stick=document.getElementById('stick'),hero=document.getElementById('home');
new IntersectionObserver(function(es){
  stick.classList.toggle('show',!es[0].isIntersecting);
},{threshold:.25}).observe(hero);

// fitText for display headings
function fitText(){
  document.querySelectorAll('h1.fit').forEach(function(el){
    el.style.fontSize='';
    var fs=parseFloat(getComputedStyle(el).fontSize),n=0;
    while(el.scrollWidth>el.clientWidth+1&&n<12){fs*=.95;el.style.fontSize=fs+'px';n++}
  });
}
var fw=innerWidth;
addEventListener('resize',function(){if(innerWidth!==fw){fw=innerWidth;fitText()}});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitText);else fitText();

// ---------- language (RU in markup, KZ from assets/lang/kk.js on demand) ----------
var RU={},stored=false;
function storeRu(){
  if(stored)return;stored=true;
  document.querySelectorAll('[data-i18n]').forEach(function(el){RU['t:'+el.dataset.i18n]=el.textContent});
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){RU['h:'+el.dataset.i18nHtml]=el.innerHTML});
  document.querySelectorAll('[data-i18n-alt]').forEach(function(el){RU['a:'+el.dataset.i18nAlt]=el.alt});
  RU.title=document.title;
}
function apply(lang){
  storeRu();
  var D=lang==='kk'?(window.SITE_KK||{}):null;
  document.querySelectorAll('[data-i18n]').forEach(function(el){var k=el.dataset.i18n,v=D?D[k]:RU['t:'+k];if(v!=null)el.textContent=v});
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){var k=el.dataset.i18nHtml,v=D?D[k]:RU['h:'+k];if(v!=null)el.innerHTML=v});
  document.querySelectorAll('[data-i18n-alt]').forEach(function(el){var k=el.dataset.i18nAlt,v=D?D[k]:RU['a:'+k];if(v!=null)el.alt=v});
  document.title=D&&D._title?D._title:RU.title;
  document.documentElement.lang=lang;
  document.querySelectorAll('.lang button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.lang===lang))});
  fitText();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitText);
}
var kkLoading=null;
function loadKK(){
  if(window.SITE_KK)return Promise.resolve();
  if(kkLoading)return kkLoading;
  var f=document.createElement('link');f.rel='stylesheet';
  f.href='https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Onest:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;700&display=swap';
  document.head.appendChild(f);
  kkLoading=new Promise(function(res,rej){
    var s=document.createElement('script');s.src='assets/lang/kk.js?v='+SCRIPT_V;
    s.onload=res;s.onerror=rej;document.head.appendChild(s);
  });
  return kkLoading;
}
function setLang(lang,save){
  if(save){try{localStorage.setItem('lang',lang)}catch(e){}}
  if(lang==='kk')loadKK().then(function(){apply('kk')}).catch(function(){apply('ru')});
  else apply('ru');
}
document.querySelectorAll('.lang button').forEach(function(b){
  b.addEventListener('click',function(){setLang(b.dataset.lang,true)});
});
var qp=new URLSearchParams(location.search).get('lang'),initial='ru';
if(qp==='ru'||qp==='kk')initial=qp;
else{try{if(localStorage.getItem('lang')==='kk')initial='kk'}catch(e){}}
if(initial==='kk')setLang('kk',false);

// ---------- form -> WhatsApp ----------
var form=document.getElementById('lead-form');
form.addEventListener('submit',function(e){
  e.preventDefault();
  var ph=form.phone.value.replace(/\D/g,'');
  if(ph.length<10){form.phone.focus();form.phone.setAttribute('aria-invalid','true');return}
  form.phone.removeAttribute('aria-invalid');
  var K=document.documentElement.lang==='kk'&&window.SITE_KK?window.SITE_KK:{};
  function t(k,ru){return K[k]||ru}
  var lines=[t('wa.hello','Здравствуйте! Заявка инженеру:'),
    t('wa.name','Имя, клиника: ')+form.name.value.trim(),
    t('wa.phone','Телефон: ')+form.phone.value.trim(),
    t('wa.type','Оборудование: ')+form.equipment.options[form.equipment.selectedIndex].text];
  var m=form.message.value.trim();if(m)lines.push(t('wa.msg','Модель и неисправность: ')+m);
  window.open('https://wa.me/77716301134?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener');
  form.classList.add('sent');
});
})();
