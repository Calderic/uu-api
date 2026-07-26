package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

func BlogListArticles(c *gin.Context) {
	limit, offset := blogPagination(c, 12)
	articles, total, err := service.ListPublishedBlogArticles(
		strings.TrimSpace(c.Query("category")),
		strings.TrimSpace(c.Query("tag")),
		limit,
		offset,
	)
	if err != nil {
		blogError(c, err)
		return
	}
	settings, err := model.GetBlogSettings()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":               articles,
		"default_cta_config": settings.DefaultCTAConfig,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func BlogGetArticle(c *gin.Context) {
	article, redirect, err := service.GetPublishedBlogArticle(c.Param("slug"))
	if err != nil {
		if redirect != "" {
			c.JSON(http.StatusMovedPermanently, gin.H{"redirect": "/blog/" + redirect})
			return
		}
		blogError(c, err)
		return
	}
	settings, err := model.GetBlogSettings()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":               article,
		"default_cta_config": settings.DefaultCTAConfig,
	})
}

func BlogListCategories(c *gin.Context) {
	categories, err := service.ListBlogCategories()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func BlogListTags(c *gin.Context) {
	tags, err := service.ListBlogTags()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

func BlogSitemap(c *gin.Context) {
	articles, err := service.ListPublishedBlogSitemap()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": articles})
}

func BlogRecordView(c *gin.Context) {
	if err := service.RecordBlogView(c.Param("slug")); err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": true})
}

func BlogRecordCTAClick(c *gin.Context) {
	if err := service.RecordBlogCTAClick(c.Param("slug")); err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": true})
}

func AdminListBlogArticles(c *gin.Context) {
	limit, offset := blogPagination(c, 20)
	articles, total, err := service.ListAdminBlogArticles(
		c.Query("search"),
		c.Query("status"),
		limit,
		offset,
	)
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    articles,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func AdminGetBlogArticle(c *gin.Context) {
	id, ok := blogArticleId(c)
	if !ok {
		return
	}
	article, err := service.GetAdminBlogArticle(id)
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": article})
}

func AdminCreateBlogArticle(c *gin.Context) {
	var input service.BlogArticleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid article payload"})
		return
	}
	article, err := service.CreateBlogArticle(input)
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": article})
}

func AdminUpdateBlogArticle(c *gin.Context) {
	id, ok := blogArticleId(c)
	if !ok {
		return
	}
	var input service.BlogArticleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid article payload"})
		return
	}
	article, err := service.UpdateBlogArticle(id, input)
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": article})
}

func AdminSetBlogArticleStatus(c *gin.Context) {
	id, ok := blogArticleId(c)
	if !ok {
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid status payload"})
		return
	}
	article, err := service.SetBlogArticleStatus(id, strings.TrimSpace(input.Status))
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": article})
}

func AdminGetBlogTaxonomy(c *gin.Context) {
	categories, err := service.ListBlogCategories()
	if err != nil {
		blogError(c, err)
		return
	}
	tags, err := service.ListBlogTags()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"categories": categories,
			"tags":       tags,
		},
	})
}

func AdminGetBlogSettings(c *gin.Context) {
	settings, err := model.GetBlogSettings()
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": settings})
}

func AdminUpdateBlogSettings(c *gin.Context) {
	var input service.BlogSettingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid settings payload"})
		return
	}
	settings, err := service.UpdateBlogSettings(input)
	if err != nil {
		blogError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": settings})
}

func blogArticleId(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid article id"})
		return 0, false
	}
	return id, true
}

func blogQueryInt(c *gin.Context, key string, fallback int) int {
	value, err := strconv.Atoi(c.Query(key))
	if err != nil {
		return fallback
	}
	return value
}

func blogPagination(c *gin.Context, defaultLimit int) (int, int) {
	limit := blogQueryInt(c, "limit", defaultLimit)
	if limit < 1 {
		limit = defaultLimit
	}
	if limit > 100 {
		limit = 100
	}
	offset := blogQueryInt(c, "offset", 0)
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

func blogError(c *gin.Context, err error) {
	if errors.Is(err, model.ErrBlogArticleNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "article not found"})
		return
	}
	c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
}
