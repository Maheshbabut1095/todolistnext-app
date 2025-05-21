alter table todos
add column assigned_to uuid references auth.users(id) on delete set null,
add column due_date date;

create table notifications (
  id uuid default uuid_generate_v4() primary key,
  recipient uuid references auth.users(id),
  sender uuid references auth.users(id),
  todo_id uuid references todos(id),
  message text,
  read boolean default false,
  created_at timestamp default now()
);