import XCTest

@testable import MaskEngine

final class MaskEngineTests: XCTestCase {

    private func mask(_ input: String, decimals: Int = 8, separator: String = ".") -> MaskResult {
        MaskEngine.apply(rawInput: input, decimals: decimals, decimalSeparator: separator)
    }

    func testKeepsDigitsAndDropsEverythingUnrecognized() {
        XCTAssertEqual(mask("123").extracted, "123")
        XCTAssertEqual(mask("1a2b3c").extracted, "123")
        XCTAssertEqual(mask("1 2 3").extracted, "123")
        XCTAssertEqual(mask("").extracted, "")
        XCTAssertEqual(mask("abc").extracted, "")
    }

    func testStripsLeadingZerosButKeepsASingleOne() {
        XCTAssertEqual(mask("0").extracted, "0")
        XCTAssertEqual(mask("007").extracted, "7")
        XCTAssertEqual(mask("00.5").extracted, "0.5")
        XCTAssertEqual(mask("0100").extracted, "100")
    }

    func testPrependsAZeroWhenTheValueStartsWithASeparator() {
        XCTAssertEqual(mask(".").extracted, "0.")
        XCTAssertEqual(mask(".5").extracted, "0.5")
    }

    func testClampsTheFractionToTheAllowedDecimals() {
        XCTAssertEqual(mask("1.2345", decimals: 2).extracted, "1.23")
        XCTAssertEqual(mask("1.2345", decimals: 8).extracted, "1.2345")
        XCTAssertEqual(mask("1.", decimals: 8).extracted, "1.")
    }

    func testIgnoresSeparatorsWhenNoDecimalsAreAllowed() {
        XCTAssertEqual(mask("1.22", decimals: 0).extracted, "122")
        XCTAssertEqual(mask("1,22", decimals: 0).extracted, "122")
    }

    func testAcceptsBothCommonSeparatorsAndEmitsTheConfiguredOne() {
        XCTAssertEqual(mask("1,5", separator: ".").extracted, "1.5")
        XCTAssertEqual(mask("1.5", separator: ".").extracted, "1.5")
        XCTAssertEqual(mask("1.5", separator: ",").extracted, "1,5")
        XCTAssertEqual(mask("1,5", separator: ",").extracted, "1,5")
    }

    func testAcceptsALocaleSeparatorOutsideTheCommonPair() {
        XCTAssertEqual(mask("1٫5", separator: "٫").extracted, "1٫5")
        XCTAssertEqual(mask("1.5", separator: "٫").extracted, "1٫5")
    }

    func testIgnoresARepeatedSeparator() {
        XCTAssertEqual(mask("1.2.3").extracted, "1.23")
        XCTAssertEqual(mask("1,2,3", separator: ",").extracted, "1,23")
    }

    func testClearsTheValueWhenTwoDifferentSeparatorsConflict() {
        XCTAssertEqual(mask("1,234.56").extracted, "")
        XCTAssertEqual(mask("1.234,56").extracted, "")
        XCTAssertEqual(mask("1,234.56", separator: ",").extracted, "")
    }

    func testFormatsForDisplayWithTheConfiguredSeparator() {
        XCTAssertEqual(mask("1,5").formatted, "1.5")
        XCTAssertEqual(mask("1.5", separator: ",").formatted, "1,5")
        XCTAssertEqual(mask("1,234.56").formatted, "")
    }

    func testSplitsTheFormattedValueIntoStyledSegments() {
        let segments = mask("12.34").segments

        XCTAssertEqual(segments.map(\.text), ["12", ".", "34"])
        XCTAssertEqual(segments.map(\.category), [.integer, .separator, .decimal])
        XCTAssertTrue(mask("1,234.56").segments.isEmpty)
    }

    func testMapsRawPositionsOntoTheFormattedValue() {
        XCTAssertEqual(mask("12.34").cursorPosition(forRawCursor: 5), 5)
        XCTAssertEqual(mask("12.34").cursorPosition(forRawCursor: 2), 2)
        XCTAssertEqual(mask("1,234.56").cursorPosition(forRawCursor: 8), 0)
    }
}
