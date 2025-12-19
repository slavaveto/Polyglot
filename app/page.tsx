"use client";
import React, {useState, useEffect, useRef, useMemo} from "react";
import {useMainContext} from "@/app/context";
import _TabOne from "@/app/components/Chat";
import TabThree from "@/app/api/archive/_TabThree";
import usePersistentState from "@/app/utils/usePersistentState";
import WordDetailsModal from "@/app/components/Details/_WordDetails";
import WordSaveModal from "@/app/components/WordSave";
import {useDevice} from '@/app/utils/providers/MobileDetect';
import {useSwipeable} from "react-swipeable";
import { Settings } from '@/app/components/Settings';
import { useWindowHeightBreakpoint } from "@/app/utils/useWindowHeight"; // путь подстрой
import LoadingOverlay from "@/app/components/common/LoadingOverlay";
import PwaInstallPrompt from "@/app/components/common/PwaInstallPrompt"; // путь к компоненту может отличаться




import {Select, SelectItem, Tabs, Tab, Button, Spinner} from "@heroui/react";
import {X,} from "lucide-react";

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

export default function Home() {
    const {
        language, setLanguage, selectedTab, setSelectedTab,
        isDetailsModalOpen, openDetailsModal, isSaveModalOpen, openSaveModal,
        selectedWord, selectedTranslation, selectedContext, closeAllModal,
        maxContentWidth, testMobileUi, setTestMobileUi,
        selectedLanguages, showPwaPrompt
    } = useMainContext();




    const heightProfile = useWindowHeightBreakpoint();
    const {isMobile, isTablet, isDesktop} = useDevice();

    const tabs = ["translate", "chat"];
    const handlers = useSwipeable({
        onSwipedLeft: () => {
            const currentIndex = tabs.indexOf(selectedTab);
            if (currentIndex < tabs.length - 1) {
                handleTabChange(tabs[currentIndex + 1]);
            }
        },
        onSwipedRight: () => {
            const currentIndex = tabs.indexOf(selectedTab);
            if (currentIndex > 0) {
                handleTabChange(tabs[currentIndex - 1]);
            }
        },
        trackTouch: true,
        preventScrollOnSwipe: true,
    });

    const chatHeightRef = useRef<number>(0);
    useEffect(() => {
        if (typeof window !== "undefined") {
            const height = typeof isMobile === "undefined" ? 66 : (isMobile ? 66 : 56);
            chatHeightRef.current = heightProfile - height;
        }
    }, [isMobile, heightProfile ]);

    useEffect(() => {
        if (!isDesktop) {
            document.documentElement.classList.add('mobile-touch-lock');
            document.body.classList.add('mobile-touch-lock');
        } else {
            document.documentElement.classList.remove('mobile-touch-lock');
            document.body.classList.remove('mobile-touch-lock');
        }
    }, [isDesktop]);

    const [messagesMap, setMessagesMap] = usePersistentState<Record<string, Message[]>>("messagesMap", {});
    const mode = selectedTab;
    const messages = selectedTab === "chat"
        ? messagesMap["chat"] || []
        : messagesMap[language] || [];

    // Устанавливаем Focus при переключении
    // Но отключен Focus при первом подключении, иначе возникает окантовка вокруг
    const isFirstLoad = useRef<{ [key: string]: boolean }>({translate: true, chat: true, three: true});
    useEffect(() => {
        if (isFirstLoad.current[selectedTab]) {
            //console.log(`🔥 Первая загрузка вкладки ${selectedTab} — фокус НЕ ставим`);
            isFirstLoad.current[selectedTab] = false; // ✅ Запоминаем, что вкладка уже загружена
            return;
        }

        setTimeout(() => {
            const textarea = document.getElementById(`textarea-${selectedTab}`) as HTMLTextAreaElement;
            //console.log(`✅ Фокус на textarea` + textarea);
            if (textarea && isDesktop) {
                textarea.focus();
            }
        }, 500);
    }, [selectedTab]);

    const visitedTabsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        setTimeout(() => {
            const chatContainer = document.getElementById(`chat-container-${selectedTab}`);
            if (chatContainer) {
                if (!visitedTabsRef.current.has(selectedTab)) {
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: "instant"
                    });
                    visitedTabsRef.current.add(selectedTab); // Запоминаем, что вкладка была посещена
                }
            }
        }, 100);
    }, [selectedTab]);

    const [isFading, setIsFading] = useState(false);
    const [isContentVisible, setIsContentVisible] = useState(true);


    const setMessages = (update: Message[] | ((prev: Message[]) => Message[])) => {
        const key = selectedTab === "chat" ? "chat" : language;
        setMessagesMap(prev => {
            const updated = typeof update === "function"
                ? update(prev[key] || [])
                : update;
            return {
                ...prev,
                [key]: updated.slice(-60),
            };
        });
    };

    useEffect(() => {
        if (!selectedLanguages.includes(language)) {
            const fallbackLang = selectedLanguages.find(Boolean); // первый непустой
            if (fallbackLang) {
                setLanguage(fallbackLang);
            }
        }
    }, [selectedLanguages, language, setLanguage]);

    const [firstLoadFade, setFirstLoadFade] = useState(false);
    const [showSpinner, setShowSpinner] = useState(true);
    useEffect(() => {
        const spinnerTimer = setTimeout(() => {
            setShowSpinner(false);
            const contentTimer = setTimeout(() => {
                setFirstLoadFade(true);
            }, 500);
        }, 1000); // Показываем спиннер 1с
        return () => clearTimeout(spinnerTimer);
    }, []);

    const mainRef = useRef<HTMLDivElement>(null);
    const scrollMainToBottom = () => {
        // подождать ~100-300 мс, пока клавиатура появится
        setTimeout(() => {
            console.log("scrollMainToBottom")
            mainRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
        }, 500); // можно экспериментировать: 200–400 мс
    };

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                // 🔻 Уходим в фон — мгновенно убираем fade
                //setFirstLoadFade(false);
            } else if (document.visibilityState === "visible") {
                // 🔺 Возвращаемся — снимаем фокус и включаем fade с задержкой
                (document.activeElement as HTMLElement)?.blur();

                // Закрываем Drawer, если открыт
                setIsDrawerOpen(false);

                if (!isDesktop) {
                    setFirstLoadFade(false);
                    setTimeout(() => setFirstLoadFade(true), 500);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const handleTabChange = (key: string) => {
        if (key === selectedTab) return;

        setIsFading(true); // Начинаем анимацию исчезновения

        setTimeout(() => {
            setIsContentVisible(false); // Скрываем контент
            setSelectedTab(key); // Меняем вкладку

            setTimeout(() => {
                setIsFading(false); // Включаем плавное появление
                setIsContentVisible(true);

                setTimeout(() => {
                    const newChatContainer = document.getElementById(`chat-container-${key}`);
                    if (newChatContainer) {
                        newChatContainer.scrollTo({
                            top: newChatContainer.scrollHeight,
                            behavior: "instant",
                        });
                    }
                }, 100);
            }, 300);
        }, 150);
    };

    return (
        <>
            <PwaInstallPrompt />

            {/*<div className="fixed bottom-2 right-2 bg-black text-white text-[14px] px-2 py-1 rounded z-[9999]">*/}
            {/*    {String(showPwaPrompt)}*/}
            {/*</div>*/}

            {/* Модалка "Подробнее" */}
            {isDetailsModalOpen && (
                <WordDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={closeAllModal}
                    modalData={selectedWord ? {
                        word: selectedWord,
                        context: selectedContext || ""
                    } : null}
                />)}
            {isSaveModalOpen && (
                <WordSaveModal
                    isOpen={isSaveModalOpen}
                    onClose={closeAllModal}
                    modalData={selectedWord ? {
                        word: selectedWord,
                        context: selectedContext || ""
                    } : null}
                />)}

            <LoadingOverlay show={showSpinner} />

            <div ref={mainRef}
                 className={`flex flex-col
             transition-opacity ${firstLoadFade ? "duration-500 opacity-100" : "duration-10 opacity-0"}
             
             `}>

                <header
                    className={`flex justify-between items-center p-3 pt-2 pb-[4px] container mx-auto`}
                    style={{
                        maxWidth: `${maxContentWidth}px`,
                        //height: `${tabsHeight}px`,
                    }}>
                    <Tabs
                        aria-label="Основные вкладки"
                        variant={"underlined"}
                        color="primary"
                        selectedKey={selectedTab}

                        onSelectionChange={(key) => handleTabChange(key as string)}

                        classNames={{
                            tabList: `flex w-full gap-3 m-0 p-0 justify-between h-[54px] xs500:h-[44px] `,
                            tab: `w-full h-[52px] xs500:h-[42px] border-b border-divider text-[18px]`,
                            cursor: "w-full  bg-primary -mb-[2px] h-[2px]",
                            tabContent: "group-data-[selected=true]:font-medium",
                        }}

                    >
                        <Tab key="translate" title="Translate"/>
                        <Tab key="chat" title="Chat"/>
                        {/*<Tab key="three" title="Texts"/>*/}
                    </Tabs>

                    <div className={"flex gap-3 mt-[0px]"}>

                        {/*{isDesktop && (*/}
                        {/*    <button*/}
                        {/*        onClick={() => setTestMobileUi((prev) => !prev)}*/}
                        {/*        className={`px-4 py-2 rounded-md text-white text-[14px] transition ${*/}
                        {/*            testMobileUi ? "bg-green-500" : "bg-gray-500"*/}
                        {/*        }`}*/}
                        {/*    >*/}
                        {/*        {testMobileUi ? "🟢 ON" : "⚪ OFF"}*/}
                        {/*    </button>*/}
                        {/*)}*/}





                        {/*<Button*/}
                        {/*    //variant="light"*/}
                        {/*    isIconOnly*/}
                        {/*    //className="text-default-300 hover:text-default-700"*/}
                        {/*    onClick={() => {*/}

                        {/*    }}*/}
                        {/*>*/}
                        {/*    <MessageCircleWarning size={26} />*/}
                        {/*</Button>*/}

                        {/*<Button*/}
                        {/*    //variant="light"*/}
                        {/*    isIconOnly*/}
                        {/*    //className="text-default-300 hover:text-default-700"*/}
                        {/*    onClick={() => {*/}

                        {/*    }}*/}
                        {/*>*/}
                        {/*    <CircleHelp size={26} />*/}
                        {/*</Button>*/}

                        <Settings
                            isOpen={isDrawerOpen}
                            setIsOpen={setIsDrawerOpen}
                            setFirstLoadFade={setFirstLoadFade} />


                    </div>

                    {/*<Tabs*/}
                    {/*    aria-label="Выбор языка"*/}
                    {/*    color="default"*/}
                    {/*    size="sm"*/}
                    {/*    //variant={"bordered"}*/}
                    {/*    selectedKey={language}*/}
                    {/*    // onSelectionChange={(key) => setLanguage(key as "ua" | "es" | "chat")}*/}
                    {/*    onSelectionChange={(key) => setLanguage(key as "ua" | "es")}*/}

                    {/*    classNames={{*/}
                    {/*        tabList: "gap-[0px]  p-[2px] rounded-small",*/}
                    {/*        tab: "h-[30px]  px-[8px] ",*/}
                    {/*        tabContent: "group-data-[selected=true]:text-primary-400",*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    <Tab key="ua" title={<div className="flex items-center text-xl">🇺🇦</div>}/>*/}
                    {/*    <Tab key="es" title={<div className="flex items-center text-xl">🇪🇸</div>}/>*/}
                    {/*    /!*<Tab key="chat" title={<div className="flex items-center text-xl">💬</div>} />*!/*/}

                    {/*    /!*<Tab key="ua" title={<div className="flex items-center">UA</div>}/>*!/*/}
                    {/*    /!*<Tab key="es" title={<div className="flex items-center">ES</div>}/>*!/*/}
                    {/*</Tabs>*/}

                </header>

                <main
                    {...handlers}
                    className={`flex-grow container mx-auto transition-all duration-50
                    ${isFading ? "opacity-0 duration-200" : "opacity-100 duration-500"}`}
                    style={{
                        maxWidth: `${maxContentWidth}px`,
                    }}
                >
                    {isContentVisible && (
                        <>
                            {selectedTab === "translate" && <_TabOne messages={messages} setMessages={setMessages}
                                                                     chatHeight={chatHeightRef.current}
                                                                     onKeyboardOpen={scrollMainToBottom}
                                                                     mode="translate"
                            />}

                            {selectedTab === "chat" && <_TabOne messages={messages} setMessages={setMessages}
                                                                chatHeight={chatHeightRef.current}
                                                                onKeyboardOpen={scrollMainToBottom}
                                                                mode="chat"
                            />}

                            {/*{selectedTab === "two" && <TabTwo messages={messagesChat} setMessages={setMessagesChat}*/}
                            {/*                                  chatHeight={chatHeightRef.current}/>}*/}

                            {selectedTab === "three" && <TabThree/>}
                        </>
                    )}
                </main>

            </div>
        </>
    );

}