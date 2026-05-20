"use client";

import { useState } from "react";
import Link from "next/link";
import { createSourceDocument } from "@/lib/sourceDocuments";

export default function NewSourceDocumentPage() {
  const [title, setTitle] = useState("");
  const [dateReceived, setDateReceived] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [summary, setSummary] = useState("");
  const [keyThemesText, setKeyThemesText] = useState("");
  const [markdownBody, setMarkdownBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const keyThemes = keyThemesText
        .split(",")
        .map((theme) => theme.trim())
        .filter(Boolean);

      await createSourceDocument({
        title,
        dateReceived,
        summary,
        keyThemes,
        markdownBody,
      });

      setTitle("");
      setSummary("");
      setKeyThemesText("");
      setMarkdownBody("");
      setMessage("Source document saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save source document."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <div className="page-title">
            <span className="eyebrow">Reference Intake</span>
            <h1>Conversation Intake</h1>
            <p className="muted">
              Save Sir AOA ChatGPT conversations as Markdown source documents.
            </p>
          </div>

          <Link href="/source-documents" className="btn ghost">
            Back to Source Documents
          </Link>
        </header>

        <section className="card panel">
          <form className="form" onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="source-title">Title</label>
              <input
                id="source-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Sir AOA conversation about leadership"
              />
            </div>

            <div className="field">
              <label htmlFor="source-date">Date Received</label>
              <input
                id="source-date"
                type="date"
                value={dateReceived}
                onChange={(event) => setDateReceived(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="source-themes">Key Themes</label>
              <input
                id="source-themes"
                value={keyThemesText}
                onChange={(event) => setKeyThemesText(event.target.value)}
                placeholder="leadership, discipline, culture, purpose"
              />
            </div>

            <div className="field">
              <label htmlFor="source-summary">Summary</label>
              <textarea
                id="source-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Brief summary of the conversation."
              />
            </div>

            <div className="field">
              <label htmlFor="source-body">Markdown Body</label>
              <textarea
                id="source-body"
                className="markdown-input"
                value={markdownBody}
                onChange={(event) => setMarkdownBody(event.target.value)}
                placeholder="Paste the full Sir AOA ChatGPT conversation here in Markdown format."
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title || !markdownBody}
              className="btn"
            >
              {saving ? "Saving..." : "Save Source Document"}
            </button>

            {message ? <div className="toast">{message}</div> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
