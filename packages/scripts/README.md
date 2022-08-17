# Scripts for Remap

## `install-codecov`

Installs Codecov uploader by downloading the binary and verifying it. This is
only used in CI.

```sh
# in CI
pnpm exec install-codecov
```

## `is-pnpm`

Check if the current script is running through `pnpm`. This way, `PATH` is
populated with the binary files from dependencies.

```js
import isPnpm from '@esdmr/scripts/is-pnpm';
```

## `upload-coverage`

Uploads coverage reports with a flag to Codecov. This is
only used in CI.

```sh
# in CI
pnpm exec upload-coverage
```
