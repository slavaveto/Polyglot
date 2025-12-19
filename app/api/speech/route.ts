import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// 🔹 Настраиваем OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // 🔥 Убедись, что ключ прописан в `.env.local`
});

export async function POST(req: NextRequest) {
    try {
        const { text, language } = await req.json();

        if (!text || !language) {
            return NextResponse.json({ error: "Missing text or language" }, { status: 400 });
        }

        // 🔥 Определяем модель и голос в зависимости от языка
        const voice = "onyx"

        // Запрос в OpenAI TTS API
        const response = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice, // 🔥 Alloy - для английского, Nova - для других языков
            input: text,
        });

        // Получаем MP3-файл
        const audioBuffer = Buffer.from(await response.arrayBuffer());

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": 'attachment; filename="speech.mp3"',
            },
        });
    } catch (error) {
        console.error("Ошибка генерации аудио:", error);
        return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
    }
}
