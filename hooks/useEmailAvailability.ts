import { userDAO } from '@/lib/dao/UserDAO';
import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEBOUNCE_MS = 600;

export function useEmailAvailability(email: string) {
    const [status, setStatus] = useState<Status>('idle');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        if (!email || !EMAIL_REGEX.test(email)) {
            setStatus('idle');
            return;
        }

        setStatus('checking');

        timerRef.current = setTimeout(async () => {
            try {
                const exists = await userDAO.checkEmailExists(email);
                setStatus(exists ? 'taken' : 'available');
            } catch {
                setStatus('error');
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [email]);

    return status;
}
