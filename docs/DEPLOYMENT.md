# Local development and future deployment

Node 20.9 or later is required by the installed Next.js generation. This workspace was prepared with Node 24.21.0. Run `npm ci`, `npm run dev`, then visit http://localhost:3000. `npm run build` creates the Vercel-compatible application; `npm start` serves it. Dependencies are pinned and committed through package-lock.json.

No Supabase setup is necessary to preview the complete public UI. Catalog, contacts and delivery zones remain empty and ordering remains unavailable.

Later: create a Supabase project; run the migration; create an administrator using Supabase Auth; insert that user's id into `public.admin_users` using the SQL editor/service administrator. Disable public sign-up in Supabase Auth. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` or the deployment environment. Never paste private/service keys into source or public variables. Set the production `NEXT_PUBLIC_SITE_URL` and correct Auth site URL/redirect allowlist.

Create and publish real products through `/admin`. Add confirmed contact details, shipping zones and reviewed policies. Connect a payment provider in a later milestone before enabling checkout. Configure provider webhook URLs, durable rate limiting, backups and monitoring; verify the deployed environment end to end.

## Security checks for the Messenger launch

- Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the hosting dashboard. The storefront, Messenger ordering, and admin login work without `SUPABASE_SECRET_KEY`. Keep private credentials in ignored local files or server-only hosting variables when needed.
- Enable two-factor authentication on the accounts that control the repository, hosting, Supabase, Facebook Page, and domain. Enable GitHub secret scanning and push protection where available.
- In Supabase, disable public sign-ups and anonymous sign-ins, confirm that `admin_users` contains only the intended staff, and verify backups and the restore process. Review the Security Advisor findings and Auth rate limits.
- Apply `202611240001_reduce_public_access.sql` to restrict the admin helper and product-media listing. If the SQL Editor cannot alter `storage.objects`, use Storage → Policies to edit `Public product media` to target `authenticated` with the `USING` expression from the migration. Run the product policy and function statements in SQL Editor separately.
- Once the custom domain has HTTPS, configure per-client rate limiting for `POST /admin/login` at the host and test a legitimate admin login. Confirm signed-out visitors are sent to the login page and that a customer can reach the Page's Messenger chat from the cart.

The current scope is local UI development in the supplied Next.js repository. No hosted site or production store has been registered or deployed.
