import { useState, useEffect } from "react";

export default function usePersistentState<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(defaultValue);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const savedValue = localStorage.getItem(key);
            if (savedValue !== null) {
                setState(JSON.parse(savedValue));
            }
        } catch (err) {
            console.warn(`⚠️ Ошибка парсинга JSON из localStorage для ключа "${key}":`, err);
            localStorage.removeItem(key); // Удаляем невалидное значение
        }

        setIsMounted(true);
    }, [key]);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem(key, JSON.stringify(state));
        }
    }, [key, state, isMounted]);

    return [state, setState] as const;
}