-- 插入本地默认测试用户 (ID: 00000000-0000-0000-0000-000000000000)
-- 密码：admin123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@local.test',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"本地管理员"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 插入对应的 Profile (如果触发器没有自动生效的话)
INSERT INTO public.profiles (id, display_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', '本地管理员', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = '本地管理员';
