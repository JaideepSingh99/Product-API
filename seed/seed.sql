INSERT INTO public.products (name, category, price, created_at, updated_at)
SELECT
'Product ' || gs,
(ARRAY['electronics','clothing','books','furniture','sports','toys','beauty','food'])[floor(random() * 8 + 1)],
round((random() * 9999 + 1)::numeric, 2),
NOW() - (random() * interval '365 days'),
NOW() - (random() * interval '365 days')
FROM generate_series(1, 200000) AS gs;