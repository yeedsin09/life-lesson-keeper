"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getSourceDocument,
  SourceDocument,
  SourceDocumentStatus,
  updateSourceDocumentStatus,
} from "@/lib/sourceDocuments";
import {
  ConversationSpeaker,
  ConversationTurn,
  parseMarkdownConversation,
} from "@/lib/markdownConversation";

type ConversationView = "clean" | "all" | "user" | "raw";

const speakerClass: Record<ConversationSpeaker, string> = {
  User: "speaker-user",
  Assistant: "speaker-assistant",
  System: "speaker-system",
  Note: "speaker-note",
};

function ConversationBlock({ turn }: { turn: ConversationTurn }) {
  return (
    <article className={`conversation-turn ${speakerClass[turn.speaker]}`}>
      <div className="turn-speaker">{turn.speaker}</div>
      <div className="turn-content">{turn.content}</div>
    </article>
  );
}

function speakerName(speaker: ConversationSpeaker) {
  if (speaker === "User") return "You";
  if (speaker === "Assistant") return "Agent";
  return speaker;
}

function cleanLine(line: string) {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function ReadableTurn({ turn }: { turn: ConversationTurn }) {
  const paragraphs = turn.content
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map(cleanLine)
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);

  return (
    <article className={`readable-turn ${speakerClass[turn.speaker]}`}>
      <div className="readable-speaker">
        <span>{speakerName(turn.speaker)}</span>
      </div>
      <div className="readable-content">
        {paragraphs.map((paragraph, index) => (
          <p key={`${turn.id}-paragraph-${index}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export default function SourceDocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const [document, setDocument] = useState<SourceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<ConversationView>("clean");

  async function loadDocument() {
    setLoading(true);
    setMessage("");

    try {
      const doc = await getSourceDocument(params.id);
      setDocument(doc);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load source document."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: SourceDocumentStatus) {
    if (!document) return;

    try {
      const updated = await updateSourceDocumentStatus(document.id, status);
      setDocument(updated);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update status."
      );
    }
  }

  useEffect(() => {
    loadDocument();
  }, [params.id]);

  const parsed = useMemo(
    () =>
      document
        ? parseMarkdownConversation(document.markdown_body)
        : parseMarkdownConversation(""),
    [document]
  );

  const visibleTurns = view === "user" ? parsed.userTurns : parsed.turns;

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <div className="page-title">
            <span className="eyebrow">Parsed Source Document</span>
            <h1>{document?.title ?? "Source Document"}</h1>
            <p className="muted">
              Extracted conversation view from the saved Markdown document.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/" className="btn ghost">
              Lessons
            </Link>
            <Link href="/source-documents" className="btn ghost">
              Source Documents
            </Link>
          </div>
        </header>

        {message ? <div className="toast">{message}</div> : null}

        {loading ? (
          <div className="empty muted">Loading parsed document...</div>
        ) : !document ? (
          <section className="card panel empty stack">
            <h2>Document unavailable</h2>
            <p className="muted">
              The source document could not be opened for this account.
            </p>
          </section>
        ) : (
          <section className="document-reader">
            <aside className="card panel reader-sidebar">
              <div className="reader-meta">
                <span className="eyebrow">Document</span>
                <h2>{parsed.title ?? document.title}</h2>
                <p className="doc-meta">
                  {document.source_type} / {document.date_received}
                </p>
              </div>

              {document.summary ? (
                <p className="doc-summary">{document.summary}</p>
              ) : null}

              <div className="reader-stats">
                <div>
                  <strong>{parsed.turns.length}</strong>
                  <span className="muted">Parsed turns</span>
                </div>
                <div>
                  <strong>{parsed.userTurns.length}</strong>
                  <span className="muted">User turns</span>
                </div>
                <div>
                  <strong>{parsed.wordCount}</strong>
                  <span className="muted">Words</span>
                </div>
              </div>

              {document.key_themes?.length > 0 ? (
                <div className="pills">
                  {document.key_themes.map((theme) => (
                    <span key={theme} className="pill">
                      {theme}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="source-status">Status</label>
                <select
                  id="source-status"
                  value={document.status}
                  onChange={(event) =>
                    handleStatusChange(event.target.value as SourceDocumentStatus)
                  }
                >
                  <option value="Unread">Unread</option>
                  <option value="Reading">Reading</option>
                  <option value="Processed">Processed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </aside>

            <section className="card panel reader-main">
              <div className="lesson-top">
                <div>
                  <h2>Conversation</h2>
                  <p className="muted">
                    Read the saved exchange as a conversation, or switch to
                    focused extraction views.
                  </p>
                </div>

                <div className="tabs compact-tabs">
                  <button
                    className={view === "clean" ? "tab active" : "tab"}
                    onClick={() => setView("clean")}
                  >
                    Clean
                  </button>
                  <button
                    className={view === "all" ? "tab active" : "tab"}
                    onClick={() => setView("all")}
                  >
                    All
                  </button>
                  <button
                    className={view === "user" ? "tab active" : "tab"}
                    onClick={() => setView("user")}
                  >
                    User
                  </button>
                  <button
                    className={view === "raw" ? "tab active" : "tab"}
                    onClick={() => setView("raw")}
                  >
                    Raw
                  </button>
                </div>
              </div>

              {view === "raw" ? (
                <pre className="markdown-raw">{document.markdown_body}</pre>
              ) : view === "clean" ? (
                <div className="readable-conversation">
                  {visibleTurns.map((turn) => (
                    <ReadableTurn key={turn.id} turn={turn} />
                  ))}
                </div>
              ) : visibleTurns.length === 0 ? (
                <div className="empty">
                  <h3>No user turns detected</h3>
                  <p className="muted">
                    Use labels like "User:" or "Assistant:" in the Markdown to
                    split the conversation into turns.
                  </p>
                </div>
              ) : (
                <div className="conversation-list">
                  {visibleTurns.map((turn) => (
                    <ConversationBlock key={turn.id} turn={turn} />
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
}
