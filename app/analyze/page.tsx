'use client';
import React, { useMemo, useState } from 'react';
import { NonLinguisticAnalyzer } from './NonLinguisticAnalyzer';
import { CaseDuplicatesAnalyzer } from './CaseDuplicatesAnalyzer';
import { ShortAndDuplicateAnalyzer } from './ShortAndDuplicateAnalyzer';
import { Tabs, Tab } from '@heroui/react';
import { DictionarySearch } from './DictionarySearch';

export default function Page() {
   const [selectedTab, setSelectedTab] = useState("nonlinguistic");

   return (
      <div className="container mx-auto px-4 py-4 flex flex-col h-screen">
         <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            variant="underlined"
            color="primary"
            className="mb-4"
         >
            <Tab key="nonlinguistic" title="Нелингвистические символы">
               <div className="h-[calc(100vh-120px)]">
                  <NonLinguisticAnalyzer />
               </div>
            </Tab>
            <Tab key="caseduplicates" title="Регистр букв">
               <div className="h-[calc(100vh-120px)]">
                  <CaseDuplicatesAnalyzer />
               </div>
            </Tab>
            <Tab key="shortduplicates" title="Короткие и дубликаты">
               <div className="h-[calc(100vh-120pxnpm run dev)]">
                  <ShortAndDuplicateAnalyzer />
               </div>
            </Tab>
            <Tab key="dictionarysearch" title="Поиск по словарю">
               <div className="h-[calc(100vh-120px)]">
                  <DictionarySearch />
               </div>
            </Tab>
         </Tabs>
      </div>
   )
}