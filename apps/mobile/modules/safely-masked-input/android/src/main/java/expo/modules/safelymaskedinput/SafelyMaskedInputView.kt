package expo.modules.safelymaskedinput

import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextPaint
import android.text.TextWatcher
import android.text.style.AbsoluteSizeSpan
import android.text.style.ForegroundColorSpan
import android.text.style.MetricAffectingSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputConnectionWrapper
import android.view.inputmethod.InputMethodManager
import android.view.inputmethod.TextAttribute
import androidx.annotation.RequiresApi
import androidx.appcompat.widget.AppCompatEditText
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

private class MaskedEditText(context: Context) : AppCompatEditText(context) {
    var onSelectionChangedListener: ((Int, Int) -> Unit)? = null
    var onPasteListener: ((String) -> Unit)? = null

    override fun onSelectionChanged(selStart: Int, selEnd: Int) {
        super.onSelectionChanged(selStart, selEnd)
        onSelectionChangedListener?.invoke(selStart, selEnd)
    }

    override fun onTextContextMenuItem(id: Int): Boolean {
        if (id != android.R.id.paste && id != android.R.id.pasteAsPlainText) {
            return super.onTextContextMenuItem(id)
        }

        clipboardText()?.let { onPasteListener?.invoke(it) }
        return true
    }

    override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
        val connection = super.onCreateInputConnection(outAttrs) ?: return null

        return object : InputConnectionWrapper(connection, false) {
            override fun commitText(text: CharSequence?, newCursorPosition: Int): Boolean {
                if (interceptAsPaste(text)) return true
                return super.commitText(text, newCursorPosition)
            }

            @RequiresApi(Build.VERSION_CODES.TIRAMISU)
            override fun commitText(
                text: CharSequence,
                newCursorPosition: Int,
                textAttribute: TextAttribute?
            ): Boolean {
                if (interceptAsPaste(text)) return true
                return super.commitText(text, newCursorPosition, textAttribute)
            }
        }
    }

    private fun interceptAsPaste(text: CharSequence?): Boolean {
        if (!isNumericInput) return false

        val committed = text?.toString()?.takeIf { it.length > 1 } ?: return false

        onPasteListener?.invoke(committed)
        return true
    }

    private val isNumericInput: Boolean
        get() = inputType and InputType.TYPE_MASK_CLASS == InputType.TYPE_CLASS_NUMBER

    private fun clipboardText(): String? {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        val item = clipboard?.primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)
        return item?.coerceToText(context)?.toString()?.takeIf { it.isNotEmpty() }
    }
}

private class NormalTypefaceSpan : MetricAffectingSpan() {
    private val typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
    override fun updateDrawState(tp: TextPaint) { tp.typeface = typeface }
    override fun updateMeasureState(tp: TextPaint) { tp.typeface = typeface }
}

class SafelyMaskedInputView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    private val editText = MaskedEditText(context).apply {
        background = null
        gravity = Gravity.CENTER_VERTICAL
        setPadding(0, 0, 0, 0)
    }

    private var rawValue = ""
    private var lastEmittedValue: String? = null
    private var isUpdating = false
    private var pendingPaste = false

    val onPaste by EventDispatcher()
    val onChangeText by EventDispatcher()
    val onFocusChange by EventDispatcher()

    // MARK: - Config

    private var decimals = 0
    private var decimalSeparator = "."
    private var integerColor = Color.WHITE
    private var integerOpacity = 1.0f
    private var decimalColor: Int? = null
    private var decimalOpacity = 1.0f
    private var suffix = ""
    private var suffixColor = Color.GRAY
    private var suffixOpacity = 1.0f
    private var suffixFontSize = 0f
    private var placeholderText: String = ""
    private var placeholderColor: Int = Color.GRAY

    // MARK: - Init

    init {
        addView(editText)

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (!isUpdating) pendingPaste = count > 1
            }
            override fun afterTextChanged(s: Editable?) {
                if (isUpdating) return
                val text = stripSuffix(s?.toString() ?: "")
                if (pendingPaste) {
                    pendingPaste = false
                    onPaste(mapOf("raw" to text))
                    applyMask()
                    return
                }
                val result = MaskEngine.apply(text, decimals, decimalSeparator)
                updateDisplay(result)
                rawValue = result.extracted
                lastEmittedValue = result.extracted
                onChangeText(mapOf("rawText" to result.extracted, "formattedText" to result.formatted))
            }
        })

        editText.filters = arrayOf(suffixInputFilter())

        editText.onSelectionChangedListener = { selStart, selEnd ->
            if (!isUpdating && suffix.isNotEmpty()) {
                val maxPos = maxEditablePosition()
                if (maxPos >= 0 && selEnd > maxPos) {
                    val clampedStart = selStart.coerceAtMost(maxPos)
                    editText.setSelection(clampedStart, maxPos)
                }
            }
        }

        editText.onPasteListener = { pasted -> handlePaste(pasted) }

        editText.setOnFocusChangeListener { _, hasFocus ->
            onFocusChange(mapOf("focused" to hasFocus))
        }
    }

    private fun handlePaste(pasted: String) {
        val current = stripSuffix(editText.text?.toString() ?: "")
        val start = editText.selectionStart.coerceIn(0, current.length)
        val end = editText.selectionEnd.coerceIn(start, current.length)

        onPaste(mapOf("raw" to current.substring(0, start) + pasted + current.substring(end)))
        applyMask()
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        val width = right - left
        val height = bottom - top
        editText.layout(0, 0, width, height)
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        editText.measure(widthMeasureSpec, heightMeasureSpec)
    }

    // MARK: - Prop setters

    fun setDecimals(value: Int) { decimals = value; applyMask() }
    fun setDecimalSeparator(separator: String) { decimalSeparator = separator.ifEmpty { "." }; applyMask() }

    fun setRawValue(value: String?) {
        value ?: return
        if (lastEmittedValue != null && lastEmittedValue == value) { lastEmittedValue = null; return }
        lastEmittedValue = null
        rawValue = value
        applyMask()
    }

    fun setFontSizeValue(size: Float) { editText.setTextSize(TypedValue.COMPLEX_UNIT_SP, size); applyPlaceholder() }
    fun setFontFamilyValue(family: String) {
        try { editText.typeface = Typeface.create(family, editText.typeface?.style ?: Typeface.NORMAL) } catch (_: Exception) {}
        applyPlaceholder()
    }
    fun setTextColorValue(hex: String) { tryParseColor(hex) { integerColor = it; applyMask() } }
    fun setPlaceholderValue(placeholder: String) { placeholderText = placeholder; applyPlaceholder() }
    fun setPlaceholderTextColorValue(hex: String) { tryParseColor(hex) { placeholderColor = it; editText.setHintTextColor(it); applyPlaceholder() } }
    fun setKeyboardTypeValue(type: String) {
        editText.setRawInputType(
            when (type) {
                "numeric" -> EditorInfo.TYPE_CLASS_NUMBER
                "decimal-pad" -> EditorInfo.TYPE_CLASS_NUMBER or EditorInfo.TYPE_NUMBER_FLAG_DECIMAL
                else -> EditorInfo.TYPE_CLASS_TEXT
            }
        )
    }
    fun setEditableValue(editable: Boolean) {
        editText.isEnabled = editable
        editText.isFocusable = editable
        editText.isFocusableInTouchMode = editable
    }
    fun setAutoFocusValue(autoFocus: Boolean) {
        if (!autoFocus) return
        post { editText.requestFocus(); showKeyboard() }
    }
    fun setIntegerColorValue(hex: String) { tryParseColor(hex) { integerColor = it; applyMask() } }
    fun setIntegerOpacityValue(opacity: Double) { integerOpacity = opacity.toFloat(); applyMask() }
    fun setDecimalColorValue(hex: String) { tryParseColor(hex) { decimalColor = it; applyMask() } }
    fun setDecimalOpacityValue(opacity: Double) { decimalOpacity = opacity.toFloat(); applyMask() }
    fun setPlaceholderDigitColorValue(hex: String) {}
    fun setPlaceholderDigitOpacityValue(opacity: Double) {}
    fun setSuffixValue(value: String) { suffix = value; applyMask(); applyPlaceholder() }
    fun setSuffixColorValue(hex: String) { tryParseColor(hex) { suffixColor = it; applyMask(); applyPlaceholder() } }
    fun setSuffixOpacityValue(opacity: Double) { suffixOpacity = opacity.toFloat(); applyMask(); applyPlaceholder() }
    fun setSuffixFontSizeValue(size: Float) { suffixFontSize = size; applyMask(); applyPlaceholder() }

    // MARK: - Imperative commands

    fun focusInput() { post { editText.requestFocus(); showKeyboard() } }
    fun blurInput() { post { editText.clearFocus(); hideKeyboard() } }
    fun setCursorPos(position: Int) {
        val maxPos = maxEditablePosition().coerceAtLeast(0)
        editText.setSelection(position.coerceIn(0, maxPos))
    }

    // MARK: - Display

    private fun applyMask() {
        updateDisplay(MaskEngine.apply(rawValue, decimals, decimalSeparator))
    }

    private fun applyPlaceholder() {
        if (placeholderText.isEmpty()) {
            editText.hint = null
            return
        }

        val builder = SpannableStringBuilder()
        builder.append(placeholderText)
        builder.setSpan(ForegroundColorSpan(placeholderColor), 0, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        if (suffix.isNotEmpty()) {
            val start = builder.length
            builder.append(" $suffix")
            builder.setSpan(ForegroundColorSpan(colorWithOpacity(suffixColor, suffixOpacity)), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            builder.setSpan(NormalTypefaceSpan(), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            val size = if (suffixFontSize > 0) suffixFontSize else editText.textSize / resources.displayMetrics.scaledDensity
            builder.setSpan(AbsoluteSizeSpan(size.toInt(), true), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }

        editText.hint = builder
    }

    private fun updateDisplay(result: MaskResult) {
        val spannable = buildSpannable(result.segments)
        val newText = spannable.toString()
        val currentText = editText.text?.toString() ?: ""

        isUpdating = true
        if (newText != currentText) {
            editText.setText(spannable)
            if (result.segments.isNotEmpty()) {
                val cursorPos = result.cursorPosition.coerceIn(0, result.formatted.length)
                editText.setSelection(cursorPos)
            }
        } else {
            reapplySpans(spannable)
        }
        isUpdating = false
    }

    private fun reapplySpans(source: SpannableStringBuilder) {
        val editable = editText.text ?: return
        for (span in editable.getSpans(0, editable.length, Any::class.java)) {
            if (span is ForegroundColorSpan || span is AbsoluteSizeSpan || span is MetricAffectingSpan) {
                editable.removeSpan(span)
            }
        }
        for (span in source.getSpans(0, source.length, Any::class.java)) {
            val start = source.getSpanStart(span)
            val end = source.getSpanEnd(span)
            val flags = source.getSpanFlags(span)
            if (start in 0..editable.length && end in 0..editable.length) {
                editable.setSpan(span, start, end, flags)
            }
        }
    }

    private fun buildSpannable(segments: List<StyledSegment>): SpannableStringBuilder {
        val builder = SpannableStringBuilder()

        for (segment in segments) {
            val start = builder.length
            builder.append(segment.text)
            val (color, opacity) = when (segment.category) {
                SegmentCategory.INTEGER, SegmentCategory.SEPARATOR -> integerColor to integerOpacity
                SegmentCategory.DECIMAL -> (decimalColor ?: integerColor) to decimalOpacity
            }
            builder.setSpan(ForegroundColorSpan(colorWithOpacity(color, opacity)), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }

        if (suffix.isNotEmpty() && segments.isNotEmpty()) {
            val start = builder.length
            builder.append(" $suffix")
            builder.setSpan(ForegroundColorSpan(colorWithOpacity(suffixColor, suffixOpacity)), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            builder.setSpan(NormalTypefaceSpan(), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            val size = if (suffixFontSize > 0) suffixFontSize else editText.textSize / resources.displayMetrics.scaledDensity
            builder.setSpan(AbsoluteSizeSpan(size.toInt(), true), start, builder.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }

        return builder
    }

    // MARK: - Suffix helpers

    private fun suffixDisplayLength(): Int = if (suffix.isEmpty()) 0 else suffix.length + 1

    private fun maxEditablePosition(): Int {
        val textLen = editText.text?.length ?: 0
        return textLen - suffixDisplayLength()
    }

    private fun stripSuffix(text: String): String {
        if (suffix.isEmpty()) return text
        val suffixPart = " $suffix"
        return if (text.endsWith(suffixPart)) text.dropLast(suffixPart.length) else text
    }

    private fun suffixInputFilter() = InputFilter { source, _, _, dest, dstart, _ ->
        if (suffix.isEmpty()) return@InputFilter null
        val maxPos = dest.length - suffixDisplayLength()
        if (maxPos >= 0 && dstart > maxPos) "" else null
    }

    // MARK: - Keyboard helpers

    private fun showKeyboard() {
        (context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)
            ?.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun hideKeyboard() {
        (context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)
            ?.hideSoftInputFromWindow(editText.windowToken, 0)
    }

    // MARK: - Color helpers

    private fun colorWithOpacity(color: Int, opacity: Float): Int {
        val alpha = (opacity * 255).toInt().coerceIn(0, 255)
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
    }

    private inline fun tryParseColor(value: String, action: (Int) -> Unit) {
        try { action(parseColor(value)) } catch (_: Exception) {}
    }

    private fun parseColor(value: String): Int {
        val s = value.trim()
        return Color.parseColor(if (s.startsWith("#")) s else "#$s")
    }
}
