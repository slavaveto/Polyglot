"use client";

import { useState, useEffect, RefObject, useRef } from "react";
import { useDevice } from "@/app/utils/providers/MobileDetect";
import { useMainContext } from "@/app/context";
import { languageMeta } from "@/app/utils/languages";

export default function LanguageSelect({
                                           language,
                                           setLanguage,
                                           textareaRef,
                                           positionClass = "",
                                       }: {
    language: string;
    setLanguage: (lang: string) => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    positionClass?: string;
}) {
    const { testMobileUi, selectedLanguages } = useMainContext();
    const { isDesktop } = useDevice();

    const isMobileUI = testMobileUi || !isDesktop;
    const emojiSize = isMobileUI ? 40 : 32;

    const emojiDropdown =
        isMobileUI
            ? "bottom-[70px] left-[-15px] gap-[20px] px-4 py-2"
            : "bottom-[40px] left-[-11px] gap-[15px] px-3 py-2";

    const [showDropdown, setShowDropdown] = useState(false);
    const [currentLangKey, setCurrentLangKey] = useState(language);
    const [isFading, setIsFading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentLangKey(language);
    }, [language]);

    const handleLanguageChange = (newLang: string) => {
        setIsFading(true);
        setTimeout(() => {
            setCurrentLangKey(newLang);
            setLanguage(newLang);
            setIsFading(false);
        }, 200);

        setShowDropdown(false);

        setTimeout(() => {
            if (isDesktop) {
                textareaRef.current?.focus();
            }
        }, 500);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | PointerEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("pointerdown", handleClickOutside);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
        };
    }, []);

    const filteredLanguages = selectedLanguages.filter(Boolean);
    const currentLang =
        filteredLanguages.find((key) => key === currentLangKey) || filteredLanguages[0];
    const otherLanguages = filteredLanguages.filter((key) => key !== currentLang);

    const handleMainClick = () => {
        if (filteredLanguages.length === 1) return;

        if (filteredLanguages.length === 2) {
            const nextLang = otherLanguages[0];
            handleLanguageChange(nextLang);
        } else {
            setShowDropdown((prev) => !prev);
        }
    };

    const isClickable = filteredLanguages.length >= 2;

    return (
        <div
            ref={containerRef}
            className="relative z-50 mt-[2px] transition-all duration-300"
        >
            {/* Текущий язык */}
            <span
                className={`relative  rounded-full flex items-center justify-center
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        ${isClickable && isDesktop ? "hover:brightness-110" : ""}
        transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}
      `}
                style={{
                    fontSize: `${emojiSize}px`,
                    width: `${emojiSize}px`,
                    height: `${emojiSize}px`
                }}
                onPointerDown={(e) => {
                    if (!isClickable) {
                        e.preventDefault(); // ✅ предотврати потерю фокуса, если язык только один
                        return;
                    }
                    e.preventDefault();
                    handleMainClick();
                }}
            >
        {languageMeta[currentLang]?.emoji || "🌐"}
      </span>

            {/* Выпадающий список */}
            {filteredLanguages.length > 2 && showDropdown && (
                <div
                    className={`absolute flex flex-row bg-content2 rounded-lg shadow-md brightness-100 ${emojiDropdown}`}
                    style={{ cursor: "default" }}
                >
                    {otherLanguages.map((key) => (
                        <span
                            key={key}
                            className="flex items-center pointer-events-auto transition-all duration-300 hover:brightness-110 cursor-pointer"
                            onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLanguageChange(key);
                            }}
                            style={{ fontSize: `${emojiSize}px` }}
                        >
              {languageMeta[key]?.emoji || "🌐"}
            </span>
                    ))}
                </div>
            )}
        </div>
    );
}