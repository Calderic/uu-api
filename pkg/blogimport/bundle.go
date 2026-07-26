package blogimport

import (
	"fmt"
	"io"

	"github.com/QuantumNous/new-api/common"
)

func EncodeBundle(writer io.Writer, bundle *Bundle) error {
	if writer == nil {
		return fmt.Errorf("bundle writer is required")
	}
	if bundle == nil {
		return fmt.Errorf("blog bundle is required")
	}
	data, err := common.Marshal(bundle)
	if err != nil {
		return err
	}
	_, err = writer.Write(data)
	return err
}

func DecodeBundle(reader io.Reader) (*Bundle, error) {
	if reader == nil {
		return nil, fmt.Errorf("bundle reader is required")
	}
	var bundle Bundle
	if err := common.DecodeJson(reader, &bundle); err != nil {
		return nil, err
	}
	return &bundle, nil
}
