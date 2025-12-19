import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
   try {
      const { language, dictionary } = await req.json();

      if (!language || !dictionary) {
         return NextResponse.json(
            { error: "Language and dictionary are required" },
            { status: 400 }
         );
      }

      // Проверяем, что язык допустимый
      if (!['uk', 'en', 'es'].includes(language)) {
         return NextResponse.json(
            { error: "Invalid language" },
            { status: 400 }
         );
      }

      // Путь к файлу словаря
      const dictionaryPath = path.join(process.cwd(), 'public', 'dict', `${language}_words.json`);

      // Создаем резервную копию словаря
      const backupPath = path.join(process.cwd(), 'public', 'dict', `${language}_words_backup_${Date.now()}.json`);
      fs.copyFileSync(dictionaryPath, backupPath);

      // Сохраняем новый словарь
      fs.writeFileSync(dictionaryPath, dictionary);

      return NextResponse.json({ success: true, message: "Dictionary updated successfully" });

   } catch (error: any) {
      console.error("Error saving dictionary:", error);
      return NextResponse.json(
         { error: "Failed to save dictionary", details: error.message },
         { status: 500 }
      );
   }
}