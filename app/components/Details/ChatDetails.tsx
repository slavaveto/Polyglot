"use client";

import {useEffect, useRef, useState} from "react";
import {Spinner, Textarea} from "@heroui/react";
import {ArrowUp, ArrowDown, Check, Copy, Edit, X} from "lucide-react";
import {useChat} from "@/app/components/Details/useChat_Details";

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

export default function ChatDetails({
                                        messages,
                                        setMessages,
                                        chatHeight,
                                        modalIsOpen,
                                        word,
                                        context,
                                        language
                                    }: {
    messages: Message[];
    setMessages: (messages: (prevMessages: Message[]) => Message[]) => void;
    chatHeight: number;
    modalIsOpen: boolean;
    word: string;
    context: string;
    language: string;
}) {

    const basePadding = chatHeight - 37 - 37

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    const [initialMessage, setInitialMessage] = useState(word);
    const [initialContext, setInitialContext] = useState(context);

    const {
        sendMessage: sendChatMessage,
        loading: chatLoading,
        isStreaming,
        abortControllerRef,
        message: chatMessage,
        setMessage: setChatMessage,
        streamingMessageIdRef, lastUserMessageIdRef, isShowingSpinner
    } = useChat(messages, setMessages, language, textareaRef);

    const [editingMessage, setEditingMessage] = useState<number | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // ❗️ При каждом открытии модалки начинаем чат с initialMessage
    useEffect(() => {
        if (modalIsOpen) {
            setTimeout(() => {
                handleSendMessage(initialMessage, initialContext);
            }, 100);
        }
    }, [modalIsOpen]);

    useEffect(() => {
        setIsMounted(true);
        setTimeout(() => {
            chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "instant"});
        }, 50);
        //console.log("window.innerHeight-" + window.innerHeight)
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
        textareaRef.current?.focus();
        if (chatRef.current) {
            //chatRef.current.style.paddingBottom = `10px`;
            setTimeout(() => {
                chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});
            }, 50);
        }
    };

    // Copy
    const handleCopy = (index: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(index);
        setTimeout(() => setCopiedMessageId(null), 10000);
    };

    // Отправляем сообщение в GPT
    const lastUserMessageHeightRef = useRef<number | null>(null); // 🔥 Храним высоту как число
    const handleSendMessage = (initialMessage: string, initialContext: string) => {

        const chatContainer = chatRef.current;
        if (!chatContainer) return;
        const currPadding = parseFloat(window.getComputedStyle(chatRef.current!).paddingBottom) || 0;

        if (chatRef.current && !initialMessage && currPadding < 50) {
            chatRef.current.style.paddingBottom = `50px`;
            setTimeout(() => {
                chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});
            }, 50);
        }

        sendChatMessage(initialMessage, initialContext);

        setInitialMessage("")
        setInitialContext("")

        //console.log("lastUserMessageIdRef.current-" + lastUserMessageIdRef.current)

        setTimeout(() => {
            const lastUserMessageElement = chatRef.current?.querySelector(`[data-key="${lastUserMessageIdRef.current}"]`);
            //console.log("lastUserMessageElement -", lastUserMessageElement);

            if (lastUserMessageElement && chatRef.current) {
                lastUserMessageHeightRef.current = lastUserMessageElement.clientHeight;
                //console.log("📏 Высота элемента (clientHeight):", lastUserMessageHeightRef.current);

                const currPadding = basePadding - lastUserMessageHeightRef.current
                // console.log("currPadding: ", currPadding);

                chatRef.current.style.paddingBottom = `${basePadding - lastUserMessageHeightRef.current}px`
            } else {
                console.warn("⚠ Элемент не найден через 50 мс!");
            }

        }, 50);

        setTimeout(() => {
            chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});
        }, initialMessage ? 1500 : 400);
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
            const newPadding = Math.max(10, basePadding - lastMessageHeight + 37 - messageHeight);

            if (chatRef.current) {
                chatRef.current.style.paddingBottom = `${newPadding}px`;
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
                    const newPadding = Math.max(10, basePadding - lastMessageHeight + 37 - messageHeight);

                    if (chatRef.current) {
                        chatRef.current.style.paddingBottom = `${newPadding}px`;
                    }
                    //console.log("last messageHeight-" + messageHeight);
                    //console.log("last padding-" + newPadding);
                }, 200);
            }

            //console.log("🛑 Стрим завершился, обновляем prevStreamingMessageIdRef");
            prevStreamingMessageIdRef.current = streamingMessageIdRef.current; // ✅ Обновляем ID при завершении
        }
    }, [isStreaming]); // ✅ Срабатывает ТОЛЬКО при изменении `isStreaming`

    // Отслеживаем, ушел ли текст ниже нижн. границы (с учетом padding) и показываем кнопку прокрутить
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [paddingBottom, setPaddingBottom] = useState(0); // 🔥 Храним padding в состоянии
    useEffect(() => {
        if (isStreaming) return; // 🔥 Если идёт стрим, просто выходим

        const chatContainer = chatRef.current;
        if (!chatContainer) return;

        const updatePadding = () => {
            const currentPaddingStr = window.getComputedStyle(chatContainer).paddingBottom;
            const newPadding = parseFloat(currentPaddingStr) || 0;
            setPaddingBottom(newPadding);
        };

        // Функция обработки скролла
        const handleScroll = () => {
            const {scrollTop, scrollHeight, clientHeight} = chatContainer;

            //отключаем кнопку при initialMessage
            if ((scrollTop + clientHeight) < (scrollHeight - paddingBottom - 50) && !initialMessage) {
                setShowScrollToBottom(true);
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

    }, [isStreaming, paddingBottom]); // 🔥 `useEffect` теперь реагирует на изменение `paddingBottom`

    // кнопка Прокрутить Вниз (сбрасывает padding и скроллит вниз)
    const handleScrollBtn = () => {
        if (chatRef.current) {
            chatRef.current.style.paddingBottom = `10px`;
            chatRef.current?.scrollTo({top: chatRef.current.scrollHeight, behavior: "smooth"});

            // Обновляем padding вручную после изменения
            setTimeout(() => {
                const newPadding = parseFloat(window.getComputedStyle(chatRef.current!).paddingBottom) || 0;
                setPaddingBottom(newPadding);
            }, 100);
        }
    };

    return (
        <div className="flex flex-col flex-1">
            <div
                ref={chatRef}
                id="chat-container-chat"
                className="scroll-container flex-1 overflow-y-auto px-3 pb-[10px] w-full pr-[12px] transition-all duration-300"
                style={{maxHeight: `${chatHeight}px`}}
            >
                {messages.map((msg, index) => (

                    <div
                        key={msg.id}
                        data-key={msg.id}
                        className={`relative mb-[10px] p-[10px] pl-[12px] pr-[35px] 
                        rounded-lg w-fit min-w-[250px] max-w-[75%] break-words whitespace-pre-line shadow-sm text-xs
                        ${msg.role === "user"
                            ? "bg-primary-100 text-foreground self-end ml-auto"
                            : msg.id === streamingMessageIdRef.current && isStreaming
                                ? "bg-warning-200 text-foreground self-start mr-auto"
                                : "bg-default-200 text-foreground self-start mr-auto"
                        } transition duration-300 ease-in-out transform ${
                            msg.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        }`}
                    >
                        {/*{msg.content}*/}

                        {msg.role === "assistant" && msg.content === "" && isShowingSpinner ? (
                            <div className="flex items-center h-[17px]">
                                <Spinner size="sm" variant="wave" className="mb-[8px]"/>
                            </div>

                        ) : (
                            msg.content
                        )}

                        {msg.role === "assistant" ? (
                            <button
                                disabled={isStreaming}
                                onClick={() => handleCopy(index, msg.content)}
                                className="absolute bottom-[8px] right-[8px] text-default-500 hover:text-default-900 transition duration-300 disabled:text-default-400 disabled:cursor-default"
                            >
                                {copiedMessageId === index ? <Check size={18}/> : <Copy size={18}/>}
                            </button>
                        ) : (
                            <button
                                disabled={isStreaming}
                                onClick={() => handleEdit(index)}
                                className="absolute bottom-[8px] right-[8px] text-default-500 hover:text-default-900 transition duration-300 disabled:text-default-400 disabled:cursor-default"
                            >
                                <Edit size={18}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="relative">
                <button
                    className={`absolute bottom-[15px] left-1/2 transform -translate-x-1/2
                    bg-default-400 text-white p-2 rounded-full shadow-lg 
                    hover:bg-default-500 transition-all duration-300 ease-in-out
                    ${showScrollToBottom ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                    onClick={() => handleScrollBtn()}
                >
                    <ArrowDown size={18}/>
                </button>
            </div>

            {isMounted && (
                <div className="absolute w-full bottom-3  px-3 pt-[4px] ">
                    <Textarea
                        ref={textareaRef}
                        id="textarea-two"
                        value={chatMessage}
                        color={"primary"}
                        //variant={"bordered"}
                        isDisabled={chatLoading}
                        onChange={(e) => setChatMessage(e.target.value)}

                        placeholder={"Спросите что-нибудь..."}

                        classNames={{
                            base: ""
                        }}

                        className="w-full resize-none cursor-text focus:border-1"
                        style={{
                            paddingTop: "4px",
                            paddingRight: "30px",
                            paddingLeft: "0px",
                            fontSize: "14px",
                            cursor: "text",
                        }}
                        minRows={1}
                        maxRows={5}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (editingMessage !== null) {
                                    setEditingMessage(null);
                                }
                                handleSendMessage(chatMessage, "");
                            }
                        }}
                    />

                    <button
                        onClick={() => {
                            if (isStreaming) {
                                abortControllerRef.current?.abort(); // ❌ Останавливаем поток
                            } else {
                                handleSendMessage(chatMessage, "");  // 📤 Отправляем сообщение
                            }
                        }} disabled={isStreaming ? false : !chatMessage.trim()}
                        className="absolute bottom-[7px] right-[18px] w-[28px] h-[28px] rounded-full flex items-center justify-center
                        bg-primary-500 text-white hover:bg-primary-400 disabled:bg-default-400 transition duration-300"
                    >
                        {isStreaming ? <X size={18}/> : <ArrowUp size={18}/>}
                    </button>
                </div>
            )}
        </div>
    );
}