import React from 'react';

// Обновляем интерфейс WordCardProps
interface WordCardProps {
   word: string;
   freq: number;
   nonLinguisticChars: string;
   hasSpaces: boolean;
   hasDigits: boolean;
   hasInvisibleChars: boolean; // Добавляем новое свойство
}

export const WordCard: React.FC<WordCardProps> = ({
                                                     word,
                                                     freq,
                                                     nonLinguisticChars,
                                                     hasSpaces,
                                                     hasDigits,
                                                     hasInvisibleChars,
                                                  }) => {
   return (
      <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
         <div>
            <div className="font-mono text-lg">
               &quot;{word}&quot;
            </div>
            <div className="text-sm font-mono flex flex-wrap gap-2">
               {nonLinguisticChars.length > 0 && (
                  <span className="text-warning-600">
                     Символы: {Array.from(nonLinguisticChars).map(char =>
                     `"${char}" (${char.charCodeAt(0).toString(16)})`
                  ).join(', ')}
                  </span>
               )}
               {hasSpaces && (
                  <span className="text-blue-600">
                     [содержит пробелы]
                  </span>
               )}
               {hasDigits && (
                  <span className="text-green-600">
                     [содержит цифры]
                  </span>
               )}
               {hasInvisibleChars && (
                  <span className="text-red-600">
                     [содержит скрытые символы]
                  </span>
               )}
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