package service

import (
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildDocumentationIndexGroupsPagesForPublicNavigation(t *testing.T) {
	summary := "Start here"
	settings := &model.DocumentationSettingsView{SiteName: "Docs"}
	categories := []model.DocumentationCategory{
		{Id: 1, Name: "Getting started", Slug: "getting-started", SortOrder: 10},
		{Id: 2, Name: "API", Slug: "api", SortOrder: 20},
	}
	pages := []model.DocumentationPage{
		{
			Id:         1,
			Slug:       "quick-start",
			Title:      "Quick start",
			Summary:    &summary,
			CategoryId: int64Pointer(1),
			Category:   &categories[0],
			SortOrder:  10,
		},
		{
			Id:         2,
			Slug:       "reference",
			Title:      "Reference",
			CategoryId: int64Pointer(2),
			Category:   &categories[1],
			SortOrder:  10,
		},
		{
			Id:        3,
			Slug:      "faq",
			Title:     "FAQ",
			SortOrder: 20,
		},
	}

	result := buildDocumentationIndex(settings, categories, pages)

	require.Len(t, result.Categories, 3)
	require.Len(t, result.Pages, 3)
	assert.Equal(t, "quick-start", result.Categories[0].Pages[0].Slug)
	assert.Equal(t, "reference", result.Categories[1].Pages[0].Slug)
	assert.Equal(t, "other", result.Categories[2].Slug)
	assert.Equal(t, "faq", result.Categories[2].Pages[0].Slug)
}

func TestRenderDocumentationContentUsesConfiguredBaseURL(t *testing.T) {
	content := "Call {{BASE_URL}}/v1/models from {{BASE_URL}}."

	assert.Equal(
		t,
		"Call https://api.example.com/v1/models from https://api.example.com.",
		renderDocumentationContent(content, "https://api.example.com/"),
	)
}

func int64Pointer(value int64) *int64 {
	return &value
}
