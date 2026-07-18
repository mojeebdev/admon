// Admon trait system
// Maps raw GitHub data into 7 visual traits + rarity.

import { keccak256, stringToBytes } from 'viem';

export type ChassisShape =
  | 'coupe'      // TypeScript, JavaScript
  | 'muscle'     // Rust, C++, C
  | 'hatchback'  // Python, Ruby
  | 'armored'    // Solidity, Move
  | 'sedan'      // Go, Java, Kotlin
  | 'roadster'   // Swift, Dart
  | 'classic';   // fallback / misc

export type PaintColor =
  | 'midnight'   // night owl: 0-6h peak
  | 'dawn'       // early bird: 6-12h peak
  | 'sunset'     // afternoon: 12-18h peak
  | 'neon';      // evening: 18-24h peak

export type WheelStyle =
  | 'stock'      // 0-5 repos
  | 'spoke'      // 6-15 repos
  | 'mag'        // 16-40 repos
  | 'chrome';    // 40+ repos

export type AeroKit =
  | 'none'       // streak under 7
  | 'lip'        // streak 7-30
  | 'wing'       // streak 30-90
  | 'full';      // streak 90+

export type Headlights =
  | 'dim'        // 0-10 total stars
  | 'bright'     // 11-100 total stars
  | 'laser';     // 100+ total stars

export type Finish =
  | 'matte'      // account under 1yr
  | 'gloss'      // 1-3yr
  | 'chrome'     // 3-7yr
  | 'patina';    // 7yr+

export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CarTraits {
  chassis: ChassisShape;
  paint: PaintColor;
  wheels: WheelStyle;
  aero: AeroKit;
  headlights: Headlights;
  finish: Finish;
  rarity: RarityTier;
}

export interface StatsSnapshot {
  totalCommits: number;
  commits365d: number;
  publicRepos: number;
  longestStreak: number;
  totalStars: number;
  accountAgeYears: number;
  topLanguage: string;
  peakCommitHour: number; // 0-23
}

export const RARITY_THRESHOLDS: Array<[RarityTier, number]> = [
  ['mythic', 3300],
  ['legendary', 2200],
  ['epic', 1200],
  ['rare', 500],
  ['common', 0],
];

export const RARITY_LABELS: Record<RarityTier, { label: string; color: string; glow: string }> = {
  common:    { label: 'Common',    color: '#8A8A9A', glow: 'rgba(138,138,154,0.3)' },
  rare:      { label: 'Rare',      color: '#4A9EFF', glow: 'rgba(74,158,255,0.5)' },
  epic:      { label: 'Epic',      color: '#B266FF', glow: 'rgba(178,102,255,0.6)' },
  legendary: { label: 'Legendary', color: '#F5A623', glow: 'rgba(245,166,35,0.7)' },
  mythic:    { label: 'Mythic',    color: '#E63B2E', glow: 'rgba(230,59,46,0.8)' },
};

export function deriveRarity(stats: StatsSnapshot): RarityTier {
  const score = computeRarityScore(stats);
  for (const [tier, threshold] of RARITY_THRESHOLDS) {
    if (score >= threshold) return tier;
  }
  return 'common';
}

export function deriveChassis(topLang: string): ChassisShape {
  const lang = topLang.toLowerCase();
  if (['typescript', 'javascript', 'tsx', 'jsx'].includes(lang)) return 'coupe';
  if (['rust', 'c', 'c++', 'zig'].includes(lang)) return 'muscle';
  if (['python', 'ruby', 'r'].includes(lang)) return 'hatchback';
  if (['solidity', 'move', 'vyper', 'cairo'].includes(lang)) return 'armored';
  if (['go', 'java', 'kotlin', 'scala'].includes(lang)) return 'sedan';
  if (['swift', 'dart', 'lua'].includes(lang)) return 'roadster';
  return 'classic';
}

export function derivePaint(peakHour: number): PaintColor {
  if (peakHour < 6) return 'midnight';
  if (peakHour < 12) return 'dawn';
  if (peakHour < 18) return 'sunset';
  return 'neon';
}

export function deriveWheels(repos: number): WheelStyle {
  if (repos <= 5) return 'stock';
  if (repos <= 15) return 'spoke';
  if (repos <= 40) return 'mag';
  return 'chrome';
}

export function deriveAero(streak: number): AeroKit {
  if (streak < 7) return 'none';
  if (streak < 30) return 'lip';
  if (streak < 90) return 'wing';
  return 'full';
}

export function deriveHeadlights(stars: number): Headlights {
  if (stars <= 10) return 'dim';
  if (stars <= 100) return 'bright';
  return 'laser';
}

export function deriveFinish(years: number): Finish {
  if (years < 1) return 'matte';
  if (years < 3) return 'gloss';
  if (years < 7) return 'chrome';
  return 'patina';
}

export function computeTraits(stats: StatsSnapshot): CarTraits {
  return {
    chassis: deriveChassis(stats.topLanguage),
    paint: derivePaint(stats.peakCommitHour),
    wheels: deriveWheels(stats.publicRepos),
    aero: deriveAero(stats.longestStreak),
    headlights: deriveHeadlights(stats.totalStars),
    finish: deriveFinish(stats.accountAgeYears),
    rarity: deriveRarity(stats),
  };
}

// Build Score is used for garage ranking. It values all-time output most,
// while keeping recent activity, consistency, breadth, and impact meaningful.
export function computeRarityScore(stats: StatsSnapshot): number {
  return Math.round(
    Math.min(stats.totalCommits, 10000) * 0.2 +
    Math.min(stats.commits365d, 2500) * 0.35 +
    Math.min(stats.longestStreak, 180) * 6 +
    Math.min(stats.publicRepos, 80) * 7 +
    Math.min(stats.totalStars, 500) * 0.2 +
    Math.min(stats.accountAgeYears, 12) * 6
  );
}

export function serializeTraits(traits: CarTraits) {
  return JSON.stringify({
    chassis: traits.chassis,
    paint: traits.paint,
    wheels: traits.wheels,
    aero: traits.aero,
    headlights: traits.headlights,
    finish: traits.finish,
    rarity: traits.rarity,
  });
}

export function hashTraits(traits: CarTraits) {
  return keccak256(stringToBytes(serializeTraits(traits)));
}

// Paint color hex values used by the SVG renderer
export const PAINT_HEX: Record<PaintColor, { primary: string; secondary: string; accent: string }> = {
  midnight: { primary: '#1a1a2e', secondary: '#0f0f1c', accent: '#6C63FF' },
  dawn:     { primary: '#F5A623', secondary: '#E8712A', accent: '#FFE4A1' },
  sunset:   { primary: '#E63B2E', secondary: '#B2291E', accent: '#FF8C6B' },
  neon:     { primary: '#00FF9D', secondary: '#00B36F', accent: '#7AFFD4' },
};
