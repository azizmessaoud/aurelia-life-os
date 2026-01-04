-- Add user_id column to all tables and update RLS policies to require authentication

-- 1. academic_assignments
ALTER TABLE public.academic_assignments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to academic_assignments" ON public.academic_assignments;
CREATE POLICY "Users can manage their own academic_assignments" ON public.academic_assignments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. academic_courses
ALTER TABLE public.academic_courses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to academic_courses" ON public.academic_courses;
CREATE POLICY "Users can manage their own academic_courses" ON public.academic_courses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. academic_materials
ALTER TABLE public.academic_materials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to academic_materials" ON public.academic_materials;
CREATE POLICY "Users can manage their own academic_materials" ON public.academic_materials FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. academic_schedule
ALTER TABLE public.academic_schedule ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to academic_schedule" ON public.academic_schedule;
CREATE POLICY "Users can manage their own academic_schedule" ON public.academic_schedule FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. blackboard_sync_logs
ALTER TABLE public.blackboard_sync_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to blackboard_sync_logs" ON public.blackboard_sync_logs;
CREATE POLICY "Users can manage their own blackboard_sync_logs" ON public.blackboard_sync_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. burnout_indicators
ALTER TABLE public.burnout_indicators ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to burnout_indicators" ON public.burnout_indicators;
CREATE POLICY "Users can manage their own burnout_indicators" ON public.burnout_indicators FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. daily_logs
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to daily_logs" ON public.daily_logs;
CREATE POLICY "Users can manage their own daily_logs" ON public.daily_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. deep_work_sessions
ALTER TABLE public.deep_work_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to deep_work_sessions" ON public.deep_work_sessions;
CREATE POLICY "Users can manage their own deep_work_sessions" ON public.deep_work_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. goal_force_fields
ALTER TABLE public.goal_force_fields ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to goal_force_fields" ON public.goal_force_fields;
CREATE POLICY "Users can manage their own goal_force_fields" ON public.goal_force_fields FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to goals" ON public.goals;
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. health_scores
ALTER TABLE public.health_scores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to health_scores" ON public.health_scores;
CREATE POLICY "Users can manage their own health_scores" ON public.health_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. knowledge_entities
ALTER TABLE public.knowledge_entities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to knowledge_entities" ON public.knowledge_entities;
CREATE POLICY "Users can manage their own knowledge_entities" ON public.knowledge_entities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. knowledge_relationships
ALTER TABLE public.knowledge_relationships ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to knowledge_relationships" ON public.knowledge_relationships;
CREATE POLICY "Users can manage their own knowledge_relationships" ON public.knowledge_relationships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. meta_goals
ALTER TABLE public.meta_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to meta_goals" ON public.meta_goals;
CREATE POLICY "Users can manage their own meta_goals" ON public.meta_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. mood_logs
ALTER TABLE public.mood_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to mood_logs" ON public.mood_logs;
CREATE POLICY "Users can manage their own mood_logs" ON public.mood_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 16. opportunities
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to income_streams" ON public.opportunities;
CREATE POLICY "Users can manage their own opportunities" ON public.opportunities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 17. pattern_insights
ALTER TABLE public.pattern_insights ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to pattern_insights" ON public.pattern_insights;
CREATE POLICY "Users can manage their own pattern_insights" ON public.pattern_insights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 18. projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 19. weekly_capacity
ALTER TABLE public.weekly_capacity ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Allow all access to weekly_capacity" ON public.weekly_capacity;
CREATE POLICY "Users can manage their own weekly_capacity" ON public.weekly_capacity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);