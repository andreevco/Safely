
# Snapshot


## Properties

Name | Type
------------ | -------------
`ciphertext` | string
`nonce` | string
`kid` | string
`snapshotProof` | string
`signature` | string

## Example

```typescript
import type { Snapshot } from ''

// TODO: Update the object below with actual values
const example = {
  "ciphertext": null,
  "nonce": null,
  "kid": null,
  "snapshotProof": null,
  "signature": null,
} satisfies Snapshot

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Snapshot
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


