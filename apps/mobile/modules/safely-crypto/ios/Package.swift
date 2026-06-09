// swift-tools-version:5.9
import PackageDescription

// Host-only SwiftPM package so the pure crypto core can be unit-tested with
// `swift test` (CommonCrypto is available on macOS). It compiles ONLY
// Pbkdf2Core.swift — SafelyCryptoModule.swift needs ExpoModulesCore and is
// excluded. The real iOS build uses SafelyCrypto.podspec, not this file (the
// podspec's exclude_files keeps this package and Tests/ out of the pod).
let package = Package(
    name: "Pbkdf2Core",
    targets: [
        .target(name: "Pbkdf2Core", path: "Pbkdf2Core"),
        .testTarget(
            name: "Pbkdf2CoreTests",
            dependencies: ["Pbkdf2Core"],
            path: "Tests/Pbkdf2CoreTests"
        ),
    ]
)
