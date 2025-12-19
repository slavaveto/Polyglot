import React from 'react';
import { Chip } from "@heroui/react";
import { Check } from "lucide-react";

interface CustomCheckboxProps {
   label: string;
   checked: boolean;
   onChange: () => void;
   count: number;
   colorType?: "primary" | "success" | "warning";
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
                                                                 label,
                                                                 checked,
                                                                 onChange,
                                                                 count,
                                                                 colorType = "primary"
                                                              }) => {
   // Определяем классы на основе цвета и состояния
   let checkboxClass = "flex items-center justify-center w-5 h-5 rounded border ";

   if (checked) {
      if (colorType === "primary") {
         checkboxClass += "bg-primary-500 border-primary-500 text-white";
      } else if (colorType === "success") {
         checkboxClass += "bg-success-500 border-success-500 text-white";
      } else if (colorType === "warning") {
         checkboxClass += "bg-warning-500 border-warning-500 text-white";
      }
   } else {
      checkboxClass += "bg-default-100 border-default-300";
   }

   return (
      <div
         className="flex items-center gap-2 cursor-pointer"
         onClick={onChange}
      >
         <div className={checkboxClass}>
            {checked && <Check size={16} />}
         </div>
         <span className="text-default-700">{label}</span>
         <Chip
            size="sm"
            color={colorType}
            variant={checked ? "solid" : "flat"}
         >
            {count}
         </Chip>
      </div>
   );
};