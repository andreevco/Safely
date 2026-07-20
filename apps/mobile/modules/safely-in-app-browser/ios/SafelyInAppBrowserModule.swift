import ExpoModulesCore
import SafariServices

public class SafelyInAppBrowserModule: Module {
    private var pendingPromise: Promise?
    private var safariViewController: SFSafariViewController?
    private var finishDelegate: SafariFinishDelegate?

    struct OpenBrowserOptions: Record {
        @Field var toolbarColor: String?
        @Field var controlTintColor: String?
        @Field var dismissButtonStyle: String?
    }

    public func definition() -> ModuleDefinition {
        Name("SafelyInAppBrowser")

        Function("isAvailable") {
            return true
        }

        AsyncFunction("openBrowser") { (urlString: String, options: OpenBrowserOptions, promise: Promise) in
            guard let url = URL(string: urlString),
                  let scheme = url.scheme?.lowercased(),
                  scheme == "http" || scheme == "https" else {
                promise.reject("ERR_INVALID_URL", "openBrowser requires an http(s) URL")
                return
            }
            DispatchQueue.main.async { [weak self] in
                self?.present(url: url, options: options, promise: promise)
            }
        }
    }

    private func present(url: URL, options: OpenBrowserOptions, promise: Promise) {
        if pendingPromise != nil {
            promise.reject("ERR_IN_APP_BROWSER_ALREADY_OPEN", "An in-app browser session is already active")
            return
        }

        guard let presenter = Self.topmostViewController() else {
            promise.reject("ERR_NO_PRESENTER", "Could not find a view controller to present from")
            return
        }

        let config = SFSafariViewController.Configuration()
        config.barCollapsingEnabled = true

        let safariVC = SFSafariViewController(url: url, configuration: config)

        if let value = options.toolbarColor, let color = UIColor(colorString: value) {
            safariVC.preferredBarTintColor = color
        }
        if let value = options.controlTintColor, let color = UIColor(colorString: value) {
            safariVC.preferredControlTintColor = color
        }
        switch options.dismissButtonStyle {
        case "close": safariVC.dismissButtonStyle = .close
        case "cancel": safariVC.dismissButtonStyle = .cancel
        default: safariVC.dismissButtonStyle = .done
        }

        safariVC.modalPresentationStyle = .fullScreen
        safariVC.modalTransitionStyle = .crossDissolve

        let delegate = SafariFinishDelegate { [weak self] in
            self?.resolveAndCleanup()
        }
        safariVC.delegate = delegate
        // Done/Close button triggers safariViewControllerDidFinish, but an interactive
        // swipe-down dismissal of the sheet only triggers presentationControllerDidDismiss.
        // Listen to both so the session state is always cleaned up.
        safariVC.presentationController?.delegate = delegate

        pendingPromise = promise
        safariViewController = safariVC
        finishDelegate = delegate

        presenter.present(safariVC, animated: true, completion: nil)
    }

    private func resolveAndCleanup() {
        pendingPromise?.resolve(["type": "dismiss"])
        pendingPromise = nil
        safariViewController = nil
        finishDelegate = nil
    }

    private static func topmostViewController() -> UIViewController? {
        let keyWindow = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: { $0.isKeyWindow })

        var top = keyWindow?.rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }
}

final class SafariFinishDelegate: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
    private let onFinish: () -> Void

    init(onFinish: @escaping () -> Void) {
        self.onFinish = onFinish
    }

    func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
        onFinish()
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        onFinish()
    }
}

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
