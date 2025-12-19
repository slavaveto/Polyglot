import React, { useEffect, useState } from "react";
import { Mic } from "lucide-react";

export default function RecordingVisualizer({ isRecording }: { isRecording: boolean }) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        if (isRecording) {
            setElapsedSeconds(0);

            interval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    if (!isRecording) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (

        <div className="flex items-center gap-2">
            <Mic size={30} className="deep-pulse text-red-500" />
            <span className="text-red-500 text-[16px]">{formatTime(elapsedSeconds)}</span>
        </div>
    );
}