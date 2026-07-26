package router

import (
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-gonic/gin"
)

func registerBlogAPIRoutes(apiRouter *gin.RouterGroup) {
	public := apiRouter.Group("/v1/blog")
	{
		public.GET("/articles", controller.BlogListArticles)
		public.GET("/articles/:slug", controller.BlogGetArticle)
		public.POST("/articles/:slug/view", controller.BlogRecordView)
		public.POST("/articles/:slug/cta-click", controller.BlogRecordCTAClick)
		public.GET("/categories", controller.BlogListCategories)
		public.GET("/tags", controller.BlogListTags)
		public.GET("/sitemap", controller.BlogSitemap)
	}

	admin := apiRouter.Group("/blog/admin")
	admin.Use(middleware.RootAuth())
	{
		admin.GET("/articles", controller.AdminListBlogArticles)
		admin.POST("/articles", controller.AdminCreateBlogArticle)
		admin.GET("/articles/:id", controller.AdminGetBlogArticle)
		admin.PUT("/articles/:id", controller.AdminUpdateBlogArticle)
		admin.PATCH("/articles/:id/status", controller.AdminSetBlogArticleStatus)
		admin.GET("/taxonomy", controller.AdminGetBlogTaxonomy)
		admin.GET("/settings", controller.AdminGetBlogSettings)
		admin.PUT("/settings", controller.AdminUpdateBlogSettings)
	}
}
