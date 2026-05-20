"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Lesson } from "@/types/lesson";

import { getSourceDocuments, SourceDocument } from "@/lib/sourceDocuments";

type ViewMode = "all" | "reminders" | "aoa" | "mistakes" | "images";

type LessonForm = {
  title: string;
  lesson: string;
  context: string;
  action_point: string;
  notes: string;
  date_learned: string;
  source_type: string;
  source_name: string;
  source_link: string;
  source_date: string;
  source_document_id: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  reminder_required: "Yes" | "No";
  reminder_frequency: string;
  lesson_type: string;
  setting: string;
  people_involved: string;
  tags: string;
};

const emptyForm: LessonForm = {
  title: "",
  lesson: "",
  context: "",
  action_point: "",
  notes: "",
  date_learned: "",
  source_type: "Personal Reflection",
  source_name: "",
  source_link: "",
  source_date: "",
  source_document_id: "",
  category: "Personal Growth",
  priority: "Medium",
  reminder_required: "No",
  reminder_frequency: "None",
  lesson_type: "Tip",
  setting: "Both",
  people_involved: "",
  tags: ""
};

const sourceTypes = [
  "Sir AOA",
  "Colleague",
  "Facebook",
  "Social Media",
  "Website",
  "Book",
  "Video",
  "Personal Reflection",
  "Work Correction",
  "Other"
];

const categories = [
  "Leadership",
  "Communication",
  "Decision-Making",
  "Work Habits",
  "Personal Growth",
  "Marketing",
  "Design",
  "Production",
  "Management",
  "Other"
];

const lessonTypes = [
  "Principle",
  "Quote",
  "Warning",
  "Habit",
  "Work Correction",
  "Personal Reflection",
  "Tip"
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function asText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "Not set";
}

function tagsFromInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replaceAll(" ", "-"))
    .filter(Boolean);
}

function lessonToForm(lesson: Lesson): LessonForm {
  return {
    title: lesson.title ?? "",
    lesson: lesson.lesson ?? "",
    context: lesson.context ?? "",
    action_point: lesson.action_point ?? "",
    notes: lesson.notes ?? "",
    date_learned: lesson.date_learned ?? "",
    source_type: lesson.source_type ?? "Personal Reflection",
    source_name: lesson.source_name ?? "",
    source_link: lesson.source_link ?? "",
    source_date: lesson.source_date ?? "",
    source_document_id: (lesson as Lesson & { source_document_id?: string | null }).source_document_id ?? "",
    category: lesson.category ?? "Personal Growth",
    priority: lesson.priority ?? "Medium",
    reminder_required: lesson.reminder_required ?? "No",
    reminder_frequency: lesson.reminder_frequency ?? "None",
    lesson_type: lesson.lesson_type ?? "Tip",
    setting: lesson.setting ?? "Both",
    people_involved: lesson.people_involved ?? "",
    tags: (lesson.tags ?? []).join(", ")
  };
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LessonForm>({ ...emptyForm, date_learned: today(), source_date: today() });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("all");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>([]);

  async function loadSourceDocuments() {
    try {
      const docs = await getSourceDocuments();
      setSourceDocuments(docs);
    } catch (error) {
      console.error("Unable to load source documents:", error);
    }
  }

  async function loadLessons() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Lesson[];
    setLessons(rows);
    await loadImageUrls(rows);
    setLoading(false);
  }

  async function loadImageUrls(rows: Lesson[]) {
    const paths = rows.filter((item) => item.image_path).map((item) => item.image_path as string);
    const pairs: Record<string, string> = {};

    await Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage.from("lesson-images").createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) pairs[path] = data.signedUrl;
      })
    );

    setImageUrls(pairs);
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await Promise.all([loadLessons(), loadSourceDocuments()]);
      }
      setLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadLessons();
        loadSourceDocuments();
      }
      if (!session?.user) {
        setLessons([]);
        setSourceDocuments([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setAuthMessage("");
    const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.toLowerCase();

    if (allowedEmail && authEmail.toLowerCase() !== allowedEmail) {
      setAuthMessage("This app is limited to your approved personal email.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    });

    if (error) setAuthMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function uploadImage(lessonId: string) {
    if (!imageFile || !user) return null;

    const safeName = imageFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${user.id}/${lessonId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("lesson-images").upload(path, imageFile, {
      cacheControl: "3600",
      upsert: true
    });

    if (error) throw error;

    return { image_path: path, image_name: imageFile.name };
  }

  async function saveLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        title: form.title.trim(),
        lesson: form.lesson.trim(),
        context: form.context.trim() || null,
        action_point: form.action_point.trim() || null,
        notes: form.notes.trim() || null,
        date_saved: today(),
        date_learned: form.date_learned || null,
        source_type: form.source_type || null,
        source_name: form.source_name.trim() || null,
        source_link: form.source_link.trim() || null,
        source_date: form.source_date || null,
        source_document_id: form.source_document_id || null,
        category: form.category || null,
        priority: form.priority,
        reminder_required: form.reminder_required,
        reminder_frequency: form.reminder_frequency,
        lesson_type: form.lesson_type,
        setting: form.setting,
        people_involved: form.people_involved.trim() || null,
        status: "Active",
        tags: tagsFromInput(form.tags)
      };

      if (!payload.title || !payload.lesson) {
        setMessage("Title and lesson are required.");
        setSaving(false);
        return;
      }

      if (editingId) {
        const { data, error } = await supabase
          .from("lessons")
          .update(payload)
          .eq("id", editingId)
          .select("*")
          .single();

        if (error) throw error;

        if (imageFile) {
          const imageData = await uploadImage(editingId);
          if (imageData) {
            const { error: imageError } = await supabase.from("lessons").update(imageData).eq("id", editingId);
            if (imageError) throw imageError;
          }
        }

        setMessage(`Updated: ${data.title}`);
      } else {
        const { data, error } = await supabase.from("lessons").insert(payload).select("*").single();
        if (error) throw error;

        if (imageFile) {
          const imageData = await uploadImage(data.id);
          if (imageData) {
            const { error: imageError } = await supabase.from("lessons").update(imageData).eq("id", data.id);
            if (imageError) throw imageError;
          }
        }

        setMessage(`Saved: ${data.title}`);
      }

      setForm({ ...emptyForm, date_learned: today(), source_date: today() });
      setImageFile(null);
      setEditingId(null);
      await loadLessons();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Saving failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLesson(id: string) {
    const confirmed = window.confirm("Delete this lesson?");
    if (!confirmed) return;

    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Lesson deleted.");
      await loadLessons();
    }
  }

  function editLesson(lesson: Lesson) {
    setEditingId(lesson.id);
    setForm(lessonToForm(lesson));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, date_learned: today(), source_date: today() });
    setImageFile(null);
  }

  const stats = useMemo(() => {
    return {
      total: lessons.length,
      high: lessons.filter((item) => item.priority === "High").length,
      reminders: lessons.filter((item) => item.priority === "High" && item.reminder_required === "Yes").length,
      corrections: lessons.filter((item) => item.lesson_type === "Work Correction" || item.source_type === "Work Correction").length
    };
  }, [lessons]);

  const sourceDocumentTitleById = useMemo(() => {
    return sourceDocuments.reduce<Record<string, string>>((acc, document) => {
      acc[document.id] = document.title;
      return acc;
    }, {});
  }, [sourceDocuments]);

  const filteredLessons = useMemo(() => {
    const lower = query.toLowerCase();

    return lessons.filter((item) => {
      const matchesSearch =
        !lower ||
        [
          item.title,
          item.lesson,
          item.context,
          item.action_point,
          item.notes,
          item.source_name,
          item.source_type,
          item.category,
          item.lesson_type,
          ...(item.tags ?? [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lower);

      const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

      const matchesView =
        view === "all" ||
        (view === "reminders" && item.priority === "High" && item.reminder_required === "Yes") ||
        (view === "aoa" && item.source_type === "Sir AOA") ||
        (view === "mistakes" && (item.lesson_type === "Work Correction" || item.source_type === "Work Correction")) ||
        (view === "images" && Boolean(item.image_path));

      return matchesSearch && matchesPriority && matchesCategory && matchesView;
    });
  }, [lessons, query, view, priorityFilter, categoryFilter]);

  if (!user) {
    return (
      <main className="auth-wrap">
        <section className="card auth-card">
          <div className="brand" style={{ marginBottom: 20 }}>
            <span className="eyebrow">Private Knowledge Base</span>
            <h1>Life Lesson Keeper</h1>
            <p className="muted">Sign in to save lessons, work reminders, sources, and images.</p>
          </div>

          <div className="form">
            <div className="field">
              <label>Email</label>
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} type="email" placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} type="password" placeholder="Password" />
            </div>
            <button className="btn" type="button" onClick={signIn}>Sign in</button>
            {authMessage ? <div className="toast">{authMessage}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="container">
        <header className="header">
          <div className="brand">
            <span className="eyebrow">Personal System</span>
            <h1>Life Lesson Keeper</h1>
            <p className="muted">Add, review, and protect the lessons you want to remember.</p>
          </div>
          <div className="inline-actions">
            <Link className="btn secondary" href="/source-documents">Source Documents</Link>
            <button className="btn ghost" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <section className="stats">
          <div className="card stat"><strong>{stats.total}</strong><span className="muted">Total lessons</span></div>
          <div className="card stat"><strong>{stats.high}</strong><span className="muted">High priority</span></div>
          <div className="card stat"><strong>{stats.reminders}</strong><span className="muted">Reminder review</span></div>
          <div className="card stat"><strong>{stats.corrections}</strong><span className="muted">Work corrections</span></div>
        </section>

        <section className="grid">
          <aside className="card panel">
            <h2>{editingId ? "Edit Lesson" : "Add Lesson"}</h2>
            <p className="muted" style={{ margin: "6px 0 16px" }}>Write the lesson in a short, useful format.</p>

            <form className="form" onSubmit={saveLesson}>
              <div className="field">
                <label>Title</label>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Example: Check before sending" />
              </div>

              <div className="field">
                <label>Lesson</label>
                <textarea value={form.lesson} onChange={(event) => setForm({ ...form, lesson: event.target.value })} placeholder="What should you remember?" />
              </div>

              <div className="field">
                <label>Context</label>
                <textarea value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} placeholder="Where did this lesson come from?" />
              </div>

              <div className="field">
                <label>Action Point</label>
                <textarea value={form.action_point} onChange={(event) => setForm({ ...form, action_point: event.target.value })} placeholder="What action should you take?" />
              </div>

              <div className="row">
                <div className="field">
                  <label>Source Type</label>
                  <select value={form.source_type} onChange={(event) => setForm({ ...form, source_type: event.target.value })}>
                    {sourceTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Source Name</label>
                  <input value={form.source_name} onChange={(event) => setForm({ ...form, source_name: event.target.value })} placeholder="Sir AOA, Facebook page, book title" />
                </div>
              </div>



              <div className="field">
                <label>Source Document</label>
                <select value={form.source_document_id} onChange={(event) => setForm({ ...form, source_document_id: event.target.value })}>
                  <option value="">No linked source document</option>
                  {sourceDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
                <p className="form-help">
                  Link this lesson to a saved Sir AOA conversation from Source Documents.
                </p>
              </div>

              <div className="row">
                <div className="field">
                  <label>Category</label>
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Lesson Type</label>
                  <select value={form.lesson_type} onChange={(event) => setForm({ ...form, lesson_type: event.target.value })}>
                    {lessonTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as LessonForm["priority"] })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="field">
                  <label>Reminder Required</label>
                  <select value={form.reminder_required} onChange={(event) => setForm({ ...form, reminder_required: event.target.value as LessonForm["reminder_required"] })}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Reminder Frequency</label>
                  <select value={form.reminder_frequency} onChange={(event) => setForm({ ...form, reminder_frequency: event.target.value })}>
                    <option>None</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </div>
                <div className="field">
                  <label>Setting</label>
                  <select value={form.setting} onChange={(event) => setForm({ ...form, setting: event.target.value })}>
                    <option>Personal</option>
                    <option>Professional</option>
                    <option>Both</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Date Learned</label>
                  <input type="date" value={form.date_learned} onChange={(event) => setForm({ ...form, date_learned: event.target.value })} />
                </div>
                <div className="field">
                  <label>Source Date</label>
                  <input type="date" value={form.source_date} onChange={(event) => setForm({ ...form, source_date: event.target.value })} />
                </div>
              </div>

              <div className="field">
                <label>Source Link</label>
                <input value={form.source_link} onChange={(event) => setForm({ ...form, source_link: event.target.value })} placeholder="https://" />
              </div>

              <div className="field">
                <label>People Involved</label>
                <input value={form.people_involved} onChange={(event) => setForm({ ...form, people_involved: event.target.value })} placeholder="Optional" />
              </div>

              <div className="field">
                <label>Tags</label>
                <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="quality-control, leadership, sir-aoa" />
              </div>

              <div className="field">
                <label>Image or Screenshot</label>
                <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
              </div>

              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional supporting details" />
              </div>

              <div className="actions">
                <button className="btn" disabled={saving} type="submit">{saving ? "Saving..." : editingId ? "Update Lesson" : "Save Lesson"}</button>
                {editingId ? <button className="btn secondary" type="button" onClick={resetForm}>Cancel Edit</button> : null}
              </div>

              {message ? <div className="toast">{message}</div> : null}
            </form>
          </aside>

          <section className="card panel">
            <div className="lesson-top">
              <div>
                <h2>Lesson Library</h2>
                <p className="muted">Search, filter, and review lessons from all devices.</p>
              </div>
              <button className="btn secondary" type="button" onClick={loadLessons}>Refresh</button>
            </div>

            <div className="tabs">
              <button className={view === "all" ? "tab active" : "tab"} onClick={() => setView("all")}>All</button>
              <button className={view === "reminders" ? "tab active" : "tab"} onClick={() => setView("reminders")}>Reminder Review</button>
              <button className={view === "aoa" ? "tab active" : "tab"} onClick={() => setView("aoa")}>Sir AOA</button>
              <button className={view === "mistakes" ? "tab active" : "tab"} onClick={() => setView("mistakes")}>Mistakes to Avoid</button>
              <button className={view === "images" ? "tab active" : "tab"} onClick={() => setView("images")}>With Images</button>
            </div>

            <div className="filters">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons, tags, source..." />
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option>All</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option>All</option>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            {loading ? <div className="empty muted">Loading lessons...</div> : null}

            {!loading && filteredLessons.length === 0 ? (
              <div className="empty">
                <h3>No lessons found</h3>
                <p className="muted">Add your first entry or adjust the filters.</p>
              </div>
            ) : null}

            <div className="lesson-list">
              {filteredLessons.map((item) => (
                <article key={item.id} className="card lesson-card">
                  <div className="lesson-top">
                    <div className="lesson-title">
                      <h3>{item.title}</h3>
                      <div className="pills">
                        <span className={item.priority === "High" ? "pill high" : "pill"}>{item.priority}</span>
                        <span className={item.reminder_required === "Yes" ? "pill yes" : "pill"}>Reminder: {item.reminder_required}</span>
                        <span className="pill">{asText(item.category)}</span>
                        <span className="pill">{asText(item.source_type)}</span>
                      </div>
                    </div>
                    <div className="actions">
                      <button className="btn ghost" onClick={() => editLesson(item)}>Edit</button>
                      <button className="btn danger" onClick={() => deleteLesson(item.id)}>Delete</button>
                    </div>
                  </div>

                  {item.image_path && imageUrls[item.image_path] ? (
                    <img className="lesson-image" src={imageUrls[item.image_path]} alt={item.image_name ?? item.title} />
                  ) : null}

                  <p className="lesson-body">{item.lesson}</p>

                  {item.context ? <p className="lesson-body"><strong>Context:</strong> {item.context}</p> : null}
                  {item.action_point ? <p className="lesson-body"><strong>Action Point:</strong> {item.action_point}</p> : null}
                  {item.notes ? <p className="lesson-body"><strong>Notes:</strong> {item.notes}</p> : null}

                  <div className="pills">
                    <span className="pill">Learned: {item.date_learned ?? "Not set"}</span>
                    <span className="pill">Source: {asText(item.source_name)}</span>
                    {(item as Lesson & { source_document_id?: string | null }).source_document_id ? (
                      <span className="pill">
                        Source Doc: {sourceDocumentTitleById[(item as Lesson & { source_document_id?: string | null }).source_document_id as string] ?? "Linked"}
                      </span>
                    ) : null}
                    {item.reminder_frequency ? <span className="pill">Review: {item.reminder_frequency}</span> : null}
                    {(item.tags ?? []).map((tag) => <span key={tag} className="pill">#{tag}</span>)}
                  </div>

                  {item.source_link ? <a className="small-link" href={item.source_link} target="_blank" rel="noreferrer">Open source link</a> : null}
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
