"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LexiconItem } from "@/lib/api/exercises";

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  correctAnswer: string;
  lexiconData: LexiconItem | null;
}

export default function AIChatModal({
  isOpen,
  onClose,
  word,
  correctAnswer,
  lexiconData,
}: AIChatModalProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([
        ...messages,
        { role: "user", content: inputMessage },
        {
          role: "assistant",
          content:
            "AI chat functionality is coming soon. For now, review the information provided in the explanation panel.",
        },
      ]);
      setInputMessage("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">AI Assistant</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Context Info */}
            <div className="p-4 bg-blue-50 border-b space-y-2">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Tungkol sa salita:</span> {word}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Tamang sagot:</span>{" "}
                {correctAnswer}
              </p>
              {lexiconData && (
                <p className="text-xs text-blue-700">
                  {lexiconData.base_definition}
                </p>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-semibold mb-2">Kumusta! 👋</p>
                  <p className="text-sm">
                    Magtanong tungkol sa salitang{" "}
                    <span className="font-bold">{word}</span>
                  </p>
                  <p className="text-xs mt-2 text-gray-400">
                    (AI functionality coming soon)
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Magtanong tungkol sa salita..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send • AI chat coming soon
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
