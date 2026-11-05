"""
Grouped, fixed-width results: a header per test file (or per parametrized test),
then one `name : RESULT` line per test. Disabled under -v, which uses pytest's own format.
"""

import pytest

LINE_WIDTH = 80
INDENT = '  '
SEPARATOR = ' : '

LABELS = {
    'passed': ('PASS', {'green': True}),
    'failed': ('FAIL', {'red': True, 'bold': True}),
    'error': ('ERROR', {'red': True, 'bold': True}),
    'skipped': ('SKIPPED', {'yellow': True}),
    'xfailed': ('KNOWN BUG', {'yellow': True}),
    'xpassed': ('BUG FIXED, REMOVE MARK', {'red': True, 'bold': True}),
}
LABEL_WIDTH = max(len(label) for label, _ in LABELS.values())
NAME_WIDTH = LINE_WIDTH - len(INDENT) - len(SEPARATOR) - LABEL_WIDTH


def fit(text, width):
    return text if len(text) <= width else text[:width - 1] + '…'


def split_nodeid(nodeid):
    path, _, test = nodeid.partition('::')
    module = path.rsplit('/', 1)[-1].removesuffix('.py').removeprefix('test_')
    func, _, param = test.partition('[')
    func = func.removeprefix('test_')
    if param:
        return f'{module} :: {func}', param.removesuffix(']')
    return module, func


def is_strict_xpass(report):
    return report.failed and isinstance(report.longrepr, str) and report.longrepr.startswith('[XPASS(strict)]')


def outcome(report):
    if is_strict_xpass(report):
        return 'xpassed'
    if hasattr(report, 'wasxfail'):
        return 'xfailed' if report.skipped else 'xpassed'
    if report.when != 'call' and report.failed:
        return 'error'
    return report.outcome


def should_report(report):
    if report.when == 'call':
        return True
    if report.when == 'setup':
        return not report.passed
    return report.failed


class ResultLines:
    def __init__(self, reporter):
        self.reporter = reporter
        self.group = None

    @pytest.hookimpl(wrapper=True)
    def pytest_report_teststatus(self, report, config):
        category, _, word = yield
        return category, '', word

    def pytest_runtest_logreport(self, report):
        if not should_report(report):
            return
        group, name = split_nodeid(report.nodeid)
        if group != self.group:
            self.group = group
            self.reporter.write_line(fit(group, LINE_WIDTH), bold=True)
        label, markup = LABELS[outcome(report)]
        self.reporter.write(f'{INDENT}{fit(name, NAME_WIDTH):<{NAME_WIDTH}}{SEPARATOR}')
        self.reporter.write(f'{label:>{LABEL_WIDTH}}', **markup)
        self.reporter.line('')


@pytest.hookimpl(trylast=True)
def pytest_configure(config):
    reporter = config.pluginmanager.get_plugin('terminalreporter')
    if reporter is None or config.getoption('verbose') > 0:
        return
    reporter.showfspath = False
    config.pluginmanager.register(ResultLines(reporter), 'result-lines')
