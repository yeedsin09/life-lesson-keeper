export type LessonPriority = "Low" | "Medium" | "High";
export type ReminderRequired = "Yes" | "No";
export type LessonStatus = "Active" | "Archived";

export type Lesson = {
  id: string;
  user_id: string;
  title: string;
  lesson: string;
  context: string | null;
  action_point: string | null;
  notes: string | null;
  date_saved: string;
  date_learned: string | null;
  source_type: string | null;
  source_name: string | null;
  source_link: string | null;
  source_date: string | null;
  source_document_id: string | null;
  category: string | null;
  priority: LessonPriority;
  reminder_required: ReminderRequired;
  reminder_frequency: string | null;
  lesson_type: string | null;
  setting: string | null;
  people_involved: string | null;
  image_path: string | null;
  image_name: string | null;
  status: LessonStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type LessonInput = Omit<
  Lesson,
  "id" | "user_id" | "created_at" | "updated_at"
>;
