"use client";

import {useState, useRef} from "react";
import {Volume2, X} from "lucide-react";
import {Spinner} from "@heroui/react";
import { SpeakerWaveIcon } from "@heroicons/react/24/outline";

export default function TextToSpeech({text, language}: { text: string; language: string }) {
    const [isSpeaking, setIsSpeaking] = useState(false); // 🔊 Контроль озвучки
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchSpeech = async () => {
        setIsSpeaking(true);
        setTimeout(async () => {
            try {
                const response = await fetch("/api/speech", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({text, language}),
                });

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Создаем аудио-объект и запускаем воспроизведение
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.oncanplaythrough = () => {
                    setIsSpeaking(false); // ✅ Отключаем спиннер, когда аудио готово
                    audio.play();
                };

                audio.onended = () => {
                    setIsSpeaking(false); // ✅ Отключаем индикатор после завершения
                };

                audio.onerror = () => {
                    console.error("Ошибка озвучки");
                    setIsSpeaking(false);
                };

            } catch (error) {
                console.error("Ошибка озвучки:", error);
                setIsSpeaking(false);
            }
        }, 300); // 🔥 Короткая задержка, чтобы `click` обработался раньше
    };

    return (
        <button
            className="volume-button ml-3 mt-[2px] text-default-500 hover:text-default-900 transition duration-300"
            disabled={isSpeaking}
        >
            {isSpeaking ? <Spinner size="sm"/> : (
                <SpeakerWaveIcon
                    className="w-5 h-5"
                    data-ignore-popup="true" // 👈 Добавляем атрибут
                    onClick={(e) => {
                        e.stopPropagation(); // ❌ Останавливаем всплытие
                        fetchSpeech(); // ✅ Запускаем озвучку
                    }}
                />
            )}
        </button>
    );
}