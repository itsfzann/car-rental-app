// ===============================
// GLOBAL
// ===============================
let lastTotalTransaksi = 0;


// ===============================
// LOAD DASHBOARD
// ===============================
async function loadDashboard() {

    try {

        const semuaMobil = await db.mobil.toArray();
        const semuaPelanggan = await db.pelanggan.toArray();
        const semuaTransaksi = await db.transaksi.toArray();

        // ===== TOTAL =====
        setText("totalMobil", semuaMobil.length);
        setText("totalPelanggan", semuaPelanggan.length);
        setText("totalTransaksi", semuaTransaksi.length);


        // ===============================
        // MOBIL SEDANG DISEWA
        // ===============================
        const mobilDisewaList = document.getElementById("mobilDisewa");
        mobilDisewaList.innerHTML = "";

        const sedangPinjam = semuaTransaksi.filter(trx => trx.status === "PINJAM");

        if (sedangPinjam.length === 0) {

            mobilDisewaList.innerHTML = "<li>Tidak ada mobil disewa</li>";

        } else {

            sedangPinjam.forEach(trx => {

                const mobil = semuaMobil.find(m => m.nopol === trx.nopol);
                const merkMobil = mobil ? mobil.merk : "Mobil";

                mobilDisewaList.innerHTML += `<li>${merkMobil}</li>`;
            });
        }


        // ===============================
        // PENDAPATAN HARI INI
        // ===============================
        const today = new Date().toISOString().split("T")[0];
        let totalPendapatan = 0;

        semuaTransaksi.forEach(trx => {
            if (
                trx.tgl_pinjam &&
                trx.tgl_pinjam.includes(today)
            ) {
                totalPendapatan += Number(trx.total || 0);
            }
        });

        setText(
            "pendapatanHari",
            "Rp " + totalPendapatan.toLocaleString("id-ID")
        );


        // ===============================
        // AKTIVITAS TERBARU
        // ===============================
        const aktivitasList = document.getElementById("aktivitasTerbaru");
        aktivitasList.innerHTML = "";

        const transaksiTerbaru = semuaTransaksi.slice(-5).reverse();

        if (transaksiTerbaru.length === 0) {

            aktivitasList.innerHTML = "<li>Belum ada aktivitas</li>";

        } else {

            transaksiTerbaru.forEach(trx => {

                const mobil = semuaMobil.find(m => m.nopol === trx.nopol);
                const pelanggan = semuaPelanggan.find(p => p.id == trx.pelangganId);

                const merkMobil = mobil ? mobil.merk : "Mobil";
                const namaPelanggan = pelanggan ? pelanggan.nama : "Pelanggan";

                aktivitasList.innerHTML += `
                    <li>
                        ${namaPelanggan} menyewa ${merkMobil}
                        <br>
                        <small>${trx.tgl_pinjam || "-"}</small>
                    </li>
                `;
            });
        }

        checkTransaksiBaru(semuaTransaksi.length);

    } catch (error) {

        console.error("ERROR DASHBOARD:", error);

    }
}


// ===============================
// CEK TRANSAKSI BARU
// ===============================
function checkTransaksiBaru(totalSekarang) {

    if (totalSekarang > lastTotalTransaksi && lastTotalTransaksi !== 0) {

        const notif = document.getElementById("notif");

        notif.textContent = "🔔 Transaksi baru ditambahkan!";
        notif.style.display = "block";

        setTimeout(() => {
            notif.style.display = "none";
        }, 3000);
    }

    lastTotalTransaksi = totalSekarang;
}


// ===============================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
}


// ===============================
window.addEventListener("DOMContentLoaded", loadDashboard);