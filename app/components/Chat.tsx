"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {Button, Spinner, Textarea} from "@heroui/react";
import {ArrowUp, ArrowDown, Check, Copy, Edit, X, RefreshCcw, Mic} from "lucide-react";
import {useChat} from "@/app/components/useChat";
import LanguageSelect from "@/app/components/common/LanguageSelect";
import {useMainContext} from "@/app/context";
import {useDevice} from '@/app/utils/providers/MobileDetect';
import {languages, languageMeta, languageKeys} from "@/app/utils/languages";
import { useWindowHeightBreakpoint } from "@/app/utils/useWindowHeight"; // путь подстрой


import CopyButton from "@/app/components/common/CopyButton";
import AudioRecorder from "@/app/components/common/AudioRecorder";
import debounce from "lodash.debounce"; // 🔥 Подключаем хук

interface DictionaryWord {
    word: string;
    freq: number;
}

type Message = {
    role: "user";
    content: string;
    id: number;
    isVisible: boolean;
} | {
    role: "assistant";
    content: string;
    id: number;
    isVisible: boolean;
};

export default function TabOne({
                                   messages,
                                   setMessages,
                                   chatHeight,
                                   onKeyboardOpen,
                                   mode,
                               }: {
    messages: Message[];
    setMessages: (messages: (prevMessages: Message[]) => Message[]) => void;
    chatHeight: number;
    onKeyboardOpen?: () => void;
    mode: string;
}) {

    const heightProfile = useWindowHeightBreakpoint();

    const {language, setLanguage, maxContentWidth,
        testMobileUi, selectedLanguages, showPwaPrompt,
        visiblePlaceholderLang, setVisiblePlaceholderLang} = useMainContext();

    const {isMobile, isTablet, isDesktop} = useDevice();

    const isMobileUI = testMobileUi || !isDesktop

    const chatFontSize = isMobileUI ? 18 : 14;
    const minMessageHeight = isMobileUI ? 42 : 37;

    const plaholderFont = isMobileUI ? 16 : 14;
    const minRows = isMobileUI ? 3 : 2;
    const maxRows = isMobileUI ? 8 : 5;

    const noKeyboardPadding = 30

    const buttonsBlockHeight = isMobileUI ? 108 : 60;
    // const bottomBlockPadding = isMobileUI ? 0 : 0;

    const bottomBlockPadding =
        heightProfile <= 600
            ? (isMobileUI ? 0 : 5)
            : (isMobileUI ? 0 : 20);

    const minBottomBlockHeight = isMobileUI ? (buttonsBlockHeight + bottomBlockPadding + 88 + 4)
        : (buttonsBlockHeight + bottomBlockPadding + 64 + 4);



    const sendButtonHeight = isMobileUI ? 40 : 32;

    const basePadding = chatHeight - minMessageHeight - minMessageHeight - 10 - 10 -
        minBottomBlockHeight - 20 - (isDesktop ? 0 : noKeyboardPadding);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    const [isFading, setIsFading] = useState(false);
    const scrollPositionRef = useRef<{ [key: string]: number }>({});

    const paddingBottomRef = useRef<number | null>(null);
    const [isFadingPlaceholder, setIsFadingPlaceholder] = useState(false);

    const handleLanguageChange = (newLanguage: string) => {
        setSuggestions([]);
        //setChatMessage("")
        setIsFading(true);
        setShowScrollToBottom(false);

        // 👇 Плейсхолдер
        setIsFadingPlaceholder(true);
        setTimeout(() => {
            setVisiblePlaceholderLang(newLanguage);
        }, 200); // можно чуть раньше, чтобы плавнее

        //сбрасываем padding у кнопки скролла  при переключении языка после скролла!!!
        setTimeout(() => {
            //при переключении языка сбрасываем padding и скролл
            if (chatRef.current) {
                chatRef.current.style.paddingBottom = `10px`;
                scrollPositionRef.current[language] = chatRef.current.scrollTop;
            }

            paddingBottomRef.current = 10
            //console.log(paddingBottomRef.current)

            const chatContainer = chatRef.current;
            if (!chatContainer) return;

            setTimeout(() => {
                setLanguage(newLanguage); // ✅ Меняем язык
                setIsFading(false); // ✅ Показываем контент снова
                setIsFadingPlaceholder(false);

                // Восстанавливаем скролл
                setTimeout(() => {
                    if (chatRef.current) {
                        chatRef.current.scrollTo({
                            //просто прокручиваем в самый низ, и не надо ничего восстанавливать
                            top: chatRef.current.scrollHeight,
                            behavior: "instant" // моментальная прокрутка вниз
                        });
                    }
                }, 10);
            }, 300);
        }, 300);
    }


    useEffect(() => {
        console.log(language)
        if (!selectedLanguages.includes(visiblePlaceholderLang)) {
            const fallbackLang = selectedLanguages.find(Boolean);
            if (fallbackLang && fallbackLang !== visiblePlaceholderLang) {
                setIsFadingPlaceholder(true);
                setTimeout(() => {
                    setVisiblePlaceholderLang(fallbackLang);
                    setIsFadingPlaceholder(false);
                }, 200);
            }
        }
    }, [selectedLanguages, visiblePlaceholderLang]);


    const {
        sendMessage: sendChatMessage,
        loading: chatLoading,
        isStreaming,
        abortControllerRef,
        message: chatMessage,
        setMessage: setChatMessage,
        streamingMessageIdRef, lastUserMessageIdRef, isShowingSpinner
    } = useChat(messages, setMessages, language, textareaRef, mode);

    const [editingMessage, setEditingMessage] = useState<number | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Убираем дубликаты, если они есть
    useEffect(() => {
        setMessages((prevMessages) => {
            const uniqueMessages = new Map(prevMessages.map(m => [m.id, m]));
            return Array.from(uniqueMessages.values());
        });
    }, []);

    // Edit
    const handleEdit = (index: number) => {
        setEditingMessage(index);
        setChatMessage(messages[index].content);
        if (isDesktop) {
            textareaRef.current?.focus();
        }
        if (chatRef.current) {
            //chatRef.current.style.paddingBottom = `10px`;
            setTimeout(() => {
                chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});
            }, 200);
        }
    };

    const lastUserMessageHeightRef = useRef<number | null>(null); // 🔥 Храним высоту как число
    const handleSendMessage = () => {

        const chatContainer = chatRef.current;
        if (!chatContainer) return;
        const currPadding = parseFloat(window.getComputedStyle(chatRef.current!).paddingBottom) || 0;

        if (chatRef.current && currPadding < 50) {
            chatRef.current.style.paddingBottom = `50px`;
            setTimeout(() => {
                chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});
            }, 50);
        }

        sendChatMessage(chatMessage);

        //console.log("lastUserMessageIdRef.current-" + lastUserMessageIdRef.current)

        setTimeout(() => {
            const lastUserMessageElement = chatRef.current?.querySelector(`[data-key="${lastUserMessageIdRef.current}"]`);
            //console.log("lastUserMessageElement -", lastUserMessageElement);

            if (lastUserMessageElement && chatRef.current) {
                lastUserMessageHeightRef.current = lastUserMessageElement.clientHeight;
                //console.log("📏 Высота элемента (clientHeight):", lastUserMessageHeightRef.current);

                const currPadding = basePadding - lastUserMessageHeightRef.current
                //console.log("currPadding: ", currPadding);

                // chatRef.current.style.paddingBottom = `${basePadding - lastUserMessageHeightRef.current}px`
                chatRef.current.style.paddingBottom = `${basePadding}px`

            } else {
                console.warn("⚠ Элемент не найден через 50 мс!");
            }

        }, 50);

        setTimeout(() => {
            chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});
        }, 400);
    };

    // устанавливаем PaddingBottom при изменении высоты Ответа
    const prevStreamingMessageIdRef = useRef<number | null>(null); // 🔥 Храним предыдущее значение
    useEffect(() => {
        if (!isStreaming || !streamingMessageIdRef.current) return; // Если не стримится, выходим

        if (prevStreamingMessageIdRef.current === streamingMessageIdRef.current) {
            return; // ⛔ Выходим, если ID не изменился
        }

        const streamingElement = chatRef.current?.querySelector(`[data-key="${streamingMessageIdRef.current}"]`);

        if (!streamingElement) {
            console.warn("⚠ Не найдено последнее сообщение!");
            return;
        }

        // 🔥 Следим за изменением размеров и контента
        const observer = new MutationObserver(() => {

            const messageHeight = streamingElement.clientHeight || 0;
            //console.log("📏 Новая высота сообщения:", messageHeight);

            // console.log("lastUserMessageHeightRef.current - " + lastUserMessageHeightRef.current)

            const lastMessageHeight = lastUserMessageHeightRef.current || 0; // 🔥 Если null, используем 0
            const newPadding = Math.max(10, basePadding + minMessageHeight - messageHeight);

            if (chatRef.current) {
                chatRef.current.style.paddingBottom = `${newPadding}px`;
                //chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});

            }
            //console.log("📉 newPadding: ", newPadding);
        });

        observer.observe(streamingElement, {
            childList: true, // Следим за добавлением новых узлов
            subtree: true, // Следим за изменениями внутри элемента
            characterData: true, // Следим за изменением текста внутри
            attributes: true // Следим за изменением классов или атрибутов
        });

        return () => {
            observer.disconnect(); // ✅ Очищаем MutationObserver
        };
    }, [isStreaming, messages]);

    // устанавливаем окончательный PaddingBottom по завершении Stream
    useEffect(() => {
        if (!isStreaming) {
            const streamingElement = chatRef.current?.querySelector(`[data-key="${streamingMessageIdRef.current}"]`);
            if (streamingElement) {

                const lastMessageHeight = lastUserMessageHeightRef.current || 0; // 🔥 Если null, используем 0

                setTimeout(() => {
                    const messageHeight = streamingElement.clientHeight || 0;
                    const newPadding = Math.max(10, basePadding + minMessageHeight - messageHeight);

                    if (chatRef.current) {
                        chatRef.current.style.paddingBottom = `${newPadding}px`;
                        //chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});

                    }
                    //console.log("last messageHeight-" + messageHeight);
                    //console.log("last padding-" + newPadding);
                }, 200);
            }

            //console.log("🛑 Стрим завершился, обновляем prevStreamingMessageIdRef");
            prevStreamingMessageIdRef.current = streamingMessageIdRef.current; // ✅ Обновляем ID при завершении
        }
    }, [isStreaming]); // ✅ Срабатывает ТОЛЬКО при изменении `isStreaming`

    // Отслеживаем, ушел ли текст ниже нижн. границы (с учетом padding)
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    useEffect(() => {
        if (isStreaming) return; // 🔥 Если идёт стрим, просто выходим

        const chatContainer = chatRef.current;
        if (!chatContainer) return;

        const updatePadding = () => {
            const currentPaddingStr = window.getComputedStyle(chatContainer).paddingBottom;
            const newPadding = parseFloat(currentPaddingStr) || 0;
            paddingBottomRef.current = newPadding
            //console.log("0-" + paddingBottomRef.current)
        };

        // Функция обработки скролла
        const handleScroll = () => {
            const {scrollTop, scrollHeight, clientHeight} = chatContainer;

            if (scrollTop + clientHeight < scrollHeight - (paddingBottomRef.current ?? 10) - 100) {
                //console.log("1-" + paddingBottomRef.current)
                setShowScrollToBottom(true);
                if (chatRef.current) {
                    paddingBottomRef.current = 10
                    chatRef.current.style.paddingBottom = `10px`;
                }

            } else {
                setShowScrollToBottom(false);
            }
        };

        // 🔥 MutationObserver следит за изменениями `style`
        const observer = new MutationObserver(updatePadding);
        observer.observe(chatContainer, {
            attributes: true,
            attributeFilter: ["style"], // Следим за изменением стилей
        });

        chatContainer.addEventListener("scroll", handleScroll);

        // Получаем начальное значение padding
        updatePadding();

        return () => {
            chatContainer.removeEventListener("scroll", handleScroll);
            observer.disconnect();
        };

    }, [isStreaming, language]); // 🔥 `useEffect` теперь реагирует на изменение `paddingBottom`

    // кнопка Прокрутить Вниз (сбрасывает padding и скроллит вниз)
    const handleScrollBtn = () => {
        if (chatRef.current) {
            chatRef.current.style.paddingBottom = `10px`;
            chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});

            // Обновляем padding вручную после изменения
            setTimeout(() => {
                const newPadding = parseFloat(window.getComputedStyle(chatRef.current!).paddingBottom) || 0;
                paddingBottomRef.current = newPadding
                //console.log("2-" + paddingBottomRef.current)
            }, 100);
        }
    };

    const punctuationMarks = ['.', ',', '!', '?', ':', ';'];
    // 🔥 Обработчик ввода в textarea (убирает пробел перед знаками препинания)
    const handleTextareaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let newValue = e.target.value;

        // Проверяем, если пользователь поставил знак препинания после пробела, убираем лишний пробел
        if (newValue.length > chatMessage.length) {
            const lastChar = newValue.slice(-1);
            const secondLastChar = newValue.slice(-2, -1);

            if (punctuationMarks.includes(lastChar) && secondLastChar === ' ') {
                newValue = newValue.slice(0, -2) + lastChar;
            }
        }
        handlePredict(newValue);
        setChatMessage(newValue);
    };

    const [dictionary, setDictionary] = useState<DictionaryWord[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        // ❌ Очищаем словарь перед загрузкой нового языка
        setDictionary([]);

        // 🔥 Загружаем словарь только для текущего языка
        fetch(`/dict/${language}_words.json`)
            .then((res) => res.json())
            .then((data: DictionaryWord[]) => {
                setDictionary(data);
            })
            .catch((e) => console.error("Ошибка загрузки словаря:", e));
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
                    removeAccents(item.word.toLocaleLowerCase()).startsWith(removeAccents(lowerLastWord)) &&// 🔥 Теперь ищет и по "й", и по "и"
                    removeAccents(item.word.toLowerCase()) !== lowerLastWord
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

    const insertWord = (word: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = chatMessage.slice(0, cursorPos);
        const textAfterCursor = chatMessage.slice(cursorPos);

        // Разбиваем текст на слова, **сохраняя пробелы и переводы строк**
        const textParts = textBeforeCursor.split(/(\s+)/);
        let lastPart = textParts.pop() || "";

        // Проверяем, что последнее слово заменяется, а не пробел/перенос строки
        if (!/\S/.test(lastPart)) {
            textParts.push(lastPart); // Вернем его обратно, если это пробел или `\n`
            lastPart = "";
        }

        const newText = [...textParts, word].join('') + ' '; // Собираем текст обратно

        const finalText = newText + textAfterCursor;

        setChatMessage(finalText); // ✅ обновляем state

        // Возвращаем фокус в textarea и двигаем курсор
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newText.length, newText.length);
        }, 10);

        setSuggestions([]);
    };

    const formatMessage = (message: string) => {
        return message.replace(/\*\*(.*?)\*\*/g, '<span style="color:red">$1</span>');
    };

    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    //сбрасываем фокус c инпута если приложение было в фоне
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // Страница вернулась на экран — снимаем фокус
                textareaRef.current?.blur();

                if (!isDesktop) {
                    setTimeout(() => {
                            setIsFading(true);
                        setTimeout(() => {
                            setIsFading(false); // ✅ Показываем контент снова
                            // Восстанавливаем скролл
                            setTimeout(() => {
                                if (chatRef.current) {
                                    chatRef.current.scrollTo({
                                        //просто прокручиваем в самый низ, и не надо ничего восстанавливать
                                        top: chatRef.current.scrollHeight,
                                        behavior: "instant" // моментальная прокрутка вниз
                                    });
                                }
                            }, 10);
                        }, 300);
                    }, 300);
                }

            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isDesktop]);

    const [checkedMessageId, setCheckedMessageId] = useState<number | null>(null);

    const placeholders: { [key: string]: React.ReactNode } = Object.fromEntries(
        languages.map(({key, label, emoji, prepositional}) => [
            key,
            (
                <>

                    <span className="pl-[5px] whitespace-nowrap font-medium">{emoji} {prepositional}</span>

                </>
            ),
        ])
    );

    //приподнимаем весь контент когда клава выезжает, передаем в page
    useEffect(() => {
        if (isKeyboardOpen) {
            onKeyboardOpen?.();
        }
        if (chatRef.current) {
            //chatRef.current.style.paddingBottom = `10px`;
        }
    }, [isKeyboardOpen]);

    const [showDots, setShowDots] = useState(false);
    useEffect(() => {
        if (!isStreaming) {
            const timeout = setTimeout(() => {
                setShowDots(true);
            }, 300); // появление через 300 мс

            return () => clearTimeout(timeout);
        } else {
            setShowDots(false); // сразу убираем если пошёл стрим
        }
    }, [isStreaming]);



    return (
        <div className="flex flex-col"
             style={{height: `${chatHeight}px`}}
        >
            <div
                ref={chatRef}
                id={`chat-container-${mode}`}
                className={`scroll-container flex-1 overflow-y-auto px-3 pb-[10px] w-full pr-[12px] transition-all duration-300 ${
                    isFading ? "opacity-0" : "opacity-100"
                }`}
            >
                {messages.map((msg, index) => (

                    <div
                        key={msg.id}
                        data-key={msg.id}
                        className={`relative mb-[10px] p-[10px] pl-[12px] pr-[35px] ]
                        rounded-lg w-fit min-w-[200px] max-w-[90%] break-words whitespace-pre-line shadow-sm 
                        ${msg.role === "user"
                            ? "bg-primary-100 text-foreground self-end ml-auto"
                            : msg.id === streamingMessageIdRef.current && isStreaming
                                ? "bg-warning-200 text-foreground self-start mr-auto"
                                : "bg-default-200 text-foreground self-start mr-auto"
                        } transition duration-300 ease-in-out transform ${
                            msg.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        }`}

                        style={{
                            minHeight: `${minMessageHeight}px`,
                            fontSize: `${chatFontSize}px`,
                        }}
                    >

                        {msg.role === "assistant" && msg.content === "" && msg.id === streamingMessageIdRef.current && isStreaming ? (
                            <div className="flex items-center h-[17px]">
                                <Spinner size="sm" variant="wave" className="mb-[8px]"/>
                            </div>
                        ) : msg.content !== "" ? (
                            <span dangerouslySetInnerHTML={{__html: formatMessage(msg.content)}}/>
                        ) : (
                            <span
                                className={`
        text-default-500 transition-opacity duration-500
        ${showDots ? "opacity-100" : "opacity-0"}
      `}
                            >
      ...
    </span>
                        )}

                        {msg.role === "assistant" ? (

                            <CopyButton text={msg.content} isStreaming={isStreaming}/>

                        ) : (

                            <span
                                role="button"
                                tabIndex={0}
                                aria-disabled={isStreaming}
                                onPointerDown={(e) => {
                                    if (isStreaming) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onPointerUp={(e) => {
                                    if (isStreaming) return;

                                    e.preventDefault();
                                    e.stopPropagation();

                                    setCheckedMessageId(msg.id); // ✅ сохраняем ID нажатого сообщения
                                    handleEdit(index); // ✅ редактируем

                                    setTimeout(() => {
                                        setCheckedMessageId(null); // ❌ скрываем галочку
                                    }, 3000);
                                }}
                                className={`absolute bottom-[0px] right-[0px] p-[8px] transition duration-300 
                                ${isStreaming
                                    ? "text-default-400 cursor-default pointer-events-none"
                                    : "text-default-500 hover:text-default-500 cursor-pointer"}`}
                            >
                                {checkedMessageId === msg.id
                                    ? <Check size={20} className="text-success-500"/> // ✅ зелёная галочка
                                    : <Edit size={20}/>}
                            </span>

                        )}
                    </div>
                ))}
            </div>

            <div className="relative">
  <span
      role="button"
      onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleScrollBtn();
      }}
      className={`absolute bottom-[15px] left-1/2 transform -translate-x-1/2
      bg-default-400 text-white p-2 rounded-full shadow-lg 
      transition-all duration-300 ease-in-out
      ${showScrollToBottom
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"}
      ${!isDesktop ? "" : "hover:bg-default-500"}`}
  >
    <ArrowDown size={18}/>
  </span>
            </div>

            {isMounted && (
                <div
                    className="relative  container mx-auto px-3 pt-[4px] transition-all duration-300"
                    style={{
                        maxWidth: `${maxContentWidth}px`,
                        minHeight: `${minBottomBlockHeight}px`,
                        marginBottom: isMobile
                            ? (isKeyboardOpen ? "0px" : `${noKeyboardPadding}px`) // 👈 для мобилки
                            : "0px",
                        paddingBottom: `${bottomBlockPadding}px`,
                    }}
                >

                    <div
                        className={`
    absolute bottom-[10px] left-[12px] z-10  rounded-lg shadow-md p-2 
    transition-all duration-300 ease-in-out 
    ${suggestions.length > 0 && isKeyboardOpen
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-2 pointer-events-none"}
  `}
                    >
                        <div className="flex gap-3">
                            {suggestions.map((word, index) => (
                                <span
                                   key={`${word}-${index}`}
                                    role="button"
                                    tabIndex={0}
                                    onPointerDown={(e) => {
                                        e.preventDefault(); // чтобы не схлопнулась клавиатура
                                        e.stopPropagation();
                                        insertWord(word);
                                    }}
                                    className="text-[16px] text-foreground cursor-pointer hover:text-primary transition"
                                >
        {word}
      </span>
                            ))}
                        </div>
                    </div>

                    <Textarea

                        onFocus={() => {
                            setIsKeyboardOpen(true);
                        }}

                        onBlur={() => {
                            setIsKeyboardOpen(false);

                            setTimeout(() => {
                                chatRef.current?.scrollTo({
                                    top: chatRef.current.scrollHeight,
                                    behavior: "smooth"
                                });
                            }, 300);
                        }}

                        ref={textareaRef}

                        id={`textarea-${mode}`}

                        value={chatMessage}
                        color={"primary"}
                        //variant={"bordered"}
                        isDisabled={chatLoading}

                        // isClearable
                        // onClear={() => console.log("textarea cleared")}

                        enterKeyHint="go" // 👈 ВАЖНО
                        size={"lg"}
                        spellCheck="false"
                        onChange={handleTextareaChange}

                        classNames={{
                            base: "",
                        }}

                        className="w-full  resize-none cursor-text box-content"
                        style={{
                            //paddingTop: "4px",
                            paddingRight: "0px",
                            paddingLeft: "0px",
                            cursor: "text",
                            fontSize: `${chatFontSize}px`,
                            //lineHeight: `1.3`,

                        }}
                        minRows={minRows}
                        maxRows={maxRows}

                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();

                                // 💡 Проверка на пустое сообщение
                                if (!chatMessage.trim()) return;

                                if (editingMessage !== null) {
                                    setEditingMessage(null);
                                }
                                handleSendMessage();
                            }
                        }}
                    />

                    <div
                        className={`
    absolute top-[15px] left-[0px] mx-auto px-[24px]
    transition-all duration-300 ease-in-out 
    ${chatMessage.length === 0
                            ? "opacity-50 translate-y-0 pointer-events-none"
                            : "opacity-0 translate-y-2 pointer-events-none"}
  `}
                        style={{fontSize: `${plaholderFont}px`,
                            lineHeight: `1.4`,
                    }}
                    >
                        {mode === "chat" ? (
                            "Спросите у меня что-нибудь..."
                        ) : (
                            <>
                                Напишите что-нибудь на русском или на{" "}
                                <span
                                    className={`
          transition-all duration-300 ease-in-out
          ${isFadingPlaceholder ? "opacity-0" : "opacity-100"}
        `}
                                >
        {placeholders[visiblePlaceholderLang]}
      </span>, а я вам переведу...
                            </>
                        )}
                    </div>

                    {chatMessage.trim().length > 0 && (
                        <>

                    <span
                        role="button"
                        tabIndex={0}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onPointerUp={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setChatMessage(""); // ✅ очищаем текст
                            setTimeout(() => {
                                //textareaRef.current?.focus(); // 🔁 возвращаем фокус
                            }, 10);
                        }}
                        className="absolute top-[5px] right-[15px] p-[5px] text-default-500 hover:text-default-500
                        cursor-pointer transition duration-300 z-50"
                    >
                        <X size={22}/>

</span>
                        </>
                    )}


                    {!showPwaPrompt && (
                    <div className={` flex flex-row gap-[40px] items-center justify-center`}
                         style={{
                             height: `${buttonsBlockHeight}px`,
                         }}
                    >
                        {mode === "translate" ? (
                            <LanguageSelect
                                language={language}
                                setLanguage={handleLanguageChange}
                                textareaRef={textareaRef}
                                positionClass=""
                            />
                        ) : (
                            <div className={" "}
                                 style={{
                                     width: `${sendButtonHeight}px`,
                                     height: `${sendButtonHeight}px`,
                                 }}
                            >

                            </div>
                        )}

                        <AudioRecorder
                            isDisabled={isStreaming}
                            onAudioRecorded={(audioBlob) => {
                                // тут ты можешь сохранить или передать audioBlob в API OpenAI (Whisper)
                                console.log("Аудио готово:", audioBlob);
                            }}

                            onTranscriptReady={(text) => {

                                setChatMessage((prev) =>
                                    prev.trim().length === 0 ? text : `${prev}\n${text}`
                                )

                                setTimeout(() => {
                                    if (textareaRef.current) {
                                        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
                                        if (isDesktop) {
                                            textareaRef.current?.focus();
                                        }
                                    }
                                }, 100);

                            }}
                        />

                        <div
                            className={"px-[0px] py-[0px]  z-50 flex items-center justify-center"}>

                            <button

                                onClick={() => {
                                    if (isStreaming) {
                                        abortControllerRef.current?.abort(); // ❌ Останавливаем поток
                                    } else {
                                        handleSendMessage();  // 📤 Отправляем сообщение
                                    }
                                }} disabled={isStreaming ? false : !chatMessage.trim()}
                                className={`  top-[12px] right-[20px] rounded-full flex items-center justify-center
                        text-white transition duration-300 
                        disabled:bg-default-400 bg-primary-500 hover:bg-primary-400"
                    `}
                                style={{
                                    width: `${sendButtonHeight}px`,
                                    height: `${sendButtonHeight}px`,
                                }}
                            >
                                {isStreaming ? <X size={22}/> : <ArrowUp size={22}/>}
                            </button>

                        </div>

                    </div>
                    )}

                </div>
            )}
        </div>
    );
}