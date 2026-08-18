import ExpoModulesCore
import UIKit

private class InsetCaretTextField: UITextField {
    override func caretRect(for position: UITextPosition) -> CGRect {
        var rect = super.caretRect(for: position)
        let inset: CGFloat = 4
        rect.origin.y += inset
        rect.size.height = max(rect.size.height - inset * 2, 0)
        return rect
    }
}

class SafelyMaskedInputView: ExpoView, UITextFieldDelegate {

    let onPaste = EventDispatcher()
    let onChangeText = EventDispatcher()
    let onFocusChange = EventDispatcher()

    private let textField = InsetCaretTextField()
    private var isUpdatingFromCode = false
    private var rawValue = ""
    private var userEditCount = 0

    // MARK: - Mask config

    private var decimals = 0
    private var decimalSeparator = "."

    // MARK: - Font config

    private var mainFontSize: CGFloat = 17
    private var mainFontWeight: UIFont.Weight = .semibold
    private var mainFontFamily: String?

    // MARK: - Segment colors

    private var integerColor: UIColor = .label
    private var integerOpacity: CGFloat = 1.0
    private var decimalColor: UIColor = .label
    private var decimalOpacity: CGFloat = 1.0
    private var placeholderDigitColor: UIColor = .placeholderText
    private var placeholderDigitOpacity: CGFloat = 0.5

    // MARK: - Suffix config

    private var suffix = ""
    private var suffixColor: UIColor = .secondaryLabel
    private var suffixOpacity: CGFloat = 1.0
    private var suffixFontSize: CGFloat = 0

    // MARK: - Placeholder

    private var placeholderText: String = ""
    private var placeholderColor: UIColor = .placeholderText

    // MARK: - Init

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        textField.delegate = self
        textField.borderStyle = .none
        textField.backgroundColor = .clear
        addSubview(textField)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        textField.frame = bounds
    }

    // MARK: - Prop setters

    func setDecimals(_ value: Int) {
        guard decimals != value else { return }
        decimals = value
        applyMask()
    }

    func setDecimalSeparator(_ separator: String) {
        let newSeparator = separator.isEmpty ? "." : separator
        guard decimalSeparator != newSeparator else { return }
        decimalSeparator = newSeparator
        applyMask()
    }

    func setValueUpdate(_ update: ValueUpdate) {
        guard update.eventCount >= userEditCount else { return }
        setRawValue(update.text)
    }

    func setRawValue(_ value: String?) {
        guard let value, value != rawValue else { return }
        rawValue = value
        applyMask()
    }

    func setFontSizeValue(_ size: CGFloat) {
        guard mainFontSize != size else { return }
        mainFontSize = size
        textField.font = resolvedMainFont()
        applyMask()
        applyPlaceholder()
    }

    func setFontFamilyValue(_ family: String) {
        guard mainFontFamily != family else { return }
        mainFontFamily = family
        textField.font = resolvedMainFont()
        applyMask()
        applyPlaceholder()
    }

    func setFontWeightValue(_ weight: String) {
        let newWeight = Self.fontWeight(from: weight)
        guard mainFontWeight != newWeight else { return }
        mainFontWeight = newWeight
        textField.font = resolvedMainFont()
        applyMask()
        applyPlaceholder()
    }

    private static func fontWeight(from value: String) -> UIFont.Weight {
        switch value {
        case "100", "ultraLight": return .ultraLight
        case "200", "thin": return .thin
        case "300", "light": return .light
        case "400", "regular", "normal": return .regular
        case "500", "medium": return .medium
        case "600", "semibold": return .semibold
        case "700", "bold": return .bold
        case "800", "heavy": return .heavy
        case "900", "black": return .black
        default: return .semibold
        }
    }

    func setTextColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        guard integerColor != color else { return }
        integerColor = color
        applyMask()
    }

    func setPlaceholderValue(_ placeholder: String) {
        guard placeholderText != placeholder else { return }
        placeholderText = placeholder
        applyPlaceholder()
    }

    func setPlaceholderTextColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        guard placeholderColor != color else { return }
        placeholderColor = color
        applyPlaceholder()
    }

    func setKeyboardTypeValue(_ type: String) {
        switch type {
        case "numeric": textField.keyboardType = .numberPad
        case "decimal-pad": textField.keyboardType = .decimalPad
        default: textField.keyboardType = .default
        }
    }

    func setEditableValue(_ editable: Bool) {
        guard textField.isEnabled != editable else { return }
        textField.isEnabled = editable
    }

    func setAutoFocusValue(_ autoFocus: Bool) {
        guard autoFocus else { return }
        DispatchQueue.main.async { [weak self] in
            self?.textField.becomeFirstResponder()
        }
    }

    func setIntegerColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        guard integerColor != color else { return }
        integerColor = color
        applyMask()
    }

    func setIntegerOpacityValue(_ opacity: Double) {
        let newOpacity = CGFloat(opacity)
        guard integerOpacity != newOpacity else { return }
        integerOpacity = newOpacity
        applyMask()
    }

    func setDecimalColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        guard decimalColor != color else { return }
        decimalColor = color
        applyMask()
    }

    func setDecimalOpacityValue(_ opacity: Double) {
        let newOpacity = CGFloat(opacity)
        guard decimalOpacity != newOpacity else { return }
        decimalOpacity = newOpacity
        applyMask()
    }

    func setPlaceholderDigitColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        guard placeholderDigitColor != color else { return }
        placeholderDigitColor = color
        applyMask()
    }

    func setPlaceholderDigitOpacityValue(_ opacity: Double) {
        let newOpacity = CGFloat(opacity)
        guard placeholderDigitOpacity != newOpacity else { return }
        placeholderDigitOpacity = newOpacity
        applyMask()
    }

    func setSuffixValue(_ value: String) {
        guard suffix != value else { return }
        suffix = value
        applyMask()
        applyPlaceholder()
    }

    func setSuffixColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        guard suffixColor != color else { return }
        suffixColor = color
        applyMask()
        applyPlaceholder()
    }

    func setSuffixOpacityValue(_ opacity: Double) {
        let newOpacity = CGFloat(opacity)
        guard suffixOpacity != newOpacity else { return }
        suffixOpacity = newOpacity
        applyMask()
        applyPlaceholder()
    }

    func setSuffixFontSizeValue(_ size: CGFloat) {
        guard suffixFontSize != size else { return }
        suffixFontSize = size
        applyMask()
        applyPlaceholder()
    }

    // MARK: - Imperative commands

    func focusInput() {
        DispatchQueue.main.async { [weak self] in
            self?.textField.becomeFirstResponder()
        }
    }

    func blurInput() {
        DispatchQueue.main.async { [weak self] in
            self?.textField.resignFirstResponder()
        }
    }

    func setCursorPos(_ position: Int) {
        let maxPos = (textField.text ?? "").count
        let safePos = min(max(position, 0), maxPos)
        guard let pos = textField.position(from: textField.beginningOfDocument, offset: safePos) else { return }
        textField.selectedTextRange = textField.textRange(from: pos, to: pos)
    }

    // MARK: - Mask application

    private var currentMaskResult: MaskResult {
        MaskEngine.apply(rawInput: rawValue, decimals: decimals, decimalSeparator: decimalSeparator)
    }

    private func applyMask() {
        isUpdatingFromCode = true
        let result = currentMaskResult

        if result.segments.isEmpty {
            textField.attributedText = nil
            textField.text = nil
        } else {
            textField.attributedText = buildAttributedString(from: result.segments, withSuffix: true)
            moveCursor(to: result.formatted.count)
        }

        isUpdatingFromCode = false
    }

    private func moveCursor(to offset: Int) {
        selectRange(from: offset, to: offset)
    }

    private func selectRange(from start: Int, to end: Int) {
        let length = (textField.text ?? "").count
        let safeEnd = min(end, length)
        let safeStart = min(start, safeEnd)
        guard let startPos = textField.position(from: textField.beginningOfDocument, offset: safeStart),
              let endPos = textField.position(from: textField.beginningOfDocument, offset: safeEnd) else { return }
        textField.selectedTextRange = textField.textRange(from: startPos, to: endPos)
    }

    private func resolvedMainFont() -> UIFont {
        if let family = mainFontFamily, let font = UIFont(name: family, size: mainFontSize) {
            return font
        }
        return UIFont.systemFont(ofSize: mainFontSize, weight: mainFontWeight)
    }

    private func applyPlaceholder() {
        guard !placeholderText.isEmpty else {
            textField.attributedPlaceholder = nil
            textField.placeholder = nil
            return
        }

        let result = NSMutableAttributedString(
            string: placeholderText,
            attributes: [.foregroundColor: placeholderColor, .font: resolvedMainFont()]
        )

        if !suffix.isEmpty {
            let size = suffixFontSize > 0 ? suffixFontSize : resolvedMainFont().pointSize
            let suffixFont = UIFont.systemFont(ofSize: size, weight: .regular)
            result.append(NSAttributedString(
                string: " " + suffix,
                attributes: [
                    .foregroundColor: suffixColor.withAlphaComponent(suffixOpacity),
                    .font: suffixFont
                ]
            ))
        }

        textField.attributedPlaceholder = result
    }

    private func buildAttributedString(from segments: [StyledSegment], withSuffix: Bool) -> NSAttributedString {
        let result = NSMutableAttributedString()
        let font = resolvedMainFont()

        for segment in segments {
            let (color, opacity): (UIColor, CGFloat) = switch segment.category {
            case .integer, .separator: (integerColor, integerOpacity)
            case .decimal: (decimalColor, decimalOpacity)
            }

            result.append(NSAttributedString(
                string: segment.text,
                attributes: [.foregroundColor: color.withAlphaComponent(opacity), .font: font]
            ))
        }

        if withSuffix && !suffix.isEmpty {
            let size = suffixFontSize > 0 ? suffixFontSize : font.pointSize
            let suffixFont = UIFont.systemFont(ofSize: size, weight: .regular)
            result.append(NSAttributedString(
                string: " " + suffix,
                attributes: [
                    .foregroundColor: suffixColor.withAlphaComponent(suffixOpacity),
                    .font: suffixFont
                ]
            ))
        }

        return result
    }

    private func stripSuffix(from text: String) -> String {
        guard !suffix.isEmpty else { return text }
        let suffixText = " " + suffix
        return text.hasSuffix(suffixText) ? String(text.dropLast(suffixText.count)) : text
    }

    private func applyUserMaskResult(_ result: MaskResult, cursorPosition: Int) {
        isUpdatingFromCode = true
        if result.segments.isEmpty {
            textField.attributedText = nil
            textField.text = nil
        } else {
            textField.attributedText = buildAttributedString(from: result.segments, withSuffix: true)
            moveCursor(to: cursorPosition)
        }
        isUpdatingFromCode = false

        rawValue = result.extracted
        userEditCount += 1
        onChangeText([
            "rawText": result.extracted,
            "formattedText": result.formatted,
            "eventCount": userEditCount
        ])
    }

    // MARK: - UITextFieldDelegate

    func textFieldDidBeginEditing(_ textField: UITextField) {
        moveCursor(to: currentMaskResult.formatted.count)
        onFocusChange(["focused": true])
    }

    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        guard !isUpdatingFromCode else { return false }

        let currentEditableText = stripSuffix(from: textField.text ?? "")
        let editableCount = currentEditableText.count
        guard range.location <= editableCount else { return false }

        let replacedLength = min(range.length, max(editableCount - range.location, 0))
        let start = currentEditableText.index(currentEditableText.startIndex, offsetBy: range.location)
        let end = currentEditableText.index(start, offsetBy: replacedLength)
        let nextRawInput = currentEditableText.replacingCharacters(in: start..<end, with: string)
        let rawCursorPosition = range.location + string.count

        if string.count > 1 {
            onPaste(["raw": nextRawInput])
            return false
        }

        let result = MaskEngine.apply(
            rawInput: nextRawInput,
            decimals: decimals,
            decimalSeparator: decimalSeparator
        )
        let cursorPosition = result.cursorPosition(forRawCursor: rawCursorPosition)

        applyUserMaskResult(result, cursorPosition: cursorPosition)
        return false
    }

    func textFieldDidChangeSelection(_ textField: UITextField) {
        guard !suffix.isEmpty, !isUpdatingFromCode, let selectedRange = textField.selectedTextRange else { return }
        let maxPos = currentMaskResult.formatted.count
        let end = textField.offset(from: textField.beginningOfDocument, to: selectedRange.end)
        guard end > maxPos else { return }

        let start = textField.offset(from: textField.beginningOfDocument, to: selectedRange.start)
        selectRange(from: min(start, maxPos), to: maxPos)
    }

    func textFieldDidEndEditing(_ textField: UITextField) {
        onFocusChange(["focused": false])
    }
}

// MARK: - UIColor hex parsing

extension UIColor {
    convenience init?(colorString: String) {
        var hex = colorString.trimmingCharacters(in: .whitespacesAndNewlines)
        if hex.hasPrefix("#") { hex = String(hex.dropFirst()) }

        var rgb: UInt64 = 0
        guard Scanner(string: hex).scanHexInt64(&rgb) else { return nil }

        switch hex.count {
        case 6:
            self.init(red: CGFloat((rgb >> 16) & 0xFF) / 255, green: CGFloat((rgb >> 8) & 0xFF) / 255, blue: CGFloat(rgb & 0xFF) / 255, alpha: 1)
        case 8:
            self.init(red: CGFloat((rgb >> 24) & 0xFF) / 255, green: CGFloat((rgb >> 16) & 0xFF) / 255, blue: CGFloat((rgb >> 8) & 0xFF) / 255, alpha: CGFloat(rgb & 0xFF) / 255)
        default:
            return nil
        }
    }
}
