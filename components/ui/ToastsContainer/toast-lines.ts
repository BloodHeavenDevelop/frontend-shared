const LINE_BREAK = /<\/?br\s*\/?>/gi;

/**
 * Splits toast text into lines. Toast text is always rendered as plain text; a
 * `<br>` written in any spelling is the one supported formatting and becomes a
 * line break. For richer content pass `customComponent`.
 */
export const toastLines = (text: string): string[] =>
  text.split(LINE_BREAK).map((line) => line.trim());
