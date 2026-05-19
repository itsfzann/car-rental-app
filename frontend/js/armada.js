let formAktif = null;

/* =============================== */
/* LOAD ARMADA */
/* =============================== */

async function tampilArmada() {

    const container = document.getElementById("armada-container");
    const dataMobil = await db.mobil.toArray();

    container.innerHTML = "";

    for (let mobil of dataMobil) {

        const sedangDipinjam = await db.transaksi
            .where("nopol")
            .equals(mobil.nopol)
            .and(item => item.status === "PINJAM")
            .first();

        const statusText = sedangDipinjam 
            ? "🔴 Sedang Disewa"
            : "🟢 Tersedia";

        const statusClass = sedangDipinjam 
            ? "status-disewa"
            : "status-tersedia";

        container.innerHTML += `
        <div class="armada-card">

            <img src="${mobil.foto || 'https://source.unsplash.com/400x300/?car'}">

            <span class="status-badge ${statusClass}">
                ${statusText}
            </span>

            <div class="armada-info">
                <h3>${mobil.merk}</h3>
                <p>No Polisi: ${mobil.nopol}</p>
                <p>Rp ${mobil.harga.toLocaleString()} / hari</p>

                ${
                    sedangDipinjam
                    ? `<button disabled>Tidak Tersedia</button>`
                    : `
                        <button id="btn-${mobil.nopol}" 
                                onclick="toggleForm('${mobil.nopol}')">
                            Booking Sekarang
                        </button>

                        <div id="form-${mobil.nopol}" class="form-booking">

                            <select id="pelangganSelect-${mobil.nopol}">
                                <option value="">-- Pilih Pelanggan --</option>
                            </select>

                            <input type="date" 
                                   id="pinjam-${mobil.nopol}" 
                                   onchange="hitungTotal('${mobil.nopol}', ${mobil.harga})">

                            <input type="date" 
                                   id="kembali-${mobil.nopol}" 
                                   onchange="hitungTotal('${mobil.nopol}', ${mobil.harga})">

                            <p id="total-${mobil.nopol}" class="total-harga">
                                Total: -
                            </p>

                            <button onclick="booking('${mobil.nopol}', ${mobil.harga})">
                                Ajukan Booking
                            </button>

                        </div>
                    `
                }
            </div>

        </div>
        `;
    }

    aktifkanSearch(); // aktifkan ulang search setelah render
}

/* =============================== */
/* TOGGLE FORM (1 CARD SAJA) */
/* =============================== */

function toggleForm(nopol) {

    const form = document.getElementById("form-" + nopol);
    const btn = document.getElementById("btn-" + nopol);

    // Tutup jika klik card yang sama
    if (formAktif === nopol) {
        form.classList.remove("active");
        btn.innerText = "Booking Sekarang";
        formAktif = null;
        return;
    }

    // Tutup card lama jika ada
    if (formAktif) {
        const formLama = document.getElementById("form-" + formAktif);
        const btnLama = document.getElementById("btn-" + formAktif);

        if (formLama) formLama.classList.remove("active");
        if (btnLama) btnLama.innerText = "Booking Sekarang";
    }

    // Buka card baru
    form.classList.add("active");
    btn.innerText = "Tutup";
    formAktif = nopol;

    loadPelanggan(nopol);
}

/* =============================== */
/* LOAD DATA PELANGGAN */
/* =============================== */

async function loadPelanggan(nopol) {

    const select = document.getElementById("pelangganSelect-" + nopol);
    const data = await db.pelanggan.toArray();

    select.innerHTML = `<option value="">-- Pilih Pelanggan --</option>`;

    if (data.length === 0) {
        select.innerHTML += `<option disabled>Tidak ada pelanggan</option>`;
        return;
    }

    data.forEach(p => {
        select.innerHTML += `
            <option value="${p.id}">
                ${p.nama}
            </option>
        `;
    });
}

/* =============================== */
/* HITUNG TOTAL */
/* =============================== */

function hitungTotal(nopol, harga) {

    const tglPinjam = document.getElementById("pinjam-" + nopol).value;
    const tglKembali = document.getElementById("kembali-" + nopol).value;

    if (!tglPinjam || !tglKembali) {
        document.getElementById("total-" + nopol).innerHTML = "Total: -";
        return;
    }

    const t1 = new Date(tglPinjam);
    const t2 = new Date(tglKembali);
    const selisih = t2 - t1;
    const durasi = Math.ceil(selisih / (1000 * 60 * 60 * 24));

    if (durasi <= 0) {
        document.getElementById("total-" + nopol).innerHTML = "Tanggal tidak valid";
        return;
    }

    const total = durasi * harga;

    document.getElementById("total-" + nopol).innerHTML =
        "Total: Rp " + total.toLocaleString();
}

/* =============================== */
/* BOOKING */
/* =============================== */

async function booking(nopol, harga) {

    const pelangganId = document.getElementById("pelangganSelect-" + nopol).value;
    const tglPinjam = document.getElementById("pinjam-" + nopol).value;
    const tglKembali = document.getElementById("kembali-" + nopol).value;

    if (!pelangganId) {
        alert("Pilih pelanggan terlebih dahulu!");
        return;
    }

    if (!tglPinjam || !tglKembali) {
        alert("Pilih tanggal dulu!");
        return;
    }

    const t1 = new Date(tglPinjam);
    const t2 = new Date(tglKembali);
    const selisih = t2 - t1;
    const durasi = Math.ceil(selisih / (1000 * 60 * 60 * 24));

    if (durasi <= 0) {
        alert("Tanggal tidak valid!");
        return;
    }

    const total = durasi * harga;

    await db.transaksi.add({
        pelangganId: Number(pelangganId),
        nopol: nopol,
        tgl_pinjam: tglPinjam,
        tgl_kembali: tglKembali,
        durasi: durasi,
        denda: 0,
        total: total,
        status: "MENUNGGU"
    });

    alert("Booking berhasil!\nTotal: Rp " + total.toLocaleString());

    formAktif = null;
    tampilArmada();
}

/* ========================= */
/* LIVE SEARCH */
/* ========================= */

function aktifkanSearch() {

    const searchInput = document.getElementById("searchMobil");
    if (!searchInput) return;

    searchInput.addEventListener("input", function () {

        const keyword = this.value.toLowerCase();
        const cards = document.querySelectorAll(".armada-card");

        cards.forEach(card => {
            const namaMobil = card.querySelector("h3").textContent.toLowerCase();

            if (namaMobil.includes(keyword)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });

    });
}

window.onload = tampilArmada;