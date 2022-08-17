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

## `partial`

Run scripts and `pnpm` in partial mode. In certain circumstances, we do not need
to run a script on every package, but only on the changed ones. Additionally, we
need to build the dependencies and test the dependents as well. With `partial`
you can specify any [filter] to be used with `pnpm` only in partial mode, such
as `--filter '[origin/main]...'`.

[filter]: https://pnpm.io/filtering

```sh
# Usage: pnpm exec partial <command> "[" <partial-only args...> "]" <normal args...>
pnpm exec partial run [ --filter '...[origin/main]' ] test
```

## `upload-coverage`

Uploads coverage reports with a flag to Codecov. This is
only used in CI.

```sh
# in CI
pnpm exec upload-coverage
```
