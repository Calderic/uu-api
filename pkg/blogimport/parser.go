package blogimport

import (
	"bufio"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"
)

type Bundle struct {
	Categories  []Category
	Tags        []Tag
	ArticleTags []ArticleTag
	Articles    []Article
	Settings    *Settings
}

type Category struct {
	Id          int64
	Name        string
	Slug        string
	Description *string
	SortOrder   int
	CreatedAt   time.Time
}

type Tag struct {
	Id          int64
	Name        string
	Slug        string
	Description *string
	CreatedAt   time.Time
}

type ArticleTag struct {
	ArticleId int64
	TagId     int64
}

type Article struct {
	Id              int64
	Slug            string
	Title           string
	Content         string
	Excerpt         *string
	CoverImageUrl   *string
	MetaTitle       *string
	MetaDescription *string
	CanonicalUrl    *string
	Status          string
	AuthorId        *string
	PublishedAt     *time.Time
	CTAConfigJSON   string
	StructuredJSON  string
	ViewCount       int
	CTAClickCount   int
	CategoryId      *int64
	SortOrder       int
	IsFeatured      bool
	MetadataJSON    string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type Settings struct {
	BlogName        string
	BlogDescription string
	ArticlesPerPage int
	DefaultCTAJSON  string
	UpdatedAt       time.Time
}

func Parse(reader io.Reader) (*Bundle, error) {
	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 64*1024), 64*1024*1024)
	bundle := &Bundle{}
	activeTable := ""
	lineNumber := 0

	for scanner.Scan() {
		lineNumber++
		line := scanner.Text()
		if strings.HasPrefix(line, "COPY public.") {
			activeTable = copyTableName(line)
			continue
		}
		if activeTable == "" {
			continue
		}
		if line == `\.` {
			activeTable = ""
			continue
		}
		if !supportedTable(activeTable) {
			continue
		}
		fields, err := copyFields(line)
		if err != nil {
			return nil, fmt.Errorf("%s line %d: %w", activeTable, lineNumber, err)
		}
		if err := appendRow(bundle, activeTable, fields); err != nil {
			return nil, fmt.Errorf("%s line %d: %w", activeTable, lineNumber, err)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return bundle, nil
}

func copyTableName(line string) string {
	name := strings.TrimPrefix(line, "COPY public.")
	if index := strings.IndexByte(name, ' '); index >= 0 {
		return name[:index]
	}
	return ""
}

func supportedTable(table string) bool {
	switch table {
	case "article_categories", "article_tag_map", "article_tags", "articles", "blog_settings":
		return true
	default:
		return false
	}
}

func appendRow(bundle *Bundle, table string, fields []*string) error {
	switch table {
	case "article_categories":
		if len(fields) != 6 {
			return fmt.Errorf("expected 6 fields, got %d", len(fields))
		}
		id, err := requiredInt64(fields[0])
		if err != nil {
			return err
		}
		sortOrder, err := requiredInt(fields[4])
		if err != nil {
			return err
		}
		createdAt, err := requiredTime(fields[5])
		if err != nil {
			return err
		}
		bundle.Categories = append(bundle.Categories, Category{
			Id:          id,
			Name:        requiredString(fields[1]),
			Slug:        requiredString(fields[2]),
			Description: fields[3],
			SortOrder:   sortOrder,
			CreatedAt:   createdAt,
		})
	case "article_tags":
		if len(fields) != 5 {
			return fmt.Errorf("expected 5 fields, got %d", len(fields))
		}
		id, err := requiredInt64(fields[0])
		if err != nil {
			return err
		}
		createdAt, err := requiredTime(fields[4])
		if err != nil {
			return err
		}
		bundle.Tags = append(bundle.Tags, Tag{
			Id:          id,
			Name:        requiredString(fields[1]),
			Slug:        requiredString(fields[2]),
			Description: fields[3],
			CreatedAt:   createdAt,
		})
	case "article_tag_map":
		if len(fields) != 2 {
			return fmt.Errorf("expected 2 fields, got %d", len(fields))
		}
		articleId, err := requiredInt64(fields[0])
		if err != nil {
			return err
		}
		tagId, err := requiredInt64(fields[1])
		if err != nil {
			return err
		}
		bundle.ArticleTags = append(bundle.ArticleTags, ArticleTag{ArticleId: articleId, TagId: tagId})
	case "articles":
		return appendArticle(bundle, fields)
	case "blog_settings":
		return appendSettings(bundle, fields)
	}
	return nil
}

func appendArticle(bundle *Bundle, fields []*string) error {
	if len(fields) != 22 {
		return fmt.Errorf("expected 22 fields, got %d", len(fields))
	}
	id, err := requiredInt64(fields[0])
	if err != nil {
		return err
	}
	publishedAt, err := optionalTime(fields[11])
	if err != nil {
		return err
	}
	viewCount, err := requiredInt(fields[14])
	if err != nil {
		return err
	}
	ctaClickCount, err := requiredInt(fields[15])
	if err != nil {
		return err
	}
	categoryId, err := optionalInt64(fields[16])
	if err != nil {
		return err
	}
	sortOrder, err := requiredInt(fields[17])
	if err != nil {
		return err
	}
	isFeatured, err := requiredBool(fields[18])
	if err != nil {
		return err
	}
	createdAt, err := requiredTime(fields[20])
	if err != nil {
		return err
	}
	updatedAt, err := requiredTime(fields[21])
	if err != nil {
		return err
	}
	bundle.Articles = append(bundle.Articles, Article{
		Id:              id,
		Slug:            requiredString(fields[1]),
		Title:           requiredString(fields[2]),
		Content:         requiredString(fields[3]),
		Excerpt:         fields[4],
		CoverImageUrl:   fields[5],
		MetaTitle:       fields[6],
		MetaDescription: fields[7],
		CanonicalUrl:    fields[8],
		Status:          requiredString(fields[9]),
		AuthorId:        fields[10],
		PublishedAt:     publishedAt,
		CTAConfigJSON:   requiredString(fields[12]),
		StructuredJSON:  requiredString(fields[13]),
		ViewCount:       viewCount,
		CTAClickCount:   ctaClickCount,
		CategoryId:      categoryId,
		SortOrder:       sortOrder,
		IsFeatured:      isFeatured,
		MetadataJSON:    requiredString(fields[19]),
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
	})
	return nil
}

func appendSettings(bundle *Bundle, fields []*string) error {
	if len(fields) != 16 {
		return fmt.Errorf("expected 16 fields, got %d", len(fields))
	}
	articlesPerPage, err := requiredInt(fields[3])
	if err != nil {
		return err
	}
	updatedAt, err := requiredTime(fields[15])
	if err != nil {
		return err
	}
	bundle.Settings = &Settings{
		BlogName:        requiredString(fields[1]),
		BlogDescription: requiredString(fields[2]),
		ArticlesPerPage: articlesPerPage,
		DefaultCTAJSON:  requiredString(fields[4]),
		UpdatedAt:       updatedAt,
	}
	return nil
}

func copyFields(line string) ([]*string, error) {
	rawFields := strings.Split(line, "\t")
	fields := make([]*string, 0, len(rawFields))
	for _, raw := range rawFields {
		if raw == `\N` {
			fields = append(fields, nil)
			continue
		}
		decoded, err := decodeCopyText(raw)
		if err != nil {
			return nil, err
		}
		fields = append(fields, &decoded)
	}
	return fields, nil
}

func decodeCopyText(raw string) (string, error) {
	if !strings.Contains(raw, `\`) {
		return raw, nil
	}
	var decoded strings.Builder
	decoded.Grow(len(raw))
	for index := 0; index < len(raw); index++ {
		if raw[index] != '\\' {
			decoded.WriteByte(raw[index])
			continue
		}
		index++
		if index >= len(raw) {
			return "", fmt.Errorf("trailing backslash")
		}
		switch raw[index] {
		case 'b':
			decoded.WriteByte('\b')
		case 'f':
			decoded.WriteByte('\f')
		case 'n':
			decoded.WriteByte('\n')
		case 'r':
			decoded.WriteByte('\r')
		case 't':
			decoded.WriteByte('\t')
		case 'v':
			decoded.WriteByte('\v')
		case '\\':
			decoded.WriteByte('\\')
		case 'x':
			if index+2 >= len(raw) {
				return "", fmt.Errorf("invalid hexadecimal escape")
			}
			value, err := strconv.ParseUint(raw[index+1:index+3], 16, 8)
			if err != nil {
				return "", fmt.Errorf("invalid hexadecimal escape")
			}
			decoded.WriteByte(byte(value))
			index += 2
		default:
			if raw[index] < '0' || raw[index] > '7' {
				decoded.WriteByte(raw[index])
				continue
			}
			end := index + 1
			for end < len(raw) && end < index+3 && raw[end] >= '0' && raw[end] <= '7' {
				end++
			}
			value, err := strconv.ParseUint(raw[index:end], 8, 8)
			if err != nil {
				return "", fmt.Errorf("invalid octal escape")
			}
			decoded.WriteByte(byte(value))
			index = end - 1
		}
	}
	return decoded.String(), nil
}

func requiredString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func requiredInt(value *string) (int, error) {
	if value == nil {
		return 0, fmt.Errorf("integer is null")
	}
	parsed, err := strconv.Atoi(*value)
	if err != nil {
		return 0, fmt.Errorf("invalid integer %q", *value)
	}
	return parsed, nil
}

func requiredInt64(value *string) (int64, error) {
	if value == nil {
		return 0, fmt.Errorf("integer is null")
	}
	parsed, err := strconv.ParseInt(*value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid integer %q", *value)
	}
	return parsed, nil
}

func optionalInt64(value *string) (*int64, error) {
	if value == nil {
		return nil, nil
	}
	parsed, err := requiredInt64(value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func requiredBool(value *string) (bool, error) {
	if value == nil {
		return false, fmt.Errorf("boolean is null")
	}
	switch *value {
	case "t", "true", "1":
		return true, nil
	case "f", "false", "0":
		return false, nil
	default:
		return false, fmt.Errorf("invalid boolean %q", *value)
	}
}

func requiredTime(value *string) (time.Time, error) {
	if value == nil {
		return time.Time{}, fmt.Errorf("timestamp is null")
	}
	for _, layout := range []string{
		"2006-01-02 15:04:05.999999999Z07:00",
		"2006-01-02 15:04:05.999999999Z07",
		"2006-01-02 15:04:05.999999999",
	} {
		parsed, err := time.Parse(layout, *value)
		if err == nil {
			if parsed.Location() == time.Local {
				return parsed.UTC(), nil
			}
			return parsed.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("invalid timestamp %q", *value)
}

func optionalTime(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}
	parsed, err := requiredTime(value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}
