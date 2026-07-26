// public/js/utils/teksAman.js

/**
 * Mencegah nama materi dari database merusak markup.
 *
 * Dipakai bersama oleh beberapa View. Nama sub-materi ditulis manusia dan
 * memang mengandung karakter seperti `&` dan `>` (mis. "Sudut Berelasi
 * (Negatif dan >360°)"), jadi penyaringan ini bukan sekadar formalitas.
 */
export function amankanTeks(teks) {
  return String(teks ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
