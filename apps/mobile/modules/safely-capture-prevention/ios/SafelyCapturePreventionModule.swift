import ExpoModulesCore

public class SafelyCapturePreventionModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SafelyCapturePrevention")

        View(SafelyCapturePreventionView.self) {
            Events("onUnsupported")
        }
    }
}
