package router

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestDocumentationBaseURLPrefersConfiguredOrigin(t *testing.T) {
	request := httptest.NewRequest("GET", "https://request.example/llms.txt", nil)
	request.Header.Set("X-Forwarded-Proto", "http")
	request.Header.Set("X-Forwarded-Host", "forwarded.example")
	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = request

	require.Equal(t, "https://docs.example.com", documentationBaseURL(context, "https://docs.example.com/"))
	require.Equal(t, "http://forwarded.example", documentationBaseURL(context, ""))
}
