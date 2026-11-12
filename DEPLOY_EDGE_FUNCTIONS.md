# Edge Function deployment checklist

Run these commands from the repository root only after reviewing the changes,
applying the SQL in `MIGRATION_NOTES.md` to the intended Supabase project, and
verifying that the function secrets are configured in Supabase. Never place
service-role or provider secrets in frontend variables.

```sh
npx supabase functions deploy ai-proxy
npx supabase functions deploy send-email
```

After deployment, verify:

1. The production domain, localhost development origin, and this project's
   Vercel preview origins are accepted. An unrelated origin is rejected with
   HTTP 403, and no response uses wildcard CORS.
2. Invalid request shapes, extra fields, oversized AI prompts, and unsupported
   email types are rejected.
3. AI and email throttling return HTTP 429 with `Retry-After` when their
   configured limits are exceeded.
4. Email requests require the intended authenticated user or admin, and a
   normal user cannot trigger an admin-only email or select an arbitrary
   recipient.
5. Provider failures produce generic client responses. Confirm server logs do
   not contain provider response bodies, user secrets, or authorization
   headers.
6. Exercise a successful AI request and the supported email flows with test
   accounts and addresses, then inspect the resulting function logs.

Do not run these deployment commands until the SQL changes and RLS fixes have
been reviewed and applied manually.
