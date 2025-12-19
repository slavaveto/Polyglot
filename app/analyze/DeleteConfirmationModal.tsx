import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { AlertTriangle, Check } from 'lucide-react';

interface DeleteConfirmationModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   isDeleting: boolean;
   deleteSuccess: boolean | null;
   itemCount: number;
   mode?: 'normal' | 'caseDuplicates';
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
                                                                                   isOpen,
                                                                                   onClose,
                                                                                   onConfirm,
                                                                                   isDeleting,
                                                                                   deleteSuccess,
                                                                                   itemCount,
                                                                                   mode = 'normal',
                                                                                }) => {
   return (
      <Modal isOpen={isOpen} onClose={() => !isDeleting && onClose()}>
         <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
               Подтверждение удаления
            </ModalHeader>
            <ModalBody>
               {deleteSuccess === true ? (
                  <div className="text-center py-4">
                     <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                           <Check size={24} className="text-success-500" />
                        </div>
                     </div>
                     <p className="text-success-600 font-semibold">
                        Слова успешно удалены из словаря!
                     </p>
                  </div>
               ) : deleteSuccess === false ? (
                  <div className="text-center py-4">
                     <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                           <AlertTriangle size={24} className="text-danger-500" />
                        </div>
                     </div>
                     <p className="text-danger-600 font-semibold">
                        Произошла ошибка при удалении слов
                     </p>
                  </div>
               ) : (
                  <div>
                     <p className="text-danger-600 font-semibold text-lg mb-2">
                        {mode === 'caseDuplicates'
                           ? `Вы уверены, что хотите удалить ${itemCount} дубликатов слов?`
                           : `Вы уверены, что хотите удалить ${itemCount} слов из словаря?`}
                     </p>
                     <p className="text-default-600">
                        {mode === 'caseDuplicates'
                           ? 'Будут оставлены только варианты слов в нижнем регистре, остальные будут удалены.'
                           : 'Это действие нельзя будет отменить. Все выбранные слова будут удалены из словаря.'}
                     </p>
                  </div>
               )}
            </ModalBody>
            <ModalFooter>
               {deleteSuccess === null && (
                  <>
              <Button
                 color="default"
                 variant="light"
                 onPress={onClose}
                 disabled={isDeleting}
              >
                Отмена
              </Button>
              <Button
                 color="danger"
                 onPress={onConfirm}
                 isLoading={isDeleting}
              >
                Да, удалить
              </Button>
            </>
               )}
            </ModalFooter>
         </ModalContent>
      </Modal>
   );
};