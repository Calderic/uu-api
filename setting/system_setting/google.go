package system_setting

import "github.com/QuantumNous/new-api/setting/config"

type GoogleOAuthSettings struct {
	Enabled      bool   `json:"enabled"`
	ClientId     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

var defaultGoogleOAuthSettings = GoogleOAuthSettings{}

func init() {
	config.GlobalConfig.Register("google", &defaultGoogleOAuthSettings)
}

func GetGoogleOAuthSettings() *GoogleOAuthSettings {
	return &defaultGoogleOAuthSettings
}
