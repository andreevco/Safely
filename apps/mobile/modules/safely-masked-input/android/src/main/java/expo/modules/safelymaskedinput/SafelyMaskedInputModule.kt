package expo.modules.safelymaskedinput

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ValueUpdate : Record {
    @Field
    var text: String? = null

    @Field
    var eventCount: Int = 0
}

class SafelyMaskedInputModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SafelyMaskedInput")

        Function("focus") { viewTag: Int ->
            findView(viewTag)?.focusInput()
        }

        Function("blur") { viewTag: Int ->
            findView(viewTag)?.blurInput()
        }

        Function("setText") { viewTag: Int, text: String ->
            findView(viewTag)?.setRawValue(text)
        }

        Function("setCursorPosition") { viewTag: Int, position: Int ->
            findView(viewTag)?.setCursorPos(position)
        }

        View(SafelyMaskedInputView::class) {
            Events("onChangeText", "onFocusChange", "onPaste")

            Prop("decimals") { view: SafelyMaskedInputView, decimals: Int ->
                view.setDecimals(decimals)
            }

            Prop("decimalSeparator") { view: SafelyMaskedInputView, separator: String ->
                view.setDecimalSeparator(separator)
            }

            Prop("value") { view: SafelyMaskedInputView, update: ValueUpdate? ->
                update?.let { view.setValueUpdate(it) }
            }

            Prop("fontSize") { view: SafelyMaskedInputView, size: Double ->
                view.setFontSizeValue(size.toFloat())
            }

            Prop("fontFamily") { view: SafelyMaskedInputView, family: String ->
                view.setFontFamilyValue(family)
            }

            Prop("textColor") { view: SafelyMaskedInputView, color: String ->
                view.setTextColorValue(color)
            }

            Prop("placeholder") { view: SafelyMaskedInputView, placeholder: String ->
                view.setPlaceholderValue(placeholder)
            }

            Prop("placeholderTextColor") { view: SafelyMaskedInputView, color: String ->
                view.setPlaceholderTextColorValue(color)
            }

            Prop("keyboardType") { view: SafelyMaskedInputView, type: String ->
                view.setKeyboardTypeValue(type)
            }

            Prop("editable") { view: SafelyMaskedInputView, editable: Boolean ->
                view.setEditableValue(editable)
            }

            Prop("autoFocus") { view: SafelyMaskedInputView, autoFocus: Boolean ->
                view.setAutoFocusValue(autoFocus)
            }

            Prop("integerColor") { view: SafelyMaskedInputView, color: String ->
                view.setIntegerColorValue(color)
            }

            Prop("integerOpacity") { view: SafelyMaskedInputView, opacity: Double ->
                view.setIntegerOpacityValue(opacity)
            }

            Prop("decimalColor") { view: SafelyMaskedInputView, color: String ->
                view.setDecimalColorValue(color)
            }

            Prop("decimalOpacity") { view: SafelyMaskedInputView, opacity: Double ->
                view.setDecimalOpacityValue(opacity)
            }

            Prop("placeholderDigitColor") { view: SafelyMaskedInputView, color: String ->
                view.setPlaceholderDigitColorValue(color)
            }

            Prop("placeholderDigitOpacity") { view: SafelyMaskedInputView, opacity: Double ->
                view.setPlaceholderDigitOpacityValue(opacity)
            }

            Prop("suffix") { view: SafelyMaskedInputView, value: String ->
                view.setSuffixValue(value)
            }

            Prop("suffixColor") { view: SafelyMaskedInputView, color: String ->
                view.setSuffixColorValue(color)
            }

            Prop("suffixOpacity") { view: SafelyMaskedInputView, opacity: Double ->
                view.setSuffixOpacityValue(opacity)
            }

            Prop("suffixFontSize") { view: SafelyMaskedInputView, size: Double ->
                view.setSuffixFontSizeValue(size.toFloat())
            }
        }
    }

    private fun findView(viewTag: Int): SafelyMaskedInputView? {
        return appContext.findView<SafelyMaskedInputView>(viewTag)
    }
}
