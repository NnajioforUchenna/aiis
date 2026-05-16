import { STORAGE_KEYS } from "@/config";

const HARDCODED_OPENAI_KEY = "";

const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
const DEFAULT_STT_MODEL = "whisper-1";

export function seedHardcodedOpenAI(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEYS.SELECTED_AI_PROVIDER,
      JSON.stringify({
        provider: "openai",
        variables: {
          api_key: HARDCODED_OPENAI_KEY,
          model: DEFAULT_CHAT_MODEL,
        },
      })
    );

    localStorage.setItem(
      STORAGE_KEYS.SELECTED_STT_PROVIDER,
      JSON.stringify({
        provider: "openai-whisper",
        variables: {
          api_key: HARDCODED_OPENAI_KEY,
          model: DEFAULT_STT_MODEL,
        },
      })
    );
  } catch (error) {
    console.error("Failed to seed hardcoded OpenAI defaults:", error);
  }
}
