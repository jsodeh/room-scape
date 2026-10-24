-- Structured, allowlisted provider facts only. Never store raw SDK errors,
-- request bodies or headers. Existing client column grants exclude this field.
alter table public.design_jobs add column provider_error jsonb;
