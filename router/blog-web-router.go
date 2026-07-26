package router

import (
	"bytes"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

var (
	blogMarkdown = goldmark.New(
		goldmark.WithExtensions(extension.GFM),
		goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		goldmark.WithRendererOptions(html.WithHardWraps()),
	)
	blogPageTemplate = template.Must(template.New("blog").Parse(blogHTMLTemplate))
)

type blogPageData struct {
	SiteName        string
	SiteDescription string
	PageTitle       string
	Description     string
	Canonical       string
	OGType          string
	OGImage         string
	StructuredData  template.JS
	Articles        []*model.BlogArticleView
	Article         *model.BlogArticleView
	ArticleHTML     template.HTML
	CTAButtons      []blogCTAButton
	FilterTitle     string
	FilterPath      string
	Page            int
	HasPrevious     bool
	HasNext         bool
	PreviousURL     string
	NextURL         string
	GeneratedAt     time.Time
}

type blogCTAButton struct {
	Text  string
	URL   string
	Style string
}

func SetBlogWebRouter(router *gin.Engine) {
	blog := router.Group("/blog")
	blog.Use(middleware.RouteTag("web"))
	blog.Use(gzip.Gzip(gzip.DefaultCompression))
	blog.Use(middleware.GlobalWebRateLimit())
	{
		blog.GET("", renderBlogIndex)
		blog.GET("/", renderBlogIndex)
		blog.GET("/sitemap.xml", renderBlogSitemap)
		blog.GET("/category/:slug", renderBlogCategory)
		blog.GET("/tag/:slug", renderBlogTag)
		blog.GET("/:slug", renderBlogArticle)
	}
	router.GET("/robots.txt", renderRobots)
}

func renderBlogIndex(c *gin.Context) {
	renderBlogList(c, "", "", "", "/blog")
}

func renderBlogCategory(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	categories, err := service.ListBlogCategories()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	title := slug
	found := false
	for _, category := range categories {
		if category.Slug == slug {
			title = category.Name
			found = true
			break
		}
	}
	if !found {
		c.Status(http.StatusNotFound)
		return
	}
	renderBlogList(c, slug, "", "分类："+title, "/blog/category/"+url.PathEscape(slug))
}

func renderBlogTag(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	tags, err := service.ListBlogTags()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	title := slug
	found := false
	for _, tag := range tags {
		if tag.Slug == slug {
			title = tag.Name
			found = true
			break
		}
	}
	if !found {
		c.Status(http.StatusNotFound)
		return
	}
	renderBlogList(c, "", slug, "标签："+title, "/blog/tag/"+url.PathEscape(slug))
}

func renderBlogList(c *gin.Context, category, tag, filterTitle, filterPath string) {
	settings, err := model.GetBlogSettings()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	page := 1
	if parsed, parseErr := strconv.Atoi(c.Query("page")); parseErr == nil && parsed > 1 {
		page = parsed
	}
	perPage := settings.ArticlesPerPage
	articles, total, err := service.ListPublishedBlogArticles(
		category,
		tag,
		perPage,
		(page-1)*perPage,
	)
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	if page > 1 && len(articles) == 0 {
		c.Status(http.StatusNotFound)
		return
	}

	baseURL := blogBaseURL(c, settings)
	pagePath := filterPath
	if page > 1 {
		pagePath += "?page=" + strconv.Itoa(page)
	}
	title := settings.BlogName
	if filterTitle != "" {
		title = filterTitle + " · " + settings.BlogName
	}
	description := settings.BlogDescription
	if description == "" {
		description = "最新文章、技术实践与产品更新。"
	}
	data := blogPageData{
		SiteName:        settings.BlogName,
		SiteDescription: settings.BlogDescription,
		PageTitle:       title,
		Description:     description,
		Canonical:       baseURL + pagePath,
		OGType:          "website",
		Articles:        articles,
		FilterTitle:     filterTitle,
		FilterPath:      filterPath,
		Page:            page,
		HasPrevious:     page > 1,
		HasNext:         int64(page*perPage) < total,
		GeneratedAt:     time.Now().UTC(),
	}
	if data.HasPrevious {
		data.PreviousURL = blogPageURL(filterPath, page-1)
	}
	if data.HasNext {
		data.NextURL = blogPageURL(filterPath, page+1)
	}
	renderBlogTemplate(c, data)
}

func renderBlogArticle(c *gin.Context) {
	article, redirect, err := service.GetPublishedBlogArticle(c.Param("slug"))
	if err != nil {
		if redirect != "" {
			c.Redirect(http.StatusMovedPermanently, "/blog/"+url.PathEscape(redirect))
			return
		}
		c.Status(http.StatusNotFound)
		return
	}
	settings, err := model.GetBlogSettings()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	var rendered bytes.Buffer
	if err := blogMarkdown.Convert([]byte(article.Content), &rendered); err != nil {
		renderBlogFailure(c, err)
		return
	}
	baseURL := blogBaseURL(c, settings)
	canonical := baseURL + "/blog/" + url.PathEscape(article.Slug)
	if article.CanonicalUrl != nil && strings.TrimSpace(*article.CanonicalUrl) != "" {
		canonical = strings.TrimSpace(*article.CanonicalUrl)
	}
	title := article.Title
	if article.MetaTitle != nil && strings.TrimSpace(*article.MetaTitle) != "" {
		title = strings.TrimSpace(*article.MetaTitle)
	}
	description := ""
	if article.MetaDescription != nil {
		description = strings.TrimSpace(*article.MetaDescription)
	}
	if description == "" && article.Excerpt != nil {
		description = strings.TrimSpace(*article.Excerpt)
	}
	if description == "" {
		description = settings.BlogDescription
	}
	structured := blogStructuredData(article, canonical, settings.BlogName, description)
	structuredJSON, err := common.Marshal(structured)
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	data := blogPageData{
		SiteName:        settings.BlogName,
		SiteDescription: settings.BlogDescription,
		PageTitle:       title,
		Description:     description,
		Canonical:       canonical,
		OGType:          "article",
		StructuredData:  template.JS(structuredJSON),
		Article:         article,
		ArticleHTML:     template.HTML(rendered.String()),
		CTAButtons:      blogCTAButtons(article.CTAConfig, settings.DefaultCTAConfig),
		GeneratedAt:     time.Now().UTC(),
	}
	if article.CoverImageUrl != nil {
		data.OGImage = *article.CoverImageUrl
	}
	renderBlogTemplate(c, data)
}

func renderBlogSitemap(c *gin.Context) {
	settings, err := model.GetBlogSettings()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	articles, err := service.ListPublishedBlogSitemap()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	baseURL := blogBaseURL(c, settings)
	var sitemap strings.Builder
	sitemap.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	sitemap.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)
	sitemap.WriteString("<url><loc>" + template.HTMLEscapeString(baseURL+"/blog") + "</loc></url>")
	for _, article := range articles {
		sitemap.WriteString("<url><loc>")
		sitemap.WriteString(template.HTMLEscapeString(baseURL + "/blog/" + url.PathEscape(article.Slug)))
		sitemap.WriteString("</loc><lastmod>")
		sitemap.WriteString(article.UpdatedAt.UTC().Format(time.RFC3339))
		sitemap.WriteString("</lastmod></url>")
	}
	categories, err := service.ListBlogCategories()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	for _, category := range categories {
		sitemap.WriteString("<url><loc>")
		sitemap.WriteString(template.HTMLEscapeString(baseURL + "/blog/category/" + url.PathEscape(category.Slug)))
		sitemap.WriteString("</loc></url>")
	}
	tags, err := service.ListBlogTags()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	for _, tag := range tags {
		sitemap.WriteString("<url><loc>")
		sitemap.WriteString(template.HTMLEscapeString(baseURL + "/blog/tag/" + url.PathEscape(tag.Slug)))
		sitemap.WriteString("</loc></url>")
	}
	sitemap.WriteString("</urlset>")
	c.Header("Cache-Control", "public, max-age=300")
	c.Data(http.StatusOK, "application/xml; charset=utf-8", []byte(sitemap.String()))
}

func renderRobots(c *gin.Context) {
	settings, err := model.GetBlogSettings()
	if err != nil {
		renderBlogFailure(c, err)
		return
	}
	body := "User-agent: *\nAllow: /\nSitemap: " + blogBaseURL(c, settings) + "/blog/sitemap.xml\n"
	c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte(body))
}

func renderBlogTemplate(c *gin.Context, data blogPageData) {
	var output bytes.Buffer
	if err := blogPageTemplate.Execute(&output, data); err != nil {
		renderBlogFailure(c, err)
		return
	}
	c.Header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	c.Data(http.StatusOK, "text/html; charset=utf-8", output.Bytes())
}

func renderBlogFailure(c *gin.Context, err error) {
	common.SysError("blog request failed: " + err.Error())
	c.Data(http.StatusInternalServerError, "text/plain; charset=utf-8", []byte("Blog is temporarily unavailable."))
}

func blogBaseURL(c *gin.Context, settings *model.BlogSettingsView) string {
	if baseURL := strings.TrimRight(strings.TrimSpace(settings.BaseUrl), "/"); baseURL != "" {
		return baseURL
	}
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if forwarded := strings.TrimSpace(strings.Split(c.GetHeader("X-Forwarded-Proto"), ",")[0]); forwarded != "" {
		scheme = forwarded
	}
	host := c.Request.Host
	if forwarded := strings.TrimSpace(strings.Split(c.GetHeader("X-Forwarded-Host"), ",")[0]); forwarded != "" {
		host = forwarded
	}
	return scheme + "://" + host
}

func blogPageURL(path string, page int) string {
	if page <= 1 {
		return path
	}
	return fmt.Sprintf("%s?page=%d", path, page)
}

func blogCTAButtons(primary, fallback map[string]any) []blogCTAButton {
	buttons := primary["buttons"]
	if list, ok := buttons.([]any); !ok || len(list) == 0 {
		buttons = fallback["buttons"]
	}
	list, ok := buttons.([]any)
	if !ok {
		return nil
	}
	result := make([]blogCTAButton, 0, len(list))
	for _, value := range list {
		button, ok := value.(map[string]any)
		if !ok {
			continue
		}
		position, _ := button["position"].(string)
		if position != "" && position != "bottom" {
			continue
		}
		text, _ := button["text"].(string)
		href, _ := button["url"].(string)
		style, _ := button["style"].(string)
		if strings.TrimSpace(text) == "" || strings.TrimSpace(href) == "" {
			continue
		}
		result = append(result, blogCTAButton{Text: text, URL: href, Style: style})
	}
	return result
}

func blogStructuredData(article *model.BlogArticleView, canonical, siteName, description string) map[string]any {
	articleSchema := map[string]any{
		"@type":         "Article",
		"@id":           canonical + "#article",
		"headline":      article.Title,
		"description":   description,
		"datePublished": article.CreatedAt,
		"dateModified":  article.UpdatedAt,
		"mainEntityOfPage": map[string]any{
			"@type": "WebPage",
			"@id":   canonical,
		},
		"author": map[string]any{
			"@type": "Organization",
			"name":  siteName,
		},
		"publisher": map[string]any{
			"@type": "Organization",
			"name":  siteName,
		},
	}
	if article.PublishedAt != nil {
		articleSchema["datePublished"] = article.PublishedAt
	}
	if article.CoverImageUrl != nil {
		articleSchema["image"] = *article.CoverImageUrl
	}

	graph := []any{articleSchema}
	source := article.StructuredData
	if sourceType, _ := source["@type"].(string); sourceType == "FAQPage" {
		delete(source, "@context")
		graph = append(graph, source)
	} else if rawFAQ, ok := source["faq"].([]any); ok {
		mainEntities := make([]any, 0, len(rawFAQ))
		for _, rawItem := range rawFAQ {
			item, ok := rawItem.(map[string]any)
			if !ok {
				continue
			}
			question, questionOK := item["q"].(string)
			answer, answerOK := item["a"].(string)
			if !questionOK || !answerOK || strings.TrimSpace(question) == "" || strings.TrimSpace(answer) == "" {
				continue
			}
			mainEntities = append(mainEntities, map[string]any{
				"@type": "Question",
				"name":  question,
				"acceptedAnswer": map[string]any{
					"@type": "Answer",
					"text":  answer,
				},
			})
		}
		if len(mainEntities) > 0 {
			graph = append(graph, map[string]any{
				"@type":      "FAQPage",
				"mainEntity": mainEntities,
			})
		}
	}
	return map[string]any{
		"@context": "https://schema.org",
		"@graph":   graph,
	}
}

const blogHTMLTemplate = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{.PageTitle}}</title>
  <meta name="description" content="{{.Description}}">
  <link rel="canonical" href="{{.Canonical}}">
  {{if .PreviousURL}}<link rel="prev" href="{{.PreviousURL}}">{{end}}
  {{if .NextURL}}<link rel="next" href="{{.NextURL}}">{{end}}
  <meta property="og:type" content="{{.OGType}}">
  <meta property="og:title" content="{{.PageTitle}}">
  <meta property="og:description" content="{{.Description}}">
  <meta property="og:url" content="{{.Canonical}}">
  {{if .OGImage}}<meta property="og:image" content="{{.OGImage}}">{{end}}
  <meta name="twitter:card" content="{{if .OGImage}}summary_large_image{{else}}summary{{end}}">
  {{if .StructuredData}}<script type="application/ld+json">{{.StructuredData}}</script>{{end}}
  <style>
    :root{color-scheme:light dark;--bg:#fff;--fg:#161616;--muted:#6b6b6b;--line:#e7e7e7;--card:#fafafa;--accent:#111}
    @media(prefers-color-scheme:dark){:root{--bg:#111;--fg:#eee;--muted:#a0a0a0;--line:#2c2c2c;--card:#181818;--accent:#fff}}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    a{color:inherit}.shell{width:min(100% - 40px,1040px);margin:auto}.top{display:flex;align-items:center;justify-content:space-between;padding:32px 0;border-bottom:1px solid var(--line)}
    .brand{text-decoration:none;font-size:20px;font-weight:720;letter-spacing:-.02em}.top small{color:var(--muted)}main{padding:64px 0 96px}
    .hero{max-width:700px;margin-bottom:48px}.hero h1{font-size:clamp(36px,6vw,64px);line-height:1.08;letter-spacing:-.05em;margin:0 0 16px}.hero p{font-size:18px;color:var(--muted);margin:0}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--card);text-decoration:none;transition:transform .18s,border-color .18s}
    .card:hover{transform:translateY(-2px);border-color:var(--muted)}.cover{aspect-ratio:2/1;width:100%;object-fit:cover;background:var(--line)}.card-body{padding:24px}.eyebrow{display:flex;gap:10px;color:var(--muted);font-size:13px;margin-bottom:10px}
    .card h2{font-size:21px;line-height:1.3;letter-spacing:-.025em;margin:0 0 10px}.card p{color:var(--muted);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .pager{display:flex;justify-content:space-between;margin-top:40px}.pager a{padding:9px 15px;border:1px solid var(--line);border-radius:999px;text-decoration:none}.empty{padding:56px 0;color:var(--muted)}
    .back{display:inline-block;color:var(--muted);text-decoration:none;margin-bottom:32px}.article-head,.article-body,.article-foot{width:min(100%,720px);margin-left:auto;margin-right:auto}.article-head h1{font-size:clamp(34px,6vw,58px);line-height:1.1;letter-spacing:-.045em;margin:12px 0 20px}.lede{font-size:20px;color:var(--muted)}
    .article-cover{display:block;width:min(100%,960px);max-height:560px;object-fit:cover;margin:48px auto;border-radius:20px}.article-body{margin-top:48px;font-size:17px}.article-body h2,.article-body h3{line-height:1.25;letter-spacing:-.025em;margin-top:2em}.article-body h2{font-size:28px}.article-body h3{font-size:22px}
    .article-body img{max-width:100%;height:auto;border-radius:12px}.article-body pre{overflow:auto;padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--card)}.article-body code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em}.article-body :not(pre)>code{padding:.15em .35em;border-radius:5px;background:var(--card)}
    .article-body blockquote{margin:1.5em 0;padding-left:18px;border-left:3px solid var(--line);color:var(--muted)}.article-body table{width:100%;border-collapse:collapse}.article-body th,.article-body td{padding:9px;border:1px solid var(--line);text-align:left}
    .cta{width:min(100%,720px);margin:52px auto 0;padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--card)}.cta strong{display:block;margin-bottom:14px}.actions{display:flex;gap:10px;flex-wrap:wrap}.button{display:inline-flex;padding:9px 16px;border-radius:999px;background:var(--accent);color:var(--bg);text-decoration:none;font-weight:650}.button.outline{background:transparent;color:var(--fg);border:1px solid var(--line)}
    .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:48px;padding-top:28px;border-top:1px solid var(--line)}.tag{padding:5px 11px;border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--muted);font-size:14px}
    footer{border-top:1px solid var(--line);padding:28px 0 48px;color:var(--muted);font-size:13px}@media(max-width:720px){.grid{grid-template-columns:1fr}.top small{display:none}main{padding-top:44px}}
  </style>
</head>
<body>
  <header class="shell top"><a class="brand" href="/blog">{{.SiteName}}</a><small>{{.SiteDescription}}</small></header>
  <main class="shell">
  {{if .Article}}
    <a class="back" href="/blog">← 返回博客</a>
    <article>
      <header class="article-head">
        <div class="eyebrow">{{if .Article.Category}}<a href="/blog/category/{{.Article.Category.Slug}}">{{.Article.Category.Name}}</a>{{end}}{{if .Article.PublishedAt}}<time datetime="{{.Article.PublishedAt.Format "2006-01-02"}}">{{.Article.PublishedAt.Format "2006-01-02"}}</time>{{end}}</div>
        <h1>{{.Article.Title}}</h1>
        {{if .Article.Excerpt}}<p class="lede">{{.Article.Excerpt}}</p>{{end}}
      </header>
      {{if .Article.CoverImageUrl}}<img class="article-cover" src="{{.Article.CoverImageUrl}}" alt="{{.Article.Title}}">{{end}}
      <div class="article-body">{{.ArticleHTML}}</div>
      {{if .CTAButtons}}<aside class="cta"><strong>继续了解</strong><div class="actions">{{range .CTAButtons}}<a class="button {{if eq .Style "outline"}}outline{{end}}" href="{{.URL}}">{{.Text}}</a>{{end}}</div></aside>{{end}}
      {{if .Article.Tags}}<footer class="article-foot tags">{{range .Article.Tags}}<a class="tag" href="/blog/tag/{{.Slug}}">#{{.Name}}</a>{{end}}</footer>{{end}}
    </article>
  {{else}}
    <section class="hero"><h1>{{if .FilterTitle}}{{.FilterTitle}}{{else}}{{.SiteName}}{{end}}</h1><p>{{.Description}}</p></section>
    {{if .Articles}}<section class="grid">{{range .Articles}}<a class="card" href="/blog/{{.Slug}}">{{if .CoverImageUrl}}<img class="cover" src="{{.CoverImageUrl}}" alt="" loading="lazy">{{end}}<div class="card-body"><div class="eyebrow">{{if .Category}}<span>{{.Category.Name}}</span>{{end}}{{if .PublishedAt}}<time>{{.PublishedAt.Format "2006-01-02"}}</time>{{end}}</div><h2>{{.Title}}</h2>{{if .Excerpt}}<p>{{.Excerpt}}</p>{{end}}</div></a>{{end}}</section>{{else}}<p class="empty">暂时没有已发布的文章。</p>{{end}}
    {{if or .HasPrevious .HasNext}}<nav class="pager">{{if .HasPrevious}}<a href="{{.PreviousURL}}">← 上一页</a>{{else}}<span></span>{{end}}{{if .HasNext}}<a href="{{.NextURL}}">下一页 →</a>{{end}}</nav>{{end}}
  {{end}}
  </main>
  <footer><div class="shell">© {{.GeneratedAt.Year}} {{.SiteName}}</div></footer>
</body>
</html>`
