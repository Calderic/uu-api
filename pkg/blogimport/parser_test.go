package blogimport

import (
	"bytes"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseExtractsOnlyBlogCopyData(t *testing.T) {
	dump := strings.Join([]string{
		"COPY public.users (id, username) FROM stdin;",
		"1\tignored",
		`\.`,
		"COPY public.article_categories (id, name, slug, description, sort_order, created_at) FROM stdin;",
		"1\t技术\ttech\t\\N\t2\t2026-02-24 04:02:42.651042+00",
		`\.`,
		"COPY public.article_tags (id, name, slug, description, created_at) FROM stdin;",
		"9\tAgent\tagent\t含有\\t制表符\t2026-02-24 04:02:42.651042+00",
		`\.`,
		"COPY public.article_tag_map (article_id, tag_id) FROM stdin;",
		"7\t9",
		`\.`,
		"COPY public.articles (id, slug, title, content, excerpt, cover_image_url, meta_title, meta_description, canonical_url, status, author_id, published_at, cta_config, structured_data, view_count, cta_click_count, category_id, sort_order, is_featured, metadata, created_at, updated_at) FROM stdin;",
		strings.Join([]string{
			"7",
			"kept-slug",
			"标题",
			`第一行\n第二行\\path`,
			"摘要",
			`\N`,
			`\N`,
			"描述",
			`\N`,
			"published",
			"legacy-author",
			"2026-02-25 09:37:54.455012+00",
			`{"buttons":[]}`,
			`{}`,
			"12",
			"3",
			"1",
			"5",
			"t",
			`{"source":"gorouter"}`,
			"2026-02-25 09:37:54.455012+00",
			"2026-02-26 09:37:54.455012+00",
		}, "\t"),
		`\.`,
		"COPY public.blog_settings (id, blog_name, blog_description, articles_per_page, default_cta_config, storage_endpoint, storage_region, storage_bucket, storage_access_key_encrypted, storage_secret_key_encrypted, storage_cdn_base_url, storage_path_prefix, agent_api_enabled, agent_api_rate_limit, agent_api_key_hash, updated_at) FROM stdin;",
		strings.Join([]string{
			"1", "UUcode Blog", "简介", "12", `{}`,
			"", "us-east-1", "", "secret-access", "secret-key", "", "blog",
			"t", "60", "", "2026-04-13 16:02:00.123456+00",
		}, "\t"),
		`\.`,
	}, "\n")

	bundle, err := Parse(strings.NewReader(dump))

	require.NoError(t, err)
	require.Len(t, bundle.Articles, 1)
	assert.Equal(t, "kept-slug", bundle.Articles[0].Slug)
	assert.Equal(t, "第一行\n第二行\\path", bundle.Articles[0].Content)
	assert.Nil(t, bundle.Articles[0].CoverImageUrl)
	assert.Equal(t, 12, bundle.Articles[0].ViewCount)
	assert.True(t, bundle.Articles[0].IsFeatured)
	require.Len(t, bundle.Categories, 1)
	assert.Nil(t, bundle.Categories[0].Description)
	require.Len(t, bundle.Tags, 1)
	assert.Equal(t, "含有\t制表符", *bundle.Tags[0].Description)
	require.NotNil(t, bundle.Settings)
	assert.Equal(t, "UUcode Blog", bundle.Settings.BlogName)
	assert.NotContains(t, bundle.Settings.BlogDescription, "secret")
}

func TestDecodeCopyTextSupportsPostgreSQLEscapes(t *testing.T) {
	decoded, err := decodeCopyText(`a\tb\nc\\d\x21\041`)

	require.NoError(t, err)
	assert.Equal(t, "a\tb\nc\\d!!", decoded)
}

func TestBundleRoundTripPreservesMigrationData(t *testing.T) {
	publishedAt := time.Date(2026, 4, 13, 8, 0, 0, 0, time.UTC)
	original := &Bundle{
		Articles: []Article{{
			Id: 7, Slug: "stable-url", Title: "标题", Content: "# 正文",
			Status: "published", PublishedAt: &publishedAt, CTAConfigJSON: "{}",
			StructuredJSON: "{}", MetadataJSON: "{}", CreatedAt: publishedAt, UpdatedAt: publishedAt,
		}},
		Settings: &Settings{BlogName: "UUcode Blog", ArticlesPerPage: 12, UpdatedAt: publishedAt},
	}
	var encoded bytes.Buffer

	require.NoError(t, EncodeBundle(&encoded, original))
	decoded, err := DecodeBundle(&encoded)

	require.NoError(t, err)
	require.Len(t, decoded.Articles, 1)
	assert.Equal(t, "stable-url", decoded.Articles[0].Slug)
	assert.Equal(t, "# 正文", decoded.Articles[0].Content)
	require.NotNil(t, decoded.Articles[0].PublishedAt)
	assert.True(t, publishedAt.Equal(*decoded.Articles[0].PublishedAt))
	require.NotNil(t, decoded.Settings)
	assert.Equal(t, "UUcode Blog", decoded.Settings.BlogName)
}
