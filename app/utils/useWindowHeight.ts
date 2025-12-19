import { useState, useEffect } from "react";

export function useWindowHeightBreakpoint() {
    const [windowHeight, setWindowHeight] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 800);

    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Возвращаем категорию в зависимости от высоты
    // if (windowHeight > 550) return "550px";
    // if (windowHeight > 700) return "700px";
    // return "tall";

    return windowHeight;
}