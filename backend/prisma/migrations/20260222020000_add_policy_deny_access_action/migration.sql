-- Add POLICY_DENY enum value for audit of denied policy decisions
ALTER TYPE "AccessAction" ADD VALUE IF NOT EXISTS 'POLICY_DENY';
