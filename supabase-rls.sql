-- ==============================================================================
-- AGNI KAVACH (SIH26162) - PRODUCTION SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- This script configures production-grade database access control for Agni Kavach:
-- 1. Public / Unauthenticated Users: Read-only access to FIRMS thermal intelligence
--    and operational status dashboards. Anonymous writes are strictly prohibited.
-- 2. Authenticated Operators: Authorized operational writes (Alert Dispatches and
--    Field Investigations) verified via authenticated JWT and auth.uid() checks.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: public.hotspots (21 Thermal Anomaly Hotspots Layer)
-- ------------------------------------------------------------------------------
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;

-- Policy 1.1: Public Read-Only Access
-- Allows any user (unauthenticated or authenticated) to view thermal anomaly intelligence.
DROP POLICY IF EXISTS "Allow public read access on hotspots" ON public.hotspots;
CREATE POLICY "Allow public read access on hotspots"
ON public.hotspots
FOR SELECT
TO public
USING (true);

-- Policy 1.2: Authenticated Operational Updates
-- Only authenticated operators with valid auth.uid() can update status (alert_status, investigation_status, explanation).
DROP POLICY IF EXISTS "Allow authenticated operators to update hotspots" ON public.hotspots;
CREATE POLICY "Allow authenticated operators to update hotspots"
ON public.hotspots
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Explicitly block anonymous INSERT, UPDATE, DELETE on hotspots
DROP POLICY IF EXISTS "Disallow anonymous writes on hotspots" ON public.hotspots;


-- ------------------------------------------------------------------------------
-- 2. TABLE: public.alerts (Operational Incident Dispatch Table)
-- ------------------------------------------------------------------------------
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policy 2.1: Public Read-Only Access
-- Allows dashboard and response teams to inspect active and historical alerts.
DROP POLICY IF EXISTS "Allow public read access on alerts" ON public.alerts;
CREATE POLICY "Allow public read access on alerts"
ON public.alerts
FOR SELECT
TO public
USING (true);

-- Policy 2.2: Authenticated Operational Alert Creation
-- Only authenticated operators can dispatch operational alerts.
DROP POLICY IF EXISTS "Allow authenticated operators to insert alerts" ON public.alerts;
CREATE POLICY "Allow authenticated operators to insert alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2.3: Authenticated Operational Alert Updates
-- Only authenticated operators can acknowledge or resolve alerts.
DROP POLICY IF EXISTS "Allow authenticated operators to update alerts" ON public.alerts;
CREATE POLICY "Allow authenticated operators to update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);


-- ------------------------------------------------------------------------------
-- 3. TABLE: public.investigations (Triage and Ground Verification Dossier Table)
-- ------------------------------------------------------------------------------
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

-- Policy 3.1: Public Read-Only Access
-- Allows analysts to view investigation histories and ground triage evidence.
DROP POLICY IF EXISTS "Allow public read access on investigations" ON public.investigations;
CREATE POLICY "Allow public read access on investigations"
ON public.investigations
FOR SELECT
TO public
USING (true);

-- Policy 3.2: Authenticated Operational Investigation Initiation
-- Only authenticated operators can register new field investigations.
DROP POLICY IF EXISTS "Allow authenticated operators to insert investigations" ON public.investigations;
CREATE POLICY "Allow authenticated operators to insert investigations"
ON public.investigations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3.3: Authenticated Operational Investigation Updates
-- Only authenticated operators can modify investigation status or logs.
DROP POLICY IF EXISTS "Allow authenticated operators to update investigations" ON public.investigations;
CREATE POLICY "Allow authenticated operators to update investigations"
ON public.investigations
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
