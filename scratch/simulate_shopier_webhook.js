/**
 * Shopier Webhook Yerel Simülasyon Script'i
 * 
 * Bu script, yerel geliştirme sunucunuz (http://localhost:3000) çalışırken, 
 * gerçek ödeme yapmadan ve imza doğrulamasını (HMAC-SHA256) kırmadan 
 * lisans satın alma/süre uzatma senaryolarını test etmenizi sağlar.
 * 
 * Çalıştırma Talimatı:
 * 1. Yerel sunucunuzu başlatın: npm run dev
 * 2. Yeni bir terminal açın ve bu script'i çalıştırın:
 *    node scratch/simulate_shopier_webhook.js <WORKSPACE_ID> [leader|master] [success|fail]
 * 
 * Örnekler:
 * - node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab master
 * - node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab leader
 */

const crypto = require('crypto');

// Argüman kontrolü
const args = process.argv.slice(2);
const workspaceId = args[0];
const plan = args[1] || 'master'; // varsayılan: master
const status = args[2] || 'success'; // varsayılan: success

if (!workspaceId) {
  console.log('\n❌ Hata: Lütfen test etmek istediğiniz Workspace ID\'yi belirtin.');
  console.log('\nKullanım Şablonu:');
  console.log('  node scratch/simulate_shopier_webhook.js <workspace_id> [leader|master] [success|failed]');
  console.log('\nÖrnekler:');
  console.log('  node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab master');
  console.log('  node scratch/simulate_shopier_webhook.js 12345678-abcd-efgh-ijkl-1234567890ab leader failed\n');
  process.exit(1);
}

// Plan fiyatı belirleme
const totalAmount = plan === 'master' ? '899.00' : '299.00';
const platformOrderId = `${workspaceId}_${Date.now()}`;
const randomNumber = Math.floor(100000 + Math.random() * 900000).toString();

// .env.local içerisindeki SHOPIER_API_SECRET'ı okumaya çalış, yoksa test değerini kullan
const apiSecret = process.env.SHOPIER_API_SECRET || 'shopier_test_secret_key';
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
console.log(`💎 Seçilen Plan   : ${plan === 'master' ? 'Ekip Master\'ı (899 TL)' : 'Saha Distribütörü (299 TL)'}`);
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
