'use client';
import React, { useMemo, useState } from 'react';
import {
   Button,
   Card,
   CardBody,
   CardHeader,
   Chip,
   Progress,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';
import { WordCard } from './WordCard';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { FilterPanel } from './FilterPanel';

interface NonLinguisticWord {
   word: string;
   freq: number;
   nonLinguisticChars: string;
   hasSpaces: boolean;
   hasDigits: boolean;
   hasInvisibleChars: boolean; // Добавлено свойство для скрытых символов
}

interface WordEntry {
   word: string;
   freq: number;
}

interface FilterOptions {
   showDigits: boolean;
   showSpaces: boolean;
   showNonLinguistic: boolean;
   showInvisibleChars: boolean; // Добавлено свойство для скрытых символов
}

export function NonLinguisticAnalyzer() {
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [nonLinguisticWords, setNonLinguisticWords] = useState<
      NonLinguisticWord[]
   >([]);
   const [progress, setProgress] = useState(0);
   const [totalWords, setTotalWords] = useState(0);
   const [analysisComplete, setAnalysisComplete] = useState(false);
   const [filters, setFilters] = useState<FilterOptions>({
      showDigits: true,
      showSpaces: true,
      showNonLinguistic: true,
      showInvisibleChars: true, // Добавлен новый фильтр
   });
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [deleteSuccess, setDeleteSuccess] = useState<boolean | null>(null);

   // Функция для проверки, является ли символ каким-либо вариантом апострофа
   const isApostrophe = (char: string) => {
      // Коды всех возможных апострофов
      const apostropheCodes = [
         0x27, // '
         0x2019, // '
         0x2018, // '
         0x02bc, // ʼ
         0x02b9, // ʹ
         0x0060, // `
         0x00b4, // ´
         0x02bb, // ʻ
      ];

      return apostropheCodes.includes(char.charCodeAt(0));
   };

   // Функция для определения скрытых символов
   const hasInvisibleCharacters = (text: string) => {
      // Регулярное выражение для поиска скрытых символов
      // Включает управляющие символы, нулевые пробелы, невидимые разделители и т.д.
      const invisibleCharsRegex = /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u180E\u200B-\u200F\u2028-\u202F\u2060-\u2064\u2066-\u206F\uFEFF\uFFF0-\uFFF8]/;
      return invisibleCharsRegex.test(text);
   };

   // Украинский алфавит
   const ukrAlphabet =
      'абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';

   // Функция для проверки, является ли символ частью украинского алфавита
   const isUkrainianChar = (char: string) => {
      return ukrAlphabet.includes(char) || isApostrophe(char) || char === '-';
   };

   const digitRegex = /\d/;

   const analyzeNonLinguisticChars = async () => {
      setIsAnalyzing(true);
      setProgress(0);
      setNonLinguisticWords([]);
      setAnalysisComplete(false);

      try {
         const response = await fetch('/dict/uk_words.json');
         const words: WordEntry[] = await response.json();

         setTotalWords(words.length);

         const foundWords: NonLinguisticWord[] = [];

         words.forEach((entry, index) => {
            const word = entry.word;

            const nonLinguisticChars = Array.from(word)
               .filter((char) => !isUkrainianChar(char))
               .join('');

            const hasSpaces = word.includes(' ');
            const hasDigits = digitRegex.test(word);
            const hasInvisibleChars = hasInvisibleCharacters(word); // Проверка на скрытые символы

            if (nonLinguisticChars.length > 0 || hasSpaces || hasDigits || hasInvisibleChars) {
               foundWords.push({
                  word: entry.word,
                  freq: entry.freq,
                  nonLinguisticChars,
                  hasSpaces,
                  hasDigits,
                  hasInvisibleChars, // Добавляем новое свойство
               });
            }

            if (index % 1000 === 0) {
               setProgress((index / words.length) * 100);
            }
         });

         // Сортируем по частоте
         foundWords.sort((a, b) => b.freq - a.freq);

         setNonLinguisticWords(foundWords);
         setProgress(100);
         setAnalysisComplete(true);
      } catch (error) {
         console.error('Ошибка при анализе нелингвистических символов:', error);
      } finally {
         setIsAnalyzing(false);
      }
   };

   // Статистика по типам слов
   const wordsStats = useMemo(() => {
      const withDigits = nonLinguisticWords.filter((w) => w.hasDigits).length;
      const withSpaces = nonLinguisticWords.filter((w) => w.hasSpaces).length;
      const withNonLinguistic = nonLinguisticWords.filter(
         (w) => w.nonLinguisticChars.length > 0
      ).length;
      const withInvisibleChars = nonLinguisticWords.filter(
         (w) => w.hasInvisibleChars
      ).length;

      return { withDigits, withSpaces, withNonLinguistic, withInvisibleChars };
   }, [nonLinguisticWords]);

   // Фильтруем слова в зависимости от выбранных фильтров
   const filteredWords = useMemo(() => {
      return nonLinguisticWords.filter((word) => {
         if (filters.showDigits && word.hasDigits) return true;
         if (filters.showSpaces && word.hasSpaces) return true;
         if (filters.showNonLinguistic && word.nonLinguisticChars.length > 0)
            return true;
         if (filters.showInvisibleChars && word.hasInvisibleChars)
            return true;
         return false;
      });
   }, [nonLinguisticWords, filters]);

   // Обработчик изменения фильтра
   const toggleFilter = (filterName: keyof FilterOptions) => {
      setFilters((prev) => ({
         ...prev,
         [filterName]: !prev[filterName],
      }));
   };

   // Функция для удаления слов
   const handleDeleteWords = async () => {
      setIsDeleting(true);

      try {
         // Получаем текущий словарь
         const response = await fetch('/dict/uk_words.json');
         const allWords: WordEntry[] = await response.json();

         // Создаем множество слов для удаления для быстрого поиска
         const wordsToDelete = new Set(filteredWords.map((w) => w.word));

         // Фильтруем словарь, оставляя только те слова, которых нет в списке для удаления
         const updatedWords = allWords.filter(
            (entry) => !wordsToDelete.has(entry.word)
         );

         console.log(
            `Удаляем ${filteredWords.length} слов из словаря. Было ${allWords.length}, стало ${updatedWords.length}`
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

         // Обновляем список слов, удаляя удаленные слова
         setNonLinguisticWords((prev) =>
            prev.filter((word) => !wordsToDelete.has(word.word))
         );

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

   return (
      <div className={'w-full h-full flex flex-col'}>
         <div className="flex flex-col items-center gap-4">
            <Button
               color="warning"
               size="lg"
               startContent={<AlertTriangle size={20} />}
               onClick={analyzeNonLinguisticChars}
               isLoading={isAnalyzing}
               disabled={isAnalyzing}
            >
               {isAnalyzing
                  ? 'Идет поиск...'
                  : 'Найти нелингвистические символы'}
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
                        Слова с нелингвистическими символами
                     </h3>
                     <Chip color="warning" variant="flat">
                        {nonLinguisticWords.length} слов
                     </Chip>
                  </div>
               </CardHeader>
               <CardBody className="flex-grow flex flex-col overflow-hidden">
                  {nonLinguisticWords.length === 0 ? (
                     <p className="text-default-500 text-center py-8">
                        Слова с нелингвистическими символами не найдены
                     </p>
                  ) : (
                     <>
                <FilterPanel
                   filters={filters}
                   toggleFilter={(filterName: keyof FilterOptions) =>
                      toggleFilter(filterName)
                   }
                   stats={wordsStats}
                   filteredCount={filteredWords.length}
                   onDeleteClick={() => setIsDeleteModalOpen(true)}
                />

                <div className="space-y-2 flex-grow overflow-y-auto h-full">
                  {filteredWords.length === 0 ? (
                     <p className="text-default-500 text-center py-8">
                        Нет слов, соответствующих выбранным фильтрам
                     </p>
                  ) : (
                     filteredWords.map((item, index) => (
                        <WordCard
                           key={index}
                           word={item.word}
                           freq={item.freq}
                           nonLinguisticChars={item.nonLinguisticChars}
                           hasSpaces={item.hasSpaces}
                           hasDigits={item.hasDigits}
                           hasInvisibleChars={item.hasInvisibleChars}
                        />
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
}