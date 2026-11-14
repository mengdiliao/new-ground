# New Ground frontend
## Proactive suggestions
- [x] Add optional single-action suggestions with recent-conversation repetition controls.
- [x] Reuse email/calendar cards and explicit task confirmation beneath replies.
- [x] Test suggestions, task isolation, and live email/calendar click-to-open flows; all 143 tests pass.
## Calendar Assistant
- [x] Add typed calendar drafts to the existing AI with current-date context, reliable destination time zones, and task isolation.
- [x] Add editable cards and reusable calendar actions for chats, research, and city items, with Google links and calendar files.
- [x] Verify missing dates, tentative status, daylight saving, calendar export, live chats, researched-source actions, and phone layout; saving/importing in external calendar accounts remains user-controlled.
## Email Assistant
- [x] Add structured, evidence-checked email actions to the existing assistant without task progress changes.
- [x] Add session-only editing, rewriting, translation, copy, and user-initiated mail handoffs.
- [x] Verify live drafting, revisions, mail links, safety, and desktop/mobile presentation; external app behavior remains browser/account dependent.
## Image-rich research
- [x] Extend existing Exa metadata, normalize relevant source images, and cache attribution with research.
- [x] Add optional source-backed visuals to city items and conversational answers with safe text-only fallbacks.
- [x] Verify real city/community searches, source attribution, image failures and responsive presentation.
## City Essentials
- [x] Add bounded automatic research, source-backed structured items, and move/category-specific local caching.
- [x] Add preview hubs, full lists, detail/source dialogs, contextual queries and confirmed task creation.
- [x] Verify cache reuse, invalidation, safety, live research, existing chats and desktop/mobile layouts.
## Queries and tracked tasks
- [x] Migrate saved history safely and distinguish queries from explicit tasks.
- [x] Add shared history tabs, creation choice, conversion, manual status, and local notes.
- [x] Verify migration, move isolation, live research, persistence, and card layout.
## Persistent Move Setup
- [x] Reuse device-local profile storage for multiple moves, migration, editing, switching, and confirmed details.
- [x] Replace the homepage form with saved-move summary and shared setup controls.
- [x] Bind tasks and agent context to their move; flag changed research and offer a separate refresh.
- [x] Verify persistence, isolation, updated agent/Exa context, and the live research flow.
## Feature discovery
- [x] Replace the homepage category grid with a four-card feature discovery section (illustrated, two-column grid).
- [x] Move "Your Move" directly below the hero as a compact journey card with inline pickers and swap.
- [x] Add dedicated feature workspaces with contextual destination collection and the shared composer.
- [x] Verify routing, live research from a feature page, tests, and desktop/mobile layout.

## Claude-inspired presentation
- [x] Review the task-history brief and add browser-only persistence, rename/delete/reopen controls, timestamps, and action checkboxes.
- [x] Verify saved conversations, restored live replies, checklist persistence, and confirmed deletion; all 50 tests pass.
- [x] Refresh homepage typography and add a reduced-motion-aware rotating word board.
- [x] Add nine dedicated topic pages with suggested questions using the unchanged research workflow.
- [x] Verify topic navigation, live answers, existing tests, and desktop/mobile layout.

- [x] Establish the warm visual system and illustrated homepage.
- [x] Add sidebar navigation, demo task views, and local task creation.
- [x] Verify desktop and mobile interactions.

## Visual refinement
- [x] Apply the specified palette, typography, corners, and soft shadows without changing behavior.
- [x] Refine the neighborhood illustration and illustrated empty state.
- [x] Verify the existing interactions and desktop/mobile presentation.

## Interactive task workflow
- [x] Add dedicated task workspaces and per-task conversation, progress, research, and result state.
- [x] Connect submission, keyboard controls, new tasks, and task switching.
- [x] Test demo honesty, state isolation, and desktop/mobile flows.

## Live Exa search
- [x] Enable Lovable Cloud and collect EXA_API_KEY securely.
- [x] Add server-side Exa search, validated results, and safe failure handling.
- [x] Connect genuine loading and source results without changing visual design.
- [x] Verify live search and add a test using an actual Exa response.

## Intelligent assistant
- [x] Add OpenAI Responses orchestration with bounded Exa tools and real progress events.
- [x] Preserve per-task conversations, evidence, and research limits across follow-ups.
- [x] Connect answers, clarification, retry, and sources without changing the visual system.
- [x] Test safety limits and a complete live request (33 tests; official Oodi sources, contextual follow-up, desktop and mobile).

## Onboarding and profile
- [x] Build a flight-booking-style LocationPicker (search + country browsing) on the global GeoNames dataset.
- [x] Add an onboarding flow and profile model where every value stays unknown until the user sets it.
- [x] Add a profile-driven dashboard card with empty states and destination-gated move research.
- [x] Verify onboarding, swap, empty states, persistence, and existing chat end to end (67 tests; live answer with sources).