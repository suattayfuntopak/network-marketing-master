-- 048_shopier_processed_orders.sql
-- Shopier webhook idempotency + iade (refund) eşlemesi.
-- order.created geldiğinde sipariş id'si buraya yazılır (PK çakışırsa = zaten
-- işlenmiş → lisans ikinci kez uzatılmaz). refund webhook'unda sipariş id'sinden
-- workspace bulunup lisans düşürülür.

CREATE TABLE IF NOT EXISTS public.nmm_shopier_processed_orders (
  order_id     text PRIMARY KEY,            -- Shopier sipariş id'si (payload.id)
  workspace_id uuid,
  plan         text,                        -- basic | plus | pro
  amount       text,
  status       text NOT NULL DEFAULT 'applied', -- 'applied' | 'refunded'
  processed_at timestamptz NOT NULL DEFAULT now(),
  refunded_at  timestamptz
);

-- Yalnız service role (webhook handler) erişir; RLS açık + policy yok → anon/authenticated reddedilir.
ALTER TABLE public.nmm_shopier_processed_orders ENABLE ROW LEVEL SECURITY;
