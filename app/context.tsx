"use client";
import { createContext, useContext, useState, useEffect } from "react";
import usePersistentState from "@/app/utils/usePersistentState"

// ✅ Определяем типы
interface MainContextType {
//2345
    language: string;
    setLanguage: (lang: string) => void;
    selectedTab: string;
    setSelectedTab: (tab: string) => void;

    isDetailsModalOpen: boolean;
    openDetailsModal: (data: { word: string; context: string }) => void;
    isSaveModalOpen: boolean;
    openSaveModal: (data: { word: string; context: string }) => void;
    closeAllModal: () => void;

    selectedWord: string | null;
    selectedTranslation: string | null;
    selectedContext: string | null;

    maxContentWidth: number;

    testMobileUi: boolean;
    setTestMobileUi: React.Dispatch<React.SetStateAction<boolean>>;

    selectedLanguages: string[];
    setSelectedLanguages: (langs: string[]) => void;

    showPwaPrompt: boolean;
    setShowPwaPrompt: (val: boolean) => void;

    visiblePlaceholderLang: string;
    setVisiblePlaceholderLang: (lang: string) => void;
}

// ✅ Создаём контекст
const MainContext = createContext<MainContextType | undefined>(undefined);

// ✅ Провайдер контекста
export function MainProvider({ children }: { children: React.ReactNode }) {

    const [maxContentWidth, setMaxContentWidth] = useState(650);

    const [language, setLanguage] = usePersistentState<string>("appLanguage", "en");
    const [selectedTab, setSelectedTab] = usePersistentState<string>("selectedTab", "translate");

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
    const [selectedContext, setSelectedContext] = useState<string | null>(null);

    const openDetailsModal = ({ word, context }: { word: string; context: string }) => {
        console.log("🔥 Открываем DetailsModal с данными:", { word,  context });
        setSelectedWord(word);
        setSelectedContext(context);
        setIsDetailsModalOpen(true);
    };
    const openSaveModal = ({ word, context }: { word: string; context: string }) => {
        console.log("🔥 Открываем SaveModal с данными:", { word,  context });
        setSelectedWord(word);
        setSelectedContext(context);
        setIsSaveModalOpen(true);
    };
    const closeAllModal = () => {
        setIsDetailsModalOpen(false);
        setIsSaveModalOpen(false);
        setSelectedWord(null);
    };

    useEffect(() => {
        // 📤 Отправляем изменение иконки в Electron
        if (window.electron) {
            window.electron.sendToElectron("change-icon", language);
        }
    }, [language]);

    const [testMobileUi, setTestMobileUi] = useState(false);
    const [selectedLanguages, setSelectedLanguages] = usePersistentState<string[]>("selectedLanguages", ["en", "es", ""]);
    const [showPwaPrompt, setShowPwaPrompt] = useState(false);
    const [visiblePlaceholderLang, setVisiblePlaceholderLang] = useState(language);
    // 🔁 Поддерживать в синхронизации с language
    useEffect(() => {
        setVisiblePlaceholderLang(language);
    }, [language]);

    return (
        <MainContext.Provider value={{
            language, setLanguage, selectedTab, setSelectedTab,
            isDetailsModalOpen, isSaveModalOpen,
            selectedWord, selectedTranslation, selectedContext,
            openDetailsModal, openSaveModal, closeAllModal,

            maxContentWidth, testMobileUi, setTestMobileUi,
            selectedLanguages, setSelectedLanguages,

            showPwaPrompt, setShowPwaPrompt,
            visiblePlaceholderLang, setVisiblePlaceholderLang,
        }}>
            {children}
        </MainContext.Provider>
    );
}

// ✅ Хук для использования контекста
export function useMainContext() {
    const context = useContext(MainContext);
    if (!context) {
        throw new Error("useLanguage должен использоваться внутри <MainProvider>");
    }
    return context;
}