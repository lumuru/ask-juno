-- pgtap is used for Row Level Security and constraint tests.
-- It's installed in the 'extensions' schema to keep 'public' clean.
create extension if not exists pgtap with schema extensions;
