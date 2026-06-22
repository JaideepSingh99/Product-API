create table public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null,
    price numeric(10,2) not null check (price >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_products_browse
on public.products (category, created_at desc, id desc);

create index idx_products_created
on public.products (created_at desc, id desc);