import ExpoModulesCore
import UIKit

class SafelySeedPhraseInputView: ExpoView, UITextViewDelegate {

    let onChangeText = EventDispatcher()
    let onFocusChange = EventDispatcher()

    private let textView = UITextView()
    private let placeholderLabel = UILabel()
    private var isUpdatingFromCode = false
    private var lastEmittedValue: String?

    private var mainFontSize: CGFloat = 17
    private var mainFontFamily: String?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupTextView()
        setupPlaceholder()
    }

    private func setupTextView() {
        textView.delegate = self
        textView.backgroundColor = .clear
        textView.textContainerInset = .zero
        textView.textContainer.lineFragmentPadding = 0
        textView.autocapitalizationType = .none
        textView.autocorrectionType = .no
        textView.spellCheckingType = .no
        textView.font = resolvedFont()
        addSubview(textView)
    }

    private func setupPlaceholder() {
        placeholderLabel.numberOfLines = 0
        placeholderLabel.isUserInteractionEnabled = false
        placeholderLabel.font = resolvedFont()
        addSubview(placeholderLabel)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        textView.frame = bounds
        let labelHeight = placeholderLabel.sizeThatFits(
            CGSize(width: bounds.width, height: .greatestFiniteMagnitude)
        ).height
        placeholderLabel.frame = CGRect(x: 0, y: 0, width: bounds.width, height: labelHeight)
    }

    // MARK: - Prop setters

    func setRawValue(_ value: String?) {
        guard let value else { return }
        if let lastEmitted = lastEmittedValue, lastEmitted == value {
            lastEmittedValue = nil
            return
        }
        lastEmittedValue = nil
        isUpdatingFromCode = true
        textView.text = value
        updatePlaceholderVisibility()
        isUpdatingFromCode = false
    }

    func setTextColorValue(_ hex: String) {
        guard let color = UIColor(colorString: hex) else { return }
        textView.textColor = color
    }

    func setFontSizeValue(_ size: CGFloat) {
        mainFontSize = size
        textView.font = resolvedFont()
        placeholderLabel.font = resolvedFont()
    }

    func setFontFamilyValue(_ family: String) {
        mainFontFamily = family
        textView.font = resolvedFont()
        placeholderLabel.font = resolvedFont()
    }

    func setPlaceholderValue(_ text: String) {
        placeholderLabel.text = text
        updatePlaceholderVisibility()
    }

    func setPlaceholderTextColorValue(_ hex: String) {
        guard let color = UIColor(colorString: hex) else { return }
        placeholderLabel.textColor = color
    }

    func setEditableValue(_ editable: Bool) {
        textView.isEditable = editable
    }

    func setAutoFocusValue(_ autoFocus: Bool) {
        guard autoFocus else { return }
        DispatchQueue.main.async { [weak self] in
            self?.textView.becomeFirstResponder()
        }
    }

    // MARK: - Imperative commands

    func focusInput() {
        DispatchQueue.main.async { [weak self] in
            self?.textView.becomeFirstResponder()
        }
    }

    func blurInput() {
        DispatchQueue.main.async { [weak self] in
            self?.textView.resignFirstResponder()
        }
    }

    private func resolvedFont() -> UIFont {
        if let family = mainFontFamily, let font = UIFont(name: family, size: mainFontSize) {
            return font
        }
        return UIFont.systemFont(ofSize: mainFontSize)
    }

    private func updatePlaceholderVisibility() {
        placeholderLabel.isHidden = !(textView.text?.isEmpty ?? true)
    }

    // MARK: - UITextViewDelegate

    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        guard !isUpdatingFromCode else { return true }

        let cleaned = text
            .replacingOccurrences(of: "[\r\n]+", with: " ", options: .regularExpression)
            .replacingOccurrences(of: " {2,}", with: " ", options: .regularExpression)
        guard cleaned != text else { return true }

        let current = textView.text ?? ""
        guard let swiftRange = Range(range, in: current) else { return false }
        let newText = current.replacingCharacters(in: swiftRange, with: cleaned)

        isUpdatingFromCode = true
        textView.text = newText
        let offset = current.distance(from: current.startIndex, to: swiftRange.lowerBound) + cleaned.count
        if let pos = textView.position(from: textView.beginningOfDocument, offset: offset) {
            textView.selectedTextRange = textView.textRange(from: pos, to: pos)
        }
        isUpdatingFromCode = false

        updatePlaceholderVisibility()
        lastEmittedValue = newText
        onChangeText(["text": newText])
        return false
    }

    func textViewDidChange(_ textView: UITextView) {
        guard !isUpdatingFromCode else { return }
        var text = textView.text ?? ""

        if text.range(of: "  ", options: .literal) != nil {
            let selectedRange = textView.selectedRange
            let cleaned = text.replacingOccurrences(of: " {2,}", with: " ", options: .regularExpression)
            let beforeCursor = String(text.prefix(selectedRange.location))
            let cleanedBeforeCursor = beforeCursor.replacingOccurrences(of: " {2,}", with: " ", options: .regularExpression)
            isUpdatingFromCode = true
            textView.text = cleaned
            textView.selectedRange = NSRange(location: cleanedBeforeCursor.count, length: 0)
            isUpdatingFromCode = false
            text = cleaned
        }

        updatePlaceholderVisibility()
        lastEmittedValue = text
        onChangeText(["text": text])
    }

    func textViewDidBeginEditing(_ textView: UITextView) {
        onFocusChange(["focused": true])
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        onFocusChange(["focused": false])
    }
}
