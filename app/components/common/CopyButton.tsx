"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
    text: string;
    isStreaming: boolean;
}

export default function CopyButton({ text, isStreaming }: CopyButtonProps) {    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (isStreaming) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback для Safari / PWA
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            alert("Не удалось скопировать 😢");
            console.error(err);
        }
    };

    return (
        <span
            role="button"
            tabIndex={0}
            onPointerUp={(e) => {
                if (isStreaming) return;
                e.preventDefault();
                e.stopPropagation();
                handleCopy();
            }}
            className={`absolute bottom-[0px] right-[0px] p-[8px] transition duration-300 
                                ${isStreaming
                ? "text-default-400 cursor-default pointer-events-none"
                : "text-default-500 hover:text-default-500 cursor-pointer"}`}
        >
            {copied ? <Check size={20} className="text-success-500" /> : <Copy size={20} />}
        </span>
    );
}