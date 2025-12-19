// components/common/LoadingOverlay.tsx
"use client";

import { Spinner } from "@heroui/react";

export default function LoadingOverlay({ show }: { show: boolean }) {
    return (
        <div
            className={`
                fixed inset-0 flex items-center justify-center bg-background 
                z-50 transition-opacity duration-500 
                ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            `}
        >
            {/* Заменить это на кастомную анимацию */}
            <Spinner size="lg" color="primary" />
        </div>
    );
}