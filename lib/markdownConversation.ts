export type ConversationSpeaker = "User" | "Assistant" | "System" | "Note";

export type ConversationTurn = {
  id: string;
  speaker: ConversationSpeaker;
  content: string;
};

export type ParsedMarkdownConversation = {
  title: string | null;
  turns: ConversationTurn[];
  userTurns: ConversationTurn[];
  wordCount: number;
};

const speakerAliases: Record<string, ConversationSpeaker> = {
  user: "User",
  human: "User",
  me: "User",
  you: "User",
  assistant: "Assistant",
  agent: "Assistant",
  chatgpt: "Assistant",
  "sir aoa": "Assistant",
  aoa: "Assistant",
  system: "System",
};

function normalizeSpeaker(value: string): ConversationSpeaker | null {
  const key = value.trim().toLowerCase();
  return speakerAliases[key] ?? null;
}

function stripMarkdownLabel(value: string) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*/, "")
    .replace(/\*\*$/, "")
    .trim();
}

function detectSpeakerLine(line: string) {
  const trimmed = stripMarkdownLabel(line);
  const inlineMatch = trimmed.match(
    /^(user|human|me|you|assistant|agent|chatgpt|sir aoa|aoa|system)\s*:\s*(.*)$/i
  );

  if (inlineMatch) {
    const speaker = normalizeSpeaker(inlineMatch[1]);
    return speaker ? { speaker, content: inlineMatch[2].trim() } : null;
  }

  const headingMatch = trimmed.match(
    /^(user|human|me|you|assistant|agent|chatgpt|sir aoa|aoa|system)$/i
  );

  if (headingMatch) {
    const speaker = normalizeSpeaker(headingMatch[1]);
    return speaker ? { speaker, content: "" } : null;
  }

  return null;
}

function firstMarkdownHeading(markdown: string) {
  const heading = markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^#\s+(.+)$/)?.[1]?.trim())
    .find(Boolean);

  return heading ?? null;
}

function pushTurn(
  turns: ConversationTurn[],
  speaker: ConversationSpeaker,
  lines: string[]
) {
  const content = lines.join("\n").trim();
  if (!content) return;

  turns.push({
    id: `${speaker.toLowerCase()}-${turns.length + 1}`,
    speaker,
    content,
  });
}

export function parseMarkdownConversation(
  markdown: string
): ParsedMarkdownConversation {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const turns: ConversationTurn[] = [];
  let currentSpeaker: ConversationSpeaker = "Note";
  let currentLines: string[] = [];

  for (const line of lines) {
    const speakerLine = detectSpeakerLine(line);

    if (speakerLine) {
      pushTurn(turns, currentSpeaker, currentLines);
      currentSpeaker = speakerLine.speaker;
      currentLines = speakerLine.content ? [speakerLine.content] : [];
      continue;
    }

    currentLines.push(line);
  }

  pushTurn(turns, currentSpeaker, currentLines);

  const parsedTurns =
    turns.length > 0
      ? turns
      : [
          {
            id: "note-1",
            speaker: "Note" as const,
            content: markdown.trim(),
          },
        ].filter((turn) => turn.content);

  return {
    title: firstMarkdownHeading(markdown),
    turns: parsedTurns,
    userTurns: parsedTurns.filter((turn) => turn.speaker === "User"),
    wordCount: markdown.trim().split(/\s+/).filter(Boolean).length,
  };
}
