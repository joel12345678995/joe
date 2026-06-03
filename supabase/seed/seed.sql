-- Seed data (example)
insert into public.families (id, name, slug, currency, transparency_mode, contribution_amount, contribution_frequency)
values
  (uuid_generate_v4(), 'Kampala Unity SACCO', 'kampala-unity', 'UGX', 'full', 50000, 'monthly');
