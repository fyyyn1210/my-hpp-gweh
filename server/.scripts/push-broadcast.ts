import { pushBroadcast } from "#src/modules/push/push.service.js";

const [title = "Hai, harga pasar hari ini", body = "Harga cabai rawit, bawang merah, dan telur sudah diperbarui. Cek modal menu Anda."] = process.argv.slice(2);

const sent = await pushBroadcast(title, body);
console.log(`Push sent: ${sent}`);
process.exit(0);
