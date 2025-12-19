"use client";

import {useState, useEffect} from "react";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from "@heroui/react";
import {useMainContext} from "@/app/context";

export default function WordSaveModal({isOpen, onClose, modalData}: {
    isOpen: boolean;
    onClose: () => void;
    modalData: { word: string; context: string } | null;
}) {

    const {language, openSaveModal, selectedWord, selectedTranslation, selectedContext,} = useMainContext();


    const [localIsOpen, setLocalIsOpen] = useState(isOpen);

    useEffect(() => {
        setLocalIsOpen(isOpen);
    }, [isOpen]);

    if (!modalData) return null; // Если данных нет — не рендерим модалку
    const {word,  context} = modalData;

    // Функция для обработки закрытия с задержкой для анимации
    const handleClose = () => {
        setLocalIsOpen(false); // Запускаем локальное закрытие
        setTimeout(onClose, 300);  // 300 — стандартное время анимации HeroUI
    };

    function handleCloseAnimation() {
        handleClose();
    }

    return (
        <>
            <Modal
                isOpen={localIsOpen}
                size="md"
                placement="top"
                onOpenChange={(open) => {
                    if (!open) handleCloseAnimation();
                }}
                title={`Информация о "${word}"`}
            >
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Подробнее</ModalHeader>
                            <ModalBody>
                                <p className="text-gray-700">Здесь будет информация о слове {word}.</p>
                                <p className="text-gray-700">Здесь будет информация о слове {context}.</p>
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button onPress={handleClose} variant="light">
                                        Закрыть
                                    </Button>

                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );

    // ✅ Этот обработчик закрывает модалку и позволяет завершить анимацию

}