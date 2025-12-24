-- Add answer_html column to knowledge_base table for Tiptap rich text storage
ALTER TABLE knowledge_base 
ADD COLUMN answer_html TEXT;

-- Migrate existing answer field to answer_html (copy markdown as-is for now)
UPDATE knowledge_base 
SET answer_html = answer 
WHERE answer_html IS NULL;
