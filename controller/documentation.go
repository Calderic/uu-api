package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

func GetDocumentationIndex(c *gin.Context) {
	data, err := service.ListPublishedDocumentation()
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func GetDocumentationPage(c *gin.Context) {
	data, redirect, err := service.GetPublishedDocumentationPage(c.Param("slug"))
	if err != nil {
		if redirect != "" {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data": gin.H{
					"redirect": "/docs/" + redirect,
				},
			})
			return
		}
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func AdminListDocumentationPages(c *gin.Context) {
	limit, offset := blogPagination(c, 20)
	pages, total, err := service.ListAdminDocumentationPages(
		c.Query("search"),
		c.Query("status"),
		limit,
		offset,
	)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pages,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func AdminGetDocumentationPage(c *gin.Context) {
	id, ok := documentationPageId(c)
	if !ok {
		return
	}
	page, err := service.GetAdminDocumentationPage(id)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": page})
}

func AdminCreateDocumentationPage(c *gin.Context) {
	var input service.DocumentationPageInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation page payload"})
		return
	}
	page, err := service.CreateDocumentationPage(input)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": page})
}

func AdminUpdateDocumentationPage(c *gin.Context) {
	id, ok := documentationPageId(c)
	if !ok {
		return
	}
	var input service.DocumentationPageInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation page payload"})
		return
	}
	page, err := service.UpdateDocumentationPage(id, input)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": page})
}

func AdminSetDocumentationPageStatus(c *gin.Context) {
	id, ok := documentationPageId(c)
	if !ok {
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation status payload"})
		return
	}
	page, err := service.SetDocumentationPageStatus(id, strings.TrimSpace(input.Status))
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": page})
}

func AdminDeleteDocumentationPage(c *gin.Context) {
	id, ok := documentationPageId(c)
	if !ok {
		return
	}
	if err := service.DeleteDocumentationPage(id); err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func AdminListDocumentationCategories(c *gin.Context) {
	categories, err := service.ListDocumentationCategories()
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": categories})
}

func AdminCreateDocumentationCategory(c *gin.Context) {
	var input service.DocumentationCategoryInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation category payload"})
		return
	}
	category, err := service.CreateDocumentationCategory(input)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": category})
}

func AdminUpdateDocumentationCategory(c *gin.Context) {
	id, ok := documentationCategoryId(c)
	if !ok {
		return
	}
	var input service.DocumentationCategoryInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation category payload"})
		return
	}
	category, err := service.UpdateDocumentationCategory(id, input)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": category})
}

func AdminDeleteDocumentationCategory(c *gin.Context) {
	id, ok := documentationCategoryId(c)
	if !ok {
		return
	}
	if err := service.DeleteDocumentationCategory(id); err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func AdminGetDocumentationSettings(c *gin.Context) {
	settings, err := service.GetDocumentationSettings()
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": settings})
}

func AdminUpdateDocumentationSettings(c *gin.Context) {
	var input service.DocumentationSettingsInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation settings payload"})
		return
	}
	settings, err := service.UpdateDocumentationSettings(input)
	if err != nil {
		documentationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": settings})
}

func documentationPageId(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation page id"})
		return 0, false
	}
	return id, true
}

func documentationCategoryId(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid documentation category id"})
		return 0, false
	}
	return id, true
}

func documentationError(c *gin.Context, err error) {
	if errors.Is(err, model.ErrDocumentationPageNotFound) || errors.Is(err, model.ErrDocumentationCategoryNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
}
