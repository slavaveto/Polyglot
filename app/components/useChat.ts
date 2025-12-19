import {useState, useRef, useEffect} from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
    id: number;
    isVisible: boolean;
};

export function useChat(
    messages: Message[],
    setMessages: (update: (prevMessages: Message[]) => Message[]) => void,
    language: string,
    textareaRef: React.RefObject<HTMLTextAreaElement | null>, // ✅ Добавляем `| null`,
    mode:string
) {
    const [message, setMessage] = useState(""); // ✅ Добавляем состояние сообщения
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const streamingMessageIdRef = useRef<number | null>(null); // ✅ Используем ref
    const lastUserMessageIdRef = useRef<number | null>(null); // ✅ Используем ref
    const [isShowingSpinner, setIsShowingSpinner] = useState(false);

    const sendMessage = async (message: string) => {
        if (!message.trim() || isStreaming || loading) return;

        setIsShowingSpinner(true); // Показываем спиннер
        const minSpinnerTime = 1000; // Минимальная длительность спиннера
        const startTime = Date.now();

        const generateId = () => Date.now() + Math.floor(Math.random() * 1000000);

        const userMessageId = generateId()
        lastUserMessageIdRef.current = userMessageId

        const userMessage: Message = {
            role: "user",
            content: message,
            id: userMessageId,
            isVisible: true,
        };

        const assistantMessageId = generateId()
        streamingMessageIdRef.current = assistantMessageId; // ✅ Запоминаем ID через useRef

        const assistantMessage: Message = {
            role: "assistant",
            content: "",
            id: assistantMessageId,
            isVisible: true,
        };

        setMessages((prevMessages) => [...prevMessages, userMessage, assistantMessage]);

        //console.log("Before clearing message:", message);
        setMessage("");  // ✅ Очищаем состояние
        //console.log("After clearing message:", message);

        setTimeout(() => {
            if (textareaRef.current) {
                //textareaRef.current.focus();
            }
        }, 0);

        setLoading(true);
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const messagesToSend = [...messages, userMessage].slice(-60);
        const formattedMessages = messagesToSend.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        try {
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: message, // ✅ Передаем текущее сообщение
                    messages: formattedMessages, // ✅ Передаем всю историю
                    language,
                    mode: mode
                }),
                signal
            });

            if (!response.body) throw new Error("Нет тела ответа");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            const timeElapsed = Date.now() - startTime;
            const delay = Math.max(0, minSpinnerTime - timeElapsed); // Чтобы спиннер был хотя бы 500 мс

            // ✅ Добавляем пустое сообщение ассистента
            //setMessages((prevMessages) => [...prevMessages, assistantMessage]);

            const processStream = async () => {

                while (true) {
                    const {value, done} = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, {stream: true});

                    setTimeout(async () => {

                        await new Promise((resolve) => setTimeout(resolve, 200)); // <-- Задержка 50 мс на каждый кусок

                        // ✅ Обновляем сообщение сразу
                        setMessages((prevMessages) =>
                            prevMessages.map((msg) =>
                                msg.id === assistantMessage.id
                                    ? {...msg, content: msg.content + chunk}
                                    : msg
                            )
                        );
                        setIsShowingSpinner(false); // Скрываем спиннер
                    }, delay);
                }
            };

            await processStream();

        } catch (error: any) {
            if (error.name !== "AbortError") {
                console.error("Ошибка при отправке сообщения:", error);
            }
            setIsShowingSpinner(false);
        } finally {
            setLoading(false);
            setIsStreaming(false);
            console.log("стрим завершен")
            //setTimeout(() => textareaRef.current?.focus(), 100);
        }
    };

    return {
        sendMessage, loading, isStreaming, abortControllerRef, message, setMessage,
        streamingMessageIdRef, lastUserMessageIdRef, isShowingSpinner
    };
}