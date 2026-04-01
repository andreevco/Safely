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

    static func apply(rawInput: String, decimals: Int, decimalSeparator: String) -> MaskResult {
        let sep = decimalSeparator.isEmpty ? "." : decimalSeparator

        var integerDigits = ""
        var decimalDigits = ""
        var hasDecimal = false

        for ch in rawInput {
            if ch.isNumber {
                if hasDecimal {
                    if decimalDigits.count < decimals { decimalDigits.append(ch) }
                } else {
                    integerDigits.append(ch)
                }
            } else if String(ch) == sep && !hasDecimal && decimals > 0 {
                hasDecimal = true
            }
        }

        while integerDigits.count > 1 && integerDigits.hasPrefix("0") {
            integerDigits.removeFirst()
        }

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

        return MaskResult(formatted: formatted, extracted: extracted, segments: segments, cursorPosition: formatted.count)
    }
}
