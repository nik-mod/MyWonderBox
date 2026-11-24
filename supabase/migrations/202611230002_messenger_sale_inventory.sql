begin;

-- Records a seller-confirmed sale once. Messenger drafts never write to this table.
create table if not exists public.messenger_sales (
  reference uuid primary key,
  items jsonb not null,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz not null default now()
);
alter table public.messenger_sales enable row level security;
revoke all on public.messenger_sales from public, anon, authenticated;

create or replace function public.confirm_messenger_sale(
  sale_reference uuid, blue_quantity integer, pink_quantity integer
) returns boolean language plpgsql security definer set search_path='' as $$
declare
  line record;
  new_items jsonb;
  previous_items jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  if sale_reference is null or blue_quantity is null or pink_quantity is null
    or blue_quantity not between 0 and 99 or pink_quantity not between 0 and 99
    or blue_quantity + pink_quantity = 0 then
    raise exception 'Invalid sale quantities' using errcode = '22023';
  end if;

  new_items := jsonb_build_object('mywonderbox-bag-blue', blue_quantity, 'mywonderbox-bag-pink', pink_quantity);
  insert into public.messenger_sales (reference, items, confirmed_by)
    values (sale_reference, new_items, auth.uid()) on conflict (reference) do nothing;
  if not found then
    select items into previous_items from public.messenger_sales where reference = sale_reference;
    if previous_items is distinct from new_items then
      raise exception 'Sale reference already used with different quantities' using errcode = '23505';
    end if;
    return false;
  end if;

  -- Conditional writes lock both SKUs in stable order and roll back together on failure.
  for line in select key as slug, value::integer as quantity from jsonb_each_text(new_items)
    where value::integer > 0 order by key loop
    update public.products set stock = stock - line.quantity, sold_quantity = sold_quantity + line.quantity
      where slug = line.slug and published and stock >= line.quantity;
    if not found then raise exception 'Insufficient stock'; end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.confirm_messenger_sale(uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.confirm_messenger_sale(uuid,integer,integer) to authenticated;

commit;
