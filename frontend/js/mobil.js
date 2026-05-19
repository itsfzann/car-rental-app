let editId = null; // untuk menyimpan ID yang sedang diedit

// 1. Fungsi untuk menampilkan data dari database ke tabel
async function muatData(keyword = "") {
    const dataMobil = await db.mobil.toArray();
    const tabel = document.getElementById('list-mobil');

    tabel.innerHTML = "";

    // Filter jika ada keyword pencarian
    const hasilFilter = dataMobil.filter(m =>
        m.nopol.toLowerCase().includes(keyword.toLowerCase()) ||
        m.merk.toLowerCase().includes(keyword.toLowerCase())
    );

    hasilFilter.forEach(m => {
    tabel.innerHTML += `
        <tr>
            <td>${m.nopol}</td>
            <td>${m.merk}</td>
            <td>Rp ${m.harga.toLocaleString()}</td>
            <td>
                <button class="btn-edit" onclick="editMobil(${m.id})">Edit</button>
                <button class="btn-hapus" onclick="hapusMobil(${m.id})">Hapus</button>
            </td>
        </tr>`;
});
}

// 2. Tombol Simpan / Update
document.getElementById('btnSimpan').onclick = async () => {
    const n = document.getElementById('nopol').value;
    const m = document.getElementById('merk').value;
    const h = document.getElementById('harga').value;
    const file = document.getElementById('foto').files[0];

    if (!n || !m || !h) {
        alert("Mohon isi semua data!");
        return;
    }

    let base64Foto = "";

    if (file) {
        base64Foto = await toBase64(file);
    }

    if (editId === null) {
        await db.mobil.add({
            nopol: n,
            merk: m,
            harga: parseInt(h),
            foto: base64Foto
        });

        alert("Data berhasil disimpan!");
    } else {
        await db.mobil.update(editId, {
            nopol: n,
            merk: m,
            harga: parseInt(h),
            foto: base64Foto
        });

        alert("Data berhasil diupdate!");
        editId = null;
        document.getElementById('btnSimpan').innerText = "Simpan";
    }

    resetForm();
    muatData();
};

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 3. Fungsi Edit
window.editMobil = async (id) => {
    const data = await db.mobil.get(id);

    document.getElementById('nopol').value = data.nopol;
    document.getElementById('merk').value = data.merk;
    document.getElementById('harga').value = data.harga;

    editId = id;
    document.getElementById('btnSimpan').innerText = "Update";
};

// 4. Fungsi Hapus
window.hapusMobil = async (id) => {
    if (confirm("Yakin ingin menghapus?")) {
        await db.mobil.delete(id);
        muatData();
    }
};

// 5. Fungsi Search
document.getElementById('searchMobil').addEventListener('keyup', function () {
    const keyword = this.value;
    muatData(keyword);
});

// 6. Reset Form
function resetForm() {
    document.getElementById('nopol').value = "";
    document.getElementById('merk').value = "";
    document.getElementById('harga').value = "";
}

// Jalankan saat pertama kali dibuka
window.onload = () => {muatData();
};