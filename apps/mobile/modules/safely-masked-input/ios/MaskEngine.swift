import Foundation

enum SegmentCategory: Equatable {
    case integer
    case decimal
    case separator
}

struct StyledSegment {
    let text: String
    let category: SegmentCategory
}

struct MaskResult {
    let formatted: String
    let extracted: String
    let segments: [StyledSegment]
    let cursorPosition: Int
}

class MaskEngine {

    static func apply(rawInput: String, decimals: Int, decimalSeparator: String, rawCursorPosition: Int? = nil) -> MaskResult {
        let sep = decimalSeparator.isEmpty ? "." : decimalSeparator

        var integerDigits = ""
        var decimalDigits = ""
        var hasDecimal = false
        let boundedCursorPosition = rawCursorPosition.map { min(max($0, 0), rawInput.count) }
        var integerDigitsBeforeCursor = 0
        var decimalDigitsBeforeCursor = 0
        var separatorBeforeCursor = false

        for (offset, ch) in rawInput.enumerated() {
            let isBeforeCursor = boundedCursorPosition.map { offset < $0 } ?? false

            if ch.isNumber {
                if hasDecimal {
                    if decimalDigits.count < decimals {
                        decimalDigits.append(ch)
                        if isBeforeCursor { decimalDigitsBeforeCursor += 1 }
                    }
                } else {
                    integerDigits.append(ch)
                    if isBeforeCursor { integerDigitsBeforeCursor += 1 }
                }
            } else if String(ch) == sep && !hasDecimal && decimals > 0 {
                hasDecimal = true
                if isBeforeCursor { separatorBeforeCursor = true }
            }
        }

        let originalIntegerDigitsCount = integerDigits.count
        while integerDigits.count > 1 && integerDigits.hasPrefix("0") {
            integerDigits.removeFirst()
        }
        let removedLeadingZeros = originalIntegerDigitsCount - integerDigits.count

        if hasDecimal && integerDigits.isEmpty {
            integerDigits = "0"
        }

        var formatted = ""
        var segments: [StyledSegment] = []

        if !integerDigits.isEmpty {
            formatted += integerDigits
            segments.append(StyledSegment(text: integerDigits, category: .integer))
        }

        if hasDecimal {
            formatted += sep
            segments.append(StyledSegment(text: sep, category: .separator))
            if !decimalDigits.isEmpty {
                formatted += decimalDigits
                segments.append(StyledSegment(text: decimalDigits, category: .decimal))
            }
        }

        var extracted = integerDigits
        if hasDecimal {
            extracted += sep + decimalDigits
        }

        let cursorPosition: Int
        if boundedCursorPosition == nil {
            cursorPosition = formatted.count
        } else if hasDecimal && separatorBeforeCursor {
            cursorPosition = integerDigits.count + sep.count + decimalDigitsBeforeCursor
        } else {
            cursorPosition = max(integerDigitsBeforeCursor - removedLeadingZeros, 0)
        }

        return MaskResult(formatted: formatted, extracted: extracted, segments: segments, cursorPosition: min(cursorPosition, formatted.count))
    }
}
