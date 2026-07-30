import XCTest

@testable import CountryCodeCore

final class CountryCodeCoreTests: XCTestCase {
    func testKnownMappings() {
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("USA"), "US")
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("GBR"), "GB")
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("DEU"), "DE")
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("RUS"), "RU")
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("JPN"), "JP")
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("ARE"), "AE")
    }

    func testCaseInsensitiveInput() {
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("usa"), "US")
        XCTAssertEqual(CountryCode.alpha3ToAlpha2("uSa"), "US")
    }

    func testUnknownReturnsNil() {
        XCTAssertNil(CountryCode.alpha3ToAlpha2("ZZZ"))
        XCTAssertNil(CountryCode.alpha3ToAlpha2(""))
    }

    func testEveryEntryIsWellFormed() {
        for (alpha3, alpha2) in CountryCode.alpha3Map {
            XCTAssertEqual(alpha3.count, 3, "key \(alpha3) is not 3 letters")
            XCTAssertEqual(alpha2.count, 2, "value \(alpha2) is not 2 letters")
            XCTAssertEqual(alpha3, alpha3.uppercased(), "key \(alpha3) not uppercase")
            XCTAssertEqual(alpha2, alpha2.uppercased(), "value \(alpha2) not uppercase")
        }
    }

    func testCoversAllAssignedCodes() {
        XCTAssertEqual(CountryCode.alpha3Map.count, 250)
    }
}
