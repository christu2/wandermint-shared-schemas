// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "WanderMintSchemas",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "WanderMintSchemas",
            targets: ["WanderMintSchemas"]
        )
    ],
    targets: [
        .target(
            name: "WanderMintSchemas",
            path: "Sources/WanderMintSchemas"
        )
    ]
)
