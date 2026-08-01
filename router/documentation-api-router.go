package router

import (
	"github.com/gin-gonic/gin"

	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
)

func registerDocumentationAPIRoutes(apiRouter *gin.RouterGroup) {
	documentationRouter := apiRouter.Group("/docs")
	documentationRouter.GET("", controller.GetDocumentationIndex)
	documentationRouter.GET("/pages/:slug", controller.GetDocumentationPage)

	adminRouter := documentationRouter.Group("/admin")
	adminRouter.Use(middleware.RootAuth())
	{
		adminRouter.GET("/pages", controller.AdminListDocumentationPages)
		adminRouter.POST("/pages", controller.AdminCreateDocumentationPage)
		adminRouter.GET("/pages/:id", controller.AdminGetDocumentationPage)
		adminRouter.PUT("/pages/:id", controller.AdminUpdateDocumentationPage)
		adminRouter.PATCH("/pages/:id/status", controller.AdminSetDocumentationPageStatus)
		adminRouter.DELETE("/pages/:id", controller.AdminDeleteDocumentationPage)

		adminRouter.GET("/categories", controller.AdminListDocumentationCategories)
		adminRouter.POST("/categories", controller.AdminCreateDocumentationCategory)
		adminRouter.PUT("/categories/:id", controller.AdminUpdateDocumentationCategory)
		adminRouter.DELETE("/categories/:id", controller.AdminDeleteDocumentationCategory)

		adminRouter.GET("/settings", controller.AdminGetDocumentationSettings)
		adminRouter.PUT("/settings", controller.AdminUpdateDocumentationSettings)
	}
}
