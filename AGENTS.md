### Ini Projek AI vid generation

### Rule
    1. Jangan Mengunakan commentar, langsung saja code
    2. gunakan kode existing, cek fungsi2 existing, pakai kode yg ada dan reuse bila ada, bila tidak baru buat baru
    3. selalu gunkana bahasa ingris dalam kode dan migration
    4. db kolom skanecase+lowercase, tapi untuk prismanya pakai title case (seperti kode existing)
    5. jika ingn buat kode, cek2 kode existing, cara pakai dan flow existing, tiru agar konsisten dan sepentak
    6. saya biasa pakai kostant dan enum untuk tipe2 dan pilihan
    7. nomor hp selalu dinormalisasi lewat `normalizePhone` (`server/src/utils/otp.util.ts`) / `phoneSchema` sebelum dicek, dikirim ke OTP gateway, atau disimpan. format db: E.164 tanpa `+`, digit saja (contoh `628123456789`). input `+62`, `62`, `0062` harus jadi format yg sama. semua negara boleh, wajib pakai kode negara, format lokal awalan `0` ditolak
    8. tanggal/waktu: be simpan & olah selalu UTC (`process.env.TZ = "UTC"`, kolom db `@db.Timestamptz(3)`). response wajib ISO 8601 dengan timezone (`Date` -> `...Z`), jangan kirim string tanggal tanpa timezone. input waktu dari fe wajib ISO 8601 dengan offset (`Z`/`+03:00`) dan divalidasi pakai `dateTimeSchema` (`server/src/schemas/date.schema.ts`). timezone yg boleh dari client = enum `ClientTimezone` (`server/src/utils/date.util.ts`), dipakai juga di `APP_CLIENT_TIMEZONE`
    9. semua yg di skip, dummy, sementara, atau masih kurang wajib dicatat di `TODO.md` (root projek), singkat saja per baris. sebelum menulis, cek dulu di `TODO.md` apakah sudah ada; kalau sudah ada, update baris itu, jangan duplikat. kalau sudah dikerjakan, hapus dari `TODO.md`
    10. jangan pernah baca/ubah file .env / file ygy berisi kredensial lainya