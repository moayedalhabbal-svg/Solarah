# Report design-input migration

The application can save reports without the two new design metadata columns, but those reports cannot be recomputed against the current calculator assumptions. Apply this migration to the Supabase project before merging the application change.

## Apply in the Supabase SQL Editor

1. Select the intended Supabase project and open **SQL Editor**.
2. Run the following idempotent SQL:

   ```sql
   begin;

   alter table public.reports
     add column if not exists design_inputs jsonb,
     add column if not exists assumptions_version text;

   commit;
   ```

3. Verify that both columns exist and have the expected types:

   ```sql
   select column_name, data_type
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'reports'
     and column_name in ('design_inputs', 'assumptions_version')
   order by column_name;
   ```

   The result should contain `design_inputs | jsonb` and `assumptions_version | text`.

The SQL is the same schema change as `supabase/migrations/20261101000000_add_report_design_inputs.sql`. No existing report rows are modified. Do not execute this document's SQL as part of application tests.

## Roll back

Only roll back if the application has been reverted or no longer requires design metadata. Dropping these columns permanently deletes their stored design inputs and assumptions versions. Run:

```sql
begin;

alter table public.reports
  drop column if exists design_inputs,
  drop column if exists assumptions_version;

commit;
```

The drops use PostgreSQL's default `RESTRICT` behavior; if dependent database objects prevent rollback, inspect and remove those dependencies deliberately rather than adding `CASCADE`.
