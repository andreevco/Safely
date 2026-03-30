# SnapshotsApi

All URIs are relative to *http://localhost:8006*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getActualSnapshot**](SnapshotsApi.md#getactualsnapshot) | **GET** /v1/snapshots/latest | Get actual snapshot |
| [**getSnapshotProofChain**](SnapshotsApi.md#getsnapshotproofchain) | **GET** /v1/snapshots/{snapshotProof}/proof-chain | Get proof chain for snapshot |
| [**saveSnapshot**](SnapshotsApi.md#savesnapshot) | **POST** /v1/snapshots | Save new snapshot |
| [**subscribeToSnapshots**](SnapshotsApi.md#subscribetosnapshots) | **GET** /v1/snapshots/stream | Subscribe to new snapshots |



## getActualSnapshot

> SnapshotWithProofs getActualSnapshot(withProofChainTo)

Get actual snapshot

### Example

```ts
import {
  Configuration,
  SnapshotsApi,
} from '';
import type { GetActualSnapshotRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SnapshotsApi();

  const body = {
    // string (optional)
    withProofChainTo: withProofChainTo_example,
  } satisfies GetActualSnapshotRequest;

  try {
    const data = await api.getActualSnapshot(body);
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
| **withProofChainTo** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**SnapshotWithProofs**](SnapshotWithProofs.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | actual snapshot |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getSnapshotProofChain

> SnapshotProofChain getSnapshotProofChain(snapshotProof)

Get proof chain for snapshot

### Example

```ts
import {
  Configuration,
  SnapshotsApi,
} from '';
import type { GetSnapshotProofChainRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SnapshotsApi();

  const body = {
    // string
    snapshotProof: snapshotProof_example,
  } satisfies GetSnapshotProofChainRequest;

  try {
    const data = await api.getSnapshotProofChain(body);
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
| **snapshotProof** | `string` |  | [Defaults to `undefined`] |

### Return type

[**SnapshotProofChain**](SnapshotProofChain.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | snapshot proof chain |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## saveSnapshot

> saveSnapshot(snapshot)

Save new snapshot

### Example

```ts
import {
  Configuration,
  SnapshotsApi,
} from '';
import type { SaveSnapshotRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SnapshotsApi();

  const body = {
    // Snapshot
    snapshot: ...,
  } satisfies SaveSnapshotRequest;

  try {
    const data = await api.saveSnapshot(body);
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
| **snapshot** | [Snapshot](Snapshot.md) |  | |

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
| **201** | ok |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## subscribeToSnapshots

> SnapshotStream subscribeToSnapshots(lastEventID)

Subscribe to new snapshots

### Example

```ts
import {
  Configuration,
  SnapshotsApi,
} from '';
import type { SubscribeToSnapshotsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SnapshotsApi();

  const body = {
    // string (optional)
    lastEventID: lastEventID_example,
  } satisfies SubscribeToSnapshotsRequest;

  try {
    const data = await api.subscribeToSnapshots(body);
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
| **lastEventID** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**SnapshotStream**](SnapshotStream.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/event-stream`, `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Stream of snapshots |  -  |
| **0** | Common error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

