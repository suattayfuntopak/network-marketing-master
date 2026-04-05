export type { Database, Profile, ProfileInsert, ProfileUpdate } from './database'

export interface NavItem {
  title: string
  href: string
  icon?: string
  roles?: string[]
}

export type Theme = 'light' | 'dark'
