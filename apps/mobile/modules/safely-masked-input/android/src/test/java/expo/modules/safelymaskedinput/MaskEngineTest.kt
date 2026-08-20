package expo.modules.safelymaskedinput

import org.junit.Assert.assertEquals
import org.junit.Test

class MaskEngineTest {

    private fun mask(input: String, decimals: Int = 8, separator: String = "."): MaskResult =
        MaskEngine.apply(input, decimals, separator)

    @Test
    fun `keeps digits and drops everything unrecognized`() {
        assertEquals("123", mask("123").extracted)
        assertEquals("123", mask("1a2b3c").extracted)
        assertEquals("123", mask("1 2 3").extracted)
        assertEquals("", mask("").extracted)
        assertEquals("", mask("abc").extracted)
    }

    @Test
    fun `strips leading zeros but keeps a single one`() {
        assertEquals("0", mask("0").extracted)
        assertEquals("7", mask("007").extracted)
        assertEquals("0.5", mask("00.5").extracted)
        assertEquals("100", mask("0100").extracted)
    }

    @Test
    fun `prepends a zero when the value starts with a separator`() {
        assertEquals("0.", mask(".").extracted)
        assertEquals("0.5", mask(".5").extracted)
    }

    @Test
    fun `clamps the fraction to the allowed decimals`() {
        assertEquals("1.23", mask("1.2345", decimals = 2).extracted)
        assertEquals("1.2345", mask("1.2345", decimals = 8).extracted)
        assertEquals("1.", mask("1.", decimals = 8).extracted)
    }

    @Test
    fun `ignores separators when no decimals are allowed`() {
        assertEquals("122", mask("1.22", decimals = 0).extracted)
        assertEquals("122", mask("1,22", decimals = 0).extracted)
    }

    @Test
    fun `accepts both common separators and emits the configured one`() {
        assertEquals("1.5", mask("1,5", separator = ".").extracted)
        assertEquals("1.5", mask("1.5", separator = ".").extracted)
        assertEquals("1,5", mask("1.5", separator = ",").extracted)
        assertEquals("1,5", mask("1,5", separator = ",").extracted)
    }

    @Test
    fun `accepts a locale separator outside the common pair`() {
        assertEquals("1٫5", mask("1٫5", separator = "٫").extracted)
        assertEquals("1٫5", mask("1.5", separator = "٫").extracted)
    }

    @Test
    fun `ignores a repeated separator`() {
        assertEquals("1.23", mask("1.2.3").extracted)
        assertEquals("1,23", mask("1,2,3", separator = ",").extracted)
    }

    @Test
    fun `clears the value when two different separators conflict`() {
        assertEquals("", mask("1,234.56").extracted)
        assertEquals("", mask("1.234,56").extracted)
        assertEquals("", mask("1,234.56", separator = ",").extracted)
    }

    @Test
    fun `formats for display with the configured separator`() {
        assertEquals("1.5", mask("1,5").formatted)
        assertEquals("1,5", mask("1.5", separator = ",").formatted)
        assertEquals("", mask("1,234.56").formatted)
    }

    @Test
    fun `splits the formatted value into styled segments`() {
        val result = mask("12.34")

        assertEquals(
            listOf(
                StyledSegment("12", SegmentCategory.INTEGER),
                StyledSegment(".", SegmentCategory.SEPARATOR),
                StyledSegment("34", SegmentCategory.DECIMAL)
            ),
            result.segments
        )
        assertEquals(emptyList<StyledSegment>(), mask("1,234.56").segments)
    }

    @Test
    fun `points the cursor at the end of the formatted value`() {
        assertEquals(5, mask("12.34").cursorPosition)
        assertEquals(0, mask("1,234.56").cursorPosition)
    }
}
