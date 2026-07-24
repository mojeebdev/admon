'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function PreviewLookup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = username.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(normalized)) {
      setError('Enter a valid public GitHub username.');
      return;
    }
    router.push(`/preview/${encodeURIComponent(normalized)}`);
  }

  return (
    <form className="preview-lookup__form" onSubmit={submit}>
      <label className="sr-only" htmlFor="preview-username">GitHub username</label>
      <span aria-hidden="true">@</span>
      <input id="preview-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="github-username" autoCapitalize="none" autoCorrect="off" spellCheck="false" maxLength={39} />
      <button className="btn-primary" type="submit">Generate preview</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
