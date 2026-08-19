-- Ces fonctions sont des trigger functions internes. Les triggers continuent
-- de les executer sans qu'elles soient appelables via /rest/v1/rpc.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_access_scope() FROM PUBLIC, anon, authenticated;
