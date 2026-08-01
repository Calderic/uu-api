package service

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/model"
	"gorm.io/gorm"
)

var documentationSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type DocumentationPageInput struct {
	Slug            string  `json:"slug"`
	Title           string  `json:"title"`
	Summary         *string `json:"summary"`
	Content         string  `json:"content"`
	MetaTitle       *string `json:"meta_title"`
	MetaDescription *string `json:"meta_description"`
	Status          string  `json:"status"`
	CategoryId      *int64  `json:"category_id"`
	ParentId        *int64  `json:"parent_id"`
	SortOrder       int     `json:"sort_order"`
}

type DocumentationCategoryInput struct {
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	SortOrder   int     `json:"sort_order"`
}

type DocumentationSettingsInput struct {
	SiteName        string `json:"site_name"`
	SiteDescription string `json:"site_description"`
	BaseUrl         string `json:"base_url"`
}

type DocumentationIndex struct {
	Settings   *model.DocumentationSettingsView            `json:"settings"`
	Categories []*model.DocumentationCategoryWithPagesView `json:"categories"`
	Pages      []*model.DocumentationPageView              `json:"pages"`
}

type DocumentationNavigationItem struct {
	Slug         string `json:"slug"`
	Title        string `json:"title"`
	CategoryName string `json:"category_name,omitempty"`
}

type DocumentationPageResult struct {
	Settings   *model.DocumentationSettingsView            `json:"settings"`
	Categories []*model.DocumentationCategoryWithPagesView `json:"categories"`
	Page       *model.DocumentationPageView                `json:"page"`
	Previous   *DocumentationNavigationItem                `json:"previous_page,omitempty"`
	Next       *DocumentationNavigationItem                `json:"next_page,omitempty"`
}

type DocumentationSitemapEntry struct {
	Slug      string    `json:"slug"`
	UpdatedAt time.Time `json:"updated_at"`
}

func GetDocumentationSettings() (*model.DocumentationSettingsView, error) {
	return model.GetDocumentationSettings()
}

func UpdateDocumentationSettings(input DocumentationSettingsInput) (*model.DocumentationSettingsView, error) {
	siteName := strings.TrimSpace(input.SiteName)
	if siteName == "" {
		return nil, fmt.Errorf("documentation site name is required")
	}
	if utf8.RuneCountInString(siteName) > 200 {
		return nil, fmt.Errorf("documentation site name must be at most 200 characters")
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
			return nil, fmt.Errorf("documentation base URL must be an HTTP or HTTPS origin without a path")
		}
	}
	settings := &model.DocumentationSettings{
		SiteName:        siteName,
		SiteDescription: strings.TrimSpace(input.SiteDescription),
		BaseUrl:         baseURL,
	}
	return model.SaveDocumentationSettings(settings)
}

func ListPublishedDocumentation() (*DocumentationIndex, error) {
	return listPublishedDocumentation(false)
}

func listPublishedDocumentation(includeContent bool) (*DocumentationIndex, error) {
	settings, err := model.GetDocumentationSettings()
	if err != nil {
		return nil, err
	}
	var categories []model.DocumentationCategory
	if err := model.DB.Order("sort_order ASC").Order("id ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	var pages []model.DocumentationPage
	if err := model.DB.Preload("Category").
		Where("status = ?", model.DocumentationPageStatusPublished).
		Order("sort_order ASC").Order("id ASC").Find(&pages).Error; err != nil {
		return nil, err
	}
	if !includeContent {
		for index := range pages {
			pages[index].Content = ""
		}
	}
	return buildDocumentationIndex(settings, categories, pages), nil
}

func GetPublishedDocumentationPage(slug string) (*DocumentationPageResult, string, error) {
	slug = strings.TrimSpace(slug)
	var page model.DocumentationPage
	err := model.DB.Preload("Category").
		Where("slug = ? AND status = ?", slug, model.DocumentationPageStatusPublished).
		First(&page).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", err
		}
		var redirect model.DocumentationSlugRedirect
		if redirectErr := model.DB.Where("old_slug = ?", slug).First(&redirect).Error; redirectErr == nil {
			var targetCount int64
			if countErr := model.DB.Model(&model.DocumentationPage{}).
				Where("slug = ? AND status = ?", redirect.NewSlug, model.DocumentationPageStatusPublished).
				Count(&targetCount).Error; countErr != nil {
				return nil, "", countErr
			}
			if targetCount > 0 {
				return nil, redirect.NewSlug, model.ErrDocumentationPageNotFound
			}
		}
		return nil, "", model.ErrDocumentationPageNotFound
	}

	index, err := listPublishedDocumentation(false)
	if err != nil {
		return nil, "", err
	}
	pageView := page.View()
	position := -1
	for index, item := range index.Pages {
		if item.Slug == pageView.Slug {
			position = index
			break
		}
	}
	result := &DocumentationPageResult{
		Settings:   index.Settings,
		Categories: index.Categories,
		Page:       pageView,
	}
	if position > 0 {
		result.Previous = documentationNavigationItem(index.Pages[position-1])
	}
	if position >= 0 && position < len(index.Pages)-1 {
		result.Next = documentationNavigationItem(index.Pages[position+1])
	}
	return result, "", nil
}

func ListDocumentationSitemap() ([]DocumentationSitemapEntry, error) {
	var entries []DocumentationSitemapEntry
	err := model.DB.Model(&model.DocumentationPage{}).
		Select("slug", "updated_at").
		Where("status = ?", model.DocumentationPageStatusPublished).
		Order("sort_order ASC").Order("id ASC").Find(&entries).Error
	return entries, err
}

func RenderDocumentationLLMSIndex(baseURL string) (string, error) {
	index, err := listPublishedDocumentation(false)
	if err != nil {
		return "", err
	}
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	var builder strings.Builder
	builder.WriteString("# ")
	builder.WriteString(index.Settings.SiteName)
	builder.WriteString("\n\n")
	builder.WriteString(index.Settings.SiteDescription)
	builder.WriteString("\n\n")
	builder.WriteString("This is the machine-readable index for the public API documentation.\n")
	builder.WriteString("Read the linked pages when you need exact integration details.\n\n")
	for _, category := range index.Categories {
		builder.WriteString("## ")
		builder.WriteString(category.Name)
		builder.WriteString("\n\n")
		for _, page := range category.Pages {
			builder.WriteString("- [")
			builder.WriteString(page.Title)
			builder.WriteString("](")
			builder.WriteString(baseURL)
			builder.WriteString("/docs/")
			builder.WriteString(page.Slug)
			builder.WriteString("): ")
			builder.WriteString(documentationText(page.Summary))
			builder.WriteString("\n")
		}
		builder.WriteString("\n")
	}
	return builder.String(), nil
}

func RenderDocumentationLLMSFull(baseURL string) (string, error) {
	index, err := listPublishedDocumentation(true)
	if err != nil {
		return "", err
	}
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	var builder strings.Builder
	builder.WriteString("# ")
	builder.WriteString(index.Settings.SiteName)
	builder.WriteString("\n\n")
	builder.WriteString(index.Settings.SiteDescription)
	builder.WriteString("\n\n")
	for _, page := range index.Pages {
		builder.WriteString("---\n\n# ")
		builder.WriteString(page.Title)
		builder.WriteString("\n\nURL: ")
		builder.WriteString(baseURL)
		builder.WriteString("/docs/")
		builder.WriteString(page.Slug)
		builder.WriteString("\n\n")
		builder.WriteString(renderDocumentationContent(page.Content, baseURL))
		builder.WriteString("\n\n")
	}
	return builder.String(), nil
}

func ListDocumentationCategories() ([]*model.DocumentationCategoryView, error) {
	var categories []model.DocumentationCategory
	err := model.DB.Order("sort_order ASC").Order("id ASC").Find(&categories).Error
	if err != nil {
		return nil, err
	}
	views := make([]*model.DocumentationCategoryView, 0, len(categories))
	for index := range categories {
		views = append(views, categories[index].View())
	}
	return views, nil
}

func ListAdminDocumentationPages(search, status string, limit, offset int) ([]*model.DocumentationPageView, int64, error) {
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	query := model.DB.Model(&model.DocumentationPage{})
	if status = strings.TrimSpace(status); status != "" {
		query = query.Where("status = ?", status)
	}
	if search = strings.TrimSpace(search); search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(summary) LIKE ?", pattern, pattern, pattern)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var pages []model.DocumentationPage
	if err := query.Preload("Category").Order("updated_at DESC").Order("id DESC").Limit(limit).Offset(offset).Find(&pages).Error; err != nil {
		return nil, 0, err
	}
	views := make([]*model.DocumentationPageView, 0, len(pages))
	for index := range pages {
		views = append(views, pages[index].View())
	}
	return views, total, nil
}

func GetAdminDocumentationPage(id int64) (*model.DocumentationPageView, error) {
	var page model.DocumentationPage
	err := model.DB.Preload("Category").First(&page, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, model.ErrDocumentationPageNotFound
	}
	if err != nil {
		return nil, err
	}
	return page.View(), nil
}

func CreateDocumentationPage(input DocumentationPageInput) (*model.DocumentationPageView, error) {
	page, err := normalizeDocumentationPageInput(input)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	page.CreatedAt = now
	page.UpdatedAt = now
	if page.Status == model.DocumentationPageStatusPublished {
		page.PublishedAt = &now
	}
	if err := model.DB.Create(page).Error; err != nil {
		return nil, err
	}
	return GetAdminDocumentationPage(page.Id)
}

func UpdateDocumentationPage(id int64, input DocumentationPageInput) (*model.DocumentationPageView, error) {
	var existing model.DocumentationPage
	if err := model.DB.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, model.ErrDocumentationPageNotFound
		}
		return nil, err
	}
	page, err := normalizeDocumentationPageInput(input)
	if err != nil {
		return nil, err
	}
	if page.ParentId != nil && *page.ParentId == id {
		return nil, fmt.Errorf("a documentation page cannot be its own parent")
	}
	page.Id = existing.Id
	page.CreatedAt = existing.CreatedAt
	page.UpdatedAt = time.Now().UTC()
	page.PublishedAt = existing.PublishedAt
	if page.Status == model.DocumentationPageStatusPublished && page.PublishedAt == nil {
		publishedAt := page.UpdatedAt
		page.PublishedAt = &publishedAt
	}
	err = model.DB.Transaction(func(tx *gorm.DB) error {
		if existing.Slug != page.Slug {
			redirect := model.DocumentationSlugRedirect{
				OldSlug:   existing.Slug,
				NewSlug:   page.Slug,
				CreatedAt: page.UpdatedAt,
			}
			if err := tx.Where("old_slug = ?", existing.Slug).
				Assign(model.DocumentationSlugRedirect{NewSlug: page.Slug}).
				FirstOrCreate(&redirect).Error; err != nil {
				return err
			}
			if err := tx.Model(&model.DocumentationSlugRedirect{}).
				Where("new_slug = ?", existing.Slug).
				Update("new_slug", page.Slug).Error; err != nil {
				return err
			}
		}
		return tx.Save(page).Error
	})
	if err != nil {
		return nil, err
	}
	return GetAdminDocumentationPage(id)
}

func SetDocumentationPageStatus(id int64, status string) (*model.DocumentationPageView, error) {
	if !validDocumentationPageStatus(status) {
		return nil, fmt.Errorf("invalid documentation page status")
	}
	var page model.DocumentationPage
	if err := model.DB.First(&page, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, model.ErrDocumentationPageNotFound
		}
		return nil, err
	}
	updates := map[string]any{
		"status":     status,
		"updated_at": time.Now().UTC(),
	}
	if status == model.DocumentationPageStatusPublished && page.PublishedAt == nil {
		updates["published_at"] = time.Now().UTC()
	}
	result := model.DB.Model(&model.DocumentationPage{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, model.ErrDocumentationPageNotFound
	}
	return GetAdminDocumentationPage(id)
}

func DeleteDocumentationPage(id int64) error {
	var page model.DocumentationPage
	if err := model.DB.First(&page, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.ErrDocumentationPageNotFound
		}
		return err
	}
	return model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("new_slug = ?", page.Slug).Delete(&model.DocumentationSlugRedirect{}).Error; err != nil {
			return err
		}
		return tx.Delete(&page).Error
	})
}

func CreateDocumentationCategory(input DocumentationCategoryInput) (*model.DocumentationCategoryView, error) {
	category, err := normalizeDocumentationCategoryInput(input)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	category.CreatedAt = now
	category.UpdatedAt = now
	if err := model.DB.Create(category).Error; err != nil {
		return nil, err
	}
	return category.View(), nil
}

func UpdateDocumentationCategory(id int64, input DocumentationCategoryInput) (*model.DocumentationCategoryView, error) {
	var existing model.DocumentationCategory
	if err := model.DB.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, model.ErrDocumentationCategoryNotFound
		}
		return nil, err
	}
	category, err := normalizeDocumentationCategoryInput(input)
	if err != nil {
		return nil, err
	}
	category.Id = existing.Id
	category.CreatedAt = existing.CreatedAt
	category.UpdatedAt = time.Now().UTC()
	if err := model.DB.Save(category).Error; err != nil {
		return nil, err
	}
	return category.View(), nil
}

func DeleteDocumentationCategory(id int64) error {
	var category model.DocumentationCategory
	if err := model.DB.First(&category, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.ErrDocumentationCategoryNotFound
		}
		return err
	}
	var pageCount int64
	if err := model.DB.Model(&model.DocumentationPage{}).Where("category_id = ?", id).Count(&pageCount).Error; err != nil {
		return err
	}
	if pageCount > 0 {
		return fmt.Errorf("documentation category still has pages")
	}
	return model.DB.Delete(&category).Error
}

func normalizeDocumentationPageInput(input DocumentationPageInput) (*model.DocumentationPage, error) {
	slug := strings.ToLower(strings.TrimSpace(input.Slug))
	if !documentationSlugPattern.MatchString(slug) {
		return nil, fmt.Errorf("slug must contain lowercase letters, numbers, and hyphens only")
	}
	if len(slug) > 191 {
		return nil, fmt.Errorf("slug must be at most 191 characters")
	}
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if utf8.RuneCountInString(title) > 200 {
		return nil, fmt.Errorf("title must be at most 200 characters")
	}
	content := strings.TrimSpace(input.Content)
	if content == "" {
		return nil, fmt.Errorf("content is required")
	}
	metaTitle := trimDocumentationString(input.MetaTitle)
	if metaTitle != nil && utf8.RuneCountInString(*metaTitle) > 120 {
		return nil, fmt.Errorf("meta title must be at most 120 characters")
	}
	metaDescription := trimDocumentationString(input.MetaDescription)
	if metaDescription != nil && utf8.RuneCountInString(*metaDescription) > 320 {
		return nil, fmt.Errorf("meta description must be at most 320 characters")
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = model.DocumentationPageStatusDraft
	}
	if !validDocumentationPageStatus(status) {
		return nil, fmt.Errorf("invalid documentation page status")
	}
	categoryId := normalizeDocumentationId(input.CategoryId)
	if categoryId != nil {
		var count int64
		if err := model.DB.Model(&model.DocumentationCategory{}).Where("id = ?", *categoryId).Count(&count).Error; err != nil {
			return nil, err
		}
		if count == 0 {
			return nil, model.ErrDocumentationCategoryNotFound
		}
	}
	parentId := normalizeDocumentationId(input.ParentId)
	if parentId != nil {
		var count int64
		if err := model.DB.Model(&model.DocumentationPage{}).Where("id = ?", *parentId).Count(&count).Error; err != nil {
			return nil, err
		}
		if count == 0 {
			return nil, model.ErrDocumentationPageNotFound
		}
	}
	return &model.DocumentationPage{
		Slug:            slug,
		Title:           title,
		Summary:         trimDocumentationString(input.Summary),
		Content:         content,
		MetaTitle:       metaTitle,
		MetaDescription: metaDescription,
		Status:          status,
		CategoryId:      categoryId,
		ParentId:        parentId,
		SortOrder:       input.SortOrder,
	}, nil
}

func normalizeDocumentationCategoryInput(input DocumentationCategoryInput) (*model.DocumentationCategory, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, fmt.Errorf("category name is required")
	}
	if utf8.RuneCountInString(name) > 100 {
		return nil, fmt.Errorf("category name must be at most 100 characters")
	}
	slug := strings.ToLower(strings.TrimSpace(input.Slug))
	if !documentationSlugPattern.MatchString(slug) {
		return nil, fmt.Errorf("category slug must contain lowercase letters, numbers, and hyphens only")
	}
	if len(slug) > 100 {
		return nil, fmt.Errorf("category slug must be at most 100 characters")
	}
	return &model.DocumentationCategory{
		Name:        name,
		Slug:        slug,
		Description: trimDocumentationString(input.Description),
		SortOrder:   input.SortOrder,
	}, nil
}

func buildDocumentationIndex(settings *model.DocumentationSettingsView, categories []model.DocumentationCategory, pages []model.DocumentationPage) *DocumentationIndex {
	result := &DocumentationIndex{
		Settings:   settings,
		Categories: make([]*model.DocumentationCategoryWithPagesView, 0, len(categories)),
		Pages:      make([]*model.DocumentationPageView, 0, len(pages)),
	}
	categoryById := make(map[int64]*model.DocumentationCategoryWithPagesView, len(categories))
	for index := range categories {
		view := categories[index].View()
		category := &model.DocumentationCategoryWithPagesView{
			DocumentationCategoryView: *view,
			Pages:                     make([]*model.DocumentationPageView, 0),
		}
		result.Categories = append(result.Categories, category)
		categoryById[categories[index].Id] = category
	}
	var uncategorized *model.DocumentationCategoryWithPagesView
	for index := range pages {
		page := pages[index].View()
		result.Pages = append(result.Pages, page)
		if page.CategoryId != nil {
			if category := categoryById[*page.CategoryId]; category != nil {
				category.Pages = append(category.Pages, page)
				continue
			}
		}
		if uncategorized == nil {
			uncategorized = &model.DocumentationCategoryWithPagesView{
				DocumentationCategoryView: model.DocumentationCategoryView{
					Name:      "其他",
					Slug:      "other",
					SortOrder: 9999,
				},
				Pages: make([]*model.DocumentationPageView, 0),
			}
			result.Categories = append(result.Categories, uncategorized)
		}
		uncategorized.Pages = append(uncategorized.Pages, page)
	}
	return result
}

func documentationNavigationItem(page *model.DocumentationPageView) *DocumentationNavigationItem {
	if page == nil {
		return nil
	}
	item := &DocumentationNavigationItem{
		Slug:  page.Slug,
		Title: page.Title,
	}
	if page.Category != nil {
		item.CategoryName = page.Category.Name
	}
	return item
}

func renderDocumentationContent(content, baseURL string) string {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	content = strings.ReplaceAll(content, "{{BASE_URL}}", baseURL)
	if baseURL != "" {
		content = strings.ReplaceAll(content, "](/docs/", "]("+baseURL+"/docs/")
	}
	return content
}

func documentationText(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func trimDocumentationString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeDocumentationId(value *int64) *int64 {
	if value == nil || *value < 1 {
		return nil
	}
	return value
}

func validDocumentationPageStatus(status string) bool {
	switch status {
	case model.DocumentationPageStatusDraft,
		model.DocumentationPageStatusPublished,
		model.DocumentationPageStatusArchived,
		model.DocumentationPageStatusPendingReview:
		return true
	default:
		return false
	}
}
