"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface LevelUpModalProps {
  isOpen: boolean;
  fromLevel: string;
  toLevel: string;
  icon: string;
  onClose: () => void;
}

export default function LevelUpModal({
  isOpen,
  fromLevel,
  toLevel,
  icon,
  onClose,
}: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#9333ea", "#ec4899", "#06b6d4", "#fbbf24"],
      });

      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-6xl mb-4"
              >
                {icon}
              </motion.div>
              <h2 className="text-3xl font-bold text-purple-900 mb-2">
                Level Up!
              </h2>
              <p className="text-gray-600 mb-4">
                You've advanced from{" "}
                <span className="font-bold capitalize">{fromLevel}</span> to{" "}
                <span className="font-bold capitalize text-purple-600">
                  {toLevel}
                </span>
                !
              </p>
              <p className="text-sm text-gray-500">
                Keep up the great work! 🎉
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
