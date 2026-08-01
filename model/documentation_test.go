package model

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestMigrateDocumentationSeedsContentOnce(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	require.NoError(t, MigrateDocumentation(db))
	require.NoError(t, MigrateDocumentation(db))

	var pageCount int64
	require.NoError(t, db.Model(&DocumentationPage{}).Count(&pageCount).Error)
	require.Equal(t, int64(5), pageCount)

	var categoryCount int64
	require.NoError(t, db.Model(&DocumentationCategory{}).Count(&categoryCount).Error)
	require.Equal(t, int64(4), categoryCount)

	var settings DocumentationSettings
	require.NoError(t, db.First(&settings, 1).Error)
	require.True(t, settings.InitialContentSeeded)
}
