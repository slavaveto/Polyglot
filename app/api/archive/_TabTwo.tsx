"use client";

import React, {useEffect, useRef, useState} from "react";
import {Spinner, Textarea} from "@heroui/react";
import {ArrowUp, ArrowDown, Check, Copy, Edit, X} from "lucide-react";
import {useChat} from "@/app/api/archive/useChat_Tab2";
import AudioRecorder from "@/app/components/common/AudioRecorder";
import CopyButton from "@/app/components/common/CopyButton";
import {useDevice} from '@/app/utils/providers/MobileDetect';

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

export default function TabTwo({
                                   messages,
                                   setMessages,
                                   chatHeight,
                               }: {
    messages: Message[];
    setMessages: (messages: (prevMessages: Message[]) => Message[]) => void;
    chatHeight: number;
}) {

    const {isMobile, isTablet, isDesktop} = useDevice();

    // const basePadding = chatHeight - 37 - 37
    const basePadding = chatHeight - 44 - 44 - 200 - 60 + 8

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    const {
        sendMessage: sendChatMessage,
        loading: chatLoading,
        isStreaming,
        abortControllerRef,
        message: chatMessage,
        setMessage: setChatMessage,
        streamingMessageIdRef, lastUserMessageIdRef, isShowingSpinner
    } = useChat(messages, setMessages, textareaRef);

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
        //textareaRef.current?.focus();
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
    const handleSendMessage = () => {

        const chatContainer = chatRef.current;
        if (!chatContainer) return;
        const currPadding = parseFloat(window.getComputedStyle(chatRef.current!).paddingBottom) || 0;

        if (chatRef.current && currPadding < 50) {
            chatRef.current.style.paddingBottom = `50px`;
            // chatRef.current.style.paddingBottom = `${basePadding}px`;
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

                chatRef.current.style.paddingBottom = `${basePadding - lastUserMessageHeightRef.current}px`
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
            const newPadding = Math.max(10, basePadding - lastMessageHeight + 44 - messageHeight);

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
                    const newPadding = Math.max(10, basePadding - lastMessageHeight + 44 - messageHeight);

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

    // Отслеживаем, ушел ли текст ниже нижн. границы (с учетом padding)
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

            if (scrollTop + clientHeight < scrollHeight - paddingBottom - 50) {
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

    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    //сбрасываем фокус если приложение в фоне
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // Страница вернулась на экран — снимаем фокус
                textareaRef.current?.blur();

                // Снимаем фокус со всех элементов (табы нужно снимать)
                // if (document.activeElement instanceof HTMLElement) {
                //     document.activeElement.blur();
                // }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const [checkedMessageId, setCheckedMessageId] = useState<number | null>(null);

    const messagesToSend = [...messages].slice(-30);
    const formattedMessages = messagesToSend.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    const checkWithGPT = async (text: string) => {
        //console.log(text)
        try {
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: text,
                    //messages: formattedMessages,
                    mode: "checkWhisper"
                }),
            });

            const data = await response.json();

            //console.log(data.reply)

            if (data?.reply) {
                setChatMessage((prev) =>
                    prev.trim().length === 0 ? data.reply : `${prev}\n${data.reply}`
                );
            }
        } catch (e) {
            console.error("Ошибка при проверке текста:", e);
            setChatMessage((prev) => prev + "\n[Ошибка при проверке текста]");
        }
    };

    return (
        <div className="flex flex-col"
             style={{height: `${chatHeight}px`}}
        >
            <div
                ref={chatRef}
                id="chat-container-two"
                className="scroll-container flex-1 overflow-y-auto px-3 pb-[10px] w-full pr-[12px] transition-all duration-300"
            >
                {messages.map((msg, index) => (

                    <div
                        key={msg.id}
                        data-key={msg.id}
                        className={`relative mb-[10px] p-[10px] pl-[12px] pr-[35px]  min-h-[44px]
                        rounded-lg w-fit min-w-[200px] max-w-[75%] break-words whitespace-pre-line shadow-sm text-xs
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
                        {msg.role === "assistant" && msg.content === "" && msg.id === streamingMessageIdRef.current && isStreaming ? (
                            <div className="flex items-center h-[17px]">
                                <Spinner size="sm" variant="wave" className="mb-[8px]"/>
                            </div>
                        ) : msg.content !== "" ? (
                            msg.content
                        ) : (
                            <span className="text-default-500">...</span> // 👈 заглушка для пустых завершённых сообщений
                        )}

                        {/*{msg.role === "assistant" && msg.content === "" && isShowingSpinner ? (*/}
                        {/*    <div className="flex items-center h-[17px]">*/}
                        {/*        <Spinner size="sm" variant="wave" className="mb-[8px]"/>*/}
                        {/*    </div>*/}

                        {/*) : (*/}
                        {/*    msg.content*/}
                        {/*)}*/}

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
                    className="relative   h-[200px] container mx-auto px-3 pt-[4px] transition-all duration-300"
                    style={{
                        maxWidth: '600px',
                        marginBottom: isMobile
                            ? (isKeyboardOpen ? "0px" : "60px") // 👈 для мобилки
                            : "0px",
                    }}
                >
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
                        id="textarea-two"
                        value={chatMessage}
                        color={"primary"}
                        //variant={"bordered"}
                        isDisabled={chatLoading}
                        onChange={(e) => setChatMessage(e.target.value)}

                        enterKeyHint="go" // 👈 ВАЖНО

                        spellCheck="false"

                        //placeholder={"Спросите меня о чем-нибудь..."}

                        classNames={{
                            base: ""
                        }}

                        className="w-full resize-none cursor-text focus:border-1"
                        style={{
                            // paddingTop: "4px",
                            paddingRight: "0px",
                            paddingLeft: "0px",
                            fontSize: "20px",
                            cursor: "text",
                        }}
                        minRows={3}
                        maxRows={6}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
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
                            ? "opacity-50 translate-x-0 pointer-events-none"
                            : "opacity-0 translate-x-2 pointer-events-none"}
  `}
                    >
                        Спросите меня о чем-нибудь...
                    </div>

                    {chatMessage.trim().length > 0 && (
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
                            className=" absolute top-[5px] right-[15px] p-[5px] text-default-500 hover:text-default-500 cursor-pointer transition duration-300 z-50"
                        >
                        <X size={22}/>

</span>
                    )}

                    <div className={"flex flex-row h-[108px] gap-[24px] items-center justify-center"}>

                        <div
                            className={"flex items-center justify-center top-[4px] left-[8px] text-[40px] h-[60px] w-[60px] "}>

                        </div>

                        {/*<Button*/}
                        {/*    //variant="light"*/}
                        {/*    isIconOnly*/}
                        {/*    className="text-white w-[60px] h-[60px] "*/}
                        {/*    onClick={() => {*/}

                        {/*    }}*/}
                        {/*>*/}
                        {/*    <Mic size={34}/>*/}
                        {/*</Button>*/}

                        <AudioRecorder
                            isDisabled={isStreaming}
                            onAudioRecorded={(audioBlob) => {
                                // тут ты можешь сохранить или передать audioBlob в API OpenAI (Whisper)
                                console.log("Аудио готово:", audioBlob);
                            }}
                            // onTranscriptReady={(text) => setChatMessage(prev => prev + text)}
                            // onTranscriptReady={(text) => setChatMessage(prev => prev + "\n" + text)}

                            onTranscriptReady={(text) => {

                                // setChatMessage((prev) =>
                                //     prev.trim().length === 0 ? text : `${prev}\n${text}`
                                // )

                                checkWithGPT(text);
                            }}
                        />

                        <div className={"px-[10px] py-[8px] w-[60px] h-[60px] flex items-center justify-center"}>

                            <button

                                onClick={() => {
                                    if (isStreaming) {
                                        abortControllerRef.current?.abort(); // ❌ Останавливаем поток
                                    } else {
                                        handleSendMessage();  // 📤 Отправляем сообщение
                                    }
                                }} disabled={isStreaming ? false : !chatMessage.trim()}
                                className={`  top-[12px] right-[20px] w-[38px] h-[38px] rounded-full flex items-center justify-center
                        text-white transition duration-300 
                        disabled:bg-default-400 bg-primary-500 hover:bg-primary-400"
                    `}
                            >
                                {isStreaming ? <X size={22}/> : <ArrowUp size={22}/>}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}