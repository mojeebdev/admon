'use client';

import { useState, type CSSProperties, type PointerEvent } from 'react';

export type VehicleDetail = { label: string; value: string };

type InteractiveVehicleProps = {
  src: string;
  alt: string;
  details: VehicleDetail[];
  className?: string;
};

export function InteractiveVehicle({ src, alt, details, className = '' }: InteractiveVehicleProps) {
  const [active, setActive] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 6;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -4;
    setTilt({ x, y });
    setActive(true);
  }

  function reset() {
    setTilt({ x: 0, y: 0 });
    setActive(false);
  }

  return (
    <div
      className={`interactive-vehicle ${active ? 'is-active' : ''} ${className}`}
      style={{ '--vehicle-tilt-x': `${tilt.x}deg`, '--vehicle-tilt-y': `${tilt.y}deg` } as CSSProperties}
      tabIndex={0}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onFocus={() => setActive(true)}
      onBlur={reset}
      onClick={() => setActive((value) => !value)}
      aria-label="Inspect generated Admon Trace vehicle details"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <span className="interactive-vehicle__scan" aria-hidden="true" />
      <span className="interactive-vehicle__prompt" aria-hidden="true">Move to inspect</span>
      <div className="interactive-vehicle__details" aria-hidden={!active}>
        {details.map((detail) => (
          <span key={detail.label}><small>{detail.label}</small><strong>{detail.value}</strong></span>
        ))}
      </div>
    </div>
  );
}
