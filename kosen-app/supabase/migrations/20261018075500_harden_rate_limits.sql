ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_expected_limit INT;
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
  v_allowed BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required for rate limiting'
      USING ERRCODE = '28000';
  END IF;

  v_expected_limit := CASE p_key
    WHEN 'announcement' THEN 20
    WHEN 'profile:avatar' THEN 30
    WHEN 'profile:read' THEN 60
    WHEN 'profile:write' THEN 10
    WHEN 'notifications:send' THEN 5
    WHEN 'notifications:subscribe' THEN 10
    WHEN 'notifications:unsubscribe' THEN 10
    WHEN 'loans:available-slots' THEN 30
    WHEN 'loans:read' THEN 60
    WHEN 'loans:create' THEN 5
    WHEN 'loans:write' THEN 10
    WHEN 'loans:admin-transition' THEN 30
    WHEN 'units:read' THEN 60
    WHEN 'units:write' THEN 10
    WHEN 'slots:read' THEN 60
    WHEN 'slots:write' THEN 10
    WHEN 'terms:read' THEN 60
    WHEN 'terms:write' THEN 10
    WHEN 'api:read' THEN 60
    WHEN 'api:write' THEN 10
    ELSE NULL
  END;

  IF v_expected_limit IS NULL
     OR p_max_requests IS DISTINCT FROM v_expected_limit
     OR p_window_seconds IS DISTINCT FROM 60 THEN
    RAISE EXCEPTION 'Invalid rate limit policy'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.rate_limits AS limits (key, count, window_start)
  VALUES (v_user_id::TEXT || ':' || p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET count = CASE
        WHEN limits.window_start
          + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
          THEN 1
        WHEN limits.count >= p_max_requests THEN p_max_requests + 1
        ELSE limits.count + 1
      END,
      window_start = CASE
        WHEN limits.window_start
          + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
          THEN v_now
        ELSE limits.window_start
      END
  RETURNING count <= p_max_requests INTO v_allowed;

  RETURN v_allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT)
  TO authenticated;
