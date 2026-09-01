'use client';

import { useEffect, useState } from 'react';
import { Card, Pill, Tile } from '@/components/console/primitives';
import { Icon } from '@/components/console/Icon';
import { cn } from '@/lib/utils';

interface SessionItem {
  id: string;
  userEmail: string;
  role: string;
  loginAt: string;
  logoutAt: string | null;
  lastActive: string;
  ipAddress: string | null;
  userAgent: string | null;
  activityLog?: Array<{ action: string; at: string }>;
}

interface AuditEventItem {
  id: string;
  at: string;
  subjectType: string;
  action: string;
  detail: string;
}

let API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');
if (!API_BASE.endsWith('/api')) API_BASE = `${API_BASE}/api`;

export function UserSessionHistoryModal({
  userEmail,
  userRole,
  onClose,
}: {
  userEmail: string;
  userRole: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE}/auth/session/history`, {
          headers: {
            // Include credentials if available
          },
        });
        if (res.ok) {
          const body = await res.json();
          if (body?.data) {
            setSessions(body.data.sessions || []);
            setAuditEvents(body.data.auditEvents || []);
          }
        }
      } catch (err) {
        console.warn('Session history load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/auth/session/logout`, { method: 'POST' });
    } catch {
      // Proceed with client logout
    }
    // Redirect to login page or reload
    window.location.href = '/login';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col p-6 bg-void-soft border-chalk/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-chalk/[0.1]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pill tone="validated">ACTIVE SESSION</Pill>
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-chalk/50">
                {userRole.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="font-display text-[1.125rem] font-extrabold text-chalk">
              User Activity & Session History (Saved in DB)
            </h3>
            <p className="text-[0.75rem] font-mono text-chalk/60 mt-0.5">{userEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-chalk/50 hover:bg-chalk/10 hover:text-chalk transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          {/* Action Header */}
          <div className="flex items-center justify-between bg-void/60 p-3 rounded-lg border border-chalk/[0.08]">
            <div className="text-[0.78125rem] font-mono text-chalk/70">
              Session state saved in PostgreSQL <code className="text-signal">user_sessions</code>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-risk/20 hover:bg-risk/30 border border-risk/40 px-3 py-1.5 font-mono text-[0.6875rem] font-bold text-risk uppercase tracking-wider transition-colors"
            >
              <Icon name="alert" className="h-3.5 w-3.5" />
              Logout & Save Session
            </button>
          </div>

          {/* Past Sessions List */}
          <div>
            <h4 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-chalk/50 mb-2">
              Recent User Sessions (Database History)
            </h4>
            {loading ? (
              <p className="text-[0.78125rem] font-mono text-chalk/40 py-4">Loading session history...</p>
            ) : sessions.length === 0 ? (
              <p className="text-[0.78125rem] italic text-chalk/40">No previous session logs recorded.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg bg-void/40 border border-chalk/[0.06] flex items-center justify-between text-[0.75rem]"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-semibold text-chalk">{new Date(s.loginAt).toLocaleString()}</span>
                        {s.logoutAt ? (
                          <span className="text-chalk/40">→ {new Date(s.logoutAt).toLocaleTimeString()}</span>
                        ) : (
                          <span className="text-validated font-bold">[Current Session]</span>
                        )}
                      </div>
                      <div className="font-mono text-[0.625rem] text-chalk/40 mt-0.5">
                        IP: {s.ipAddress || '127.0.0.1'} · Agent: {s.userAgent?.slice(0, 40)}
                      </div>
                    </div>

                    <Pill tone={s.logoutAt ? 'chalk' : 'validated'}>
                      {s.logoutAt ? 'CLOSED' : 'ACTIVE'}
                    </Pill>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Events Log */}
          {auditEvents.length > 0 && (
            <div>
              <h4 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-chalk/50 mb-2">
                Audit Trail & Workflow Actions
              </h4>
              <div className="space-y-1.5">
                {auditEvents.map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded bg-void/30 border border-chalk/[0.05] text-[0.71875rem] flex items-start gap-2"
                  >
                    <Icon name="check" className="h-3.5 w-3.5 text-signal shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-chalk">{a.action.replace(/_/g, ' ')}: </span>
                      <span className="text-chalk/80">{a.detail} </span>
                      <span className="font-mono text-[0.625rem] text-chalk/40">({new Date(a.at).toLocaleTimeString()})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-chalk/[0.1] flex items-center justify-between">
          <span className="text-[0.6875rem] font-mono text-chalk/40">
            Sarthi Session Control & Audit Infrastructure
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-chalk/10 px-4 py-2 font-mono text-[0.6875rem] font-bold uppercase text-chalk hover:bg-chalk/20 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
