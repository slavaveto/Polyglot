"use client";

import {useEffect, useRef, useState, useCallback} from "react";
import {Textarea, Spinner} from "@heroui/react";
import {useMainContext} from "@/app/context";
import debounce from 'lodash.debounce';
import LanguageSelect from "@/app/components/common/LanguageSelect";


interface DictionaryWord {
    word: string;
    freq: number;
}

export default function TabThree() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {language, setLanguage} = useMainContext();
    const [text, setText] = useState("");

    const [dictionary, setDictionary] = useState<DictionaryWord[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [returnedText, setReturnedText] = useState<string | null>(null);

    const dictionaryCache: Record<string, DictionaryWord[]> = {};
    useEffect(() => {
        // Если словарь уже загружен, используем кэш
        if (dictionaryCache[language]) {
            setDictionary(dictionaryCache[language]);
            return;
        }
        // Если нет — загружаем и кэшируем
        fetch(`/dict/${language}_words.json`)
            .then(res => res.json())
            .then((data: DictionaryWord[]) => {
                dictionaryCache[language] = data; // Кэшируем
                setDictionary(data);
            })
            .catch(e => console.error("Ошибка загрузки словаря:", e));
    }, [language]);

    const removeAccents = (str: string): string =>
        str.normalize("NFD")
            // .replace(/[\u0300-\u036f]/g, "") // Убираем акценты включать только для испанского
            .replace(/є/g, "э") //

    const handlePredict = useCallback(
        debounce((text: string) => {
            const words = text.split(/[\s\n]+/);
            const lastWord = words.pop() || "";
            const lowerLastWord = lastWord.toLowerCase();

            if (lastWord.length === 0) {
                setSuggestions([]);
                return;
            }

            const matches = dictionary
                // .filter(item => item.word.startsWith(lastWord))
                //даем возможность искать по буквам без акцента (что особенно важно для испанского)
                .filter(item =>
                    item.word &&
                    removeAccents(item.word.toLocaleLowerCase()).startsWith(removeAccents(lowerLastWord)) // 🔥 Теперь ищет и по "й", и по "и"
                )

                .sort((a, b) => b.freq - a.freq)
                .slice(0, 5)
                .map(item => {
                    // Сразу отображаем с заглавной, если слово начато с заглавной
                    return lastWord[0] === lastWord[0].toLocaleUpperCase()
                        ? item.word.charAt(0).toLocaleUpperCase() + item.word.slice(1)
                        : item.word;
                });

            setSuggestions(matches);
        }, 150),
        [dictionary]
    );

    const [popup, setPopup] = useState<{ word: string; position: { x: number; y: number } } | null>(null);

    const highlightWordsWithOne = (text: string) => {
        const words = text.split(/(\s+|[.!?]+)/); // Разделяем слова и пунктуацию
        return words.map((segment, index, array) => {
            if (!segment.trim()) return segment; // ✅ Оставляем пробелы как есть

            // Проверяем, есть ли после слова знак окончания предложения
            const isEndOfSentence = index < array.length - 1 && /[.!?]/.test(array[index + 1]);

            if (segment.includes("1")) {
                return (
                    <span key={index} style={{whiteSpace: "pre"}}>
                    <span
                        className="underline decoration-red-500 cursor-pointer"
                        onDoubleClick={(e) => openCorrectionPopup(e, segment)}
                    >
                        {segment}
                    </span>
                </span>
                );
            }

            return <span key={index} style={{whiteSpace: "pre"}}>{segment}</span>;
        });
    };

    // Замена слова на исправленный вариант
    const replaceWord = (oldWord: string, newWord: string) => {
        setText((prev) =>
            prev
                .split(/\s+/)
                .map((word) => (word === oldWord ? newWord : word))
                .join(" ")
        );
        setPopup(null);
    };

    // Открытие popup при ДВОЙНОМ клике
    const openCorrectionPopup = (event: React.MouseEvent, word: string) => {
        event.stopPropagation(); // ✅ Предотвращаем всплытие клика

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        setTimeout(() => { // 🔥 Добавляем небольшую задержку, чтобы `handleClickOutside` не срабатывал мгновенно
            setPopup({
                word,
                position: {
                    x: rect.left,
                    y: rect.top + window.scrollY - 60 // 🔥 Смещаем popup вверх на 40px
                },
            });
        }, 50);
    };

    // Закрытие popup при клике вне его
    useEffect(() => {
        const handleClickOutside = () => setPopup(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const punctuationMarks = ['.', ',', '!', '?', ':', ';'];
    const handleTextareaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let newValue = e.target.value;

        // Проверяем, если пользователь поставил знак препинания после пробела, убираем лишний пробел
        if (newValue.length > text.length) {
            const lastChar = newValue.slice(-1);
            const secondLastChar = newValue.slice(-2, -1);

            if (punctuationMarks.includes(lastChar) && secondLastChar === ' ') {
                newValue = newValue.slice(0, -2) + lastChar;
            }
        }
        setText(newValue);
        handlePredict(newValue);
    };

    const endPunctuationMarks = [".", "!", "?"]; // ✅ Знаки завершения предложения
    const useDelayedSentenceCheck = (text: string, delay = 500) => {
        const [completedText, setCompletedText] = useState("");

        useEffect(() => {
                const lastChar = text.slice(-1);
                const secondLastChar = text.slice(-2, -1);

                // ✅ Если завершено предложение (". ! ?" перед пробелом) — сразу обновляем
                if (lastChar === " " && endPunctuationMarks.includes(secondLastChar)) {
                    // if (lastChar === " ") {
                    console.log("✅ Завершено предложение:", text);

                    fetchTranslation (text)
                    // setCompletedText(text);
                    return; // ⛔ Не запускаем debounce, если уже обновили
                }

                // ✅ Если текст просто останавливается — ждем 500 мс перед обновлением
                // const debouncedUpdate = debounce(() => {
                //     console.log("⌛ 500 мс прошло, обновляем:", text);
                //     setCompletedText(text);
                // }, delay);

                // debouncedUpdate();
                // return () => debouncedUpdate.cancel();

            }, [text]
        );
        return completedText;
    };
    const completedText = useDelayedSentenceCheck(text, 500); // ✅ Используем кастомный хук

    const [isLoading, setIsLoading] = useState(false); // 🔥 Контроль спиннера
    // Функция для отправки текста в API
    const fetchTranslation = async (text: string) => {
        try {

            setIsLoading(true); // 🟢 Запускаем спиннер
            const startTime = Date.now(); // 🕒 Засекаем время начала

            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: text,
                    language,
                    mode: "writing",
                }),
            });

            const data = await response.json();

            const elapsedTime = Date.now() - startTime; // ⏳ Время выполнения запроса
            const remainingTime = Math.max(500 - elapsedTime, 0); // ❗ Минимум 1 секунда

            setTimeout(() => {
                console.log(data.reply)
                setReturnedText(data.reply || "Ошибка перевода");
                setIsLoading(false); // 🔴 Отключаем спиннер
            }, remainingTime);

        } catch (error) {
            setReturnedText("Ошибка перевода");
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<EventTarget>) => {
        const target = e.target as HTMLTextAreaElement; // ✅ Принудительно указываем тип
        if (e.key === " ") {

        }
    };

    const handleLanguageChange = (newLanguage: string) => {
        setSuggestions([]);
        setText(""); // 🔥 Очищаем текстовое поле
        // setMisspelledWords([]);
        setTimeout(() => setLanguage(newLanguage), 10);
    };

    const insertWord = (word: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = text.slice(0, cursorPos);
        const textAfterCursor = text.slice(cursorPos);

        const textParts = textBeforeCursor.split(/[\s\n]+/);
        textParts.pop();
        const newText = [...textParts, word].join(' ') + ' ';

        const finalText = newText + textAfterCursor;

        setText(finalText); // ✅ обновляем state (React-стиль)

        // Возвращаем фокус в textarea и двигаем курсор
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newText.length, newText.length);
        }, 10);

        setSuggestions([]);
    };

    return (
        <div className="flex flex-col flex-1">
            <LanguageSelect language={language} setLanguage={handleLanguageChange} textareaRef={textareaRef}/>

            {popup && (
                <div
                    className="absolute bg-white border border-gray-300 shadow-md p-2 rounded"
                    style={{top: popup.position.y, left: popup.position.x}}
                    onClick={(e) => e.stopPropagation()} // Не закрывать при клике на сам popup
                >
                    <button
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => replaceWord(popup.word, popup.word.replace(/1/g, ""))}
                    >
                        {popup.word.replace(/1/g, "")}
                    </button>
                </div>
            )}

            {suggestions.length > 0 && (
                <div
                    className="absolute bottom-[70px] left-[20px] flex gap-2 z-10">
                    {suggestions.map((word) => (
                        <button
                            key={word}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => insertWord(word)}
                        >
                            {word}
                        </button>
                    ))}
                </div>
            )}

            <div className="absolute w-full bottom-3 pt-[4px] left-0 px-3">
                <Textarea
                    ref={textareaRef}
                    id="textarea-three"
                    placeholder={"Спросите что-нибудь..."}
                    color={"primary"}
                    spellCheck="false"
                    className="w-full resize-none cursor-text focus:border-1"
                    style={{
                        paddingTop: "4px",
                        paddingRight: "30px",
                        paddingLeft: "24px",
                        fontSize: "14px",
                        cursor: "text",
                    }}
                    minRows={1}
                    maxRows={5}
                    value={text} // ✅ используем state

                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                />
            </div>

            <div className="absolute bottom-[150px] px-3">
                {isLoading ? (
                    <div className="flex items-center gap-2 opacity-100 transition-opacity duration-500">
                        <Spinner variant={"wave"} size="sm"/>
                    </div>
                ) : (
                    <span className="opacity-100 transition-opacity duration-500">{returnedText}</span>
                )}
            </div>

        </div>
    );
}