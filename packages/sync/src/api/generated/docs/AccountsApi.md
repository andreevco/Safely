# AccountsApi

All URIs are relative to *http://localhost:8006*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**acceptOnboarding**](AccountsApi.md#acceptonboarding) | **POST** /v1/device/onboarding/accept | Get onboarding message and accept it |
| [**createAccount**](AccountsApi.md#createaccount) | **POST** /v1/accounts | Create new account |
| [**removeDeviceFromAccount**](AccountsApi.md#removedevicefromaccount) | **POST** /v1/devices/remove | Remove device from account |
| [**toOnboardNewDevice**](AccountsApi.md#toonboardnewdevice) | **POST** /v1/devices/onboardings | To onboard a new device |



## acceptOnboarding

> OnboardingMessage acceptOnboarding()

Get onboarding message and accept it

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { AcceptOnboardingRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  try {
    const data = await api.acceptOnboarding();
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


## toOnboardNewDevice

> toOnboardNewDevice(onboardingMessage)

To onboard a new device

### Example

```ts
import {
  Configuration,
  AccountsApi,
} from '';
import type { ToOnboardNewDeviceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountsApi();

  const body = {
    // OnboardingMessage
    onboardingMessage: ...,
  } satisfies ToOnboardNewDeviceRequest;

  try {
    const data = await api.toOnboardNewDevice(body);
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

