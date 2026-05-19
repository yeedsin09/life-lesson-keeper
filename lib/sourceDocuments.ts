import { supabase } from "./supabase";

export type SourceDocumentStatus =
  | "Unread"
  | "Reading"
  | "Processed"
  | "Archived";

export type SourceDocument = {
  id: string;
  user_id: string;
  title: string;
  source_type: string;
  date_received: string;
  summary: string;
  key_themes: string[];
  markdown_body: string;
  status: SourceDocumentStatus;
  extracted_lessons_count: number;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Please log in first to view source documents.");

  return user.id;
}

export async function getSourceDocuments() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("source_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as SourceDocument[];
}

export async function createSourceDocument(input: {
  title: string;
  dateReceived: string;
  summary: string;
  keyThemes: string[];
  markdownBody: string;
}) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("source_documents")
    .insert({
      user_id: userId,
      title: input.title,
      date_received: input.dateReceived,
      summary: input.summary,
      key_themes: input.keyThemes,
      markdown_body: input.markdownBody,
      status: "Unread",
    })
    .select()
    .single();

  if (error) throw error;

  return data as SourceDocument;
}

export async function updateSourceDocumentStatus(
  id: string,
  status: SourceDocumentStatus
) {
  const { data, error } = await supabase
    .from("source_documents")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as SourceDocument;
}