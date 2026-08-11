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

struct MappedChar {
    let rawIndex: Int
    let formattedEnd: Int
}

struct MaskResult {
    let formatted: String
    let extracted: String
    let segments: [StyledSegment]
    let mapping: [MappedChar]
}

extension MaskResult {
    func cursorPosition(forRawCursor rawCursor: Int) -> Int {
        var position = 0
        for entry in mapping {
            guard entry.rawIndex < rawCursor else { break }
            position = entry.formattedEnd
        }
        return min(position, formatted.count)
    }
}

class MaskEngine {

    private static let decimalSeparators: Set<Character> = [".", ","]

    private static let ambiguous = MaskResult(formatted: "", extracted: "", segments: [], mapping: [])

    static func apply(rawInput: String, decimals: Int, decimalSeparator: String) -> MaskResult {
        let sep = decimalSeparator.isEmpty ? "." : decimalSeparator

        var integerEntries: [(rawIndex: Int, char: Character)] = []
        var decimalEntries: [(rawIndex: Int, char: Character)] = []
        var separatorRawIndex: Int?
        var separatorChar: Character?

        for (rawIndex, ch) in rawInput.enumerated() {
            if ch.isNumber {
                if separatorChar != nil {
                    if decimalEntries.count < decimals {
                        decimalEntries.append((rawIndex, ch))
                    }
                } else {
                    integerEntries.append((rawIndex, ch))
                }
            } else if decimalSeparators.contains(ch) && decimals > 0 {
                if separatorChar == nil {
                    separatorChar = ch
                    separatorRawIndex = rawIndex
                } else if ch != separatorChar {
                    return ambiguous
                }
            }
        }

        let hasDecimal = separatorChar != nil

        while integerEntries.count > 1 && integerEntries.first?.char == "0" {
            integerEntries.removeFirst()
        }

        let prependSynthetic = hasDecimal && integerEntries.isEmpty

        var formatted = ""
        var mapping: [MappedChar] = []
        var segments: [StyledSegment] = []
        var integerText = ""
        var decimalText = ""

        if prependSynthetic {
            formatted += "0"
            integerText = "0"
        }

        for entry in integerEntries {
            formatted.append(entry.char)
            integerText.append(entry.char)
            mapping.append(MappedChar(rawIndex: entry.rawIndex, formattedEnd: formatted.count))
        }
        if !integerText.isEmpty {
            segments.append(StyledSegment(text: integerText, category: .integer))
        }

        if hasDecimal {
            formatted += sep
            segments.append(StyledSegment(text: sep, category: .separator))
            if let sepRawIndex = separatorRawIndex {
                mapping.append(MappedChar(rawIndex: sepRawIndex, formattedEnd: formatted.count))
            }

            for entry in decimalEntries {
                formatted.append(entry.char)
                decimalText.append(entry.char)
                mapping.append(MappedChar(rawIndex: entry.rawIndex, formattedEnd: formatted.count))
            }
            if !decimalText.isEmpty {
                segments.append(StyledSegment(text: decimalText, category: .decimal))
            }
        }

        var extracted = integerText
        if hasDecimal {
            extracted += sep + decimalText
        }

        return MaskResult(formatted: formatted, extracted: extracted, segments: segments, mapping: mapping)
    }
}
