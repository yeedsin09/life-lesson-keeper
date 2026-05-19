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
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Source Documents</h1>
          <p className="text-sm text-gray-500">
            Full Sir AOA conversations saved for reference and lesson extraction.
          </p>
        </div>f

        <Link
          href="/source-documents/new"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          Add Conversation
        </Link>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border bg-white p-3 text-sm text-gray-700">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : message.includes("log in") ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p className="font-medium text-gray-900">Login required</p>
          <p className="mt-1">
            Please log in first before viewing source documents.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Go to Login
          </Link>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p className="font-medium text-gray-900">No source documents found</p>
          <p className="mt-1">Start by adding a new conversation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{document.title}</h2>
                  <p className="text-sm text-gray-500">
                    {document.source_type} • {document.date_received}
                  </p>
                </div>

                <select
                  className="rounded-xl border px-3 py-2 text-sm"
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

              {document.summary && (
                <p className="mt-3 text-sm text-gray-700">{document.summary}</p>
              )}

              {document.key_themes?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.key_themes.map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs text-gray-500">
                Extracted lessons: {document.extracted_lessons_count}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}