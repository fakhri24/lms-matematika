// =====================================================================
// GATE B — SIMULASI DAMPAK KE SISWA LAMA  (READ-ONLY, TIDAK MENULIS APA PUN)
// =====================================================================
// Skrip ini HANYA membaca (getDocs). Tidak ada setDoc/updateDoc/deleteDoc.
//
// CARA PAKAI:
//   1. Buka https://lms-matematika.web.app (atau domain hosting Anda)
//   2. Login sebagai admin  ← Anda yang mengetikkan sandi, bukan Claude
//   3. Buka DevTools → Console
//   4. Salin-tempel SELURUH isi berkas ini, tekan Enter
//
// Butuh: rules `hasil_latihan` mengizinkan read bagi user terautentikasi. ✔
// =====================================================================

(async () => {
  const SOAL_MIN = 10;
  const NILAI_MIN = 80;

  const { db } = await import("/js/config/firebase.js");
  const { collection, getDocs, doc, getDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js"
  );
  const { PRASYARAT_TRIGONOMETRI: PETA_PRASYARAT_MANUAL, DAFTAR_MATERI_INTI } =
  await import(
    "/js/utils/kurikulumData.js"
  );

  const norm = (s) => String(s || "").toLowerCase().trim();
  const MODE_UJIAN = new Set(["tes_normal", "tes_acak", "normal", "acak"]);

  console.log("⏳ Menarik data… (hasil_latihan + metadata + data_siswa)");
  const [snapHasil, snapMeta, snapSiswa] = await Promise.all([
    getDocs(collection(db, "hasil_latihan")),
    getDoc(doc(db, "metadata", "statistik_soal")),
    getDocs(collection(db, "data_siswa")),
  ]);

  const semuaHasil = snapHasil.docs.map((d) => d.data());
  const metaMap = snapMeta.exists() ? snapMeta.data().data_materi || {} : {};
  const totalSiswa = snapSiswa.size;

  // ---------- katalog materi dari metadata (SUMBER OTORITATIF) ----------
  const jumlahSoal = {};
  Object.values(metaMap).forEach((m) => {
    if (m && m.nama_asli) jumlahSoal[norm(m.nama_asli)] = m.jumlah_soal || 0;
  });

  // ---------- definisi master (§3 PLAN.md) ----------
  function hitungSetMaster(riwayat) {
    const set = new Set();
    for (const d of riwayat) {
      if (!d || !d.sub_materi) continue;
      const mode = d.mode_latihan || "tes_normal";
      if (!MODE_UJIAN.has(mode)) continue;
      if (d.status === "draf") continue;
      if (!(Number(d.nilai) >= NILAI_MIN)) continue;
      const n = d.detail_jawaban
        ? Object.keys(d.detail_jawaban).length
        : d.log_percobaan
          ? Object.keys(d.log_percobaan).length
          : 0;
      if (n < SOAL_MIN) continue;
      set.add(norm(d.sub_materi));
    }
    return set;
  }

  // ---------- gerbang kunci (§4 PLAN.md) ----------
  const semuaNode = new Set();
  for (const [t, l] of Object.entries(PETA_PRASYARAT_MANUAL)) {
    semuaNode.add(norm(t));
    l.forEach((p) => semuaNode.add(norm(p)));
  }
  function hitungTerkunci(setMaster) {
    const terkunci = [];
    for (const [target, list] of Object.entries(PETA_PRASYARAT_MANUAL)) {
      const belum = list.map(norm).filter((p) => !setMaster.has(p));
      if (belum.length) terkunci.push(norm(target));
    }
    return terkunci;
  }

  // ---------- agregasi per siswa ----------
  const perSiswa = {};
  for (const d of semuaHasil) {
    if (!d.nis_siswa) continue;
    (perSiswa[d.nis_siswa] ||= []).push(d);
  }

  const katalogAda = new Set(
    Object.keys(jumlahSoal).filter((s) => jumlahSoal[s] > 0),
  );
  const nodeRender = [...semuaNode].filter((n) => katalogAda.has(n));

  const rows = [];
  const frekuensiTerkunci = {};
  for (const [nis, riwayat] of Object.entries(perSiswa)) {
    const setMaster = hitungSetMaster(riwayat);
    const terkunci = hitungTerkunci(setMaster).filter((n) => katalogAda.has(n));
    terkunci.forEach((t) => (frekuensiTerkunci[t] = (frekuensiTerkunci[t] || 0) + 1));
    rows.push({
      nis,
      master: setMaster.size,
      terkunci: terkunci.length,
      terbuka: nodeRender.length - terkunci.length,
    });
  }

  // ---------- LAPORAN ----------
  const L = (s) => console.log(s);
  L("\n" + "=".repeat(70));
  L("GATE B — SIMULASI DAMPAK (data Firestore LIVE)");
  L("=".repeat(70));
  L(`Total siswa terdaftar        : ${totalSiswa}`);
  L(`Siswa punya riwayat latihan  : ${rows.length}`);
  L(`Total record hasil_latihan   : ${semuaHasil.length}`);
  L(`Sub-materi di peta & bersoal : ${nodeRender.length} (dari ${semuaNode.size} node peta)`);

  // integritas metadata (verifikasi ulang Gate A dgn data live)
  const prasyaratKurang = [];
  for (const [, list] of Object.entries(PETA_PRASYARAT_MANUAL))
    for (const p of list) {
      const k = norm(p);
      const n = jumlahSoal[k] ?? 0;
      if (n < SOAL_MIN && !prasyaratKurang.some((x) => x.sub === k))
        prasyaratKurang.push({ sub: k, jumlah_soal: n });
    }
  L("\n--- VERIFIKASI GATE A DENGAN DATA LIVE ---");
  if (prasyaratKurang.length === 0) {
    L(`✅ Semua prasyarat punya >= ${SOAL_MIN} soal. Tidak ada deadlock permanen.`);
  } else {
    L(`❌ ${prasyaratKurang.length} prasyarat bersoal < ${SOAL_MIN} → DEADLOCK PERMANEN:`);
    console.table(prasyaratKurang);
  }

  L("\n--- DISTRIBUSI STATUS MASTER ---");
  const nolMaster = rows.filter((r) => r.master === 0).length;
  const totalMaster = rows.reduce((a, r) => a + r.master, 0);
  L(`Siswa dengan 0 materi master : ${nolMaster} / ${rows.length}`);
  L(`Rata-rata materi master      : ${(totalMaster / (rows.length || 1)).toFixed(2)}`);

  L("\n--- DAMPAK PENGUNCIAN (strict, keputusan #4) ---");
  const terkunciTotal = rows.filter((r) => r.terbuka === 0).length;
  L(`Siswa yang SEMUA materi terkunci : ${terkunciTotal}`);
  L(`Rata-rata materi terkunci/siswa  : ${(rows.reduce((a, r) => a + r.terkunci, 0) / (rows.length || 1)).toFixed(1)} dari ${nodeRender.length}`);

  L("\n--- 15 SISWA PALING TERDAMPAK ---");
  console.table(
    rows.sort((a, b) => b.terkunci - a.terkunci || a.master - b.master).slice(0, 15),
  );

  L("\n--- 15 MATERI PALING SERING TERKUNCI ---");
  console.table(
    Object.entries(frekuensiTerkunci)
      .map(([sub, n]) => ({ sub_materi: sub, siswa_terkunci: n, pct: `${Math.round((n / (rows.length || 1)) * 100)}%` }))
      .sort((a, b) => b.siswa_terkunci - a.siswa_terkunci)
      .slice(0, 15),
  );

  L("\n" + "=".repeat(70));
  L("Kriteria lolos: angka di atas Anda terima secara sadar (§8.B PLAN.md).");
  L("=".repeat(70));

  window.__gateB = { rows, frekuensiTerkunci, jumlahSoal, prasyaratKurang };
  L("\nDetail lengkap tersimpan di variabel: window.__gateB");
})();
