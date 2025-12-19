'use client';

import {HeroUIProvider} from '@heroui/react'
import {ThemeProvider} from '@/app/utils/providers/ThemeProvider';
import {useEffect} from 'react';

export function HeroUiProvider({children}: { children: React.ReactNode }) {
    //const pathname = usePathname();


    return (
            <HeroUIProvider>

                    {children}

            </HeroUIProvider>
    )
}