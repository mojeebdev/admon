import {
  type AeroKit,
  type CarTraits,
  type ChassisShape,
  type Finish,
  type Headlights,
  type WheelStyle,
  PAINT_HEX,
  RARITY_LABELS,
} from './traits';

type ChassisProfile = {
  body: string;
  glass: string;
  roofline: string;
  archRear: string;
  archFront: string;
  frontX: number;
};

// Every silhouette is drawn in the same front-three-quarter camera position.
const CHASSIS: Record<ChassisShape, ChassisProfile> = {
  coupe: {
    body: 'M116 365 C132 333 168 308 231 296 L302 238 C340 207 484 199 576 228 L677 271 L789 292 C828 299 851 318 857 350 L849 382 L786 394 L720 384 L646 387 L594 382 L415 381 L357 387 L295 384 L233 390 L160 381 L115 371 Z',
    glass: 'M260 294 L320 244 C354 218 469 214 546 238 L625 273 L430 280 Z',
    roofline: 'M264 292 L321 243 C356 213 469 210 550 237 L627 272',
    archRear: 'M198 382 A84 84 0 0 1 367 382',
    archFront: 'M614 383 A83 83 0 0 1 781 383',
    frontX: 836,
  },
  muscle: {
    body: 'M104 369 C125 333 173 311 244 301 L293 258 C341 221 474 214 567 238 L670 280 L804 297 C841 305 864 326 870 353 L858 390 L784 398 L720 385 L643 390 L590 384 L413 385 L356 394 L292 389 L222 397 L154 385 L104 376 Z',
    glass: 'M259 300 L309 260 C349 231 463 226 542 246 L625 279 L425 285 Z',
    roofline: 'M262 299 L310 259 C349 227 464 222 546 245 L628 278',
    archRear: 'M191 388 A88 88 0 0 1 369 388',
    archFront: 'M609 389 A86 86 0 0 1 783 389',
    frontX: 850,
  },
  hatchback: {
    body: 'M124 366 C144 329 176 303 229 290 L288 227 C333 201 482 201 571 231 L665 274 L782 290 C825 296 850 319 856 351 L848 382 L780 392 L712 383 L637 386 L583 380 L416 379 L355 385 L288 382 L227 390 L160 381 L122 373 Z',
    glass: 'M248 291 L303 233 C337 208 456 208 540 235 L620 272 L424 278 Z',
    roofline: 'M250 290 L304 232 C338 204 458 204 543 234 L622 271',
    archRear: 'M195 382 A83 83 0 0 1 363 382',
    archFront: 'M603 382 A81 81 0 0 1 769 382',
    frontX: 834,
  },
  armored: {
    body: 'M102 371 L122 327 L198 298 L266 240 L560 231 L660 273 L800 291 L847 317 L871 353 L858 396 L790 402 L716 389 L639 394 L584 387 L412 388 L349 398 L281 391 L219 400 L149 387 L104 380 Z',
    glass: 'M260 297 L292 251 L540 242 L619 275 L424 281 Z',
    roofline: 'M262 295 L293 250 L543 241 L621 274',
    archRear: 'M185 391 A89 89 0 0 1 366 391',
    archFront: 'M603 392 A87 87 0 0 1 779 392',
    frontX: 850,
  },
  sedan: {
    body: 'M113 365 C132 332 175 309 240 296 L308 242 C348 212 483 211 565 236 L669 275 L795 292 C831 298 856 319 863 350 L853 384 L786 394 L719 383 L643 388 L590 381 L415 381 L354 389 L293 385 L228 393 L158 381 L112 372 Z',
    glass: 'M264 295 L326 247 C359 222 468 221 543 242 L625 274 L429 281 Z',
    roofline: 'M266 294 L328 246 C361 218 470 217 546 241 L628 273',
    archRear: 'M194 382 A85 85 0 0 1 366 382',
    archFront: 'M611 383 A84 84 0 0 1 781 383',
    frontX: 847,
  },
  roadster: {
    body: 'M127 365 C148 327 188 306 252 296 L312 266 C354 245 471 245 552 263 L662 278 L790 294 C826 300 849 319 856 348 L847 380 L783 391 L713 382 L636 386 L583 379 L418 378 L355 384 L292 381 L225 390 L163 379 L125 372 Z',
    glass: 'M293 296 L327 267 C363 246 450 248 516 263 L585 280 L426 282 Z',
    roofline: 'M295 295 L329 266 C364 242 452 244 518 262 L587 279',
    archRear: 'M195 381 A84 84 0 0 1 365 381',
    archFront: 'M605 382 A81 81 0 0 1 771 382',
    frontX: 834,
  },
  classic: {
    body: 'M110 369 C135 330 176 305 244 294 L309 237 C355 205 478 205 562 233 L670 275 L793 293 C832 300 857 322 863 353 L851 389 L786 398 L719 385 L642 391 L589 384 L414 385 L352 392 L289 388 L225 397 L155 385 L109 376 Z',
    glass: 'M266 294 L326 241 C363 215 463 215 541 239 L624 274 L427 280 Z',
    roofline: 'M268 293 L328 240 C365 211 465 211 544 238 L627 273',
    archRear: 'M191 388 A87 87 0 0 1 367 388',
    archFront: 'M610 389 A85 85 0 0 1 782 389',
    frontX: 846,
  },
};

// Trace Meridian is Admon's shared vehicle language. Traits still control
// paint, finish, wheels, lighting, and aero, while the recognisable silhouette
// stays consistent across every proof of build.
const MERIDIAN: ChassisProfile = {
  body: 'M104 374 L157 331 L326 308 L425 244 L613 244 L700 278 L792 287 L860 324 L879 359 L862 388 L116 396 Z',
  glass: 'M326 308 L426 244 L613 244 L700 278 L510 286 Z',
  roofline: 'M327 307 L426 243 L613 243 L700 277',
  archRear: 'M196 390 A85 85 0 0 1 367 390',
  archFront: 'M612 390 A85 85 0 0 1 783 390',
  frontX: 868,
};

function identifier(username: string) {
  return 'admon-' + username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
}

function wheel(cx: number, cy: number, style: WheelStyle, id: string) {
  const tread = Array.from({ length: 18 }, (_, index) => {
    const angle = index * 20;
    return '<path d="M ' + (cx - 42) + ' ' + cy + ' l 11 -8" stroke="#52515d" stroke-width="3" opacity=".72" transform="rotate(' + angle + ' ' + cx + ' ' + cy + ')"/>';
  }).join('');

  const spokeCount = style === 'stock' ? 5 : style === 'spoke' ? 8 : style === 'mag' ? 6 : 10;
  const spokes = Array.from({ length: spokeCount }, (_, index) => {
    const angle = (index * 360) / spokeCount;
    const length = style === 'stock' ? 23 : style === 'spoke' ? 31 : style === 'mag' ? 29 : 33;
    const width = style === 'mag' ? 7 : style === 'chrome' ? 3 : 4;
    return '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + length) + '" y2="' + cy + '" stroke="url(#' + id + '-metal)" stroke-width="' + width + '" stroke-linecap="round" transform="rotate(' + angle + ' ' + cx + ' ' + cy + ')"/>';
  }).join('');

  return '<g><ellipse cx="' + cx + '" cy="' + cy + '" rx="53" ry="58" fill="url(#' + id + '-tire)" stroke="#0b0b10" stroke-width="7"/>' +
    '<g opacity=".75">' + tread + '</g>' +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="37" ry="41" fill="#1b1a23" stroke="#888494" stroke-width="2"/>' +
    spokes +
    '<ellipse cx="' + cx + '" cy="' + cy + '" rx="10" ry="11" fill="url(#' + id + '-metal)" stroke="#09090d" stroke-width="3"/>' +
    '<circle cx="' + (cx - 3) + '" cy="' + (cy - 3) + '" r="2.5" fill="#f0f0f8" opacity=".75"/></g>';
}

function aero(aeroKit: AeroKit, color: string) {
  if (aeroKit === 'none') return '';
  const lip = '<path d="M151 375 C270 397 512 403 797 390 L784 401 C551 418 288 416 151 388 Z" fill="' + color + '" opacity=".78"/>';
  if (aeroKit === 'lip') return lip;
  if (aeroKit === 'wing') {
    return lip + '<path d="M180 292 L173 260 L236 246 L244 254 L237 267 L193 275 L194 294 Z" fill="' + color + '"/><path d="M165 255 L249 238 L257 249 L174 268 Z" fill="' + color + '" stroke="#f0f0f8" stroke-opacity=".28"/>';
  }
  return lip +
    '<path d="M177 296 L166 248 L251 228 L265 240 L254 258 L194 274 L194 301 Z" fill="' + color + '"/>' +
    '<path d="M152 241 L257 217 L271 233 L163 260 Z" fill="' + color + '" stroke="#f0f0f8" stroke-opacity=".4"/>' +
    '<path d="M754 360 L818 350 L831 369 L780 383 Z" fill="' + color + '" opacity=".75"/>';
}

function headlights(kind: Headlights, x: number) {
  if (kind === 'dim') {
    return '<path d="M' + (x - 31) + ' 319 L' + (x - 4) + ' 327 L' + (x - 12) + ' 338 L' + (x - 35) + ' 331 Z" fill="#fff0bc" opacity=".68"/>';
  }
  if (kind === 'bright') {
    return '<g filter="url(#light-glow)"><path d="M' + (x - 36) + ' 316 L' + (x - 3) + ' 326 L' + (x - 13) + ' 340 L' + (x - 39) + ' 332 Z" fill="#fff8d2"/><path d="M' + (x - 33) + ' 323 L' + (x - 12) + ' 329" stroke="#ffffff" stroke-width="3"/></g>';
  }
  return '<g filter="url(#light-glow)"><path d="M' + (x - 42) + ' 314 L' + (x - 2) + ' 326 L' + (x - 15) + ' 342 L' + (x - 46) + ' 332 Z" fill="#dcd8ff"/><path d="M' + (x - 40) + ' 326 L' + (x - 2) + ' 332" stroke="#ffffff" stroke-width="4"/><path d="M' + (x - 18) + ' 331 L' + (x + 34) + ' 338" stroke="#6c63ff" stroke-width="2" opacity=".75"/></g>';
}

function finishDetails(finish: Finish, id: string) {
  if (finish === 'matte') return '<path d="M170 345 C345 370 618 361 822 342" stroke="#07070b" stroke-width="9" opacity=".18"/>';
  if (finish === 'gloss') return '<path d="M212 310 C392 277 563 286 758 321" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".2"/>';
  if (finish === 'chrome') return '<path d="M137 360 C336 386 623 377 848 352" stroke="url(#' + id + '-metal)" stroke-width="5" fill="none" opacity=".85"/><path d="M253 301 L600 290" stroke="#ffffff" stroke-width="3" opacity=".45"/>';
  return '<g opacity=".45"><circle cx="306" cy="341" r="5" fill="#bd8d54"/><circle cx="330" cy="350" r="3" fill="#7c9c70"/><circle cx="583" cy="355" r="5" fill="#bd8d54"/><path d="M620 343 l15 4" stroke="#7c9c70" stroke-width="4"/></g>';
}

export interface RenderOptions {
  username: string;
  width?: number;
  height?: number;
  showPlate?: boolean;
  showRarityBadge?: boolean;
  background?: 'transparent' | 'void';
}

export function renderCarSVG(traits: CarTraits, options: RenderOptions): string {
  const width = options.width || 960;
  const height = options.height || 540;
  const profile = MERIDIAN;
  const paint = PAINT_HEX[traits.paint];
  const rarity = RARITY_LABELS[traits.rarity];
  const id = identifier(options.username);
  const glow = traits.rarity === 'legendary' || traits.rarity === 'mythic'
    ? '<ellipse cx="492" cy="334" rx="385" ry="170" fill="' + rarity.color + '" opacity=".10" filter="url(#' + id + '-blur)"/>'
    : '';
  const plate = options.showPlate === false ? '' :
    '<g transform="translate(455 365) skewX(-12)"><rect width="92" height="23" rx="3" fill="#f0f0f8" stroke="#15141e" stroke-width="2"/><text x="46" y="16" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#0c0c12">' + options.username.slice(0, 10).toUpperCase() + '</text></g>';
  const badge = options.showRarityBadge === false ? '' :
    '<g transform="translate(730 82)"><rect width="135" height="30" rx="15" fill="' + rarity.color + '" fill-opacity=".14" stroke="' + rarity.color + '" stroke-width="1"/><text x="67" y="20" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" letter-spacing="1.4" fill="' + rarity.color + '">' + rarity.label.toUpperCase() + '</text></g>';
  const background = options.background === 'void' ? '<rect width="960" height="540" fill="#173848"/>' : '';

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 960 540" role="img" aria-label="Admon verification car for ' + options.username + '">' +
    '<defs>' +
    '<linearGradient id="' + id + '-paint" x1="0" y1="0" x2=".82" y2="1"><stop offset="0" stop-color="' + paint.accent + '"/><stop offset=".20" stop-color="' + paint.primary + '"/><stop offset=".72" stop-color="' + paint.secondary + '"/><stop offset="1" stop-color="#0b0b12"/></linearGradient>' +
    '<linearGradient id="' + id + '-glass" x1="0" y1="0" x2=".72" y2="1"><stop stop-color="#e9edff" stop-opacity=".58"/><stop offset=".26" stop-color="#7d88aa" stop-opacity=".36"/><stop offset=".58" stop-color="#11131d" stop-opacity=".85"/><stop offset="1" stop-color="#06070c"/></linearGradient>' +
    '<linearGradient id="' + id + '-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fcfcff"/><stop offset=".22" stop-color="#7f7b8f"/><stop offset=".53" stop-color="#ecebf7"/><stop offset="1" stop-color="#363442"/></linearGradient>' +
    '<radialGradient id="' + id + '-tire"><stop offset=".55" stop-color="#1d1d27"/><stop offset=".82" stop-color="#0b0b10"/><stop offset="1" stop-color="#34323e"/></radialGradient>' +
    '<filter id="' + id + '-blur"><feGaussianBlur stdDeviation="30"/></filter><filter id="light-glow"><feGaussianBlur stdDeviation="4"/></filter>' +
    '</defs>' +
    background +
    '<path d="M80 457 H880 M130 420 H840 M210 383 H790" stroke="#b6cdc8" stroke-width="1" opacity=".28"/>' +
    glow +
    '<ellipse cx="488" cy="427" rx="354" ry="35" fill="#000000" opacity=".58" filter="url(#' + id + '-blur)"/>' +
    wheel(281, 384, traits.wheels, id) +
    wheel(696, 385, traits.wheels, id) +
    '<path d="' + profile.body + '" fill="url(#' + id + '-paint)" stroke="#c8c4e6" stroke-opacity=".38" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="' + profile.body + '" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="1.5"/>' +
    '<path d="' + profile.glass + '" fill="url(#' + id + '-glass)" stroke="#dbe1ff" stroke-opacity=".48" stroke-width="2"/>' +
    '<path d="' + profile.roofline + '" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".42"/>' +
    '<path d="M412 255 L398 316 M492 246 L487 301 M572 246 L579 293 M640 257 L665 285" fill="none" stroke="#11242d" stroke-width="4" opacity=".62"/>' +
    '<path d="M385 310 L423 283 L471 283 L471 268 L521 268 L521 254 L580 254 L580 244" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".55"/>' +
    '<path d="' + profile.archRear + '" fill="none" stroke="#16151f" stroke-width="11"/><path d="' + profile.archFront + '" fill="none" stroke="#16151f" stroke-width="11"/>' +
    '<path d="' + profile.archRear + '" fill="none" stroke="#f4f2ff" stroke-opacity=".18" stroke-width="2"/><path d="' + profile.archFront + '" fill="none" stroke="#f4f2ff" stroke-opacity=".18" stroke-width="2"/>' +
    '<path d="M126 369 C350 390 625 388 865 350" fill="none" stroke="' + paint.accent + '" stroke-width="6" opacity=".84"/>' +
    '<g transform="translate(548 337)"><circle r="19" fill="#f8f7f1" stroke="#102e3a" stroke-width="3"/><path d="M-8 4 C-8-8 8-11 10-1 L10 8 M-8 1 H8" fill="none" stroke="#102e3a" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="8" r="2.5" fill="#f26445"/></g>' +
    finishDetails(traits.finish, id) +
    aero(traits.aero, paint.accent) +
    headlights(traits.headlights, profile.frontX) +
    '<rect x="832" y="338" width="34" height="17" rx="2" fill="#f2f1e9"/><path d="M837 347 H862" stroke="' + paint.accent + '" stroke-width="3"/>' +
    plate + badge +
    '<text x="112" y="482" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="#b6cdc8">TRACE / MERIDIAN // ' + traits.chassis.toUpperCase() + ' // ' + traits.paint.toUpperCase() + '</text>' +
    '</svg>';
}
