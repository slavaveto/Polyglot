"use client";

import {useState, useEffect, useRef} from "react";
import {useMainContext} from "@/app/context";
import {Button, Spinner} from "@heroui/react";
import {Check, Copy, Volume2} from "lucide-react";
import TextToSpeech from "@/app/components/common/TextToSpeech"; // ✅ Импортируем озвучку

//Сейчас двойной клик работает только для области сообщений 1 таба
//Когда доделаешь 3 таб с текстами нужно будет его тоже подключить

export default function WordPopup() {
    const {language, setLanguage, selectedTab, openDetailsModal, openSaveModal} = useMainContext();

    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    const lastSelectedText = useRef<string | null>(null); // 🔥 Храним последнее выделенное слово

    //console.log("🟢 `WordPopup` рендерится, текущий язык:", language);
    const languageRef = useRef(language); // ✅ Сохраняем актуальное значение языка
    const [isLoading, setIsLoading] = useState(false); // 🔥 Контроль спиннера

    useEffect(() => {
        languageRef.current = language; // ✅ Гарантируем актуальное значение
    }, [language]);

    const [context, setContext] = useState("");

    const getFullSentence = (text: string, word: string) => {
        if (!text.includes(word)) return text; // ✅ Проверяем, есть ли слово в тексте

        // 🛑 Разбиваем текст на предложения, учитывая пробелы после знаков препинания
        const sentenceRegex = /[^.!?]+[.!?]/g;
        const sentences = text.match(sentenceRegex) || [text];

        for (const sentence of sentences) {
            if (sentence.includes(word)) {
                return sentence.trim(); // ✅ Нашли предложение с выделенным словом
            }
        }
        return text.trim(); // 🛑 Если ничего не нашли, возвращаем весь текст (лучше, чем пустая строка)
    };

    const [originalWord, setOriginalWord] = useState("");
    const [originalTranslation, setOriginalTranslation] = useState("");
    const [infinitiveWord, setInfinitiveWord] = useState("");
    const [infinitiveTranslation, setInfinitiveTranslation] = useState("");

    // Функция для отправки текста в API
    const fetchTranslation = async (currSelectedText: string) => {
        try {
            //console.log("🔤 Отправляем запрос в API с языком:", languageRef.current);

            const selection = window.getSelection();
            let foundContext = "";

            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const containerText = range.startContainer.textContent || "";

                // ✅ Теперь находим ПОЛНОЕ ПРЕДЛОЖЕНИЕ, даже если оно в начале или в конце
                foundContext = getFullSentence(containerText, currSelectedText);
            }

            setContext(foundContext);

            // setContext((prevContext) => {
            //     console.log("🔥 Новое значение `context`:", foundContext);
            //     return foundContext;
            // });

            setOriginalWord("");
            setOriginalTranslation("");
            setInfinitiveWord("");
            setInfinitiveTranslation("");
            setIsLoading(true); // 🟢 Запускаем спиннер
            const startTime = Date.now(); // 🕒 Засекаем время начала

            // setTimeout(async () => {
                //console.log("🔥 Отправляем в API с контекстом:", currSelectedText);

                const response = await fetch("/api/translate", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        message: currSelectedText,
                        language: languageRef.current,
                        mode: "popup",
                        context: foundContext, // ✅ Передаём контекст слова
                    }),
                });

                const data = await response.json();

                // setOriginalWord(data.original || text);
                // setOriginalTranslation(data.original_translation || "Нет данных");
                // setInfinitiveWord(data.infinitive || text);
                // setInfinitiveTranslation(data.infinitive_translation || "Нет данных");

                const elapsedTime = Date.now() - startTime; // ⏳ Время выполнения запроса
                const remainingTime = Math.max(500 - elapsedTime, 0); // ❗ Минимум 1 секунда

                setTimeout(() => {
                    setTranslatedText(data.reply || "Ошибка перевода");
                    setIsLoading(false); // 🔴 Отключаем спиннер
                }, remainingTime);


        } catch (error) {
            setTranslatedText("Ошибка перевода");
            setIsLoading(false);
        }
    };

    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (selectedTab === "two") {
            setSelectedText(null); // ❌ Очищаем popup при переключении на TabTwo
            setPopupPosition(null);
            return;
        }

        // Функция для поиска контейнера чата
        const findChatContainer = () => document.getElementById("chat-container-translate");
        let chatContainer = findChatContainer();

        // Ждём, пока рендерится новый контент после переключения вкладки
        const waitForChatContainer = setInterval(() => {
            chatContainer = findChatContainer();
            if (chatContainer) {
                clearInterval(waitForChatContainer);
                attachDoubleClickHandler();
            }
        }, 100);

        const handleSelection = (event: MouseEvent) => {
            if (!chatContainer || !chatContainer.contains(event.target as Node)) {
                return; // ❌ Если клик вне чата, не выполняем выделение
            }

            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                const currSelectedText = selection.toString().trim();
                setSelectedText(currSelectedText);
                setTranslatedText(null);

                if (lastSelectedText.current === currSelectedText) return; // ✅ Не вызываем повторно!
                lastSelectedText.current = currSelectedText; // ✅ Обновляем последнее выделенное слово

                //console.log("⚡ Вызов `fetchTranslation` из:", new Error().stack);
                fetchTranslation(currSelectedText);

                // 🔥 Корректируем позицию, чтобы popup не выходил за границы
                const margin = 20; // Отступ от краев
                let newX = rect.left + window.scrollX - 5;
                let newY = rect.top + window.scrollY - 130; // Чуть выше текста

                const popupWidth = 220;
                const popupHeight = 80;

                if (newX + popupWidth > window.innerWidth - margin) {
                    newX = window.innerWidth - popupWidth - margin;
                }

                if (newY < margin) {
                    newY = rect.bottom + window.scrollY + margin; // Опускаем ниже
                }

                setPopupPosition({x: newX, y: newY});

                // ✅ Очищаем предыдущий таймер перед установкой нового
                if (popupTimeoutRef.current) {
                    clearTimeout(popupTimeoutRef.current);
                }
                popupTimeoutRef.current = setTimeout(() => {
                    setSelectedText(null);
                    setPopupPosition(null);
                    setTranslatedText(null);
                    // 🔥 Теперь сбрасываем `lastSelectedText` только когда `popup` ЗАКРЫЛСЯ!
                    setTimeout(() => {
                        lastSelectedText.current = null;
                    }, 300); // 🔥 Даем время на анимацию закрытия
                }, 10000);
            }
        };

        // ✅ Функция для добавления обработчика `dblclick`
        const attachDoubleClickHandler = () => {
            if (chatContainer) {
                chatContainer.addEventListener("dblclick", handleSelection);
            }
        };

        // ✅ Функция для удаления обработчиков
        const removeHandlers = () => {
            if (chatContainer) {
                chatContainer.removeEventListener("dblclick", handleSelection);
            }
            clearTimeout(popupTimeoutRef.current as NodeJS.Timeout);
        };

        attachDoubleClickHandler();

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // ✅ Проверяем data-атрибут, чтобы не закрывать popup при клике на озвучку
            if (target.closest("button.volume-button") || target.dataset.ignorePopup) {
                return;
            }

            // ❌ Закрываем popup, если клик был снаружи
            setSelectedText(null);
            setPopupPosition(null);
            setTranslatedText(null);
            lastSelectedText.current = null;

            // ✅ Очищаем таймер при закрытии вручную
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }
        };

        document.addEventListener("dblclick", handleSelection);

        // document.addEventListener("mouseup", () => {
        //     setTimeout(() => handleSelection(new MouseEvent("mouseup")), 100); // Небольшая задержка для выделения
        // });
        //
        document.addEventListener("click", handleClickOutside);

        return () => {
            removeHandlers();
            clearInterval(waitForChatContainer);

            document.removeEventListener("dblclick", handleSelection);

            // document.removeEventListener("mouseup", () => {
            //     setTimeout(() => handleSelection(new MouseEvent("mouseup")), 100);
            // });

            document.removeEventListener("click", handleClickOutside);

            // ✅ Очищаем таймер при размонтировании
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }
        };
    }, [selectedTab]);


    return (
        <>
            {popupPosition && selectedText && selectedTab !== "two" && ( // ✅ Добавляем проверку рендера

                <div
                    className={"relative flex flex-col text-center bg-content2"}
                    ref={popupRef}
                    style={{
                        position: "absolute",
                        top: popupPosition.y,
                        left: popupPosition.x,
                        padding: "10px",
                        borderRadius: "8px",
                        boxShadow: "0px 2px 10px rgba(0,0,0,0.2)",
                        zIndex: 1000,
                        width: "auto",  // ✅ Убираем фиксированную ширину
                        minWidth: "150px", // ✅ Минимальная ширина
                        maxWidth: "90vw",  // ✅ Максимальная ширина (не больше 90% экрана)
                        whiteSpace: "nowrap",
                        wordWrap: "break-word",
                    }}
                >
                    <div className={"pl-[4px] pr-[4px] flex justify-center items-center"}
                         style={{fontWeight: "bold", fontSize: "16px", margin: 0}}>
                        {selectedText}
                        {/*<TextToSpeech text={selectedText} language={language}/>*/}
                    </div>

                    {/*<div className="text-gray-500 text-sm mt-1">*/}
                    {/*    <p>Контекст: <span className="font-semibold">{infinitiveWord}</span></p>*/}
                    {/*</div>*/}

                    <div className="h-[40px] flex justify-center items-center font-bold">
                        {isLoading ? <Spinner size="sm" variant="wave"/> :
                            <p className={"mt-[5px]"}
                               style={{fontSize: "14px", color: "gray"}}>{translatedText}</p>}
                    </div>

                    <div className="flex flex-row mt-2 justify-center gap-2 items-center">
                        <Button
                            size={"sm"}
                            variant="light"
                            color="primary"
                            onClick={() => openDetailsModal({
                                word: selectedText || "",
                                context: context || ""
                            })}
                        >
                            Подробнее
                        </Button>
                        <Button
                            size={"sm"}
                            variant="light"
                            color="primary"
                            onClick={() => openSaveModal({
                                word: selectedText || "",
                                context: context || ""
                            })}
                        >
                            Сохранить
                        </Button>
                    </div>
                </div>
            )}

        </>
    );
}