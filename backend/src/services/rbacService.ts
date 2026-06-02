import { db } from '../lib/supabase';

/**
 * RBAC Service - Role-Based Access Control
 * Manages permissions, roles, and access checks
 */

export const rbacService = {
  /**
   * Get user with roles and permissions
   */
  async getUserWithPermissions(userId: string) {
    const { data: user, error } = await db
      .from('users')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        phone,
        is_active,
        role:roles(id, name, description),
        role:roles(role_permissions(permission:permissions(id, name)))
      `
      )
      .eq('id', userId)
      .single();

    if (error) throw error;
    return user;
  },

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const { data, error } = await db
      .from('users')
      .select(
        `
        role:roles(role_permissions(permission:permissions(name)))
      `
      )
      .eq('id', userId)
      .single();

    if (error) return false;

    const permissions = data?.role?.[0]?.role_permissions?.map((rp: any) => rp.permission?.name) || [];
    return permissions.includes(permissionName);
  },

  /**
   * Create role with permissions
   */
  async createRole(name: string, description: string, permissionIds: string[]) {
    const { data: role, error: roleError } = await db
      .from('roles')
      .insert({ name, description })
      .select()
      .single();

    if (roleError) throw roleError;

    if (permissionIds.length > 0) {
      const rolePerms = permissionIds.map((permId) => ({
        role_id: role.id,
        permission_id: permId
      }));

      const { error: permError } = await db.from('role_permissions').insert(rolePerms);
      if (permError) throw permError;
    }

    return role;
  },

  /**
   * List all permissions
   */
  async listPermissions() {
    const { data, error } = await db.from('permissions').select('*');
    if (error) throw error;
    return data;
  }
};
