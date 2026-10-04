export interface AuditLog {
    id: number
    userId: number
    userName: string | null
    action: 'create' | 'update' | 'delete' | 'cancel' | 'return' | 'payment' | 'login'
    entityType: string
    entityId: number | null
    entityLabel: string | null
    changes: Record<string, { old: any; new: any }> | null
    description: string | null
    createdAt: string
}
