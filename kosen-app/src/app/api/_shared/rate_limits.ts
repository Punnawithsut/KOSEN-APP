import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RateLimitPolicy = {
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
};

function getPolicy(request: Request): RateLimitPolicy | null {
  const { pathname } = new URL(request.url);
  const method = request.method.toUpperCase();
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/api/docs' || path.startsWith('/api/docs/')) {
    return null;
  }

  if (path === '/api/announcement' || path.startsWith('/api/announcement/')) {
    return { identifier: 'announcement', maxRequests: 20, windowSeconds: 60 };
  }

  if (path === '/api/profile/avatar') {
    return { identifier: 'profile:avatar', maxRequests: 30, windowSeconds: 60 };
  }

  if (path === '/api/profile') {
    return method === 'GET'
      ? { identifier: 'profile:read', maxRequests: 60, windowSeconds: 60 }
      : { identifier: 'profile:write', maxRequests: 10, windowSeconds: 60 };
  }

  if (path === '/api/notifications/send') {
    return { identifier: 'notifications:send', maxRequests: 5, windowSeconds: 60 };
  }
  if (path === '/api/notifications/subscribe') {
    return { identifier: 'notifications:subscribe', maxRequests: 10, windowSeconds: 60 };
  }
  if (path === '/api/notifications/unsubscribe') {
    return { identifier: 'notifications:unsubscribe', maxRequests: 10, windowSeconds: 60 };
  }

  if (path === '/api/klongklongplus/loans/available-slots') {
    return { identifier: 'loans:available-slots', maxRequests: 30, windowSeconds: 60 };
  }
  if (path === '/api/klongklongplus/loans/mine') {
    return { identifier: 'loans:read', maxRequests: 60, windowSeconds: 60 };
  }
  if (path === '/api/klongklongplus/loans') {
    if (method === 'POST') {
      return { identifier: 'loans:create', maxRequests: 5, windowSeconds: 60 };
    }
    return { identifier: 'loans:read', maxRequests: 60, windowSeconds: 60 };
  }
  if (/^\/api\/klongklongplus\/loans\/[^/]+\/[^/]+$/.test(path)) {
    return { identifier: 'loans:admin-transition', maxRequests: 30, windowSeconds: 60 };
  }
  if (/^\/api\/klongklongplus\/loans\/[^/]+$/.test(path)) {
    return { identifier: 'loans:write', maxRequests: 10, windowSeconds: 60 };
  }

  const resource = ['units', 'slots', 'terms'].find(
    (name) =>
      path === `/api/klongklongplus/${name}` ||
      path.startsWith(`/api/klongklongplus/${name}/`),
  );
  if (resource) {
    const isRead = method === 'GET';
    return {
      identifier: `${resource}:${isRead ? 'read' : 'write'}`,
      maxRequests: isRead ? 60 : 10,
      windowSeconds: 60,
    };
  }

  if (path === '/api/dorm' || /^\/api\/dorm\//.test(path)) {
    const isRead = method === 'GET' || method === 'HEAD';
    return {
      identifier: `dorm:${isRead ? 'read' : 'write'}`,
      maxRequests: isRead ? 60 : 10,
      windowSeconds: 60,
    };
  }

  // Cover new API routes by default. Query strings are intentionally excluded
  // from the bucket so changing search parameters cannot bypass the limit.
  const isRead = method === 'GET' || method === 'HEAD';
  return {
    identifier: `api:${isRead ? 'read' : 'write'}`,
    maxRequests: isRead ? 60 : 10,
    windowSeconds: 60,
  };
}

export async function enforceRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
) {
  const supabase = await createClient();

  const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
    p_key: identifier,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('Rate limit error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Rate limit service is unavailable.' },
      { status: 503 },
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(windowSeconds),
          'X-RateLimit-Limit': String(maxRequests),
        },
      },
    );
  }

  return null;
}

export async function enforceApiRateLimit(request: Request) {
  const policy = getPolicy(request);
  if (!policy) return null;

  return enforceRateLimit(
    policy.identifier,
    policy.maxRequests,
    policy.windowSeconds,
  );
}