'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Request = {
  id: string;
  sender: { githubUsername: string; name: string | null; avatarUrl: string | null };
};

type InboxPayload = { ownerUsername?: string; requests?: Request[] };

export function ConnectionInbox({ profileUsername }: { profileUsername: string }) {
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/connections?inbox=1')
      .then((response) => response.ok ? response.json() : null)
      .then((payload: InboxPayload | null) => {
        if (!active) return;
        setOwnerUsername(payload?.ownerUsername || null);
        setRequests(payload?.requests || []);
      })
      .catch(() => { if (active) setError('Could not load connection requests.'); });
    return () => { active = false; };
  }, []);

  async function respond(requestId: string, action: 'accept' | 'decline') {
    setError(null);
    try {
      const response = await fetch('/api/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not update the request.');
      setRequests((current) => current?.filter((request) => request.id !== requestId) || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update the request.');
    }
  }

  if (ownerUsername?.toLowerCase() !== profileUsername.toLowerCase()) return null;
  if (!requests?.length && !error) return null;
  return (
    <section className="connection-inbox" aria-label="Connection requests">
      <span className="verify-panel__eyebrow">Your connection requests</span>
      {requests?.map((request) => (
        <div className="connection-inbox__request" key={request.id}>
          <Link href={`/builder/${encodeURIComponent(request.sender.githubUsername)}`}>
            @{request.sender.githubUsername}{request.sender.name ? ` · ${request.sender.name}` : ''}
          </Link>
          <div>
            <button type="button" onClick={() => respond(request.id, 'accept')}>Accept</button>
            <button type="button" onClick={() => respond(request.id, 'decline')}>Decline</button>
          </div>
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
