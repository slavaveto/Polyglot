import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { HeroUiProvider } from '@/app/utils/providers/HeroUIProvider';
import { themeScript } from '@/app/utils/themeScript';
import { Toaster } from 'react-hot-toast';
import { MainProvider } from '@/app/context';
import WordPopup from '@/app/components/WordPopup'; // ✅ Добавляем компонент
import { DeviceProvider } from '@/app/utils/providers/MobileDetect';
import { ThemeProvider } from '@/app/utils/providers/ThemeProvider';

const montserrat = Montserrat({
   display: 'swap',
   subsets: ['latin'],
});

export const metadata: Metadata = {
   title: 'PolyglotApp',
   description: '',
   icons: {
      icon:
         process.env.NODE_ENV === 'development'
            ? '/favicons/local.png'
            : '/favicons/remote.png',
   },
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   //console.log("🔄 RootLayout рендерится..."); // ✅ Проверяем рендер

   return (
      // <html lang="en" suppressHydrationWarning>
      <html
         lang="ru-RU"
         translate="no"
         className={`dark ${montserrat.className}`}
         suppressHydrationWarning
      >
         <head>
            <link rel="manifest" href="/manifest.json" />
            <meta
               name="theme-color"
               content="#1e2329"
               media="(prefers-color-scheme: dark)"
            />
            <meta
               name="viewport"
               content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            />

            <script
               dangerouslySetInnerHTML={{
                  __html: themeScript,
               }}
            />
         </head>

         <body>
            <Toaster />
            <MainProvider>
               <HeroUiProvider>
                  <ThemeProvider>
                     <DeviceProvider>
                        {children}
                        <WordPopup />
                     </DeviceProvider>
                  </ThemeProvider>
               </HeroUiProvider>
            </MainProvider>
         </body>
      </html>
   );
}
