// lib/audit/log.ts
// Helper pentru scrierea în audit_log din server actions/admin routes.
import { getServiceRoleSupabase } from "@/lib/supabase/server"

export type AuditEntry = {
  actorUserId: string | null
  actorRole?: string
  action: string              // ex: "firm.approve"
  entityType: string          // ex: "gas_firms"
  entityId: string
  summary?: string
  metadata?: Record<string, unknown>
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = getServiceRoleSupabase()
    await admin.from("audit_log").insert({
      actor_user_id: entry.actorUserId,
      actor_role: entry.actorRole ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      summary: entry.summary ?? null,
      metadata: entry.metadata ?? null,
    })
  } catch (err) {
    // Audit-ul nu trebuie să blocheze acțiunea principală
    console.error("[audit] failed:", err)
  }
}
