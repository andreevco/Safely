// Posts the build & e2e report to Slack.
//
// Run by the `report` job in apps/mobile/.eas/workflows/build-and-distribute.yml.
// All inputs arrive via env vars (EAS interpolates job statuses, build outputs
// and workflow inputs).
//
// Requires Node 18+ (global fetch). No external deps on purpose.
//
// The Slack webhook is a Slack Workflow Builder trigger
// (https://hooks.slack.com/triggers/...), which consumes a FLAT JSON whose keys
// must match the variables defined in that Slack workflow. This script sends:
//   text              — message body (overall status + iOS/Android version+build)
//   eas_workflow_url  — link to this EAS workflow run
//   github_pr_url     — link to the merged release -> master PR (empty if none)
//   e2e_log           — Maestro result; on failure a link to the full log artifact
// Configure those four variables in your Slack workflow trigger.

let {
    SLACK_WEBHOOK_URL,
    WORKFLOW_URL,
    PR_NUMBER,
    REPOSITORY,
    RELEASE_NOTES,
    TARGET_BRANCH,
    IOS_VERSION,
    IOS_BUILD,
    ANDROID_VERSION,
    ANDROID_BUILD,
    STATUS_IOS,
    STATUS_IOS_CRUTCH,
    STATUS_ANDROID,
    STATUS_E2E
} = process.env;


// EAS job statuses: success | failure | error | skipped | canceled | (empty when not run)
const iosOk = STATUS_IOS === 'success' || STATUS_IOS_CRUTCH === 'success';
const firebaseOk = STATUS_ANDROID === 'success';
const e2eOk = STATUS_E2E === 'success';

const ver = (v, b) => `v${v || '?'} (${b || '?'})`;

const buildsOk = iosOk && firebaseOk;
// "tests" in the headline = e2e.
const testsOk = e2eOk;
const headline = buildsOk
    ? testsOk
        ? '✅ successful build and tests'
        : '❌ successful build; tests failed'
    : testsOk
        ? '❌ failed build; successful tests'
        : '❌ failed build and tests';

const notes = (RELEASE_NOTES || '').trim();
const targetBranch = (TARGET_BRANCH || '').trim();
const notesWithBranch = targetBranch ? `${targetBranch} <- ${notes}` : notes;

// In case of a direct push, use stub url to avoid slack button rendering errors
const prUrl = PR_NUMBER !== undefined && REPOSITORY ? `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}` : 'https://safely.app/';
const workflowUrl = WORKFLOW_URL || '';

function buildText() {
    const lines = [
        headline,
        iosOk ? `📱 iOS · ${ver(IOS_VERSION, IOS_BUILD)}` : '📱 iOS build failed ❌',
        firebaseOk ? `🤖 Android · ${ver(ANDROID_VERSION, ANDROID_BUILD)}` : '🤖 Android build failed ❌',
    ];

    if (!e2eOk) {
        lines.push('🧪 E2E failed ❌');
        lines.push('Full log is in the "Maestro Test Results" artifact on the EAS run page.');
    }

    return lines.join('\n');
}

async function postSlack() {
    // Must be a real URL — guards against an unresolved `${{ env.* }}` literal slipping through.
    if (!/^https:\/\//.test(SLACK_WEBHOOK_URL || '')) {
        console.log(
            `[report] SLACK_WEBHOOK_URL missing or not a URL — skipping Slack (got ${SLACK_WEBHOOK_URL ? 'a non-URL value' : 'empty'}).`
        );
        return;
    }

    const payload = {
        text: buildText(),
        eas_workflow_url: workflowUrl,
        github_pr_url: prUrl,
        notes: notesWithBranch.slice(0, 1000)
    };

    const res = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error(`[report] Slack failed: ${res.status} ${await res.text()}`);
    } else {
        console.log('[report] Slack message posted.');
        console.log(JSON.stringify(payload, null, 2));
    }
}

// Don't let a reporting hiccup fail the workflow.
await Promise.allSettled([postSlack()]);
