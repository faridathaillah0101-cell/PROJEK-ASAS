const namaTamu = document.getElementById("nama-tamu");
const parameterNama = new URLSearchParams(window.location.search).get("to");
namaTamu.textContent = parameterNama && parameterNama.trim()
    ? parameterNama.trim()
    : "Tamu Undangan";

const sampulDepan = document.getElementById("sampul-depan");
const isiUndangan = document.getElementById("isi-undangan");
const tombolBuka = document.getElementById("tombol-buka");
const tombolMusik = document.getElementById("tombol-musik");
const statusMusik = document.getElementById("status-musik");
const nadaMusik = [392, 440, 523.25, 659.25, 523.25, 440, 392, 349.23];
const tanggalAcara = new Date("2027-02-05T18:00:00+07:00");
const statusAcara = document.getElementById("status-acara");
const elemenHitungMundur = {
    hari: document.getElementById("hitung-hari"),
    jam: document.getElementById("hitung-jam"),
    menit: document.getElementById("hitung-menit"),
    detik: document.getElementById("hitung-detik")
};

let konteksAudio;
let jedaNada;
let nomorNada = 0;
let musikBerputar = false;
let musikMemulai = false;
let undanganDibuka = false;

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
        `LOCATION:${amankanTeksKalender("The Garden House, Jl. Melati No. 17, Jakarta")}`,
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

function perbaruiTombolMusik() {
    const label = musikBerputar ? "Jeda musik" : "Putar musik";
    tombolMusik.setAttribute("aria-label", label);
    tombolMusik.setAttribute("title", label);
    tombolMusik.setAttribute("aria-pressed", String(musikBerputar));
    statusMusik.textContent = musikBerputar ? "Musik diputar" : "Musik dijeda";
}

function mainkanNada() {
    if (!konteksAudio || konteksAudio.state !== "running") return;

    const osilator = konteksAudio.createOscillator();
    const volume = konteksAudio.createGain();
    const waktuMulai = konteksAudio.currentTime;

    osilator.type = "sine";
    osilator.frequency.value = nadaMusik[nomorNada % nadaMusik.length];
    volume.gain.setValueAtTime(0.0001, waktuMulai);
    volume.gain.exponentialRampToValueAtTime(0.045, waktuMulai + 0.06);
    volume.gain.exponentialRampToValueAtTime(0.0001, waktuMulai + 0.62);
    osilator.connect(volume);
    volume.connect(konteksAudio.destination);
    osilator.start(waktuMulai);
    osilator.stop(waktuMulai + 0.65);
    nomorNada += 1;
}

async function putarMusik() {
    if (musikBerputar || musikMemulai) return;

    const KelasAudio = window.AudioContext || window.webkitAudioContext;
    if (!KelasAudio) {
        statusMusik.textContent = "Musik tidak didukung browser ini";
        tombolMusik.setAttribute("aria-label", "Musik tidak tersedia");
        console.error("Web Audio API tidak tersedia di browser ini.");
        return;
    }

    musikMemulai = true;
    tombolMusik.disabled = true;
    try {
        konteksAudio = konteksAudio || new KelasAudio();
        await konteksAudio.resume();
        if (konteksAudio.state !== "running") {
            throw new Error("Audio tidak berhasil dijalankan.");
        }

        musikBerputar = true;
        mainkanNada();
        window.clearInterval(jedaNada);
        jedaNada = window.setInterval(mainkanNada, 700);
        perbaruiTombolMusik();
    } catch (kesalahan) {
        musikBerputar = false;
        perbaruiTombolMusik();
        statusMusik.textContent = "Musik tidak dapat diputar";
        console.error("Gagal memutar musik latar:", kesalahan);
    } finally {
        musikMemulai = false;
        tombolMusik.disabled = false;
    }
}

async function jedaMusik() {
    window.clearInterval(jedaNada);
    musikBerputar = false;
    perbaruiTombolMusik();

    if (!konteksAudio || konteksAudio.state !== "running") return;
    try {
        await konteksAudio.suspend();
    } catch (kesalahan) {
        console.error("Gagal menjeda musik:", kesalahan);
    }
}

tombolBuka.addEventListener("click", () => {
    if (undanganDibuka) return;
    undanganDibuka = true;
    sampulDepan.classList.add("dibuka");
    sampulDepan.setAttribute("aria-hidden", "true");
    isiUndangan.removeAttribute("aria-hidden");
    isiUndangan.removeAttribute("inert");
    document.body.classList.remove("terkunci");
    tombolMusik.classList.remove("tersembunyi");
    document.getElementById("judul-sambutan").focus({ preventScroll: true });
    putarMusik();
});

tombolMusik.addEventListener("click", () => {
    if (musikBerputar) {
        jedaMusik();
    } else {
        putarMusik();
    }
});

document.getElementById("tombol-kalender").addEventListener("click", unduhKalender);

perbaruiHitungMundur();
window.setInterval(perbaruiHitungMundur, 1000);
