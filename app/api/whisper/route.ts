import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "Файл не является Blob" }, { status: 400 });
        }

        // 🧪 Проверка размера и типа
        const sizeKB = (file.size / 1024).toFixed(2);
        const type = file.type;
        const name = (file as File).name || "audio.wav";
        console.log("📦 Получен файл:", sizeKB + "KB", type, name);

        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return NextResponse.json({ error: "Нет API ключа OpenAI" }, { status: 500 });
        }

        // ✅ Используем оригинальный тип и имя (WAV)
        const audioFile = new File([file], name, { type: type || "audio/wav" });

        const apiFormData = new FormData();
        apiFormData.append("file", audioFile);
        apiFormData.append("model", "whisper-1");
        apiFormData.append("language", "ru");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
            },
            body: apiFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });

    } catch (error: any) {
        console.error("❌ Ошибка в /api/whisper:", error);
        return NextResponse.json({ error: error.message || "Ошибка обработки" }, { status: 500 });
    }
}