// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "CountryCodeCore",
    targets: [
        .target(name: "CountryCodeCore", path: "CountryCodeCore"),
        .testTarget(
            name: "CountryCodeCoreTests",
            dependencies: ["CountryCodeCore"],
            path: "Tests/CountryCodeCoreTests"
        ),
    ]
)
