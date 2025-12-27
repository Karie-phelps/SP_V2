"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as ProgressAPI from "@/lib/api/progress";

interface ReviewDeckContextType {
  reviewDeck: number[];
  isLoading: boolean;
  addToReviewDeck: (wordId: number) => Promise<void>;
  removeFromReviewDeck: (wordId: number) => Promise<void>;
  isInReviewDeck: (wordId: number) => boolean;
  clearReviewDeck: () => Promise<void>;
  syncReviewDeck: () => Promise<void>;
}

const ReviewDeckContext = createContext<ReviewDeckContextType | undefined>(
  undefined
);

export function ReviewDeckProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens } = useAuth();
  const [reviewDeck, setReviewDeck] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from backend or localStorage
  const syncReviewDeck = async () => {
    if (!user || !tokens) {
      // Load from localStorage if not authenticated
      const stored = localStorage.getItem("reviewDeck");
      if (stored) {
        try {
          setReviewDeck(JSON.parse(stored));
        } catch (error) {
          console.error("Failed to load review deck from localStorage:", error);
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await ProgressAPI.getReviewDeck();
      const wordIds = response.cards.map((card) => card.word_id);
      setReviewDeck(wordIds);

      // Backup to localStorage
      localStorage.setItem("reviewDeck", JSON.stringify(wordIds));
    } catch (error) {
      console.error("Failed to load review deck from backend:", error);

      // Fallback to localStorage
      const stored = localStorage.getItem("reviewDeck");
      if (stored) {
        try {
          setReviewDeck(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse localStorage backup:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncReviewDeck();
  }, [user?.id]);

  // Sync to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("reviewDeck", JSON.stringify(reviewDeck));
  }, [reviewDeck]);

  const addToReviewDeck = async (wordId: number) => {
    // Optimistic update
    setReviewDeck((prev) => {
      if (prev.includes(wordId)) return prev;
      return [...prev, wordId];
    });

    // Sync to backend
    if (user && tokens) {
      try {
        await ProgressAPI.addToReviewDeck(wordId);
      } catch (error) {
        console.error("Failed to add to review deck:", error);
        // Rollback on error
        setReviewDeck((prev) => prev.filter((id) => id !== wordId));
      }
    }
  };

  const removeFromReviewDeck = async (wordId: number) => {
    // Optimistic update
    setReviewDeck((prev) => prev.filter((id) => id !== wordId));

    // Sync to backend
    if (user && tokens) {
      try {
        await ProgressAPI.removeFromReviewDeck(wordId);
      } catch (error) {
        console.error("Failed to remove from review deck:", error);
        // Rollback on error
        setReviewDeck((prev) => [...prev, wordId]);
      }
    }
  };

  const isInReviewDeck = (wordId: number) => {
    return reviewDeck.includes(wordId);
  };

  const clearReviewDeck = async () => {
    const backup = [...reviewDeck];

    // Optimistic update
    setReviewDeck([]);

    // Sync to backend
    if (user && tokens) {
      try {
        await ProgressAPI.clearReviewDeck();
      } catch (error) {
        console.error("Failed to clear review deck:", error);
        // Rollback on error
        setReviewDeck(backup);
      }
    }
  };

  return (
    <ReviewDeckContext.Provider
      value={{
        reviewDeck,
        isLoading,
        addToReviewDeck,
        removeFromReviewDeck,
        isInReviewDeck,
        clearReviewDeck,
        syncReviewDeck,
      }}
    >
      {children}
    </ReviewDeckContext.Provider>
  );
}

export function useReviewDeck() {
  const context = useContext(ReviewDeckContext);
  if (!context) {
    throw new Error("useReviewDeck must be used within ReviewDeckProvider");
  }
  return context;
}
