"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSourceDocuments,
  SourceDocument,
  SourceDocumentStatus,
  updateSourceDocumentStatus,
} from "@/lib/sourceDocuments";

export default function SourceDocumentsPage() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    setLoading(true);
    setMessage("");

    try {
      const docs = await getSourceDocuments();
      setDocuments(docs);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load source documents."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: SourceDocumentStatus) {
    try {
      await updateSourceDocumentStatus(id, status);
      await loadDocuments();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update status."
      );
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <div className="page-title">
            <span className="eyebrow">Reference Library</span>
            <h1>Source Documents</h1>
            <p className="muted">
              Full Sir AOA conversations saved for reference and lesson extraction.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/" className="btn ghost">
              Lessons
            </Link>
            <Link href="/source-documents/new" className="btn">
              Add Conversation
            </Link>
          </div>
        </header>

        {message ? <div className="toast">{message}</div> : null}

        {loading ? (
          <div className="empty muted">Loading source documents...</div>
        ) : message.includes("log in") ? (
          <section className="card panel empty stack">
            <h2>Login required</h2>
            <p className="muted">
              Please log in first before viewing source documents.
            </p>
            <Link href="/" className="btn">
              Go to Login
            </Link>
          </section>
        ) : documents.length === 0 ? (
          <section className="card panel empty stack">
            <h2>No source documents found</h2>
            <p className="muted">Start by adding a new conversation.</p>
          </section>
        ) : (
          <section className="doc-list">
            {documents.map((document) => (
              <article key={document.id} className="card doc-card">
                <div className="doc-card-header">
                  <div>
                    <h2>{document.title}</h2>
                    <p className="doc-meta">
                      {document.source_type} / {document.date_received}
                    </p>
                  </div>

                  <select
                    className="status-select"
                    value={document.status}
                    onChange={(event) =>
                      handleStatusChange(
                        document.id,
                        event.target.value as SourceDocumentStatus
                      )
                    }
                  >
                    <option value="Unread">Unread</option>
                    <option value="Reading">Reading</option>
                    <option value="Processed">Processed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {document.summary ? (
                  <p className="doc-summary">{document.summary}</p>
                ) : null}

                {document.key_themes?.length > 0 ? (
                  <div className="pills">
                    {document.key_themes.map((theme) => (
                      <span key={theme} className="pill">
                        {theme}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="doc-count">
                  Extracted lessons: {document.extracted_lessons_count}
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
