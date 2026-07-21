import type { Category, CategoryId } from "@/lib/tools";

// Indonesian category prose (machine-translated, pending human spot-check).
// Only translatable fields are overridden; structure comes from lib/tools.ts.
export const ID_CATEGORIES: Partial<Record<CategoryId, Partial<Category>>> = {
  pdf: {
    name: "Alat PDF",
    blurb: "Gabung, pisah, putar, dan konversi PDF — langsung di browser Anda, tanpa unggah.",
    intro:
      "Alat PDF ini menangani tugas dokumen sehari-hari — menggabungkan file, mengambil halaman, memperbaiki orientasi, mengecilkan ukuran file, dan konversi ke dan dari gambar serta teks. Berbeda dari kebanyakan layanan PDF online, semua alat di sini berjalan secara lokal di browser Anda, sehingga dokumen Anda tidak pernah diunggah ke server. Ini membuatnya cepat dan aman untuk file sensitif seperti kontrak dan laporan keuangan.",
    faqs: [
      { q: "Apakah PDF saya diunggah ke server?", a: "Tidak. Setiap alat PDF memproses file Anda sepenuhnya di browser — dokumen tidak pernah meninggalkan perangkat Anda." },
      { q: "Apakah ada batas ukuran file atau penggunaan harian?", a: "Tidak ada batas buatan — hanya dibatasi oleh memori yang tersedia di perangkat Anda." },
      { q: "Perlu instal sesuatu atau membuat akun?", a: "Tidak. Alat ini berjalan di browser modern apa pun tanpa instalasi dan tanpa akun." },
    ],
  },
  image: {
    name: "Alat Gambar",
    blurb: "Ubah ukuran, potong, kompres, dan konversi gambar. Tidak ada yang meninggalkan perangkat Anda.",
    intro:
      "Dari mengubah ukuran dan memotong hingga menghapus latar belakang, mengompres, mengonversi format, dan membersihkan metadata, alat gambar ini mencakup tugas foto yang paling umum. Kompres, konversi, ubah ukuran, dan bersihkan metadata mendukung banyak file sekaligus. Alat ini menggunakan Canvas API browser dan, untuk menghapus latar belakang, model AI yang berjalan di perangkat Anda melalui WebAssembly — jadi gambar Anda diproses secara lokal, dalam resolusi penuh dan tanpa watermark.",
    faqs: [
      { q: "Apakah gambar saya diunggah?", a: "Tidak. Semua pemrosesan terjadi di browser Anda; gambar tidak pernah meninggalkan perangkat Anda." },
      { q: "Apakah ada watermark atau batas?", a: "Tidak. Tanpa watermark, tanpa batas buatan, dan dalam resolusi penuh." },
    ],
  },
  media: {
    name: "Alat Audio & Video",
    blurb: "Kompres, konversi, dan potong video serta audio, langsung di browser Anda.",
    faqs: [
      { q: "Apakah video saya diunggah?", a: "Tidak — pemrosesan menggunakan FFmpeg yang dikompilasi ke WebAssembly dan berjalan secara lokal di browser." },
      { q: "Mengapa penggunaan pertama lebih lambat?", a: "Mesin FFmpeg (~32 MB) diunduh sekali saat penggunaan pertama lalu disimpan dalam cache." },
    ],
  },
  text: {
    name: "Alat Teks",
    blurb: "Hitung, konversi, bersihkan, dan analisis teks — instan dan privat.",
    faqs: [
      { q: "Apakah teks saya dikirim ke server?", a: "Tidak — semua analisis dan konversi terjadi di browser Anda." },
      { q: "Apakah ada batas ukuran?", a: "Tidak. Teks panjang tetap berfungsi normal, hanya dibatasi oleh memori perangkat Anda." },
    ],
  },
  developer: {
    name: "Alat Developer",
    blurb: "Format, konversi, decode, dan uji — JSON, regex, JWT, dan lainnya.",
    faqs: [
      { q: "Apakah kode atau data saya dikirim?", a: "Tidak — formatting, konversi, dan decoding sepenuhnya berjalan di browser, aman bahkan untuk data yang berisi token." },
    ],
  },
  calculator: {
    name: "Kalkulator",
    blurb: "Persentase, bunga, tanggal, kesehatan, dan keuangan — jawaban instan.",
    faqs: [
      { q: "Apakah hasil kalkulasinya akurat?", a: "Kalkulator ini menggunakan rumus standar untuk masing-masing bidang (bunga majemuk, BMI, tanggal). Untuk keputusan finansial atau kesehatan yang penting, konfirmasikan dengan profesional." },
      { q: "Apakah data saya disimpan?", a: "Tidak — kalkulasi berjalan di browser dan tidak ada yang dikirim atau disimpan." },
    ],
  },
};
