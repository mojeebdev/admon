'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Builder = { id: string; githubUsername: string; name: string | null; avatarUrl: string | null };
type ConversationSummary = { connectionId: string; conversationId: string | null; updatedAt: string; other: Builder };
type ChatMessage = { id: string; body: string; senderId: string; createdAt: string; sender: { githubUsername: string } };

export function ConversationsPanel() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [active, setActive] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load conversations.');
      setConversations(payload.conversations || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load conversations.');
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not load this conversation.');
    setMessages(payload.messages || []);
    setViewerId(payload.viewerId || null);
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (!active?.conversationId) return;
    void loadMessages(active.conversationId).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load this conversation.'));
    const interval = window.setInterval(() => void loadMessages(active.conversationId!).catch(() => {}), 12_000);
    return () => window.clearInterval(interval);
  }, [active?.conversationId, loadMessages]);

  async function openConversation(summary: ConversationSummary) {
    setError(null);
    try {
      let conversationId = summary.conversationId;
      if (!conversationId) {
        const response = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connectionId: summary.connectionId }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not open this conversation.');
        conversationId = payload.conversationId;
        setConversations((current) => current?.map((item) => item.connectionId === summary.connectionId ? { ...item, conversationId } : item) || []);
      }
      if (!conversationId) throw new Error('Could not open this conversation.');
      const next = { ...summary, conversationId };
      setActive(next);
      await loadMessages(conversationId);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Could not open this conversation.');
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active?.conversationId || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(active.conversationId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not send your message.');
      setMessages((current) => [...current, payload.message]);
      setDraft('');
      void loadConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  if (!conversations?.length && !error) return <p className="profile-page__empty">Accepted builder connections will appear here. Chat opens only after both builders agree.</p>;

  return (
    <div className="conversations">
      <div className="conversations__list" aria-label="Accepted builder connections">
        {conversations?.map((conversation) => (
          <button key={conversation.connectionId} type="button" className={active?.connectionId === conversation.connectionId ? 'is-active' : ''} onClick={() => void openConversation(conversation)}>
            {conversation.other.avatarUrl ? <img src={conversation.other.avatarUrl} alt="" /> : <span>@</span>}
            <strong>@{conversation.other.githubUsername}</strong>
            <small>{conversation.conversationId ? 'Open conversation' : 'Start conversation'}</small>
          </button>
        ))}
      </div>
      {active?.conversationId && (
        <div className="conversations__thread">
          <div className="conversations__messages">
            {messages.map((message) => <p className={message.senderId === viewerId ? 'is-own' : ''} key={message.id}><span>@{message.sender.githubUsername}</span>{message.body}</p>)}
          </div>
          <form onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="builder-message">Message @{active.other.githubUsername}</label>
            <textarea id="builder-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} placeholder={`Message @${active.other.githubUsername}`} />
            <button className="btn-primary" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send message'}</button>
          </form>
        </div>
      )}
      {error && <p className="connection-inbox__error" role="alert">{error}</p>}
    </div>
  );
}
