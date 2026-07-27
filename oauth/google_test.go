package oauth

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return f(request)
}

func TestGoogleProviderExchangesCodeAndReadsVerifiedIdentity(t *testing.T) {
	originalSettings := *system_setting.GetGoogleOAuthSettings()
	originalServerAddress := system_setting.ServerAddress
	t.Cleanup(func() {
		*system_setting.GetGoogleOAuthSettings() = originalSettings
		system_setting.ServerAddress = originalServerAddress
	})
	*system_setting.GetGoogleOAuthSettings() = system_setting.GoogleOAuthSettings{
		Enabled:      true,
		ClientId:     "google-client",
		ClientSecret: "google-secret",
	}
	system_setting.ServerAddress = "https://example.com/"

	client := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		responseBody := ""
		switch r.URL.Path {
		case "/token":
			require.NoError(t, r.ParseForm())
			assert.Equal(t, http.MethodPost, r.Method)
			assert.Equal(t, "google-client", r.Form.Get("client_id"))
			assert.Equal(t, "google-secret", r.Form.Get("client_secret"))
			assert.Equal(t, "authorization-code", r.Form.Get("code"))
			assert.Equal(t, "authorization_code", r.Form.Get("grant_type"))
			assert.Equal(t, "https://example.com/oauth/google", r.Form.Get("redirect_uri"))
			responseBody = `{"access_token":"access-token","token_type":"Bearer","expires_in":3600,"scope":"openid email profile","id_token":"id-token"}`
		case "/userinfo":
			assert.Equal(t, "Bearer access-token", r.Header.Get("Authorization"))
			responseBody = `{"sub":"google-user-123","name":"Google User","email":"user@example.com","email_verified":true}`
		default:
			return nil, fmt.Errorf("unexpected request path: %s", r.URL.Path)
		}
		return &http.Response{
			StatusCode: http.StatusOK,
			Header:     http.Header{"Content-Type": []string{"application/json"}},
			Body:       io.NopCloser(strings.NewReader(responseBody)),
		}, nil
	})}

	provider := &GoogleProvider{
		httpClient:       client,
		tokenEndpoint:    "https://google.test/token",
		userInfoEndpoint: "https://google.test/userinfo",
	}
	token, err := provider.ExchangeToken(t.Context(), "authorization-code", nil)
	require.NoError(t, err)
	assert.Equal(t, "access-token", token.AccessToken)
	assert.Equal(t, "id-token", token.IDToken)

	user, err := provider.GetUserInfo(t.Context(), token)
	require.NoError(t, err)
	assert.Equal(t, "google-user-123", user.ProviderUserID)
	assert.Equal(t, "Google User", user.DisplayName)
	assert.Equal(t, "user@example.com", user.Email)
}

func TestGoogleProviderRejectsUnverifiedEmail(t *testing.T) {
	client := &http.Client{Transport: roundTripFunc(func(_ *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusOK,
			Header:     http.Header{"Content-Type": []string{"application/json"}},
			Body: io.NopCloser(strings.NewReader(
				`{"sub":"google-user-123","name":"Google User","email":"user@example.com","email_verified":false}`,
			)),
		}, nil
	})}

	provider := &GoogleProvider{
		httpClient:       client,
		userInfoEndpoint: "https://google.test/userinfo",
	}
	_, err := provider.GetUserInfo(t.Context(), &OAuthToken{AccessToken: "access-token"})
	require.Error(t, err)

	var oauthError *OAuthError
	require.ErrorAs(t, err, &oauthError)
	assert.Equal(t, "oauth.user_info_empty", oauthError.MsgKey)
}
