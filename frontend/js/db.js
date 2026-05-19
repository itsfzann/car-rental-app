const db = new Dexie("RentalKeren");

db.version(4).stores({
    mobil: "++id, nopol, merk, harga, foto",
    pelanggan: "++id, nama, alamat, hp",
    transaksi: "++id, nopol, nama, status, total, tgl_pinjam, tgl_kembali, durasi, denda"
});

window.db = db;