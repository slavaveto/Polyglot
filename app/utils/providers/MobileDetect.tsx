'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import MobileDetect from 'mobile-detect';

type DeviceType = {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isIOS: boolean;
};

const defaultValue: DeviceType = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
};

const DeviceContext = createContext<DeviceType>(defaultValue);

export const useDevice = () => useContext(DeviceContext);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
    const [deviceType, setDeviceType] = useState<DeviceType>(defaultValue);

    useEffect(() => {
        const md = new MobileDetect(window.navigator.userAgent);
        const isMobile = !!md.mobile();
        const isTablet = !!md.tablet();
        const isDesktop = !isMobile && !isTablet;

        const userAgent = window.navigator.userAgent || "";
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !("MSStream" in window);

        setDeviceType({ isMobile, isTablet, isDesktop,  isIOS  });
    }, []);

    return (
        <DeviceContext.Provider value={deviceType}>
            {children}
        </DeviceContext.Provider>
    );
};