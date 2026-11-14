<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Keep shared navigation and task state in a root-mounted application provider and shell; leaf routes own their page content and metadata.
- Define topic questions in a shared typed catalog and submit home/topic requests through the same composer and existing task provider, so presentation changes never fork research behavior.
- Persist non-demo tasks through an isolated, schema-validated browser storage adapter after hydration; exclude drafts and internal continuation tokens, restore conversations as bounded history, and keep sample tasks explicitly separate.
- Live web searches use the Exa server function and must never fall back to demo sources or generated conclusions on failure.
- Keep credentials inside server-function handlers and normalize search responses in pure typed helpers; browser components receive only safe results and user-facing errors.
- Store each workspace's conversation, draft, stage, sources, and results on its task record; pure workflow helpers and prop-driven panels keep future data integration independent of presentation.
- Define shared React contexts and consumer hooks separately from refreshable providers and retain context objects in Vite hot data; context-module edits must not disconnect mounted consumers or cache user state globally.
- Run explicit OpenAI Responses requests through bounded server-function steps using the existing Exa service; encrypted continuation state preserves context and enforces per-task search budgets without exposing internal tool payloads.
- Keep every profile value explicitly null until the user sets it; locations are saved only from validated GeoNames suggestions picked in the LocationPicker, never from free text, and dashboard copy must render empty states instead of example values.
- Store multiple moves in the existing versioned device-local profile adapter, migrating legacy profiles in place; only saved active destinations initiate separate bounded City Essentials research, never chat tasks.
- Mount the profile provider above task state; bind each task to its move and immutable research-context snapshot so switching never mixes histories, and changed research can be refreshed separately.
- Validate minimal move context at the agent boundary and seal it into continuation state; only confirmed details personalize requests, with unknown identity never inferred from origin.

- Keep query/task type explicit in the existing conversation record and migrate untyped history to queries; only user actions create tracked tasks.
- Keep manual task status and device-local notes independent from AI processing; notes never enter research payloads.
- Share history filtering and cards across home and history pages so category separation and move scoping stay consistent.
- Cache City Essentials independently by move, category and relevant context after hydration; persist errors without automatic retries, reject unsupported citations and contact numbers, and create conversations only through explicit item actions.
