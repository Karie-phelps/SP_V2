"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as ProgressAPI from "@/lib/api/progress";
import { initSrsCard, isDue, applySm2, type SrsCardState, type SrsGrade } from "@/utils/srs";

const STORAGE_KEY = "vocab-srs-v1";

type SrsMap = Record<number, SrsCardState>;

function loadFromStorage(): SrsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(map: SrsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function useSRS(allIds: number[]) {
  const { user, tokens } = useAuth();
  const [store, setStore] = useState<SrsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const prevIdsRef = useRef<string>("");

  // Load SRS data from backend or localStorage
  const syncSRS = async () => {
    if (!user || !tokens) {
      // Load from localStorage if not authenticated
      const localStore = loadFromStorage();
      let changed = false;
      
      for (const id of allIds) {
        if (!localStore[id]) {
          localStore[id] = initSrsCard(id);
          changed = true;
        }
      }
      
      if (changed) saveToStorage(localStore);
      setStore(localStore);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await ProgressAPI.getAllSRSCards();
      
      // Convert backend format to frontend format
      const backendStore: SrsMap = {};
      response.all_cards.forEach((card) => {
        backendStore[card.word_id] = {
          wordId: card.word_id,
          repetitions: card.repetitions,
          easinessFactor: card.easiness_factor,
          interval: card.interval,
          nextReview: new Date(card.next_review),
        };
      });

      // Add missing cards (words that exist but don't have SRS data yet)
      let needsSync = false;
      for (const id of allIds) {
        if (!backendStore[id]) {
          backendStore[id] = initSrsCard(id);
          needsSync = true;
        }
      }

      setStore(backendStore);
      saveToStorage(backendStore); // Backup to localStorage
      
    } catch (error) {
      console.error("Failed to load SRS data from backend:", error);
      
      // Fallback to localStorage
      const localStore = loadFromStorage();
      setStore(localStore);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const idsKey = allIds.sort((a, b) => a - b).join(",");
    
    if (idsKey === prevIdsRef.current) return;
    prevIdsRef.current = idsKey;

    syncSRS();
  }, [allIds, user?.id]);

  const dueIds = allIds.filter((id) => store[id] && isDue(store[id], new Date()));

  const grade = async (id: number, g: SrsGrade) => {
    const currentCard = store[id] ?? initSrsCard(id);
    const updatedCard = applySm2(currentCard, g);

    // Optimistic update
    setStore((prev) => {
      const next = { ...prev, [id]: updatedCard };
      saveToStorage(next);
      return next;
    });

    // Sync to backend
    if (user && tokens) {
      try {
        const backendCard = await ProgressAPI.updateSRSCard(id, g);
        
        // Update with backend response (in case of drift)
        setStore((prev) => ({
          ...prev,
          [id]: {
            wordId: backendCard.word_id,
            repetitions: backendCard.repetitions,
            easinessFactor: backendCard.easiness_factor,
            interval: backendCard.interval,
            nextReview: new Date(backendCard.next_review),
          },
        }));
      } catch (error) {
        console.error("Failed to update SRS card on backend:", error);
        // Keep the optimistic update even if backend fails
      }
    }
  };

  return { 
    dueIds, 
    grade, 
    get: (id: number) => store[id],
    isLoading,
    syncSRS,
  };
}