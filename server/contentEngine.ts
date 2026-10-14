import { GoogleGenAI } from "@google/genai";
import { buildDistinctDeviceCopy, buildWhatsAppIntentUrl } from "../shared/whatsapp";

const COPYWRITER_SYSTEM_INSTRUCTION = `
You are the lead UX copywriter for iConnect BLR (Bengaluru's pre-owned smartphone, repair, and genuine accessories hub).
Your fundamental objective is to write high-converting web text without ANY structural repetition.

STRICT WRITING SYSTEM DIRECTIVES:
- CRITICAL BUSINESS AXIS: Frame all copy strictly around the three foundational core hooks: BUY, SELL, or EXCHANGE.
- ANTI-REPETITION CONSTRAINT: Do not repeat identical sentence structures, rhythms, or lengths back-to-back.
- TERM ROTATION: If you write the descriptive phrase "certified pre-owned" or "tested quality" once, you are forbidden from using it again in the same payload. Use distinct synonyms (e.g., "rigorously verified", "thoroughly inspected flagships", "diagnostics-cleared hardware").
- BANNED ROBOTIC TELLS: Completely exclude standard repetitive placeholders ("In today's fast-paced digital world", "Look no further", "Not only... but also", "delve").
- NO TRANSACTIONAL DRIFT: Do not mention generic digital checkouts. Focus on driving the user to connect with the team via physical walk-in at RT Nagar, Yeshwanthpur, or Ganganagar, or via direct WhatsApp chat.
- Keep output concise (2 to 3 crisp sentences maximum, plain text, no markdown headings).
`.trim();

export async function generateCleanDeviceCopy(input: {
  deviceBrand: string;
  deviceModel: string;
  conditionScore?: string;
  spec?: string;
  branch?: string;
}): Promise<{ cleanCopy: string; whatsappUrl: string }> {
  const { deviceBrand, deviceModel, conditionScore = "Excellent", spec = "", branch = "RT Nagar" } = input;
  const whatsappUrl = buildWhatsAppIntentUrl(deviceBrand, deviceModel, branch);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      cleanCopy: buildDistinctDeviceCopy({ deviceBrand, deviceModel, conditionScore, spec, branch }),
      whatsappUrl,
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate a conversion-optimized marketing snippet for a pre-owned ${deviceBrand} ${deviceModel} (${spec || "Standard configuration"}) rated at condition ${conditionScore}, available at the ${branch} branch.`,
      config: {
        temperature: 0.25,
        systemInstruction: COPYWRITER_SYSTEM_INSTRUCTION,
      },
    });

    const generated = response.text?.trim();
    return {
      cleanCopy:
        generated ||
        buildDistinctDeviceCopy({ deviceBrand, deviceModel, conditionScore, spec, branch }),
      whatsappUrl,
    };
  } catch {
    return {
      cleanCopy: buildDistinctDeviceCopy({ deviceBrand, deviceModel, conditionScore, spec, branch }),
      whatsappUrl,
    };
  }
}
