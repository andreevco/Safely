# AccountsApi

All URIs are relative to *http://localhost:8006*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**confirmOnboarding**](AccountsApi.md#confirmonboarding) | **POST** /v1/devices/onboarding/confirm | Confirm onboarding |
| [**createAccount**](AccountsApi.md#createaccount) | **POST** /v1/accounts | Create new account |
| [**getOnboardingMessage**](AccountsApi.md#getonboardingmessage) | **GET** /v1/devices/onboarding/message | Get onboarding message |
| [**postOnboardingMessage**](AccountsApi.md#postonboardingmessage) | **POST** /v1/devices/onboarding/message | Post onboarding message |
| [**removeDeviceFromAccount**](AccountsApi.md#removedevicefromaccount) | **POST** /v1/devices/remove | Remove device from account |



## confirmOnboarding

> confirmOnboarding()

Confirm onboarding

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { ConfirmOnboardingRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  try {
    const data = await api.confirmOnboarding();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | ok |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createAccount

> createAccount(newAccount)

Create new account

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { CreateAccountRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  const body = {
    // NewAccount
    newAccount: ...,
  } satisfies CreateAccountRequest;

  try {
    const data = await api.createAccount(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **newAccount** | [NewAccount](NewAccount.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | ok |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getOnboardingMessage

> OnboardingMessage getOnboardingMessage()

Get onboarding message

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { GetOnboardingMessageRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  try {
    const data = await api.getOnboardingMessage();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**OnboardingMessage**](OnboardingMessage.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | onboarding message |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## postOnboardingMessage

> postOnboardingMessage(onboardingMessage)

Post onboarding message

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { PostOnboardingMessageRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  const body = {
    // OnboardingMessage
    onboardingMessage: ...,
  } satisfies PostOnboardingMessageRequest;

  try {
    const data = await api.postOnboardingMessage(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **onboardingMessage** | [OnboardingMessage](OnboardingMessage.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | ok |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## removeDeviceFromAccount

> removeDeviceFromAccount(deviceToRemove)

Remove device from account

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { RemoveDeviceFromAccountRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  const body = {
    // DeviceToRemove
    deviceToRemove: ...,
  } satisfies RemoveDeviceFromAccountRequest;

  try {
    const data = await api.removeDeviceFromAccount(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **deviceToRemove** | [DeviceToRemove](DeviceToRemove.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | ok |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

