import ExpoModulesCore

struct ValueUpdate: Record {
    @Field var text: String? = nil
    @Field var eventCount: Int = 0
}

public class SafelyMaskedInputModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SafelyMaskedInput")

        Function("focus") { (viewTag: Int) in
            DispatchQueue.main.async { [weak self] in
                guard let view = self?.findView(viewTag) else { return }
                view.focusInput()
            }
        }

        Function("blur") { (viewTag: Int) in
            DispatchQueue.main.async { [weak self] in
                guard let view = self?.findView(viewTag) else { return }
                view.blurInput()
            }
        }

        Function("setText") { (viewTag: Int, text: String) in
            DispatchQueue.main.async { [weak self] in
                guard let view = self?.findView(viewTag) else { return }
                view.setRawValue(text)
            }
        }

        Function("setCursorPosition") { (viewTag: Int, position: Int) in
            DispatchQueue.main.async { [weak self] in
                guard let view = self?.findView(viewTag) else { return }
                view.setCursorPos(position)
            }
        }

        View(SafelyMaskedInputView.self) {
            Events("onChangeText", "onFocusChange", "onPaste")

            Prop("decimals") { (view: SafelyMaskedInputView, decimals: Int) in
                view.setDecimals(decimals)
            }

            Prop("decimalSeparator") { (view: SafelyMaskedInputView, separator: String) in
                view.setDecimalSeparator(separator)
            }

            Prop("value") { (view: SafelyMaskedInputView, update: ValueUpdate?) in
                guard let update else { return }
                view.setValueUpdate(update)
            }

            Prop("fontSize") { (view: SafelyMaskedInputView, size: Double) in
                view.setFontSizeValue(CGFloat(size))
            }

            Prop("fontFamily") { (view: SafelyMaskedInputView, family: String) in
                view.setFontFamilyValue(family)
            }

            Prop("textColor") { (view: SafelyMaskedInputView, color: String) in
                view.setTextColorValue(color)
            }

            Prop("placeholder") { (view: SafelyMaskedInputView, placeholder: String) in
                view.setPlaceholderValue(placeholder)
            }

            Prop("placeholderTextColor") { (view: SafelyMaskedInputView, color: String) in
                view.setPlaceholderTextColorValue(color)
            }

            Prop("keyboardType") { (view: SafelyMaskedInputView, type: String) in
                view.setKeyboardTypeValue(type)
            }

            Prop("editable") { (view: SafelyMaskedInputView, editable: Bool) in
                view.setEditableValue(editable)
            }

            Prop("autoFocus") { (view: SafelyMaskedInputView, autoFocus: Bool) in
                view.setAutoFocusValue(autoFocus)
            }

            Prop("integerColor") { (view: SafelyMaskedInputView, color: String) in
                view.setIntegerColorValue(color)
            }

            Prop("integerOpacity") { (view: SafelyMaskedInputView, opacity: Double) in
                view.setIntegerOpacityValue(opacity)
            }

            Prop("decimalColor") { (view: SafelyMaskedInputView, color: String) in
                view.setDecimalColorValue(color)
            }

            Prop("decimalOpacity") { (view: SafelyMaskedInputView, opacity: Double) in
                view.setDecimalOpacityValue(opacity)
            }

            Prop("placeholderDigitColor") { (view: SafelyMaskedInputView, color: String) in
                view.setPlaceholderDigitColorValue(color)
            }

            Prop("placeholderDigitOpacity") { (view: SafelyMaskedInputView, opacity: Double) in
                view.setPlaceholderDigitOpacityValue(opacity)
            }

            Prop("suffix") { (view: SafelyMaskedInputView, value: String) in
                view.setSuffixValue(value)
            }

            Prop("suffixColor") { (view: SafelyMaskedInputView, color: String) in
                view.setSuffixColorValue(color)
            }

            Prop("suffixOpacity") { (view: SafelyMaskedInputView, opacity: Double) in
                view.setSuffixOpacityValue(opacity)
            }

            Prop("suffixFontSize") { (view: SafelyMaskedInputView, size: Double) in
                view.setSuffixFontSizeValue(CGFloat(size))
            }
        }
    }

    private func findView(_ viewTag: Int) -> SafelyMaskedInputView? {
        guard let appContext = appContext else { return nil }
        return appContext.findView(withTag: viewTag, ofType: SafelyMaskedInputView.self)
    }
}
