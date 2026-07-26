package blogimport

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestImportIsIdempotentAndPreservesArticleURLs(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	now := time.Date(2026, 4, 13, 8, 0, 0, 0, time.UTC)
	categoryId := int64(10)
	bundle := &Bundle{
		Categories: []Category{{
			Id: 10, Name: "技术", Slug: "tech", SortOrder: 1, CreatedAt: now,
		}},
		Tags: []Tag{{
			Id: 20, Name: "AI", Slug: "ai", CreatedAt: now,
		}},
		ArticleTags: []ArticleTag{{ArticleId: 30, TagId: 20}},
		Articles: []Article{{
			Id: 30, Slug: "existing-search-url", Title: "保留 URL", Content: "# 正文",
			Status: "published", PublishedAt: &now, CTAConfigJSON: "{}", StructuredJSON: "{}",
			CategoryId: &categoryId, MetadataJSON: "{}", CreatedAt: now, UpdatedAt: now,
		}},
		Settings: &Settings{
			BlogName: "UUcode Blog", ArticlesPerPage: 12, DefaultCTAJSON: "{}", UpdatedAt: now,
		},
	}

	first, err := Import(db, bundle, ImportOptions{BaseURL: "https://www.uucode.org"})
	require.NoError(t, err)
	assert.Equal(t, 1, first.ArticlesImported)
	assert.Equal(t, 1, first.ArticleTagsLinked)

	second, err := Import(db, bundle, ImportOptions{BaseURL: "https://www.uucode.org"})
	require.NoError(t, err)
	assert.Equal(t, 0, second.ArticlesImported)
	assert.Equal(t, 1, second.ArticlesSkipped)

	var article model.BlogArticle
	require.NoError(t, db.Preload("Category").Preload("Tags").Where("slug = ?", "existing-search-url").First(&article).Error)
	assert.Equal(t, "existing-search-url", article.Slug)
	require.NotNil(t, article.Category)
	assert.Equal(t, "tech", article.Category.Slug)
	require.Len(t, article.Tags, 1)
	assert.Equal(t, "ai", article.Tags[0].Slug)

	var settings model.BlogSettings
	require.NoError(t, db.First(&settings, 1).Error)
	assert.Equal(t, "https://www.uucode.org", settings.BaseUrl)
}
