import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (showToastTimeoutRef.current !== null) {
      window.clearTimeout(showToastTimeoutRef.current);
    }
    showToastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      showToastTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (showToastTimeoutRef.current !== null) {
        window.clearTimeout(showToastTimeoutRef.current);
        showToastTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    showToast,
    toastMessage,
  };
}
