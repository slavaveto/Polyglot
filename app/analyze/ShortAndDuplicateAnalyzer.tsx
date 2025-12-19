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
   Tabs,
   Tab,
} from '@heroui/react';
import { Search, Copy } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface WordEntry {
   word: string;
   freq: number;
}

interface FilterOptions {
   showShortWords: boolean;
   showDuplicates: boolean;
}

interface DuplicateGroup {
   word: string;
   entries: WordEntry[];
   totalFreq: number;
}

export const ShortAndDuplicateAnalyzer: React.FC = () => {
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [shortWords, setShortWords] = useState<WordEntry[]>([]);
   const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
   const [progress, setProgress] = useState(0);
   const [totalWords, setTotalWords] = useState(0);
   const [analysisComplete, setAnalysisComplete] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [deleteSuccess, setDeleteSuccess] = useState<boolean | null>(null);
   const [filters, setFilters] = useState<FilterOptions>({
      showShortWords: true,
      showDuplicates: true,
   });
   const [selectedTab, setSelectedTab] = useState("short");

   // Функция для анализа коротких и дублирующихся слов
   const analyzeWords = async () => {
      setIsAnalyzing(true);
      setProgress(0);
      setShortWords([]);
      setDuplicateGroups([]);
      setAnalysisComplete(false);

      try {
         const response = await fetch('/dict/uk_words.json');
         const words: WordEntry[] = await response.json();

         setTotalWords(words.length);

         // Поиск коротких слов (1-2 символа)
         const foundShortWords: WordEntry[] = [];

         // Словарь для поиска дубликатов
         const wordMap: Record<string, WordEntry[]> = {};

         words.forEach((entry, index) => {
            const word = entry.word.trim();

            // Проверяем короткие слова
            if (word.length <= 2) {
               foundShortWords.push(entry);
            }

            // Собираем дубликаты
            if (!wordMap[word]) {
               wordMap[word] = [];
            }
            wordMap[word].push(entry);

            if (index % 1000 === 0) {
               setProgress((index / words.length) * 100);
            }
         });

         // Находим только те группы, где есть дубликаты
         const duplicates: DuplicateGroup[] = [];

         Object.entries(wordMap).forEach(([word, entries]) => {
            if (entries.length > 1) {
               const totalFreq = entries.reduce((sum, entry) => sum + entry.freq, 0);
               duplicates.push({
                  word,
                  entries,
                  totalFreq
               });
            }
         });

         // Сортируем короткие слова по частоте
         foundShortWords.sort((a, b) => b.freq - a.freq);

         // Сортируем дубликаты по общей частоте
         duplicates.sort((a, b) => b.totalFreq - a.totalFreq);

         setShortWords(foundShortWords);
         setDuplicateGroups(duplicates);
         setProgress(100);
         setAnalysisComplete(true);
      } catch (error) {
         console.error('Ошибка при анализе слов:', error);
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
         const wordsToDelete = new Set<string>();

         if (selectedTab === "short" && filters.showShortWords) {
            shortWords.forEach(word => wordsToDelete.add(word.word));
         } else if (selectedTab === "duplicates" && filters.showDuplicates) {
            // Для каждой группы дубликатов оставляем только одно вхождение (с наибольшей частотой)
            duplicateGroups.forEach(group => {
               // Сортируем по частоте (по убыванию)
               const sorted = [...group.entries].sort((a, b) => b.freq - a.freq);

               // Оставляем первый элемент (с наибольшей частотой)
               // и добавляем остальные в список для удаления
               for (let i = 1; i < sorted.length; i++) {
                  wordsToDelete.add(sorted[i].word);
               }
            });
         }

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

         // Обновляем списки слов
         if (selectedTab === "short") {
            setShortWords([]);
         } else if (selectedTab === "duplicates") {
            setDuplicateGroups([]);
         }

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

   // Обработчик изменения фильтра
   const toggleFilter = (filterName: keyof FilterOptions) => {
      setFilters(prev => ({
         ...prev,
         [filterName]: !prev[filterName],
      }));
   };

   // Компонент для отображения слова
   const WordCard = ({ word, freq }: { word: string; freq: number }) => {
      return (
         <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
            <div>
               <div className="font-mono text-lg">
                  &quot;{word}&quot;
               </div>
               <div className="text-sm font-mono">
                  <span className="text-blue-600">
                     Длина: {word.length} символа
                  </span>
               </div>
            </div>
            <div className="text-right">
               <div className="font-semibold">
                  {freq.toLocaleString()}
               </div>
               <div className="text-xs text-default-500">
                  частота
               </div>
            </div>
         </div>
      );
   };

   // Компонент для отображения группы дубликатов
   const DuplicateGroupCard = ({ group }: { group: DuplicateGroup }) => {
      return (
         <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
            <div>
               <div className="font-mono text-lg">
                  &quot;{group.word}&quot;
               </div>
               <div className="text-sm font-mono">
                  <span className="text-warning-600">
                     Дубликатов: {group.entries.length}
                  </span>
               </div>
            </div>
            <div className="text-right">
               <div className="font-semibold">
                  {group.totalFreq.toLocaleString()}
               </div>
               <div className="text-xs text-default-500">
                  общая частота
               </div>
            </div>
         </div>
      );
   };

   // Подсчет количества слов для удаления
   const itemsToDelete = selectedTab === "short"
      ? shortWords.length
      : duplicateGroups.reduce((count, group) => count + group.entries.length - 1, 0);

   return (
      <div className="w-full h-full flex flex-col">
         <div className="flex flex-col items-center gap-4 mb-4">
            <Button
               color="primary"
               size="lg"
               startContent={<Search size={20} />}
               onClick={analyzeWords}
               isLoading={isAnalyzing}
               disabled={isAnalyzing}
            >
               {isAnalyzing
                  ? 'Идет поиск...'
                  : 'Найти короткие и дублирующиеся слова'}
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
                        Короткие и дублирующиеся слова
                     </h3>
                     <div className="flex gap-2">
                        <Chip color="primary" variant="flat">
                           Короткие: {shortWords.length}
                        </Chip>
                        <Chip color="warning" variant="flat">
                           Дубликаты: {duplicateGroups.length}
                        </Chip>
                     </div>
                  </div>
               </CardHeader>
               <CardBody className="flex-grow flex flex-col overflow-hidden h-full">
                  {/* Обертка для Tabs, чтобы она занимала всю высоту */}
                  <div className="flex flex-col h-full">
                     <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(key as string)}
                        variant="underlined"
                        color="primary"
                        className="mb-4 h-full flex flex-col"
                     >
                        <Tab key="short" title={`Короткие слова (${shortWords.length})`} className="h-full flex-grow flex flex-col">
                           <div className="flex justify-between items-center mb-4">
                              <p className="text-default-600">
                                 Найдено {shortWords.length} коротких слов (1-2 символа)
                              </p>
                              <Button
                                 color="danger"
                                 onClick={() => setIsDeleteModalOpen(true)}
                                 disabled={shortWords.length === 0}
                              >
                                 Удалить короткие слова ({shortWords.length})
                              </Button>
                           </div>

                           {/* Контейнер для скролла должен иметь явную высоту */}
                           <div className="space-y-2 flex-grow overflow-y-auto" style={{ minHeight: "300px" }}>
                              {shortWords.length === 0 ? (
                                 <p className="text-default-500 text-center py-8">
                                    Короткие слова не найдены
                                 </p>
                              ) : (
                                 shortWords.map((item, index) => (
                                    <WordCard key={index} word={item.word} freq={item.freq} />
                                 ))
                              )}
                           </div>
                        </Tab>

                        <Tab key="duplicates" title={`Дубликаты (${duplicateGroups.length})`} className="h-full flex-grow flex flex-col">
                           <div className="flex justify-between items-center mb-4">
                              <p className="text-default-600">
                                 Найдено {duplicateGroups.length} групп дублирующихся слов
                              </p>
                              <Button
                                 color="danger"
                                 onClick={() => setIsDeleteModalOpen(true)}
                                 disabled={duplicateGroups.length === 0}
                              >
                                 Удалить дубликаты ({duplicateGroups.reduce((count, group) => count + group.entries.length - 1, 0)})
                              </Button>
                           </div>

                           {/* Контейнер для скролла должен иметь явную высоту */}
                           <div className="space-y-2 flex-grow overflow-y-auto" style={{ minHeight: "300px" }}>
                              {duplicateGroups.length === 0 ? (
                                 <p className="text-default-500 text-center py-8">
                                    Дублирующиеся слова не найдены
                                 </p>
                              ) : (
                                 duplicateGroups.map((group, index) => (
                                    <DuplicateGroupCard key={index} group={group} />
                                 ))
                              )}
                           </div>
                        </Tab>
                     </Tabs>
                  </div>
               </CardBody>
            </Card>
         )}

         <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteWords}
            isDeleting={isDeleting}
            deleteSuccess={deleteSuccess}
            itemCount={itemsToDelete}
         />
      </div>
   );
};