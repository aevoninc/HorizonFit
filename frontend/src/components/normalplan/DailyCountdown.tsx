import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export const DailyCountdown: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();

            if (diff <= 0) {
                return "00:00:00";
            }

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            return [
                hours.toString().padStart(2, "0"),
                minutes.toString().padStart(2, "0"),
                seconds.toString().padStart(2, "0"),
            ].join(":");
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 opacity-80">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Resetting In</span>
            </div>
            <div className="text-5xl font-black tabular-nums tracking-tighter">
                {timeLeft || "00:00:00"}
            </div>
        </div>
    );
};
