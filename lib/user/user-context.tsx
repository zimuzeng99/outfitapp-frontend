import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { createUser } from '@/lib/api/users';
import { TEST_USER_ID } from '@/lib/config';

const STORAGE_KEY = 'outfitapp.userId';

type UserContextValue = {
  userId: string | null;
  ready: boolean;
  error: string | null;
  retry: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

async function loadOrCreateUserId(): Promise<string> {
  if (TEST_USER_ID) {
    await AsyncStorage.setItem(STORAGE_KEY, TEST_USER_ID);
    return TEST_USER_ID;
  }

  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved) {
    return saved;
  }

  const userId = Crypto.randomUUID();
  await AsyncStorage.setItem(STORAGE_KEY, userId);
  return userId;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setReady(false);
      setError(null);

      try {
        const id = await loadOrCreateUserId();
        await createUser({ id });
        if (!cancelled) {
          setUserId(id);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to create user';
          setUserId(null);
          setReady(false);
          setError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({
      userId,
      ready,
      error,
      retry,
    }),
    [userId, ready, error, retry],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

export function useUserId(): string {
  const { userId, ready } = useUser();
  if (!ready || !userId) {
    throw new Error('useUserId requires a ready user session');
  }
  return userId;
}
