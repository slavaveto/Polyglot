import {NextResponse} from "next/server";
import OpenAI from "openai";

// export const runtime = 'nodejs';
export const runtime = 'edge';

import {
    translationPrompts,
    chatPrompt,
    popUp,
    detailsPrompt,
    writingPrompt,
    checkWhisper
} from "@/app/api/translate/prompts";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const {message, messages = [], language, mode = "translate", context = ""} = await req.json();

        if (!message || !mode) {
            return NextResponse.json(
                {error: "Message and mode are required"},
                {status: 400}
            );
        }

        // 🛠 Проверяем, начинается ли сообщение с "+++"
        const isWritingMode = message.trim().startsWith("+++");
        // 🛠 Убираем "+++" из сообщения перед отправкой в OpenAI
        let userMessage = isWritingMode ? message.trim().substring(3).trim() : message;

        const newMode = isWritingMode ? "writing" : mode;

        let systemPrompt;
        let temperature;
        let stream = newMode === "chat";
        const langKey = language as keyof typeof translationPrompts;

        if (newMode === "translate") {
            systemPrompt = translationPrompts(langKey);
            //console.log(systemPrompt)
            temperature = 0.1; // ✅ Максимальная точность для перевода
            stream = true;

        } else if (newMode === "chat") {
            systemPrompt = chatPrompt;
            temperature = 0.5; // ✅ Чуть больше естественности для чата
            stream = true;

        } else if (newMode === "popup") {
            systemPrompt = popUp[langKey];
            temperature = 0.3;

            userMessage =
                `📌 Данные:
                - Слово: "${message}".
                - Контекст: "${context}".
                Переведи слово **точно по контексту**.`

        } else if (newMode === "writing") {
            systemPrompt = writingPrompt[langKey];
            temperature = 0.3;
            stream = true;

        } else if (newMode === "checkWhisper") {
            systemPrompt = checkWhisper;
            temperature = 0.3;
            userMessage = `${message}`

            //console.log("checkWhisper" + userMessage)

        } else if (newMode === "details") {
            systemPrompt = detailsPrompt[langKey];
            temperature = 0.3;
            stream = true;

            if (context) {
                userMessage =
                    `📌 Данные:
                - Слово: "${message}".
                - Контекст: "${context}".`
            } else {
                userMessage = `${message}`
            }

        } else {
            return NextResponse.json(
                {error: "Invalid mode"},
                {status: 400}
            );
        }

        //console.log("userMessage: " + userMessage)

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {role: "system", content: systemPrompt},
                ...messages, // ✅ Теперь передаем ВСЮ историю!
                {role: "user", content: userMessage},
            ],
            temperature: temperature,
            stream: stream, // ✅ Поток только для чата
        });


        // // ✅ Если режим "details", пытаемся разобрать JSON
        // if (newMode === "details") {
        //     const replyText = (completion as any).choices?.[0]?.message?.content || "{}";
        //
        //     // 🛠 Удаляем лишнее форматирование
        //     const cleanReplyText = replyText.replace(/```json|```/g, "").trim();
        //
        //     let parsedResponse;
        //
        //     try {
        //         if (!cleanReplyText.startsWith("{") || !cleanReplyText.endsWith("}")) {
        //             throw new Error("Ответ не является JSON");
        //         }
        //
        //         parsedResponse = JSON.parse(cleanReplyText);
        //     } catch (error) {
        //         console.error("❌ Ошибка парсинга JSON:", error);
        //         console.error("📌 Ответ OpenAI:", cleanReplyText);
        //
        //         parsedResponse = {
        //             infinitive: message,
        //             translation: "Ошибка перевода",
        //             example: ""
        //         };
        //     }
        //
        //     return NextResponse.json(parsedResponse);
        // }

        // ✅ Если поток включен, создаем ReadableStream
        if (stream) {
            const encoder = new TextEncoder();
            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of completion as any) {
                            const text = chunk.choices?.[0]?.delta?.content || "";
                            // controller.enqueue(encoder.encode(text));
                            if (text) {
                                await new Promise((resolve) => setTimeout(resolve, 100)); // 🔥 Задержка 50 мс
                                controller.enqueue(encoder.encode(text));
                            }
                        }
                    } catch (error) {
                        console.error("Ошибка потока:", error);
                    } finally {
                        controller.close();
                    }
                }
            });

            // return new Response(readableStream, {
            //     headers: {
            //         "Content-Type": "text/plain; charset=utf-8",
            //         "Cache-Control": "no-cache",
            //         "Transfer-Encoding": "chunked",
            //         "Connection": "keep-alive",
            //     },
            // });

            return new Response(readableStream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });

        }

        // ✅ Если поток выключен, отправляем обычный JSON-ответ
        const reply = (completion as any).choices?.[0]?.message?.content || "No reply";
        return NextResponse.json({reply});

    } catch (error: any) {
        return NextResponse.json(
            {error: "Failed to connect to OpenAI", details: error.message},
            {status: 500}
        );
    }
}