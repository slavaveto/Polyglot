"use client";

import {useEffect, useRef, useState, useCallback} from "react";
import {Textarea, Spinner} from "@heroui/react";
import {useMainContext} from "@/app/context";
import debounce from 'lodash.debounce';



export default function TabThree() {


    const isNotRussian = (text: string) => {
        // ❗️ Если текст короткий (1-2 буквы), не определяем язык
        if (text.length < 3) return false;

        // 🔍 Чисто русские буквы (если есть → значит русский)
        const russianOnly = /[ёыэ]/i;

        // 🔍 Украинские буквы (если есть → значит не русский)
        const ukrLetters = /[єіїґ]/i;

        // 🔍 Латинские буквы (испанский, английский и др.)
        const latinLetters = /[a-záéíóúüñ]/i;

        // 🔍 Проверяем, есть ли русские буквы
        if (russianOnly.test(text)) return false;

        // 🔍 Проверяем, есть ли украинские или латинские буквы
        if (ukrLetters.test(text) || latinLetters.test(text)) return true;

        // // 🟡 Дополнительная проверка: если текст длиннее 2-3 слов и не содержит "русских букв", считаем НЕ русским
        // const words = text.split(/\s+/);
        // if (words.length >= 3) return true;

        // ❓ Не смогли точно определить → считаем русским
        return false;
    };


    return (
        <div className="flex flex-col">


        </div>
    );
}