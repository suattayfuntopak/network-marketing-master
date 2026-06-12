# Ekip Üyeliği & Boru Hattı (İki Temsil Modeli)

NMM'de bir kişi **iki ayrı şekilde** temsil edilir. Bu ayrım, "neden hâlâ
görünüyor?" / "silince tamamen gitmiyor" tipi karışıklıkların kaynağıdır;
claim / unclaim / pipeline-delete akışları hep bu ikilinin etrafında döner.

## İki temsil

| Temsil | Kaynak | Besler |
|---|---|---|
| **Ekip üyeliği (downline)** | `nmm_workspaces.parent_id` = liderin workspace'i | Ekibim, Admin "Dış Kayıtlar" / kullanıcı listesi, İstatistik tabloları |
| **Pipeline adayı (CRM kartı)** | `nmm_candidates` + `nmm_team_pipeline_links` | Listem (pipeline), Hedefim/huni metrikleri |

- **Dış kayıt = bağımsız** demektir: `parent_id IS NULL`. Admin'deki "Dış Kayıtlar"
  kutusu tam olarak `parent_id` boş olan workspace'leri listeler.
- Bir app-user (kendi hesabı + kendi workspace'i olan kişi) lidere **`parent_id`
  ile** bağlanır. Bu, kişinin davet kodunu girmesiyle aynı sonuçtur.
- Pipeline adayı, bu kişiden **ayrı** bir CRM kaydıdır. `nmm_team_pipeline_links`
  (PK: `workspace_id, member_user_id`) üye ↔ aday bağını tutar.
  `candidate_id` üzerinde **`ON DELETE CASCADE`** vardır.

## Akışlar (simetrik)

### Ekibime Bağla — `claimIndependentSignupToTeamAction` (platform-yönetim, süper admin)
1. `parent_id = liderin workspace'i` → kişi downline olur (Ekibim/admin/istatistik).
2. Liderin pipeline'ında "katıldı" adayı oluşturur/eşleştirir + link upsert eder.

### Ekipten Çıkar — `nmm_unclaim_member` RPC (096) / `unclaimMemberFromTeamAction`
`claim`'in **birebir tersi**. Herhangi bir lider KENDİ downline'ı için çağırabilir
(RPC içinde `parent_id` eşleşme kontrolü = yetki). Adımlar:
1. `parent_id = NULL` → kişi tekrar bağımsız ("dış kayıt") olur.
2. Bağlı "katıldı" adayını siler (CASCADE link'i de düşürür) → huni/Hedefim güncellenir.
3. Kalan link varsa temizler (idempotent).
- UI: **yalnız kişi Listem'de DEĞİLKEN** (`pipeline_id` yok), "Listeye Ekle"nin
  sağında **"Ekipten Çıkar"** (masaüstü metinli, mobil ikon-only). Listem'de +
  ekipte olan üyede bu satır hiç görünmez. ConfirmDialog + `invalidateCandidates`
  + `invalidateTeam`.

### Pipeline kartını sil — `useDeleteCandidate`
Yalnız `nmm_candidates` satırını siler; CASCADE ile link de düşer. **`parent_id`'ye
DOKUNMAZ** → kişi ekip üyesi olarak kalır (Ekibim'de "Listeye Ekle" yeniden görünür).
Yani: *pipeline kartını silmek, kişiyi ekipten çıkarmaz.* Ekipten çıkarmak için
yukarıdaki "Ekipten Çıkar" kullanılır.

## Neden "tamamen sil" yok?
Downline bir app-user **kendi hesabının/workspace'inin/verisinin sahibidir.** Lider
onu "tüm tablolardan" silemez — bu, başka birinin hesabını yok etmek olur. Lider
yalnızca **kendi ilişkisini** (parent_id) koparabilir; kişi bağımsız olarak yaşamaya
devam eder. Hesap silme ayrı bir konudur (kişinin kendisi / KVKK).

## Mahremiyet değişmezleri (privacy invariants)
Her ekip yalnız **kendi** boru hattını/takibini görür; alt ekiplerin adaylarını GÖRMEZ:
- **Saha Radarım takipleri:** yalnız `owner_id = caller` (`p_owner_ids = [user.id]`).
  Ekip üyelerinin kendi takipleri liderin radarında görünmez.
- **Takvim:** yalnız liderin kendi adaylarının takip yoğunluğu (Ekip Takvimi kaldırıldı).
- İstisna: **Aktivite** (üyelerin aktif/sessiz seviyesi) ve **Eğitim İlerlemesi**
  koçluk amaçlı görünür — bunlar aday-mahremiyeti değil, ekip-yönetimi sinyalidir.

## Legacy / dikkat
- `nmm_remove_member` RPC (007) + eski paylaşımlı-workspace üye modeli **artık
  kullanılmıyor** (EkipPanel'deki tetikleyici ölüydü, kaldırıldı). Downline app-user'lar
  için doğru yol `nmm_unclaim_member`'dır. RPC DB'de duruyor ama UI'dan çağrılmıyor.
