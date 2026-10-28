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

- Keep school records in a shared React provider above the routed pages for this UI-only prototype, so additions remain consistent during navigation without claiming durable storage.
- Reuse one addition dialog and shared validation schemas for classes, teachers and rooms to keep form behavior consistent.

- Store per-class weekly schedules in the shared session provider; new schedules start empty and replacing one requires explicit confirmation.
- Use the timetable class search parameter for selection and derive dashboard current lessons from the same grids using Europe/Paris time and half-open intervals with the configured course duration.

- Keep institution settings and weekly teacher unavailability in the shared session provider; validate lesson saves centrally and flag existing conflicts without silently deleting lessons.
- Preserve eight slot indexes when changing duration; recalculate starts from 08:00, with afternoon starting no earlier than 13:30 and a minimum one-hour lunch break, so existing grids remain aligned.
