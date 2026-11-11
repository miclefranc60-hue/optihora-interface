<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all school state in a shared provider mounted by the `_authenticated` layout; it loads from and debounce-saves to the signed-in establishment's `profiles.data` JSON row, so one shared account per establishment sees the same data on any device.
- Reuse one addition dialog and shared validation schemas for classes, teachers and rooms to keep form behavior consistent.

- Store per-class weekly schedules in the shared session provider; new schedules are generated from per-subject weekly hours by `src/lib/generator.ts` (max 2 h per subject per day, respecting teacher availability) and replacing one requires explicit confirmation.
- Use the timetable class search parameter for selection and derive dashboard current lessons and teachers’ current classes from the same grids using Europe/Paris time and half-open intervals with the configured course duration.

- Keep institution settings and weekly teacher unavailability in the shared session provider; validate lesson saves centrally and flag existing conflicts without silently deleting lessons.
- Apply the institution's simultaneous-teaching permission in the shared schedule update function and its conflict lookup used by lesson forms and warnings; disabling permission flags existing lessons without deleting them, and common slot indexes represent non-overlapping institution-wide intervals.
- Preserve eight stored slot indexes; derive each weekday’s visible non-overlapping slots centrally from its configurable start/end and optional lunch interval, falling back to legacy hours until personalized. All views, generation and validation use the same weekday slots so existing grids stay aligned.
- Teacher edits use the shared record dialog and a pure reference update to rename schedule lessons, principal-teacher links and unavailability together; subject changes preserve existing lessons and flag mismatches for review.

- Keep predefined and custom subjects in the shared session catalog; all selectors and display lookups use that catalog, and validate referenced IDs against it at provider actions.
- Mount Opti activity and conversation once in the authenticated layout, scoped to the signed-in account; keep chat ephemeral and outside school persistence. Use the uploaded asset catalog for reactions and still poses for reduced motion.
- Preload Opti’s next pose before crossfading, and sequence flight into the supplied landing animation; animate only the mascot, not its controls, to keep interactions stable.
- Use motion-interpolated transparent WebP derivatives for Opti animations while retaining original uploads and still alternatives; this increases frame cadence without changing clip duration or mascot identity.
- Opti advice runs through an authenticated server function using the AI Gateway SDK; it can suggest existing pages but cannot mutate school data. Report saved activity only after the school upsert succeeds.
