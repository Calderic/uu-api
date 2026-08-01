package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestBlogWebRoutesPreserveIndexedArticleURLs(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open("file:blog-web-routes?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, model.MigrateBlog(db))
	previousDB := model.DB
	model.DB = db
	t.Cleanup(func() {
		model.DB = previousDB
	})
	previousSystemName := common.SystemName
	previousLogo := common.Logo
	t.Cleanup(func() {
		common.OptionMapRWMutex.Lock()
		common.SystemName = previousSystemName
		common.Logo = previousLogo
		common.OptionMapRWMutex.Unlock()
	})
	common.OptionMapRWMutex.Lock()
	common.SystemName = "UUcode"
	common.Logo = "https://cdn.example.com/uucode.png"
	common.OptionMapRWMutex.Unlock()

	now := time.Date(2026, 4, 13, 8, 0, 0, 0, time.UTC)
	require.NoError(t, db.Create(&model.BlogSettings{
		Id:              1,
		BlogName:        "UUcode Blog",
		BlogDescription: "技术文章",
		ArticlesPerPage: 12,
		DefaultCTAJSON:  "{}",
		BaseUrl:         "https://www.uucode.org",
		UpdatedAt:       now,
	}).Error)
	require.NoError(t, db.Create(&model.BlogArticle{
		Slug:           "indexed-slug",
		Title:          "已收录文章",
		Content:        "# 完整正文\n\n服务端 Markdown。",
		Status:         model.BlogArticleStatusPublished,
		PublishedAt:    &now,
		CTAConfigJSON:  "{}",
		StructuredJSON: `{"faq":[{"q":"迁移后 URL 会变吗？","a":"不会。"}]}`,
		MetadataJSON:   "{}",
		CreatedAt:      now,
		UpdatedAt:      now,
	}).Error)
	require.NoError(t, db.Create(&model.BlogArticle{
		Slug:           "draft-slug",
		Title:          "草稿",
		Content:        "不可公开",
		Status:         model.BlogArticleStatusDraft,
		CTAConfigJSON:  "{}",
		StructuredJSON: "{}",
		MetadataJSON:   "{}",
		CreatedAt:      now,
		UpdatedAt:      now,
	}).Error)
	require.NoError(t, db.Create(&model.BlogSlugRedirect{
		OldSlug:   "old-indexed-slug",
		NewSlug:   "indexed-slug",
		CreatedAt: now,
	}).Error)

	engine := gin.New()
	SetBlogWebRouter(engine)

	articleResponse := httptest.NewRecorder()
	engine.ServeHTTP(articleResponse, httptest.NewRequest(http.MethodGet, "/blog/indexed-slug", nil))
	require.Equal(t, http.StatusOK, articleResponse.Code)
	body := articleResponse.Body.String()
	assert.Contains(t, body, "<h1>已收录文章</h1>")
	assert.Contains(t, body, ">完整正文</h1>")
	assert.Contains(t, body, `rel="canonical" href="https://www.uucode.org/blog/indexed-slug"`)
	assert.Contains(t, body, `<link rel="icon" href="https://cdn.example.com/uucode.png">`)
	assert.Contains(t, body, `<meta name="application-name" content="UUcode">`)
	assert.Contains(t, body, `<meta property="og:site_name" content="UUcode">`)
	assert.Contains(t, body, `<meta property="og:image" content="https://cdn.example.com/uucode.png">`)
	assert.Contains(t, body, `type="application/ld+json"`)
	assert.Contains(t, body, `"@type":"FAQPage"`)
	assert.Contains(t, body, `"name":"迁移后 URL 会变吗？"`)

	draftResponse := httptest.NewRecorder()
	engine.ServeHTTP(draftResponse, httptest.NewRequest(http.MethodGet, "/blog/draft-slug", nil))
	assert.Equal(t, http.StatusNotFound, draftResponse.Code)

	redirectResponse := httptest.NewRecorder()
	engine.ServeHTTP(redirectResponse, httptest.NewRequest(http.MethodGet, "/blog/old-indexed-slug", nil))
	assert.Equal(t, http.StatusMovedPermanently, redirectResponse.Code)
	assert.Equal(t, "/blog/indexed-slug", redirectResponse.Header().Get("Location"))

	sitemapResponse := httptest.NewRecorder()
	engine.ServeHTTP(sitemapResponse, httptest.NewRequest(http.MethodGet, "/blog/sitemap.xml", nil))
	require.Equal(t, http.StatusOK, sitemapResponse.Code)
	assert.True(t, strings.Contains(sitemapResponse.Body.String(), "https://www.uucode.org/blog/indexed-slug"))
	assert.False(t, strings.Contains(sitemapResponse.Body.String(), "draft-slug"))
}
