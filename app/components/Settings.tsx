"use client";

import { useEffect } from "react"; // если ещё не импортирован
import React from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Select,
    SelectItem,
    Button, Chip
} from "@heroui/react";
import {useMainContext} from "@/app/context";
import {Settings as SettingsIcon, RefreshCcw} from "lucide-react";
import {languages, languageMeta} from "@/app/utils/languages";

import type {Selection} from "@react-types/shared";

interface SettingsProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    setFirstLoadFade: (fade: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({isOpen, setIsOpen, setFirstLoadFade}) => {
    const {selectedLanguages, setSelectedLanguages, maxContentWidth} = useMainContext();

    const MAX_SELECTED_LANGUAGES = 3;

    const handleReset = () => {
        setIsOpen(false);
        setTimeout(() => {
            setFirstLoadFade(false);
            setTimeout(() => location.reload(), 500);
        }, 300);
    };



    useEffect(() => {
        if (selectedLanguages.some((l) => l === "")) {
            const cleaned = selectedLanguages.filter(Boolean);
            const fallback = cleaned.length === 0 ? ["en"] : cleaned;
            //console.log("🧹 Очищаем пустые значения:", fallback);
            setSelectedLanguages(fallback);
        }
    }, [selectedLanguages]);

    return (
        <>
            <button
                className="text-default-500 hover:text-default-700 transition-all duration-300"
                onClick={() => setIsOpen(true)}
            >
                <SettingsIcon size={26}/>
            </button>


            <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}

                    placement="top"
                    motionProps={{
                        variants: {
                            //@ts-expect-error
                            enter: {opacity: 1, y: 0, duration: 0.3},
                            //@ts-expect-error
                            exit: {y: -100, opacity: 0, duration: 0.3},
                        },
                    }}
                    classNames={{
                        //wrapper: `w-[calc(100%-24px)] max-w-[${maxContentWidth}px] mx-auto`,
                        header: "pt-[20px]",
                        closeButton: "top-[10px] right-[10px] text-[22px]",
                    }}
            >
                <DrawerContent className={`w-[calc(100%-24px)] max-w-[${maxContentWidth}px] mx-auto`}
                               style={{
                                   maxWidth: `${maxContentWidth}px`,
                                   marginLeft: "auto",
                                   marginRight: "auto",
                               }}
                >
                    <DrawerHeader className="flex flex-row justify-between px-[12px] items-center ">
                        Настройки

                    </DrawerHeader>

                    <DrawerBody className="px-[12px]">
                        <div className="mt-3">
                            <h3 className="text-md font-semibold  mb-3">Выберите до 3-х изучаемых языков</h3>

                            <Select
                                label="Изучаемые языки"
                                className="max-w-xs"
                                placeholder="Выберите языки"
                                selectionMode="multiple"
                                selectedKeys={new Set(selectedLanguages)}
                                onSelectionChange={(keys: Selection) => {
                                    const values = Array.from(keys as Set<string>);

                                    // 🔍 ЛОГИ ДЛЯ ОТЛАДКИ
                                    console.log("🔹 Выбрано языков:", values.length, values);
                                    console.log("🔹 До применения лимита:", values);
                                    console.log("🧪 typeof keys:", typeof keys, keys);
                                    console.log("🧪 instanceof Set:", keys instanceof Set);

                                    const withLimit = values.length > MAX_SELECTED_LANGUAGES ? selectedLanguages : values;
                                    console.log("🔸 После применения лимита:", withLimit);

                                    const final = withLimit.length === 0 ? ["en"] : withLimit;
                                    console.log("✅ Final selectedLanguages:", final);

                                    setSelectedLanguages(final);
                                }}
                                renderValue={(items) => (
                                    <div className="flex gap-2 items-center flex-wrap">
                                        {items.map((item, index) => {
                                            const key = item.key as string;
                                            const emoji = languageMeta[key]?.emoji || "🌐";
                                            return (
                                                <span key={key} className="flex items-center gap-1">
          {emoji} <span className="uppercase text-sm">{key}</span>
                                                    {index < items.length - 1 && <span>,</span>}
        </span>
                                            );
                                        })}
                                    </div>
                                )}
                            >
                                {[...languages]
                                    .sort((a, b) =>
                                        (a.accusative || "").localeCompare(b.accusative || "", "ru")
                                    )
                                    .map((lang) => (
                                        <SelectItem
                                            key={lang.key}
                                            isDisabled={
                                                selectedLanguages.length >= MAX_SELECTED_LANGUAGES &&
                                                !selectedLanguages.includes(lang.key)
                                            }
                                        >
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                {/*{languages.map((lang) => (*/}
                                {/*    <SelectItem*/}
                                {/*        key={lang.key}*/}
                                {/*        isDisabled={*/}
                                {/*            selectedLanguages.length >= MAX_SELECTED_LANGUAGES &&*/}
                                {/*            !selectedLanguages.includes(lang.key)*/}
                                {/*        }*/}
                                {/*    >*/}
                                {/*        {lang.label}*/}
                                {/*    </SelectItem>*/}
                                {/*))}*/}
                            </Select>

                            <div className="flex gap-2 mt-4 flex-wrap">
                                {selectedLanguages.map((langKey: string, index: number) => {
                                    const lang = languages.find((l) => l.key === langKey);
                                    if (!lang) return null;

                                    return (
                                        <Chip
                                            key={index}
                                            variant="flat"
                                            onClose={() => {
                                                const updated = selectedLanguages.filter((l) => l !== langKey);
                                                setSelectedLanguages(updated.length === 0 ? ["en"] : updated);
                                            }}
                                        >
                                            {lang.label}
                                        </Chip>
                                    );
                                })}
                            </div>

                        </div>
                    </DrawerBody>

                    <DrawerFooter className="px-[12px] flex gap-4 mt-3">
                        <Button variant="flat" onClick={handleReset}
                                color={"success"}>
                            <RefreshCcw id="refresh-icon" size={20}/> Reload
                        </Button>
                        <Button onClick={() => setIsOpen(false)}>Закрыть</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
};
