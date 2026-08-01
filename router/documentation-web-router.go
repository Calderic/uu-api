package router

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/service"
)

func SetDocumentationWebRouter(router *gin.Engine) {
	router.GET("/llms.txt", serveDocumentationLLMSIndex)
	router.GET("/llms-full.txt", serveDocumentationLLMSFull)
	router.GET("/docs/llms.txt", serveDocumentationLLMSIndex)
	router.GET("/docs/llms-full.txt", serveDocumentationLLMSFull)
}

func serveDocumentationLLMSIndex(c *gin.Context) {
	serveDocumentationLLMS(c, false)
}

func serveDocumentationLLMSFull(c *gin.Context) {
	serveDocumentationLLMS(c, true)
}

func serveDocumentationLLMS(c *gin.Context, full bool) {
	settings, err := service.GetDocumentationSettings()
	if err != nil {
		common.SysError("failed to load documentation settings for LLM endpoint: " + err.Error())
		c.String(http.StatusInternalServerError, "documentation is temporarily unavailable")
		return
	}

	baseURL := documentationBaseURL(c, settings.BaseUrl)
	var content string
	if full {
		content, err = service.RenderDocumentationLLMSFull(baseURL)
	} else {
		content, err = service.RenderDocumentationLLMSIndex(baseURL)
	}
	if err != nil {
		common.SysError("failed to render documentation for LLM endpoint: " + err.Error())
		c.String(http.StatusInternalServerError, "documentation is temporarily unavailable")
		return
	}

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=60")
	c.String(http.StatusOK, content)
}

func documentationBaseURL(c *gin.Context, configuredBaseURL string) string {
	if strings.TrimSpace(configuredBaseURL) != "" {
		return strings.TrimRight(strings.TrimSpace(configuredBaseURL), "/")
	}

	scheme := c.GetHeader("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}
	}

	host := c.GetHeader("X-Forwarded-Host")
	if host == "" {
		host = c.Request.Host
	}
	return strings.TrimRight(scheme+"://"+host, "/")
}
