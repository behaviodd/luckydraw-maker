-- 관리자 피드백 업데이트 정책 (읽음 처리용)
CREATE POLICY "feedbacks_admin_update" ON feedbacks
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
