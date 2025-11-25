export type PortalType = 'client' | 'team'

type PortalRow = { portal_type?: string | null } | null

/**
 * Normalizes raw Supabase rows into a typed list of portal access flags.
 */
export function normalizePortalTypes(rows?: PortalRow[] | null): PortalType[] {
  if (!rows) return []

  return rows
    .map((row) => row?.portal_type)
    .filter((value): value is PortalType => value === 'client' || value === 'team')
}

export function hasClientPortal(portals: PortalType[]) {
  return portals.includes('client')
}

export function hasTeamPortal(portals: PortalType[]) {
  return portals.includes('team')
}

export function canAccessClientPortal(portals: PortalType[]) {
  return hasClientPortal(portals) || portals.length === 0
}

/**
 * Picks the preferred portal to land on after login.
 * Defaults to the client portal when no explicit access is stored yet.
 */

