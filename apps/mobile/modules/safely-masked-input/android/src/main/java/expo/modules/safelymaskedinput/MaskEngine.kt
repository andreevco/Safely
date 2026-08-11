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

    private const val DECIMAL_SEPARATORS = ".,"

    private val AMBIGUOUS = MaskResult("", "", emptyList(), 0)

    fun apply(rawInput: String, decimals: Int, decimalSeparator: String): MaskResult {
        val sep = decimalSeparator.ifEmpty { "." }

        val integerDigits = StringBuilder()
        val decimalDigits = StringBuilder()
        var separatorChar: Char? = null

        for (ch in rawInput) {
            when {
                ch.isDigit() -> {
                    if (separatorChar != null) {
                        if (decimalDigits.length < decimals) decimalDigits.append(ch)
                    } else {
                        integerDigits.append(ch)
                    }
                }
                ch in DECIMAL_SEPARATORS && decimals > 0 -> {
                    if (separatorChar == null) {
                        separatorChar = ch
                    } else if (ch != separatorChar) {
                        return AMBIGUOUS
                    }
                }
            }
        }

        val hasDecimal = separatorChar != null

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
