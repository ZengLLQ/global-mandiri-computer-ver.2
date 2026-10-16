package rbac_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/gmc/api/internal/admin/rbac"
)

func TestValidateAllOperationsRegistered(t *testing.T) {
	err := rbac.ValidateAllOperationsRegistered()
	require.NoError(t, err, "All admin operations should be explicitly registered in RBAC table")
}

func TestHasPermission(t *testing.T) {
	// Admin role should have all permissions
	for _, perm := range rbac.AllPermissions {
		assert.True(t, rbac.HasPermission("admin", perm), "admin should have %s", perm)
	}

	// Staff should have reading and basic staff permissions, but not delete products, opname, staff management, audit, or settings write
	assert.True(t, rbac.HasPermission("staff", rbac.PermOrdersRead))
	assert.True(t, rbac.HasPermission("staff", rbac.PermProductsRead))
	assert.True(t, rbac.HasPermission("staff", rbac.PermInventoryRead))

	assert.False(t, rbac.HasPermission("staff", rbac.PermProductsDelete), "staff must not delete products")
	assert.False(t, rbac.HasPermission("staff", rbac.PermInventoryOpname), "staff must not do inventory opname")
	assert.False(t, rbac.HasPermission("staff", rbac.PermStaffWrite), "staff must not manage staff")
	assert.False(t, rbac.HasPermission("staff", rbac.PermAuditRead), "staff must not read audit log")
	assert.False(t, rbac.HasPermission("staff", rbac.PermSettingsWrite), "staff must not edit site settings")

	// Unknown role has no permissions
	assert.False(t, rbac.HasPermission("customer", rbac.PermOrdersRead))
	assert.False(t, rbac.HasPermission("", rbac.PermOrdersRead))
}

func TestPermissionsForRole(t *testing.T) {
	adminPerms := rbac.PermissionsForRole("admin")
	assert.Equal(t, len(rbac.AllPermissions), len(adminPerms))

	staffPerms := rbac.PermissionsForRole("staff")
	assert.Equal(t, len(rbac.StaffPermissions), len(staffPerms))

	assert.Nil(t, rbac.PermissionsForRole("guest"))
}
