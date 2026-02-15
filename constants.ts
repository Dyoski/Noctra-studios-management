import { Package, PricingTier } from './types';

export const PACKAGES: Package[] = [
  { id: 'pkg-standart', name: 'ŠTANDART', is_active: true, created_at: new Date().toISOString() },
  { id: 'pkg-bundle', name: 'BUNDLE', is_active: true, created_at: new Date().toISOString() },
  { id: 'pkg-mixmaster', name: 'IBA MIX A MASTER', is_active: true, created_at: new Date().toISOString() },
];

export const PRICING_TIERS: PricingTier[] = [
  // ŠTANDART - Fixná cena pre 1 track
  { id: 't0', package_id: 'pkg-standart', track_count: 1, price: 200, created_at: new Date().toISOString() },
  
  // BUNDLE Tiers
  { id: 't1', package_id: 'pkg-bundle', track_count: 2, price: 360, created_at: new Date().toISOString() },
  { id: 't2', package_id: 'pkg-bundle', track_count: 3, price: 510, created_at: new Date().toISOString() },
  { id: 't3', package_id: 'pkg-bundle', track_count: 4, price: 640, created_at: new Date().toISOString() },
  { id: 't4', package_id: 'pkg-bundle', track_count: 5, price: 750, created_at: new Date().toISOString() },
  
  // IBA MIX MASTER Tiers
  { id: 't5', package_id: 'pkg-mixmaster', track_count: 1, price: 120, created_at: new Date().toISOString() },
  { id: 't6', package_id: 'pkg-mixmaster', track_count: 2, price: 216, created_at: new Date().toISOString() },
  { id: 't7', package_id: 'pkg-mixmaster', track_count: 3, price: 306, created_at: new Date().toISOString() },
  { id: 't8', package_id: 'pkg-mixmaster', track_count: 4, price: 384, created_at: new Date().toISOString() },
  { id: 't9', package_id: 'pkg-mixmaster', track_count: 5, price: 450, created_at: new Date().toISOString() },
];