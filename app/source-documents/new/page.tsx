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
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/source-documents"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Back to Source Documents
        </Link>

        <h1 className="mt-3 text-2xl font-semibold">Conversation Intake</h1>
        <p className="text-sm text-gray-500">
          Save Sir AOA ChatGPT conversations as Markdown source documents.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Sir AOA conversation about leadership"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Date Received
          </label>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2"
            value={dateReceived}
            onChange={(event) => setDateReceived(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Key Themes</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={keyThemesText}
            onChange={(event) => setKeyThemesText(event.target.value)}
            placeholder="leadership, discipline, culture, purpose"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Summary</label>
          <textarea
            className="min-h-24 w-full rounded-xl border px-3 py-2"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Brief summary of the conversation."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Markdown Body
          </label>
          <textarea
            className="min-h-80 w-full rounded-xl border px-3 py-2 font-mono text-sm"
            value={markdownBody}
            onChange={(event) => setMarkdownBody(event.target.value)}
            placeholder="Paste the full Sir AOA ChatGPT conversation here in Markdown format."
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title || !markdownBody}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Source Document"}
        </button>

        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </main>
  );
}