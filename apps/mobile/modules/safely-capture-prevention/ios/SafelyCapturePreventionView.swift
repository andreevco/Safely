import ExpoModulesCore
import UIKit

class SafelyCapturePreventionView: ExpoView {
    let onUnsupported = EventDispatcher()

    private let secureField = UITextField()
    private let childrenContainer = UIView()
    private weak var secureCanvas: UIView?
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
        secureCanvas?.frame = bounds
        childrenContainer.frame = bounds
    }

    private func enableProtectionIfNeeded() {
        guard !isProtected, window != nil else { return }
        secureField.layoutIfNeeded()

        guard let canvas = findSecureCanvas(in: secureField) else {
            onUnsupported()
            return
        }

        isProtected = true
        canvas.isUserInteractionEnabled = true
        canvas.frame = bounds
        addSubview(canvas)
        canvas.addSubview(childrenContainer)
        secureCanvas = canvas
    }

    private func findSecureCanvas(in field: UITextField) -> UIView? {
        field.subviews.first(where: {
            String(describing: type(of: $0)).contains("CanvasView")
        })
    }
}
