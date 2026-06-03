-- 051_shopier_unresolved_diag.sql
-- Çözülemeyen Shopier siparişlerini Platform Yönetimi'nde gösterebilmek için
-- teşhis alanları. order.created geldiğinde note→workspace ya da productId→plan
-- eşleşmezse, sipariş bu tabloya status='unresolved' + note/product_id ile yazılır
-- (idempotent, order_id PK). Süper admin paneliden görüp el ile lisans tanımlar,
-- sonra 'resolved' işaretler.

ALTER TABLE public.nmm_shopier_processed_orders
  ADD COLUMN IF NOT EXISTS note       text,
  ADD COLUMN IF NOT EXISTS product_id text;

-- status değerleri: 'applied' | 'refunded' | 'unresolved' | 'resolved'
-- (kolon zaten var; yeni değerler serbest text — kısıt eklenmiyor.)
