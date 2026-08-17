import { supabase } from './supabase';

/**
 * Log an audit event to the audit_log table.
 * This is a fire-and-forget function that will not throw errors to the caller.
 *
 * @param action - The action performed (e.g. 'DELETE_RFQ', 'VOID_DOCUMENT')
 * @param tableName - The main table affected
 * @param recordId - The ID of the affected record (optional)
 * @param details - Additional details as a JSON object (optional)
 */
export const logAudit = async (
  action: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Fallback to 'System' if no user is found, though policies require authenticated user
    const actorEmail = session?.user?.email || 'System';

    if (sessionError) {
      console.warn('AuditLog: Failed to get session', sessionError);
    }

    const { error } = await supabase.from('audit_log').insert({
      actor_email: actorEmail,
      action,
      table_name: tableName,
      record_id: recordId,
      details
    });

    if (error) {
      console.error('AuditLog: Failed to insert audit log', error);
    }
  } catch (err) {
    console.error('AuditLog: Unexpected error logging audit event', err);
  }
};
