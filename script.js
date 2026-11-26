const namaTamu = document.getElementById("nama-tamu");
const parameterNama = new URLSearchParams(window.location.search).get("to");
const namaAwal = parameterNama && parameterNama.trim() ? parameterNama.trim() : "";
namaTamu.textContent = namaAwal || "Tamu Undangan";
const inputNamaRsvp = document.getElementById("nama-rsvp");
inputNamaRsvp.value = namaAwal;

const sampulDepan = document.getElementById("sampul-depan");
const isiUndangan = document.getElementById("isi-undangan");
const tombolBuka = document.getElementById("tombol-buka");
const tombolMusik = document.getElementById("tombol-musik");
const statusMusik = document.getElementById("status-musik");
const ikonMusik = document.getElementById("ikon-musik");
const audioLatar = document.getElementById("audio-latar");
const notifikasiSalin = document.getElementById("notifikasi-salin");
const tanggalAcara = new Date("2027-02-05T18:00:00+07:00");
const statusAcara = document.getElementById("status-acara");
const tombolKalender = document.getElementById("tombol-kalender");
const formRsvp = document.getElementById("form-rsvp");
const daftarUcapan = document.getElementById("daftar-ucapan");
const pesanKosong = document.getElementById("kosong-buku-tamu");
const statusRsvp = document.getElementById("status-rsvp");
const elemenHitungMundur = {
    hari: document.getElementById("hitung-hari"),
    jam: document.getElementById("hitung-jam"),
    menit: document.getElementById("hitung-menit"),
    detik: document.getElementById("hitung-detik")
};
let waktuNotifikasi;
let musikBerputar = false;
let undanganDibuka = false;
const kunciBukuTamu = "undangan-farid-athaillah-buku-tamu";

const tautanGoogleMaps = "https://maps.app.goo.gl/qYvoKWfRgXmiJxd47";
document.getElementById("tautan-arah").href = tautanGoogleMaps;
document.getElementById("qr-lokasi").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tautanGoogleMaps)}`;
document.getElementById("qr-lokasi").alt = "QR Code menuju lokasi acara";

function perbaruiHitungMundur() {
    const selisih = tanggalAcara.getTime() - Date.now();
    const waktuTersisa = Math.max(selisih, 0);
    const hari = Math.floor(waktuTersisa / 86400000);
    const jam = Math.floor((waktuTersisa % 86400000) / 3600000);
    const menit = Math.floor((waktuTersisa % 3600000) / 60000);
    const detik = Math.floor((waktuTersisa % 60000) / 1000);

    elemenHitungMundur.hari.textContent = String(hari).padStart(2, "0");
    elemenHitungMundur.jam.textContent = String(jam).padStart(2, "0");
    elemenHitungMundur.menit.textContent = String(menit).padStart(2, "0");
    elemenHitungMundur.detik.textContent = String(detik).padStart(2, "0");

    if (selisih <= 0 && !statusAcara.textContent) {
        statusAcara.textContent = "Acara telah dimulai.";
    }
}

function tampilkanNotifikasi(pesan, gagal = false) {
    notifikasiSalin.textContent = pesan;
    notifikasiSalin.classList.toggle("gagal", gagal);
    notifikasiSalin.classList.add("tampil");
    window.clearTimeout(waktuNotifikasi);
    waktuNotifikasi = window.setTimeout(() => {
        notifikasiSalin.classList.remove("tampil");
    }, 3000);
}

function ucapanValid(ucapan) {
    return ucapan !== null
        && typeof ucapan === "object"
        && typeof ucapan.nama === "string"
        && ucapan.nama.trim().length > 0
        && (ucapan.kehadiran === "Hadir" || ucapan.kehadiran === "Tidak Hadir")
        && typeof ucapan.ucapan === "string"
        && ucapan.ucapan.trim().length > 0
        && typeof ucapan.tanggal === "string"
        && !Number.isNaN(Date.parse(ucapan.tanggal));
}

function buatKartuUcapan(ucapan) {
    const kartu = document.createElement("article");
    kartu.className = "kartu-ucapan";

    const kepala = document.createElement("div");
    kepala.className = "kepala-ucapan";

    const nama = document.createElement("strong");
    nama.className = "nama-pengucap";
    nama.textContent = ucapan.nama;

    const status = document.createElement("span");
    status.className = "lencana-kehadiran";
    status.classList.add(ucapan.kehadiran === "Tidak Hadir" ? "tidak-hadir" : "hadir");
    status.textContent = ucapan.kehadiran;
    kepala.append(nama, status);

    const isi = document.createElement("p");
    isi.className = "isi-ucapan";
    isi.textContent = ucapan.ucapan;

    const waktu = document.createElement("time");
    waktu.className = "tanggal-ucapan";
    waktu.dateTime = ucapan.tanggal;
    waktu.textContent = new Date(ucapan.tanggal).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
    });

    kartu.append(kepala, isi, waktu);
    return kartu;
}

function tampilkanUcapan(ucapan, diAwal = false) {
    if (pesanKosong.parentNode) pesanKosong.remove();
    const kartu = buatKartuUcapan(ucapan);
    if (diAwal) {
        daftarUcapan.prepend(kartu);
    } else {
        daftarUcapan.append(kartu);
    }
}

function muatBukuTamu() {
    try {
        const tersimpan = localStorage.getItem(kunciBukuTamu);
        const ucapan = tersimpan ? JSON.parse(tersimpan) : [];
        if (!Array.isArray(ucapan) || !ucapan.every(ucapanValid)) {
            throw new Error("Format data buku tamu tidak valid.");
        }
        ucapan.forEach(data => tampilkanUcapan(data));
    } catch (kesalahan) {
        tampilkanNotifikasi("Buku tamu tersimpan tidak dapat dimuat.", true);
        console.error("Gagal memuat data buku tamu:", kesalahan);
    }
}

function formatTanggalKalender(tanggal) {
    return tanggal.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function amankanTeksKalender(teks) {
    return teks
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function unduhKalender() {
    const tanggalSelesai = new Date(tanggalAcara.getTime() + 3 * 60 * 60 * 1000);
    const isiKalender = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Undangan Farid Athaillah//ID",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:ulang-tahun-farid-athaillah-20270205@undangan`,
        `DTSTAMP:${formatTanggalKalender(new Date())}`,
        `DTSTART:${formatTanggalKalender(tanggalAcara)}`,
        `DTEND:${formatTanggalKalender(tanggalSelesai)}`,
        `SUMMARY:${amankanTeksKalender("Ulang Tahun Farid Athaillah")}`,
        `DESCRIPTION:${amankanTeksKalender("Perayaan ulang tahun Farid Athaillah.")}`,
        `LOCATION:${amankanTeksKalender("SMKN 6 Kota Tangerang Selatan, Paku Jaya")}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n") + "\r\n";

    const berkasKalender = new Blob(["\uFEFF", isiKalender], {
        type: "text/calendar;charset=utf-8"
    });
    const alamatBerkas = URL.createObjectURL(berkasKalender);
    const tautanUnduh = document.createElement("a");
    tautanUnduh.href = alamatBerkas;
    tautanUnduh.download = "undangan-ulang-tahun-farid-athaillah.ics";
    document.body.appendChild(tautanUnduh);
    tautanUnduh.click();
    tautanUnduh.remove();
    window.setTimeout(() => URL.revokeObjectURL(alamatBerkas), 1000);
}

function perbaruiTombolMusik(berputar) {
    musikBerputar = berputar;
    const label = musikBerputar ? "Matikan musik" : "Nyalakan musik";
    tombolMusik.setAttribute("aria-label", label);
    tombolMusik.setAttribute("title", label);
    tombolMusik.setAttribute("aria-pressed", String(musikBerputar));
    statusMusik.textContent = musikBerputar ? "Musik Nyala" : "Musik Mati";
    ikonMusik.textContent = musikBerputar ? "♫" : "Ⅱ";
    ikonMusik.classList.toggle("bergerak", musikBerputar);
    tombolMusik.classList.toggle("musik-nyala", musikBerputar);
    tombolMusik.classList.toggle("musik-mati", !musikBerputar);
}

async function putarMusik() {
    try {
        await audioLatar.play();
        perbaruiTombolMusik(true);
    } catch (kesalahan) {
        perbaruiTombolMusik(false);
        tampilkanNotifikasi("Musik tidak dapat diputar.", true);
        console.error("Gagal memutar musik latar:", kesalahan);
    }
}

tombolBuka.addEventListener("click", () => {
    if (undanganDibuka) return;
    undanganDibuka = true;
    sampulDepan.classList.add("dibuka");
    sampulDepan.setAttribute("aria-hidden", "true");
    isiUndangan.removeAttribute("aria-hidden");
    isiUndangan.removeAttribute("inert");
    document.documentElement.classList.remove("terkunci");
    document.body.classList.remove("terkunci");
    tombolMusik.classList.remove("tersembunyi");
    document.getElementById("judul-sambutan").focus({ preventScroll: true });
    putarMusik();
});

tombolMusik.addEventListener("click", () => {
    if (audioLatar.paused) {
        putarMusik();
    } else {
        audioLatar.pause();
    }
});

audioLatar.addEventListener("play", () => perbaruiTombolMusik(true));
audioLatar.addEventListener("pause", () => perbaruiTombolMusik(false));
tombolKalender.addEventListener("click", unduhKalender);

formRsvp.addEventListener("submit", event => {
    event.preventDefault();
    const dataBaru = {
        nama: inputNamaRsvp.value.trim(),
        kehadiran: document.getElementById("status-kehadiran").value,
        ucapan: document.getElementById("ucapan-rsvp").value.trim(),
        tanggal: new Date().toISOString()
    };

    if (!dataBaru.nama || !dataBaru.kehadiran || !dataBaru.ucapan) {
        statusRsvp.textContent = "Lengkapi nama, status kehadiran, dan ucapan.";
        tampilkanNotifikasi(statusRsvp.textContent, true);
        return;
    }

    try {
        const tersimpan = localStorage.getItem(kunciBukuTamu);
        const ucapanLama = tersimpan ? JSON.parse(tersimpan) : [];
        if (!Array.isArray(ucapanLama) || !ucapanLama.every(ucapanValid)) {
            throw new Error("Format data buku tamu tidak valid.");
        }
        localStorage.setItem(kunciBukuTamu, JSON.stringify([dataBaru, ...ucapanLama]));
    } catch (kesalahan) {
        statusRsvp.textContent = "Ucapan belum dapat disimpan di browser ini.";
        tampilkanNotifikasi(statusRsvp.textContent, true);
        console.error("Gagal menyimpan data buku tamu:", kesalahan);
        return;
    }

    tampilkanUcapan(dataBaru, true);
    statusRsvp.textContent = "Konfirmasi berhasil disimpan.";
    tampilkanNotifikasi(statusRsvp.textContent);
    formRsvp.reset();
    inputNamaRsvp.value = namaAwal;
});

document.querySelectorAll(".tombol-salin").forEach(tombol => {
    tombol.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(tombol.dataset.salin);
            tampilkanNotifikasi("Berhasil disalin!");
        } catch (kesalahan) {
            tampilkanNotifikasi("Gagal menyalin. Coba salin manual.", true);
            console.error("Gagal menyalin teks ke clipboard:", kesalahan);
        }
    });
});

muatBukuTamu();
document.body.classList.add("js-aktif");
const elemenAnimasi = document.querySelectorAll(".animasi-muncul");
if ("IntersectionObserver" in window) {
    const pengamat = new IntersectionObserver((entri, observer) => {
        entri.forEach(item => {
            if (item.isIntersecting) {
                item.target.classList.add("terlihat");
                observer.unobserve(item.target);
            }
        });
    }, { threshold: 0.15 });

    elemenAnimasi.forEach(elemen => pengamat.observe(elemen));
} else {
    elemenAnimasi.forEach(elemen => elemen.classList.add("terlihat"));
}

perbaruiHitungMundur();
window.setInterval(perbaruiHitungMundur, 1000);
