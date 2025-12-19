export {};

declare global {
    interface Window {
        electron: {

// ✅ Новый универсальный API для общения с Electron
            sendToElectron: (channel: string, data: any) => void;
            getFromElectron: (channel: string, callback: (data: any) => void) => void;



        };
    }
}
