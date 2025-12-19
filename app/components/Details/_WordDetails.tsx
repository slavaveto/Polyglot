"use client";

import React, {useState, useEffect, useRef} from "react";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Spinner} from "@heroui/react";
import {useMainContext} from "@/app/context";
import ChatDetails from "@/app/components/Details/ChatDetails";
import {ArrowUp, Check, Copy, Edit, X} from "lucide-react";
import _TabOne from "@/app/components/Chat";
import usePersistentState from "@/app/utils/usePersistentState";

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

export default function WordDetailsModal({isOpen, onClose, modalData}: {
    isOpen: boolean;
    onClose: () => void;
    modalData: { word: string; context: string } | null;
}) {
    const {language, openSaveModal, selectedWord, selectedTranslation, selectedContext,} = useMainContext();

    const languageRef = useRef(language); // ✅ Сохраняем актуальное значение языка
    useEffect(() => {
        languageRef.current = language; // ✅ Гарантируем актуальное значение
    }, [language]);

    const [messagesDetails, setMessagesDetails] = usePersistentState<Message[]>("messagesDetails", []);
    const messages = messagesDetails

    const setMessages = (update: Message[] | ((prevMessages: Message[]) => Message[])) => {
        setMessagesDetails((prevMessages) => {
            const updatedMessages = typeof update === "function" ? update(prevMessages) : update;
            return updatedMessages.slice(-60);
        });
    };

    const [localIsOpen, setLocalIsOpen] = useState(isOpen);
    useEffect(() => {
        setLocalIsOpen(isOpen);
    }, [isOpen]);
    const handleClose = () => {
        setLocalIsOpen(false); // Запускаем локальное закрытие
        setTimeout(onClose, 300);  // 300 — стандартное время анимации HeroUI
    };

    function handleCloseAnimation() {
        handleClose();
    }

    const modalHeightRef = useRef(0);

    const chatHeightRef = useRef<number>(0);
    const modalTitleHeight = 43
    const textAriaHeight = 56

    useEffect(() => {
        if (typeof window !== "undefined") {
            modalHeightRef.current = Math.round(window.innerHeight * 0.95);
            chatHeightRef.current = modalHeightRef.current - modalTitleHeight - textAriaHeight;
            //console.log("✅ 90% высоты окна:", chatHeightRef.current);
        }
    }, []);



    if (!modalData) return null;
    const {word, context} = modalData;

    return (
        <>
            <Modal
                isOpen={localIsOpen}
                size="md"
                placement="top"
                onOpenChange={(open) => {
                    if (!open) handleCloseAnimation();
                }}
                className=" "
                classNames={{
                    base: "p-0 m-0 ",
                    body: "p-0 m-0",
                    header: "py-[6px] mb-[3px] border-b-1 border-divider font-normal",
                }}
                style={{
                    height:`${modalHeightRef.current}px`,
                    maxHeight: `${modalHeightRef.current}px`,
            }}
            >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">Подробнее</ModalHeader>
                        <ModalBody>

                            <ChatDetails messages={messages} setMessages={setMessages}
                                         chatHeight={chatHeightRef.current} modalIsOpen={isOpen}
                                         word = {modalData.word}
                                         context = {modalData.context}
                                         language={languageRef.current}
                            />

                        </ModalBody>
                    </ModalContent>
            </Modal>
        </>
    );

}