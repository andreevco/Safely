// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "MaskEngine",
    targets: [
        .target(name: "MaskEngine", path: ".", sources: ["MaskEngine.swift"]),
        .testTarget(
            name: "MaskEngineTests",
            dependencies: ["MaskEngine"],
            path: "Tests/MaskEngineTests"
        ),
    ]
)
