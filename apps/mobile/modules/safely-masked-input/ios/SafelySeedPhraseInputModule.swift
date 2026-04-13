import ExpoModulesCore

public class SafelySeedPhraseInputModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SafelySeedPhraseInput")

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

        View(SafelySeedPhraseInputView.self) {
            Events("onChangeText", "onFocusChange")

            Prop("value") { (view: SafelySeedPhraseInputView, value: String?) in
                view.setRawValue(value)
            }

            Prop("textColor") { (view: SafelySeedPhraseInputView, color: String) in
                view.setTextColorValue(color)
            }

            Prop("fontSize") { (view: SafelySeedPhraseInputView, size: Double) in
                view.setFontSizeValue(CGFloat(size))
            }

            Prop("fontFamily") { (view: SafelySeedPhraseInputView, family: String) in
                view.setFontFamilyValue(family)
            }

            Prop("placeholder") { (view: SafelySeedPhraseInputView, placeholder: String) in
                view.setPlaceholderValue(placeholder)
            }

            Prop("placeholderTextColor") { (view: SafelySeedPhraseInputView, color: String) in
                view.setPlaceholderTextColorValue(color)
            }

            Prop("autoFocus") { (view: SafelySeedPhraseInputView, autoFocus: Bool) in
                view.setAutoFocusValue(autoFocus)
            }

            Prop("editable") { (view: SafelySeedPhraseInputView, editable: Bool) in
                view.setEditableValue(editable)
            }
        }
    }

    private func findView(_ viewTag: Int) -> SafelySeedPhraseInputView? {
        guard let appContext = appContext else { return nil }
        return appContext.findView(withTag: viewTag, ofType: SafelySeedPhraseInputView.self)
    }
}
