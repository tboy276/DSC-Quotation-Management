-- 1. Xóa bỏ constraint cũ chỉ cho phép 'forging', 'casting'
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_segment_check;

-- 2. Thêm constraint mới chấp nhận đủ 4 segment
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_segment_check 
CHECK (segment IN ('forging', 'casting', 'sawing', 'machining'));
