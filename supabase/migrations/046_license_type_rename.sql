-- 046_license_type_rename.sql
-- license_type değerlerini kanonik plan adlarına taşır:
--   leader → basic, master → plus   (pro ve free aynen kalır)
--
-- Bağlam: Uygulama planları görünür adıyla Basic/Plus/Pro. Eski iç kimlikler
-- leader/master yanlışlıkla DB'ye yerleşmişti; kod tarafı artık basic/plus/pro
-- kullanıyor (PlanId, VALID_PLANS, applyLicenseUpgrade). normalizeLicenseType()
-- legacy değerleri okurken tolere ettiği için bu migration deploy'dan önce de
-- sonra da güvenle uygulanabilir (kimse boşta kalmaz).
--
-- DİKKAT: Bu kolon düz `text`'tir (enum DEĞİL), hiçbir RLS/function bu değerlere
-- bağlı değildir. `nmm_workspace_members.role = 'leader'` (TAKIM LİDERİ) AYRI bir
-- kavramdır ve bu migration ona DOKUNMAZ.

UPDATE public.nmm_workspaces SET license_type = 'basic' WHERE license_type = 'leader';
UPDATE public.nmm_workspaces SET license_type = 'plus'  WHERE license_type = 'master';

-- Doğrulama (uygulama sonrası beklenen: yalnız free/basic/plus/pro):
--   SELECT license_type, count(*) FROM public.nmm_workspaces GROUP BY license_type;
