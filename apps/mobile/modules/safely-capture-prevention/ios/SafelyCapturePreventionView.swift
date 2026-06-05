import ExpoModulesCore
import UIKit

class SafelyCapturePreventionView: ExpoView {
    let onUnsupported = EventDispatcher()

    private let secureField = UITextField()
    private let childrenContainer = UIView()
    private var isProtected = false

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        secureField.isSecureTextEntry = true
        secureField.isUserInteractionEnabled = false
        secureField.backgroundColor = .clear
        addSubview(secureField)
        addSubview(childrenContainer)
    }

    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
        childrenContainer.insertSubview(childComponentView, at: index)
    }

    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
        childComponentView.removeFromSuperview()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        enableProtectionIfNeeded()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        secureField.frame = bounds
        childrenContainer.frame = bounds
    }

    private func enableProtectionIfNeeded() {
        guard !isProtected, window != nil else { return }
        secureField.layoutIfNeeded()

        guard let secureLayer = findSecureLayer(in: secureField) else {
            onUnsupported()
            return
        }

        isProtected = true
        secureLayer.addSublayer(childrenContainer.layer)
    }

    private func findSecureLayer(in field: UITextField) -> CALayer? {
        field.subviews.first {
            String(describing: type(of: $0)).contains("CanvasView")
        }?.layer
    }
}
