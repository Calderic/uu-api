package model

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

const (
	DocumentationPageStatusDraft         = "draft"
	DocumentationPageStatusPublished     = "published"
	DocumentationPageStatusArchived      = "archived"
	DocumentationPageStatusPendingReview = "pending_review"
)

var (
	ErrDocumentationPageNotFound     = errors.New("documentation page not found")
	ErrDocumentationCategoryNotFound = errors.New("documentation category not found")
)

type DocumentationCategory struct {
	Id          int64     `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"size:100;not null"`
	Slug        string    `json:"slug" gorm:"size:100;uniqueIndex;not null"`
	Description *string   `json:"description,omitempty" gorm:"type:text"`
	SortOrder   int       `json:"sort_order" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"not null"`
}

func (DocumentationCategory) TableName() string {
	return "documentation_categories"
}

type DocumentationPage struct {
	Id              int64                  `json:"id" gorm:"primaryKey"`
	Slug            string                 `json:"slug" gorm:"size:191;uniqueIndex;not null"`
	Title           string                 `json:"title" gorm:"size:200;not null"`
	Summary         *string                `json:"summary,omitempty" gorm:"type:text"`
	Content         string                 `json:"content" gorm:"type:text;not null"`
	MetaTitle       *string                `json:"meta_title,omitempty" gorm:"size:120"`
	MetaDescription *string                `json:"meta_description,omitempty" gorm:"size:320"`
	Status          string                 `json:"status" gorm:"size:20;index:idx_documentation_publish;not null"`
	PublishedAt     *time.Time             `json:"published_at,omitempty" gorm:"index:idx_documentation_publish"`
	CategoryId      *int64                 `json:"category_id,omitempty" gorm:"index"`
	Category        *DocumentationCategory `json:"category,omitempty" gorm:"foreignKey:CategoryId"`
	ParentId        *int64                 `json:"parent_id,omitempty" gorm:"index"`
	SortOrder       int                    `json:"sort_order" gorm:"not null"`
	CreatedAt       time.Time              `json:"created_at" gorm:"not null"`
	UpdatedAt       time.Time              `json:"updated_at" gorm:"not null"`
}

func (DocumentationPage) TableName() string {
	return "documentation_pages"
}

type DocumentationSlugRedirect struct {
	Id        int64     `gorm:"primaryKey"`
	OldSlug   string    `gorm:"size:191;uniqueIndex;not null"`
	NewSlug   string    `gorm:"size:191;index;not null"`
	CreatedAt time.Time `gorm:"not null"`
}

func (DocumentationSlugRedirect) TableName() string {
	return "documentation_slug_redirects"
}

type DocumentationSettings struct {
	Id                   int64     `json:"id" gorm:"primaryKey"`
	SiteName             string    `json:"site_name" gorm:"size:200;not null"`
	SiteDescription      string    `json:"site_description" gorm:"type:text;not null"`
	BaseUrl              string    `json:"base_url" gorm:"type:text;not null"`
	InitialContentSeeded bool      `json:"-" gorm:"not null"`
	UpdatedAt            time.Time `json:"updated_at" gorm:"not null"`
}

func (DocumentationSettings) TableName() string {
	return "documentation_settings"
}

type DocumentationCategoryView struct {
	Id          int64   `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
	SortOrder   int     `json:"sort_order"`
}

type DocumentationPageView struct {
	Id              int64                      `json:"id"`
	Slug            string                     `json:"slug"`
	Title           string                     `json:"title"`
	Summary         *string                    `json:"summary,omitempty"`
	Content         string                     `json:"content"`
	MetaTitle       *string                    `json:"meta_title,omitempty"`
	MetaDescription *string                    `json:"meta_description,omitempty"`
	Status          string                     `json:"status"`
	PublishedAt     *time.Time                 `json:"published_at,omitempty"`
	CategoryId      *int64                     `json:"category_id,omitempty"`
	Category        *DocumentationCategoryView `json:"category,omitempty"`
	ParentId        *int64                     `json:"parent_id,omitempty"`
	SortOrder       int                        `json:"sort_order"`
	CreatedAt       time.Time                  `json:"created_at"`
	UpdatedAt       time.Time                  `json:"updated_at"`
}

type DocumentationCategoryWithPagesView struct {
	DocumentationCategoryView
	Pages []*DocumentationPageView `json:"pages"`
}

type DocumentationSettingsView struct {
	Id              int64     `json:"id"`
	SiteName        string    `json:"site_name"`
	SiteDescription string    `json:"site_description"`
	BaseUrl         string    `json:"base_url"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (category *DocumentationCategory) View() *DocumentationCategoryView {
	if category == nil {
		return nil
	}
	return &DocumentationCategoryView{
		Id:          category.Id,
		Name:        category.Name,
		Slug:        category.Slug,
		Description: category.Description,
		SortOrder:   category.SortOrder,
	}
}

func (page *DocumentationPage) View() *DocumentationPageView {
	if page == nil {
		return nil
	}
	return &DocumentationPageView{
		Id:              page.Id,
		Slug:            page.Slug,
		Title:           page.Title,
		Summary:         page.Summary,
		Content:         page.Content,
		MetaTitle:       page.MetaTitle,
		MetaDescription: page.MetaDescription,
		Status:          page.Status,
		PublishedAt:     page.PublishedAt,
		CategoryId:      page.CategoryId,
		Category:        page.Category.View(),
		ParentId:        page.ParentId,
		SortOrder:       page.SortOrder,
		CreatedAt:       page.CreatedAt,
		UpdatedAt:       page.UpdatedAt,
	}
}

func (settings *DocumentationSettings) View() *DocumentationSettingsView {
	if settings == nil {
		return nil
	}
	return &DocumentationSettingsView{
		Id:              settings.Id,
		SiteName:        settings.SiteName,
		SiteDescription: settings.SiteDescription,
		BaseUrl:         settings.BaseUrl,
		UpdatedAt:       settings.UpdatedAt,
	}
}

func MigrateDocumentation(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&DocumentationCategory{},
		&DocumentationPage{},
		&DocumentationSlugRedirect{},
		&DocumentationSettings{},
	); err != nil {
		return err
	}
	return ensureDocumentationSeed(db)
}

func GetDocumentationSettings() (*DocumentationSettingsView, error) {
	var settings DocumentationSettings
	result := DB.Where("id = ?", 1).Limit(1).Find(&settings)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		now := time.Now().UTC()
		settings = DocumentationSettings{
			Id:              1,
			SiteName:        "API 文档",
			SiteDescription: "从注册到第一次 API 调用，清晰完成接入。",
			BaseUrl:         "",
			UpdatedAt:       now,
		}
		if err := DB.Create(&settings).Error; err != nil {
			return nil, err
		}
	}
	return settings.View(), nil
}

func SaveDocumentationSettings(settings *DocumentationSettings) (*DocumentationSettingsView, error) {
	var existing DocumentationSettings
	result := DB.Where("id = ?", 1).Limit(1).Find(&existing)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		existing = DocumentationSettings{Id: 1}
	}
	settings.Id = 1
	settings.InitialContentSeeded = existing.InitialContentSeeded
	settings.UpdatedAt = time.Now().UTC()
	if err := DB.Save(settings).Error; err != nil {
		return nil, err
	}
	return GetDocumentationSettings()
}

func ensureDocumentationSeed(db *gorm.DB) error {
	var settings DocumentationSettings
	result := db.Where("id = ?", 1).Limit(1).Find(&settings)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		now := time.Now().UTC()
		settings = DocumentationSettings{
			Id:              1,
			SiteName:        "API 文档",
			SiteDescription: "从注册到第一次 API 调用，清晰完成接入。",
			UpdatedAt:       now,
		}
		if err := db.Create(&settings).Error; err != nil {
			return err
		}
	}
	if settings.InitialContentSeeded {
		return nil
	}

	var pageCount int64
	if err := db.Model(&DocumentationPage{}).Count(&pageCount).Error; err != nil {
		return err
	}
	if pageCount > 0 {
		return db.Model(&DocumentationSettings{}).Where("id = ?", 1).Update("initial_content_seeded", true).Error
	}

	return db.Transaction(func(tx *gorm.DB) error {
		categoryIds := make(map[string]int64, len(documentationSeedCategories))
		now := time.Now().UTC()
		for _, seed := range documentationSeedCategories {
			category := DocumentationCategory{
				Name:      seed.Name,
				Slug:      seed.Slug,
				SortOrder: seed.SortOrder,
				CreatedAt: now,
				UpdatedAt: now,
			}
			if err := tx.Create(&category).Error; err != nil {
				return err
			}
			categoryIds[seed.Slug] = category.Id
		}
		for _, seed := range documentationSeedPages {
			categoryId := categoryIds[seed.CategorySlug]
			publishedAt := now
			page := DocumentationPage{
				Slug:        seed.Slug,
				Title:       seed.Title,
				Summary:     stringPointer(seed.Summary),
				Content:     seed.Content,
				Status:      DocumentationPageStatusPublished,
				PublishedAt: &publishedAt,
				CategoryId:  &categoryId,
				SortOrder:   seed.SortOrder,
				CreatedAt:   now,
				UpdatedAt:   now,
			}
			if err := tx.Create(&page).Error; err != nil {
				return err
			}
		}
		return tx.Model(&DocumentationSettings{}).Where("id = ?", 1).Updates(map[string]any{
			"initial_content_seeded": true,
			"updated_at":             now,
		}).Error
	})
}

type documentationSeedCategory struct {
	Name      string
	Slug      string
	SortOrder int
}

type documentationSeedPage struct {
	CategorySlug string
	Slug         string
	Title        string
	Summary      string
	Content      string
	SortOrder    int
}

var documentationSeedCategories = []documentationSeedCategory{
	{Name: "快速上手", Slug: "getting-started", SortOrder: 10},
	{Name: "API 参考", Slug: "api", SortOrder: 20},
	{Name: "工具接入", Slug: "tools", SortOrder: 30},
	{Name: "故障排查", Slug: "troubleshooting", SortOrder: 40},
}

var documentationSeedPages = []documentationSeedPage{
	{
		CategorySlug: "getting-started",
		Slug:         "quick-start",
		Title:        "快速开始：5 分钟发出第一个请求",
		Summary:      "注册、创建 API Key，并完成第一次文本调用。",
		SortOrder:    10,
		Content: `# 快速开始：5 分钟发出第一个请求

这份指南只解决一件事：让你从零开始，在几分钟内收到第一条模型回复。

## 第 1 步：注册并登录

打开站点首页，完成注册和登录。如果管理员开启了邀请制，请先准备邀请码。

## 第 2 步：创建 API Key

进入控制台的 **API Key / 令牌** 页面，创建一个新的 Key。

建议每个应用单独使用一个 Key，方便以后查看用量、暂停或重新生成。

> API Key 等同于账户凭证，请不要提交到 GitHub、截图或公开聊天中。

## 第 3 步：确认余额和模型

进入模型广场确认可用模型，再到钱包或用量页面确认余额。模型名称必须以当前模型广场显示的名称为准。

## 第 4 步：发出第一条请求

把下面的 **{{BASE_URL}}** 替换为当前站点地址，把 **YOUR_API_KEY** 替换为你的 Key：

~~~bash
curl {{BASE_URL}}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "YOUR_MODEL_ID",
    "messages": [
      {"role": "user", "content": "你好，请用一句话介绍自己。"}
    ],
    "stream": false
  }'
~~~

如果返回了 **choices** 和 **usage**，说明认证、模型和网关已经全部正常。

## 下一步

- 不了解 Key 怎么传？阅读 [API Key 与认证](/docs/authentication)。
- 想看完整接口？阅读 [API 参考](/docs/api-reference)。
- 想接入客户端？阅读 [工具接入](/docs/tools)。
- 遇到报错？阅读 [错误码与排查](/docs/troubleshooting)。`,
	},
	{
		CategorySlug: "getting-started",
		Slug:         "authentication",
		Title:        "API Key 与认证",
		Summary:      "了解 Base URL、Bearer Token 和密钥安全。",
		SortOrder:    20,
		Content: `# API Key 与认证

所有公开模型接口都使用 HTTP Bearer Token 认证。

## Base URL

统一接口地址是：

~~~text
{{BASE_URL}}/v1
~~~

## Authorization 请求头

~~~http
Authorization: Bearer YOUR_API_KEY
~~~

也可以使用官方 SDK 的 **api_key** 参数。不要把 Key 写死在前端代码中，建议使用环境变量：

~~~bash
export OPENAI_API_KEY="sk-your-api-key"
~~~

## 常见认证问题

| 状态码 | 含义 | 建议 |
| --- | --- | --- |
| **401** | Key 缺失、错误或已失效 | 检查请求头和 Key 是否完整 |
| **403** | 当前账户或分组没有权限 | 检查账户状态、模型权限和分组 |
| **429** | 触发限流 | 降低请求频率，并按响应提示重试 |

> 如果 Key 泄露，请立即在控制台删除旧 Key 并重新创建。`,
	},
	{
		CategorySlug: "api",
		Slug:         "api-reference",
		Title:        "API 参考",
		Summary:      "统一接口的能力地图和调用方向。",
		SortOrder:    10,
		Content: `# API 参考

本系统提供统一的 AI 网关接口。大多数文本客户端可以直接使用 OpenAI 兼容协议，只需要替换 Base URL 和 API Key。

## 文本与多模态

~~~http
POST /v1/chat/completions
~~~

用于文本对话和支持图片输入的多模态对话。

## Responses

~~~http
POST /v1/responses
~~~

适合使用 OpenAI Responses 格式的客户端和 Agent 工作流。

## 图片、音频和视频

常见接口包括：

- **POST /v1/images/generations**
- **POST /v1/audio/speech**
- **POST /v1/audio/transcriptions**
- **POST /v1/videos**

不同模型支持的字段和计费方式可能不同，请以模型广场和实际接口返回为准。

## 模型列表

~~~http
GET /v1/models
~~~

建议在应用启动或配置变更后读取模型列表，不要长期硬编码模型名称。

## 流式响应

文本接口可以通过 **"stream": true** 请求流式响应。客户端需要持续读取 SSE 数据，并在收到结束标记后关闭连接。`,
	},
	{
		CategorySlug: "tools",
		Slug:         "tools",
		Title:        "工具接入",
		Summary:      "用最少配置接入常见客户端和编程工具。",
		SortOrder:    10,
		Content: `# 工具接入

对于支持 OpenAI Compatible 的客户端，通常只需要填写三项：

| 配置项 | 填写内容 |
| --- | --- |
| Base URL | **{{BASE_URL}}/v1** |
| API Key | 控制台创建的 **sk-...** |
| Model | 模型广场中实际可用的模型 ID |

## OpenAI SDK

~~~python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="{{BASE_URL}}/v1",
)

response = client.chat.completions.create(
    model="YOUR_MODEL_ID",
    messages=[{"role": "user", "content": "你好"}],
)
print(response.choices[0].message.content)
~~~

## 客户端排查顺序

1. 确认 Base URL 是否包含 **/v1**。
2. 确认 API Key 没有多余空格或换行。
3. 从模型广场复制准确的模型 ID。
4. 先关闭流式调用，确认普通请求成功后再开启流式。`,
	},
	{
		CategorySlug: "troubleshooting",
		Slug:         "troubleshooting",
		Title:        "错误码与排查",
		Summary:      "按状态码快速判断问题出在认证、限流、余额还是上游。",
		SortOrder:    10,
		Content: `# 错误码与排查

先记录响应状态码、错误消息和请求 ID，再按下面的顺序排查。

## 401 Unauthorized

通常是 API Key 缺失、错误、过期或复制不完整。检查 **Authorization: Bearer ...** 请求头。

## 403 Forbidden

账户可能没有访问当前模型或分组的权限，也可能处于停用状态。请检查控制台中的账户和分组设置。

## 429 Too Many Requests

请求频率超过限制。降低并发，使用指数退避重试，不要立即无间隔地重复请求。

## 402 / 余额不足

检查钱包余额、模型倍率和本次请求的 **max_tokens**、图片数量或视频时长。

## 5xx 上游错误

先确认模型是否仍然可用，再重试一次。如果持续失败，请提供请求 ID、模型名和发生时间给管理员，不要提供 API Key。

## 仍然无法解决

确认网络代理、Base URL、模型名称和请求格式，然后使用 Playground 发起一次最简单的文本请求，帮助区分客户端问题和网关问题。`,
	},
}

func stringPointer(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
