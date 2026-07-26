package service

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"gorm.io/gorm"
)

var blogSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type BlogArticleInput struct {
	Slug            string         `json:"slug"`
	Title           string         `json:"title"`
	Content         string         `json:"content"`
	Excerpt         *string        `json:"excerpt"`
	CoverImageUrl   *string        `json:"cover_image_url"`
	MetaTitle       *string        `json:"meta_title"`
	MetaDescription *string        `json:"meta_description"`
	CanonicalUrl    *string        `json:"canonical_url"`
	Status          string         `json:"status"`
	CategoryId      *int64         `json:"category_id"`
	TagIds          []int64        `json:"tag_ids"`
	CTAConfig       map[string]any `json:"cta_config"`
	StructuredData  map[string]any `json:"structured_data"`
	Metadata        map[string]any `json:"metadata"`
	SortOrder       int            `json:"sort_order"`
	IsFeatured      bool           `json:"is_featured"`
}

type BlogSettingsInput struct {
	BlogName         string         `json:"blog_name"`
	BlogDescription  string         `json:"blog_description"`
	ArticlesPerPage  int            `json:"articles_per_page"`
	DefaultCTAConfig map[string]any `json:"default_cta_config"`
	BaseUrl          string         `json:"base_url"`
}

type BlogSitemapEntry struct {
	Slug        string     `json:"slug"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func ListPublishedBlogArticles(categorySlug, tagSlug string, limit, offset int) ([]*model.BlogArticleView, int64, error) {
	if limit < 1 {
		limit = 12
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	query := model.DB.Model(&model.BlogArticle{}).
		Where("blog_articles.status = ?", model.BlogArticleStatusPublished)
	if categorySlug != "" {
		query = query.Joins("JOIN blog_categories ON blog_categories.id = blog_articles.category_id").
			Where("blog_categories.slug = ?", categorySlug)
	}
	if tagSlug != "" {
		query = query.Joins("JOIN blog_article_tags ON blog_article_tags.blog_article_id = blog_articles.id").
			Joins("JOIN blog_tags ON blog_tags.id = blog_article_tags.blog_tag_id").
			Where("blog_tags.slug = ?", tagSlug)
	}

	var total int64
	if err := query.Distinct("blog_articles.id").Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var articles []model.BlogArticle
	err := query.Distinct("blog_articles.*").
		Preload("Category").
		Preload("Tags").
		Order("blog_articles.is_featured DESC").
		Order("blog_articles.sort_order DESC").
		Order("blog_articles.published_at DESC").
		Order("blog_articles.id DESC").
		Limit(limit).
		Offset(offset).
		Find(&articles).Error
	if err != nil {
		return nil, 0, err
	}
	return blogArticleViews(articles), total, nil
}

func GetPublishedBlogArticle(slug string) (*model.BlogArticleView, string, error) {
	slug = strings.TrimSpace(slug)
	var article model.BlogArticle
	err := model.DB.Preload("Category").Preload("Tags").
		Where("slug = ? AND status = ?", slug, model.BlogArticleStatusPublished).
		First(&article).Error
	if err == nil {
		return article.View(), "", nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", err
	}

	var redirect model.BlogSlugRedirect
	if redirectErr := model.DB.Where("old_slug = ?", slug).First(&redirect).Error; redirectErr == nil {
		var targetCount int64
		if countErr := model.DB.Model(&model.BlogArticle{}).
			Where("slug = ? AND status = ?", redirect.NewSlug, model.BlogArticleStatusPublished).
			Count(&targetCount).Error; countErr != nil {
			return nil, "", countErr
		}
		if targetCount > 0 {
			return nil, redirect.NewSlug, model.ErrBlogArticleNotFound
		}
	}
	return nil, "", model.ErrBlogArticleNotFound
}

func ListPublishedBlogSitemap() ([]BlogSitemapEntry, error) {
	var entries []BlogSitemapEntry
	err := model.DB.Model(&model.BlogArticle{}).
		Select("slug", "published_at", "updated_at").
		Where("status = ?", model.BlogArticleStatusPublished).
		Order("published_at DESC").
		Order("id DESC").
		Find(&entries).Error
	return entries, err
}

func ListBlogCategories() ([]model.BlogCategory, error) {
	var categories []model.BlogCategory
	err := model.DB.Order("sort_order ASC").Order("id ASC").Find(&categories).Error
	return categories, err
}

func ListBlogTags() ([]model.BlogTag, error) {
	var tags []model.BlogTag
	err := model.DB.Order("name ASC").Order("id ASC").Find(&tags).Error
	return tags, err
}

func ListAdminBlogArticles(search, status string, limit, offset int) ([]*model.BlogArticleView, int64, error) {
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	query := model.DB.Model(&model.BlogArticle{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search = strings.TrimSpace(search); search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(slug) LIKE ?", pattern, pattern)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var articles []model.BlogArticle
	err := query.Preload("Category").Preload("Tags").
		Order("updated_at DESC").Order("id DESC").
		Limit(limit).Offset(offset).Find(&articles).Error
	if err != nil {
		return nil, 0, err
	}
	return blogArticleViews(articles), total, nil
}

func GetAdminBlogArticle(id int64) (*model.BlogArticleView, error) {
	var article model.BlogArticle
	err := model.DB.Preload("Category").Preload("Tags").First(&article, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, model.ErrBlogArticleNotFound
	}
	if err != nil {
		return nil, err
	}
	return article.View(), nil
}

func CreateBlogArticle(input BlogArticleInput) (*model.BlogArticleView, error) {
	article, tags, err := normalizeBlogArticleInput(input)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	article.CreatedAt = now
	article.UpdatedAt = now
	if article.Status == model.BlogArticleStatusPublished {
		article.PublishedAt = &now
	}
	err = model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(article).Error; err != nil {
			return err
		}
		return tx.Model(article).Association("Tags").Replace(tags)
	})
	if err != nil {
		return nil, err
	}
	return GetAdminBlogArticle(article.Id)
}

func UpdateBlogArticle(id int64, input BlogArticleInput) (*model.BlogArticleView, error) {
	var existing model.BlogArticle
	if err := model.DB.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, model.ErrBlogArticleNotFound
		}
		return nil, err
	}
	article, tags, err := normalizeBlogArticleInput(input)
	if err != nil {
		return nil, err
	}
	article.Id = existing.Id
	article.AuthorLegacyId = existing.AuthorLegacyId
	article.ViewCount = existing.ViewCount
	article.CTAClickCount = existing.CTAClickCount
	article.CreatedAt = existing.CreatedAt
	article.UpdatedAt = time.Now().UTC()
	article.PublishedAt = existing.PublishedAt
	if article.Status == model.BlogArticleStatusPublished && article.PublishedAt == nil {
		publishedAt := article.UpdatedAt
		article.PublishedAt = &publishedAt
	}

	err = model.DB.Transaction(func(tx *gorm.DB) error {
		if existing.Slug != article.Slug {
			redirect := model.BlogSlugRedirect{
				OldSlug:   existing.Slug,
				NewSlug:   article.Slug,
				CreatedAt: article.UpdatedAt,
			}
			if err := tx.Where("old_slug = ?", existing.Slug).
				Assign(model.BlogSlugRedirect{NewSlug: article.Slug}).
				FirstOrCreate(&redirect).Error; err != nil {
				return err
			}
			if err := tx.Model(&model.BlogSlugRedirect{}).
				Where("new_slug = ?", existing.Slug).
				Update("new_slug", article.Slug).Error; err != nil {
				return err
			}
		}
		if err := tx.Save(article).Error; err != nil {
			return err
		}
		return tx.Model(article).Association("Tags").Replace(tags)
	})
	if err != nil {
		return nil, err
	}
	return GetAdminBlogArticle(article.Id)
}

func SetBlogArticleStatus(id int64, status string) (*model.BlogArticleView, error) {
	if !validBlogStatus(status) {
		return nil, fmt.Errorf("invalid article status")
	}
	var article model.BlogArticle
	if err := model.DB.First(&article, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, model.ErrBlogArticleNotFound
		}
		return nil, err
	}
	updates := map[string]any{"status": status, "updated_at": time.Now().UTC()}
	if status == model.BlogArticleStatusPublished && article.PublishedAt == nil {
		updates["published_at"] = time.Now().UTC()
	}
	result := model.DB.Model(&model.BlogArticle{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, model.ErrBlogArticleNotFound
	}
	return GetAdminBlogArticle(id)
}

func UpdateBlogSettings(input BlogSettingsInput) (*model.BlogSettingsView, error) {
	if strings.TrimSpace(input.BlogName) == "" {
		return nil, fmt.Errorf("blog name is required")
	}
	if input.ArticlesPerPage < 1 || input.ArticlesPerPage > 100 {
		return nil, fmt.Errorf("articles per page must be between 1 and 100")
	}
	cta, err := common.Marshal(nonNilJSONObject(input.DefaultCTAConfig))
	if err != nil {
		return nil, err
	}
	baseURL := strings.TrimRight(strings.TrimSpace(input.BaseUrl), "/")
	if baseURL != "" {
		parsed, parseErr := url.Parse(baseURL)
		if parseErr != nil ||
			(parsed.Scheme != "http" && parsed.Scheme != "https") ||
			parsed.Host == "" ||
			(parsed.Path != "" && parsed.Path != "/") ||
			parsed.RawQuery != "" ||
			parsed.Fragment != "" {
			return nil, fmt.Errorf("base URL must be an HTTP or HTTPS origin without a path")
		}
	}
	settings := &model.BlogSettings{
		BlogName:        strings.TrimSpace(input.BlogName),
		BlogDescription: strings.TrimSpace(input.BlogDescription),
		ArticlesPerPage: input.ArticlesPerPage,
		DefaultCTAJSON:  string(cta),
		BaseUrl:         baseURL,
	}
	return model.SaveBlogSettings(settings)
}

func RecordBlogView(slug string) error {
	result := model.DB.Model(&model.BlogArticle{}).
		Where("slug = ? AND status = ?", slug, model.BlogArticleStatusPublished).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return model.ErrBlogArticleNotFound
	}
	return nil
}

func RecordBlogCTAClick(slug string) error {
	result := model.DB.Model(&model.BlogArticle{}).
		Where("slug = ? AND status = ?", slug, model.BlogArticleStatusPublished).
		UpdateColumn("cta_click_count", gorm.Expr("cta_click_count + ?", 1))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return model.ErrBlogArticleNotFound
	}
	return nil
}

func normalizeBlogArticleInput(input BlogArticleInput) (*model.BlogArticle, []model.BlogTag, error) {
	slug := strings.ToLower(strings.TrimSpace(input.Slug))
	if !blogSlugPattern.MatchString(slug) {
		return nil, nil, fmt.Errorf("slug must contain lowercase letters, numbers, and hyphens only")
	}
	if len(slug) > 191 {
		return nil, nil, fmt.Errorf("slug must be at most 191 characters")
	}
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return nil, nil, fmt.Errorf("title is required")
	}
	if utf8.RuneCountInString(title) > 500 {
		return nil, nil, fmt.Errorf("title must be at most 500 characters")
	}
	if strings.TrimSpace(input.Content) == "" {
		return nil, nil, fmt.Errorf("content is required")
	}
	metaTitle := trimBlogString(input.MetaTitle)
	if metaTitle != nil && utf8.RuneCountInString(*metaTitle) > 120 {
		return nil, nil, fmt.Errorf("meta title must be at most 120 characters")
	}
	metaDescription := trimBlogString(input.MetaDescription)
	if metaDescription != nil && utf8.RuneCountInString(*metaDescription) > 320 {
		return nil, nil, fmt.Errorf("meta description must be at most 320 characters")
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = model.BlogArticleStatusDraft
	}
	if !validBlogStatus(status) {
		return nil, nil, fmt.Errorf("invalid article status")
	}
	cta, err := common.Marshal(nonNilJSONObject(input.CTAConfig))
	if err != nil {
		return nil, nil, err
	}
	structured, err := common.Marshal(nonNilJSONObject(input.StructuredData))
	if err != nil {
		return nil, nil, err
	}
	metadata, err := common.Marshal(nonNilJSONObject(input.Metadata))
	if err != nil {
		return nil, nil, err
	}

	tags := make([]model.BlogTag, 0, len(input.TagIds))
	if len(input.TagIds) > 0 {
		if err := model.DB.Where("id IN ?", input.TagIds).Find(&tags).Error; err != nil {
			return nil, nil, err
		}
		if len(tags) != len(input.TagIds) {
			return nil, nil, fmt.Errorf("one or more tags do not exist")
		}
	}
	if input.CategoryId != nil {
		var count int64
		if err := model.DB.Model(&model.BlogCategory{}).Where("id = ?", *input.CategoryId).Count(&count).Error; err != nil {
			return nil, nil, err
		}
		if count == 0 {
			return nil, nil, fmt.Errorf("category does not exist")
		}
	}
	return &model.BlogArticle{
		Slug:            slug,
		Title:           title,
		Content:         input.Content,
		Excerpt:         trimBlogString(input.Excerpt),
		CoverImageUrl:   trimBlogString(input.CoverImageUrl),
		MetaTitle:       metaTitle,
		MetaDescription: metaDescription,
		CanonicalUrl:    trimBlogString(input.CanonicalUrl),
		Status:          status,
		CTAConfigJSON:   string(cta),
		StructuredJSON:  string(structured),
		CategoryId:      input.CategoryId,
		SortOrder:       input.SortOrder,
		IsFeatured:      input.IsFeatured,
		MetadataJSON:    string(metadata),
	}, tags, nil
}

func blogArticleViews(articles []model.BlogArticle) []*model.BlogArticleView {
	views := make([]*model.BlogArticleView, 0, len(articles))
	for index := range articles {
		views = append(views, articles[index].View())
	}
	return views
}

func validBlogStatus(status string) bool {
	switch status {
	case model.BlogArticleStatusDraft,
		model.BlogArticleStatusPublished,
		model.BlogArticleStatusArchived,
		model.BlogArticleStatusPendingReview:
		return true
	default:
		return false
	}
}

func nonNilJSONObject(value map[string]any) map[string]any {
	if value == nil {
		return map[string]any{}
	}
	return value
}

func trimBlogString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
