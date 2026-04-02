package expo.modules.safelymaskedinput

enum class SegmentCategory {
    INTEGER, DECIMAL, SEPARATOR
}

data class StyledSegment(val text: String, val category: SegmentCategory)

data class MaskResult(
    val formatted: String,
    val extracted: String,
    val segments: List<StyledSegment>,
    val cursorPosition: Int
)

object MaskEngine {

    fun apply(rawInput: String, decimals: Int, decimalSeparator: String): MaskResult {
        val sep = decimalSeparator.ifEmpty { "." }

        val integerDigits = StringBuilder()
        val decimalDigits = StringBuilder()
        var hasDecimal = false

        for (ch in rawInput) {
            when {
                ch.isDigit() -> {
                    if (hasDecimal) {
                        if (decimalDigits.length < decimals) decimalDigits.append(ch)
                    } else {
                        integerDigits.append(ch)
                    }
                }
                ch.toString() == sep && !hasDecimal && decimals > 0 -> hasDecimal = true
            }
        }

        var intStr = integerDigits.toString()
        while (intStr.length > 1 && intStr.startsWith("0")) {
            intStr = intStr.substring(1)
        }
        if (hasDecimal && intStr.isEmpty()) intStr = "0"

        val decStr = decimalDigits.toString()
        val formatted = StringBuilder()
        val segments = mutableListOf<StyledSegment>()

        if (intStr.isNotEmpty()) {
            formatted.append(intStr)
            segments.add(StyledSegment(intStr, SegmentCategory.INTEGER))
        }

        if (hasDecimal) {
            formatted.append(sep)
            segments.add(StyledSegment(sep, SegmentCategory.SEPARATOR))
            if (decStr.isNotEmpty()) {
                formatted.append(decStr)
                segments.add(StyledSegment(decStr, SegmentCategory.DECIMAL))
            }
        }

        var extracted = intStr
        if (hasDecimal) extracted += sep + decStr

        return MaskResult(formatted.toString(), extracted, segments, formatted.length)
    }
}
