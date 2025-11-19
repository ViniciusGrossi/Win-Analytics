-- Enable RLS on tables that don't have it
ALTER TABLE public.cmd_exec ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create basic policies for cmd_exec (admin only)
CREATE POLICY "Only admins can access cmd_exec"
  ON public.cmd_exec FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create basic policies for documents (admin only for now)
CREATE POLICY "Only admins can access documents"
  ON public.documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));