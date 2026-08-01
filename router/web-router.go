package router

import (
	"bytes"
	"embed"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

const (
	runtimeBrandStart = "<!--runtime-brand:start-->"
	runtimeBrandEnd   = "<!--runtime-brand:end-->"
)

const (
	faviconPath                   = "/favicon.ico"
	appleTouchIconPath            = "/apple-touch-icon.png"
	appleTouchIconPrecomposedPath = "/apple-touch-icon-precomposed.png"
)

// WebAssets holds the embedded dashboard frontend assets.
type WebAssets struct {
	BuildFS   embed.FS
	IndexPage []byte
}

type webIndexBranding struct {
	SystemName   string
	Logo         string
	SiteURL      string
	CanonicalURL string
}

type publicSystemConfig struct {
	SystemName string `json:"system_name"`
	Logo       string `json:"logo"`
}

func normalizePublicURL(value string) string {
	value = strings.TrimRight(strings.TrimSpace(value), "/")
	parsed, err := url.Parse(value)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return ""
	}
	return value
}

func normalizeLogoURL(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "/logo.png"
	}
	return value
}

func resolvePublicAssetURL(siteURL string, assetURL string) string {
	assetURL = strings.TrimSpace(assetURL)
	if assetURL == "" {
		return ""
	}

	parsedAssetURL, err := url.Parse(assetURL)
	if err != nil || parsedAssetURL.IsAbs() {
		return assetURL
	}

	baseURL := normalizePublicURL(siteURL)
	if baseURL == "" {
		return assetURL
	}
	parsedBaseURL, err := url.Parse(baseURL + "/")
	if err != nil {
		return assetURL
	}
	return parsedBaseURL.ResolveReference(parsedAssetURL).String()
}

func renderWebIndexPage(indexPage []byte, branding webIndexBranding) ([]byte, error) {
	systemName := strings.TrimSpace(branding.SystemName)
	if systemName == "" {
		systemName = "New API"
	}
	logo := normalizeLogoURL(branding.Logo)

	publicConfigJSON, err := common.Marshal(publicSystemConfig{
		SystemName: systemName,
		Logo:       logo,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal public system config: %w", err)
	}

	escapedName := html.EscapeString(systemName)
	escapedLogo := html.EscapeString(logo)
	siteURL := normalizePublicURL(branding.SiteURL)
	canonicalURL := normalizePublicURL(branding.CanonicalURL)
	shareImageURL := html.EscapeString(resolvePublicAssetURL(siteURL, logo))

	var brandHead strings.Builder
	brandHead.WriteString(runtimeBrandStart)
	brandHead.WriteString("\n    <link rel=\"icon\" href=\"")
	brandHead.WriteString(escapedLogo)
	brandHead.WriteString("\" />\n    <link rel=\"shortcut icon\" href=\"")
	brandHead.WriteString(escapedLogo)
	brandHead.WriteString("\" />\n    <link rel=\"apple-touch-icon\" href=\"")
	brandHead.WriteString(escapedLogo)
	brandHead.WriteString("\" />\n    <title>")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("</title>\n    <meta name=\"title\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta name=\"application-name\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta name=\"apple-mobile-web-app-title\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta property=\"og:type\" content=\"website\" />\n    <meta property=\"og:title\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta property=\"og:site_name\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta property=\"og:image\" content=\"")
	brandHead.WriteString(shareImageURL)
	brandHead.WriteString("\" />\n    <meta property=\"og:image:alt\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta name=\"twitter:card\" content=\"summary\" />\n    <meta name=\"twitter:title\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n    <meta name=\"twitter:image\" content=\"")
	brandHead.WriteString(shareImageURL)
	brandHead.WriteString("\" />\n    <meta name=\"twitter:image:alt\" content=\"")
	brandHead.WriteString(escapedName)
	brandHead.WriteString("\" />\n")
	if canonicalURL != "" {
		brandHead.WriteString("    <link rel=\"canonical\" href=\"")
		brandHead.WriteString(html.EscapeString(canonicalURL))
		brandHead.WriteString("\" />\n")
	}
	if siteURL != "" {
		structuredDataJSON, marshalErr := common.Marshal(map[string]string{
			"@context": "https://schema.org",
			"@type":    "WebSite",
			"name":     systemName,
			"url":      siteURL,
		})
		if marshalErr != nil {
			return nil, fmt.Errorf("marshal website structured data: %w", marshalErr)
		}
		brandHead.WriteString("    <script type=\"application/ld+json\">")
		brandHead.Write(structuredDataJSON)
		brandHead.WriteString("</script>\n")
	}
	brandHead.WriteString("    <script id=\"public-system-config\" type=\"application/json\">")
	brandHead.Write(publicConfigJSON)
	brandHead.WriteString("</script>\n    ")
	brandHead.WriteString(runtimeBrandEnd)

	start := bytes.Index(indexPage, []byte(runtimeBrandStart))
	end := bytes.Index(indexPage, []byte(runtimeBrandEnd))
	if start < 0 || end < start {
		return nil, fmt.Errorf("runtime brand markers are missing from web index")
	}
	end += len(runtimeBrandEnd)

	rendered := make([]byte, 0, len(indexPage)+brandHead.Len())
	rendered = append(rendered, indexPage[:start]...)
	rendered = append(rendered, brandHead.String()...)
	rendered = append(rendered, indexPage[end:]...)
	rendered = bytes.ReplaceAll(
		rendered,
		[]byte(`<link rel="icon" href="/favicon.ico">`),
		[]byte(`<link rel="icon" href="`+escapedLogo+`">`),
	)
	return rendered, nil
}

func isDynamicBrandAssetPath(path string) bool {
	switch path {
	case faviconPath, appleTouchIconPath, appleTouchIconPrecomposedPath:
		return true
	default:
		return false
	}
}

func redirectToConfiguredBrandAsset(c *gin.Context) {
	common.OptionMapRWMutex.RLock()
	logo := normalizeLogoURL(common.Logo)
	common.OptionMapRWMutex.RUnlock()

	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Redirect(http.StatusFound, logo)
}

func SetWebRouter(router *gin.Engine, assets WebAssets) {
	frontendFS := common.EmbedFolder(assets.BuildFS, "web/dist")
	staticHandler := static.Serve("/", frontendFS)

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(func(c *gin.Context) {
		if isDynamicBrandAssetPath(c.Request.URL.Path) {
			return
		}
		staticHandler(c)
	})
	router.GET(faviconPath, redirectToConfiguredBrandAsset)
	router.GET(appleTouchIconPath, redirectToConfiguredBrandAsset)
	router.GET(appleTouchIconPrecomposedPath, redirectToConfiguredBrandAsset)
	router.HEAD(faviconPath, redirectToConfiguredBrandAsset)
	router.HEAD(appleTouchIconPath, redirectToConfiguredBrandAsset)
	router.HEAD(appleTouchIconPrecomposedPath, redirectToConfiguredBrandAsset)
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}

		common.OptionMapRWMutex.RLock()
		siteURL := strings.TrimRight(system_setting.ServerAddress, "/")
		canonicalURL := siteURL
		if path := c.Request.URL.EscapedPath(); path != "" && path != "/" && path != "/index.html" {
			canonicalURL += path
		}
		branding := webIndexBranding{
			SystemName:   common.SystemName,
			Logo:         common.Logo,
			SiteURL:      siteURL,
			CanonicalURL: canonicalURL,
		}
		common.OptionMapRWMutex.RUnlock()

		indexPage, err := renderWebIndexPage(assets.IndexPage, branding)
		if err != nil {
			common.SysError("failed to render web index: " + err.Error())
			c.Data(http.StatusInternalServerError, "text/plain; charset=utf-8", []byte("Web interface is temporarily unavailable."))
			return
		}
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
