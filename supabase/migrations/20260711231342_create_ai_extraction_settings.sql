-- Create table for storing per-user custom instructions used in bet image extraction
create table if not exists public.ai_extraction_settings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    custom_instructions text not null default '',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ai_extraction_settings enable row level security;

-- Create policies
create policy "Users can view their own extraction settings"
    on public.ai_extraction_settings for select
    using (auth.uid() = user_id);

create policy "Users can insert their own extraction settings"
    on public.ai_extraction_settings for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own extraction settings"
    on public.ai_extraction_settings for update
    using (auth.uid() = user_id);
