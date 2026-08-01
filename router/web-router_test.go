package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRenderWebIndexPageUsesConfiguredBrandInInitialHTML(t *testing.T) {
	indexPage := []byte(`<!doctype html><head>
<!--runtime-brand:start-->
<title>New API</title>
<!--runtime-brand:end-->
<link rel="icon" href="/favicon.ico">
</head>`)

	rendered, err := renderWebIndexPage(indexPage, webIndexBranding{
		SystemName:   "UUcode",
		Logo:         "https://cdn.example.com/uucode.png",
		SiteURL:      "https://www.uucode.org/",
		CanonicalURL: "https://www.uucode.org/",
	})

	require.NoError(t, err)
	body := string(rendered)
	assert.Contains(t, body, `<title>UUcode</title>`)
	assert.Contains(t, body, `<meta name="application-name" content="UUcode" />`)
	assert.Contains(t, body, `<meta property="og:site_name" content="UUcode" />`)
	assert.Contains(t, body, `<link rel="icon" href="https://cdn.example.com/uucode.png" />`)
	assert.Contains(t, body, `<link rel="shortcut icon" href="https://cdn.example.com/uucode.png" />`)
	assert.Contains(t, body, `<link rel="apple-touch-icon" href="https://cdn.example.com/uucode.png" />`)
	assert.Contains(t, body, `<meta property="og:image" content="https://cdn.example.com/uucode.png" />`)
	assert.Contains(t, body, `<meta name="twitter:image" content="https://cdn.example.com/uucode.png" />`)
	assert.Contains(t, body, `<link rel="icon" href="https://cdn.example.com/uucode.png">`)
	assert.Contains(t, body, `<link rel="canonical" href="https://www.uucode.org" />`)
	assert.Contains(t, body, `"name":"UUcode"`)
	assert.Contains(t, body, `"system_name":"UUcode"`)
	assert.NotContains(t, body, `<title>New API</title>`)
	assert.NotContains(t, body, `/favicon.ico`)
}

func TestRenderWebIndexPageEscapesConfiguredBrand(t *testing.T) {
	indexPage := []byte(runtimeBrandStart + "New API" + runtimeBrandEnd)

	rendered, err := renderWebIndexPage(indexPage, webIndexBranding{
		SystemName:   `UUcode </title><script>alert("x")</script>`,
		Logo:         `https://cdn.example.com/logo.png?size="large"`,
		SiteURL:      "not-a-public-url",
		CanonicalURL: "also-not-a-public-url",
	})

	require.NoError(t, err)
	body := string(rendered)
	assert.NotContains(t, body, `</title><script>alert`)
	assert.Contains(t, body, `UUcode &lt;/title&gt;&lt;script&gt;alert(&#34;x&#34;)&lt;/script&gt;`)
	assert.Contains(t, body, `logo.png?size=&#34;large&#34;`)
	assert.NotContains(t, body, `rel="canonical"`)
	assert.NotContains(t, body, `application/ld+json`)
}

func TestRenderWebIndexPageResolvesRelativeShareImageURL(t *testing.T) {
	rendered, err := renderWebIndexPage(
		[]byte(runtimeBrandStart+"New API"+runtimeBrandEnd),
		webIndexBranding{
			SystemName: "UUcode",
			Logo:       "/uploads/uucode.png",
			SiteURL:    "https://www.uucode.org/app",
		},
	)

	require.NoError(t, err)
	assert.Contains(
		t,
		string(rendered),
		`<meta property="og:image" content="https://www.uucode.org/uploads/uucode.png" />`,
	)
}

func TestDynamicBrandAssetRedirectUsesConfiguredLogo(t *testing.T) {
	previousLogo := common.Logo
	t.Cleanup(func() {
		common.OptionMapRWMutex.Lock()
		common.Logo = previousLogo
		common.OptionMapRWMutex.Unlock()
	})

	common.OptionMapRWMutex.Lock()
	common.Logo = "https://cdn.example.com/uucode.png"
	common.OptionMapRWMutex.Unlock()

	gin.SetMode(gin.TestMode)
	request := httptest.NewRequest(http.MethodGet, faviconPath, nil)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = request

	redirectToConfiguredBrandAsset(context)

	require.Equal(t, http.StatusFound, recorder.Code)
	assert.Equal(t, "https://cdn.example.com/uucode.png", recorder.Header().Get("Location"))
	assert.Equal(t, "public, max-age=300, stale-while-revalidate=86400", recorder.Header().Get("Cache-Control"))
}

func TestDynamicBrandAssetPathsExcludeStaticDefaults(t *testing.T) {
	assert.True(t, isDynamicBrandAssetPath(faviconPath))
	assert.True(t, isDynamicBrandAssetPath(appleTouchIconPath))
	assert.True(t, isDynamicBrandAssetPath(appleTouchIconPrecomposedPath))
	assert.False(t, isDynamicBrandAssetPath("/logo.png"))
}

func TestRenderWebIndexPageRequiresRuntimeBrandMarkers(t *testing.T) {
	_, err := renderWebIndexPage([]byte("<title>New API</title>"), webIndexBranding{
		SystemName: "UUcode",
	})

	require.ErrorContains(t, err, "runtime brand markers are missing")
}
