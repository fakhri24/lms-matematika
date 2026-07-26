// GATE A (tambahan) — dampak fitur kunci per tab (read-only, offline)
// Jalankan dari akar repo:  node plan/diagnostik/gate-a-dampak-per-tab.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { PRASYARAT_TRIGONOMETRI: PETA_PRASYARAT_MANUAL, DAFTAR_MATERI_INTI } =
  await import(
  pathToFileURL(join(ROOT, "public/js/utils/kurikulumData.js")).href
);
function walk(d,a=[]){for(const e of readdirSync(d)){const p=join(d,e);statSync(p).isDirectory()?walk(p,a):e.endsWith(".json")&&a.push(p)}return a}
const files=[join(ROOT,"arsip-data/bank_soal.json"),join(ROOT,"arsip-data/bank_soal_revisi.json"),join(ROOT,"artefak/bank_soal_artefak.json"),...walk(join(ROOT,"arsip-data/bank_soal"))];
const seen=new Map();
for(const f of files){let d;try{d=JSON.parse(readFileSync(f,"utf8"))}catch{continue}if(!Array.isArray(d))continue;
for(const s of d){if(!s?.sub_materi)continue;const k=s.id||`${s.sub_materi}::${(s.pertanyaan||"").slice(0,120)}`;if(!seen.has(k))seen.set(k,{sub:s.sub_materi.toLowerCase().trim(),mu:s.materi_utama||"?"})}}
const norm=s=>s.toLowerCase().trim();
const node=new Set();for(const[t,l]of Object.entries(PETA_PRASYARAT_MANUAL)){node.add(norm(t));l.forEach(p=>node.add(norm(p)))}
const perTab={};
for(const {sub,mu} of seen.values()){const tab=DAFTAR_MATERI_INTI.includes(mu)?mu:"Prasyarat";
 perTab[tab]??={total:0,subs:new Map()};perTab[tab].total++;
 const cur=perTab[tab].subs.get(sub)||0;perTab[tab].subs.set(sub,cur+1)}
console.log("DAFTAR_MATERI_INTI:",DAFTAR_MATERI_INTI.join(", "),"\n");
console.log("DAMPAK FITUR KUNCI PER TAB");
console.log("=".repeat(64));
for(const [tab,d] of Object.entries(perTab)){
 const subs=[...d.subs.keys()];
 const dipetakan=subs.filter(s=>node.has(s));
 const tidak=subs.filter(s=>!node.has(s));
 console.log(`\n[${tab}]  ${subs.length} sub-materi, ${d.total} soal`);
 console.log(`  dipetakan di PETA_PRASYARAT_MANUAL : ${dipetakan.length}`);
 console.log(`  TIDAK dipetakan (selalu terbuka)   : ${tidak.length}`);
 if(tidak.length) tidak.forEach(s=>console.log(`     • ${s} (${d.subs.get(s)} soal)`));
 console.log(`  → fitur kunci ${dipetakan.length===0?"❌ TIDAK BERPENGARUH SAMA SEKALI":"✅ berlaku"}`);
}
