/**
 * src/lib/supabase.ts — updated
 *
 * Switches from @supabase/supabase-js's createClient to @supabase/ssr's
 * createBrowserClient.
 *
 * Why this matters (report section 1.10 / middleware.ts):
 *  createBrowserClient stores the Supabase session in COOKIES (in addition
 *  to localStorage). This is what allows middleware.ts and Route Handlers
 *  to read the session server-side via createServerClient — they read the
 *  same cookies the browser client writes.
 *
 *  Without this change, middleware.ts will always see the user as null
 *  (the session only exists in localStorage, which servers can't read),
 *  and the requireCoach() helper in the API routes won't find a session.
 *
 * API compatibility:
 *  createBrowserClient has the same API surface as createClient — every
 *  existing call to supabase.from(), supabase.auth.*, supabase.storage.*,
 *  etc. throughout the codebase continues to work without any other changes.
 */

import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
