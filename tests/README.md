# Testing Guidelines

## Shell Command Tests

Some tests in this project involve executing shell commands via `shell_exec()` or similar functions. These tests are grouped with the `shell` tag to allow them to be run locally but excluded in CI environments where those commands might not be available.

### How it works

1. Tests that involve shell commands are marked with the `->group('shell')` annotation:

```php
test('executes a shell command', function () {
    // Your test with shell_exec()
})->group('shell');
```

2. In the GitHub CI workflow, these tests are excluded using the `--exclude-group shell` flag:

```yaml
- name: Tests
  run: ./vendor/bin/pest --exclude-group shell
```

### Running Tests Locally

To run all tests including shell tests:

```bash
./vendor/bin/pest
```

To exclude shell tests (like in CI):

```bash
./vendor/bin/pest --exclude-group shell
```

### Adding New Shell Tests

When creating new tests that use `shell_exec()`, `exec()`, `passthru()`, or similar functions, always add the `->group('shell')` annotation to ensure they're properly handled in CI environments.

Example:

```php
test('my new test with shell commands', function () {
    $result = shell_exec('some command');
    expect($result)->toContain('expected output');
})->group('shell');
