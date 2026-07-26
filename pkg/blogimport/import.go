package blogimport

import (
	"fmt"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"gorm.io/gorm"
)

type ImportOptions struct {
	BaseURL   string
	Overwrite bool
}

type ImportReport struct {
	CategoriesImported int
	CategoriesSkipped  int
	TagsImported       int
	TagsSkipped        int
	ArticlesImported   int
	ArticlesUpdated    int
	ArticlesSkipped    int
	ArticleTagsLinked  int
}

func Import(db *gorm.DB, bundle *Bundle, options ImportOptions) (*ImportReport, error) {
	if db == nil {
		return nil, fmt.Errorf("database is required")
	}
	if bundle == nil {
		return nil, fmt.Errorf("blog bundle is required")
	}
	if err := model.MigrateBlog(db); err != nil {
		return nil, err
	}
	report := &ImportReport{}
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := importSettings(tx, bundle.Settings, options); err != nil {
			return err
		}
		categoryIds, err := importCategories(tx, bundle.Categories, options.Overwrite, report)
		if err != nil {
			return err
		}
		tagIds, err := importTags(tx, bundle.Tags, options.Overwrite, report)
		if err != nil {
			return err
		}
		return importArticles(tx, bundle, categoryIds, tagIds, options.Overwrite, report)
	})
	if err != nil {
		return nil, err
	}
	return report, nil
}

func importSettings(db *gorm.DB, source *Settings, options ImportOptions) error {
	now := time.Now().UTC()
	settings := model.BlogSettings{
		Id:              1,
		BlogName:        "Blog",
		BlogDescription: "",
		ArticlesPerPage: 12,
		DefaultCTAJSON:  "{}",
		BaseUrl:         strings.TrimRight(strings.TrimSpace(options.BaseURL), "/"),
		UpdatedAt:       now,
	}
	if source != nil {
		settings.BlogName = source.BlogName
		settings.BlogDescription = source.BlogDescription
		settings.ArticlesPerPage = source.ArticlesPerPage
		settings.DefaultCTAJSON = normalizedJSON(source.DefaultCTAJSON)
		settings.UpdatedAt = source.UpdatedAt
	}

	var existing model.BlogSettings
	err := db.First(&existing, 1).Error
	if err == nil {
		if options.Overwrite {
			return db.Save(&settings).Error
		}
		if existing.BaseUrl == "" && settings.BaseUrl != "" {
			return db.Model(&existing).Update("base_url", settings.BaseUrl).Error
		}
		return nil
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	return db.Create(&settings).Error
}

func importCategories(db *gorm.DB, sources []Category, overwrite bool, report *ImportReport) (map[int64]int64, error) {
	ids := make(map[int64]int64, len(sources))
	for _, source := range sources {
		category := model.BlogCategory{
			Name:        source.Name,
			Slug:        source.Slug,
			Description: source.Description,
			SortOrder:   source.SortOrder,
			CreatedAt:   source.CreatedAt,
		}
		var existing model.BlogCategory
		err := db.Where("slug = ?", source.Slug).First(&existing).Error
		switch {
		case err == nil && overwrite:
			category.Id = existing.Id
			if err := db.Save(&category).Error; err != nil {
				return nil, err
			}
			report.CategoriesImported++
		case err == nil:
			category = existing
			report.CategoriesSkipped++
		case err == gorm.ErrRecordNotFound:
			if err := db.Create(&category).Error; err != nil {
				return nil, err
			}
			report.CategoriesImported++
		default:
			return nil, err
		}
		ids[source.Id] = category.Id
	}
	return ids, nil
}

func importTags(db *gorm.DB, sources []Tag, overwrite bool, report *ImportReport) (map[int64]int64, error) {
	ids := make(map[int64]int64, len(sources))
	for _, source := range sources {
		tag := model.BlogTag{
			Name:        source.Name,
			Slug:        source.Slug,
			Description: source.Description,
			CreatedAt:   source.CreatedAt,
		}
		var existing model.BlogTag
		err := db.Where("slug = ?", source.Slug).First(&existing).Error
		switch {
		case err == nil && overwrite:
			tag.Id = existing.Id
			if err := db.Save(&tag).Error; err != nil {
				return nil, err
			}
			report.TagsImported++
		case err == nil:
			tag = existing
			report.TagsSkipped++
		case err == gorm.ErrRecordNotFound:
			if err := db.Create(&tag).Error; err != nil {
				return nil, err
			}
			report.TagsImported++
		default:
			return nil, err
		}
		ids[source.Id] = tag.Id
	}
	return ids, nil
}

func importArticles(
	db *gorm.DB,
	bundle *Bundle,
	categoryIds map[int64]int64,
	tagIds map[int64]int64,
	overwrite bool,
	report *ImportReport,
) error {
	sourceTagIds := make(map[int64][]int64)
	for _, link := range bundle.ArticleTags {
		sourceTagIds[link.ArticleId] = append(sourceTagIds[link.ArticleId], link.TagId)
	}
	for _, source := range bundle.Articles {
		article, err := importedArticle(source, categoryIds)
		if err != nil {
			return err
		}
		var existing model.BlogArticle
		err = db.Where("slug = ?", source.Slug).First(&existing).Error
		switch {
		case err == nil && overwrite:
			article.Id = existing.Id
			if err := db.Save(article).Error; err != nil {
				return err
			}
			report.ArticlesUpdated++
		case err == nil:
			report.ArticlesSkipped++
			continue
		case err == gorm.ErrRecordNotFound:
			if err := db.Create(article).Error; err != nil {
				return err
			}
			report.ArticlesImported++
		default:
			return err
		}

		tags := make([]model.BlogTag, 0, len(sourceTagIds[source.Id]))
		for _, sourceTagId := range sourceTagIds[source.Id] {
			tagId, exists := tagIds[sourceTagId]
			if !exists {
				return fmt.Errorf("article %q references missing tag %d", source.Slug, sourceTagId)
			}
			tags = append(tags, model.BlogTag{Id: tagId})
		}
		if err := db.Model(article).Association("Tags").Replace(tags); err != nil {
			return err
		}
		report.ArticleTagsLinked += len(tags)
	}
	return nil
}

func importedArticle(source Article, categoryIds map[int64]int64) (*model.BlogArticle, error) {
	var categoryId *int64
	if source.CategoryId != nil {
		mapped, exists := categoryIds[*source.CategoryId]
		if !exists {
			return nil, fmt.Errorf("article %q references missing category %d", source.Slug, *source.CategoryId)
		}
		categoryId = &mapped
	}
	for name, raw := range map[string]string{
		"cta_config":      source.CTAConfigJSON,
		"structured_data": source.StructuredJSON,
		"metadata":        source.MetadataJSON,
	} {
		var value map[string]any
		if err := common.Unmarshal([]byte(normalizedJSON(raw)), &value); err != nil {
			return nil, fmt.Errorf("article %q has invalid %s: %w", source.Slug, name, err)
		}
	}
	return &model.BlogArticle{
		Slug:            source.Slug,
		Title:           source.Title,
		Content:         source.Content,
		Excerpt:         source.Excerpt,
		CoverImageUrl:   source.CoverImageUrl,
		MetaTitle:       source.MetaTitle,
		MetaDescription: source.MetaDescription,
		CanonicalUrl:    source.CanonicalUrl,
		Status:          source.Status,
		AuthorLegacyId:  source.AuthorId,
		PublishedAt:     source.PublishedAt,
		CTAConfigJSON:   normalizedJSON(source.CTAConfigJSON),
		StructuredJSON:  normalizedJSON(source.StructuredJSON),
		ViewCount:       source.ViewCount,
		CTAClickCount:   source.CTAClickCount,
		CategoryId:      categoryId,
		SortOrder:       source.SortOrder,
		IsFeatured:      source.IsFeatured,
		MetadataJSON:    normalizedJSON(source.MetadataJSON),
		CreatedAt:       source.CreatedAt,
		UpdatedAt:       source.UpdatedAt,
	}, nil
}

func normalizedJSON(value string) string {
	if strings.TrimSpace(value) == "" {
		return "{}"
	}
	return value
}
