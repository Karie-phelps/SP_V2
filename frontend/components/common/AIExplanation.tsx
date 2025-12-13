"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, BookOpen, Clock } from "lucide-react";

type Props = {
  mode: "quiz" | "fill-blanks";
  word: string;
  correct: string;
  selected?: string;
  showProTip?: boolean;
};

interface ParsedExplanation {
  whyCorrect: string;
  whyWrong: string;
  vocabNote: string;
  timePressureTip: string;
}

export default function AIExplanation({
  mode,
  word,
  correct,
  selected,
  showProTip = true,
}: Props) {
  const [parsed, setParsed] = useState<ParsedExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");

  const parseExplanation = (text: string): ParsedExplanation => {
    console.log("Raw explanation text:", text);

    const lines = text.split("\n").filter((line) => line.trim());
    const bullets: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Match various bullet formats: 1), 1., -, •, *
      if (trimmed.match(/^(\d+[\)\.]|[-•*])\s*/)) {
        const cleaned = trimmed
          .replace(/^(\d+[\)\.]|[-•*])\s*/, "")
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .trim();
        if (cleaned) bullets.push(cleaned);
      }
    });

    console.log("Extracted bullets:", bullets);

    return {
      whyCorrect: bullets[0] || "",
      whyWrong: bullets[1] || "",
      vocabNote: bullets[2] || "",
      timePressureTip: bullets[3] || "",
    };
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, word, correct, selected }),
        });
        const data = await res.json();

        console.log("API Response:", data);

        if (!ignore) {
          if (res.ok && data.explanation) {
            setRawText(data.explanation);
            const parsed = parseExplanation(data.explanation);
            console.log("Parsed explanation:", parsed);
            setParsed(parsed);
          } else {
            setErr(data.error ?? "Failed to get explanation");
          }
        }
      } catch (e: any) {
        console.error("Fetch error:", e);
        if (!ignore) setErr("Network error");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [mode, word, correct, selected]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  if (err)
    return (
      <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
        {err}
      </div>
    );

  // Fallback: show raw text if parsing failed
  if (
    !parsed ||
    (!parsed.whyCorrect &&
      !parsed.whyWrong &&
      !parsed.vocabNote &&
      !parsed.timePressureTip)
  ) {
    if (rawText) {
      return (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 whitespace-pre-line">
              {rawText}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Why Correct */}
      {parsed.whyCorrect && (
        <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900 text-sm mb-1">
              Why it's correct:
            </h4>
            <p className="text-sm text-green-800">{parsed.whyCorrect}</p>
          </div>
        </div>
      )}

      {/* Why Wrong */}
      {parsed.whyWrong && (
        <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 text-sm mb-1">
              Why it's wrong:
            </h4>
            <p className="text-sm text-red-800">{parsed.whyWrong}</p>
          </div>
        </div>
      )}

      {/* Vocab/Grammar Note */}
      {/* {parsed.vocabNote && (
        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">
              Quick note:
            </h4>
            <p className="text-sm text-blue-800">{parsed.vocabNote}</p>
          </div>
        </div>
      )} */}

      {/* Time-Pressure Tip - HIGHLIGHTED - Only shown if showProTip is true */}
      {/* {showProTip && parsed.timePressureTip && (
        <div className="flex gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-2">
              Pro Tip:
            </h4>
            <p className="text-sm text-amber-900 font-medium">
              {parsed.timePressureTip}
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
}
