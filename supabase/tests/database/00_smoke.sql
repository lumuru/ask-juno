BEGIN;
SELECT plan(2);

-- Sanity: pgTAP extension is installed
SELECT has_extension('pgtap', 'pgtap extension should be installed');

-- Sanity: public schema exists
SELECT has_schema('public', 'public schema should exist');

SELECT * FROM finish();
ROLLBACK;
