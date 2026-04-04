-- Allow admins to update points_awarded on any user's global prediction row
create policy "Admins can update any global prediction"
  on public.global_predictions
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
