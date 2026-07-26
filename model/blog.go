package model

import (
	"errors"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	BlogArticleStatusDraft         = "draft"
	BlogArticleStatusPublished     = "published"
	BlogArticleStatusArchived      = "archived"
	BlogArticleStatusPendingReview = "pending_review"
)

var ErrBlogArticleNotFound = errors.New("blog article not found")

type BlogCategory struct {
	Id          int64     `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"size:100;not null"`
	Slug        string    `json:"slug" gorm:"size:100;uniqueIndex;not null"`
	Description *string   `json:"description,omitempty" gorm:"type:text"`
	SortOrder   int       `json:"sort_order" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null"`
}

func (BlogCategory) TableName() string {
	return "blog_categories"
}

type BlogTag struct {
	Id          int64     `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"size:100;not null"`
	Slug        string    `json:"slug" gorm:"size:100;uniqueIndex;not null"`
	Description *string   `json:"description,omitempty" gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null"`
}

func (BlogTag) TableName() string {
	return "blog_tags"
}

type BlogArticle struct {
	Id              int64         `json:"id" gorm:"primaryKey"`
	Slug            string        `json:"slug" gorm:"size:191;uniqueIndex;not null"`
	Title           string        `json:"title" gorm:"size:500;not null"`
	Content         string        `json:"content" gorm:"type:text;not null"`
	Excerpt         *string       `json:"excerpt,omitempty" gorm:"type:text"`
	CoverImageUrl   *string       `json:"cover_image_url,omitempty" gorm:"type:text"`
	MetaTitle       *string       `json:"meta_title,omitempty" gorm:"size:120"`
	MetaDescription *string       `json:"meta_description,omitempty" gorm:"size:320"`
	CanonicalUrl    *string       `json:"canonical_url,omitempty" gorm:"type:text"`
	Status          string        `json:"status" gorm:"size:20;index:idx_blog_publish;not null"`
	AuthorLegacyId  *string       `json:"author_id,omitempty" gorm:"size:64"`
	PublishedAt     *time.Time    `json:"published_at,omitempty" gorm:"index:idx_blog_publish"`
	CTAConfigJSON   string        `json:"-" gorm:"column:cta_config;type:text;not null"`
	StructuredJSON  string        `json:"-" gorm:"column:structured_data;type:text;not null"`
	ViewCount       int           `json:"view_count" gorm:"not null"`
	CTAClickCount   int           `json:"cta_click_count" gorm:"not null"`
	CategoryId      *int64        `json:"category_id,omitempty" gorm:"index"`
	Category        *BlogCategory `json:"category,omitempty" gorm:"foreignKey:CategoryId"`
	Tags            []BlogTag     `json:"tags,omitempty" gorm:"many2many:blog_article_tags"`
	SortOrder       int           `json:"sort_order" gorm:"not null"`
	IsFeatured      bool          `json:"is_featured" gorm:"not null"`
	MetadataJSON    string        `json:"-" gorm:"column:metadata;type:text;not null"`
	CreatedAt       time.Time     `json:"created_at" gorm:"not null"`
	UpdatedAt       time.Time     `json:"updated_at" gorm:"not null"`
}

func (BlogArticle) TableName() string {
	return "blog_articles"
}

type BlogArticleTag struct {
	BlogArticleId int64 `gorm:"primaryKey"`
	BlogTagId     int64 `gorm:"primaryKey"`
}

func (BlogArticleTag) TableName() string {
	return "blog_article_tags"
}

type BlogSlugRedirect struct {
	Id        int64     `gorm:"primaryKey"`
	OldSlug   string    `gorm:"size:191;uniqueIndex;not null"`
	NewSlug   string    `gorm:"size:191;index;not null"`
	CreatedAt time.Time `gorm:"not null"`
}

func (BlogSlugRedirect) TableName() string {
	return "blog_slug_redirects"
}

type BlogSettings struct {
	Id              int64     `json:"id" gorm:"primaryKey"`
	BlogName        string    `json:"blog_name" gorm:"size:200;not null"`
	BlogDescription string    `json:"blog_description" gorm:"type:text;not null"`
	ArticlesPerPage int       `json:"articles_per_page" gorm:"not null"`
	DefaultCTAJSON  string    `json:"-" gorm:"column:default_cta_config;type:text;not null"`
	BaseUrl         string    `json:"base_url" gorm:"type:text;not null"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"not null"`
}

func (BlogSettings) TableName() string {
	return "blog_settings"
}

type BlogArticleView struct {
	Id              int64          `json:"id"`
	Slug            string         `json:"slug"`
	Title           string         `json:"title"`
	Content         string         `json:"content"`
	Excerpt         *string        `json:"excerpt,omitempty"`
	CoverImageUrl   *string        `json:"cover_image_url,omitempty"`
	MetaTitle       *string        `json:"meta_title,omitempty"`
	MetaDescription *string        `json:"meta_description,omitempty"`
	CanonicalUrl    *string        `json:"canonical_url,omitempty"`
	Status          string         `json:"status"`
	AuthorLegacyId  *string        `json:"author_id,omitempty"`
	PublishedAt     *time.Time     `json:"published_at,omitempty"`
	CTAConfig       map[string]any `json:"cta_config"`
	StructuredData  map[string]any `json:"structured_data"`
	ViewCount       int            `json:"view_count"`
	CTAClickCount   int            `json:"cta_click_count"`
	CategoryId      *int64         `json:"category_id,omitempty"`
	Category        *BlogCategory  `json:"category,omitempty"`
	Tags            []BlogTag      `json:"tags"`
	SortOrder       int            `json:"sort_order"`
	IsFeatured      bool           `json:"is_featured"`
	Metadata        map[string]any `json:"metadata"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

type BlogSettingsView struct {
	Id               int64          `json:"id"`
	BlogName         string         `json:"blog_name"`
	BlogDescription  string         `json:"blog_description"`
	ArticlesPerPage  int            `json:"articles_per_page"`
	DefaultCTAConfig map[string]any `json:"default_cta_config"`
	BaseUrl          string         `json:"base_url"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

func MigrateBlog(db *gorm.DB) error {
	return db.AutoMigrate(
		&BlogCategory{},
		&BlogTag{},
		&BlogArticle{},
		&BlogArticleTag{},
		&BlogSlugRedirect{},
		&BlogSettings{},
	)
}

func GetBlogSettings() (*BlogSettingsView, error) {
	var settings BlogSettings
	err := DB.First(&settings, 1).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		now := time.Now().UTC()
		settings = BlogSettings{
			Id:              1,
			BlogName:        "Blog",
			BlogDescription: "",
			ArticlesPerPage: 12,
			DefaultCTAJSON:  "{}",
			BaseUrl:         "",
			UpdatedAt:       now,
		}
		if err := DB.Create(&settings).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return settings.View(), nil
}

func SaveBlogSettings(settings *BlogSettings) (*BlogSettingsView, error) {
	settings.Id = 1
	settings.UpdatedAt = time.Now().UTC()
	if settings.ArticlesPerPage < 1 || settings.ArticlesPerPage > 100 {
		settings.ArticlesPerPage = 12
	}
	if strings.TrimSpace(settings.BlogName) == "" {
		settings.BlogName = "Blog"
	}
	if strings.TrimSpace(settings.DefaultCTAJSON) == "" {
		settings.DefaultCTAJSON = "{}"
	}
	err := DB.Where("id = ?", 1).Assign(*settings).FirstOrCreate(&BlogSettings{Id: 1}).Error
	if err != nil {
		return nil, err
	}
	return settings.View(), nil
}

func (settings *BlogSettings) View() *BlogSettingsView {
	return &BlogSettingsView{
		Id:               settings.Id,
		BlogName:         settings.BlogName,
		BlogDescription:  settings.BlogDescription,
		ArticlesPerPage:  settings.ArticlesPerPage,
		DefaultCTAConfig: blogJSONObject(settings.DefaultCTAJSON),
		BaseUrl:          settings.BaseUrl,
		UpdatedAt:        settings.UpdatedAt,
	}
}

func (article *BlogArticle) View() *BlogArticleView {
	tags := article.Tags
	if tags == nil {
		tags = []BlogTag{}
	}
	return &BlogArticleView{
		Id:              article.Id,
		Slug:            article.Slug,
		Title:           article.Title,
		Content:         article.Content,
		Excerpt:         article.Excerpt,
		CoverImageUrl:   article.CoverImageUrl,
		MetaTitle:       article.MetaTitle,
		MetaDescription: article.MetaDescription,
		CanonicalUrl:    article.CanonicalUrl,
		Status:          article.Status,
		AuthorLegacyId:  article.AuthorLegacyId,
		PublishedAt:     article.PublishedAt,
		CTAConfig:       blogJSONObject(article.CTAConfigJSON),
		StructuredData:  blogJSONObject(article.StructuredJSON),
		ViewCount:       article.ViewCount,
		CTAClickCount:   article.CTAClickCount,
		CategoryId:      article.CategoryId,
		Category:        article.Category,
		Tags:            tags,
		SortOrder:       article.SortOrder,
		IsFeatured:      article.IsFeatured,
		Metadata:        blogJSONObject(article.MetadataJSON),
		CreatedAt:       article.CreatedAt,
		UpdatedAt:       article.UpdatedAt,
	}
}

func blogJSONObject(raw string) map[string]any {
	value := map[string]any{}
	if strings.TrimSpace(raw) == "" {
		return value
	}
	if err := common.Unmarshal([]byte(raw), &value); err != nil {
		return map[string]any{}
	}
	return value
}
