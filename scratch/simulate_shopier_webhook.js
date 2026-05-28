/**
 * Shopier Webhook Yerel Simülasyon Script'i
 *
 * Bu script, yerel geliştirme sunucunuz (http://localhost:3000) çalışırken,
 * gerçek ödeme yapmadan ve imza doğrulamasını (HMAC-SHA256) kırmadan
 * lisans satın alma/süre uzatma senaryolarını test etmenizi sağlar.
 *
 * Çalıştırma Talimatı:
 * 1. .env.local içine SHOPIER_API_SECRET ekleyin (zorunlu — webhook artık fallback kullanmıyor).
 * 2. Yerel sunucunuzu başlatın: SHOPIER_API_SECRET=... npm run dev
 * 3. Yeni bir terminal açın ve aynı değişkenle script'i çalıştırın:
 *    SHOPIER_API_SECRET=... node scratch/simulate_shopier_webhook.js \
 *      <WORKSPACE_ID> [leader|master|pro] [monthly|yearly] [success|fail]
 *
 * Örnekler:
 * - SHOPIER_API_SECRET=test node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab master monthly
 * - SHOPIER_API_SECRET=test node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab pro yearly
 */

const crypto = require('crypto');

// Argüman kontrolü
const args = process.argv.slice(2);
const workspaceId = args[0];
const plan = args[1] || 'master'; // varsayılan: master
const period = args[2] || 'monthly'; // varsayılan: monthly
const status = args[3] || 'success'; // varsayılan: success

const VALID_PLANS = ['leader', 'master', 'pro'];
const VALID_PERIODS = ['monthly', 'yearly'];

if (!workspaceId) {
  console.log('\n❌ Hata: Lütfen test etmek istediğiniz Workspace ID\'yi belirtin.');
  console.log('\nKullanım Şablonu:');
  console.log('  node scratch/simulate_shopier_webhook.js <workspace_id> [leader|master|pro] [monthly|yearly] [success|failed]');
  console.log('\nÖrnekler:');
  console.log('  node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab master monthly');
  console.log('  node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab pro yearly\n');
  process.exit(1);
}

if (!VALID_PLANS.includes(plan)) {
  console.log(`\n❌ Hata: Geçersiz plan "${plan}". Geçerli: ${VALID_PLANS.join(', ')}\n`);
  process.exit(1);
}
if (!VALID_PERIODS.includes(period)) {
  console.log(`\n❌ Hata: Geçersiz period "${period}". Geçerli: ${VALID_PERIODS.join(', ')}\n`);
  process.exit(1);
}

// Plan + period fiyatı belirleme (odeme/actions.ts ile aynı tablo)
const PRICE_TABLE = {
  leader: { monthly: '399', yearly: '3499' },
  master: { monthly: '1199', yearly: '9999' },
  pro: { monthly: '2499', yearly: '19999' },
};
const totalAmount = PRICE_TABLE[plan][period];
const platformOrderId = `${workspaceId}_${plan}_${period}_${Date.now()}`;
const randomNumber = Math.floor(100000 + Math.random() * 900000).toString();

const apiSecret = process.env.SHOPIER_API_SECRET;
if (!apiSecret) {
  console.log('\n❌ Hata: SHOPIER_API_SECRET ortam değişkeni gerekli. Webhook artık fallback secret kullanmıyor.');
  console.log('   Örnek: SHOPIER_API_SECRET=shopier_test_secret_key node scratch/simulate_shopier_webhook.js ...\n');
  process.exit(1);
}
const localApiUrl = 'http://localhost:3000/api/payment/shopier';

// Webhook imza verisi: platform_order_id + random_number + total_amount + status
const signatureData = platformOrderId + randomNumber + totalAmount + status;
const expectedSignature = crypto
  .createHmac('sha256', apiSecret)
  .update(signatureData)
  .digest('base64');

// Form payload'u (Shopier callback verileri form-urlencoded fırlatır)
const payload = new URLSearchParams();
payload.append('platform_order_id', platformOrderId);
payload.append('random_number', randomNumber);
payload.append('status', status);
payload.append('total_amount', totalAmount);
payload.append('signature', expectedSignature);

console.log('──────────────────────────────────────────────────────');
console.log('🚀 Shopier Webhook Simülasyonu Başlatılıyor...');
console.log('──────────────────────────────────────────────────────');
console.log(`📍 Hedef API URL  : ${localApiUrl}`);
console.log(`🔑 API Secret     : ${apiSecret === 'shopier_test_secret_key' ? 'shopier_test_secret_key (TEST MODU)' : '*** (ÖZEL)'}`);
console.log(`📦 Workspace ID   : ${workspaceId}`);
console.log(`💎 Seçilen Plan   : ${plan} (${period}, ${totalAmount} TL)`);
console.log(`📊 Ödeme Durumu   : ${status.toUpperCase()}`);
console.log(`🆔 Order ID       : ${platformOrderId}`);
console.log(`✍️ Üretilen İmza  : ${expectedSignature}`);
console.log('──────────────────────────────────────────────────────');

// HTTP POST isteği fırlat
fetch(localApiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: payload.toString(),
})
  .then(async (res) => {
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    
    console.log(`\n📬 Sunucu Yanıt Kodu: ${res.status} ${res.statusText}`);
    console.log('📩 Yanıt Detayı:');
    console.log(JSON.stringify(data, null, 2));
    
    if (res.status === 200) {
      if (status === 'success') {
        console.log('\n🟢 BAŞARILI: Lisans başarıyla uzatıldı / güncellendi!');
      } else {
        console.log('\n🟡 BİLGİ: Ödeme başarısız durum simülasyonu sunucu tarafından kaydedildi (lisans süresi uzatılmadı).');
      }
    } else {
      console.log('\n🔴 HATA: İstek başarısız oldu. Sunucu loglarını kontrol edin.');
    }
    console.log('──────────────────────────────────────────────────────\n');
  })
  .catch((err) => {
    console.error('\n❌ Hata: Sunucuya bağlanılamadı. Next.js sunucunuzun (localhost:3000) açık olduğundan emin olun.', err.message);
    console.log('──────────────────────────────────────────────────────\n');
  });
