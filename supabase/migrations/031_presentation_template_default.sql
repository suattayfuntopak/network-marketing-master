-- 031: Refresh factory-default WhatsApp presentation templates ([Firma İsmi] copy)
-- Only rows that still match the previous factory defaults are updated; custom edits are untouched.

UPDATE public.nmm_presentation_materials
SET
  whatsapp_template = E'Merhaba {name},\n\n[Firma İsmi]''in global vizyonunu, ürün ekosistemini ve sunduğu harika iş fırsatını detaylıca inceleyebileceğiniz bağlantıyı aşağıda sizinle paylaşıyorum:\n\n{url}\n\nMerak ettiğiniz noktalar veya üzerine konuşmak istediğiniz detaylar olursa, bana dilediğiniz zaman ulaşabilirsiniz.\n\nGörüşmek dileğiyle.',
  updated_at = now()
WHERE whatsapp_template = E'Merhaba {name} Bey / Hanım,\n\nGreenleaf''in global vizyonunu, ürün ekosistemini ve sunduğu harika iş fırsatını detaylıca inceleyebileceğiniz bağlantıyı aşağıda sizinle paylaşıyorum:\n\n{url}\n\nMerak ettiğiniz noktalar veya üzerine konuşmak istediğiniz detaylar olursa, bana dilediğiniz zaman ulaşabilirsiniz.\n\nGörüşmek dileğiyle.';

UPDATE public.nmm_presentation_materials
SET
  whatsapp_template = E'Hi {name},\n\nBelow you can explore [Company Name]''s global vision, product ecosystem and the great business opportunity it offers:\n\n{url}\n\nIf you have questions or details you''d like to discuss, feel free to reach me anytime.\n\nBest regards.',
  updated_at = now()
WHERE whatsapp_template = E'Hi {name}, you can view my presentation here:\n\n{url}\n\nQuestions? Reach out to {sender}.';
