import { Resvg } from '@resvg/resvg-js';
import path from 'path';
import { renderCarSVG } from './carRenderer';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from './traits';

// Resolve font file paths once per serverless instance
const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');
const FONT_FILES = [
  path.join(FONTS_DIR, 'AzeretMono-Regular.ttf'),
  path.join(FONTS_DIR, 'AzeretMono-Bold.ttf'),
  path.join(FONTS_DIR, 'BarlowCondensed-Bold.ttf'),
];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

export async function generateCarPng(car: {
  githubUsername: string;
  traits: unknown;
  statsSnapshot: unknown;
}): Promise<Buffer> {
  const traits = car.traits as CarTraits;
  const stats = car.statsSnapshot as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const carSvg = renderCarSVG(traits, {
    username: car.githubUsername,
    width: 900,
    height: 420,
  });

  const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#050508"/>
    <rect x="0" y="0" width="1200" height="6" fill="${rarity.color}" opacity="0.6"/>

    <g transform="translate(60, 60)">
      <rect x="0" y="0" width="32" height="32" rx="10" fill="#6C63FF"/>
      <text x="48" y="26" font-family="Georgia" font-size="25" font-weight="700" fill="#F0F0F8">Admon.</text>
    </g>

    <g transform="translate(960, 60)">
      <rect x="0" y="0" width="180" height="40" rx="20" fill="${rarity.color}" fill-opacity="0.18" stroke="${rarity.color}" stroke-width="1.5"/>
      <text x="90" y="27" text-anchor="middle" font-family="Barlow Condensed" font-size="16" font-weight="700" letter-spacing="3" fill="${rarity.color}">${rarity.label.toUpperCase()}</text>
    </g>

    <g transform="translate(150, 130)">
      ${carSvg.replace(/<\?xml[^?]*\?>/, '').replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>')}
    </g>

    <text x="60" y="560" font-family="Georgia" font-size="42" font-weight="700" fill="#F0F0F8">@${escapeXml(car.githubUsername)}</text>
    <text x="60" y="590" font-family="Azeret Mono" font-size="18" font-weight="400" fill="#8A8A9A">${stats.commits365d.toLocaleString()} commits · ${stats.publicRepos} repos · ${escapeXml(stats.topLanguage)}</text>
    <text x="1140" y="590" text-anchor="end" font-family="monospace" font-size="16" font-weight="400" fill="#4A4A5A">admon.peerfix.dev · Monad Mainnet</text>
  </svg>`;

  const resvg = new Resvg(shareSvg, {
    font: {
      fontFiles: FONT_FILES,
      defaultFontFamily: 'Georgia',
      loadSystemFonts: false,
    },
    fitTo: { mode: 'width', value: 1200 },
    background: '#050508',
  });

  return Buffer.from(resvg.render().asPng());
}
