import ExpoModulesCore
import UIKit

class SafelyMaskedInputView: ExpoView, UITextFieldDelegate {

    let onChangeText = EventDispatcher()
    let onFocusChange = EventDispatcher()

    private let textField = UITextField()
    private var isUpdatingFromCode = false
    private var rawValue = ""
    private var lastEmittedValue: String?

    // MARK: - Mask config

    private var decimals = 0
    private var decimalSeparator = "."

    // MARK: - Font config

    private var mainFontSize: CGFloat = 17
    private var mainFontWeight: UIFont.Weight = .regular
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

    // MARK: - Init

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        textField.delegate = self
        textField.borderStyle = .none
        textField.backgroundColor = .clear
        textField.addTarget(self, action: #selector(textFieldDidChange), for: .editingChanged)
        addSubview(textField)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        textField.frame = bounds
    }

    // MARK: - Prop setters

    func setDecimals(_ value: Int) {
        decimals = value
        applyMask()
    }

    func setDecimalSeparator(_ separator: String) {
        decimalSeparator = separator.isEmpty ? "." : separator
        applyMask()
    }

    func setRawValue(_ value: String?) {
        guard let value else { return }
        if let lastEmitted = lastEmittedValue, lastEmitted == value {
            lastEmittedValue = nil
            return
        }
        lastEmittedValue = nil
        rawValue = value
        applyMask()
    }

    func setFontSizeValue(_ size: CGFloat) {
        mainFontSize = size
        textField.font = resolvedMainFont()
        applyMask()
    }

    func setFontFamilyValue(_ family: String) {
        mainFontFamily = family
        textField.font = resolvedMainFont()
        applyMask()
    }

    func setFontWeightValue(_ weight: String) {
        mainFontWeight = weight == "bold" ? .bold : .regular
        textField.font = resolvedMainFont()
        applyMask()
    }

    func setTextColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        integerColor = color
        applyMask()
    }

    func setPlaceholderValue(_ placeholder: String) {
        textField.placeholder = placeholder
    }

    func setPlaceholderTextColorValue(_ value: String) {
        guard let color = UIColor(colorString: value), let placeholder = textField.placeholder else { return }
        textField.attributedPlaceholder = NSAttributedString(string: placeholder, attributes: [.foregroundColor: color])
    }

    func setKeyboardTypeValue(_ type: String) {
        switch type {
        case "numeric": textField.keyboardType = .numberPad
        case "decimal-pad": textField.keyboardType = .decimalPad
        default: textField.keyboardType = .default
        }
    }

    func setEditableValue(_ editable: Bool) {
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
        integerColor = color
        applyMask()
    }

    func setIntegerOpacityValue(_ opacity: Double) {
        integerOpacity = CGFloat(opacity)
        applyMask()
    }

    func setDecimalColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        decimalColor = color
        applyMask()
    }

    func setDecimalOpacityValue(_ opacity: Double) {
        decimalOpacity = CGFloat(opacity)
        applyMask()
    }

    func setPlaceholderDigitColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        placeholderDigitColor = color
        applyMask()
    }

    func setPlaceholderDigitOpacityValue(_ opacity: Double) {
        placeholderDigitOpacity = CGFloat(opacity)
        applyMask()
    }

    func setSuffixValue(_ value: String) {
        suffix = value
        applyMask()
    }

    func setSuffixColorValue(_ value: String) {
        guard let color = UIColor(colorString: value) else { return }
        suffixColor = color
        applyMask()
    }

    func setSuffixOpacityValue(_ opacity: Double) {
        suffixOpacity = CGFloat(opacity)
        applyMask()
    }

    func setSuffixFontSizeValue(_ size: CGFloat) {
        suffixFontSize = size
        applyMask()
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
            moveCursor(to: result.cursorPosition)
        }

        isUpdatingFromCode = false
    }

    private func moveCursor(to offset: Int) {
        let safeOffset = min(offset, (textField.text ?? "").count)
        guard let pos = textField.position(from: textField.beginningOfDocument, offset: safeOffset) else { return }
        textField.selectedTextRange = textField.textRange(from: pos, to: pos)
    }

    private func resolvedMainFont() -> UIFont {
        if let family = mainFontFamily, let font = UIFont(name: family, size: mainFontSize) {
            return font
        }
        return UIFont.systemFont(ofSize: mainFontSize, weight: mainFontWeight)
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
                string: "  " + suffix,
                attributes: [
                    .foregroundColor: suffixColor.withAlphaComponent(suffixOpacity),
                    .font: suffixFont,
                    .baselineOffset: 2.0,
                ]
            ))
        }

        return result
    }

    // MARK: - UITextField events

    @objc private func textFieldDidChange() {
        guard !isUpdatingFromCode else { return }

        let result = MaskEngine.apply(rawInput: textField.text ?? "", decimals: decimals, decimalSeparator: decimalSeparator)

        isUpdatingFromCode = true
        if result.segments.isEmpty {
            textField.attributedText = nil
            textField.text = nil
        } else {
            textField.attributedText = buildAttributedString(from: result.segments, withSuffix: true)
            moveCursor(to: result.cursorPosition)
        }
        isUpdatingFromCode = false

        rawValue = result.extracted
        lastEmittedValue = result.extracted
        onChangeText(["rawText": result.extracted, "formattedText": result.formatted])
    }

    // MARK: - UITextFieldDelegate

    func textFieldDidBeginEditing(_ textField: UITextField) {
        moveCursor(to: currentMaskResult.formatted.count)
        onFocusChange(["focused": true])
    }

    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        range.location <= currentMaskResult.formatted.count
    }

    func textFieldDidChangeSelection(_ textField: UITextField) {
        guard !suffix.isEmpty, !isUpdatingFromCode, let selectedRange = textField.selectedTextRange else { return }
        let maxPos = currentMaskResult.formatted.count
        let cursorPos = textField.offset(from: textField.beginningOfDocument, to: selectedRange.end)
        if cursorPos > maxPos {
            moveCursor(to: maxPos)
        }
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
