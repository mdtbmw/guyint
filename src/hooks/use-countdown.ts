
'use client';

import { useState, useEffect, useMemo } from 'react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const calculateTimeLeft = (endDate: Date | null): TimeLeft | null => {
    if (!endDate) {
        return null;
    }

    const difference = +new Date(endDate) - +new Date();
    
    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
};

const formatTime = (timeLeft: TimeLeft | null) => {
    if (!timeLeft) return '';

    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
    if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
    if (timeLeft.days === 0 && timeLeft.hours < 12) { // Only show seconds if less than 12 hours left
         parts.push(`${timeLeft.seconds}s`);
    }

    return parts.join(' ');
}

export const useCountdown = (endDate: Date | null) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(endDate));
    
    const formattedTime = useMemo(() => formatTime(timeLeft), [timeLeft]);

    useEffect(() => {
        if (!endDate) {
            setTimeLeft(null);
            return;
        }

        // Set initial value
        setTimeLeft(calculateTimeLeft(endDate));

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(endDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    const hasEnded = useMemo(() => {
        if (!endDate) return true; // If there's no date, consider it ended.
        if (!timeLeft) {
             return +new Date(endDate) - +new Date() <= 0;
        }
        return (timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds) <= 0;
    }, [timeLeft, endDate]);

    return { timeLeft, formattedTime, hasEnded };
};
