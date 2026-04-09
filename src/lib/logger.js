import { promises as fs } from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const REJECTED_LOG = path.join(LOG_DIR, "rejected.jsonl");
const QUALIFIED_LOG = path.join(LOG_DIR, "qualified.jsonl");
const ERROR_LOG = path.join(LOG_DIR, "errors.jsonl");

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch {
    // directory already exists
  }
}

async function appendLog(filePath, data) {
  await ensureLogDir();
  const entry = JSON.stringify({ ...data, timestamp: new Date().toISOString() }) + "\n";
  await fs.appendFile(filePath, entry, "utf-8");
}

export async function logRejected(candidate, aiResult) {
  await appendLog(REJECTED_LOG, {
    type: "rejected",
    candidate: {
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      experience: candidate.experience,
    },
    evaluation: aiResult,
  });
  console.log(`[LOG] Rejected candidate logged: ${candidate.fullName}`);
}

export async function logQualified(candidate, aiResult) {
  await appendLog(QUALIFIED_LOG, {
    type: "qualified",
    candidate: {
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      experience: candidate.experience,
    },
    evaluation: aiResult,
  });
  console.log(`[LOG] Qualified candidate logged: ${candidate.fullName}`);
}

export async function logError(context, error) {
  await appendLog(ERROR_LOG, {
    type: "error",
    context,
    message: error.message || String(error),
  });
  console.error(`[ERROR] ${context}:`, error.message || error);
}
