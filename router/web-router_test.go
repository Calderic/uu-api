package router

import (
	"testing"

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

func TestRenderWebIndexPageRequiresRuntimeBrandMarkers(t *testing.T) {
	_, err := renderWebIndexPage([]byte("<title>New API</title>"), webIndexBranding{
		SystemName: "UUcode",
	})

	require.ErrorContains(t, err, "runtime brand markers are missing")
}
