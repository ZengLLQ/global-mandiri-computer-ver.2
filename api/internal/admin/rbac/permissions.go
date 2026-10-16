package rbac

import (
	"fmt"
)

type Permission string

const (
	PermOrdersRead           Permission = "orders:read"
	PermOrdersWrite          Permission = "orders:write"
	PermOrdersExport         Permission = "orders:export"
	PermOrdersStatusOverride Permission = "orders:status_override"

	PermProductsRead   Permission = "products:read"
	PermProductsWrite  Permission = "products:write"
	PermProductsDelete Permission = "products:delete"

	PermInventoryRead   Permission = "inventory:read"
	PermInventoryAdjust Permission = "inventory:adjust"
	PermInventoryOpname Permission = "inventory:opname"

	PermCategoriesWrite Permission = "categories:write"
	PermBrandsWrite     Permission = "brands:write"

	PermCustomersRead   Permission = "customers:read"
	PermCustomersExport Permission = "customers:export"

	PermVouchersRead  Permission = "vouchers:read"
	PermVouchersWrite Permission = "vouchers:write"

	PermContentRead  Permission = "content:read"
	PermContentWrite Permission = "content:write"

	PermInboxRead  Permission = "inbox:read"
	PermInboxWrite Permission = "inbox:write"

	PermReportsRead   Permission = "reports:read"
	PermReportsExport Permission = "reports:export"

	PermStaffRead  Permission = "staff:read"
	PermStaffWrite Permission = "staff:write"

	PermAuditRead Permission = "audit:read"

	PermSettingsRead  Permission = "settings:read"
	PermSettingsWrite Permission = "settings:write"
)

var AllPermissions = []Permission{
	PermOrdersRead, PermOrdersWrite, PermOrdersExport, PermOrdersStatusOverride,
	PermProductsRead, PermProductsWrite, PermProductsDelete,
	PermInventoryRead, PermInventoryAdjust, PermInventoryOpname,
	PermCategoriesWrite, PermBrandsWrite,
	PermCustomersRead, PermCustomersExport,
	PermVouchersRead, PermVouchersWrite,
	PermContentRead, PermContentWrite,
	PermInboxRead, PermInboxWrite,
	PermReportsRead, PermReportsExport,
	PermStaffRead, PermStaffWrite,
	PermAuditRead,
	PermSettingsRead, PermSettingsWrite,
}

var StaffPermissions = []Permission{
	PermOrdersRead, PermOrdersWrite, PermOrdersExport,
	PermProductsRead, PermProductsWrite,
	PermInventoryRead, PermInventoryAdjust,
	PermCategoriesWrite, PermBrandsWrite,
	PermCustomersRead,
	PermVouchersRead,
	PermContentRead, PermContentWrite,
	PermInboxRead, PermInboxWrite,
	PermReportsRead,
	PermSettingsRead,
}

type Requirement struct {
	Public   bool
	AnyAdmin bool
	Perm     Permission
}

var OperationRequirements = map[string]Requirement{
	"adminLogin":          {Public: true},
	"AdminLogin":          {Public: true},
	"adminLogout":         {AnyAdmin: true},
	"AdminLogout":         {AnyAdmin: true},
	"adminRefresh":        {Public: true},
	"AdminRefresh":        {Public: true},
	"getAdminMe":          {AnyAdmin: true},
	"GetAdminMe":          {AnyAdmin: true},
	"adminChangePassword": {AnyAdmin: true},
	"AdminChangePassword": {AnyAdmin: true},
	"adminTotpSetup":      {AnyAdmin: true},
	"AdminTotpSetup":      {AnyAdmin: true},
	"adminTotpEnable":     {AnyAdmin: true},
	"AdminTotpEnable":     {AnyAdmin: true},
	"adminTotpDisable":    {AnyAdmin: true},
	"AdminTotpDisable":    {AnyAdmin: true},
	"getAdminCounters":    {AnyAdmin: true},
	"GetAdminCounters":    {AnyAdmin: true},
}

var ExpectedAdminOperations = []string{
	"AdminLogin",
	"AdminLogout",
	"AdminRefresh",
	"GetAdminMe",
	"AdminChangePassword",
	"AdminTotpSetup",
	"AdminTotpEnable",
	"AdminTotpDisable",
	"GetAdminCounters",
}

func HasPermission(role string, perm Permission) bool {
	if role == "admin" {
		return true
	}
	if role == "staff" {
		for _, p := range StaffPermissions {
			if p == perm {
				return true
			}
		}
	}
	return false
}

func PermissionsForRole(role string) []string {
	if role == "admin" {
		res := make([]string, len(AllPermissions))
		for i, p := range AllPermissions {
			res[i] = string(p)
		}
		return res
	}
	if role == "staff" {
		res := make([]string, len(StaffPermissions))
		for i, p := range StaffPermissions {
			res[i] = string(p)
		}
		return res
	}
	return nil
}

// ValidateOperationRegistered ensures that the given operation has an explicit RBAC requirement.
func ValidateOperationRegistered(operationID string) error {
	if _, ok := OperationRequirements[operationID]; !ok {
		return fmt.Errorf("operation %q is missing an explicit RBAC requirement", operationID)
	}
	return nil
}

// ValidateAllOperationsRegistered validates all generated admin operations at boot time.
func ValidateAllOperationsRegistered() error {
	for _, op := range ExpectedAdminOperations {
		if err := ValidateOperationRegistered(op); err != nil {
			return err
		}
	}
	return nil
}
