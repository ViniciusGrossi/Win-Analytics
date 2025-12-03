-- Create table for storing AI chat history
create table if not exists public.ai_chat_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ai_chat_history enable row level security;

-- Create policies
create policy "Users can view their own chat history"
    on public.ai_chat_history for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
    on public.ai_chat_history for insert
    with check (auth.uid() = user_id);

-- Create index for faster queries on user_id and created_at
create index if not exists ai_chat_history_user_id_created_at_idx
    on public.ai_chat_history (user_id, created_at desc);
