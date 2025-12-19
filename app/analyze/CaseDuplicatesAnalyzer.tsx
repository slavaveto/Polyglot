'use client';
import React, { useState, useMemo } from 'react';
import {
   Button,
   Card,
   CardBody,
   CardHeader,
   Chip,
   Progress,
   Checkbox,
} from '@heroui/react';
import { CaseSensitive } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface WordEntry {
   word: string;
   freq: number;
}

interface CaseWord {
   word: string;
   freq: number;
   isCapitalFirst: boolean;
   isAllCaps: boolean;
}

interface FilterOptions {
   showCapitalFirst: boolean;
   showAllCaps: boolean;
}

export const CaseDuplicatesAnalyzer: React.FC = () => {
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [caseWords, setCaseWords] = useState<CaseWord[]>([]);
   const [progress, setProgress] = useState(0);
   const [totalWords, setTotalWords] = useState(0);
   const [analysisComplete, setAnalysisComplete] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [deleteSuccess, setDeleteSuccess] = useState<boolean | null>(null);
   const [filters, setFilters] = useState<FilterOptions>({
      showCapitalFirst: true,
      showAllCaps: true,
   });

   // Функция для проверки, начинается ли слово с заглавной буквы
   const startsWithCapital = (word: string): boolean => {
      return word.charAt(0) === word.charAt(0).toUpperCase() &&
         word.charAt(0) !== word.charAt(0).toLowerCase() &&
         word.slice(1) !== word.slice(1).toUpperCase();
   };

   // Функция для проверки, состоит ли слово полностью из заглавных букв
   const isAllCaps = (word: string): boolean => {
      return word === word.toUpperCase() && word !== word.toLowerCase();
   };

   // Функция для анализа слов с разным регистром
   const analyzeCaseWords = async () => {
      setIsAnalyzing(true);
      setProgress(0);
      setCaseWords([]);
      setAnalysisComplete(false);

      try {
         const response = await fetch('/dict/uk_words.json');
         const words: WordEntry[] = await response.json();

         setTotalWords(words.length);

         const foundWords: CaseWord[] = [];

         words.forEach((entry, index) => {
            const word = entry.word;

            // Проверяем, что слово не пустое и не содержит пробелов
            if (word && !word.includes(' ')) {
               const capitalFirst = startsWithCapital(word);
               const allCaps = isAllCaps(word);

               // Добавляем только слова с заглавной первой буквой или полностью заглавные
               if (capitalFirst || allCaps) {
                  foundWords.push({
                     word: entry.word,
                     freq: entry.freq,
                     isCapitalFirst: capitalFirst,
                     isAllCaps: allCaps
                  });
               }
            }

            if (index % 1000 === 0) {
               setProgress((index / words.length) * 100);
            }
         });

         // Сортируем по частоте
         foundWords.sort((a, b) => b.freq - a.freq);

         setCaseWords(foundWords);
         setProgress(100);
         setAnalysisComplete(true);
      } catch (error) {
         console.error('Ошибка при анализе слов с разным регистром:', error);
      } finally {
         setIsAnalyzing(false);
      }
   };

   // Функция для удаления слов
   const handleDeleteWords = async () => {
      setIsDeleting(true);

      try {
         // Получаем текущий словарь
         const response = await fetch('/dict/uk_words.json');
         const allWords: WordEntry[] = await response.json();

         // Создаем множество слов для удаления
         const wordsToDelete = new Set(filteredWords.map(w => w.word));

         // Фильтруем словарь, оставляя только те слова, которых нет в списке для удаления
         const updatedWords = allWords.filter(
            (entry) => !wordsToDelete.has(entry.word)
         );

         console.log(
            `Удаляем ${wordsToDelete.size} слов из словаря. Было ${allWords.length}, стало ${updatedWords.length}`
         );

         // Отправляем запрос на сохранение обновленного словаря
         const saveResponse = await fetch('/api/dictionary/save', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               language: 'uk',
               dictionary: JSON.stringify(updatedWords),
            }),
         });

         if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(
               `Ошибка при сохранении словаря: ${errorData.error || saveResponse.statusText}`
            );
         }

         // Успешное удаление
         setDeleteSuccess(true);

         // Удаляем слова из списка
         setCaseWords(prev => prev.filter(word => !wordsToDelete.has(word.word)));

         // Закрываем модальное окно через 2 секунды после успешного удаления
         setTimeout(() => {
            setIsDeleteModalOpen(false);
            setDeleteSuccess(null);
         }, 2000);
      } catch (error) {
         console.error('Ошибка при удалении слов:', error);
         setDeleteSuccess(false);
      } finally {
         setIsDeleting(false);
      }
   };

   // Фильтрация слов в зависимости от выбранных фильтров
   const filteredWords = useMemo(() => {
      return caseWords.filter(word => {
         if (!filters.showCapitalFirst && !filters.showAllCaps) {
            return false;
         }

         if (!filters.showCapitalFirst && word.isCapitalFirst && !word.isAllCaps) {
            return false;
         }

         if (!filters.showAllCaps && word.isAllCaps) {
            return false;
         }

         return true;
      });
   }, [caseWords, filters]);

   // Обработчик изменения фильтра
   const toggleFilter = (filterName: keyof FilterOptions) => {
      setFilters(prev => ({
         ...prev,
         [filterName]: !prev[filterName],
      }));
   };

   // Статистика по типам слов
   const wordsStats = useMemo(() => {
      const withCapitalFirst = caseWords.filter(w => w.isCapitalFirst && !w.isAllCaps).length;
      const withAllCaps = caseWords.filter(w => w.isAllCaps).length;

      return { withCapitalFirst, withAllCaps };
   }, [caseWords]);

   // Компонент для отображения слова
   const WordCard = ({ word }: { word: CaseWord }) => {
      return (
         <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
            <div>
               <div className="font-mono text-lg">
                  &quot;{word.word}&quot;
               </div>
               <div className="text-sm font-mono">
                  {word.isCapitalFirst && !word.isAllCaps && (
                     <span className="text-blue-600">
                        [с заглавной буквы]
                     </span>
                  )}
                  {word.isAllCaps && (
                     <span className="text-green-600">
                        [все заглавные]
                     </span>
                  )}
               </div>
            </div>
            <div className="text-right">
               <div className="font-semibold">
                  {word.freq.toLocaleString()}
               </div>
               <div className="text-xs text-default-500">
                  частота
               </div>
            </div>
         </div>
      );
   };

   return (
      <div className="w-full h-full flex flex-col">
         <div className="flex flex-col items-center gap-4 mb-4">
            <Button
               color="primary"
               size="lg"
               startContent={<CaseSensitive size={20} />}
               onClick={analyzeCaseWords}
               isLoading={isAnalyzing}
               disabled={isAnalyzing}
            >
               {isAnalyzing
                  ? 'Идет поиск...'
                  : 'Найти слова с разным регистром'}
            </Button>

            {isAnalyzing && (
               <div className="w-full max-w-md">
                  <Progress
                     value={progress}
                     className="w-full"
                     label="Прогресс анализа"
                     showValueLabel
                  />
                  <p className="text-sm text-default-500 mt-2 text-center">
                     Обработано слов: {totalWords.toLocaleString()}
                  </p>
               </div>
            )}
         </div>

         {analysisComplete && (
            <Card className="container mx-auto px-3 w-[800px] flex-grow flex flex-col h-full">
               <CardHeader>
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-semibold">
                        Слова с разным регистром
                     </h3>
                     <Chip color="primary" variant="flat">
                        {caseWords.length} слов
                     </Chip>
                  </div>
               </CardHeader>
               <CardBody className="flex-grow flex flex-col overflow-hidden">
                  {caseWords.length === 0 ? (
                     <p className="text-default-500 text-center py-8">
                        Слова с разным регистром не найдены
                     </p>
                  ) : (
                     <>
                        <div className="flex flex-col gap-4 mb-4">
                           <div className="flex justify-between items-center">
                              <div className="flex gap-6">
                                 <div className="flex items-center gap-2">
                                    <Checkbox
                                       isSelected={filters.showCapitalFirst}
                                       onValueChange={() => toggleFilter('showCapitalFirst')}
                                       color="primary"
                                    />
                                    <span>С заглавной буквы ({wordsStats.withCapitalFirst})</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Checkbox
                                       isSelected={filters.showAllCaps}
                                       onValueChange={() => toggleFilter('showAllCaps')}
                                       color="success"
                                    />
                                    <span>Все заглавные ({wordsStats.withAllCaps})</span>
                                 </div>
                              </div>
                              <Button
                                 color="danger"
                                 onClick={() => setIsDeleteModalOpen(true)}
                                 disabled={filteredWords.length === 0}
                              >
                                 Удалить слова ({filteredWords.length})
                              </Button>
                           </div>
                        </div>

                        <div className="space-y-2 flex-grow overflow-y-auto h-full">
                           {filteredWords.length === 0 ? (
                              <p className="text-default-500 text-center py-8">
                                 Нет слов, соответствующих выбранным фильтрам
                              </p>
                           ) : (
                              filteredWords.map((item, index) => (
                                 <WordCard key={index} word={item} />
                              ))
                           )}
                        </div>
                     </>
                  )}
               </CardBody>
            </Card>
         )}

         <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteWords}
            isDeleting={isDeleting}
            deleteSuccess={deleteSuccess}
            itemCount={filteredWords.length}
         />
      </div>
   );
};