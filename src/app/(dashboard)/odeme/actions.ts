'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export interface ShopierFormData {
  API_key: string
  website_index: string
  platform_order_id: string
  product_name: string
  total_order_value: string
  currency: string
  buyer_name: string
  buyer_surname: string
  buyer_email: string
  buyer_phone: string
  random_nr: string
  signature: string
}

export async function initiateShopierPayment(
  plan: 'leader' | 'master' | 'pro',
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<ShopierFormData> {
  const supabase = await createClient()

  // 1. Get active authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
  }

  // 2. Fetch the user's workspace membership
  const { data: membership, error: memError } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memError || !membership) {
    throw new Error('Çalışma alanı (Workspace) bulunamadı. Lütfen bir ekibe katılın veya yeni bir tane oluşturun.')
  }

  // 3. Define pricing and product details based on selected plan and period
  let amount = '399'
  let productName = 'Network Marketing Master - Basic Plan'

  if (period === 'yearly') {
    if (plan === 'pro') {
      amount = '19999'
      productName = 'Network Marketing Master - Yıllık Pro Lider Planı'
    } else if (plan === 'master') {
      amount = '9999'
      productName = 'Network Marketing Master - Yıllık Plus Lider Planı'
    } else {
      amount = '3499'
      productName = 'Network Marketing Master - Yıllık Basic Planı'
    }
  } else {
    // monthly
    if (plan === 'pro') {
      amount = '2499'
      productName = 'Network Marketing Master - Pro Lider Planı'
    } else if (plan === 'master') {
      amount = '1199'
      productName = 'Network Marketing Master - Plus Lider Planı'
    } else {
      amount = '399'
      productName = 'Network Marketing Master - Basic Plan'
    }
  }

  const workspaceId = membership.workspace_id
  const platformOrderId = `${workspaceId}_${Date.now()}`
  
  // 4. Generate random 6-digit number
  const randomNr = Math.floor(100000 + Math.random() * 900000).toString()

  // 5. Read API keys from environment
  const apiKey = process.env.SHOPIER_API_KEY || 'shopier_test_api_key'
  const apiSecret = process.env.SHOPIER_API_SECRET || 'shopier_test_secret_key'

  // 6. Calculate payment initiation signature: random_nr + platform_order_id + total_order_value + currency
  const currency = 'TRY'
  const signatureData = randomNr + platformOrderId + amount + currency
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureData)
    .digest('base64')

  // 7. Parse buyer name and surname
  const fullName = membership.full_name || user.user_metadata?.full_name || 'Değerli Lider'
  const nameParts = fullName.trim().split(/\s+/)
  const buyerName = nameParts[0] || 'Değerli'
  const buyerSurname = nameParts.slice(1).join(' ') || 'Lider'

  // 8. Buyer email and fallback phone number (Shopier requires phone, use standard or fallback)
  const buyerEmail = user.email || 'nmm_buyer@example.com'
  const buyerPhone = user.phone || '5555555555'

  return {
    API_key: apiKey,
    website_index: '1',
    platform_order_id: platformOrderId,
    product_name: productName,
    total_order_value: amount,
    currency,
    buyer_name: buyerName,
    buyer_surname: buyerSurname,
    buyer_email: buyerEmail,
    buyer_phone: buyerPhone,
    random_nr: randomNr,
    signature,
  }
}
