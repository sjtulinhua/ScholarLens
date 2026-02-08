export function formatKnowledgePoint(kp: string) {
  if (!kp) return "";
  // Split by '-' or ' ', take the last part, and trim
  return kp.split(/[-_]/).pop()?.trim() || kp;
}
