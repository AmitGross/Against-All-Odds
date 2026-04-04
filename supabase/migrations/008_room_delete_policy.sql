-- Allow room owner to delete their own room
create policy "Room owner can delete" on public.rooms
  for delete using (auth.uid() = created_by);
