package expo.modules.safelymaskedinput

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SafelySeedPhraseInputModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SafelySeedPhraseInput")

        Function("focus") { viewTag: Int ->
            findView(viewTag)?.focusInput()
        }

        Function("blur") { viewTag: Int ->
            findView(viewTag)?.blurInput()
        }

        View(SafelySeedPhraseInputView::class) {
            Events("onChangeText", "onFocusChange")

            Prop("value") { view: SafelySeedPhraseInputView, value: String? ->
                view.setRawValue(value)
            }

            Prop("textColor") { view: SafelySeedPhraseInputView, color: String ->
                view.setTextColorValue(color)
            }

            Prop("fontSize") { view: SafelySeedPhraseInputView, size: Double ->
                view.setFontSizeValue(size.toFloat())
            }

            Prop("fontFamily") { view: SafelySeedPhraseInputView, family: String ->
                view.setFontFamilyValue(family)
            }

            Prop("placeholder") { view: SafelySeedPhraseInputView, placeholder: String ->
                view.setPlaceholderValue(placeholder)
            }

            Prop("placeholderTextColor") { view: SafelySeedPhraseInputView, color: String ->
                view.setPlaceholderTextColorValue(color)
            }

            Prop("autoFocus") { view: SafelySeedPhraseInputView, autoFocus: Boolean ->
                view.setAutoFocusValue(autoFocus)
            }

            Prop("editable") { view: SafelySeedPhraseInputView, editable: Boolean ->
                view.setEditableValue(editable)
            }
        }
    }

    private fun findView(viewTag: Int): SafelySeedPhraseInputView? {
        return appContext.findView<SafelySeedPhraseInputView>(viewTag)
    }
}
