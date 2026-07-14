/**
 * ============================================================
 *  paymentService.js — SmartBank Payment Service Layer
 * ============================================================
 *
 *  File ini adalah SATU-SATUNYA titik integrasi dengan SmartBank
 *  melalui API Gateway.
 *
 *  Ketika API SmartBank sudah tersedia, cukup ganti konfigurasi
 *  pada bagian SMARTBANK_CONFIG dan implementasi fungsi-fungsi
 *  di bawah ini. Seluruh bagian lain aplikasi (controller,
 *  frontend) TIDAK perlu diubah.
 *
 *  STATUS SAAT INI: Placeholder (SmartBank API belum tersedia)
 *  TODO: Isi SMARTBANK_BASE_URL dan SMARTBANK_API_KEY ketika
 *        API Gateway SmartBank sudah siap.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  KONFIGURASI SmartBank (isi ketika API sudah tersedia)
// ─────────────────────────────────────────────────────────────
const SMARTBANK_CONFIG = {
    BASE_URL: process.env.SMARTBANK_API_URL || '',      // Contoh: 'https://api-gateway.smartbank.id/v1'
    API_KEY:  process.env.SMARTBANK_API_KEY  || '',     // API Key dari SmartBank/API Gateway
    MERCHANT_ID: process.env.SMARTBANK_MERCHANT_ID || '', // Merchant ID terdaftar
};

const IS_SMARTBANK_READY = !!(
    SMARTBANK_CONFIG.BASE_URL &&
    SMARTBANK_CONFIG.API_KEY &&
    SMARTBANK_CONFIG.MERCHANT_ID
);

// ─────────────────────────────────────────────────────────────
//  1. Inisiasi Pembayaran SmartBank
//     Dipanggil saat checkout dengan metode SmartBank (QRIS)
//
//  @param {string} invoice  - Nomor invoice (contoh: "INV-1234567890")
//  @param {number} total    - Total pembayaran dalam Rupiah
//  @param {object} metadata - Data tambahan (items, user_id, branch, dsb.)
//
//  @returns {Promise<{ qrPayload: string|null, paymentUrl: string|null, externalRef: string|null }>}
// ─────────────────────────────────────────────────────────────
export const initiateSmartBankPayment = async (invoice, total, metadata = {}) => {
    if (!IS_SMARTBANK_READY) {
        // ── PLACEHOLDER ──────────────────────────────────────────
        // SmartBank belum terhubung. Kembalikan data kosong.
        // Frontend akan menampilkan status "Menunggu SmartBank".
        // Hapus blok ini dan aktifkan blok di bawah ketika API siap.
        // ─────────────────────────────────────────────────────────
        console.warn(`[PaymentService] SmartBank belum dikonfigurasi. Invoice: ${invoice}, Total: ${total}`);
        return {
            qrPayload:   null,
            paymentUrl:  null,
            externalRef: null,
        };
    }

    // ── IMPLEMENTASI AKTUAL (aktifkan ketika SmartBank siap) ──────
    // TODO: Sesuaikan request body dengan dokumentasi API SmartBank
    //
    // const response = await fetch(`${SMARTBANK_CONFIG.BASE_URL}/payment/qris/create`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${SMARTBANK_CONFIG.API_KEY}`,
    //         'X-Merchant-ID': SMARTBANK_CONFIG.MERCHANT_ID,
    //     },
    //     body: JSON.stringify({
    //         invoice_number: invoice,
    //         amount:         total,
    //         currency:       'IDR',
    //         description:    `Pembayaran WarungPOS - ${invoice}`,
    //         ...metadata,
    //     }),
    // });
    //
    // if (!response.ok) {
    //     const err = await response.json().catch(() => ({}));
    //     throw new Error(err.message || `SmartBank API error: ${response.status}`);
    // }
    //
    // const data = await response.json();
    // return {
    //     qrPayload:   data.qr_string   || null,  // string QR untuk di-render frontend
    //     paymentUrl:  data.payment_url || null,  // URL redirect (opsional)
    //     externalRef: data.reference   || null,  // ID referensi SmartBank untuk pelacakan
    // };
    // ─────────────────────────────────────────────────────────────

    return { qrPayload: null, paymentUrl: null, externalRef: null };
};

// ─────────────────────────────────────────────────────────────
//  2. Cek Status Pembayaran di SmartBank
//     Digunakan oleh polling frontend atau webhook handler
//
//  @param {string} invoice  - Nomor invoice
//
//  @returns {Promise<{ status: 'Pending'|'Selesai'|'Gagal', externalRef: string|null }>}
// ─────────────────────────────────────────────────────────────
export const checkSmartBankStatus = async (invoice) => {
    if (!IS_SMARTBANK_READY) {
        // Placeholder: status tetap Pending selama SmartBank belum terhubung.
        // Gunakan endpoint /simulate-success untuk testing manual.
        return { status: 'Pending', externalRef: null };
    }

    // ── IMPLEMENTASI AKTUAL ───────────────────────────────────────
    // TODO: Sesuaikan dengan endpoint status SmartBank
    //
    // const response = await fetch(
    //     `${SMARTBANK_CONFIG.BASE_URL}/payment/status/${invoice}`,
    //     {
    //         headers: {
    //             'Authorization': `Bearer ${SMARTBANK_CONFIG.API_KEY}`,
    //             'X-Merchant-ID': SMARTBANK_CONFIG.MERCHANT_ID,
    //         },
    //     }
    // );
    //
    // if (!response.ok) {
    //     return { status: 'Pending', externalRef: null };
    // }
    //
    // const data = await response.json();
    // // Petakan status SmartBank ke status internal aplikasi
    // const statusMap = {
    //     'PAID':    'Selesai',
    //     'PENDING': 'Pending',
    //     'EXPIRED': 'Gagal',
    //     'FAILED':  'Gagal',
    // };
    // return {
    //     status:      statusMap[data.status] || 'Pending',
    //     externalRef: data.reference || null,
    // };
    // ─────────────────────────────────────────────────────────────

    return { status: 'Pending', externalRef: null };
};

// ─────────────────────────────────────────────────────────────
//  3. Batalkan/Expire Pembayaran di SmartBank
//     Dipanggil jika transaksi timeout atau dibatalkan pengguna
//
//  @param {string} invoice  - Nomor invoice
//
//  @returns {Promise<{ success: boolean }>}
// ─────────────────────────────────────────────────────────────
export const cancelSmartBankPayment = async (invoice) => {
    if (!IS_SMARTBANK_READY) {
        return { success: true }; // Placeholder: anggap berhasil
    }

    // ── IMPLEMENTASI AKTUAL ───────────────────────────────────────
    // TODO: Sesuaikan dengan endpoint cancel SmartBank
    //
    // try {
    //     const response = await fetch(
    //         `${SMARTBANK_CONFIG.BASE_URL}/payment/cancel/${invoice}`,
    //         {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${SMARTBANK_CONFIG.API_KEY}`,
    //                 'X-Merchant-ID': SMARTBANK_CONFIG.MERCHANT_ID,
    //             },
    //         }
    //     );
    //     return { success: response.ok };
    // } catch {
    //     return { success: false };
    // }
    // ─────────────────────────────────────────────────────────────

    return { success: true };
};

// ─────────────────────────────────────────────────────────────
//  4. Verifikasi Pembayaran SmartBank Konsumen
//     Dipanggil saat konsumen menekan tombol konfirmasi bayar
//
//  @param {string} invoice  - Nomor invoice
//
//  @returns {Promise<{ success: boolean }>}
// ─────────────────────────────────────────────────────────────
export const verifyConsumerPayment = async (invoice) => {
    if (!IS_SMARTBANK_READY) {
        // Placeholder: Selama SmartBank belum siap, konfirmasi selalu berhasil.
        console.warn(`[PaymentService] Verifikasi pembayaran simulasi untuk Invoice: ${invoice}`);
        return { success: true };
    }

    // ── IMPLEMENTASI AKTUAL (aktifkan ketika SmartBank siap) ──────
    // TODO: Hubungkan ke SmartBank API Gateway untuk verifikasi transaksi
    //
    // try {
    //     const statusResult = await checkSmartBankStatus(invoice);
    //     return { success: statusResult.status === 'Selesai' };
    // } catch (err) {
    //     console.error('SmartBank verification error:', err);
    //     return { success: false };
    // }
    // ─────────────────────────────────────────────────────────────

    return { success: false };
};

