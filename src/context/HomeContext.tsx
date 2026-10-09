import {
  HOME_BRIDGE_JOURNAL,
  BUSINESS_LEDGER_KEY,
  assertBusinessTransfersCompatible,
} from '../utils/homeBusinessStorage';
import React, { createContext, useContext, useRef, useState } from 'react';
import { HomeData } from '../types/home';
import { HOME_STORAGE_KEY, emptyHome, validateHomeData } from '../utils/home';

interface HomeContextValue {
  data: HomeData;
  storageError: string;
  update: (operation: (current: HomeData) => HomeData) => void;
  importData: (value: unknown) => void;
  refreshFromStorage: () => void;
  storedRaw: () => string | null;
}
const HomeContext = createContext<HomeContextValue | undefined>(undefined);
export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(() => {
    try {
      const saved = localStorage.getItem(HOME_STORAGE_KEY);
      const loaded = saved ? validateHomeData(JSON.parse(saved)) : validateHomeData(emptyHome());
      assertBusinessTransfersCompatible(
        loaded,
        JSON.parse(localStorage.getItem(BUSINESS_LEDGER_KEY) || '[]'),
      );
      return {
        data: loaded,
        error: '',
        raw: saved,
      };
    } catch {
      return {
        raw: undefined,
        data: emptyHome(),
        error:
          'Não foi possível ler os dados do Home. O conteúdo original foi preservado. Importa uma cópia válida ou verifica o armazenamento do navegador.',
      };
    }
  });
  const [data, setData] = useState<HomeData>(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const current = useRef(data);
  const savedRaw = useRef(initial.raw);
  const save = (next: HomeData) => {
    next = validateHomeData(next);
    assertBusinessTransfersCompatible(
      next,
      JSON.parse(localStorage.getItem(BUSINESS_LEDGER_KEY) || '[]'),
    );
    if (localStorage.getItem(HOME_BRIDGE_JOURNAL))
      throw new Error(
        'Existe uma transferência pendente. Recarrega para recuperar.',
      );
    try {
      const stored = localStorage.getItem(HOME_STORAGE_KEY);
      if (savedRaw.current !== undefined && stored !== savedRaw.current)
        throw new Error(
          'Há alterações do Home noutra aba. Recarrega a página antes de continuar.',
        );
      const encoded = JSON.stringify(next);
      localStorage.setItem(HOME_STORAGE_KEY, encoded);
      savedRaw.current = encoded;
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('noutra aba')
          ? error.message
          : 'A alteração não foi guardada. Exporta uma cópia e verifica o espaço ou as permissões do armazenamento do navegador.';
      setStorageError(message);
      throw new Error(message);
    }
    current.current = next;
    setData(next);
    setStorageError('');
  };
  const update = (operation: (current: HomeData) => HomeData) => {
    if (initial.error && storageError)
      throw new Error('Recupera primeiro os dados com uma cópia válida.');
    save(operation(current.current));
  };
  return (
    <HomeContext.Provider
      value={{
        data,
        storageError,
        update,
        storedRaw: () => {
          if (savedRaw.current === undefined)
            throw new Error('Recupera primeiro os dados Home.');
          return savedRaw.current;
        },
        refreshFromStorage: () => {
          const raw = localStorage.getItem(HOME_STORAGE_KEY);
          const next = raw ? validateHomeData(JSON.parse(raw)) : validateHomeData(emptyHome());
          savedRaw.current = raw;
          current.current = next;
          setData(next);
          setStorageError('');
        },
        importData: (value) => {
          const next = validateHomeData(value);
          assertBusinessTransfersCompatible(
            next,
            JSON.parse(localStorage.getItem(BUSINESS_LEDGER_KEY) || '[]'),
          );
          save(next);
        },
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
export function useHome() {
  const context = useContext(HomeContext);
  if (!context) throw new Error('HomeProvider necessário.');
  return context;
}
