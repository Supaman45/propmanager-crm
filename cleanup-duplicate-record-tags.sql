-- Clean up duplicate record_tags entries
-- This removes duplicate tag assignments where the same tag is assigned to the same record multiple times
-- It keeps the record with the lowest ID and deletes the duplicates

DELETE FROM record_tags a USING record_tags b
WHERE a.id > b.id 
  AND a.tag_id = b.tag_id 
  AND a.record_type = b.record_type 
  AND a.record_id = b.record_id;

-- Verify no duplicates remain
-- This query should return 0 rows if cleanup was successful
SELECT 
  tag_id, 
  record_type, 
  record_id, 
  COUNT(*) as count
FROM record_tags
GROUP BY tag_id, record_type, record_id
HAVING COUNT(*) > 1;
