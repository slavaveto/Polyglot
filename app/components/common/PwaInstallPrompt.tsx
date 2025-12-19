"use client";

import React, { useEffect, useState } from "react";
import { useDevice } from "@/app/utils/providers/MobileDetect";
import { Button, Snippet } from "@heroui/react";
import {useMainContext} from "@/app/context";
import {SquarePlus, Share} from "lucide-react";

function getIOSBrowser(): "safari" | "chrome" | "firefox" | "edge" | "other" {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("crios")) return "chrome";
    if (ua.includes("fxios")) return "firefox";
    if (ua.includes("edgios")) return "edge";
    if (ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios")) return "safari";
    return "other";
}

export default function PwaInstallPrompt() {
    const { isDesktop, isIOS } = useDevice();
    const [isReady, setIsReady] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [browser, setBrowser] = useState<"safari" | "chrome" | "firefox" | "edge" | "other">("other");

    const {
        setShowPwaPrompt
    } = useMainContext();

    useEffect(() => {
        if (typeof window === "undefined") return;
        setBrowser(getIOSBrowser());
        setIsReady(true);
    }, []);

    function isRunningStandalone(): boolean {
        if (typeof window === "undefined") return false;

        const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
        const isIOSStandalone = (window.navigator as any).standalone === true;

        return isInStandaloneMode || isIOSStandalone;
    }

    useEffect(() => {
        if (!isReady || isDesktop) return;

        if (isIOS) {
            if (!isRunningStandalone()) {
                setShowPrompt(true);
                setShowPwaPrompt(true);
            }
            return;
        }

        if (!isRunningStandalone()) {
            setShowPrompt(true);
            setShowPwaPrompt(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [isReady, isIOS, isDesktop, setShowPwaPrompt]);


    useEffect(() => {
        if (typeof window === "undefined") return;
        // 🔍 Проверяем, установлено ли уже приложение (Android, Chrome)
        if ((navigator as any).getInstalledRelatedApps) {
            (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
                const isInstalled = apps.some(app => app.platform === "webapp");
                if (isInstalled) {
                    setDeferredPrompt(null);
                }
            });
        }
    }, []);


    const handleInstall = async () => {
        // if (deferredPrompt) {
        //     deferredPrompt.prompt();
        //     const choice = await deferredPrompt.userChoice;
        //     if (choice.outcome === "accepted") {
        //         setShowPrompt(false);
        //     }
        // }
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            // ❌ НИЧЕГО НЕ ДЕЛАЕМ — пусть заглушка остаётся!
        }
    };



    if (!isReady || isDesktop) return null;
    if (isRunningStandalone()) return null;

    // iOS поведение
    if (isIOS) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center text-center px-4">
                {browser === "safari" ? (
                    <>
                        <div className="flex flex-row items-center mb-6">
                            <img src="icons/icon-192.png" alt="App Icon" className="w-[40px] h-[40px] "/>
                            <span className="text-xl font-bold text-primary">PolyglotApp</span>
                        </div>
                        <h2 className="text-2xl font-semibold mb-4">Добавьте на экран “Домой”</h2>
                        <p className="mb-6 text-default-500 max-w-md">
                            Чтобы начать использовать приложение, добавьте его на экран вашего устройства.
                            <br/><br/>

                            <span> Нажмите на кнопку <span className="inline-flex align-middle ml-[5px]">
                                <Share className={"mt-[-3px]"} size={18}/></span> <strong>Поделиться</strong>.
</span>
                            <br/><br/>
                            А затем выберите

                            <p className="mt-[5px]">
  <span className="inline-flex align-middle"><SquarePlus className={"mt-[-3px]"} size={18}/></span> <strong>Добавить на экран “Домой”</strong>.
</p>

                        </p>
                    </>
                ) : (
                    <>
                        <div className="flex flex-row items-center mb-6">
                            <img src="icons/icon-192.png" alt="App Icon" className="w-[40px] h-[40px] "/>
                            <span className="text-xl font-bold text-primary">PolyglotApp</span>
                        </div>

                        <h2 className="text-2xl font-semibold mb-4">Откройте в Safari</h2>
                        <p className="mb-6 text-default-500  max-w-md">
                            Чтобы установить это приложение, откройте ссылку в Safari.

                            <Snippet  variant={"bordered"} className={"mt-3"}
                                     symbol=""
                            >
                                polyglot-mobile.vercel.app</Snippet>
                        </p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center text-center px-4">

            {/* Логотип + название */}
            <div className="flex flex-row items-center mb-6">
                <img src="icons/icon-192.png" alt="App Icon" className="w-[40px] h-[40px] " />
                <span className="text-xl font-bold text-primary">PolyglotApp</span>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Установите приложение</h2>
            <p className="mb-6 text-default-500 max-w-md">
                Добавьте это приложение на экран вашего устройства, чтобы начать его использовать.
            </p>

            {/*isDisabled={!deferredPrompt}*/}

            <div className="flex gap-4">
                <Button color="primary" onClick={handleInstall} >
                    Установить
                </Button>
                {/*<Button variant="flat" onClick={() => setShowPrompt(false)}>*/}
                {/*    Позже*/}
                {/*</Button>*/}
            </div>
        </div>
    );
}
