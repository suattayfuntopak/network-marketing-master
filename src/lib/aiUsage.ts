// Günlük AI mesaj limitleri — tek kaynak, tüm server action'lar ve UI bu fonksiyonu kullanır.

export interface AILimits {
  messageLimit: number
  roleplayLimit: number
  complianceLimit: number
}

export function getLimitsForLicense(licenseType: string | null | undefined): AILimits {
  switch (licenseType) {
    case 'pro':
      return { messageLimit: 100, roleplayLimit: 60, complianceLimit: 15 }
    case 'master': // Plus Plan
      return { messageLimit: 40, roleplayLimit: 25, complianceLimit: 5 }
    case 'leader': // Basic Plan
      return { messageLimit: 15, roleplayLimit: 10, complianceLimit: 2 }
    case 'free':
    default:
      // Free plan — gerçek kısıt, paid plan değerini hissettirmek için
      return { messageLimit: 5, roleplayLimit: 3, complianceLimit: 0 }
  }
}
