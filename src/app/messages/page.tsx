"use client";
import { useEffect, useState } from "react";
import { getSupabase, DEVICE_ID } from "@/lib/supabase";
import type { OutboundMessage } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { CheckIcon } from "@/components/Icons";

const LIMIT = 110;

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

export default function MessagesPage() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<OutboundMessage[]>([]);
  const toast = useToast();

  useEffect(() => {
    const sb = getSupabase();
    let cancelled = false;

    (async () => {
      const { data } = await sb
        .from("messages")
        .select("*")
        .eq("device_id", DEVICE_ID)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled) setMessages((data as OutboundMessage[]) || []);
    })();

    const channel = sb
      .channel("msgs-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `device_id=eq.${DEVICE_ID}`
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [payload.new as OutboundMessage, ...prev].slice(0, 20));
          } else if (payload.eventType === "UPDATE") {
            const next = payload.new as OutboundMessage;
            setMessages((prev) => prev.map((m) => (m.id === next.id ? next : m)));
            if (next.delivered) toast("Delivered to device");
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [toast]);

  const remaining = LIMIT - text.length;
  const counterWarn = remaining <= 15;

  async function send() {
    if (!text.trim() || sending) return;
    if (text.length > LIMIT) return;
    setSending(true);
    const sb = getSupabase();
    const { error } = await sb.from("messages").insert({
      device_id: DEVICE_ID,
      message: text.trim(),
      delivered: false
    });
    setSending(false);
    if (error) {
      toast("Failed to send");
      console.error(error);
      return;
    }
    setText("");
    toast("Message sent");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Send message</h1>
        <p className="text-xs text-muted mt-0.5">
          Delivered to <span className="font-mono">{DEVICE_ID}</span>. Max {LIMIT} characters.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-xl p-4 shadow-card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, LIMIT))}
          maxLength={LIMIT}
          rows={4}
          placeholder="Type a short message for the wearer…"
          className="w-full resize-none bg-transparent text-ink text-sm outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between mt-2">
          <span
            className={
              "text-xs font-mono " + (counterWarn ? "text-accent" : "text-muted")
            }
          >
            {text.length} / {LIMIT}
          </span>
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="px-4 py-1.5 text-sm rounded-md bg-ink text-white disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-2">Recent</h2>
        {messages.length === 0 ? (
          <div className="bg-surface border border-dashed border-line rounded-xl p-6 text-center text-sm text-muted">
            No messages yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className="bg-surface border border-line rounded-xl p-3 shadow-card animate-fadein"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink break-words flex-1">{m.message}</p>
                  {m.delivered ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-ink">
                      <CheckIcon className="w-3 h-3" /> Delivered
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">Pending</span>
                  )}
                </div>
                <div className="text-[11px] text-muted mt-1">{formatDateTime(m.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
