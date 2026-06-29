'use client';

import { useEffect, useCallback } from 'react';

/**
 * Warns users about unsaved form changes before navigating away.
 */
export function useUnsavedChanges(isDirty: boolean, message?: string) {
  const msg = message || 'You have unsaved changes. Are you sure you want to leave?';

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    },
    [isDirty, msg]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
}
