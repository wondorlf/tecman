'use client';

import { useEffect } from 'react';
import { initAuth } from '@/lib/api';

/**
 * Eagerly attempts to restore the access token from the httpOnly refresh cookie
 * on every page load / navigation. Must be placed inside a client boundary
 * (e.g. the root layout).
 *
 * The actual initAuth() call is deduplicated internally, so dashboard shells
 * that also call it will get the same in-flight promise.
 */
export function AuthInitializer() {
  useEffect(() => {
    initAuth(); // fire-and-forget – does NOT block rendering
  }, []);

  return null;
}
