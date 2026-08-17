#import <Foundation/Foundation.h>
#import <Security/Security.h>

#include <napi.h>

#include <algorithm>
#include <string>
#include <vector>

namespace {

const SecKeyAlgorithm kEciesAlgorithm =
    kSecKeyAlgorithmECIESEncryptionCofactorVariableIVX963SHA256AESGCM;

NSData* TagData(const std::string& tag) {
  return [NSData dataWithBytes:tag.data() length:tag.size()];
}

// kSecUseDataProtectionKeychain is required in every query: without it the same lookup reaches the
// legacy keychain, where an enclave key cannot exist.
NSMutableDictionary* KeyQuery(const std::string& tag) {
  return [@{
    (__bridge id)kSecClass : (__bridge id)kSecClassKey,
    (__bridge id)kSecAttrKeyType : (__bridge id)kSecAttrKeyTypeECSECPrimeRandom,
    (__bridge id)kSecAttrApplicationTag : TagData(tag),
    (__bridge id)kSecUseDataProtectionKeychain : @YES
  } mutableCopy];
}

// No kSecAccessControlUserPresence: an unwrap must not raise a prompt. Adding it here is the whole
// of adding a presence factor.
SecAccessControlRef CreateAccessControl() {
  return SecAccessControlCreateWithFlags(kCFAllocatorDefault,
                                         kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                                         kSecAccessControlPrivateKeyUsage, NULL);
}

NSDictionary* KeyAttributes(SecAccessControlRef access, NSDictionary* privateKeyAttributes) {
  NSMutableDictionary* attributes = [privateKeyAttributes mutableCopy];
  attributes[(__bridge id)kSecAttrAccessControl] = (__bridge id)access;

  return @{
    (__bridge id)kSecAttrKeyType : (__bridge id)kSecAttrKeyTypeECSECPrimeRandom,
    (__bridge id)kSecAttrKeySizeInBits : @256,
    (__bridge id)kSecAttrTokenID : (__bridge id)kSecAttrTokenIDSecureEnclave,
    (__bridge id)kSecUseDataProtectionKeychain : @YES,
    (__bridge id)kSecPrivateKeyAttrs : attributes
  };
}

std::string StatusMessage(const char* operation, OSStatus status) {
  return std::string(operation) + " failed with OSStatus " + std::to_string(status);
}

std::string ErrorMessage(const char* operation, CFErrorRef error) {
  std::string message = std::string(operation) + " failed";

  if (error != NULL) {
    NSString* description = (__bridge_transfer NSString*)CFErrorCopyDescription(error);
    message += ": ";
    message += [description UTF8String];
  }

  return message;
}

SecKeyRef CopyPrivateKey(const std::string& tag, OSStatus* status) {
  NSMutableDictionary* query = KeyQuery(tag);
  query[(__bridge id)kSecReturnRef] = @YES;

  CFTypeRef found = NULL;
  *status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &found);

  return *status == errSecSuccess ? (SecKeyRef)found : NULL;
}

std::string ArgTag(const Napi::CallbackInfo& info) {
  return info[0].As<Napi::String>().Utf8Value();
}

// A throwaway key: this Mac has a Secure Enclave and can create keys in it. Measured, not assumed —
// an unsigned build passes this check, so it says nothing about entitlements.
bool HasSecureEnclave() {
  SecAccessControlRef access = CreateAccessControl();

  if (access == NULL) {
    return false;
  }

  NSDictionary* attributes = KeyAttributes(access, @{(__bridge id)kSecAttrIsPermanent : @NO});
  SecKeyRef key = SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, NULL);

  CFRelease(access);

  if (key == NULL) {
    return false;
  }

  CFRelease(key);

  return true;
}

// The half the enclave probe cannot see. A permanent key lives in the data protection keychain,
// which is reachable only through the access group our provisioning profile grants: without it
// SecItemAdd answers errSecMissingEntitlement (-34018). Reads are no use as a probe — they answer
// errSecItemNotFound either way — so this writes a throwaway item and removes it again.
bool CanUseDataProtectionKeychain() {
  NSDictionary* identity = @{
    (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecUseDataProtectionKeychain : @YES,
    (__bridge id)kSecAttrService : @"com.safely.wallet-desktop.vault.probe",
    (__bridge id)kSecAttrAccount : @"probe"
  };

  NSMutableDictionary* item = [identity mutableCopy];
  item[(__bridge id)kSecAttrAccessible] = (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly;
  item[(__bridge id)kSecValueData] = [NSData dataWithBytes:"\x01" length:1];

  // A previous run that died between add and delete would otherwise fail this one with a duplicate.
  SecItemDelete((__bridge CFDictionaryRef)identity);

  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)item, NULL);

  if (status != errSecSuccess) {
    return false;
  }

  SecItemDelete((__bridge CFDictionaryRef)identity);

  return true;
}

Napi::Value IsAvailable(const Napi::CallbackInfo& info) {
  @autoreleasepool {
    return Napi::Boolean::New(info.Env(), HasSecureEnclave() && CanUseDataProtectionKeychain());
  }
}

Napi::Value EnsureKey(const Napi::CallbackInfo& info) {
  @autoreleasepool {
    Napi::Env env = info.Env();

    if (!info[0].IsString()) {
      Napi::TypeError::New(env, "tag must be a string").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    const std::string tag = ArgTag(info);

    OSStatus status = errSecSuccess;
    SecKeyRef existing = CopyPrivateKey(tag, &status);

    if (existing != NULL) {
      CFRelease(existing);
      return env.Undefined();
    }

    if (status != errSecItemNotFound) {
      Napi::Error::New(env, StatusMessage("SecItemCopyMatching", status))
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    SecAccessControlRef access = CreateAccessControl();

    if (access == NULL) {
      Napi::Error::New(env, "SecAccessControlCreateWithFlags failed")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    NSDictionary* attributes = KeyAttributes(access, @{
      (__bridge id)kSecAttrIsPermanent : @YES,
      (__bridge id)kSecAttrApplicationTag : TagData(tag)
    });

    CFErrorRef error = NULL;
    SecKeyRef created = SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &error);

    CFRelease(access);

    if (created == NULL) {
      Napi::Error::New(env, ErrorMessage("SecKeyCreateRandomKey", error))
          .ThrowAsJavaScriptException();

      if (error != NULL) {
        CFRelease(error);
      }

      return env.Undefined();
    }

    CFRelease(created);

    return env.Undefined();
  }
}

// Encryption uses the public half only: no hardware, no prompt, and it is called once per vault.
Napi::Value Seal(const Napi::CallbackInfo& info) {
  @autoreleasepool {
    Napi::Env env = info.Env();

    if (!info[0].IsString() || !info[1].IsBuffer()) {
      Napi::TypeError::New(env, "seal(tag: string, data: Buffer)").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    const std::string tag = ArgTag(info);
    Napi::Buffer<uint8_t> data = info[1].As<Napi::Buffer<uint8_t>>();

    OSStatus status = errSecSuccess;
    SecKeyRef privateKey = CopyPrivateKey(tag, &status);

    if (privateKey == NULL) {
      Napi::Error::New(env, StatusMessage("SecItemCopyMatching", status))
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    SecKeyRef publicKey = SecKeyCopyPublicKey(privateKey);
    CFRelease(privateKey);

    if (publicKey == NULL) {
      Napi::Error::New(env, "SecKeyCopyPublicKey failed").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    NSData* plaintext = [NSData dataWithBytes:data.Data() length:data.Length()];
    CFErrorRef error = NULL;
    CFDataRef sealed = SecKeyCreateEncryptedData(publicKey, kEciesAlgorithm,
                                                 (__bridge CFDataRef)plaintext, &error);

    CFRelease(publicKey);

    if (sealed == NULL) {
      Napi::Error::New(env, ErrorMessage("SecKeyCreateEncryptedData", error))
          .ThrowAsJavaScriptException();

      if (error != NULL) {
        CFRelease(error);
      }

      return env.Undefined();
    }

    Napi::Buffer<uint8_t> result =
        Napi::Buffer<uint8_t>::Copy(env, CFDataGetBytePtr(sealed), CFDataGetLength(sealed));

    CFRelease(sealed);

    return result;
  }
}

Napi::Value Destroy(const Napi::CallbackInfo& info) {
  @autoreleasepool {
    Napi::Env env = info.Env();

    if (!info[0].IsString()) {
      Napi::TypeError::New(env, "tag must be a string").ThrowAsJavaScriptException();
      return env.Undefined();
    }

    NSMutableDictionary* query = KeyQuery(ArgTag(info));
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);

    if (status != errSecSuccess && status != errSecItemNotFound) {
      Napi::Error::New(env, StatusMessage("SecItemDelete", status)).ThrowAsJavaScriptException();
    }

    return env.Undefined();
  }
}

// The only call that reaches the enclave, and the only one on the hot path: it runs off the main
// thread so a store read does not stall the Electron main loop for the length of an ECDH.
class OpenWorker : public Napi::AsyncWorker {
 public:
  OpenWorker(Napi::Env env, std::string tag, std::vector<uint8_t> blob)
      : Napi::AsyncWorker(env),
        deferred_(Napi::Promise::Deferred::New(env)),
        tag_(std::move(tag)),
        blob_(std::move(blob)) {}

  Napi::Promise Promise() { return deferred_.Promise(); }

  void Execute() override {
    @autoreleasepool {
      OSStatus status = errSecSuccess;
      SecKeyRef privateKey = CopyPrivateKey(tag_, &status);

      if (privateKey == NULL) {
        SetError(StatusMessage("SecItemCopyMatching", status));
        return;
      }

      NSData* blob = [NSData dataWithBytes:blob_.data() length:blob_.size()];
      CFErrorRef error = NULL;
      CFDataRef opened = SecKeyCreateDecryptedData(privateKey, kEciesAlgorithm,
                                                   (__bridge CFDataRef)blob, &error);

      CFRelease(privateKey);

      if (opened == NULL) {
        SetError(ErrorMessage("SecKeyCreateDecryptedData", error));

        if (error != NULL) {
          CFRelease(error);
        }

        return;
      }

      const uint8_t* bytes = CFDataGetBytePtr(opened);
      result_.assign(bytes, bytes + CFDataGetLength(opened));

      CFRelease(opened);
    }
  }

  void OnOK() override {
    Napi::Env env = Env();
    Napi::HandleScope scope(env);

    deferred_.Resolve(Napi::Buffer<uint8_t>::Copy(env, result_.data(), result_.size()));

    // The unwrapped key must not outlive the call that asked for it.
    std::fill(result_.begin(), result_.end(), 0);
  }

  void OnError(const Napi::Error& error) override {
    Napi::HandleScope scope(Env());

    deferred_.Reject(error.Value());
  }

 private:
  Napi::Promise::Deferred deferred_;
  std::string tag_;
  std::vector<uint8_t> blob_;
  std::vector<uint8_t> result_;
};

Napi::Value Open(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!info[0].IsString() || !info[1].IsBuffer()) {
    Napi::TypeError::New(env, "open(tag: string, blob: Buffer)").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Napi::Buffer<uint8_t> blob = info[1].As<Napi::Buffer<uint8_t>>();
  OpenWorker* worker = new OpenWorker(env, ArgTag(info),
                                      std::vector<uint8_t>(blob.Data(), blob.Data() + blob.Length()));

  worker->Queue();

  return worker->Promise();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("isAvailable", Napi::Function::New(env, IsAvailable));
  exports.Set("ensureKey", Napi::Function::New(env, EnsureKey));
  exports.Set("seal", Napi::Function::New(env, Seal));
  exports.Set("open", Napi::Function::New(env, Open));
  exports.Set("destroy", Napi::Function::New(env, Destroy));

  return exports;
}

}  // namespace

NODE_API_MODULE(hardware_key, Init)
