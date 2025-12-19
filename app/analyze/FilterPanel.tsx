import React from 'react';
import { Button } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { CustomCheckbox } from './CustomCheckbox';

// Обновляем интерфейс FilterPanelProps
interface FilterPanelProps {
   filters: {
      showDigits: boolean;
      showSpaces: boolean;
      showNonLinguistic: boolean;
      showInvisibleChars: boolean; // Добавляем новое свойство
   };
   toggleFilter: (filterName: 'showDigits' | 'showSpaces' | 'showNonLinguistic' | 'showInvisibleChars') => void;
   stats: {
      withDigits: number;
      withSpaces: number;
      withNonLinguistic: number;
      withInvisibleChars: number; // Добавляем новое свойство
   };
   filteredCount: number;
   onDeleteClick: () => void;
}

// Обновляем компонент FilterPanel
export const FilterPanel: React.FC<FilterPanelProps> = ({
                                                           filters,
                                                           toggleFilter,
                                                           stats,
                                                           filteredCount,
                                                           onDeleteClick,
                                                        }) => {
   return (
      <div className="flex flex-wrap gap-6 mb-6">
         <div className="flex flex-wrap gap-6 items-center">
            <CustomCheckbox
               label="С цифрами"
               checked={filters.showDigits}
               onChange={() => toggleFilter('showDigits')}
               count={stats.withDigits}
               colorType="success"
            />
            <CustomCheckbox
               label="С пробелами"
               checked={filters.showSpaces}
               onChange={() => toggleFilter('showSpaces')}
               count={stats.withSpaces}
               colorType="primary"
            />
            <CustomCheckbox
               label="С нелингв. символами"
               checked={filters.showNonLinguistic}
               onChange={() => toggleFilter('showNonLinguistic')}
               count={stats.withNonLinguistic}
               colorType="warning"
            />
            <CustomCheckbox
               label="Со скрытыми символами"
               checked={filters.showInvisibleChars}
               onChange={() => toggleFilter('showInvisibleChars')}
               count={stats.withInvisibleChars}
               colorType="primary"
            />
         </div>

         <div className="ml-auto">
            <Button
               color="danger"
               startContent={<Trash2 size={18} />}
               onClick={onDeleteClick}
            >
               Удалить выбранные слова ({filteredCount})
            </Button>
         </div>
      </div>
   );
};