# HPP Pintar - Design Guide

Referensi visual: `01-fintech-wallet-kartu-angka-besar.webp`

## Pengguna
Pedagang UMKM (warung, katering rumahan, kedai). Tidak terbiasa aplikasi rumit, sering dipakai sambil sibuk, layar HP kecil, sinyal tidak selalu bagus.

## Prinsip
1. Satu layar, satu pesan utama. Contoh: "Nasi Ayam: untung 18%, Waspada".
2. Angka besar dulu, penjelasan kecil di bawah.
3. Bahasa sehari-hari. Hindari istilah teknis tanpa penjelasan.
4. Maksimal 3 tombol utama di beranda.
5. Tema terang, kontras tinggi, teks minimal 16px, area sentuh minimal 48px.
6. Status selalu warna + kata + ikon (tidak hanya warna).
7. Satuan lokal: kg, ikat, butir, liter. Rupiah dengan pemisah ribuan (Rp 12.500).

## Yang diambil dari referensi 01
- Kartu utama besar dengan satu angka dan perubahan (naik/turun).
- Latar gradasi hijau lembut, kartu putih bersudut membulat besar.
- Kartu kecil berjajar untuk komoditas (mirip kartu mata uang).
- Daftar riwayat dengan tanda +/- berwarna.
- Tombol aksi gelap dan bulat sebagai aksi utama.

## Yang diubah
- Warna kuning-hijau fintech disesuaikan ke nuansa pangan (hijau daun, kuning jagung, merah cabai).
- Kartu saldo menjadi kartu margin menu.
- Kartu mata uang menjadi kartu harga bahan (cabai, bawang, telur, beras).
- Daftar transaksi menjadi riwayat alarm dan perubahan harga.
- Grafik batang bertitik menjadi tren harga PIHPS 7 / 30 hari.

## Status
| Status | Warna | Kata | Arti |
|---|---|---|---|
| Aman | Hijau | Aman | Margin sesuai target |
| Waspada | Kuning | Waspada | Margin menipis |
| Rugi | Merah | Rugi | HPP di atas harga jual |

## Palet (usulan)
| Peran | Warna |
|---|---|
| Latar | `#EAF5E4` ke `#FFFFFF` gradasi |
| Kartu | `#FFFFFF` |
| Utama | `#2F7D32` |
| Sorotan | `#FFE45C` |
| Waspada | `#F5B700` |
| Rugi | `#D93025` |
| Teks | `#14213D` |
| Teks pendukung | `#5B6B5B` |

## Tipografi
- Font sans-serif bersih (usulan: Plus Jakarta Sans atau Inter).
- Angka utama 40-48px bold, judul 24px, isi 16px.

## Layar MVP
1. **Beranda**: kartu margin rata-rata, 3 tombol besar (Cek Harga, Hitung HPP, Alarm), daftar bahan yang naik hari ini.
2. **Daftar Menu**: kartu per menu dengan HPP, harga jual, badge status.
3. **Detail Menu**: rincian bahan (foto, takaran, biaya), harga jual saran, tombol "Pakai harga saran".
4. **Harga Bahan**: kartu komoditas, tren, perubahan harian.
5. **Alarm**: riwayat dan pengaturan ambang margin, notifikasi Telegram.
6. **Pengenalan** (sekali, 3 layar): ilustrasi dan teks besar.

## Responsif
- Mobile first (PWA).
- Desktop: kartu utama di kiri, daftar di kanan, lebar maksimal 1100px, agar mudah dibaca juri.

## Tidak dipakai
- Mode gelap sebagai default.
- Filter bertumpuk, tabel padat, peta, chatbot sebagai navigasi utama.
