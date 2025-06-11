
-- Create a secure function to execute SELECT queries
CREATE OR REPLACE FUNCTION public.execute_select_query(query_text text)
RETURNS table(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_lower text;
BEGIN
    -- Convert to lowercase for checking
    query_lower := lower(trim(query_text));
    
    -- Only allow SELECT statements
    IF NOT query_lower LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Prevent certain dangerous patterns
    IF query_lower LIKE '%drop%' OR 
       query_lower LIKE '%delete%' OR 
       query_lower LIKE '%update%' OR 
       query_lower LIKE '%insert%' OR 
       query_lower LIKE '%create%' OR 
       query_lower LIKE '%alter%' OR 
       query_lower LIKE '%truncate%' THEN
        RAISE EXCEPTION 'Query contains forbidden keywords';
    END IF;
    
    -- Execute the query and return results as JSONB
    RETURN QUERY EXECUTE format('SELECT to_jsonb(t) FROM (%s) AS t', query_text);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information as JSONB
        RETURN QUERY SELECT jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_select_query(text) TO authenticated;
