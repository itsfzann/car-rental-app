// Menyimpan ID saat edit
let editId = null;

/** 1. FUNGSI MUAT DATA + PENCARIAN **/
async function muatDataPelanggan(keyword = "") {
    const data = await db.pelanggan.toArray();
    const tabel = document.getElementById("list-pelanggan");

    tabel.innerHTML = "";

    // Filter pencarian berdasarkan nama
    const hasil = data.filter(p =>
        p.nama.toLowerCase().includes(keyword.toLowerCase())
    );

    hasil.forEach(p => {
        tabel.innerHTML += `
            <tr>
                <td>${p.nama}</td>
                <td>${p.alamat}</td>
                <td>${p.hp}</td>
                <td>
                    <button class="btn-edit" onclick="editPelanggan(${p.id})">Edit</button>
                    <button class="btn-hapus" onclick="hapusPelanggan(${p.id})">Hapus</button>
                </td>
            </tr>
        `;
    });
}

/** 2. SIMPAN / UPDATE DATA **/
document.getElementById("btnSimpan").onclick = async () => {
    const nama = document.getElementById("nama").value;
    const alamat = document.getElementById("alamat").value;
    const hp = document.getElementById("hp").value;

    if (!nama || !alamat || !hp) {
        alert("Semua data wajib diisi!");
        return;
    }

    if (editId === null) {
        // TAMBAH DATA
        await db.pelanggan.add({ nama, alamat, hp });
        alert("Pelanggan berhasil ditambahkan");
    } else {
        // UPDATE DATA
        await db.pelanggan.update(editId, { nama, alamat, hp });
        alert("Data pelanggan berhasil diperbarui");
        editId = null;
        document.getElementById("btnSimpan").innerText = "💾 Simpan Pelanggan";
    }

    // Reset form
    document.getElementById("nama").value = "";
    document.getElementById("alamat").value = "";
    document.getElementById("hp").value = "";

    muatDataPelanggan();
};

/**
 * 3. EDIT DATA
 */
window.editPelanggan = async (id) => {
    const p = await db.pelanggan.get(id);

    document.getElementById("nama").value = p.nama;
    document.getElementById("alamat").value = p.alamat;
    document.getElementById("hp").value = p.hp;

    editId = id;
    document.getElementById("btnSimpan").innerText = "Update Pelanggan";
};

/**
 * 4. HAPUS DATA
 */
window.hapusPelanggan = async (id) => {
    if (confirm("Yakin ingin menghapus pelanggan ini?")) {
        await db.pelanggan.delete(id);
        muatDataPelanggan();
    }
};

/** 5. EVENT PENCARIAN **/
document.getElementById("searchPelanggan")?.addEventListener("input", (e) => {
    muatDataPelanggan(e.target.value);
});

// Load awal
window.onload = () => muatDataPelanggan();
