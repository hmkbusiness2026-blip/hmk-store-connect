
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS processing_by uuid;

CREATE INDEX IF NOT EXISTS idx_orders_processing_by ON public.orders(processing_by);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
