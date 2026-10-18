-- Safe table creation incase it already exists
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom Postgres function (Drizzle ignores this, but it stays version-controlled)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  current_time TIMESTAMPTZ := now();
  rec RECORD;
begin
  SELECT * INTO rec FROM rate_limits WHERE key = p_key;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, window_start) 
    VALUES (p_key, 1, current_time);
    RETURN TRUE;
  END IF;

  IF current_time > rec.window_start + make_interval(secs => p_window_seconds) THEN
    UPDATE rate_limits 
    SET count = 1, window_start = current_time 
    WHERE key = p_key;
    RETURN TRUE;
  END IF;

  IF rec.count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  UPDATE rate_limits 
  SET count = count + 1 
  WHERE key = p_key;
  RETURN TRUE;
END;
$$;