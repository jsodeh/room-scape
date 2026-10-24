-- Explicit free-tier choice. Historical job/model assignments are unchanged.
alter table public.design_jobs drop constraint design_jobs_quality_check;
alter table public.design_jobs add constraint design_jobs_quality_check check(quality in ('lite','quality','next','fast'));
alter table public.design_jobs add constraint design_lite_resolution_check check(quality <> 'lite' or image_size = '1K');
