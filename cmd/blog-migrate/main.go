package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/pkg/blogimport"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	source := flag.String("source", "", "path to the GoRouter PostgreSQL dump")
	bundleIn := flag.String("bundle-in", "", "path to a previously exported compact blog bundle")
	bundleOut := flag.String("bundle-out", "", "write the parsed blog data to a compact bundle")
	driver := flag.String("driver", "sqlite", "target database driver: sqlite, postgres, or mysql")
	target := flag.String("target", "one-api.db", "SQLite path or database DSN")
	baseURL := flag.String("base-url", "", "canonical public site URL, for example https://www.example.com")
	overwrite := flag.Bool("overwrite", false, "update blog records that already have the same slug")
	noBackup := flag.Bool("no-backup", false, "skip the automatic SQLite backup")
	dryRun := flag.Bool("dry-run", false, "parse and validate the dump without changing the target database")
	flag.Parse()

	sourcePath := strings.TrimSpace(*source)
	bundlePath := strings.TrimSpace(*bundleIn)
	if (sourcePath == "") == (bundlePath == "") {
		fatalf("exactly one of -source or -bundle-in is required")
	}
	inputPath := sourcePath
	if inputPath == "" {
		inputPath = bundlePath
	}
	sourceFile, err := os.Open(inputPath)
	if err != nil {
		fatalf("open blog source: %v", err)
	}
	defer sourceFile.Close()

	startedAt := time.Now()
	var bundle *blogimport.Bundle
	if sourcePath != "" {
		bundle, err = blogimport.Parse(sourceFile)
	} else {
		bundle, err = blogimport.DecodeBundle(sourceFile)
	}
	if err != nil {
		fatalf("read blog source: %v", err)
	}
	fmt.Printf(
		"Loaded %d articles, %d categories, %d tags, and %d article-tag links in %s.\n",
		len(bundle.Articles),
		len(bundle.Categories),
		len(bundle.Tags),
		len(bundle.ArticleTags),
		time.Since(startedAt).Round(time.Millisecond),
	)
	if outputPath := strings.TrimSpace(*bundleOut); outputPath != "" {
		output, err := os.OpenFile(outputPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
		if err != nil {
			fatalf("create blog bundle: %v", err)
		}
		encodeErr := blogimport.EncodeBundle(output, bundle)
		closeErr := output.Close()
		if encodeErr != nil {
			fatalf("write blog bundle: %v", encodeErr)
		}
		if closeErr != nil {
			fatalf("close blog bundle: %v", closeErr)
		}
		fmt.Printf("Created compact blog bundle: %s\n", outputPath)
	}
	if *dryRun {
		return
	}

	if *driver == "sqlite" && !*noBackup {
		backupPath, err := backupSQLite(*target)
		if err != nil {
			fatalf("back up target database: %v", err)
		}
		if backupPath != "" {
			fmt.Printf("Created database backup: %s\n", backupPath)
		}
	}
	db, err := openDatabase(*driver, *target)
	if err != nil {
		fatalf("open target database: %v", err)
	}
	report, err := blogimport.Import(db, bundle, blogimport.ImportOptions{
		BaseURL:   *baseURL,
		Overwrite: *overwrite,
	})
	if err != nil {
		fatalf("import blog: %v", err)
	}
	fmt.Printf(
		"Imported %d articles (%d updated, %d skipped), %d categories, %d tags, and %d article-tag links.\n",
		report.ArticlesImported,
		report.ArticlesUpdated,
		report.ArticlesSkipped,
		report.CategoriesImported,
		report.TagsImported,
		report.ArticleTagsLinked,
	)
}

func openDatabase(driver, target string) (*gorm.DB, error) {
	config := &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)}
	switch strings.ToLower(strings.TrimSpace(driver)) {
	case "sqlite":
		return gorm.Open(sqlite.Open(target), config)
	case "postgres", "postgresql":
		return gorm.Open(postgres.New(postgres.Config{
			DSN:                  target,
			PreferSimpleProtocol: true,
		}), config)
	case "mysql":
		if !strings.Contains(target, "parseTime") {
			separator := "?"
			if strings.Contains(target, "?") {
				separator = "&"
			}
			target += separator + "parseTime=true"
		}
		return gorm.Open(mysql.Open(target), config)
	default:
		return nil, fmt.Errorf("unsupported driver %q", driver)
	}
}

func backupSQLite(target string) (string, error) {
	info, err := os.Stat(target)
	if os.IsNotExist(err) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	if !info.Mode().IsRegular() {
		return "", fmt.Errorf("target is not a regular file")
	}
	source, err := os.Open(target)
	if err != nil {
		return "", err
	}
	defer source.Close()

	backupPath := target + ".pre-blog-" + time.Now().Format("20060102-150405") + ".bak"
	backup, err := os.OpenFile(backupPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, info.Mode().Perm())
	if err != nil {
		return "", err
	}
	_, copyErr := io.Copy(backup, source)
	closeErr := backup.Close()
	if copyErr != nil {
		return "", copyErr
	}
	if closeErr != nil {
		return "", closeErr
	}
	absolutePath, err := filepath.Abs(backupPath)
	if err != nil {
		return backupPath, nil
	}
	return absolutePath, nil
}

func fatalf(format string, values ...any) {
	fmt.Fprintf(os.Stderr, "blog-migrate: "+format+"\n", values...)
	os.Exit(1)
}
