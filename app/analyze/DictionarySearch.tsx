'use client';
import React, { useState, useEffect } from 'react';
import {
   Button,
   Card,
   CardBody,
   CardHeader,
   Input,
   Chip,
   Progress,
} from '@heroui/react';
import { Search } from 'lucide-react';

interface WordEntry {
   word: string;
   freq: number;
   part?: string;
}

export const DictionarySearch: React.FC = () => {
   const [searchTerm, setSearchTerm] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [searchResults, setSearchResults] = useState<WordEntry[]>([]);
   const [progress, setProgress] = useState(0);
   const [totalWords, setTotalWords] = useState(0);
   const [exactMatch, setExactMatch] = useState<WordEntry | null>(null);

   // Функция для поиска слов
   const searchWords = async () => {
      if (!searchTerm.trim()) return;

      setIsSearching(true);
      setProgress(0);
      setSearchResults([]);
      setExactMatch(null);

      try {
         const response = await fetch('/dict/uk_words.json');
         const words: WordEntry[] = await response.json();

         setTotalWords(words.length);

         const term = searchTerm.toLowerCase().trim();
         const results: WordEntry[] = [];
         let exact: WordEntry | null = null;

         words.forEach((entry, index) => {
            const word = entry.word.toLowerCase();

            // Проверка на точное совпадение
            if (word === term) {
               exact = entry;
            }

            // Проверка на вхождение строки поиска
            if (word.includes(term)) {
               results.push(entry);
            }

            if (index % 1000 === 0) {
               setProgress((index / words.length) * 100);
            }
         });

         // Сортируем результаты по частоте
         results.sort((a, b) => b.freq - a.freq);

         setSearchResults(results);
         setExactMatch(exact);
         setProgress(100);
      } catch (error) {
         console.error('Ошибка при поиске слов:', error);
      } finally {
         setIsSearching(false);
      }
   };

   // Обработчик нажатия Enter в поле ввода
   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
         searchWords();
      }
   };

   // Добавляем новые состояния
   const [dictionarySize, setDictionarySize] = useState(0);
   const [isLoading, setIsLoading] = useState(true);

// Добавляем эффект для загрузки информации о словаре
   useEffect(() => {
      const loadDictionaryInfo = async () => {
         try {
            setIsLoading(true);
            const response = await fetch('/dict/uk_words.json');
            const data = await response.json();
            setDictionarySize(data.length);
         } catch (error) {
            console.error('Ошибка при загрузке информации о словаре:', error);
         } finally {
            setIsLoading(false);
         }
      };

      loadDictionaryInfo();
   }, []);

   return (
      <div className="w-full h-full flex flex-col">

         <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-default-500">
               {isLoading ? 'Загрузка словаря...' : `Всего слов в словаре: ${dictionarySize.toLocaleString()}`}
            </span>
            {searchResults.length > 0 && (
               <span className="text-sm text-primary-500">
                  Найдено: {searchResults.length}
               </span>
            )}
         </div>

         <div className="flex items-center gap-4 mb-4">
            <Input
               label="Поиск слова"
               placeholder="Введите слово для поиска"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onKeyDown={handleKeyDown}
               className="flex-grow"
            />
            <Button
               color="primary"
               startContent={<Search size={20} />}
               onClick={searchWords}
               isLoading={isSearching}
               disabled={isSearching || !searchTerm.trim()}
            >
               Поиск
            </Button>
         </div>

         {isSearching && (
            <div className="w-full max-w-md mx-auto">
               <Progress
                  value={progress}
                  className="w-full"
                  label="Прогресс поиска"
                  showValueLabel
               />
               <p className="text-sm text-default-500 mt-2 text-center">
                  Обработано слов: {totalWords.toLocaleString()}
               </p>
            </div>
         )}

         {searchResults.length > 0 && !isSearching && (
            <Card className="container mx-auto px-3 w-[800px] flex-grow flex flex-col h-full">
               <CardHeader>
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-semibold">
                        Результаты поиска для &quot;{searchTerm}&quot;
                     </h3>
                     <Chip color="primary" variant="flat">
                        Найдено: {searchResults.length}
                     </Chip>
                  </div>
               </CardHeader>
               <CardBody className="flex-grow flex flex-col overflow-hidden h-full">
                  {exactMatch && (
                     <div className="mb-4">
                        <h4 className="text-lg font-semibold mb-2">Точное совпадение:</h4>
                        <div className="flex justify-between items-center p-3 bg-success-50 rounded-lg">
                           <div className="font-mono text-lg">
                              &quot;{exactMatch.word}&quot;
                           </div>
                           <div className="text-right">
                              <div className="font-semibold">
                                 {exactMatch.freq.toLocaleString()}
                              </div>
                              <div className="text-xs text-default-500">
                                 частота
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  <h4 className="text-lg font-semibold mb-2">Все совпадения:</h4>
                  <div className="space-y-2 flex-grow overflow-y-auto" style={{ minHeight: "300px" }}>
                     {searchResults.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                           <div className="font-mono text-lg">
                              &quot;{item.word}&quot;
                           </div>
                           <div className="text-right">
                              <div className="font-semibold">
                                 {item.freq.toLocaleString()}
                              </div>
                              <div className="text-xs text-default-500">
                                 частота
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </CardBody>
            </Card>
         )}

         {searchResults.length === 0 && searchTerm && !isSearching && (
            <div className="text-center py-8">
               <p className="text-lg text-default-600">
                  По запросу &quot;{searchTerm}&quot; ничего не найдено
               </p>
            </div>
         )}
      </div>
   );
};