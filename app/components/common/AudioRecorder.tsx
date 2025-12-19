"use client";

import React, {useState, useRef, useEffect} from "react";
import {ArrowUp, Mic, X} from "lucide-react";
import {Spinner} from "@heroui/react";
import RecordingVisualizer from "@/app/components/common/RecordingTimer";
import {useDevice} from '@/app/utils/providers/MobileDetect';
import {useMainContext} from "@/app/context";

// 👇 Добавлено: тип для Recorder.js (если ты создал .d.ts)
import Recorder from "recorder-js";

export default function AudioRecorder({
                                          onAudioRecorded,
                                          isDisabled = false,
                                          onTranscriptReady,
                                      }: {
    onAudioRecorded?: (blob: Blob) => void;
    isDisabled?: boolean;
    onTranscriptReady?: (text: string) => void;
}) {

    const {language, setLanguage, maxContentWidth, testMobileUi} = useMainContext();
    const {isMobile, isTablet, isDesktop} = useDevice();

    const isMobileUI = testMobileUi || !isDesktop

    const micIconSize = isMobileUI ? 26 : 22
    const micBottonH = isMobileUI ? 60 : 42

    const alertPos = isMobileUI ? 0 : -20;

    const [isRecording, setIsRecording] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const [isInitializingRecording, setIsInitializingRecording] = useState(false);
    const isRecordingInitializing = useRef(false);
    const isFingerStillDownRef = useRef(false);         // Палец всё ещё на экране

    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTapModeRef = useRef(false);

    // 👇 Добавлено: рекордер и контекст
    const recorderRef = useRef<Recorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasFatalError, setHasFatalError] = useState(false);

    const [noAudioDetected, setNoAudioDetected] = useState(false);
    const hasAudioSignalRMS = async (blob: Blob): Promise<boolean> => {
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0); // Первый канал

        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
            sumSquares += channelData[i] ** 2;
        }
        const rms = Math.sqrt(sumSquares / channelData.length);
        console.log("🎚 RMS громкость:", rms);
        return rms > 0.01; // если ниже — считаем тишиной
    };

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        recorderRef.current = new Recorder(audioContextRef.current);
    }, []);

    const startRecording = async () => {
        console.log("Start Recording")
        setIsInitializingRecording(true);
        isRecordingInitializing.current = true;
        isFingerStillDownRef.current = true;

        setNoAudioDetected(false)
        setShowSpinner(true);

        try {
            await new Promise((r) => setTimeout(r, 500));

            await playStartClick();
            if (isDesktop) {

            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });

            streamRef.current = stream;

            await recorderRef.current?.init(stream);
            await audioContextRef.current?.resume(); // 💥 важный момент!
            await recorderRef.current?.start();

            console.log("Началась реальная запись")

        } catch (err) {
            console.error("🎙 Ошибка доступа к микрофону:", err);
            alert("Не удалось получить доступ к микрофону");
            setShowSpinner(false);
        } finally {
            setShowSpinner(false);
            setIsRecording(true);
            setIsInitializingRecording(false);
            isRecordingInitializing.current = false;
            //isFingerStillDownRef.current = false;
            console.log("Началась реальная запись Finally")
        }
    };

    useEffect(() => {
        if (

            !isFingerStillDownRef.current && // палец уже убрали
            !isTapModeRef.current &&         // это не короткий тап
            isRecording                      // запись началась
        ) {
            console.log("✋ Палец отпущен до начала записи");
            console.log(isFingerStillDownRef.current)

            const timeout = setTimeout(() => {
                if (isRecording) {
                    stopRecording();
                }
            }, 500);

            return () => clearTimeout(timeout); // очищаем, если что-то изменится до окончания
        }
    }, [isRecording]);

    const stopRecording = () => {
        console.log("Stop Recording")

        return new Promise<void>(async (resolve) => {

            if (!isRecording || !recorderRef.current) {
                resolve();
                return;
            }

            try {
                const {blob} = await recorderRef.current.stop();

                console.log("Реальная остановка записи")

                setShowSpinner(true);
                setIsRecording(false);

                await playStopClick();
                if (isDesktop) {

                }

                // Проверяем RMS:
                // const hasSound = await hasAudioSignalRMS(blob);
                // if (!hasSound) {
                //     setNoAudioDetected(true);
                //     //console.log("🚫 Нет звукового сигнала. Whisper не вызывается.");
                // }

                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                if (onAudioRecorded) onAudioRecorded(blob);

                // if (audioElementRef.current) {
                //     audioElementRef.current.src = url;
                //     audioElementRef.current.currentTime = 0;
                //     audioElementRef.current.play().catch(console.warn);
                // }

                streamRef.current?.getTracks().forEach((track) => track.stop());
                streamRef.current = null;

                const startTime = Date.now();

                let data: any = null;
                let hasError = false;

                try {
                    const formData = new FormData();
                    formData.append("file", blob, "audio.wav");

                    console.log("📤 BLOB до создания File:");
                    console.log("    • blob.size:", blob.size);
                    console.log("    • blob.type:", blob.type);

                    const response = await fetch("/api/whisper", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        console.error("❌ HTTP ошибка:", response.status);
                        throw new Error(`Whisper API HTTP error: ${response.status}`);
                    }

                    try {
                        data = await response.json();
                        console.log("Получен ответ от Whisper")

                    } catch (jsonErr) {
                        console.error("Ошибка парсинга JSON:", jsonErr);
                        hasError = true;
                    }

                    if (!hasError && data?.text) {
                        const textFromWhisper = data.text.trim();

                        const partialMatch = [
                            "субтитры",
                            "субтитров",
                            "с вами был игорь"
                        ];

                        const exactMatch = [
                            "удачи",
                            "заебись",
                            "продолжение следует",
                            "подписывайтесь на наш канал",
                            "подпишись",
                            "спасибо за просмотр",
                            "😎",
                            "🙂"
                        ];

                        // Очищаем от лишних символов
                        const cleanText = textFromWhisper.toLowerCase().replace(/[.,!?;:]/g, "");

                        // 1. Проверка частичных совпадений
                        const hasPartial = partialMatch.some(word =>
                            cleanText.includes(word.toLowerCase())
                        );
                        // 2. Проверка полных совпадений (весь текст должен совпадать с одним из)
                        const hasExact = exactMatch.some(word =>
                            cleanText === word.toLowerCase()
                        );
                        const isGarbage = hasPartial || hasExact;

                        const isValid = !isGarbage

                        //let gptReply: string | null = null;
                        // if (isValid) {
                        //     try {
                        //         gptReply = await checkWithGPT(textFromWhisper); // 🧠 ждём GPT
                        //
                        //         console.log("Получен ответ от GPT")
                        //     } catch (err) {
                        //         console.error("❌ Ошибка GPT:", err);
                        //         gptReply = null;
                        //     }
                        // }

                        const duration = Date.now() - startTime;
                        const delay = Math.max(1000 - duration, 0);

                        setTimeout(() => {
                            setShowSpinner(false);

                            if (!isValid) {
                                setNoAudioDetected(true);
                                console.log("Не удалось распознать речь");
                                console.log(textFromWhisper);
                            } else {
                                onTranscriptReady?.(textFromWhisper);
                                //onTranscriptReady?.(gptReply || textFromWhisper);
                            }
                            resolve();
                        }, delay);
                        //
                        return;
                    }

                    // если дошло сюда и нет текста — тоже ошибка
                    throw new Error("Ответ не содержит текста");

                } catch (err) {
                    console.error("Ошибка запроса Whisper API:", err);
                    setHasFatalError(true); // ✅ показать сообщение об ошибке
                    setShowSpinner(false);
                    resolve();
                }
            } catch (e) {
                console.error("Ошибка при остановке записи:", e);
                setShowSpinner(false);
                setIsRecording(false);
                setHasFatalError(true); // ✅ показать сообщение об ошибке
                resolve();
            }
        });
    };

    const toggleRecording = () => {
        if (isRecording) {
            //playStopClick();
            stopRecording();
        } else {
            //playStartClick();
            startRecording();
        }
    };

    const playSound = (src: string) => {
        return new Promise<void>((resolve, reject) => {
            const audio = new Audio(src);
            audio.onended = () => resolve(); // Разрешаем промис, когда звук завершает воспроизведение
            audio.onerror = (e) => reject(e); // Отклоняем промис, если произошла ошибка
            audio.play().catch((e) => {
                console.warn("Не удалось воспроизвести звук:", e);
                reject(e);
            });
        });
    };

    function playStartClick() {
        return playSound("/sounds/start.wav");
    }

    function playStopClick() {
        return playSound("/sounds/stop.wav");
    }

    const playSound2 = async (src: string) => {
        const audio = new Audio(src);
        audio.play().catch((e) => console.warn("Не удалось воспроизвести звук:", e));
    };

    const checkWithGPT = async (text: string): Promise<string | null> => {
        try {
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: text,
                    mode: "checkWhisper",
                }),
            });

            const data = await response.json();

            if (data?.reply) {
                return data.reply;
            } else {
                console.warn("❗️GPT не вернул reply");
                return null;
            }
        } catch (e) {
            console.error("Ошибка при проверке текста:", e);
            return null;
        }
    };

    useEffect(() => {
        if (!noAudioDetected) return;

        const handleClick = () => {
            setNoAudioDetected(false);
        };

        window.addEventListener("pointerdown", handleClick);

        return () => {
            window.removeEventListener("pointerdown", handleClick);
        };
    }, [noAudioDetected]);

    useEffect(() => {
        if (!hasFatalError) return;

        const handleClick = () => {
            setHasFatalError(false);
        };

        window.addEventListener("pointerdown", handleClick);
        return () => window.removeEventListener("pointerdown", handleClick);
    }, [hasFatalError]);

    const isRecordButtonDisabled = isDisabled || isRecordingInitializing.current;

    return (
        <>

            {hasFatalError && !showSpinner && (
                <div
                    className={`absolute flex items-center justify-center  left-1/2 transform -translate-x-1/2 z-50 text-[16px] 
        text-danger-500 bg-content2 p-3 rounded-xl text-center min-h-[54px] min-w-[54px] shadow-md
        transition-all duration-500 ease-in-out opacity-100`}
                    style={{ top: `${alertPos}px` }}
                >
                    Произошла ошибка. Повторите.
                </div>
            )}

            <div
                className={`absolute flex items-center justify-center left-1/2 transform -translate-x-1/2 z-50 text-[16px] 
                text-danger-500
    bg-content2 p-3 rounded-xl text-center min-h-[54px] min-w-[54px] shadow-md
    transition-all duration-500 ease-in-out 
    ${noAudioDetected && !showSpinner
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"}
  `}
                style={{ top: `${alertPos}px` }}
            >
                К сожалению, не удалось распознать ни одного слова(
            </div>

            <div
                className={`absolute flex items-center justify-center top-[14px] left-1/2 transform -translate-x-1/2 z-50 text-sm text-default-500
    bg-content2 p-3 rounded-xl text-center min-h-[54px] min-w-[120px] shadow-md
    transition-all duration-300 ease-in-out 
    ${!isDesktop && !isTapModeRef.current && (isRecording || showSpinner)
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"}
  `}

            >
                {showSpinner ? <Spinner size="sm"/> : ""}
                {isRecording ? <RecordingVisualizer isRecording/> : ""}
            </div>

            <div className="relative select-none">

            <span
                role="button"
                tabIndex={0}

                onPointerDown={(e) => {
                    if (isRecordButtonDisabled) return;
                    console.log("onPointerDown")

                    isTapModeRef.current = true;
                    isFingerStillDownRef.current = true;

                    tapTimeoutRef.current = setTimeout(() => {
                        console.log("РЕЖИМ УДЕРЖАНИЯ")
                        // если палец не отпущен через 300мс — это удержание
                        isTapModeRef.current = false;
                        startRecording();
                    }, 300);

                }}

                onPointerUp={async () => {
                    if (isDisabled) return;

                    console.log("onPointerUp")

                    isFingerStillDownRef.current = false;

                    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

                    if (isRecordingInitializing.current) {
                        console.log("⏳ Ещё идёт инициализация, ждём авто-стоп позже...");
                        return;
                    }

                    if (isTapModeRef.current) {
                        toggleRecording();
                    } else {
                        if (isRecording) stopRecording();
                    }
                }}

                className={`
          w-[60px] h-[60px] rounded-full flex items-center justify-center text-white transition duration-300
          ${
                    isDisabled
                        ? "bg-default-300 cursor-not-allowed"
                        : isRecording
                            ? `bg-red-500 ${!isDesktop ? "" : "hover:bg-red-400"}`
                            : `bg-blue-500 ${!isDesktop ? "" : "hover:bg-blue-400"}`
                }
        `}
                style={{
                    width: `${micBottonH}px`,
                    height: `${micBottonH}px`,
                }}

            >
        {(showSpinner && (isDesktop || isTapModeRef.current)) ? (
            <Spinner size="sm" color="white"/>
        ) : (
            <Mic
                size={micIconSize}
                className={isRecording ? "deep-pulse text-white" : "text-white"}
            />
        )}
      </span>
                {/*<audio ref={audioElementRef} hidden preload="auto" playsInline />*/}
            </div>
        </>
    );

}