package expo.modules.safelymaskedinput

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.TextWatcher
import android.util.TypedValue
import android.view.Gravity
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.widget.AppCompatEditText
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class SafelySeedPhraseInputView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    private val editText = AppCompatEditText(context).apply {
        background = null
        gravity = Gravity.TOP or Gravity.START
        setPadding(0, 0, 0, 0)
        inputType = InputType.TYPE_CLASS_TEXT or
                InputType.TYPE_TEXT_FLAG_MULTI_LINE or
                InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        isSingleLine = false
        maxLines = Int.MAX_VALUE
    }

    private var lastEmittedValue: String? = null
    private var isUpdating = false

    val onChangeText by EventDispatcher()
    val onFocusChange by EventDispatcher()

    init {
        addView(editText)

        // Strip newlines and collapse multiple spaces before insertion — fires before rendering, zero flicker
        editText.filters = arrayOf(InputFilter { source, start, end, _, _, _ ->
            val text = source.subSequence(start, end).toString()
            val cleaned = text.replace(Regex("[\r\n]+"), " ").replace(Regex(" {2,}"), " ")
            if (cleaned == text) null else cleaned
        })

        editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                if (isUpdating) return
                val text = s?.toString() ?: ""

                // Collapse boundary double-spaces the filter couldn't catch
                if (text.contains("  ")) {
                    val cleaned = text.replace(Regex(" {2,}"), " ")
                    val cursorPos = editText.selectionStart
                    val cleanedBefore = text.take(cursorPos).replace(Regex(" {2,}"), " ")
                    isUpdating = true
                    editText.setText(cleaned)
                    editText.setSelection(cleanedBefore.length.coerceIn(0, cleaned.length))
                    isUpdating = false
                    lastEmittedValue = cleaned
                    onChangeText(mapOf("text" to cleaned))
                    return
                }

                lastEmittedValue = text
                onChangeText(mapOf("text" to text))
            }
        })

        editText.setOnFocusChangeListener { _, hasFocus ->
            onFocusChange(mapOf("focused" to hasFocus))
        }
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        editText.layout(0, 0, right - left, bottom - top)
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        editText.measure(widthMeasureSpec, heightMeasureSpec)
    }

    // MARK: - Prop setters

    fun setRawValue(value: String?) {
        value ?: return
        if (lastEmittedValue != null && lastEmittedValue == value) { lastEmittedValue = null; return }
        lastEmittedValue = null
        isUpdating = true
        editText.setText(value)
        editText.setSelection(value.length)
        isUpdating = false
    }

    fun setTextColorValue(hex: String) {
        tryParseColor(hex) { editText.setTextColor(it) }
    }

    fun setFontSizeValue(size: Float) {
        editText.setTextSize(TypedValue.COMPLEX_UNIT_SP, size)
    }

    fun setFontFamilyValue(family: String) {
        try { editText.typeface = Typeface.create(family, editText.typeface?.style ?: Typeface.NORMAL) } catch (_: Exception) {}
    }

    fun setPlaceholderValue(placeholder: String) {
        editText.hint = placeholder
    }

    fun setPlaceholderTextColorValue(hex: String) {
        tryParseColor(hex) { editText.setHintTextColor(it) }
    }

    fun setAutoFocusValue(autoFocus: Boolean) {
        if (!autoFocus) return
        post { editText.requestFocus(); showKeyboard() }
    }

    fun setEditableValue(editable: Boolean) {
        editText.isEnabled = editable
        editText.isFocusable = editable
        editText.isFocusableInTouchMode = editable
    }

    // MARK: - Imperative commands

    fun focusInput() { post { editText.requestFocus(); showKeyboard() } }
    fun blurInput() { post { editText.clearFocus(); hideKeyboard() } }

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

    private inline fun tryParseColor(value: String, action: (Int) -> Unit) {
        try {
            val s = value.trim()
            action(Color.parseColor(if (s.startsWith("#")) s else "#$s"))
        } catch (_: Exception) {}
    }
}
