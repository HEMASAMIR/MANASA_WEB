-- ============================================================================
-- Public catalog for the website (visitors who are NOT signed in)
-- ----------------------------------------------------------------------------
-- Returns the center info + published courses of active classes with their
-- lesson titles / durations. Video links are NEVER returned: watching a lesson
-- still requires a signed-in, enrolled student (Row Level Security).
-- Safe to re-run. Run it once in Supabase → SQL Editor.
-- ============================================================================
create or replace function public.public_catalog() returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
        'center', (select jsonb_build_object('name', s.center_name, 'logo_url', s.logo_url,
                                             'contact_phone', s.contact_phone, 'currency', s.currency)
                     from public.app_settings s where s.id = 1),
        'courses', coalesce((
            select jsonb_agg(t.x order by t.created_at desc)
            from (
                select c.created_at, jsonb_build_object(
                    'id', c.id, 'title', c.title, 'description', c.description,
                    'icon', c.icon, 'color', c.color, 'created_at', c.created_at,
                    'class_name', cl.name, 'grade', cl.grade, 'subject', cl.subject,
                    'monthly_fee', cl.monthly_fee, 'teacher', p.name,
                    'lessons', coalesce((
                        select jsonb_agg(jsonb_build_object(
                                   'id', l.id, 'title', l.title, 'duration_seconds', l.duration_seconds,
                                   'position', l.position, 'is_locked', l.is_locked,
                                   'has_video', l.video_url is not null)
                               order by l.position)
                          from public.lessons l where l.course_id = c.id), '[]'::jsonb)
                ) as x
                from public.courses c
                join public.classes cl on cl.id = c.class_id and cl.is_active
                left join public.user_profiles p on p.id = c.teacher_id
                where c.is_published
            ) t), '[]'::jsonb)
    )
$$;

revoke all on function public.public_catalog() from public;
grant execute on function public.public_catalog() to anon, authenticated;
