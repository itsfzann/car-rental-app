// ===============================
// INISIALISASI
// ===============================
async function inisialisasi() {

    const mobil = await db.mobil.toArray();
    const pelanggan = await db.pelanggan.toArray();

    const selectMobil = document.getElementById("s-mobil");
    const selectPelanggan = document.getElementById("s-pelanggan");

    // Dropdown Mobil
    selectMobil.innerHTML = `<option value="">-- Pilih Mobil --</option>`;
    mobil.forEach(m => {
        selectMobil.innerHTML += `
            <option value="${m.nopol}">
                ${m.merk} (${m.nopol}) - Rp ${m.harga.toLocaleString()}/hari
            </option>
        `;
    });

    // Dropdown Pelanggan
    selectPelanggan.innerHTML = `<option value="">-- Pilih Pelanggan --</option>`;
    pelanggan.forEach(p => {
        selectPelanggan.innerHTML += `
            <option value="${p.id}">
                ${p.nama}
            </option>
        `;
    });

    muatTabelSewa();
}


// ===============================
// MUAT TABEL
// ===============================
async function muatTabelSewa() {

    const dataSewa = await db.transaksi.toArray();
    const tabel = document.getElementById("list-sewa");

    const semuaMobil = await db.mobil.toArray();
    const semuaPelanggan = await db.pelanggan.toArray();

    tabel.innerHTML = "";

    if (dataSewa.length === 0) {
        tabel.innerHTML = `<tr><td colspan="5">Belum ada transaksi</td></tr>`;
        return;
    }

    dataSewa.forEach(s => {

        const mobil = semuaMobil.find(m => m.nopol === s.nopol);
        const pelanggan = semuaPelanggan.find(p => p.id == s.pelangganId);

        const merkMobil = mobil ? mobil.merk : s.nopol;
        const namaPelanggan = pelanggan ? pelanggan.nama : "Pelanggan";

        tabel.innerHTML += `
            <tr>
                <td>${merkMobil}</td>
                <td>${namaPelanggan}</td>
                <td>
                    Rp ${(s.total || 0).toLocaleString()} <br>
                    <small>Denda: Rp ${(s.denda || 0).toLocaleString()}</small>
                </td>
                <td>
                    <b style="
                        color:
                        ${s.status === "MENUNGGU" ? "blue" :
                        s.status === "PINJAM" ? "orange" : "green"}
                    ">
                        ${s.status || "-"}
                    </b>
                </td>
                <td>
                    ${
                        s.status === "MENUNGGU"
                        ? `<button class="btn btn-setujui" onclick="setujui(${s.id})">Setujui</button>`
                        : s.status === "PINJAM"
                        ? `<button class="btn btn-kembali-mobil" onclick="kembali(${s.id})">Kembalikan</button>`
                        : "-"
                    }
                </td>
            </tr>
        `;
    });
}


// ===============================
// TAMBAH TRANSAKSI (ANTI DOUBLE BOOKING)
// ===============================
document.getElementById("btnSewa").onclick = async () => {

    const nopol = document.getElementById("s-mobil").value;
    const pelangganId = Number(document.getElementById("s-pelanggan").value);
    const tglPinjam = document.getElementById("tgl-pinjam").value;
    const tglKembali = document.getElementById("tgl-kembali").value;
    const denda = parseInt(document.getElementById("denda").value) || 0;

    if (!nopol || !pelangganId || !tglPinjam || !tglKembali) {
        alert("Semua data wajib diisi!");
        return;
    }

    // 🔥 CEK DOUBLE BOOKING
    const sedangDipinjam = await db.transaksi
        .where("nopol")
        .equals(nopol)
        .and(trx => trx.status === "PINJAM")
        .first();

    if (sedangDipinjam) {
        alert("Mobil sedang dipinjam!");
        return;
    }

    const tgl1 = new Date(tglPinjam);
    const tgl2 = new Date(tglKembali);
    const durasi = Math.ceil((tgl2 - tgl1) / (1000 * 60 * 60 * 24));

    if (durasi < 1) {
        alert("Tanggal kembali harus setelah tanggal pinjam!");
        return;
    }

    const mobilInfo = await db.mobil
        .where("nopol")
        .equals(nopol)
        .first();

    const total = (durasi * mobilInfo.harga) + denda;

    await db.transaksi.add({
        nopol,
        pelangganId,
        tgl_pinjam: tglPinjam,
        tgl_kembali: tglKembali,
        durasi,
        denda,
        total,
        status: "PINJAM"
    });

    // 🔥 BATASI DATA MAKS 100
    const semua = await db.transaksi.toArray();
    if (semua.length > 100) {
        await db.transaksi.delete(semua[0].id);
    }

    alert(`Berhasil menyewa mobil!\nTotal: Rp ${total.toLocaleString()}`);

    muatTabelSewa();
};


// ===============================
// SETUJUI BOOKING
// ===============================
window.setujui = async (id) => {

    await db.transaksi.update(id, {
        status: "PINJAM"
    });

    muatTabelSewa();
};


// ===============================
// KEMBALIKAN MOBIL (AUTO HAPUS)
// ===============================
window.kembali = async (id) => {

    if (confirm("Yakin mobil dikembalikan?")) {

        await db.transaksi.delete(id); // 🔥 langsung hapus

        muatTabelSewa();
    }
};


// ===============================
window.onload = inisialisasi;