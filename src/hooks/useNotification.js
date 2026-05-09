import { useCallback, useState } from "react";

export function useNotification() {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  return { notification, notify };
}
