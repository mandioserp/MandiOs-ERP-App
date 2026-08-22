export function getTenantId(req) {
  if (req?.user?.role === 'super_admin') {
    // Super Admin can optionally specify a target tenantId in query or body
    return req.query?.tenantId || req.body?.tenantId || null;
  }
  return req?.user?.tenantId || 'tenant_default_001';
}

export function buildTenantQuery(req, query = {}) {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    // If super admin and no specific tenantId passed, do not restrict by tenantId
    return { ...query };
  }
  return { ...query, tenantId };
}

export function assertTenantOwnership(req, record) {
  if (!record || req?.user?.role === 'super_admin') return true;
  return record.tenantId === getTenantId(req);
}
