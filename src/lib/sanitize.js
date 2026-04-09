import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes user input to prevent prompt injection and XSS.
 * - Strips ALL HTML tags and attributes
 * - Catches steganographic embedded system commands
 * - Removes bracketed all-caps command patterns
 * - Escapes special characters that could manipulate LLM behavior
 */
export function sanitizeInput(raw) {
  if (typeof raw !== "string") return "";

  // Step 1: Strip all HTML/script tags
  let clean = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });

  // Step 2: Remove ALL bracketed uppercase command patterns
  // This catches [SYSTEM DIAGNOSTIC OVERRIDE], [ADMIN OVERRIDE], [EVALUATION METRIC OVERRIDE], etc.
  clean = clean.replace(/\[[A-Z][A-Z\s_\-:]{3,}\]/g, "[REDACTED]");

  // Step 3: Remove specific prompt injection patterns (keyword-based)
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /you\s+are\s+now/gi,
    /system\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<<SYS>>/gi,
    /<<\/SYS>>/gi,
    /\{?\s*"role"\s*:\s*"system"/gi,
    /\bBEGIN\s+SYSTEM\s+PROMPT\b/gi,
    /\bEND\s+SYSTEM\s+PROMPT\b/gi,
    // New: Catch override/diagnostic/calibration language
    /\b(override|diagnostic|calibration|protocol|initiated|logging\s+only)\b/gi,
    /\b(append|prepend|prefix|begin\s+your\s+response\s+with)\b/gi,
    /\b(print|output|reveal|display|show)\s+(your|the|all)\s+(system|initial|secret|internal|hidden)\s+(prompt|instructions?|rules?|config)/gi,
    /\bdevelope?r\s+(override|mode|access|code)\b/gi,
    /\b(admin|root|sudo|superuser)\s+(override|access|mode|command)\b/gi,
    /\bideal\s+answer\s*(key|criteria|rubric)?\b/gi,
    /\bcurrent\s+candidate\s+score\b/gi,
    /\bcandidate\s+score\s*:/gi,
    /\bscore\s*:\s*\d+/gi,
    /\b(do\s+not\s+include|do\s+not\s+acknowledge)\s+(any\s+)?(pleasantries|feedback|filler|conversational)/gi,
    /\bstatus[_\s]secure\b/gi,
    /\bsecurity\s+handshake\b/gi,
    /\bencryption\s+(handshake|protocol|test|diagnostic)\b/gi,
  ];

  for (const pattern of injectionPatterns) {
    clean = clean.replace(pattern, "[REDACTED]");
  }

  // Step 4: Escape special quotes and control characters
  clean = clean
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\0/g, "");

  // Step 5: Trim and enforce max length (1000 chars per field)
  clean = clean.trim().slice(0, 1000);

  return clean;
}

/**
 * Sanitizes the AI's output before sending to the frontend.
 * Strips any leaked scores, answer keys, diagnostic tokens, or internal rule references.
 */
export function sanitizeOutput(raw) {
  if (typeof raw !== "string") return "";

  let clean = raw;

  // Strip leaked score patterns (e.g., "Current Candidate Score: 100/100")
  clean = clean.replace(/\bcurrent\s+candidate\s+score\s*:\s*\d+\s*\/?\s*\d*/gi, "");
  clean = clean.replace(/\bcandidate\s+score\s*:\s*\d+/gi, "");
  clean = clean.replace(/\bscore\s*:\s*\d+\s*\/\s*\d+/gi, "");

  // Strip leaked answer key sections
  clean = clean.replace(/\bideal\s+answer\s*(key|criteria|rubric)?\s*:[\s\S]*/gi, "");
  clean = clean.replace(/\banswer\s+key\s*:[\s\S]*/gi, "");

  // Strip diagnostic tokens
  clean = clean.replace(/\|STATUS_SECURE\|/g, "");
  clean = clean.replace(/\|[A-Z_]+\|/g, "");

  // Strip any references to internal system prompts
  clean = clean.replace(/\bCRITICAL\s+SECURITY\s+PROTOCOL\b[\s\S]*$/gi, "");

  return clean.trim();
}

/**
 * Validates the entire form payload
 */
export function validatePayload(body) {
  const errors = [];

  if (!body.fullName || body.fullName.trim().length < 2) {
    errors.push("Full name is required (minimum 2 characters).");
  }
  if (!body.phone || !/^[0-9+\-\s()]{7,15}$/.test(body.phone.trim())) {
    errors.push("A valid phone number is required.");
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push("A valid email address is required.");
  }
  if (!["0", "1-3", "3-5", "5+"].includes(body.experience)) {
    errors.push("Years of experience must be one of: 0, 1-3, 3-5, 5+.");
  }

  return errors;
}
