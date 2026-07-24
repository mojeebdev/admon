'use client';

import { useEffect, useState } from 'react';

type ConnectionState = {
  authenticated?: boolean;
  profileEligible?: boolean;
  ownProfile?: boolean;
  targetFound?: boolean;
  status?: 'pending' | 'accepted' | 'declined' | null;
  direction?: 'sent' | 'received';
};

export function ConnectionControl({ username }: { username: string }) {
  const [state, setState] = useState<ConnectionState | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/connections?target=${encodeURIComponent(username)}`)
      .then((response) => response.json())
      .then((payload) => { if (active) setState(payload); })
      .catch(() => { if (active) setError('Could not check connection status.'); });
    return () => { active = false; };
  }, [username]);

  async function sendRequest() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not send the request.');
      setState((previous) => ({ ...previous, status: payload.status }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send the request.');
    } finally {
      setSending(false);
    }
  }

  if (!state) return <span className="connection-control__state">Checking connection status…</span>;
  if (state.ownProfile) return null;
  if (!state.authenticated) {
    return <a className="btn-primary" href={`/api/github/login?returnTo=/builder/${encodeURIComponent(username)}`}>Connect GitHub to connect</a>;
  }
  if (!state.profileEligible) return <span className="connection-control__state">Verify your own build record to connect with builders.</span>;
  if (state.status === 'accepted') return <span className="connection-control__state connection-control__state--accepted">Connected</span>;
  if (state.status === 'pending' && state.direction === 'received') return <span className="connection-control__state">They sent you a request. Open your profile to respond.</span>;
  if (state.status === 'pending' || sending) return <span className="connection-control__state">Request pending</span>;

  return (
    <div className="connection-control">
      <button type="button" className="btn-primary" onClick={sendRequest} disabled={sending}>Connect with builder</button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
