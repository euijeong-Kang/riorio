import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { categories, menuItems } from "./data";
import { languageNames, normalizeLocale, supportedLocales, uiFor, type MenuLocale } from "./locales";
import { translationsFor } from "./translations";
import { brandStories } from "./brand-stories";
import { muslimGuidanceFor } from "./arabic";
import "./global-menu.css";
import "./story.css";
import "./arabic.css";

const storedLocale=()=>{ try{return localStorage.getItem("riorio-menu-locale");}catch{return null;} };
const formatWon=(value:number)=>`₩${new Intl.NumberFormat("en-US").format(value)}`;

export default function GlobalMenuPage(){
 const {locale:routeLocale}=useParams(); const navigate=useNavigate();
 const initial=normalizeLocale(routeLocale || storedLocale() || navigator.language);
 const [locale,setLocale]=useState<MenuLocale>(initial); const [open,setOpen]=useState(false); const ui=uiFor(locale);
 const translations=translationsFor(menuItems); const story=brandStories[locale];
 useEffect(()=>{ if(routeLocale!==locale) navigate(`/menu/${locale}`,{replace:true}); try{localStorage.setItem("riorio-menu-locale",locale);}catch{} document.documentElement.lang=locale; document.documentElement.dir=locale==="ar"?"rtl":"ltr"; return()=>{document.documentElement.dir="ltr"}; },[locale,routeLocale,navigate]);
 useEffect(()=>{ document.title="RIORIO | Global Menu"; },[]);
 const choose=(next:MenuLocale)=>{setLocale(next);setOpen(false);navigate(`/menu/${next}`);};
 const porkItems=menuItems.filter(item=>muslimGuidanceFor(item.id).includes("pork")).map(item=>translations.ar[item.id].name);
 const alcoholItems=menuItems.filter(item=>muslimGuidanceFor(item.id).includes("alcohol")).map(item=>translations.ar[item.id].name);
 return <main className="global-menu" dir={locale==="ar"?"rtl":"ltr"}>
  <header className="gm-header"><a href="/" className="gm-brand" aria-label="RIORIO home">RIO<span>RIO</span></a><div><p>{ui.globalMenu}</p><button type="button" onClick={()=>setOpen(true)} aria-haspopup="dialog">{languageNames[locale]} <span aria-hidden>⌄</span></button></div></header>
  <nav className="gm-tabs" aria-label="Menu categories">{categories.map(c=><a key={c} href={`#${c}`}>{ui.categories[c]}</a>)}</nav>
  {locale==="ar"&&<aside className="gm-muslim-guide" aria-label="إرشادات الطعام للمسلمين"><h2>إرشادات الطعام للمسلمين</h2><p>لا يحمل المطعم أو هذه الأطباق اعتماد حلال مؤكداً. تعتمد المعلومات أدناه فقط على المكونات المذكورة في قائمتنا.</p><div className="gm-guidance-grid"><div className="gm-guidance-card"><strong>يحتوي على لحم الخنزير</strong><p>{porkItems.join(" · ")}</p></div><div className="gm-guidance-card"><strong>يحتوي على الكحول</strong><p>{alcoholItems.join(" · ")}</p></div></div><p className="gm-guidance-confirm">بالنسبة إلى جميع الأطباق الأخرى، يرجى سؤال الموظفين عن مصدر اللحوم والصلصات وطريقة الطهي والتلامس المتبادل قبل الطلب.</p></aside>}
  <div className="gm-content"><section className="gm-story"><span>{story.eyebrow}</span><h1>{story.title}</h1>{story.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</section>{categories.map(category=><section id={category} key={category} className="gm-section"><div className="gm-section-title"><span>{String(categories.indexOf(category)+1).padStart(2,"0")}</span><h1>{ui.categories[category]}</h1></div><div className="gm-list">{menuItems.filter(i=>i.category===category).map(item=>{const copy=translations[locale][item.id];return <article className="gm-item" key={item.id}><div className="gm-item-row"><h2>{copy.name}</h2>{item.status==="coming-soon"?<span className="gm-coming">{ui.coming}</span>:<strong>{formatWon(item.priceWon!)}</strong>}</div>{copy.description&&<p className="gm-description">{copy.description}</p>}{copy.ingredients&&<p className="gm-ingredients"><span>{ui.ingredients}</span>{copy.ingredients}</p>}{item.option&&<p className="gm-option">{copy.option}<strong>{formatWon(item.option.priceWon)}</strong></p>}{item.needsReview&&<small className="gm-review">{ui.review}</small>}</article>})}</div></section>)}</div>
  <footer><span>RIORIO · GWANGMYEONG</span><p>{ui.notice}</p></footer>
  {open&&<div className="gm-modal" role="dialog" aria-modal="true" aria-labelledby="language-title" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><div className="gm-sheet"><div className="gm-sheet-head"><h2 id="language-title">{ui.language}</h2><button onClick={()=>setOpen(false)} aria-label={ui.close}>×</button></div><h3>{ui.recommended}</h3><div className="gm-languages gm-languages--recommended">{supportedLocales.slice(0,5).map(code=><button className={locale===code?"active":""} key={code} onClick={()=>choose(code)} lang={code}>{languageNames[code]}</button>)}</div><h3>{ui.all}</h3><div className="gm-languages">{supportedLocales.slice(5).map(code=><button className={locale===code?"active":""} key={code} onClick={()=>choose(code)} lang={code}>{languageNames[code]}</button>)}</div></div></div>}
 </main>;
}
